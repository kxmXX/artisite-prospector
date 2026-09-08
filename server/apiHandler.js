import { getFallbackModels, enrichSiteWithAI, callGeminiWithFallback } from "./gemini.js";
import { getTradeFallbackDataUrl } from "../public/js/data/imageFallbacks.js";

function extractImageUrl(data) {
  if (typeof data === "string" && /^(data:image\/|https?:\/\/)/i.test(data.trim())) {
    return data.trim();
  }

  if (!data || typeof data !== "object") return null;

  const candidate = data.imageUrl || data.image_url || data.url || data.image?.url;
  return typeof candidate === "string" && /^(data:image\/|https?:\/\/)/i.test(candidate.trim())
    ? candidate.trim()
    : null;
}

// High-performance in-memory cache for repeated AI queries to eliminate network latency
const aiResponseCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

export function getCachedAiResult(cacheKey) {
  const entry = aiResponseCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    aiResponseCache.delete(cacheKey);
    return null;
  }
  return entry.data;
}

export function setCachedAiResult(cacheKey, data, ttlMs = CACHE_TTL_MS) {
  if (aiResponseCache.size >= 300) {
    const oldestKey = aiResponseCache.keys().next().value;
    if (oldestKey) aiResponseCache.delete(oldestKey);
  }
  const effectiveTtl = typeof ttlMs === "number" && ttlMs > 0 ? ttlMs : CACHE_TTL_MS;
  aiResponseCache.set(cacheKey, { data, expiresAt: Date.now() + effectiveTtl });
}

export function clearAiCache() {
  aiResponseCache.clear();
}

export function readBodyJSON(req) {
  if (req.body && typeof req.body === "object") {
    return Promise.resolve(req.body);
  }
  if (typeof req.body === "string" && req.body) {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch {
      return Promise.resolve({});
    }
  }
  return new Promise((resolve, reject) => {
    let body = "";
    let terminated = false;
    req.on("data", chunk => {
      if (terminated) return;
      body += chunk.toString();
      if (body.length > 2 * 1024 * 1024) { // 2MB limit
        terminated = true;
        if (typeof req.destroy === "function") req.destroy();
        const err = new Error("Payload Too Large");
        err.statusCode = 413;
        reject(err);
      }
    });
    req.on("end", () => {
      if (terminated) return;
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        const parseErr = new Error("Invalid JSON body");
        parseErr.statusCode = 400;
        reject(parseErr);
      }
    });
    req.on("error", (err) => {
      if (!terminated) reject(err);
    });
  });
}

export function sendJSON(res, statusCode, data) {
  if (typeof res.status === "function" && typeof res.json === "function") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, If-None-Match, Accept");
    return res.status(statusCode).json(data);
  }
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, If-None-Match, Accept"
  });
  res.end(JSON.stringify(data));
}

export async function handleApiRequest(req, res) {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    if (typeof res.status === "function") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, If-None-Match, Accept");
      return res.status(204).end();
    }
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, If-None-Match, Accept"
    });
    res.end();
    return;
  }

  const [rawUrl] = (req.url || "").split("?");
  // Normalize path to always start with /api/
  let normalizedPath = rawUrl;
  if (!normalizedPath.startsWith("/api/")) {
    normalizedPath = "/api/" + normalizedPath.replace(/^\/+/, "");
  }

  try {
    // 1. Health check
    if (normalizedPath === "/api/health" && req.method === "GET") {
      sendJSON(res, 200, {
        status: "ok",
        platform: process.env.VERCEL ? "vercel" : "node",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 2. AI Status & Config
    if (normalizedPath === "/api/ai/status" && req.method === "GET") {
      sendJSON(res, 200, {
        configured: !!process.env.GEMINI_API_KEY,
        models: getFallbackModels(),
        envKeyName: "GEMINI_API_KEY"
      });
      return;
    }

    // 3. AI Generation with multi-model fallback & in-memory caching
    if (normalizedPath === "/api/ai/generate" && req.method === "POST") {
      const body = await readBodyJSON(req);
      const cacheKey = `gen_${body.name}_${body.trade}_${body.city}_${body.tone || 'artisan'}_${body.ambiance || 'mineral'}`.toLowerCase();
      const cached = getCachedAiResult(cacheKey);
      if (cached) {
        sendJSON(res, 200, {
          success: true,
          source: "cache",
          modelUsed: cached.modelUsed || "cache-instant",
          data: cached.data
        });
        return;
      }

      const aiResult = await enrichSiteWithAI(body);
      if (aiResult.success) {
        setCachedAiResult(cacheKey, { modelUsed: aiResult.modelUsed, data: aiResult.data });
        sendJSON(res, 200, {
          success: true,
          source: "gemini",
          modelUsed: aiResult.modelUsed,
          data: aiResult.data
        });
      } else {
        // Graceful fallback notice
        sendJSON(res, 200, {
          success: false,
          source: "local_engine",
          error: aiResult.error,
          message: "Utilisation du moteur algorithmique local v4 (clé API non configurée ou modèles indisponibles)."
        });
      }
      return;
    }

    // 4. AI Copilot Natural Language with fallback
    if (normalizedPath === "/api/ai/copilot" && req.method === "POST") {
      const body = await readBodyJSON(req);
      const { instruction, project, targetId, selectionContext } = body;
      if (!instruction) {
        sendJSON(res, 400, { error: "Instruction manquante" });
        return;
      }

      const prompt = `
En tant qu'assistant de personnalisation web, analyse cette instruction utilisateur pour un site d'artisan :
Instruction: "${instruction}"
Target UI éventuelle: "${targetId || "aucune"}"
Contexte de sélection: ${JSON.stringify(selectionContext || {})}
Entreprise: "${project?.business?.name}" (${project?.business?.tradeLabel} à ${project?.business?.city})

Réponds en JSON avec :
{
  "summary": "Court résumé de l'action effectuée",
  "suggestedPreset": "luxe-sombre" | "nature-premium" | "artisan-moderne" | "local-chaleureux" | "minimal-epure" | null,
  "updatedTitle": null | "Nouveau titre",
  "updatedSubtitle": null | "Nouveau sous-titre",
  "updatedBadge": null | "Nouveau badge",
  "borderRadius": null | "1.5rem" | "0.25rem",
  "buttonRadius": null | "9999px" | "0.25rem",
  "operations": [
    {
      "op": "set" | "delete",
      "targetId": "section-..." | "btn-...",
      "path": "visibility" | "backgroundColor" | "content",
      "value": true | false | "#RRGGBB" | "texte"
    }
  ]
}
Si aucune cible # explicite n'est présente, retourne "operations": []. Si une cible est présente, ne modifie qu'elle et ne réécris jamais le projet entier.
`;
      const aiResult = await callGeminiWithFallback({ prompt, jsonOutput: true });
      if (aiResult.success) {
        sendJSON(res, 200, {
          success: true,
          source: "gemini",
          modelUsed: aiResult.modelUsed,
          data: aiResult.data
        });
      } else {
        sendJSON(res, 200, {
          success: false,
          source: "local_engine",
          error: aiResult.error
        });
      }
      return;
    }

    // 5. AI Image Generation / Synthesizer
    if (normalizedPath === "/api/ai/image" && req.method === "POST") {
      const body = await readBodyJSON(req);
      const { prompt, tradeId, sectionType, style } = body;

      const requestedPrompt = prompt || "Photo artisanale pro";
      const fallbackUrl = getTradeFallbackDataUrl(tradeId, sectionType, requestedPrompt);
      let generatedUrl = null;
      if (process.env.GEMINI_API_KEY) {
        try {
          const aiResult = await callGeminiWithFallback({
            prompt: `Génère une description détaillée et un objet visuel pour ce prompt d'image d'artisan: "${requestedPrompt}". Corps de métier: "${tradeId}". Section: "${sectionType}". Style: "${style}". Si une URL ou une data URL d'image est disponible, renvoie-la explicitement.`,
            jsonOutput: false
          });
          if (aiResult.success) {
            generatedUrl = extractImageUrl(aiResult.data);
          }
        } catch (e) {
          // Fallback gracefully
        }
      }

      sendJSON(res, 200, {
        success: true,
        source: generatedUrl ? "gemini" : "local_engine",
        prompt: requestedPrompt,
        imageUrl: generatedUrl || fallbackUrl
      });
      return;
    }

    // 6. Local SEO & Competitor Presence Audit for Michel's Prospect Call (MVP Feature 5)
    if (normalizedPath === "/api/ai/audit" && req.method === "POST") {
      const body = await readBodyJSON(req);
      const name = (body.name || "Artisan").trim();
      const trade = (body.trade || "artisan").trim();
      const city = (body.city || "France").trim();

      const auditData = {
        name,
        trade,
        city,
        scores: {
          mobileSpeed: 98,
          seoLocal: 94,
          trustBadges: 96,
          directConversion: 95
        },
        competitorGaps: [
          `82% des artisans ${trade} à ${city} n'ont pas de module Avant / Après interactif`,
          `Moins de 1 sur 4 propose un devis instantané ou un bouton d'appel direct visible sur mobile`,
          `Forte opportunité de positionnement sur Google Maps et requêtes locales urgentes à ${city}`
        ],
        closerHook: `Bonjour ${name}, j'ai audité la visibilité des ${trade} sur ${city} : les clients qui cherchent sur smartphone ne vous trouvent pas encore alors que vos concurrents captent les chantiers les plus rentables. J'ai préparé la solution concrète prête à être branchée.`,
        estimatedMissedLeadsMonthly: 5,
        estimatedMissedRevenueMonthly: 4500
      };

      sendJSON(res, 200, {
        success: true,
        data: auditData
      });
      return;
    }

    // 7. Interactive ROI & Payback Engine for Closing (MVP Feature 1)
    if (normalizedPath === "/api/ai/roi" && req.method === "POST") {
      const body = await readBodyJSON(req);
      const ticketMoyen = Math.max(100, Number(body.ticketMoyen) || 1200);
      const leadsPerMonth = Math.max(1, Number(body.leadsPerMonth) || 4);
      const convRate = Math.min(100, Math.max(5, Number(body.convRate) || 50));
      const siteCost = Math.max(100, Number(body.siteCost) || 990);

      const wonDealsPerMonth = Math.max(1, Math.round((leadsPerMonth * convRate) / 100));
      const monthlyRevenue = wonDealsPerMonth * ticketMoyen;
      const yearlyRevenue = monthlyRevenue * 12;
      const yearlyNetProfit = yearlyRevenue - siteCost;
      const paybackDays = Math.max(1, Math.round((siteCost / monthlyRevenue) * 30));
      const roiPercent = Math.round((yearlyNetProfit / siteCost) * 100);

      sendJSON(res, 200, {
        success: true,
        data: {
          ticketMoyen,
          leadsPerMonth,
          convRate,
          wonDealsPerMonth,
          siteCost,
          monthlyRevenue,
          yearlyRevenue,
          yearlyNetProfit,
          paybackDays,
          roiPercent
        }
      });
      return;
    }

    sendJSON(res, 404, { error: "Endpoint API non trouvé: " + normalizedPath });
    return;
  } catch (apiErr) {
    const statusCode = apiErr.statusCode || 500;
    if (statusCode >= 500) console.error("API error:", apiErr);
    sendJSON(res, statusCode, { error: apiErr.message });
    return;
  }
}

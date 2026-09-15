import { getFallbackModels, enrichSiteWithAI, callGeminiWithFallback, generateImageWithGemini } from "./gemini.js";
import { handleAccountsRoute } from "./accounts.js";
import { getTradeFallbackDataUrl } from "../public/js/data/imageFallbacks.js";
import { createHash } from "node:crypto";

// One validated context feeds both the model and its cache key. Do not lowercase
// or concatenate with delimiters: case and embedded underscores are meaningful.
export function validateGenerationContext(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const err = new Error("Le contexte de génération doit être un objet JSON");
    err.statusCode = 400;
    throw err;
  }
  const context = {};
  for (const field of ["name", "trade", "city", "phone", "region", "tone", "ambiance"]) {
    const value = body[field] ?? "";
    if (typeof value !== "string" || value.length > 500) {
      const err = new Error(`Champ ${field} invalide : texte de 500 caractères maximum`);
      err.statusCode = 400;
      throw err;
    }
    context[field] = value;
  }
  return context;
}

export function generationCacheKey(context) {
  return "gen_v2_" + createHash("sha256").update(JSON.stringify({
    context,
    models: getFallbackModels(),
    configured: Boolean(process.env.GEMINI_API_KEY)
  })).digest("hex");
}

// High-performance in-memory cache for repeated AI queries to eliminate network latency.
// A second map shares only currently-running requests with the exact same cache key,
// preventing duplicate model calls during bursts without weakening context isolation.
const aiResponseCache = new Map();
const aiGenerationInFlight = new Map();
const aiRateLimits = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL
const DEFAULT_ALLOWED_ORIGINS = new Set([
  "https://artisite-prospector.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]);
const RATE_LIMITED_AI_PATHS = new Set(["/api/ai/generate", "/api/ai/copilot", "/api/ai/image"]);

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
  aiGenerationInFlight.clear();
}

export function clearAiRateLimits() {
  aiRateLimits.clear();
}

function allowedOrigins() {
  const configured = String(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured]);
}

export function isAllowedOrigin(req, origin) {
  if (!origin) return true;
  if (allowedOrigins().has(origin)) return true;
  try {
    const requestHost = String(req?.headers?.host || "").toLowerCase();
    return requestHost !== "" && new URL(origin).host.toLowerCase() === requestHost;
  } catch {
    return false;
  }
}

function applyCorsHeaders(req, res) {
  const origin = req?.headers?.origin;
  if (typeof res.setHeader === "function") {
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, If-None-Match, Accept");
    if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  }
}

function corsHeaders(req) {
  const headers = {
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, If-None-Match, Accept"
  };
  if (req?.headers?.origin) headers["Access-Control-Allow-Origin"] = req.headers.origin;
  return headers;
}

function clientIp(req) {
  const forwarded = req?.headers?.["x-forwarded-for"];
  return String(forwarded || req?.headers?.["cf-connecting-ip"] || req?.headers?.["x-real-ip"] || req?.socket?.remoteAddress || "")
    .split(",")[0]
    .trim() || null;
}

export function consumeAiRateLimit(ip, { now = Date.now(), max = 20, windowMs = 60_000 } = {}) {
  if (!ip) return { allowed: true, remaining: max, resetAt: now + windowMs };
  let entry = aiRateLimits.get(ip);
  if (!entry || now >= entry.resetAt) entry = { count: 0, resetAt: now + windowMs };
  entry.count += 1;
  aiRateLimits.set(ip, entry);
  return { allowed: entry.count <= max, remaining: Math.max(0, max - entry.count), resetAt: entry.resetAt };
}

async function generateWithDeduplication(cacheKey, context) {
  const existing = aiGenerationInFlight.get(cacheKey);
  if (existing) {
    return { aiResult: await existing, shared: true };
  }

  let task;
  task = Promise.resolve()
    .then(() => enrichSiteWithAI(context))
    .then(aiResult => {
      // Populate the finished cache before releasing the in-flight slot so a
      // third request cannot slip into a gap and start a duplicate model call.
      if (aiResult?.success) {
        setCachedAiResult(cacheKey, { modelUsed: aiResult.modelUsed, data: aiResult.data });
      }
      return aiResult;
    })
    .finally(() => {
      if (aiGenerationInFlight.get(cacheKey) === task) aiGenerationInFlight.delete(cacheKey);
    });

  aiGenerationInFlight.set(cacheKey, task);
  return { aiResult: await task, shared: false };
}

const MAX_BODY_BYTES = 2 * 1024 * 1024;

function bodyError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

function parseBody(text) {
  if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) {
    throw bodyError(413, "Payload Too Large");
  }
  let value;
  try { value = text === "" ? {} : JSON.parse(text); }
  catch { throw bodyError(400, "Invalid JSON body"); }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw bodyError(400, "JSON body must be an object");
  }
  return value;
}

export async function readBodyJSON(req) {
  if (req.body !== undefined) {
    if (typeof req.body === "string" || Buffer.isBuffer(req.body)) {
      return parseBody(req.body.toString());
    }
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body) ||
        ![Object.prototype, null].includes(Object.getPrototypeOf(req.body))) {
      throw bodyError(400, "JSON body must be an object");
    }
    let serialized;
    try { serialized = JSON.stringify(req.body); }
    catch { throw bodyError(400, "Invalid JSON body"); }
    if (typeof serialized !== "string") throw bodyError(400, "Invalid JSON body");
    return parseBody(serialized);
  }
  return new Promise((resolve, reject) => {
    let chunks = [];
    let bytes = 0;
    let terminated = false;
    const fail = err => {
      if (terminated) return;
      terminated = true;
      chunks = [];
      reject(err);
    };
    req.on("data", chunk => {
      if (terminated) return;
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      bytes += buffer.length;
      // Keep draining without retaining bytes; destroying the socket prevents a 413 response.
      if (bytes > MAX_BODY_BYTES) return fail(bodyError(413, "Payload Too Large"));
      chunks.push(buffer);
    });
    req.on("end", () => {
      if (terminated) return;
      try {
        const value = parseBody(Buffer.concat(chunks).toString("utf8"));
        terminated = true;
        chunks = [];
        resolve(value);
      } catch (err) {
        fail(err);
      }
    });
    req.on("error", fail);
    req.on("aborted", () => fail(bodyError(400, "Request aborted")));
  });
}

export function sendJSON(res, statusCode, data) {
  if (typeof res.status === "function" && typeof res.json === "function") {
    return res.status(statusCode).json(data);
  }
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(data));
}

export async function handleApiRequest(req, res) {
  const origin = req?.headers?.origin;
  if (!isAllowedOrigin(req, origin)) {
    sendJSON(res, 403, { error: "Origine non autorisée" });
    return;
  }
  applyCorsHeaders(req, res);

  // CORS Preflight
  if (req.method === "OPTIONS") {
    if (typeof res.status === "function") {
      return res.status(204).end();
    }
    res.writeHead(204, corsHeaders(req));
    res.end();
    return;
  }

  const [rawUrl] = (req.url || "").split("?");
  // Normalize path to always start with /api/
  let normalizedPath = rawUrl;
  if (!normalizedPath.startsWith("/api/")) {
    normalizedPath = "/api/" + normalizedPath.replace(/^\/+/, "");
  }

  if (req.method === "POST" && RATE_LIMITED_AI_PATHS.has(normalizedPath)) {
    const max = Math.max(1, Number(process.env.AI_RATE_LIMIT_MAX) || 20);
    const windowMs = Math.max(1_000, Number(process.env.AI_RATE_LIMIT_WINDOW_MS) || 60_000);
    const limit = consumeAiRateLimit(clientIp(req), { max, windowMs });
    if (typeof res.setHeader === "function") {
      res.setHeader("RateLimit-Limit", String(max));
      res.setHeader("RateLimit-Remaining", String(limit.remaining));
      res.setHeader("RateLimit-Reset", String(Math.ceil(limit.resetAt / 1000)));
    }
    if (!limit.allowed) {
      sendJSON(res, 429, { error: "Trop de requêtes, réessayez plus tard" });
      return;
    }
  }

  try {
    // 0. Comptes et projets par utilisateur (auth + propriété des données)
    if (await handleAccountsRoute(req, res, normalizedPath, { sendJSON, readBodyJSON, clientIp })) {
      return;
    }

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
      const body = validateGenerationContext(await readBodyJSON(req));
      const cacheKey = generationCacheKey(body);
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

      const { aiResult, shared } = await generateWithDeduplication(cacheKey, body);
      if (aiResult.success) {
        sendJSON(res, 200, {
          success: true,
          source: shared ? "inflight" : "gemini",
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
      let aiError = null;
      if (process.env.GEMINI_API_KEY) {
        const imagePrompt = [
          "Photographie réaliste, professionnelle et soignée pour le site vitrine d'un artisan.",
          `Corps de métier : ${tradeId}. Section : ${sectionType}. Style : ${style || "photo réaliste"}.`,
          `Sujet demandé : ${requestedPrompt}.`,
          "Aucun texte, aucun logo, aucune watermark, aucune interface. Cadrage naturel, lumière du jour."
        ].join(" ");
        try {
          const aiImage = await generateImageWithGemini({ prompt: imagePrompt });
          if (aiImage.success) generatedUrl = aiImage.dataUrl;
          else aiError = aiImage.lastError || aiImage.error;
        } catch (error) {
          aiError = error && error.message;
        }
      } else {
        aiError = "NO_API_KEY";
      }
      if (!generatedUrl) {
        console.warn("[ai/image] generation indisponible, visuel du catalogue utilise :", aiError);
      }

      sendJSON(res, 200, {
        success: true,
        source: generatedUrl ? "gemini" : "local_engine",
        prompt: requestedPrompt,
        imageUrl: generatedUrl || fallbackUrl,
        aiAvailable: Boolean(generatedUrl),
        error: generatedUrl ? undefined : aiError
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

import { getFallbackModels, enrichSiteWithAI, callGeminiWithFallback } from "./gemini.js";

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
    req.on("data", chunk => {
      body += chunk.toString();
      if (body.length > 2 * 1024 * 1024) { // 2MB limit
        reject(new Error("Payload Too Large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

export function sendJSON(res, statusCode, data) {
  if (typeof res.status === "function" && typeof res.json === "function") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(statusCode).json(data);
  }
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

export async function handleApiRequest(req, res) {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    if (typeof res.status === "function") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      return res.status(204).end();
    }
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
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

    // 3. AI Generation with multi-model fallback
    if (normalizedPath === "/api/ai/generate" && req.method === "POST") {
      const body = await readBodyJSON(req);
      const aiResult = await enrichSiteWithAI(body);
      if (aiResult.success) {
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
      const { instruction, project } = body;
      if (!instruction) {
        sendJSON(res, 400, { error: "Instruction manquante" });
        return;
      }

      const prompt = `
En tant qu'assistant de personnalisation web, analyse cette instruction utilisateur pour un site d'artisan :
Instruction: "${instruction}"
Entreprise: "${project?.business?.name}" (${project?.business?.tradeLabel} à ${project?.business?.city})

Réponds en JSON avec :
{
  "summary": "Court résumé de l'action effectuée",
  "suggestedPreset": "luxe-sombre" | "nature-premium" | "artisan-moderne" | "local-chaleureux" | "minimal-epure" | null,
  "updatedTitle": null | "Nouveau titre",
  "updatedSubtitle": null | "Nouveau sous-titre",
  "updatedBadge": null | "Nouveau badge",
  "borderRadius": null | "1.5rem" | "0.25rem",
  "buttonRadius": null | "9999px" | "0.25rem"
}
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

    sendJSON(res, 404, { error: "Endpoint API non trouvé: " + normalizedPath });
    return;
  } catch (apiErr) {
    console.error("API error:", apiErr);
    sendJSON(res, 500, { error: apiErr.message });
    return;
  }
}

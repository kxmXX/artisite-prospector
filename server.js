import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getFallbackModels, enrichSiteWithAI, callGeminiWithFallback } from "./server/gemini.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5173;
const HOST = process.env.HOST || "0.0.0.0";
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2"
};

function readBodyJSON(req) {
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

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  const [rawUrl] = req.url.split("?");

  // ==================== API ROUTES ====================
  if (rawUrl.startsWith("/api/")) {
    try {
      // 1. Health check
      if (rawUrl === "/api/health" && req.method === "GET") {
        sendJSON(res, 200, {
          status: "ok",
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      // 2. AI Status & Config
      if (rawUrl === "/api/ai/status" && req.method === "GET") {
        sendJSON(res, 200, {
          configured: !!process.env.GEMINI_API_KEY,
          models: getFallbackModels(),
          envKeyName: "GEMINI_API_KEY"
        });
        return;
      }

      // 3. AI Generation with multi-model fallback
      if (rawUrl === "/api/ai/generate" && req.method === "POST") {
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
      if (rawUrl === "/api/ai/copilot" && req.method === "POST") {
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

      sendJSON(res, 404, { error: "Endpoint API non trouvé" });
      return;
    } catch (apiErr) {
      console.error("API error:", apiErr);
      sendJSON(res, 500, { error: apiErr.message });
      return;
    }
  }

  // ==================== STATIC FILES ====================
  let reqPath = decodeURI(rawUrl);
  if (reqPath === "/") reqPath = "/index.html";

  // Prevent directory traversal
  const resolved = path.resolve(PUBLIC_DIR, "." + reqPath);
  let filePath = resolved.startsWith(PUBLIC_DIR) ? resolved : path.join(PUBLIC_DIR, "index.html");

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(PUBLIC_DIR, "index.html");
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error: " + readErr.message);
        return;
      }

      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": "no-cache"
      });
      res.end(content);
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`⚡ Artisite Prospector server running on http://${HOST}:${PORT}`);
});

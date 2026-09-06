import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { handleApiRequest } from "./server/apiHandler.js";

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

const server = http.createServer(async (req, res) => {
  const [rawUrl] = req.url.split("?");

  // ==================== API ROUTES ====================
  if (rawUrl.startsWith("/api/")) {
    await handleApiRequest(req, res);
    return;
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

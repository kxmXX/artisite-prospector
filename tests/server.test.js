import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleApiRequest, clearAiRateLimits } from "../server/apiHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, "..", "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function resolveFile(urlPath) {
  let reqPath = decodeURI(urlPath.split("?")[0]);
  if (reqPath === "/") reqPath = "/index.html";
  const resolved = path.resolve(PUBLIC_DIR, "." + reqPath);
  let filePath = resolved.startsWith(PUBLIC_DIR) ? resolved : path.join(PUBLIC_DIR, "index.html");
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    filePath = path.join(PUBLIC_DIR, "index.html");
  }
  const ext = path.extname(filePath).toLowerCase();
  return {
    filePath,
    contentType: MIME_TYPES[ext] || "application/octet-stream",
    content: fs.readFileSync(filePath, "utf8")
  };
}

test("server static file resolution handles SPA fallback and accurate MIME types", () => {
  // 1. Root index.html
  const root = resolveFile("/");
  assert.ok(root.contentType.includes("text/html"));
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  assert.ok(root.content.includes(`<title>Artist v${pkg.version} — Création de sites vitrines</title>`));

  // 2. CSS file
  const css = resolveFile("/css/app.css");
  assert.ok(css.contentType.includes("text/css"));
  assert.ok(css.content.includes(".ba-container"));

  // 3. JS file
  const js = resolveFile("/js/app.js");
  assert.ok(js.contentType.includes("application/javascript"));
  assert.ok(js.content.includes("class App"));

  // 4. Fallback route for SPA
  const fallback = resolveFile("/unknown-prospect-route");
  assert.ok(fallback.contentType.includes("text/html"));
  assert.equal(fallback.content, root.content);
});

test("handleApiRequest handles /api/health, /api/ai/status and CORS preflight", async () => {
  let statusCode = null;
  let headers = {};
  let body = "";

  function createMockRes() {
    return {
      setHeader(name, value) {
        headers[name] = value;
      },
      writeHead(code, h) {
        statusCode = code;
        headers = h;
      },
      end(data) {
        body = data || "";
      }
    };
  }

  // 1. Health check
  await handleApiRequest({ method: "GET", url: "/api/health" }, createMockRes());
  assert.equal(statusCode, 200);
  const healthData = JSON.parse(body);
  assert.equal(healthData.status, "ok");

  // 2. AI Status
  await handleApiRequest({ method: "GET", url: "/api/ai/status" }, createMockRes());
  assert.equal(statusCode, 200);
  const aiStatus = JSON.parse(body);
  assert.equal(typeof aiStatus.configured, "boolean");
  assert.ok(Array.isArray(aiStatus.models));

  // 3. OPTIONS preflight
  await handleApiRequest({ method: "OPTIONS", url: "/api/ai/generate", headers: { origin: "http://localhost:5173", host: "localhost:5173" } }, createMockRes());
  assert.equal(statusCode, 204);
  assert.equal(headers["Access-Control-Allow-Origin"], "http://localhost:5173");

  // 4. Cross-origin callers outside the allowlist are rejected.
  headers = {};
  await handleApiRequest({ method: "OPTIONS", url: "/api/ai/generate", headers: { origin: "https://attacker.example", host: "artisite-prospector.vercel.app" } }, createMockRes());
  assert.equal(statusCode, 403);
  assert.equal(headers["Access-Control-Allow-Origin"], undefined);

  // 5. Unknown endpoint
  await handleApiRequest({ method: "GET", url: "/api/unknown" }, createMockRes());
  assert.equal(statusCode, 404);
});

test("AI endpoints return 429 after the configured per-IP budget", async t => {
  const previousMax = process.env.AI_RATE_LIMIT_MAX;
  process.env.AI_RATE_LIMIT_MAX = "2";
  clearAiRateLimits();
  t.after(() => {
    if (previousMax === undefined) delete process.env.AI_RATE_LIMIT_MAX;
    else process.env.AI_RATE_LIMIT_MAX = previousMax;
    clearAiRateLimits();
  });

  const request = async () => {
    let statusCode;
    let body;
    await handleApiRequest({
      method: "POST",
      url: "/api/ai/image",
      headers: { "x-forwarded-for": "203.0.113.50" },
      body: { prompt: "Jardin", tradeId: "paysagiste", sectionType: "hero" }
    }, {
      setHeader() {},
      writeHead(code) { statusCode = code; },
      end(value) { body = JSON.parse(value); }
    });
    return { statusCode, body };
  };

  assert.equal((await request()).statusCode, 200);
  assert.equal((await request()).statusCode, 200);
  const blocked = await request();
  assert.equal(blocked.statusCode, 429);
  assert.match(blocked.body.error, /Trop de requêtes/);
});

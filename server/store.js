/**
 * Persistance des comptes et des projets côté serveur.
 *
 * Backends, sans aucune dépendance npm :
 * - Vercel Blob (BLOB_READ_WRITE_TOKEN) : la base est rangée en instantanés
 *   immuables sous `artisite/db/<horodatage>.json`. On n'écrase JAMAIS un blob :
 *   le CDN met en cache par nom de fichier et un écrasement ne se voit pas tout de
 *   suite. La lecture liste les instantanés et prend le plus récent. C'est le
 *   backend des hébergements sans disque (Vercel).
 * - Redis REST compatible Upstash / Vercel KV (UPSTASH_REDIS_REST_URL + TOKEN, ou
 *   KV_REST_API_URL + KV_REST_API_TOKEN) : alternative clé/valeur.
 * - fichier JSON écrit de façon atomique (DATA_DIR) : le mode local, déjà éprouvé.
 *
 * isPersistentHost() est vrai dès qu'un backend durable existe. Sinon les routes de
 * compte refusent franchement (503) plutôt que de laisser croire que les données
 * seraient conservées. Une panne de lecture lève toujours : renvoyer une base vide
 * ferait effacer les données réelles à la première écriture suivante.
 *
 * Limite assumée : l'écriture est un « lire, modifier, écrire » global. À l'échelle
 * de quelques utilisateurs, la fenêtre de concurrence est négligeable ; une montée
 * en charge demanderait une clé par utilisateur.
 */
import fs from "node:fs";
import path from "node:path";

const DEFAULT_DIR = path.join(process.cwd(), ".data");
const REMOTE_KEY = "artisite:db:v1";
const BLOB_PREFIX = "artisite/db/";
const BLOB_KEEP = 5;
const REMOTE_TIMEOUT_MS = 8000;

export function dataDir() {
  return process.env.DATA_DIR || DEFAULT_DIR;
}

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url: String(url).replace(/\/+$/, ""), token: String(token) };
}

function blobConfig() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  return { token: String(token) };
}

function blobBase() {
  return (process.env.BLOB_UPLOAD_BASE || "https://blob.vercel-storage.com").replace(/\/+$/, "");
}

export function storeBackend() {
  if (blobConfig()) return "blob";
  if (redisConfig()) return "redis";
  return "file";
}

export function isRemoteStore() {
  return storeBackend() !== "file";
}

export function isPersistentHost() {
  if (isRemoteStore()) return true;
  return !process.env.VERCEL || Boolean(process.env.DATA_DIR);
}

function emptyDb() {
  return { version: 1, users: [], sessions: [], projects: [] };
}

function normalizeDb(parsed) {
  const db = Object.assign(emptyDb(), parsed && typeof parsed === "object" ? parsed : {});
  for (const key of ["users", "sessions", "projects"]) {
    if (!Array.isArray(db[key])) db[key] = [];
  }
  return db;
}

function dbPath() {
  return path.join(dataDir(), "db.json");
}

let cache = null;

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS);
  const host = String(url).replace(/^https?:\/\//, "").split("/")[0];
  try {
    return await fetch(url, Object.assign({}, options, { signal: controller.signal }));
  } catch (error) {
    if (error && error.name === "AbortError") throw new Error("REMOTE_STORE_TIMEOUT@" + host);
    throw new Error("REMOTE_STORE_UNREACHABLE@" + host + ":" + String((error && error.message) || error));
  } finally {
    clearTimeout(timer);
  }
}

function authHeaders(config) {
  return { Authorization: "Bearer " + config.token };
}

/** Liste les instantanés, du plus récent au plus ancien. */
async function blobList() {
  const config = blobConfig();
  if (!config) throw new Error("BLOB_STORE_NOT_CONFIGURED");
  const response = await fetchWithTimeout(blobBase() + "?prefix=" + encodeURIComponent(BLOB_PREFIX) + "&limit=100", {
    headers: authHeaders(config),
    cache: "no-store"
  });
  if (!response.ok) throw new Error("BLOB_STORE_HTTP_" + response.status);
  const payload = await response.json();
  const blobs = Array.isArray(payload && payload.blobs) ? payload.blobs : [];
  return blobs
    .filter((blob) => blob && typeof blob.pathname === "string" && typeof blob.url === "string")
    .sort((a, b) => (a.pathname < b.pathname ? 1 : -1));
}

async function blobRead() {
  const blobs = await blobList();
  if (!blobs.length) return null;
  const config = blobConfig();
  const response = await fetchWithTimeout(blobs[0].url, { headers: authHeaders(config), cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("BLOB_STORE_HTTP_" + response.status);
  return response.text();
}

async function blobWrite(text) {
  const config = blobConfig();
  if (!config) throw new Error("BLOB_STORE_NOT_CONFIGURED");
  const pathname = BLOB_PREFIX + String(Date.now()).padStart(20, "0") + "-" + Math.random().toString(36).slice(2, 8) + ".json";
  const response = await fetchWithTimeout(blobBase() + "/" + pathname, {
    method: "PUT",
    headers: Object.assign({}, authHeaders(config), {
      "x-content-type": "application/json",
      "x-add-random-suffix": "0",
      "x-vercel-blob-access": "private",
      "x-cache-control-max-age": "0"
    }),
    body: text
  });
  if (!response.ok) throw new Error("BLOB_STORE_HTTP_" + response.status);
  // Nettoyage au mieux : il ne doit jamais faire echouer une ecriture reussie.
  try {
    const stale = (await blobList()).slice(BLOB_KEEP);
    for (const blob of stale) {
      await fetchWithTimeout(blobBase() + "/" + blob.pathname, { method: "DELETE", headers: authHeaders(config) });
    }
  } catch {
    /* le nettoyage est optionnel */
  }
}

async function redisCommand(command, ...args) {
  const config = redisConfig();
  if (!config) throw new Error("REMOTE_STORE_NOT_CONFIGURED");
  const response = await fetchWithTimeout(config.url, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + config.token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify([command, ...args])
  });
  if (!response.ok) throw new Error("REMOTE_STORE_HTTP_" + response.status);
  const payload = await response.json();
  if (payload && payload.error) throw new Error("REMOTE_STORE_" + payload.error);
  return payload ? payload.result : null;
}

export async function readDb() {
  const backend = storeBackend();
  if (backend === "blob") {
    const raw = await blobRead();
    if (raw === null || raw === undefined || raw === "") return emptyDb();
    try {
      return normalizeDb(JSON.parse(raw));
    } catch {
      return emptyDb();
    }
  }
  if (backend === "redis") {
    const raw = await redisCommand("GET", REMOTE_KEY);
    if (raw === null || raw === undefined) return emptyDb();
    try {
      return normalizeDb(JSON.parse(raw));
    } catch {
      return emptyDb();
    }
  }
  if (cache) return cache;
  try {
    cache = normalizeDb(JSON.parse(fs.readFileSync(dbPath(), "utf8")));
  } catch {
    cache = emptyDb();
  }
  return cache;
}

export async function writeDb(db) {
  const backend = storeBackend();
  if (backend === "blob") {
    await blobWrite(JSON.stringify(db));
    return;
  }
  if (backend === "redis") {
    await redisCommand("SET", REMOTE_KEY, JSON.stringify(db));
    return;
  }
  cache = db;
  const dir = dataDir();
  fs.mkdirSync(dir, { recursive: true });
  const target = dbPath();
  const temp = target + "." + process.pid + "." + Date.now() + ".tmp";
  fs.writeFileSync(temp, JSON.stringify(db, null, 2));
  fs.renameSync(temp, target);
}

/** Utilisé par les tests pour repartir d'une base vide. */
export function resetStoreCache() {
  cache = null;
}

/** Purge les sessions expirées ; renvoie le nombre de sessions retirées. */
export function purgeExpiredSessions(db, now = Date.now()) {
  const before = db.sessions.length;
  db.sessions = db.sessions.filter((session) => session.expiresAt > now);
  return before - db.sessions.length;
}

/**
 * Comptes et projets par utilisateur (Mission 3, périmètre volontairement simple).
 *
 * - mots de passe : scrypt + sel aléatoire par utilisateur, jamais stockés en clair ;
 * - sessions : jeton aléatoire de 32 octets, seul son SHA-256 est stocké, cookie HttpOnly ;
 * - projets : chaque projet porte un ownerId, toute lecture ou écriture hors propriétaire est refusée.
 *
 * Aucune dépendance npm : node:crypto suffit, compatible Node 18.
 */
import crypto from "node:crypto";
import { readDb, writeDb, isPersistentHost, purgeExpiredSessions } from "./store.js";

export const SESSION_COOKIE = "artist_session";
const SCRYPT_KEYLEN = 64;
const SESSION_TTL_MS = Math.max(1, Number(process.env.SESSION_TTL_DAYS) || 30) * 24 * 60 * 60 * 1000;
const UNPERSISTED_MESSAGE =
  "Connexion indisponible sur cette version hebergée : le stockage n'y est pas persistant. Utilisez le serveur local (npm start).";

export function newId(prefix) {
  return prefix + "_" + crypto.randomBytes(12).toString("hex");
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return { algo: "scrypt", salt, hash };
}

export function verifyPassword(password, record) {
  if (!record || record.algo !== "scrypt" || typeof record.salt !== "string") return false;
  const candidate = crypto.scryptSync(password, record.salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(record.hash, "hex");
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

export function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

export function validateCredentials(username, password) {
  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) {
    return "Identifiant invalide : 3 a 32 caracteres, minuscules, chiffres, point, tiret ou souligne.";
  }
  if (typeof password !== "string" || password.length < 8) {
    return "Mot de passe trop court : 8 caracteres minimum.";
  }
  if (password.length > 200) return "Mot de passe trop long.";
  return null;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function publicUser(user) {
  return { id: user.id, username: user.username, createdAt: user.createdAt };
}

function parseCookies(header) {
  const jar = {};
  for (const part of String(header || "").split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    jar[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return jar;
}

function cookieAttributes(maxAgeSeconds) {
  const secure = process.env.COOKIE_SECURE === "true" || Boolean(process.env.VERCEL);
  return "; Path=/; HttpOnly; SameSite=Lax" + (secure ? "; Secure" : "") + "; Max-Age=" + maxAgeSeconds;
}

function sessionCookie(token) {
  return SESSION_COOKIE + "=" + encodeURIComponent(token) + cookieAttributes(Math.floor(SESSION_TTL_MS / 1000));
}

function clearedCookie() {
  return SESSION_COOKIE + "=" + cookieAttributes(0);
}

function sendCookie(res, value) {
  if (res && typeof res.setHeader === "function") res.setHeader("Set-Cookie", value);
}

function currentUser(db, req) {
  const token = parseCookies(req && req.headers && req.headers.cookie)[SESSION_COOKIE];
  if (!token) return null;
  const digest = hashToken(String(token));
  const session = db.sessions.find((entry) => entry.tokenHash === digest);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) return null;
  const user = db.users.find((entry) => entry.id === session.userId);
  if (!user) return null;
  return { user, session };
}

const attempts = new Map();

export function resetAuthRateLimits() {
  attempts.clear();
}

function rateLimited(ip) {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const max = 20;
  const entry = attempts.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + windowMs; }
  entry.count += 1;
  attempts.set(ip, entry);
  return entry.count > max;
}

function validProjectId(value) {
  return typeof value === "string" && /^[A-Za-z0-9._-]{1,80}$/.test(value);
}

/**
 * Traite /api/auth/* et /api/projects/*. Renvoie true si la route a été prise en charge.
 */
export async function handleAccountsRoute(req, res, normalizedPath, deps) {
  const isAuth = normalizedPath === "/api/auth/session" || normalizedPath.startsWith("/api/auth/");
  const isProjects = normalizedPath === "/api/projects" || normalizedPath.startsWith("/api/projects/");
  if (!isAuth && !isProjects) return false;

  const { sendJSON, readBodyJSON, clientIp } = deps;

  if (!isPersistentHost()) {
    sendJSON(res, 503, { error: UNPERSISTED_MESSAGE, storage: "unavailable" });
    return true;
  }

  const method = req.method;
  let db;
  try {
    db = await readDb();
  } catch (error) {
    console.error("[accounts] lecture du stockage impossible:", error && error.message);
    sendJSON(res, 503, { error: UNPERSISTED_MESSAGE, storage: "error", reason: (error && error.message) || "unknown" });
    return true;
  }
  purgeExpiredSessions(db);

  // Écriture distante : une panne de stockage doit répondre 503, jamais laisser
  // croire à un enregistrement réussi.
  const persist = async () => {
    try {
      await writeDb(db);
      return true;
    } catch (error) {
      console.error("[accounts] ecriture du stockage impossible:", error && error.message);
      sendJSON(res, 503, { error: UNPERSISTED_MESSAGE, storage: "error", reason: (error && error.message) || "unknown" });
      return false;
    }
  };

  if (method === "POST" && (normalizedPath === "/api/auth/login" || normalizedPath === "/api/auth/register")) {
    if (rateLimited(clientIp(req))) {
      sendJSON(res, 429, { error: "Trop de tentatives, reessayez dans quelques minutes." });
      return true;
    }
  }

  if (normalizedPath === "/api/auth/session" && method === "GET") {
    const active = currentUser(db, req);
    if (!active) { sendJSON(res, 200, { user: null }); return true; }
    sendJSON(res, 200, { user: publicUser(active.user) });
    return true;
  }

  if (normalizedPath === "/api/auth/register" && method === "POST") {
    const body = await readBodyJSON(req);
    const username = normalizeUsername(body.username);
    const invalid = validateCredentials(username, body.password);
    if (invalid) { sendJSON(res, 400, { error: invalid }); return true; }
    if (db.users.some((user) => user.username === username)) {
      sendJSON(res, 409, { error: "Cet identifiant est deja utilise." });
      return true;
    }
    const user = {
      id: newId("usr"),
      username,
      password: hashPassword(body.password),
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    const token = crypto.randomBytes(32).toString("base64url");
    db.sessions.push({ tokenHash: hashToken(token), userId: user.id, createdAt: Date.now(), expiresAt: Date.now() + SESSION_TTL_MS });
    if (!(await persist())) return true;
    sendCookie(res, sessionCookie(token));
    sendJSON(res, 201, { user: publicUser(user) });
    return true;
  }

  if (normalizedPath === "/api/auth/login" && method === "POST") {
    const body = await readBodyJSON(req);
    const username = normalizeUsername(body.username);
    const user = db.users.find((entry) => entry.username === username);
    // Message volontairement identique dans les deux cas : pas d'énumération de comptes.
    if (!user || !verifyPassword(String(body.password || ""), user.password)) {
      sendJSON(res, 401, { error: "Identifiant ou mot de passe incorrect." });
      return true;
    }
    const token = crypto.randomBytes(32).toString("base64url");
    db.sessions.push({ tokenHash: hashToken(token), userId: user.id, createdAt: Date.now(), expiresAt: Date.now() + SESSION_TTL_MS });
    if (!(await persist())) return true;
    sendCookie(res, sessionCookie(token));
    sendJSON(res, 200, { user: publicUser(user) });
    return true;
  }

  if (normalizedPath === "/api/auth/logout" && method === "POST") {
    const active = currentUser(db, req);
    if (active) {
      db.sessions = db.sessions.filter((entry) => entry.tokenHash !== active.session.tokenHash);
      if (!(await persist())) return true;
    }
    sendCookie(res, clearedCookie());
    if (typeof res.status === "function") { res.status(204).end(); return true; }
    res.writeHead(204, { "Content-Type": "application/json; charset=utf-8" });
    res.end();
    return true;
  }

  const active = currentUser(db, req);

  if (!active) {
    sendJSON(res, 401, { error: "Connexion requise." });
    return true;
  }

  if (normalizedPath === "/api/projects" && method === "GET") {
    const projects = db.projects.filter((entry) => entry.ownerId === active.user.id).map((entry) => entry.project);
    sendJSON(res, 200, { projects });
    return true;
  }

  if (normalizedPath === "/api/projects/import" && method === "POST") {
    const body = await readBodyJSON(req);
    const incoming = Array.isArray(body.projects) ? body.projects : [];
    let imported = 0;
    for (const project of incoming.slice(0, 200)) {
      if (!project || typeof project !== "object" || !validProjectId(project.id)) continue;
      const existing = db.projects.find((entry) => entry.id === project.id && entry.ownerId === active.user.id);
      if (existing) { existing.project = project; existing.updatedAt = Date.now(); }
      else db.projects.push({ id: project.id, ownerId: active.user.id, project, updatedAt: Date.now() });
      imported += 1;
    }
    if (!(await persist())) return true;
    sendJSON(res, 200, { imported });
    return true;
  }

  if (normalizedPath.startsWith("/api/projects/") && (method === "PUT" || method === "DELETE")) {
    const id = decodeURIComponent(normalizedPath.slice("/api/projects/".length));
    if (!validProjectId(id)) { sendJSON(res, 400, { error: "Identifiant de projet invalide." }); return true; }
    const entry = db.projects.find((item) => item.id === id);
    if (!entry || entry.ownerId !== active.user.id) {
      // Même réponse pour « inexistant » et « appartient à quelqu'un d'autre ».
      sendJSON(res, 404, { error: "Projet introuvable." });
      return true;
    }
    if (method === "DELETE") {
      db.projects = db.projects.filter((item) => !(item.id === id && item.ownerId === active.user.id));
      if (!(await persist())) return true;
      if (typeof res.status === "function") { res.status(204).end(); return true; }
      res.writeHead(204, { "Content-Type": "application/json; charset=utf-8" });
      res.end();
      return true;
    }
    const body = await readBodyJSON(req);
    const project = body.project;
    if (!project || typeof project !== "object" || project.id !== id) {
      sendJSON(res, 400, { error: "Le projet envoye ne correspond pas a l'identifiant." });
      return true;
    }
    entry.project = project;
    entry.updatedAt = Date.now();
    if (!(await persist())) return true;
    sendJSON(res, 200, { project });
    return true;
  }

  sendJSON(res, 405, { error: "Methode non autorisee pour " + normalizedPath });
  return true;
}

/**
 * Persistance des comptes et des projets côté serveur.
 *
 * Un seul fichier JSON, écrit de façon atomique (fichier temporaire puis renommage),
 * sans aucune dépendance : Node 18 suffit. Le chemin est configurable par DATA_DIR.
 *
 * Contrainte assumée : sur un hébergement sans disque persistant (Vercel), le fichier
 * est éphémère. isPersistentHost() permet aux routes de refuser franchement plutôt que
 * de laisser croire que les données sont conservées.
 */
import fs from "node:fs";
import path from "node:path";

const DEFAULT_DIR = path.join(process.cwd(), ".data");

export function dataDir() {
  return process.env.DATA_DIR || DEFAULT_DIR;
}

export function isPersistentHost() {
  return !process.env.VERCEL || Boolean(process.env.DATA_DIR);
}

function emptyDb() {
  return { version: 1, users: [], sessions: [], projects: [] };
}

function dbPath() {
  return path.join(dataDir(), "db.json");
}

let cache = null;

export function readDb() {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(fs.readFileSync(dbPath(), "utf8"));
    cache = Object.assign(emptyDb(), parsed);
    for (const key of ["users", "sessions", "projects"]) {
      if (!Array.isArray(cache[key])) cache[key] = [];
    }
  } catch {
    cache = emptyDb();
  }
  return cache;
}

export function writeDb(db) {
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

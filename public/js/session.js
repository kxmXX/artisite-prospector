/**
 * Session utilisateur et synchronisation des projets.
 *
 * Le stockage local reste la copie de travail (l'application doit fonctionner hors
 * ligne) ; quand une session est ouverte, chaque enregistrement est aussi poussé au
 * serveur, et la bibliothèque est rechargée au démarrage.
 */
import { apiFetch, ApiError } from "./api.js";

export const AUTH_STATUS = { ANONYMOUS: "anonymous", AUTHENTICATED: "authenticated", UNAVAILABLE: "unavailable" };
export const LOCAL_KEY = "artisite_projects_v11";
export const MIGRATION_BACKUP_KEY = "artisite_migration_backup_v11";

export async function fetchSession(options = {}) {
  try {
    const data = await apiFetch("/api/auth/session", options);
    const user = data && data.user ? data.user : null;
    return { status: user ? AUTH_STATUS.AUTHENTICATED : AUTH_STATUS.ANONYMOUS, user };
  } catch (error) {
    if (error instanceof ApiError && error.status === 503) {
      return { status: AUTH_STATUS.UNAVAILABLE, user: null, message: error.message };
    }
    // Hors ligne : on reste en mode local plutôt que de bloquer l'application.
    return { status: AUTH_STATUS.ANONYMOUS, user: null, offline: true };
  }
}

export function signUp(username, password, options = {}) {
  return apiFetch("/api/auth/register", Object.assign({ method: "POST", body: { username, password } }, options));
}

export function signIn(username, password, options = {}) {
  return apiFetch("/api/auth/login", Object.assign({ method: "POST", body: { username, password } }, options));
}

export function signOut(options = {}) {
  return apiFetch("/api/auth/logout", Object.assign({ method: "POST" }, options));
}

export function pullProjects(options = {}) {
  return apiFetch("/api/projects", options).then((data) => (data && Array.isArray(data.projects) ? data.projects : []));
}

export function pushProject(project, options = {}) {
  return apiFetch("/api/projects/" + encodeURIComponent(project.id), Object.assign({
    method: "PUT",
    body: { project }
  }, options));
}

export function removeProject(projectId, options = {}) {
  return apiFetch("/api/projects/" + encodeURIComponent(projectId), Object.assign({ method: "DELETE" }, options));
}

export function importProjects(projects, options = {}) {
  return apiFetch("/api/projects/import", Object.assign({
    method: "POST",
    body: { projects }
  }, options));
}

/* ------------------------------------------------------------------ *
 * Migration des créations locales vers le compte
 * ------------------------------------------------------------------ */

export function readLocalProjects(storage = globalThis.localStorage) {
  if (!storage) return [];
  try {
    const raw = storage.getItem(LOCAL_KEY) || storage.getItem("artisite_projects_v5") || storage.getItem("artisite_projects_v4");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Décide ce qui doit être importé : les projets locaux absents du compte, ou dont
 * la version locale est plus récente. Ne supprime jamais rien.
 */
export function planMigration(localProjects, remoteProjects) {
  const remoteById = new Map();
  for (const project of remoteProjects || []) {
    if (project && typeof project.id === "string") remoteById.set(project.id, project);
  }
  const toImport = [];
  let alreadyThere = 0;
  for (const project of localProjects || []) {
    if (!project || typeof project !== "object" || typeof project.id !== "string") continue;
    const remote = remoteById.get(project.id);
    if (!remote) { toImport.push(project); continue; }
    const localTime = Date.parse(project.updatedAt || 0) || 0;
    const remoteTime = Date.parse(remote.updatedAt || 0) || 0;
    if (localTime > remoteTime) toImport.push(project);
    else alreadyThere += 1;
  }
  return { toImport, alreadyThere };
}

/** Copie de secours avant toute suppression de la bibliothèque locale. */
export function backupLocalProjects(storage = globalThis.localStorage) {
  if (!storage) return null;
  const projects = readLocalProjects(storage);
  if (!projects.length) return null;
  try {
    storage.setItem(MIGRATION_BACKUP_KEY, JSON.stringify(projects));
  } catch {
    return null;
  }
  return projects.length;
}

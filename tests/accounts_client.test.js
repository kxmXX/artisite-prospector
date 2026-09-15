import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const { apiFetch, ApiError } = await import('../public/js/api.js');
const session = await import('../public/js/session.js');

function fakeResponse(status, body, { asText = false } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (asText ? body : JSON.stringify(body))
  };
}

test('apiFetch : renvoie le JSON, propage le message serveur, reste same-origin', async () => {
  let seen = null;
  const ok = await apiFetch('/api/projects', {
    fetchImpl: async (url, init) => { seen = { url, init }; return fakeResponse(200, { projects: [] }); }
  });
  assert.deepEqual(ok, { projects: [] });
  assert.equal(seen.init.credentials, 'same-origin', 'le cookie ne doit jamais être lu par le JavaScript');
  assert.equal(seen.init.method, 'GET');

  await assert.rejects(
    () => apiFetch('/api/projects/proj-1', { method: 'PUT', body: { project: {} }, fetchImpl: async () => fakeResponse(404, { error: 'Projet introuvable.' }) }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 404);
      assert.equal(error.message, 'Projet introuvable.');
      return true;
    }
  );
});

test('apiFetch : serveur injoignable et corps vide', async () => {
  await assert.rejects(
    () => apiFetch('/api/health', { fetchImpl: async () => { throw new Error('boom'); } }),
    (error) => error instanceof ApiError && error.status === 0 && /injoignable/.test(error.message)
  );
  const empty = await apiFetch('/api/auth/logout', { method: 'POST', fetchImpl: async () => fakeResponse(204, '', { asText: true }) });
  assert.equal(empty, null);
});

test('fetchSession : connecté, anonyme, indisponible, hors ligne', async () => {
  const authenticated = await session.fetchSession({ fetchImpl: async () => fakeResponse(200, { user: { id: 'usr_1', username: 'marie' } }) });
  assert.equal(authenticated.status, session.AUTH_STATUS.AUTHENTICATED);
  assert.equal(authenticated.user.username, 'marie');

  const anonymous = await session.fetchSession({ fetchImpl: async () => fakeResponse(200, { user: null }) });
  assert.equal(anonymous.status, session.AUTH_STATUS.ANONYMOUS);
  assert.equal(anonymous.user, null);

  const unavailable = await session.fetchSession({ fetchImpl: async () => fakeResponse(503, { error: 'Stockage serveur non configure' }) });
  assert.equal(unavailable.status, session.AUTH_STATUS.UNAVAILABLE, 'un hébergement non persistant doit être distingué');

  const offline = await session.fetchSession({ fetchImpl: async () => { throw new Error('offline'); } });
  assert.equal(offline.status, session.AUTH_STATUS.ANONYMOUS);
  assert.equal(offline.offline, true, 'hors ligne, l\'application reste utilisable en local');
});

test('planMigration : n\'importe que ce qui manque ou ce qui est plus récent', () => {
  const local = [
    { id: 'a', updatedAt: '2026-01-01T00:00:00.000Z' },
    { id: 'b', updatedAt: '2026-03-01T00:00:00.000Z' },
    { id: 'c', updatedAt: '2026-01-15T00:00:00.000Z' },
    { id: 'sans-date' },
    { notAProject: true }
  ];
  const remote = [
    { id: 'b', updatedAt: '2026-02-01T00:00:00.000Z' },
    { id: 'c', updatedAt: '2026-02-01T00:00:00.000Z' }
  ];
  const plan = session.planMigration(local, remote);
  assert.deepEqual(plan.toImport.map((project) => project.id).sort(), ['a', 'b', 'sans-date']);
  assert.equal(plan.alreadyThere, 1, 'le projet local plus ancien est ignoré');
});

test('sauvegarde de secours : jamais de perte silencieuse', () => {
  const store = new Map();
  const storage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value)
  };
  assert.equal(session.backupLocalProjects(storage), null, 'rien à sauvegarder sans bibliothèque locale');
  store.set(session.LOCAL_KEY, JSON.stringify([{ id: 'a' }, { id: 'b' }]));
  assert.deepEqual(session.readLocalProjects(storage).map((project) => project.id), ['a', 'b']);
  assert.equal(session.backupLocalProjects(storage), 2);
  assert.ok(store.get(session.MIGRATION_BACKUP_KEY).includes('"a"'), 'la copie de secours contient la bibliothèque');
});

test('importProjects : envoie bien la bibliothèque locale', async () => {
  let body = null;
  await session.importProjects([{ id: 'a' }], {
    fetchImpl: async (url, init) => { body = JSON.parse(init.body); return fakeResponse(200, { imported: 1 }); }
  });
  assert.deepEqual(body, { projects: [{ id: 'a' }] });
});

test('l\'interface expose la connexion et la migration locale', () => {
  const dashboard = fs.readFileSync(new URL('../public/js/components/dashboard.js', import.meta.url), 'utf8');
  assert.ok(dashboard.includes('openAuthModal'), 'un point d\'entrée de connexion doit exister sur le dashboard');
  assert.ok(dashboard.includes('signOutAccount'), 'la déconnexion doit être accessible');
  assert.ok(dashboard.includes('importLocalLibrary'), 'l\'import des créations locales doit être proposé');
  assert.ok(dashboard.includes('migrationBannerHTML'), 'le bandeau de migration doit être rendu');

  const app = fs.readFileSync(new URL('../public/js/app.js', import.meta.url), 'utf8');
  assert.ok(app.includes('initAccounts()'), 'la session doit être amorcée au démarrage');
  assert.ok(app.includes('queueCloudSync'), 'les écritures doivent être poussées au serveur en mode connecté');
  assert.ok(app.includes('renderAuthModal'), 'la modale de compte doit être branchée sur le coordinateur d\'overlays');
});

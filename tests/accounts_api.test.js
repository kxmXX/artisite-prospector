import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'artist-accounts-'));
process.env.DATA_DIR = DATA_DIR;

const { handleAccountsRoute, resetAuthRateLimits, SESSION_COOKIE } = await import('../server/accounts.js');
const { resetStoreCache } = await import('../server/store.js');

function mockRes() {
  return {
    statusCode: null,
    headers: {},
    payload: null,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    writeHead(status) { this.statusCode = status; return this; },
    end(body) { if (body !== undefined) this.payload = body; return this; }
  };
}

const deps = {
  sendJSON(res, statusCode, data) {
    res.statusCode = statusCode;
    res.payload = JSON.stringify(data);
  },
  readBodyJSON(req) { return Promise.resolve(req.body || {}); },
  clientIp() { return '127.0.0.1'; }
};

async function call(method, url, { body, cookie } = {}) {
  const res = mockRes();
  const req = { method, url, headers: {}, body };
  if (cookie) req.headers.cookie = cookie;
  const handled = await handleAccountsRoute(req, res, url, deps);
  assert.equal(handled, true, 'la route doit être prise en charge : ' + url);
  return { status: res.statusCode, json: res.payload ? JSON.parse(res.payload) : null, headers: res.headers };
}

function cookieFrom(response) {
  const raw = response.headers['set-cookie'];
  return raw ? raw.split(';')[0] : null;
}

function reset() {
  resetAuthRateLimits();
  fs.rmSync(path.join(DATA_DIR, 'db.json'), { force: true });
  resetStoreCache();
}

function dbContent() {
  return fs.readFileSync(path.join(DATA_DIR, 'db.json'), 'utf8');
}

test('inscription : mot de passe haché, session ouverte, jamais renvoyé', async () => {
  reset();
  const created = await call('POST', '/api/auth/register', { body: { username: 'Artisan.Pro', password: 'motdepasse1' } });
  assert.equal(created.status, 201);
  assert.equal(created.json.user.username, 'artisan.pro', 'identifiant normalisé en minuscules');
  assert.equal(created.json.user.password, undefined, 'aucun mot de passe dans la réponse');
  const raw = dbContent();
  assert.ok(!raw.includes('motdepasse1'), 'le mot de passe ne doit jamais apparaître dans le fichier');
  assert.ok(raw.includes('scrypt'), 'le mot de passe doit être stocké par scrypt');

  const cookie = cookieFrom(created);
  assert.ok(cookie && cookie.startsWith(SESSION_COOKIE + '='), 'cookie de session attendu');
  assert.ok(/HttpOnly/.test(created.headers['set-cookie']), 'cookie HttpOnly');

  const session = await call('GET', '/api/auth/session', { cookie });
  assert.equal(session.status, 200);
  assert.equal(session.json.user.username, 'artisan.pro');
});

test('identifiant déjà pris et saisies invalides', async () => {
  reset();
  await call('POST', '/api/auth/register', { body: { username: 'dup', password: 'motdepasse1' } });
  assert.equal((await call('POST', '/api/auth/register', { body: { username: 'dup', password: 'motdepasse2' } })).status, 409);
  assert.equal((await call('POST', '/api/auth/register', { body: { username: 'a', password: 'motdepasse1' } })).status, 400);
  assert.equal((await call('POST', '/api/auth/register', { body: { username: 'valide', password: 'court' } })).status, 400);
});

test('connexion : mauvais mot de passe refusé, session anonyme sans cookie', async () => {
  reset();
  await call('POST', '/api/auth/register', { body: { username: 'marie', password: 'motdepasse1' } });
  const bad = await call('POST', '/api/auth/login', { body: { username: 'marie', password: 'faux' } });
  assert.equal(bad.status, 401);
  const unknown = await call('POST', '/api/auth/login', { body: { username: 'inconnu', password: 'motdepasse1' } });
  assert.equal(unknown.status, 401);
  assert.equal(unknown.json.error, bad.json.error, 'pas d\'énumération des comptes');

  const good = await call('POST', '/api/auth/login', { body: { username: 'marie', password: 'motdepasse1' } });
  assert.equal(good.status, 200);
  const anonymous = await call('GET', '/api/auth/session');
  assert.equal(anonymous.status, 200);
  assert.equal(anonymous.json.user, null);
});

test('déconnexion : la session ne vaut plus rien', async () => {
  reset();
  const created = await call('POST', '/api/auth/register', { body: { username: 'paul', password: 'motdepasse1' } });
  const cookie = cookieFrom(created);
  const out = await call('POST', '/api/auth/logout', { cookie });
  assert.equal(out.status, 204, 'la déconnexion répond 204');
  assert.ok(/Max-Age=0/.test(out.headers['set-cookie']), 'cookie expiré');
  const after = await call('GET', '/api/auth/session', { cookie });
  assert.equal(after.json.user, null, 'la session doit être révoquée');
});

test('isolation : chacun ne voit et ne modifie que ses projets', async () => {
  reset();
  const alice = cookieFrom(await call('POST', '/api/auth/register', { body: { username: 'alice', password: 'motdepasse1' } }));
  const bruno = cookieFrom(await call('POST', '/api/auth/register', { body: { username: 'bruno', password: 'motdepasse1' } }));

  const projectA = { id: 'proj-alice', name: 'Chez Alice', sections: [] };
  const projectB = { id: 'proj-bruno', name: 'Chez Bruno', sections: [] };
  assert.equal((await call('POST', '/api/projects/import', { cookie: alice, body: { projects: [projectA] } })).json.imported, 1);
  assert.equal((await call('POST', '/api/projects/import', { cookie: bruno, body: { projects: [projectB] } })).json.imported, 1);

  const listA = await call('GET', '/api/projects', { cookie: alice });
  assert.deepEqual(listA.json.projects.map((p) => p.id), ['proj-alice']);
  const listB = await call('GET', '/api/projects', { cookie: bruno });
  assert.deepEqual(listB.json.projects.map((p) => p.id), ['proj-bruno']);

  const stolenRead = await call('PUT', '/api/projects/proj-bruno', { cookie: alice, body: { project: { id: 'proj-bruno', name: 'Pirate' } } });
  assert.equal(stolenRead.status, 404, 'un projet d\'autrui est introuvable, pas interdit');
  const stolenDelete = await call('DELETE', '/api/projects/proj-bruno', { cookie: alice });
  assert.equal(stolenDelete.status, 404);
  assert.equal((await call('GET', '/api/projects', { cookie: bruno })).json.projects[0].name, 'Chez Bruno');
});

test('mise à jour et suppression par le propriétaire', async () => {
  reset();
  const cookie = cookieFrom(await call('POST', '/api/auth/register', { body: { username: 'claire', password: 'motdepasse1' } }));
  await call('POST', '/api/projects/import', { cookie, body: { projects: [{ id: 'proj-1', name: 'Avant' }] } });
  const updated = await call('PUT', '/api/projects/proj-1', { cookie, body: { project: { id: 'proj-1', name: 'Après' } } });
  assert.equal(updated.status, 200);
  assert.equal((await call('GET', '/api/projects', { cookie })).json.projects[0].name, 'Après');
  assert.equal((await call('DELETE', '/api/projects/proj-1', { cookie })).status, 204);
  assert.deepEqual((await call('GET', '/api/projects', { cookie })).json.projects, []);
});

test('sans session, les projets sont inaccessibles', async () => {
  reset();
  assert.equal((await call('GET', '/api/projects')).status, 401);
  assert.equal((await call('PUT', '/api/projects/proj-1', { body: { project: { id: 'proj-1' } } })).status, 401);
});

test('hébergement sans disque persistant : refus explicite', async () => {
  reset();
  process.env.VERCEL = '1';
  const previous = process.env.DATA_DIR;
  delete process.env.DATA_DIR;
  const res = await call('GET', '/api/auth/session');
  assert.equal(res.status, 503, 'un hébergement non persistant doit refuser franchement');
  assert.match(res.json.error, /persistant/);
  process.env.DATA_DIR = previous;
  delete process.env.VERCEL;
});

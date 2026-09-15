import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

/**
 * Un faux Upstash : même protocole REST (commande JSON dans le corps,
 * reponse { result }). Il permet de verifier l'adaptateur distant sans
 * dependre du reseau ni d'un vrai compte.
 */
function startMockRedis() {
  const store = new Map();
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      let command = [];
      try { command = JSON.parse(body); } catch { command = []; }
      const [name, ...args] = Array.isArray(command) ? command : [];
      const op = String(name || '').toUpperCase();
      let result = null;
      if (op === 'GET') result = store.has(args[0]) ? store.get(args[0]) : null;
      else if (op === 'SET') { store.set(args[0], args[1]); result = 'OK'; }
      else if (op === 'DEL') result = store.delete(args[0]) ? 1 : 0;
      else if (op === 'PING') result = 'PONG';
      else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'commande inconnue: ' + op }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ result }));
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, store, url: 'http://127.0.0.1:' + server.address().port });
    });
  });
}

test('store distant : la base survit dans Redis via l API REST', async () => {
  const mock = await startMockRedis();
  const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
  const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.UPSTASH_REDIS_REST_URL = mock.url;
  process.env.UPSTASH_REDIS_REST_TOKEN = 'jeton-de-test';
  try {
    const store = await import('../server/store.js');
    assert.equal(store.isRemoteStore(), true, 'un store distant doit etre detecte');
    assert.equal(store.isPersistentHost(), true, 'un store distant rend l hote persistant');

    const db = { version: 1, users: [{ id: 'u1', username: 'mock.probe' }], sessions: [], projects: [] };
    await store.writeDb(db);
    const back = await store.readDb();
    assert.equal(back.users.length, 1);
    assert.equal(back.users[0].username, 'mock.probe');
    assert.ok(mock.store.get('artisite:db:v1').includes('mock.probe'), 'la base doit etre rangee sous la cle dediee');

    // La purge des sessions expirees reste vraie quel que soit le backend.
    const now = Date.now();
    const purged = store.purgeExpiredSessions({ sessions: [{ expiresAt: now - 1 }, { expiresAt: now + 10000 }] }, now);
    assert.equal(purged, 1);
  } finally {
    await new Promise((resolve) => mock.server.close(resolve));
    if (previousUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL; else process.env.UPSTASH_REDIS_REST_URL = previousUrl;
    if (previousToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN; else process.env.UPSTASH_REDIS_REST_TOKEN = previousToken;
  }
});

test('store distant : une panne ne renvoie jamais une base vide silencieuse', async () => {
  const mock = await startMockRedis();
  process.env.UPSTASH_REDIS_REST_URL = mock.url;
  process.env.UPSTASH_REDIS_REST_TOKEN = 'jeton-de-test';
  try {
    const store = await import('../server/store.js');
    await store.writeDb({ version: 1, users: [{ id: 'u1' }], sessions: [], projects: [] });
    assert.equal((await store.readDb()).users.length, 1);
    await new Promise((resolve) => mock.server.close(resolve));
    // Redis injoignable : readDb doit lever, pas renvoyer une base vide qui
    // ecraserait les donnees reelles a la premiere ecriture suivante.
    await assert.rejects(() => store.readDb());
  } finally {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  }
});

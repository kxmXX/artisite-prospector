import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

/**
 * Un faux Vercel Blob fonde sur des instantanes immuables : PUT ecrit un nouveau
 * nom, GET / renvoie la liste, GET /<nom> renvoie le contenu, DELETE supprime.
 * Verifie le backend Blob sans dependre du reseau.
 */
function startMockBlob() {
  const files = new Map();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const base = 'http://127.0.0.1:' + server.address().port;
    const json = (status, payload) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    };
    if (req.method === 'GET' && url.pathname === '/') {
      const prefix = url.searchParams.get('prefix') || '';
      const blobs = Array.from(files.keys())
        .filter((pathname) => pathname.startsWith(prefix))
        .sort()
        .map((pathname) => ({ pathname, url: base + '/' + pathname, size: files.get(pathname).length }));
      json(200, { hasMore: false, blobs });
      return;
    }
    const pathname = url.pathname.replace(/^\//, '');
    if (req.method === 'PUT') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => { files.set(pathname, body); json(200, { pathname, url: base + '/' + pathname }); });
      return;
    }
    if (req.method === 'GET') {
      if (!files.has(pathname)) { json(404, { error: { code: 'not_found' } }); return; }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(files.get(pathname));
      return;
    }
    if (req.method === 'DELETE') {
      files.delete(pathname);
      json(200, { deleted: true });
      return;
    }
    json(405, { error: { code: 'method_not_allowed' } });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, url: 'http://127.0.0.1:' + server.address().port }));
  });
}

test('store Blob : instantanes immuables, la lecture prend le plus recent', async () => {
  const mock = await startMockBlob();
  const previous = { token: process.env.BLOB_READ_WRITE_TOKEN, base: process.env.BLOB_UPLOAD_BASE };
  process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_teststore_secret';
  process.env.BLOB_UPLOAD_BASE = mock.url;
  try {
    const store = await import('../server/store.js');
    assert.equal(store.storeBackend(), 'blob', 'Blob doit primer quand le jeton est present');
    assert.equal(store.isPersistentHost(), true);

    // Premier demarrage : aucun instantane -> base vide, sans erreur.
    assert.equal((await store.readDb()).users.length, 0);

    await store.writeDb({ version: 1, users: [{ id: 'a' }], sessions: [], projects: [] });
    assert.equal((await store.readDb()).users[0].id, 'a');

    // Une deuxieme ecriture doit etre vue immediatement : c'est precisement ce qui
    // casse si l'on ecrase un blob au lieu d'en creer un nouveau.
    await new Promise((resolve) => setTimeout(resolve, 5));
    await store.writeDb({ version: 1, users: [{ id: 'b' }], sessions: [], projects: [] });
    const second = await store.readDb();
    assert.equal(second.users.length, 1);
    assert.equal(second.users[0].id, 'b');
  } finally {
    await new Promise((resolve) => mock.server.close(resolve));
    if (previous.token === undefined) delete process.env.BLOB_READ_WRITE_TOKEN; else process.env.BLOB_READ_WRITE_TOKEN = previous.token;
    if (previous.base === undefined) delete process.env.BLOB_UPLOAD_BASE; else process.env.BLOB_UPLOAD_BASE = previous.base;
  }
});

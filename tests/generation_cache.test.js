import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApiRequest, clearAiCache } from '../server/apiHandler.js';

test('generation cache isolates complete context and only reuses exact validated requests', async t => {
  const oldFetch = globalThis.fetch;
  const oldKey = process.env.GEMINI_API_KEY;
  const oldModels = process.env.GEMINI_MODELS;
  process.env.GEMINI_API_KEY = 'test-only-not-a-real-key';
  process.env.GEMINI_MODELS = 'test-model';
  clearAiCache();
  t.after(() => {
    globalThis.fetch = oldFetch;
    for (const [key, value] of [['GEMINI_API_KEY', oldKey], ['GEMINI_MODELS', oldModels]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    clearAiCache();
  });
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    calls++;
    const prompt = JSON.parse(options.body).contents[0].parts[0].text;
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{
      text: JSON.stringify({ requestNumber: calls, prompt })
    }] } }] }) };
  };
  const request = async body => {
    let status, data;
    await handleApiRequest({ method: 'POST', url: '/api/ai/generate', body }, {
      writeHead(code) { status = code; },
      end(text) { data = JSON.parse(text); }
    });
    return { status, ...data };
  };
  const base = { name: 'Atelier_A', trade: 'plombier', city: 'Lyon', phone: '0100000000', region: 'Région A', tone: 'artisan', ambiance: 'mineral' };
  const first = await request(base);
  assert.equal(first.source, 'gemini');
  assert.equal(first.status, 200);
  const repeat = await request(Object.fromEntries(Object.entries(base).reverse()));
  assert.equal(repeat.source, 'cache');
  assert.deepEqual(repeat.data, first.data);
  assert.equal(calls, 1);
  for (const [field, value] of Object.entries({ phone: '0200000000', region: 'Région B', name: 'atelier_A', trade: 'menuisier', city: 'Paris', tone: 'sobre', ambiance: 'dark' })) {
    const before = calls;
    const changed = await request({ ...base, [field]: value });
    assert.equal(changed.source, 'gemini', field);
    assert.equal(calls, before + 1, field);
    if (field === 'phone' || field === 'region') assert.ok(changed.data.prompt.includes(value));
  }
  const a = await request({ ...base, name: 'A_B', trade: 'C' });
  const b = await request({ ...base, name: 'A', trade: 'B_C' });
  assert.notEqual(a.data.requestNumber, b.data.requestNumber, 'delimiter collisions are impossible');
  for (const invalid of [[], { ...base, phone: {} }, { ...base, region: 'x'.repeat(501) }]) {
    const before = calls;
    assert.equal((await request(invalid)).status, 400);
    assert.equal(calls, before, 'invalid context never calls the model');
  }
  delete process.env.GEMINI_API_KEY;
  const unconfigured = await request(base);
  assert.equal(unconfigured.source, 'local_engine');
  assert.equal(unconfigured.success, false, 'old cache must not conceal missing configuration');
});

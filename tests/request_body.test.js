import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readBodyJSON, handleApiRequest } from '../server/apiHandler.js';

const limit = 2 * 1024 * 1024;
function streamed(text) {
  const req = new EventEmitter();
  const result = readBodyJSON(req);
  req.emit('data', Buffer.from(text));
  req.emit('end');
  return result;
}
const transports = [text => readBodyJSON({ body: text }),
  text => readBodyJSON({ body: Buffer.from(text) }), streamed];

test('raw transports accept objects and empty bodies, reject malformed and non-object JSON', async () => {
  for (const read of transports) {
    assert.deepEqual(await read('{"name":"Élodie 🌿"}'), { name: 'Élodie 🌿' });
    assert.deepEqual(await read(''), {});
    for (const text of ['{', ' ', 'null', '[]', '42', 'true', '"text"']) {
      await assert.rejects(read(text), { statusCode: 400 });
    }
  }
});

test('all transports enforce the exact UTF-8 byte boundary', async () => {
  const text = JSON.stringify({ x: 'é'.repeat((limit - 8) / 2) });
  assert.equal(Buffer.byteLength(text), limit);
  const oversized = text.replace('é', 'éé');
  for (const read of [...transports, text => readBodyJSON({ body: JSON.parse(text) })]) {
    assert.equal((await read(text)).x.length, (limit - 8) / 2);
    await assert.rejects(read(oversized), { statusCode: 413 });
  }
});

test('stream preserves multibyte characters split across chunks', async () => {
  const req = new EventEmitter();
  const result = readBodyJSON(req);
  for (const byte of Buffer.from('{"x":"É🌿"}')) req.emit('data', Buffer.from([byte]));
  req.emit('end');
  assert.deepEqual(await result, { x: 'É🌿' });
});

test('preparsed bodies require a serializable plain object', async () => {
  const circular = {}; circular.self = circular;
  for (const body of [null, [], 2, false, new Date(), circular, { x: 1n }]) {
    await assert.rejects(readBodyJSON({ body }), { statusCode: 400 });
  }
  assert.deepEqual(await readBodyJSON({ body: Object.assign(Object.create(null), { x: 1 }) }), { x: 1 });
});

test('stream errors and aborts reject; oversized requests do not destroy the connection', async () => {
  for (const event of ['error', 'aborted']) {
    const req = new EventEmitter();
    const result = readBodyJSON(req);
    req.emit(event, new Error('disconnected'));
    await assert.rejects(result);
  }
  const req = new EventEmitter();
  req.destroy = () => assert.fail('must allow an HTTP error response');
  const result = readBodyJSON(req);
  req.emit('data', Buffer.alloc(limit + 1));
  req.emit('data', Buffer.from('ignored'));
  req.emit('end');
  req.emit('error', new Error('late error'));
  await assert.rejects(result, { statusCode: 413 });
});

test('API returns controlled JSON errors without invoking the model', async t => {
  const original = globalThis.fetch;
  globalThis.fetch = () => assert.fail('unexpected network call');
  t.after(() => { globalThis.fetch = original; });
  for (const [body, expected] of [['{', 400], ['[]', 400], ['x'.repeat(limit + 1), 413]]) {
    let status, response;
    await handleApiRequest({ method: 'POST', url: '/api/ai/generate', body }, {
      writeHead(code) { status = code; }, end(text) { response = JSON.parse(text); }
    });
    assert.equal(status, expected);
    assert.ok(response.error);
  }
});

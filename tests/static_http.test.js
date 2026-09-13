import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

test('real HTTP server rejects invalid paths and stays available', { timeout: 15000 }, async t => {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: new URL('../', import.meta.url),
    env: { ...process.env, PORT: '0', HOST: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let stderr = '';
  child.stderr.on('data', chunk => { stderr += chunk; });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const closed = once(child, 'exit');
      child.kill();
      await closed;
    }
  });
  const port = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('Server startup timed out')), 5000);
    child.once('error', err => { clearTimeout(timer); reject(err); });
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exited ${code}: ${stderr}`)); });
    child.stdout.on('data', chunk => {
      output += chunk;
      const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (match) { clearTimeout(timer); resolve(Number(match[1])); }
    });
  });
  const request = (path, headers = {}) => new Promise((resolve, reject) => {
    // http.request preserves dot segments; fetch normalizes them before sending.
    const req = http.get({ host: '127.0.0.1', port, path, headers }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      res.on('error', reject);
    });
    req.setTimeout(2500, () => req.destroy(new Error('HTTP timeout')));
    req.on('error', reject);
  });
  for (const [path, status] of [
    ['/%00', 400], ['/api/%00', 400], ['/%', 400], ['/%E0%A4%A', 400],
    ['/%0a', 400], ['/%5csecret', 400], ['/..%2fpackage.json', 400],
    ['/../package.json', 403], ['/%2e%2e/package.json', 403],
    ['/../public-other/secret.txt', 403]
  ]) {
    const response = await request(path);
    assert.equal(response.status, status, path);
    assert.ok(!response.body.includes('Error:') && !response.body.includes('package.json'));
    const health = await request('/api/health');
    assert.equal(health.status, 200, `server alive after ${path}`);
    assert.equal(JSON.parse(health.body).status, 'ok');
  }
  const root = await request('/');
  assert.equal(root.status, 200);
  assert.match(root.headers['content-type'], /text\/html/);
  assert.equal((await request('/unknown-prospect-route')).body, root.body);
  const css = await request('/css/app.css');
  assert.equal(css.status, 200);
  assert.match(css.headers['content-type'], /text\/css/);
  assert.equal((await request('/css/app.css', { 'If-None-Match': css.headers.etag })).status, 304);
  const js = await request('/js/app.js');
  assert.equal(js.status, 200);
  assert.match(js.headers['content-type'], /application\/javascript/);
  assert.equal(child.exitCode, null);
  assert.equal(stderr, '');
});

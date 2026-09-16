import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('le comparateur avant/après propose plusieurs styles graphiques', () => {
  const renderer = read('public/js/components/renderer.js');
  assert.match(renderer, /data-split-style=/);
  const css = read('public/css/app.css');
  for (const style of ['minimal', 'fleches', 'contraste']) {
    assert.match(css, new RegExp('data-split-style="' + style + '"'), style + ' doit exister');
  }
  const inspector = read('public/js/components/inspector.js');
  assert.match(inspector, /setComparatorStyle/);
  const app = read('public/js/app.js');
  assert.match(app, /setComparatorStyle\(sectionId, style\)/);
});

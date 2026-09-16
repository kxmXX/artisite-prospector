import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test("les animations sont figees pendant un transform libre, puis reprennent", () => {
  const css = read('public/css/studio-v3.css');
  const app = read('public/js/app.js');

  // Tous les elements du canevas sont figes, pas seulement la selection : les
  // reperes d'aimantation mesurent des positions stables.
  assert.match(css, /body\.freeform-transforming #canvas-container \[data-layout-key\],/);
  assert.match(css, /body\.freeform-transforming #canvas-container \[data-layout-key\] \*/);
  assert.match(css, /body\.freeform-rotating #canvas-container \[data-layout-key\],/);
  assert.match(css, /animation-play-state:paused!important/);

  // La classe est posee et retiree autour du geste.
  assert.match(app, /document\.body\.classList\.add\("freeform-transforming"/);
  assert.match(app, /document\.body\.classList\.remove\("freeform-transforming"/);

  // La pause ne doit exister que pendant le geste : sinon une animation ne
  // repartirait jamais.
  const pauses = css.split('\n').filter((line) => line.includes('animation-play-state:paused!important'));
  assert.ok(pauses.length >= 1, 'la pause doit exister');
  for (const line of pauses) {
    assert.match(line, /freeform-(transforming|rotating)/, 'la pause doit rester bornee au geste : ' + line.trim());
  }
});

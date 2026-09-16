import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FREEFORM_DROP_COVERAGE } from '../public/js/engine/freeform.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('la depose magnetique exige un vrai recouvrement', () => {
  assert.ok(FREEFORM_DROP_COVERAGE >= 0.5 && FREEFORM_DROP_COVERAGE <= 0.95,
    'le seuil de recouvrement doit etre exigeant mais atteignable');
  const app = read('public/js/app.js');
  const start = app.indexOf('findFreeformDropSlot(rect, draggedKeys = []) {');
  assert.ok(start > -1, 'la methode doit exister');
  const method = app.slice(start, app.indexOf('clearFreeformDropSlot() {', start));
  assert.match(method, /overlapWidth/, 'le recouvrement doit etre calcule');
  assert.match(method, /coverage >= FREEFORM_DROP_COVERAGE/, 'le seuil doit etre applique');
  assert.ok(!/distance <= 48/.test(method), 'plus de depot sur simple proximite');
});
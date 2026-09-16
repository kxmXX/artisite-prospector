import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test("le glisser d'une image illumine puis attache l'emplacement survolé", () => {
  const app = read('public/js/app.js');
  assert.match(app, /findFreeformDropSlot\(rect, draggedKeys/);
  assert.match(app, /commitFreeformDropSlot\(entries, slot\)/);
  assert.match(app, /is-freeform-drop-slot/);
  assert.match(app, /buildFreeformSlotIndex\(\)/);
  const css = read('public/css/studio-v3.css');
  assert.match(css, /\.is-freeform-drop-slot\{outline:3px solid #2563eb/, "l'emplacement doit s'illuminer");
});

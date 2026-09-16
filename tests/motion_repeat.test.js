import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test("la répétition d'animation couvre tous les identifiants et s'arrête dans l'éditeur", () => {
  const css = fs.readFileSync(path.join(root, 'public/css/app.css'), 'utf8');
  for (const id of ['once', 'twice', 'thrice', 'loop', 'infinite']) {
    assert.match(css, new RegExp('\\[data-motion-loop="' + id + '"]'), id + ' doit être géré par le CSS');
  }
  // Le catalogue dit « loop » : sans cette règle, la boucle ne bouclait pas.
  assert.match(css, /\[data-motion-loop="loop"\] \{ animation-iteration-count: infinite/);
  // Dans l'éditeur, la boucle est plafonnée pour ne pas tourner sans fin.
  assert.match(css, /body:not\(\.client-preview-mode\) #canvas-container \[data-motion-loop="loop"\]/);
});

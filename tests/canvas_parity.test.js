import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = fs.readFileSync(path.join(root, 'public/css/studio-v3.css'), 'utf8');

test("la vue client rend le site à la même largeur que le canevas de l'éditeur", () => {
  // Grand écran : rail 66 + volet Structure 286 + propriétés 318 = 670, plus 56 de padding.
  assert.match(css, /body\.client-preview-mode #canvas-container\[data-viewport="desktop"\] \{ max-width: calc\(100vw - 726px\)/);
  // Écran moyen : rail 62 + volet 270 = 332, plus 56 de padding.
  assert.match(css, /body\.client-preview-mode #canvas-container\[data-viewport="desktop"\] \{ max-width: calc\(100vw - 388px\)/);
});

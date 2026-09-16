import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('le panneau de proprietes garde sa position au re-rendu', () => {
  const app = read('public/js/app.js');
  // Re-rendu complet de l'editeur.
  assert.match(app, /previousInspectorScroll/, 'la position doit etre capturee avant le rendu');
  assert.match(app, /panel\.scrollTop = previousInspectorScroll/, 'et restauree apres');
  // Rafraichissement du seul panneau.
  assert.match(app, /previousScrollTop/, 'le rafraichissement doit aussi capturer la position');
  assert.match(app, /panel\.scrollTop = previousScrollTop/, 'et la restaurer');
});
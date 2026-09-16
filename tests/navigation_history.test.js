import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test("le bouton Retour ne double pas les destinations et ferme la surcouche", () => {
  const app = read('public/js/app.js');
  assert.match(app, /if \(!replace && url === currentUrl\) return;/, "l'historique ne doit pas empiler deux fois la même destination");
  assert.match(app, /if \(state\.activeDrawer\) \{ state\.closeDrawer\(\); this\.renderModals\(\); return; \}/, 'Retour doit fermer la surcouche ouverte');
  const state = read('public/js/state.js');
  assert.match(state, /window\.history\.pushState\(\{ artisite: true, modal: drawerName \}/, 'une surcouche doit poser une entrée d\'historique');
});

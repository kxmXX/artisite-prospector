import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('le volet Structure/Réglages se referme aussi sur desktop', () => {
  const css = read('public/css/studio-v3.css');
  assert.match(css, /\.studio-v3-structure-panel\.is-collapsed \{ display:none; \}/, 'une règle desktop doit masquer le volet replié');
  assert.match(css, /@media \(min-width: 981px\) \{[\s\S]*\.studio-v3-mobile-close \{ display:grid/, 'le bouton fermer doit être visible sur desktop');

  const editor = read('public/js/components/editor.js');
  assert.match(editor, /studio-v3-structure-panel\$\{state\.structurePanelCollapsed \? ' is-collapsed' : ''\}/, "l'état doit piloter le rendu du volet");
  assert.match(editor, /setStructurePanelCollapsed\(true\)/, 'le bouton fermer doit replier le volet');

  const app = read('public/js/app.js');
  assert.match(app, /setStructurePanelCollapsed\(collapsed\)/);
});

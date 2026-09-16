import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('une entrée de galerie peut recevoir ses deux photos avant/après', () => {
  const app = read('public/js/app.js');
  assert.match(app, /beforeImage\|afterImage/, "l'écriture doit viser avant ou après selon le champ");
  const inspector = read('public/js/components/inspector.js');
  assert.match(inspector, /Photo avant/);
  assert.match(inspector, /Photo après/);
  assert.match(inspector, /photos\.\$\{index\}\.beforeImage/);
  assert.match(inspector, /photos\.\$\{index\}\.afterImage/);
});

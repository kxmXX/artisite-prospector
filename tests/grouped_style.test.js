import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test("l'édition groupée applique le style de l'élément à toute la section", () => {
  const app = read('public/js/app.js');
  assert.match(app, /applyElementStyleToSection\(sectionId\)/);
  assert.match(app, /collectSectionElements\(state\.currentProject, section\)/);
  const inspector = read('public/js/components/inspector.js');
  assert.match(inspector, /window\.app\.applyElementStyleToSection/);
});

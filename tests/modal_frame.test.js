import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test("les modales partagent la charte de l'éditeur (classe de thème appliquée)", () => {
  const modals = [
    'public/js/components/imageModal.js',
    'public/js/components/closerModal.js',
    'public/js/components/authModal.js',
    'public/js/components/commandPalette.js',
    'public/js/components/shareModal.js',
    'public/js/components/wizard.js',
    'public/js/components/addSectionModal.js'
  ];
  for (const modal of modals) {
    assert.match(read(modal), /studio-v3-modal-frame/, modal + ' doit porter la charte');
  }
  const css = read('public/css/studio-v3.css');
  assert.match(css, /\.studio-v3-modal-frame input:not\(\[type="color"\]\)[\s\S]*?border-color: var\(--v3-line\)/, 'la règle de thème ne doit pas rester un sélecteur orphelin');
});

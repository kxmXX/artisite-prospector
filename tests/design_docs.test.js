import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('PRODUCT.md capture la vérité produit sans inventer', () => {
  const product = read('PRODUCT.md');
  assert.ok(product.includes('impeccable:product-schema 1'), 'le marqueur de schéma doit être présent');
  assert.match(product, /## Platform\s+\n\s*web/);
  for (const heading of ['## Users', '## Product Purpose', '## Positioning', '## Operating Context', '## Capabilities and Constraints', '## Evidence on Hand', '## Product Principles']) {
    assert.ok(product.includes(heading), 'section manquante : ' + heading);
  }
  // L'auteur a confirmé qu'il n'y a aucune preuve réelle : le document doit le dire.
  assert.match(product, /démonstration/i, "l'absence de preuves réelles doit être explicite");
  assert.match(product, /[Rr]evendeur/, "l'utilisateur principal confirmé est le revendeur");
});

test("DESIGN.md décrit le système existant dans le format attendu", () => {
  const design = read('DESIGN.md');
  assert.ok(design.startsWith('---'), 'le frontmatter doit ouvrir le fichier');
  const end = design.indexOf('\n---', 3);
  assert.ok(end > 0, 'le frontmatter doit être fermé');
  const frontmatter = design.slice(3, end);
  for (const key of ['name:', 'description:', 'colors:', 'typography:', 'rounded:', 'spacing:', 'components:']) {
    assert.ok(frontmatter.includes(key), 'jeton manquant : ' + key);
  }
  for (const heading of ['## Overview', '## Colors', '## Typography', '## Layout', '## Elevation & Depth', '## Shapes', '## Components', "## Do's and Don'ts"]) {
    assert.ok(design.includes(heading), 'section manquante : ' + heading);
  }
  // Les jetons doivent refléter le vrai système, pas une invention.
  const tokens = read('public/css/tokens.css');
  for (const value of ['#18201f', '#d76a3b', '#1f6feb']) {
    assert.ok(tokens.toLowerCase().includes(value), 'valeur absente des jetons : ' + value);
    assert.ok(design.toLowerCase().includes(value), 'valeur absente de DESIGN.md : ' + value);
  }
  assert.match(design, /scaleX/, 'la règle de la barre de progression doit être documentée');
});

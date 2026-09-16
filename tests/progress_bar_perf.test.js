import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSite } from '../public/js/engine/generator.js';
import { renderWebsiteHTML } from '../public/js/components/renderer.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test("la barre de progression anime transform, jamais la mise en page", () => {
  const css = read('public/css/app.css');
  const start = css.indexOf('.campaign-progress-fill {');
  assert.ok(start > -1, 'la règle doit exister');
  const rule = css.slice(start, css.indexOf('}', start));
  assert.match(rule, /transform: scaleX/, 'la barre doit être composée par transform');
  assert.doesNotMatch(rule, /transition: width/, 'animer width recalculerait la mise en page');
  assert.doesNotMatch(css, /transition: width/, 'aucune règle ne doit animer la largeur');
  // La même règle est dupliquée pour l'export autonome.
  const exporter = read('public/js/engine/exporter.js');
  assert.match(exporter, /campaign-progress-fill {[^}]*transform: scaleX/);
});

test("le rendu fournit la progression sans largeur en ligne", () => {
  const project = generateSite({ name: 'Progression', tradeId: 'menuisier', city: 'Lyon' });
  const html = renderWebsiteHTML(project, { isEditor: false });
  for (const match of html.matchAll(/<div class="campaign-progress-fill" style="([^"]*)"><\/div>/g)) {
    assert.match(match[1], /--campaign-progress:/, 'la progression voyage par variable');
    assert.doesNotMatch(match[1], /width\s*:/, 'plus de largeur en ligne');
  }
  assert.match(read('public/js/components/renderer.js'), /--campaign-progress:/);
});

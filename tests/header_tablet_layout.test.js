import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSite } from '../public/js/engine/generator.js';
import { renderWebsiteHTML } from '../public/js/components/renderer.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test("l'en-tete tient sur tablette : le numero ne passe plus a la ligne", () => {
  const renderer = read('public/js/components/renderer.js');
  const header = renderer.slice(renderer.indexOf('function renderHeader'));
  // Le numero n'apparait qu'a partir de lg : sur tablette, la navigation et le
  // bouton de devis gardent la place, et le numero reste dans le hero et la barre collante.
  assert.match(header, /hidden lg:inline-flex[^>]*whitespace-nowrap/, 'le numero doit attendre lg et ne pas se couper');
  assert.ok(!/hidden sm:inline-flex[^>]*data-editable="phone"/.test(header), 'plus de numero des 640 px');
  // Ecart de navigation resserre sur la plage tablette.
  const css = read('public/css/app.css');
  assert.match(css, /@media \(min-width: 768px\) and \(max-width: 1023px\) \{[\s\S]*?\.vitrine-site-header-inner \.vitrine-site-nav \{ gap: 1\.15rem; \}/,
    'la navigation doit se resserrer sur tablette');
});

test("le rendu tablette reste coherent dans le HTML publie", () => {
  const project = generateSite({ name: 'Tablette Header', tradeId: 'paysagiste', city: 'Montauban' });
  const headerSection = project.sections.find((section) => section.type === 'header');
  headerSection.content.phone = '07 82 14 39 50';
  const html = renderWebsiteHTML(project, { isEditor: false });
  const header = html.slice(html.indexOf('<header'), html.indexOf('</header>'));
  assert.ok(header.includes('hidden lg:inline-flex'), 'le numero passe en lg');
  assert.ok(header.includes('hidden md:flex'), 'la navigation reste visible des md');
  assert.ok(header.includes('Demander un devis'), 'le bouton de devis reste present');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getElementFontSize, setElementFontSize, elementFontSizeCSS, clearElementStyle } from '../public/js/engine/elementStyle.js';
import { renderWebsiteHTML } from '../public/js/components/renderer.js';
import { generateSite } from '../public/js/engine/generator.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('la taille de texte est rangee par cle d element, pas par champ', () => {
  let project = { sections: [], elementStyles: {} };
  project = setElementFontSize(project, 'elt-A', 4);
  project = setElementFontSize(project, 'elt-B', 0);
  assert.equal(getElementFontSize(project, 'elt-A'), 4);
  assert.equal(getElementFontSize(project, 'elt-B'), 0, 'un autre element garde sa taille');
  const css = elementFontSizeCSS(project);
  assert.ok(css.includes('data-layout-key="elt-A"'), 'seul l element modifie est cible');
  assert.ok(!css.includes('data-layout-key="elt-B"'), 'l autre element n est pas touche');
});

test('le rendu ne partage plus la taille entre elements du meme champ', () => {
  const project = generateSite({ name: 'Taille', tradeId: 'paysagiste', city: 'Lyon' });
  project.elementFontSizes = { 'clef-1': 6 };
  const html = renderWebsiteHTML(project, { isEditor: false });
  assert.ok(html.includes('data-element-font-size'), 'la feuille de tailles doit etre injectee');
  assert.ok(html.includes('[data-layout-key="clef-1"] { font-size: calc(1em + 6px) !important; }'));
});

test('le bouton A+ de la barre flottante ecrit par cle d element', () => {
  const app = read('public/js/app.js');
  const start = app.indexOf('adjustActiveTextFontSize(delta) {');
  const method = app.slice(start, app.indexOf('adjustActiveTextFontSizeSlider', start));
  assert.ok(method.includes('data-layout-key'), 'la barre doit lire la cle de l element');
  assert.ok(method.includes('setElementFontSize') || method.includes('applyActiveTextFontSize'), 'elle doit ecrire par cle');
  assert.ok(!method.includes('fontSize_'), 'plus d ecriture par champ');
});

test('reinitialiser le style d un element efface aussi sa taille', () => {
  const project = { elementStyles: { k1: { padding: 'compact' } }, elementFontSizes: { k1: 5 } };
  const next = clearElementStyle(project, 'k1');
  assert.equal((next.elementFontSizes || {}).k1, undefined, 'la taille de l element doit disparaitre');
  assert.equal((next.elementStyles || {}).k1, undefined, 'le style de l element doit disparaitre');
});
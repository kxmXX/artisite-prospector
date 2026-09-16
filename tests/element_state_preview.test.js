import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSite } from '../public/js/engine/generator.js';
import { renderInspector } from '../public/js/components/inspector.js';
import { elementStateDeclarations, elementStateCSS } from '../public/js/engine/elementStates.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test("l'aperçu partage exactement les déclarations du CSS publié", () => {
  const project = { elementStates: { k1: { hover: { color: '#fff', 'border-color': '#000' } } } };
  const body = elementStateDeclarations(project, 'k1', 'hover');
  assert.equal(body, 'color: #fff; border-color: #000;');
  assert.ok(elementStateCSS(project).includes('[data-layout-key="k1"]:hover { ' + body + ' }'),
    'le CSS publié doit utiliser la même source que l\'aperçu');
  assert.equal(elementStateDeclarations(project, 'inconnu', 'hover'), '', 'un élément sans état ne déclare rien');
});

test("l'inspecteur n'offre l'aperçu que pour un état, pas pour le style principal", () => {
  const project = generateSite({ name: 'Apercu', tradeId: 'menuisier', city: 'Lyon' });
  const section = project.sections[0];
  const base = { selectedElementKey: 'k1', elementStyleState: 'default', viewport: 'desktop', editorMode: 'design' };
  assert.doesNotMatch(renderInspector(section, project, base), /previewElementState/);
  for (const stateName of ['hover', 'focus', 'active', 'disabled']) {
    const html = renderInspector(section, project, Object.assign({}, base, { elementStyleState: stateName }));
    assert.match(html, /previewElementState\(\)/, stateName + ' doit pouvoir être prévisualisé');
  }
});

test("l'aperçu reste temporaire et ne modifie pas le projet", () => {
  const app = read('public/js/app.js');
  const start = app.indexOf('previewElementState() {');
  assert.ok(start > -1, 'la méthode doit exister');
  const method = app.slice(start, app.indexOf('clearSelectedElementState() {', start));
  assert.ok(method.includes('setTimeout'), "l'aperçu doit se retirer tout seul");
  assert.ok(method.includes('stopElementStatePreview'), "l'aperçu doit pouvoir être arrêté");
  assert.ok(!method.includes('updateProject'), "l'aperçu ne doit pas écrire dans le projet");
  assert.ok(method.includes('elementStateDeclarations'), 'il doit réutiliser les déclarations de l\'état');
});

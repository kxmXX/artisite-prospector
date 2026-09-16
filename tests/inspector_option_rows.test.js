import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSite } from '../public/js/engine/generator.js';
import { renderInspector } from '../public/js/components/inspector.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test("les rangees d'options de l'inspecteur ne se chevauchent plus", () => {
  const inspector = read('public/js/components/inspector.js');
  // La rangee d etats et le generateur d options doivent utiliser la grille qui
  // se replie, pas le flex d une seule ligne prevu pour les libelles courts.
  assert.match(inspector, /motion-option-row">' \+ \[\['default', 'Principal'\]\]/, 'rangee d etats en grille');
  assert.match(inspector, /motion-option-row">' \+ Object\.keys\(scale\)/, 'rangee d options en grille');
  const css = read('public/css/app.css');
  const start = css.indexOf('.motion-option-row {');
  assert.ok(start > -1, 'la regle de grille doit exister');
  const rule = css.slice(start, css.indexOf('}', start));
  assert.match(rule, /display: grid/, 'la rangee doit etre une grille');
  assert.match(rule, /minmax\(78px, 1fr\)/, 'les colonnes doivent avoir une largeur minimale');
  const bStart = css.indexOf('.motion-option-row .motion-loop-btn');
  const buttonRule = css.slice(bStart, css.indexOf('}', bStart));
  assert.match(buttonRule, /white-space: normal/, 'un libelle long doit pouvoir se replier');
  assert.match(buttonRule, /min-width: 0/, 'un bouton ne doit pas deborder de sa colonne');
});

test("l'inspecteur rendu contient bien la grille d'options", () => {
  const project = generateSite({ name: 'Options', tradeId: 'menuisier', city: 'Lyon' });
  const section = project.sections[0];
  const state = { selectedElementKey: 'k1', elementStyleState: 'default', viewport: 'desktop', editorMode: 'design' };
  const html = renderInspector(section, project, state);
  assert.ok(html.includes('motion-option-row'), 'la grille doit etre dans le rendu');
  assert.ok(html.includes('Police du th'), 'les polices doivent etre proposees');
  assert.ok(html.includes('motion-option-row">' + '<button'), 'les boutons doivent etre dans la grille');
});
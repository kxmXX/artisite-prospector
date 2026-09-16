import test from 'node:test';
import assert from 'node:assert/strict';
import { setElementStyle, elementStyleCSS, declarationsFor, getElementStyle, ELEMENT_FONT } from '../public/js/engine/elementStyle.js';

const project = () => ({ elementStyles: {} });

test("la police d'un élément produit une famille ciblée", () => {
  const current = setElementStyle(project(), 'E1', 'font', 'clash');
  assert.match(elementStyleCSS(current), /\[data-layout-key="E1"\] \{ font-family: 'Clash Display', system-ui, sans-serif; \}/);
  assert.equal(getElementStyle(current, 'E1').font, 'clash');
  assert.equal(declarationsFor('font', 'inconnu'), null, 'une police hors catalogue ne produit rien');
  // Aucune valeur libre : tout passe par l'énumération.
  assert.ok(ELEMENT_FONT.theme && ELEMENT_FONT.mono);
});

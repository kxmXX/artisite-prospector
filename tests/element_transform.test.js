import test from 'node:test';
import assert from 'node:assert/strict';

const t = await import('../public/js/engine/elementTransform.js');
const { buildFreeformLayoutCSS } = await import('../public/js/components/renderer.js');

const project = () => ({ id: 'p1', business: {}, branding: {}, sections: [], freeformLayout: {} });

test('un element non positionne ne renvoie aucune valeur inventee', () => {
  const values = t.getElementTransform(project(), 'E1', 'desktop');
  assert.deepEqual(values, { x: null, y: null, width: null, height: null, rotation: null });
  assert.equal(t.hasElementTransform(project(), 'E1', 'desktop'), false);
});

test('poser une valeur cree la position libre, palier par palier', () => {
  const current = t.setElementTransform(project(), 'E1', 'desktop', 'x', 120);
  assert.equal(t.getElementTransform(current, 'E1', 'desktop').x, 120);
  assert.equal(t.hasElementTransform(current, 'E1', 'desktop'), true);
  assert.equal(t.getElementTransform(current, 'E1', 'tablet').x, null, 'chaque palier a ses propres valeurs');
});

test('les bornes sont respectees et une saisie vide retire le champ', () => {
  let current = t.setElementTransform(project(), 'E1', 'desktop', 'width', 0);
  assert.equal(t.getElementTransform(current, 'E1', 'desktop').width, 1, 'une largeur ne peut pas etre nulle');
  current = t.setElementTransform(current, 'E1', 'desktop', 'rotation', 999);
  assert.equal(t.getElementTransform(current, 'E1', 'desktop').rotation, 180);
  current = t.setElementTransform(current, 'E1', 'desktop', 'width', '');
  assert.equal(t.getElementTransform(current, 'E1', 'desktop').width, null, 'vider un champ le retire');
});

test('aucun element ne laisse d entree fantome quand tout est vide', () => {
  let current = t.setElementTransform(project(), 'E1', 'desktop', 'x', 40);
  current = t.setElementTransform(current, 'E1', 'desktop', 'x', '');
  assert.equal(current.freeformLayout.desktop.E1, undefined, 'pas d entree vide dans le projet');
});

test('revenir au flux retire toute la position libre', () => {
  let current = t.setElementTransform(project(), 'E1', 'desktop', 'x', 40);
  current = t.setElementTransform(current, 'E1', 'desktop', 'rotation', 30);
  current = t.clearElementTransform(current, 'E1', 'desktop');
  assert.equal(t.hasElementTransform(current, 'E1', 'desktop'), false);
});

test('les valeurs posees atteignent le CSS du rendu', () => {
  let current = t.setElementTransform(project(), 'E1', 'desktop', 'width', 240);
  current = t.setElementTransform(current, 'E1', 'desktop', 'rotation', 30);
  const css = buildFreeformLayoutCSS(current);
  assert.ok(css.includes('width:240px!important'), 'la largeur doit atteindre le rendu');
  assert.ok(css.includes('rotate:30deg!important'), 'la rotation doit atteindre le rendu');
  assert.ok(css.includes('[data-layout-key="E1"]'), 'la regle cible le bon element');
});

test('une position libre ne s active jamais sans valeur saisie', () => {
  const css = buildFreeformLayoutCSS(project());
  assert.equal(css.trim(), '', 'un projet sans reglage ne produit aucune regle de position');
});

test('l inspecteur expose les champs numeriques quand un element est selectionne', async () => {
  const { generateSite } = await import('../public/js/engine/generator.js');
  const { renderEditor } = await import('../public/js/components/editor.js');
  const { state } = await import('../public/js/state.js');
  const project = generateSite({ name: 'Controle Transform', tradeId: 'menuisier' });
  state.currentProject = project;
  state.currentView = 'editor';
  state.editorMode = 'edit';
  state.selectedElementKey = 'EL-TEST';
  const html = renderEditor(state);
  assert.ok(html.includes('Position et taille'), 'le bloc doit etre rendu');
  assert.ok(html.includes('data-transform-field="x"'), 'le champ X doit exister');
  assert.ok(html.includes('data-transform-field="rotation"'), 'la rotation doit exister');
  assert.ok(html.includes("setElementTransformValue('EL-TEST', 'width'"), 'le champ largeur doit ecrire sur l element');
  assert.ok(html.includes('flux normal'), 'un element sans reglage est annonce dans le flux');
  state.selectedElementKey = null;
});

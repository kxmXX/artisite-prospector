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

test('la position libre s active explicitement, sans deplacer l element', async () => {
  const t = await import('../public/js/engine/elementTransform.js');
  assert.equal(typeof t.enableElementTransform, 'function', 'le chemin explicite doit exister');
  const enabled = t.enableElementTransform(project(), 'E1', 'desktop');
  assert.equal(t.hasElementTransform(enabled, 'E1', 'desktop'), true, 'l element devient positionnable');
  assert.equal(t.getElementTransform(enabled, 'E1', 'desktop').x, 0, 'sans etre deplace');
  assert.equal(t.getElementTransform(enabled, 'E1', 'desktop').y, 0, 'sans etre deplace');
  const cleaned = t.clearElementTransform(enabled, 'E1', 'desktop');
  assert.equal(t.hasElementTransform(cleaned, 'E1', 'desktop'), false, 'et on peut revenir au flux');
});

test('l inspecteur propose l activation explicite tant que rien n est positionne', async () => {
  const t = await import('../public/js/engine/elementTransform.js');
  const { generateSite } = await import('../public/js/engine/generator.js');
  const { renderEditor } = await import('../public/js/components/editor.js');
  const { state } = await import('../public/js/state.js');
  const base = generateSite({ name: 'Controle Opt-in', tradeId: 'menuisier' });
  state.currentProject = base;
  state.currentView = 'editor';
  state.editorMode = 'edit';
  state.selectedElementKey = 'EL-OPTIN';
  const flow = renderEditor(state);
  assert.ok(flow.includes('Activer la position libre'), 'le bouton explicite doit apparaitre');
  assert.ok(!flow.includes("resetElementTransform('EL-OPTIN')"), 'pas de retour au flux s il n y en a pas');
  state.currentProject = t.enableElementTransform(base, 'EL-OPTIN', 'desktop');
  const free = renderEditor(state);
  assert.ok(free.includes("resetElementTransform('EL-OPTIN')"), 'le retour au flux doit apparaitre');
  assert.ok(free.includes('position libre'), 'la pastille doit l annoncer');
  state.selectedElementKey = null;
});

test('la liste des elements vient du rendu, pas du contenu', async () => {
  const { generateSite } = await import('../public/js/engine/generator.js');
  const { renderWebsiteHTML, collectSectionElements } = await import('../public/js/components/renderer.js');
  const project = generateSite({ name: 'Controle Liste', tradeId: 'plombier' });
  const rendered = new Set([...renderWebsiteHTML(project, { isEditor: true }).matchAll(/data-layout-key="([^"]+)"/g)].map((m) => m[1]));
  // Certaines sections (trust, par exemple) n'ont aucun element decorable : c'est
  // normal, elles ne doivent simplement rien proposer.
  let total = 0;
  for (const section of project.sections) {
    const elements = collectSectionElements(project, section);
    total += elements.length;
    for (const element of elements) {
      assert.ok(rendered.has(element.key), 'cle proposee mais absente du canevas : ' + element.key);
      assert.ok(['text', 'image', 'button'].includes(element.kind), 'nature inconnue : ' + element.kind);
    }
  }
  assert.ok(total > 20, 'la liste doit couvrir le site, pas seulement une section : ' + total);
  const kinds = new Set(project.sections.flatMap((s) => collectSectionElements(project, s).map((e) => e.kind)));
  assert.ok(kinds.has('image') || kinds.has('button'), 'images ou boutons doivent apparaitre dans la liste');
});

test('la liste ne propose plus les champs sans element decore', async () => {
  const { generateSite } = await import('../public/js/engine/generator.js');
  const { collectSectionElements } = await import('../public/js/components/renderer.js');
  const ids = await import('../public/js/data/uiIds.js');
  const project = generateSite({ name: 'Controle Fantomes', tradeId: 'plombier' });
  const section = project.sections.find((s) => s.type === 'customBlock') || project.sections[0];
  const keys = collectSectionElements(project, section).map((e) => e.key);
  // `blockType` et `ctaLink` sont du contenu sans element decorable : leurs cles ne
  // doivent plus etre proposees, sinon l'auteur regle quelque chose d'invisible.
  for (const ghost of ['blockType', 'ctaLink']) {
    const ghostKey = ids.getUiCode(project.id, section.id, ghost);
    assert.ok(!keys.includes(ghostKey), 'cle fantome encore proposee : ' + ghost);
  }
});

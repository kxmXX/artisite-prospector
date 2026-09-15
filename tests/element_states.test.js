import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const states = await import('../public/js/engine/elementStates.js');
const { renderWebsiteHTML } = await import('../public/js/components/renderer.js');
const { exportStandaloneHTML } = await import('../public/js/engine/exporter.js');
const { SAMPLE_PROJECTS } = await import('../public/js/data/sampleProjects.js');

const project = () => ({ id: 'p1', branding: {}, business: {}, sections: [], elementStates: {} });

test('un etat se pose, se relit et ne modifie pas le projet d origine', () => {
  const before = project();
  const after = states.setElementState(before, 'E1', 'hover', 'color', '#ffffff');
  assert.equal(states.getElementState(before, 'E1', 'hover').color, undefined, 'le projet source reste intact');
  assert.equal(states.getElementState(after, 'E1', 'hover').color, '#ffffff');
  assert.notEqual(after, before, 'un nouveau projet est renvoye');
});

test('les declarations dangereuses ou hors liste sont refusees', () => {
  let current = project();
  current = states.setElementState(current, 'E1', 'hover', 'position', 'fixed');
  assert.deepEqual(states.getElementState(current, 'E1', 'hover'), {}, 'propriete hors liste blanche');
  current = states.setElementState(current, 'E1', 'hover', 'color', 'red; background: url(x)');
  assert.deepEqual(states.getElementState(current, 'E1', 'hover'), {}, 'valeur avec sortie de declaration');
  current = states.setElementState(current, 'E1', 'hover', 'color', '</style><script>alert(1)</script>');
  assert.deepEqual(states.getElementState(current, 'E1', 'hover'), {}, 'valeur avec balise');
  current = states.setElementState(current, 'E1', 'inconnu', 'color', 'red');
  assert.deepEqual(states.getElementState(current, 'E1', 'hover'), {}, 'etat inconnu ignore');
  current = states.setElementState(current, '<script>', 'hover', 'color', 'red');
  assert.equal(states.elementStateCSS(current), '', 'cle de mise en page invalide ignoree');
});

test('vider un etat retire aussi l element quand il ne reste rien', () => {
  let current = states.setElementState(project(), 'E1', 'hover', 'color', 'red');
  current = states.clearElementState(current, 'E1', 'hover');
  assert.deepEqual(current.elementStates, {}, 'plus aucun etat');
  current = states.setElementState(project(), 'E1', 'hover', 'color', 'red');
  current = states.setElementState(current, 'E1', 'active', 'opacity', '0.8');
  current = states.clearElementState(current, 'E1', 'hover');
  assert.deepEqual(Object.keys(current.elementStates.E1), ['active'], 'les autres etats restent');
});

test('le CSS des etats est minimal, cible et sur une seule primitive', () => {
  assert.equal(states.elementStateCSS(project()), '', 'aucun etat, aucune feuille de style');
  assert.equal(states.elementStateCSS({}), '');
  let current = states.setElementState(project(), 'E1', 'hover', 'color', '#ffffff');
  assert.equal(states.elementStateCSS(current), '[data-layout-key="E1"]:hover { color: #ffffff; }');
  current = states.setElementState(current, 'E1', 'focus', 'outline-color', '#1f6feb');
  assert.match(states.elementStateCSS(current), /\[data-layout-key="E1"\]:focus-visible \{ outline-color: #1f6feb; \}/,
    'focus est traduit en :focus-visible, la politique de focus du produit');
  current = states.setElementState(current, 'E1', 'disabled', 'opacity', '0.4');
  assert.match(states.elementStateCSS(current), /:disabled \{ opacity: 0.4; \}/);
  assert.equal(states.countStyledStates(current), 1);
});

test('les etats sont presents dans le rendu partage et dans l export autonome', () => {
  const base = JSON.parse(JSON.stringify(SAMPLE_PROJECTS[0]));
  const heroKey = 'E-TEST';
  const withState = states.setElementState(base, heroKey, 'hover', 'opacity', '0.9');
  const preview = renderWebsiteHTML(withState, { isEditor: false, isStandalone: false });
  assert.ok(preview.includes('data-element-states'), 'la feuille des etats est injectee par le renderer');
  assert.ok(preview.includes('[data-layout-key="E-TEST"]:hover'), 'la regle suit l element');

  const exported = exportStandaloneHTML(withState);
  assert.ok(exported.includes('[data-layout-key="E-TEST"]:hover'),
    'le site autonome embarque la meme primitive, donc le meme rendu');

  const untouched = renderWebsiteHTML(JSON.parse(JSON.stringify(SAMPLE_PROJECTS[0])), { isEditor: false, isStandalone: false });
  assert.ok(!/\[data-layout-key="[^"]+"\]:hover/.test(untouched), 'aucun etat par defaut : rien n est invente');
});

const editorSource = fs.readFileSync(new URL('../public/js/components/editor.js', import.meta.url), 'utf8');
const appSource = fs.readFileSync(new URL('../public/js/app.js', import.meta.url), 'utf8');

test('l interface permet de choisir l etat modifie', () => {
  for (const stateName of ['default', 'hover', 'focus', 'active', 'disabled']) {
    assert.ok(editorSource.includes('data-ftb-state="' + stateName + '"'),
      'le sélecteur doit proposer l état ' + stateName);
  }
  assert.ok(/setActiveTextState\('hover'\)/.test(editorSource), 'le sélecteur est branché sur une commande');
});

test('hors style principal, la couleur alimente bien les etats', () => {
  const block = appSource.slice(appSource.indexOf('setActiveTextColor(color) {'));
  const stateBranch = block.slice(0, block.indexOf('if (secId && field && state.currentProject) {', 10));
  assert.ok(stateBranch.includes('setElementState(state.currentProject, layoutKey'),
    'la couleur doit écrire dans les états quand un état est choisi');
  assert.ok(stateBranch.includes('getUiCode('), 'la clé de mise en page doit être celle du renderer');
  assert.ok(stateBranch.includes('return;'), 'le chemin du style principal ne doit pas être exécuté en plus');
  assert.ok(appSource.includes('this._activeTextState = "default"'), 'sortir de l édition revient au style principal');
});


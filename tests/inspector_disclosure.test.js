import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const inspector = await import('../public/js/components/inspector.js');
const { generateSite } = await import('../public/js/engine/generator.js');
const { renderEditor } = await import('../public/js/components/editor.js');
const { state } = await import('../public/js/state.js');

function renderShell() {
  state.currentProject = generateSite({ name: 'Controle Divulgation', tradeId: 'menuisier' });
  state.currentView = 'editor';
  state.editorMode = 'edit';
  return renderEditor(state);
}

test('les reglages secondaires sont replies par defaut', () => {
  const html = renderShell();
  assert.ok(html.includes('data-disclosure="section-motion-timing"'), 'le bloc avance doit exister');
  assert.match(html, /<details class="ui-disclosure" data-disclosure="section-motion-timing"(?! open)/,
    'le bloc doit etre replie par defaut');
  assert.ok(html.includes('Réglages avancés : déclencheur, répétition, vitesse et délai'), 'l intitule doit etre lisible et annoncer tout ce qu il contient');
});

test('l essentiel reste visible sans deplier', () => {
  const html = renderShell();
  assert.ok(html.includes('Tester l'), 'le bouton de test reste present');
  assert.ok(html.includes('setSectionMotion('), 'le choix de l animation reste direct');
  assert.ok(html.includes('data-section-timing'), 'les controles de rythme sont bien rendus');
});

test('l etat ouvert survit au nouveau rendu du panneau', () => {
  assert.equal(inspector.isDisclosureOpen('section-motion-timing'), false, 'replie au depart');
  inspector.rememberDisclosure('section-motion-timing', true);
  assert.equal(inspector.isDisclosureOpen('section-motion-timing'), true);
  const html = renderShell();
  assert.match(html, /data-disclosure="section-motion-timing" open/, 'ouvert apres interaction');
  inspector.rememberDisclosure('section-motion-timing', false);
  assert.equal(inspector.isDisclosureOpen('section-motion-timing'), false, 'refermable');
});

test('la divulgation est stylee et accessible au clavier', () => {
  const css = fs.readFileSync(new URL('../public/css/app.css', import.meta.url), 'utf8');
  assert.ok(css.includes('.ui-disclosure'), 'le style du bloc doit exister');
  assert.ok(css.includes('.ui-disclosure-summary:focus-visible'), 'le resume doit montrer le focus clavier');
  assert.ok(css.includes('.ui-disclosure[open]'), 'l etat ouvert doit etre visible');
});

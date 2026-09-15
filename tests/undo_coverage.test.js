import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

globalThis.document = {
  addEventListener() {},
  getElementById() { return null; },
  querySelector() { return null; },
  querySelectorAll() { return []; }
};

const { App } = await import('../public/js/app.js');
const { state } = await import('../public/js/state.js');
const { generateSite } = await import('../public/js/engine/generator.js');

const appSource = fs.readFileSync(new URL('../public/js/app.js', import.meta.url), 'utf8');
const stateSource = fs.readFileSync(new URL('../public/js/state.js', import.meta.url), 'utf8');

function prepareApp() {
  const app = Object.create(App.prototype);
  app.render = () => {};
  app.showToast = () => {};
  app.updateUndoRedoUI = () => {};
  const project = generateSite({ name: 'Annulation', tradeId: 'paysagiste' });
  state.currentProject = project;
  state.projects = [project];
  state.undoStack = [];
  state.redoStack = [];
  state.saveToStorage = () => {};
  state.save = () => {};
  state.notify = () => {};
  state._lastCoalesce = null;
  return { app, project, hero: project.sections.find((section) => section.type === 'hero') };
}

// Chaque cas : lire la valeur, agir, annuler, vérifier le retour exact.
const cases = [
  ['bandeau flottant', (app, hero) => app.toggleStickyBar(true), (project) => project.settings.stickyBarEnabled],
  ['numéro WhatsApp', (app) => app.updateWhatsAppNumber('06 00 00 00 00'), (project) => project.settings.whatsappNumber],
  ['ambiance globale', (app) => app.switchGlobalTheme('dark'), (project) => project.branding.globalTheme],
  ['mode de navigation', (app) => app.setNavigationMode('multi-tab'), (project) => project.branding.navigationMode],
  ['preuve sociale', (app) => app.toggleSocialProof(true), (project) => project.branding.socialProofEnabled],
  ['code PIN client', (app) => app.setClientDemoPin('1234'), (project) => project.settings.clientDemoPin],
  ['taille de texte (flèches)', (app, hero) => app.adjustFieldFontSize(hero.id, 'title', 4), (project) => (project.sections.find((s) => s.type === 'hero').settings || {}).fontSize_title],
  ['assombrissement du hero', (app, hero) => app.setHeroOverlayDarkening(hero.id, 40), (project) => (project.sections.find((s) => s.type === 'hero').settings || {}).overlayDarkening]
];

for (const [label, act, read] of cases) {
  test('annulation réelle : ' + label, () => {
    const ctx = prepareApp();
    // Un premier changement, annulé, pour partir d'un état stable et vidé d'historique.
    ctx.app.toggleStickyBar(false);
    state.undoStack = [];
    state.redoStack = [];
    const before = read(state.currentProject);
    act(ctx.app, ctx.hero);
    assert.notDeepEqual(read(state.currentProject), before, 'la mutation doit avoir eu lieu');
    assert.ok(state.canUndo(), 'une entrée d\'historique doit exister');
    state.undo();
    assert.deepEqual(read(state.currentProject), before, 'l\'annulation doit restaurer la valeur précédente');
    assert.ok(state.canRedo(), 'le rétablissement doit rester possible');
    state.redo();
    assert.notDeepEqual(read(state.currentProject), before, 'le rétablissement doit réappliquer la valeur');
  });
}

test('aucune mutation ne contourne plus l\'historique', () => {
  assert.equal(appSource.split('state.updateProject(updated, false)').length - 1, 0,
    'updateProject(..., false) contourne l\'historique');
  assert.ok(stateSource.includes('pushHistoryCoalesced'), 'le regroupement des mutations continues doit exister');
});

test('un curseur continu ne crée qu\'une seule entrée d\'historique', () => {
  prepareApp();
  for (let step = 0; step < 25; step += 1) state.pushHistoryCoalesced('Assombrissement du hero');
  assert.equal(state.undoStack.length, 1, '25 pas de curseur = 1 seule entrée');
  state.pushHistoryCoalesced('Taille de texte title');
  assert.equal(state.undoStack.length, 2, 'une autre action crée une nouvelle entrée');
});

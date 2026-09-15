import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const elements = new Map();
globalThis.document = {
  addEventListener() {},
  getElementById() { return null; },
  querySelectorAll() { return []; },
  querySelector(selector) {
    const match = /^\[data-layout-key="(.+)"\]$/.exec(selector);
    if (match) return elements.get(match[1]) || null;
    return null;
  }
};

const { App } = await import('../public/js/app.js');
const { state } = await import('../public/js/state.js');
const appSource = fs.readFileSync(new URL('../public/js/app.js', import.meta.url), 'utf8');

function prepareApp() {
  const app = Object.create(App.prototype);
  app.render = () => {};
  app.showToast = () => {};
  app._stageUpdates = 0;
  app.updateStageContext = () => { app._stageUpdates += 1; };
  state.currentProject = { id: 'p', sections: [{ id: 'sec-hero', type: 'hero', content: { title: 'Hero' }, settings: {} }] };
  state.selectedSectionId = 'sec-hero';
  app._freeformSelectedKeys = [];
  app._freeformSelectedKey = null;
  app._freeformAdditiveMode = false;
  app._freeformActiveGroup = null;
  return app;
}

test('le libellé de sélection est humain et hiérarchique', () => {
  const app = prepareApp();
  assert.equal(app.getFreeformSelectionLabel(), '', 'aucune sélection, aucun libellé');

  elements.set('E001', { getAttribute: (name) => (name === 'data-layout-label' ? 'Titre principal' : null) });
  app._freeformSelectedKeys = ['E001'];
  assert.equal(app.getFreeformSelectionLabel(), 'Titre principal', 'le libellé du nœud est utilisé');

  elements.set('E002', { getAttribute: () => null });
  app._freeformSelectedKeys = ['E002'];
  assert.equal(app.getFreeformSelectionLabel(), '#E002', 'repli sur la référence stable');

  app._freeformSelectedKeys = ['E001', 'E002'];
  assert.equal(app.getFreeformSelectionLabel(), '2 éléments', 'sélection multiple lisible');
});

test('oublier la sélection d element remet l etat a zero et rafraichit le fil', () => {
  const app = prepareApp();
  app._freeformSelectedKeys = ['E001'];
  app._freeformSelectedKey = 'E001';
  app._freeformAdditiveMode = true;
  app.clearElementSelection();
  assert.deepEqual(app._freeformSelectedKeys, []);
  assert.equal(app._freeformSelectedKey, null);
  assert.equal(app._freeformAdditiveMode, false);
  assert.ok(app._stageUpdates >= 1, 'le fil de contexte doit être recalculé');
});

test('Echap suit un escalier unique : edition, modale, element, barres', () => {
  const start = appSource.indexOf('} else if (e.key === "Escape") {');
  assert.ok(start > 0, 'le gestionnaire Echap doit exister');
  const escapeBlock = appSource.slice(start, start + 800);
  const ladder = ['exitInlineEditing()', 'state.activeDrawer', 'this._freeformSelectedKeys', 'closeAllFloatingToolbars()'];
  let previous = -1;
  for (const step of ladder) {
    const index = escapeBlock.indexOf(step);
    assert.ok(index > previous, 'ordre de l escalier incorrect pour ' + step);
    previous = index;
  }
});

test('une barre de sélection masquée ne répond plus aux flèches', () => {
  const start = appSource.indexOf('const selectionBox = document.getElementById("freeform-selection-box");');
  assert.ok(start > 0, 'le garde de visibilité doit exister dans le gestionnaire clavier');
  const guard = appSource.slice(start, start + 160);
  assert.ok(guard.includes('is-visible'),
    'les flèches ne doivent plus déplacer une sélection dont la boîte est masquée');
  assert.ok(!/closeAllFloatingToolbars\(except = ""\) \{[\s\S]*?clearElementSelection\(\)/.test(appSource),
    'masquer une barre ne doit pas effacer la sélection : le fil de contexte en a besoin');
});

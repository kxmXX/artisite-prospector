import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

globalThis.document = { addEventListener() {}, getElementById() { return null; } };
const { App } = await import('../public/js/app.js');
const { state, getDeepValue, setDeepValue } = await import('../public/js/state.js');
const { generateSite } = await import('../public/js/engine/generator.js');

const appSource = fs.readFileSync(new URL('../public/js/app.js', import.meta.url), 'utf8');
const studioCss = fs.readFileSync(new URL('../public/css/studio-v3.css', import.meta.url), 'utf8');

test('inline canvas edits create a real undo and redo transaction', () => {
  const app = Object.create(App.prototype);
  app.updateUndoRedoUI = () => {};
  const project = generateSite({ name: 'Avant', tradeId: 'paysagiste' });
  const hero = project.sections.find(section => section.type === 'hero');
  const path = 'title';
  const before = getDeepValue(hero.content, path);
  state.currentProject = project;
  state.projects = [project];
  state.undoStack = [];
  state.redoStack = [];
  state.saveToStorage = () => {};
  state.notify = () => {};

  setDeepValue(hero.content, path, 'Pendant la frappe');
  assert.equal(app.commitInlineFieldUpdate(hero.id, path, before, 'Après'), true);
  assert.equal(getDeepValue(state.currentProject.sections.find(section => section.id === hero.id).content, path), 'Après');

  state.undo();
  assert.equal(getDeepValue(state.currentProject.sections.find(section => section.id === hero.id).content, path), before);
  state.redo();
  assert.equal(getDeepValue(state.currentProject.sections.find(section => section.id === hero.id).content, path), 'Après');
});

test('Freeform toolbars use one measured non-overlapping stack', () => {
  assert.ok(appSource.includes('const toolbarStack = ['));
  assert.ok(appSource.includes('stackHeight = toolbarMetrics.reduce'));
  assert.ok(appSource.includes('toolbarTop += height + toolbarGap'));
  assert.ok(!appSource.includes('window.innerHeight - 38, bottom + extra'));
});

test('editor chrome stays out of preview and touch targets remain usable', () => {
  assert.ok(studioCss.includes(".studio-editor:not(.client-preview-mode) > .sticky-call-bar{display:none!important}"));
  assert.ok(studioCss.includes(".client-preview-mode .freeform-selection-box"));
  assert.match(studioCss, /freeform-resize-handle{width:24px;height:24px/);
  assert.match(studioCss, /freeform-layerbar button[^}]+min-width:44px/);
  assert.match(studioCss, /animation-play-state:paused!important/);
});

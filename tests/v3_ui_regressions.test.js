import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

globalThis.document = {
  addEventListener() {},
  querySelector() { return null; },
  querySelectorAll() { return []; },
  getElementById() { return null; }
};

const { App } = await import('../public/js/app.js');
const { state } = await import('../public/js/state.js');
const { generateDemoSite } = await import('../public/js/engine/generator.js');
const { renderWebsiteHTML } = await import('../public/js/components/renderer.js');
const { renderEditor } = await import('../public/js/components/editor.js');

const css = fs.readFileSync(path.resolve(process.cwd(), 'public/css/studio-v3.css'), 'utf8');

test('V3 settings rail re-renders the V3 sidebar immediately', () => {
  const app = Object.create(App.prototype);
  let renders = 0;
  let binds = 0;
  app.render = () => { renders++; };
  app.initCanvasInteractivity = () => { binds++; };
  state.currentView = 'editor';
  state.activeSidebarTab = 'sections';
  document.querySelector = selector => selector === '.studio-v3-editor' ? {} : null;
  document.getElementById = () => null;
  document.querySelectorAll = () => [];

  app.setSidebarTab('settings');

  assert.equal(state.activeSidebarTab, 'settings');
  assert.equal(renders, 1, 'V3 must not wait for an unrelated later render');
  assert.equal(binds, 1, 'canvas interactions are rebound after the V3 render');
});

test('V3 device preview applies real tablet/mobile widths and active state', () => {
  const app = Object.create(App.prototype);
  const canvas = { className: '', style: {}, dataset: {} };
  const buttons = ['desktop', 'tablet', 'mobile'].map(viewport => ({
    dataset: { viewport },
    active: false,
    classList: { toggle(_name, value) { this.owner.active = value; }, owner: null }
  }));
  buttons.forEach(button => { button.classList.owner = button; });
  document.getElementById = id => id === 'canvas-container' ? canvas : null;
  document.querySelectorAll = selector => {
    if (selector === '.viewport-option') return [];
    if (selector === '.studio-v3-device-switch [data-viewport]') return buttons;
    return [];
  };

  state.viewport = 'mobile';
  app.updateViewportUI();
  assert.equal(canvas.style.width, 'min(390px, 100%)');
  assert.equal(canvas.style.maxWidth, '390px');
  assert.equal(buttons[2].active, true);
  assert.equal(buttons[0].active, false);

  state.viewport = 'tablet';
  app.updateViewportUI();
  assert.equal(canvas.style.width, '768px');
  assert.equal(canvas.style.maxWidth, 'none');
  assert.equal(buttons[1].active, true);
});

test('V3 editor chrome reserves its own lane and mobile chrome cannot cover the client dock', () => {
  assert.ok(css.includes('.studio-v3-canvas .editor-section-wrapper { margin-top:44px!important; }'));
  assert.ok(css.includes('top:-40px!important;'));
  assert.ok(css.includes('.client-preview-mode .studio-v3-canvas .editor-section-wrapper { margin-top:0!important; }'));
  assert.ok(css.includes('body:not(.client-preview-mode) .studio-v3-editor > .sticky-call-bar { display:none!important; }'));
  assert.ok(css.includes('body.client-preview-mode .studio-v3-rail { display:none!important; }'));
  assert.ok(css.includes('#canvas-container[data-viewport="mobile"] { width:390px!important;max-width:none!important;'));
  assert.ok(css.includes('#canvas-container[data-viewport="tablet"] { width:768px!important;max-width:none!important;'));
});

test('V3 renderer no longer serializes objects into SVG dimensions', () => {
  const project = generateDemoSite({ name: 'Esprit Nature', tradeId: 'paysagiste', city: 'Montauban' });
  const html = renderWebsiteHTML(project, { isEditor: true, isStandalone: false });
  assert.ok(!html.includes('width="[object Object]"'));
  assert.ok(!html.includes('height="[object Object]"'));
});

test('V3 device switch exposes stable viewport targets in editor markup', () => {
  const editorSource = fs.readFileSync(path.resolve(process.cwd(), 'public/js/components/editor.js'), 'utf8');
  assert.ok(editorSource.includes('data-viewport="desktop"'));
  assert.ok(editorSource.includes('data-viewport="tablet"'));
  assert.ok(editorSource.includes('data-viewport="mobile"'));
});

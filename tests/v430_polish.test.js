import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateSite } from '../public/js/engine/generator.js';
import { renderWebsiteHTML } from '../public/js/components/renderer.js';
import { renderEditor } from '../public/js/components/editor.js';
import { state } from '../public/js/state.js';

test('v4.3.0 Polish: Canvas container dynamically binds project background and text colors', () => {
  const project = generateSite({ name: 'Sombre Test', tradeId: 'paysagiste', city: 'Nantes' });
  project.branding.bgColor = '#09090b';
  project.branding.textColor = '#f4f4f5';
  state.currentProject = project;
  state.currentView = 'editor';
  state.editorMode = 'edit';
  const editorHtml = renderEditor(state);

  assert.ok(editorHtml.includes('id="canvas-container"'), 'Has canvas container');
  assert.ok(editorHtml.includes('background-color: #09090b'), 'Canvas container has dark background color inline style');
  assert.ok(editorHtml.includes('color: #f4f4f5'), 'Canvas container has light text color inline style');
});

test('v4.3.0 Polish: Ambiance selector unambiguously marks active theme button', () => {
  const project = generateSite({ name: 'Theme Test', tradeId: 'menuisier', city: 'Lille' });
  state.currentProject = project;
  state.currentView = 'editor';
  state.editorMode = 'edit';

  // White theme
  project.branding.globalTheme = 'white';
  project.branding.bgColor = '#ffffff';
  let html = renderEditor(state);
  assert.ok(html.includes("window.app.switchGlobalTheme('white')\" class=\"py-2 border rounded-lg text-center text-[11px] font-medium transition-all border-zinc-950 bg-white ring-2 ring-zinc-950"), 'White is active');

  // Mineral theme
  project.branding.globalTheme = 'mineral';
  project.branding.bgColor = '#f4f4f5';
  html = renderEditor(state);
  assert.ok(html.includes("window.app.switchGlobalTheme('mineral')\" class=\"py-2 border rounded-lg text-center text-[11px] font-medium transition-all border-zinc-950 bg-zinc-100 ring-2 ring-zinc-950"), 'Mineral is active');

  // Dark theme
  project.branding.globalTheme = 'dark';
  project.branding.bgColor = '#09090b';
  html = renderEditor(state);
  assert.ok(html.includes("window.app.switchGlobalTheme('dark')\" class=\"py-2 border rounded-lg text-center text-[11px] font-medium transition-all border-amber-400 bg-zinc-900 ring-2 ring-amber-400"), 'Dark is active');
});

test('v4.3.0 Polish: CSS prevents duplicate popover collision and restores hover numbered badges', () => {
  const cssPath = resolve('public/css/app.css');
  const css = readFileSync(cssPath, 'utf8');

  // Mini badge hidden on hover/active to avoid clashing with popover
  assert.ok(css.includes('.cta-button-wrapper:hover .cta-direct-badge'), 'Has hover direct-badge rule');
  assert.ok(css.includes('display: none !important;'), 'Hides duplicate badge');

  // Hover numbered badges displayed
  assert.ok(css.includes('.editor-section-wrapper [data-ui-index]:hover::after'), 'Has hover indexed badge rule');
  assert.ok(css.includes('display: inline-flex !important;'), 'Displays numbered badges on hover');

  // Primary section contrast rules
  assert.ok(css.includes('.bg-sec-primary'), 'Has bg-sec-primary rule');
  assert.ok(css.includes('.editor-section-wrapper[data-section-bg="primary"] h1'), 'Has primary section h1 override');
  assert.ok(css.includes('.site-section[data-section-bg="primary"] p'), 'Has primary section paragraph override');
});

test('v4.3.0 Polish: CTA section defaults to primary theme and export button is centered', () => {
  const project = generateSite({ name: 'CTA Test', tradeId: 'plombier', city: 'Rennes' });
  const html = renderWebsiteHTML(project, { isEditor: false });
  assert.ok(html.includes('id="cta" class="site-section bg-sec-primary'), 'CTA section defaults to bg-sec-primary');

  state.currentProject = project;
  state.currentView = 'editor';
  state.editorMode = 'edit';
  const editorHtml = renderEditor(state);
  assert.ok(editorHtml.includes('id="export-menu-button"'), 'Has export button');
  assert.ok(editorHtml.includes('justify-center'), 'Export button is centered');
  assert.ok(editorHtml.includes('text-white/80'), 'Export button chevron is visible');
});

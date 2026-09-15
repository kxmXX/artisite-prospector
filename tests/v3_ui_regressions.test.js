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
const { renderWebsiteHTML, buildFreeformLayoutCSS } = await import('../public/js/components/renderer.js');
const { renderEditor } = await import('../public/js/components/editor.js');
const { exportStandaloneHTML } = await import('../public/js/engine/exporter.js');

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

test('V3 selection and drag/drop bind to V3 structure rows, not only legacy cards', () => {
  const appSource = fs.readFileSync(path.resolve(process.cwd(), 'public/js/app.js'), 'utf8');
  assert.ok(appSource.includes('document.querySelectorAll(".studio-v3-sectionrow")'));
  assert.ok(appSource.includes('grip.closest(".section-card, .studio-v3-sectionrow")'));
  assert.ok(appSource.includes('document.querySelectorAll(".section-card, .studio-v3-sectionrow")'));
  assert.ok(appSource.includes('state.moveSection(secId, e.key === "ArrowUp" ? "up" : "down")'));
});

test('V3 inspector becomes a responsive editing drawer below desktop width', () => {
  const editorSource = fs.readFileSync(path.resolve(process.cwd(), 'public/js/components/editor.js'), 'utf8');
  const appSource = fs.readFileSync(path.resolve(process.cwd(), 'public/js/app.js'), 'utf8');
  assert.ok(editorSource.includes('studio-v3-responsive-inspector-head'));
  assert.ok(css.includes('.studio-v3-inspector-panel.is-responsive-open'));
  assert.ok(css.includes('width:calc(100vw - 16px)!important'));
  assert.ok(appSource.includes('window.matchMedia?.("(max-width: 1280px)").matches'));
  assert.ok(appSource.includes('rightInspector.classList.add("is-responsive-open")'));
});

test('V3 nested image actions target the real service and realisation fields', () => {
  const project = generateDemoSite({ name: 'Esprit Nature', tradeId: 'paysagiste', city: 'Montauban' });
  const html = renderWebsiteHTML(project, { isEditor: true, isStandalone: false });
  assert.ok(html.includes("openImagePicker('sec-services', 'services.0.image'"));
  assert.ok(html.includes("handleImageElementDrop(event, 'sec-services', 'services.0.image'"));
  assert.ok(html.includes("deletePhoto('sec-services', 'services.0.image'"));
  assert.ok(html.includes("openImagePicker('sec-realisations', 'items.0.image'"));
});

test('V3 modals stay viewport-bounded and receive a deliberate initial focus', () => {
  const appSource = fs.readFileSync(path.resolve(process.cwd(), 'public/js/app.js'), 'utf8');
  assert.ok(css.includes('max-height:calc(100vh - 32px)!important'));
  assert.ok(css.includes('min-height:0!important;overflow-y:auto!important'));
  assert.ok(appSource.includes('new_project: "#wiz-name"'));
  assert.ok(appSource.includes('image_modal: "#tab-img-library"'));
  assert.ok(appSource.includes('share_modal: "#share-modal-url-input"'));
  assert.ok(appSource.includes('this._modalReturnFocus = document.activeElement || null'));
});

test('Freeform foundation keeps stable layout keys across editor/public render and breakpoint CSS', () => {
  const project = generateDemoSite({ name: 'Esprit Nature', tradeId: 'paysagiste', city: 'Montauban' });
  const editorHtml = renderWebsiteHTML(project, { isEditor: true, isStandalone: false });
  const publicHtml = renderWebsiteHTML(project, { isEditor: false, isStandalone: false });
  const editorTitle = editorHtml.match(/<h1[^>]*data-editable="title"[^>]*data-layout-key="([^"]+)"/i);
  const publicTitle = publicHtml.match(/<h1[^>]*data-editable="title"[^>]*data-layout-key="([^"]+)"/i);
  assert.ok(editorTitle?.[1], 'editor title must expose a neutral layout key');
  assert.equal(publicTitle?.[1], editorTitle[1], 'public render must keep the exact same layout key');

  project.freeformLayout = {
    desktop: { [editorTitle[1]]: { x: 24, y: -12, width: 420, height: 96, z: 3, scaleX: 1.2, scaleY: 0.8 } },
    tablet: { [editorTitle[1]]: { x: 8, y: 4, width: 360 } },
    mobile: { [editorTitle[1]]: { x: 0, y: 6, width: 310 } }
  };
  const cssOut = buildFreeformLayoutCSS(project);
  assert.ok(cssOut.includes('#canvas-container[data-viewport="desktop"]'));
  assert.ok(cssOut.includes('@media (min-width:1024px)'));
  assert.ok(cssOut.includes('@media (min-width:640px) and (max-width:1023px)'));
  assert.ok(cssOut.includes('@media (max-width:639px)'));
  assert.ok(cssOut.includes('#canvas-container[data-viewport="mobile"] .artisite-root.public-mode'));
  assert.ok(cssOut.includes('translate:24px -12px!important'));
  assert.ok(cssOut.includes('width:420px!important'));
  assert.ok(cssOut.includes('scale:1.2 0.8!important'));
  const standalone = exportStandaloneHTML(project);
  assert.ok(standalone.includes(`data-layout-key="${editorTitle[1]}"`));
  assert.ok(standalone.includes('translate:24px -12px!important'));
});

test('Freeform layout persistence is breakpoint-scoped and Undo restores the previous project snapshot', () => {
  const previous = {
    projects: state.projects,
    currentProject: state.currentProject,
    undoStack: state.undoStack,
    redoStack: state.redoStack
  };
  try {
    const project = generateDemoSite({ name: 'Layout Test', tradeId: 'paysagiste', city: 'Lyon' });
    state.projects = [project];
    state.currentProject = project;
    state.undoStack = [];
    state.redoStack = [];
    state.setFreeformLayout('E_TEST', 'desktop', { x: 31, y: 14, width: 280, height: 80, scaleX: 1.25, scaleY: 0.75 }, 'Move test');
    assert.deepEqual(state.currentProject.freeformLayout.desktop.E_TEST, { x: 31, y: 14, width: 280, height: 80, scaleX: 1.25, scaleY: 0.75 });
    assert.equal(state.currentProject.freeformLayout.tablet.E_TEST, undefined);
    assert.equal(state.undoStack.length, 1);
    state.undo();
    assert.equal(state.currentProject.freeformLayout, undefined);
  } finally {
    state.projects = previous.projects;
    state.currentProject = previous.currentProject;
    state.undoStack = previous.undoStack;
    state.redoStack = previous.redoStack;
  }
});

test('Freeform editor uses Pointer Events with move, eight resize handles, keyboard nudge and reset', () => {
  const appSource = fs.readFileSync(path.resolve(process.cwd(), 'public/js/app.js'), 'utf8');
  assert.ok(appSource.includes('startFreeformInteraction(event, action = "move"'));
  assert.ok(appSource.includes('["nw","n","ne","e","se","s","sw","w"]'));
  assert.ok(appSource.includes('window.addEventListener("pointermove", onMove)'));
  assert.ok(appSource.includes('nudgeFreeformSelection(-step, 0)'));
  assert.ok(appSource.includes('state.clearFreeformLayouts(keys'));
});

test('Freeform multi-selection batches transforms into one Undo snapshot and persists groups', () => {
  const previous = {
    projects: state.projects,
    currentProject: state.currentProject,
    undoStack: state.undoStack,
    redoStack: state.redoStack
  };
  try {
    const project = generateDemoSite({ name: 'Group Test', tradeId: 'paysagiste', city: 'Nantes' });
    state.projects = [project];
    state.currentProject = project;
    state.undoStack = [];
    state.redoStack = [];
    state.setFreeformLayouts({
      E_A: { x: 12, y: 8 },
      E_B: { x: 22, y: 18 }
    }, 'desktop', 'Batch move');
    assert.equal(state.undoStack.length, 1, 'collective transform must create exactly one Undo snapshot');
    assert.equal(state.currentProject.freeformLayout.desktop.E_A.x, 12);
    assert.equal(state.currentProject.freeformLayout.desktop.E_B.x, 22);
    state.undo();
    assert.equal(state.currentProject.freeformLayout, undefined);

    state.undoStack = [];
    const groupId = state.createFreeformGroup(['E_A', 'E_B'], 'Create group');
    assert.ok(groupId);
    assert.deepEqual(state.currentProject.freeformGroups[groupId].members, ['E_A', 'E_B']);
    assert.equal(state.undoStack.length, 1);
    state.deleteFreeformGroup(groupId, 'Delete group');
    assert.equal(state.currentProject.freeformGroups[groupId], undefined);
    assert.equal(state.undoStack.length, 2);
  } finally {
    state.projects = previous.projects;
    state.currentProject = previous.currentProject;
    state.undoStack = previous.undoStack;
    state.redoStack = previous.redoStack;
  }
});

test('Freeform multi-select exposes Shift selection, group controls and collective movement', () => {
  const appSource = fs.readFileSync(path.resolve(process.cwd(), 'public/js/app.js'), 'utf8');
  assert.ok(appSource.includes('additive: event.shiftKey'));
  assert.ok(appSource.includes('state.createFreeformGroup(keys'));
  assert.ok(appSource.includes('state.deleteFreeformGroup(group.id'));
  assert.ok(appSource.includes('state.setFreeformLayouts(liveUpdates'));
  assert.ok(appSource.includes('keys.length > 1 ? "Déplacement sélection libre"'));
  assert.ok(css.includes('.freeform-selection-box.is-multi:not(.is-group) .freeform-resize-handle{display:none}'));
});

test('Freeform grouped resize uses non-reflow scale and alignment/distribution stay batched', () => {
  const appSource = fs.readFileSync(path.resolve(process.cwd(), 'public/js/app.js'), 'utf8');
  const rendererSource = fs.readFileSync(path.resolve(process.cwd(), 'public/js/components/renderer.js'), 'utf8');
  assert.ok(appSource.includes('baseScaleX * scaleGroupX'));
  assert.ok(appSource.includes('baseScaleY * scaleGroupY'));
  assert.ok(appSource.includes('moveEvent.shiftKey'));
  assert.ok(appSource.includes('alignFreeformSelection(mode = "left")'));
  assert.ok(appSource.includes('distributeFreeformSelection(axis = "horizontal")'));
  assert.ok(appSource.includes('state.setFreeformLayouts(updates, state.viewport, `Alignement ${mode}`)'));
  assert.ok(rendererSource.includes('scale:${Number.isFinite(scaleX)'));
  assert.ok(css.includes('.freeform-selection-box.is-multi .freeform-alignbar{display:flex}'));
});

test('Freeform direct drag uses a movement threshold, smart snapping and visible guides', () => {
  const appSource = fs.readFileSync(path.resolve(process.cwd(), 'public/js/app.js'), 'utf8');
  assert.ok(appSource.includes('armFreeformDirectDrag(event, target'));
  assert.ok(appSource.includes('Math.hypot(moveEvent.clientX - startPoint.x, moveEvent.clientY - startPoint.y) < 5'));
  assert.ok(appSource.includes('resolveFreeformSnap(selectionRect.left + dx'));
  assert.ok(appSource.includes('FREEFORM_SNAP_THRESHOLD'));
  assert.ok(appSource.includes('if (!moveEvent.altKey && snapContext)'));
  assert.ok(appSource.includes('this.showFreeformGuides(snapX, snapY, boundary)'));
  assert.ok(appSource.includes('behavior: "instant"'));
  assert.ok(appSource.includes('document.body.classList.add("freeform-transforming")'));
  assert.ok(css.includes('.freeform-snap-guide.is-visible{display:block}'));
  assert.ok(css.includes('body.freeform-direct-dragging'));
  assert.ok(css.includes('body.freeform-transforming #canvas-container [data-layout-key].is-freeform-selected{transition:none!important}'));
});

test('Freeform marquee previews center hits, supports additive selection and respects groups', () => {
  const appSource = fs.readFileSync(path.resolve(process.cwd(), 'public/js/app.js'), 'utf8');
  assert.ok(appSource.includes('armFreeformMarquee(event, canvas, { baseKeys })'));
  assert.ok(appSource.includes('marqueeRectFromPoints(startPoint'));
  assert.ok(appSource.includes('marqueeContainsRectCenter(marquee'));
  assert.ok(appSource.includes('this.expandFreeformGroupKeys(rawHits)'));
  assert.ok(appSource.includes('event.shiftKey ? this.getFreeformSelectedKeys() : []'));
  assert.ok(appSource.includes('event.pointerType === "touch"'));
  assert.ok(css.includes('.freeform-marquee-box.is-visible{display:block}'));
  assert.ok(css.includes('.is-freeform-marquee-hit'));
});

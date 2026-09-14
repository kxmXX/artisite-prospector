import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.document = { addEventListener() {} };
const { App } = await import('../public/js/app.js');
const { state } = await import('../public/js/state.js');
const { generateSite } = await import('../public/js/engine/generator.js');

function setup(t, approval = false) {
  const app = Object.create(App.prototype);
  app.showToast = () => {};
  state.currentProject = generateSite({ name: 'Original', tradeId: 'plombier' });
  state.projects = [state.currentProject];
  state.currentView = 'editor';
  state.activeDrawer = 'new_project';
  state.undoStack = []; state.redoStack = [];
  const elements = {
    'copilot-prompt-input': { value: 'Change le titre' },
    ...(approval ? {
      'copilot-feedback': { innerHTML: '', classList: { remove() {}, add() {} } },
      'btn-approve-ai': {}, 'btn-reject-ai': {}
    } : {})
  };
  document.getElementById = id => elements[id] || null;
  document.querySelector = () => null;
  const originalFetch = globalThis.fetch;
  let resolve;
  globalThis.fetch = () => new Promise(r => { resolve = r; });
  t.after(() => {
    globalThis.fetch = originalFetch;
    app._aiRequests?.forEach(r => r.dispose());
  });
  return { app, elements, respond: () => resolve({ ok: true,
    json: async () => ({ success: true, data: { updatedTitle: 'IA' } }) }) };
}
const event = { preventDefault() {} };

test('delayed assistant response preserves edits and history', async t => {
  const { app, respond } = setup(t);
  const pending = app.submitCopilotPrompt(event);
  const hero = state.currentProject.sections.find(s => s.type === 'hero');
  state.updateSectionContent(hero.id, 'title', 'Manuel');
  const snapshot = JSON.stringify(state.currentProject);
  const history = state.undoStack.length;
  respond(); await pending;
  assert.equal(JSON.stringify(state.currentProject), snapshot);
  assert.equal(state.undoStack.length, history);
});

test('leaving and returning to same project invalidates pending response', async t => {
  const { app, respond } = setup(t);
  const original = state.currentProject;
  const pending = app.submitCopilotPrompt(event);
  state.setCurrentProject(generateSite({ name: 'Other' }));
  state.setCurrentProject(original);
  respond(); await pending;
  assert.equal(state.currentProject, original);
  assert.equal(state.undoStack.length, 0);
});

test('approval rechecks contents, even for direct edits without a notification', async t => {
  const { app, respond, elements } = setup(t, true);
  const pending = app.submitCopilotPrompt(event);
  respond(); await pending;
  state.currentProject.name = 'Personnalisé';
  elements['btn-approve-ai'].onclick();
  assert.equal(state.currentProject.name, 'Personnalisé');
  assert.equal(state.undoStack.length, 0);
});

test('unchanged response applies once and Undo restores original', async t => {
  const { app, respond, elements } = setup(t, true);
  const before = JSON.stringify(state.currentProject);
  const pending = app.submitCopilotPrompt(event);
  respond(); await pending;
  elements['btn-approve-ai'].onclick();
  elements['btn-approve-ai'].onclick();
  assert.equal(state.currentProject.sections.find(s => s.type === 'hero').content.title, 'IA');
  assert.equal(state.undoStack.length, 1);
  state.undo();
  assert.equal(JSON.stringify(state.currentProject), before);
});

test('newer request invalidates older request', t => {
  const { app } = setup(t);
  const old = app.beginAIRequest('copilot');
  const latest = app.beginAIRequest('copilot');
  assert.equal(old.current(), false);
  assert.equal(latest.current(), true);
});

test('wizard completion cannot open a project after its drawer closes', async t => {
  const { app, respond } = setup(t);
  const originalTimeout = globalThis.setTimeout;
  const timers = [];
  globalThis.setTimeout = fn => { timers.push(fn); };
  t.after(() => { globalThis.setTimeout = originalTimeout; });
  const original = state.currentProject;
  const pending = app.handleWizardSubmit(event);
  respond(); await pending;
  state.closeDrawer();
  timers.forEach(fn => fn());
  assert.equal(state.currentProject, original);
  assert.equal(state.projects.length, 1);
});


function setupImageGeneration(t) {
  const app = Object.create(App.prototype);
  app.showToast = () => {};
  const project = generateSite({ name: 'Image Original', tradeId: 'paysagiste', city: 'Montauban' });
  state.currentProject = project;
  state.projects = [project];
  state.currentView = 'editor';
  state.activeDrawer = 'image_modal';
  state.undoStack = []; state.redoStack = [];
  const hero = project.sections.find(s => s.type === 'hero');
  state.activeImageMeta = { sectionId: hero.id, fieldPath: 'heroImage', itemIndex: null, currentUrl: hero.content.heroImage || '', sectionType: 'hero' };
  const elements = {
    'ai-image-prompt-input': { value: 'Jardin premium au coucher du soleil' },
    'btn-generate-ai-photo': { disabled: false, innerHTML: '' },
    'ai-image-output-container': { classList: { remove() {} } },
    'ai-generated-preview-img': { src: '' }
  };
  document.getElementById = id => elements[id] || null;
  document.querySelector = () => null;
  const originalFetch = globalThis.fetch;
  let resolve;
  globalThis.fetch = () => new Promise(r => { resolve = r; });
  t.after(() => {
    globalThis.fetch = originalFetch;
    app._aiRequests?.forEach(r => r.dispose());
    state.activeImageMeta = null;
  });
  return {
    app, project, hero, elements,
    respond: (imageUrl = 'https://example.test/generated.jpg') => resolve({ ok: true, json: async () => ({ imageUrl }) })
  };
}

test('delayed AI photo is ignored after image target changes', async t => {
  const { app, project, elements, respond } = setupImageGeneration(t);
  const services = project.sections.find(s => s.type === 'services');
  const pending = app.generateAIPhoto();
  state.activeImageMeta = { sectionId: services.id, fieldPath: 'services.0.image', itemIndex: null, currentUrl: '', sectionType: 'services' };
  respond();
  await pending;
  assert.notEqual(app.lastGeneratedAIPhotoUrl, 'https://example.test/generated.jpg');
  assert.equal(elements['ai-generated-preview-img'].src, '');
});

test('delayed AI photo is ignored after project changes', async t => {
  const { app, respond } = setupImageGeneration(t);
  const pending = app.generateAIPhoto();
  state.setCurrentProject(generateSite({ name: 'Other image project', tradeId: 'plombier' }));
  respond();
  await pending;
  assert.notEqual(app.lastGeneratedAIPhotoUrl, 'https://example.test/generated.jpg');
});

test('AI photo remains bound to its original target through apply', async t => {
  const { app, project, hero, elements, respond } = setupImageGeneration(t);
  const generatedUrl = 'https://example.test/hero-generated.jpg';
  const pending = app.generateAIPhoto();
  respond(generatedUrl);
  await pending;
  assert.equal(app.lastGeneratedAIPhotoUrl, generatedUrl);
  assert.equal(elements['ai-generated-preview-img'].src, generatedUrl);

  const services = project.sections.find(s => s.type === 'services');
  const serviceBefore = services.content.services[0]?.image;
  state.activeImageMeta = { sectionId: services.id, fieldPath: 'services.0.image', itemIndex: null, currentUrl: serviceBefore || '', sectionType: 'services' };
  app.applyGeneratedAIPhoto();
  assert.equal(project.sections.find(s => s.id === services.id).content.services[0]?.image, serviceBefore, 'generated hero image must not leak into a new target');

  state.activeImageMeta = { sectionId: hero.id, fieldPath: 'heroImage', itemIndex: null, currentUrl: hero.content.heroImage || '', sectionType: 'hero' };
  app.lastGeneratedAIPhotoUrl = generatedUrl;
  app.lastGeneratedAIPhotoMeta = { projectId: project.id, sectionId: hero.id, fieldPath: 'heroImage', itemIndex: null, sectionType: 'hero' };
  app.applyGeneratedAIPhoto();
  assert.equal(state.currentProject.sections.find(s => s.id === hero.id).content.heroImage, generatedUrl, 'matching target should receive generated image');
});

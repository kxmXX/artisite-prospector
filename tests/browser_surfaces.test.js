import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = (rel) => fs.readFileSync(new URL('../' + rel, import.meta.url), 'utf8');
const { generateSite } = await import('../public/js/engine/generator.js');
const { renderEditor } = await import('../public/js/components/editor.js');
const { renderWebsiteHTML } = await import('../public/js/components/renderer.js');
const { state } = await import('../public/js/state.js');

test('le chrome declare les surfaces du navigateur dans ses jetons', () => {
  const tokens = css('public/css/tokens.css');
  for (const token of ['--ui-selection-bg', '--ui-selection-fg', '--ui-caret', '--ui-scrollbar-thumb', '--ui-scrollbar-thumb-hover']) {
    assert.ok(tokens.includes(token + ':'), 'jeton manquant : ' + token);
  }
});

test('selection, curseur, barres et chiffres sont themes, pas laisses au defaut', () => {
  const app = css('public/css/app.css');
  assert.ok(app.includes('.studio-editor ::selection'), 'la selection doit etre themee');
  assert.ok(app.includes('caret-color: var(--ui-caret)'), 'le curseur de saisie doit etre theme');
  assert.ok(app.includes('.studio-editor *::-webkit-scrollbar-thumb'), 'la barre de defilement doit etre themee');
  assert.ok(app.includes('scrollbar-color: var(--ui-scrollbar-thumb)'), 'Firefox doit etre couvert');
  assert.ok(app.includes('font-variant-numeric: tabular-nums'), 'les chiffres alignes doivent etre demandes');
  assert.ok(app.includes('.studio-editor input::placeholder'), 'le texte de substitution doit etre theme');
});

test('les surfaces du navigateur ne debordent pas sur le site publie', () => {
  const app = css('public/css/app.css');
  const scoped = app.split('\n').filter((l) => /::selection|::-webkit-scrollbar|caret-color/.test(l));
  assert.ok(scoped.length > 0, 'le theme doit exister');
  for (const line of scoped) {
    assert.ok(line.includes('.studio-editor'), 'regle non bornee au chrome : ' + line.trim());
  }
  state.currentProject = generateSite({ name: 'Controle Surfaces', tradeId: 'menuisier' });
  state.currentView = 'editor';
  state.editorMode = 'edit';
  assert.ok(renderEditor(state).includes('studio-editor'), 'la racine du chrome porte la classe de portee');
  const project = state.currentProject;
  assert.ok(!renderWebsiteHTML(project, { isEditor: false, isStandalone: true }).includes('studio-editor'),
    'le site publie ne doit pas porter la classe du chrome');
});

test('le focus du chrome garde un seul vocabulaire', () => {
  const app = css('public/css/app.css');
  assert.ok(!app.includes('--ui-focus'), 'aucun second jeton de focus');
  assert.ok(app.includes('outline: var(--ui-ring)'), 'le focus doit utiliser l anneau unique');
});

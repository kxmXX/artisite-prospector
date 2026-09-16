import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSite } from '../public/js/engine/generator.js';
import { renderInspector } from '../public/js/components/inspector.js';
import { getUiCode } from '../public/js/data/uiIds.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test("le menu d'animation d'image est seul a l'ecran", () => {
  const app = read('public/js/app.js');
  assert.match(app, /\["text", "section", "freeform", "cta", "image"\]/,
    'le menu d image doit etre une famille de controles reconnue');
  assert.match(app, /activeKind !== "image"/, 'les autres menus doivent se fermer');
  assert.match(app, /closeAllFloatingToolbars\("image"\)/, 'ouvrir le menu prend la main');
  const css = read('public/css/studio-v3.css');
  assert.match(css, /body\[data-active-editor-toolbar="image"\] \.freeform-selection-box/,
    'la boite de selection doit s effacer pendant le menu');
});

test('le panneau propose le comparateur avant/apres pour une photo de service', () => {
  const project = generateSite({ name: 'Comparateur', tradeId: 'menuisier', city: 'Lyon' });
  const services = project.sections.find((section) => section.type === 'services');
  const key = getUiCode(project.id, services.id, 'services.0.image');
  const state = { selectedElementKey: key, elementStyleState: 'default', viewport: 'desktop', editorMode: 'design' };
  const html = renderInspector(services, project, state);
  assert.ok(html.includes('Comparateur avant/après'), 'la carte doit etre visible');
  assert.ok(html.includes('enableServiceComparison'), 'le bouton doit etre cable');
  assert.ok(html.includes('Transformer en avant/après'), 'le libelle doit etre clair');
  // Une autre image (galerie) ne doit pas proposer ce reglage.
  const gallery = project.sections.find((section) => section.type === 'gallery');
  if (gallery) {
    const galleryKey = getUiCode(project.id, gallery.id, 'photos.0.url');
    const other = renderInspector(gallery, project, Object.assign({}, state, { selectedElementKey: galleryKey }));
    assert.ok(!other.includes('enableServiceComparison'), 'pas de comparateur hors services');
  }
});

test("le serveur local ne laisse plus le navigateur garder un JS d'une heure", () => {
  const server = read('server.js');
  assert.match(server, /function cacheControlHeader/, 'la politique doit etre centralisee');
  assert.match(server, /return "no-cache"/, 'en local, tout se revalide');
  assert.ok(!/Cache-Control": ext === ".html"/.test(server), 'plus de max-age=3600 en dur');
});
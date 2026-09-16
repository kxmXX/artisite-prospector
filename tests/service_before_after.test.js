import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSite } from '../public/js/engine/generator.js';
import { renderWebsiteHTML } from '../public/js/components/renderer.js';
import { renderInspector } from '../public/js/components/inspector.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('une photo de service avec avant + apres devient un comparateur', () => {
  const project = generateSite({ name: 'Comparateur Service', tradeId: 'menuisier', city: 'Lyon' });
  const services = project.sections.find((section) => section.type === 'services');
  services.content.services[0].beforeImage = 'https://exemple.test/avant.jpg';
  services.content.services[0].afterImage = 'https://exemple.test/apres.jpg';
  const html = renderWebsiteHTML(project, { isEditor: false });
  assert.ok(html.includes('https://exemple.test/avant.jpg'), 'la photo avant doit etre rendue');
  assert.ok(html.includes('https://exemple.test/apres.jpg'), 'la photo apres doit etre rendue');
  assert.ok(html.includes('ba-container'), 'le comparateur doit etre rendu');
  assert.ok(html.includes('>AVANT<') && html.includes('>APRES<'), 'les badges doivent etre presents');
  assert.ok(html.includes('data-split-direction="horizontal"'), 'le comparateur doit etre cable');
});

test('sans les deux photos, la carte service reste une image simple', () => {
  const base = generateSite({ name: 'Image Simple', tradeId: 'menuisier', city: 'Lyon' });
  const baseCount = (renderWebsiteHTML(base, { isEditor: false }).match(/ba-container/g) || []).length;
  const project = generateSite({ name: 'Image Simple', tradeId: 'menuisier', city: 'Lyon' });
  const services = project.sections.find((section) => section.type === 'services');
  services.content.services[0].beforeImage = 'https://exemple.test/avant.jpg';
  const html = renderWebsiteHTML(project, { isEditor: false });
  assert.equal((html.match(/ba-container/g) || []).length, baseCount,
    'une paire incomplete ne doit pas creer de comparateur');
  assert.ok(!html.includes('https://exemple.test/avant.jpg'), 'une photo avant seule n est pas rendue');
});

test("l'inspecteur propose Avant et Apres pour chaque service", () => {
  const project = generateSite({ name: 'Panneau Services', tradeId: 'menuisier', city: 'Lyon' });
  const services = project.sections.find((section) => section.type === 'services');
  const state = { selectedElementKey: '', elementStyleState: 'default', viewport: 'desktop', editorMode: 'design' };
  const html = renderInspector(services, project, state);
  assert.ok(html.includes('services.0.beforeImage'), 'le bouton Avant doit viser la bonne entree');
  assert.ok(html.includes('services.0.afterImage'), 'le bouton Apres doit viser la bonne entree');
  assert.ok((html.match(/comparateur/g) || []).length >= 1, 'l interface doit expliquer le comparateur');
});

test('le rendu de service partage le comparateur de la galerie', () => {
  const renderer = read('public/js/components/renderer.js');
  assert.match(renderer, /function renderServiceMedia\(srv, idx, sec, options, className\)/);
  assert.match(renderer, /renderServiceComparisonMedia\(srv\.beforeImage, srv\.afterImage/);
  const app = read('public/js/app.js');
  assert.match(app, /prop === "beforeImage" \|\| prop === "afterImage"/, 'le chemin pointe doit poser le type');
});
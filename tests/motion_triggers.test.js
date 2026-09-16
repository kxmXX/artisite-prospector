import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSite } from '../public/js/engine/generator.js';
import { renderWebsiteHTML } from '../public/js/components/renderer.js';
import { renderInspector } from '../public/js/components/inspector.js';
import { motionTriggerIds, getMotionTrigger, motionWhenAttribute } from '../public/js/data/motionPresets.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const stripStyles = (html) => html.replace(/<style[\s\S]*?<\/style>/g, '');

test('le catalogue expose les quatre moments, avec repli sur apparition', () => {
  assert.deepEqual(motionTriggerIds(), ['apparition', 'chargement', 'survol', 'clic']);
  assert.equal(getMotionTrigger('inconnu').id, 'apparition');
  assert.equal(getMotionTrigger(null).id, 'apparition');
  // Le déclencheur par défaut ne pollue pas le HTML : il est implicite.
  assert.equal(motionWhenAttribute('apparition'), '');
  assert.equal(motionWhenAttribute('chargement'), 'chargement');
  assert.equal(motionWhenAttribute('clic'), 'clic');
});

test("le rendu transporte le déclencheur de la section, du texte et de l'image", () => {
  const project = generateSite({ name: 'Declencheur', tradeId: 'paysagiste', city: 'Lyon' });
  const hero = project.sections.find((section) => section.type === 'hero');
  hero.settings = Object.assign({}, hero.settings, {
    motionPreset: 'fade-in',
    motionWhen: 'survol',
    elementMotions: { title: 'slide-up' },
    elementMotionWhens: { title: 'clic' }
  });
  // L'image de service passe par le rendu d'image commun, présent aussi en public.
  const services = project.sections.find((section) => section.type === 'services');
  services.settings = Object.assign({}, services.settings, {
    imageMotions: { image_0: 'fade-in' },
    imageMotionWhens: { image_0: 'chargement' }
  });

  const client = stripStyles(renderWebsiteHTML(project, { isEditor: false }));
  assert.match(client, /data-motion="fade-in"[^>]*data-motion-when="survol"/, 'la section porte son déclencheur');
  assert.match(client, /data-motion="slide-up"[^>]*data-motion-when="clic"/, 'le texte porte le sien sur le site publié');
  assert.match(client, /data-motion="fade-in"[^>]*data-motion-when="chargement"/, "l'image de service porte le sien");

  // Une section sans déclencheur explicite reste « à l'apparition ».
  const plain = generateSite({ name: 'Sans', tradeId: 'menuisier', city: 'Nantes' });
  const plainHero = plain.sections.find((section) => section.type === 'hero');
  plainHero.settings = Object.assign({}, plainHero.settings, { motionPreset: 'fade-in' });
  assert.doesNotMatch(stripStyles(renderWebsiteHTML(plain, { isEditor: false })), /data-motion-when/);
});

test("l'inspecteur propose le déclencheur à côté des autres réglages", () => {
  const project = generateSite({ name: 'Panneau', tradeId: 'paysagiste', city: 'Lyon' });
  const section = project.sections.find((s) => s.type === 'services') || project.sections[0];
  const state = { selectedElementKey: '', elementStyleState: 'default', viewport: 'desktop', editorMode: 'design' };
  section.settings = Object.assign({}, section.settings, { motionPreset: 'fade-in', motionWhen: 'clic' });
  const html = renderInspector(section, project, state);
  assert.match(html, /setSectionMotionTrigger/, 'le réglage doit être câblé');
  for (const id of motionTriggerIds()) {
    assert.ok(html.includes('data-section-when="' + id + '"'), 'bouton manquant : ' + id);
  }
  assert.match(html, /data-section-when="clic" class="motion-loop-btn is-active"/, 'le choix courant est mis en avant');
});

test("les deux runtimes honorent le déclencheur", () => {
  const app = read('public/js/app.js');
  const exporter = read('public/js/engine/exporter.js');
  // Éditeur / aperçu
  assert.match(app, /data-motion-when/);
  assert.match(app, /bindMotionReplay\(el, when\)/);
  assert.match(app, /when === "chargement"/);
  // Export autonome
  assert.match(exporter, /data-motion-when/);
  assert.match(exporter, /initScrollReveal/);
  // Le déclencheur ne remplace pas le preset : les deux attributs coexistent.
  const renderer = read('public/js/components/renderer.js');
  assert.match(renderer, /motionWhenAttribute/);
  assert.match(renderer, /motionTriggerRowHTML/);
});

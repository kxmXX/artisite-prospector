import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSite } from '../public/js/engine/generator.js';
import { renderWebsiteHTML } from '../public/js/components/renderer.js';
import { renderInspector } from '../public/js/components/inspector.js';
import { motionDirectionsFor, getMotionDirection, motionDirectionCSS, MOTION_DIRECTIONS } from '../public/js/data/motionPresets.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
// Le CSS injecté contient les sélecteurs d'attribut : on le retire pour vérifier
// ce qui est réellement posé sur les sections.
const stripStyles = (html) => html.replace(/<style[\s\S]*?<\/style>/g, '');

test("le catalogue ne propose une direction que pour les animations directionnelles", () => {
  assert.deepEqual(motionDirectionsFor('slide-up').map((d) => d.id), ['up', 'down']);
  assert.deepEqual(motionDirectionsFor('slide-in').map((d) => d.id), ['left', 'right']);
  for (const id of ['fade-in', 'zoom-in', 'spring', 'reveal', 'pulse', 'none']) {
    assert.equal(motionDirectionsFor(id).length, 0, id + ' ne doit pas exposer de direction');
  }
  // Le repli est sûr : une direction inconnue retombe sur la première.
  assert.equal(getMotionDirection('slide-in', 'nord').id, 'left');
  assert.equal(getMotionDirection('fade-in', 'up'), null);
});

test("chaque direction a une animation nommée, et le CSS la joue", () => {
  const css = motionDirectionCSS();
  for (const directions of Object.values(MOTION_DIRECTIONS)) {
    for (const direction of directions) {
      assert.ok(direction.animation, direction.id + ' doit nommer son animation');
      assert.ok(css.includes(direction.animation), direction.animation + ' doit être déclarée');
    }
  }
  // Les directions alternatives ont leur propre keyframe, absente d'app.css.
  assert.match(css, /@keyframes motion-slide-down/);
  assert.match(css, /@keyframes motion-slide-from-right/);
  assert.match(css, /\[data-motion="slide-up"\]\[data-motion-direction="down"\]\.is-revealed/);
  assert.match(css, /\[data-motion="slide-in"\]\[data-motion-direction="right"\]\.is-revealed/);
});

test("le rendu transporte la direction choisie dans les deux modes", () => {
  const site = generateSite({ name: 'Jardins Direction', tradeId: 'paysagiste', city: 'Nantes' });
  const target = site.sections.find((section) => section.type === 'services') || site.sections[0];
  target.settings = target.settings || {};
  target.settings.motionPreset = 'slide-up';
  target.settings.motionDirection = 'down';
  const editor = stripStyles(renderWebsiteHTML(site, { isEditor: true }));
  const client = stripStyles(renderWebsiteHTML(site, { isEditor: false }));
  assert.match(editor, /data-motion="slide-up"[^>]*data-motion-direction="down"/);
  assert.match(client, /data-motion="slide-up"[^>]*data-motion-direction="down"/);
  // Une direction qui ne va pas avec l'animation est ignorée plutôt que jouée.
  target.settings.motionDirection = 'right';
  assert.doesNotMatch(stripStyles(renderWebsiteHTML(site, { isEditor: false })), /data-motion-direction="right"/);
});

test("la direction est réglable depuis l'inspecteur et nettoyée au changement d'animation", () => {
  const inspector = read('public/js/components/inspector.js');
  assert.match(inspector, /setSectionMotionDirection/);
  const app = read('public/js/app.js');
  assert.match(app, /setSectionMotionDirection\(sectionId, directionId\)/);
  assert.match(app, /delete sec\.settings\.motionDirection/);
  // Changer pour une animation sans direction efface l'ancien réglage.
  assert.match(app, /if \(!motionDirectionsFor\(preset\)\.length\) delete sec\.settings\.motionDirection/);
  const renderer = read('public/js/components/renderer.js');
  assert.match(renderer, /motionDirectionCSS\(\)/);
});

test("l'inspecteur ne montre la direction que pour une animation qui en a une", () => {
  const project = generateSite({ name: 'Direction Inspecteur', tradeId: 'paysagiste', city: 'Lyon' });
  const section = project.sections.find((s) => s.type === 'services') || project.sections[0];
  const state = { selectedElementKey: '', elementStyleState: 'default', viewport: 'desktop', editorMode: 'design' };
  section.settings = Object.assign({}, section.settings, { motionPreset: 'slide-up', motionDirection: 'down' });
  const directional = renderInspector(section, project, state);
  assert.match(directional, /setSectionMotionDirection/);
  assert.match(directional, /Depuis le bas/);
  assert.match(directional, /Depuis le haut/);
  // Une animation sans direction ne montre pas un réglage inopérant.
  section.settings.motionPreset = 'fade-in';
  delete section.settings.motionDirection;
  assert.doesNotMatch(renderInspector(section, project, state), /setSectionMotionDirection/);
});

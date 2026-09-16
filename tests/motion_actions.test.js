import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSite } from '../public/js/engine/generator.js';
import { renderWebsiteHTML } from '../public/js/components/renderer.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test("chaque surface d'animation propose tester, arrêter et réinitialiser", () => {
  const editor = read('public/js/components/editor.js');
  const renderer = read('public/js/components/renderer.js');
  const inspector = read('public/js/components/inspector.js');
  const app = read('public/js/app.js');
  const css = read('public/css/app.css');

  // Texte (barre flottante), image (menu de l'image), section (inspecteur).
  assert.match(editor, /window\.app\.playActiveTextMotion\(\)/);
  assert.match(editor, /window\.app\.stopActiveTextMotion\(\)/);
  assert.match(editor, /window\.app\.resetActiveTextMotion\(\)/);
  assert.match(renderer, /window\.app\.playImageMotion\(/);
  assert.match(renderer, /window\.app\.stopImageMotion\(/);
  assert.match(renderer, /window\.app\.resetImageMotion\(/);
  assert.match(inspector, /previewSectionMotion\(/);
  assert.match(inspector, /stopSectionMotion\(/);
  assert.match(inspector, /resetSectionMotion\(/);

  for (const method of ['playActiveTextMotion', 'stopActiveTextMotion', 'resetActiveTextMotion', 'playImageMotion', 'stopImageMotion', 'resetImageMotion']) {
    assert.match(app, new RegExp(method + '\\(', 'm'), method + ' doit exister sur App');
  }
  assert.match(css, /\.motion-actions \{/);
  assert.match(css, /\.motion-actions \.motion-loop-btn/);
});

test("le menu d'image rend les trois actions", () => {
  const project = generateSite({ name: 'Actions', tradeId: 'paysagiste', city: 'Lyon' });
  const html = renderWebsiteHTML(project, { isEditor: true });
  assert.ok(html.includes('data-image-actions'), 'les actions image doivent être rendues');
  assert.ok(html.includes('playImageMotion('), 'tester doit être câblé');
  assert.ok(html.includes('stopImageMotion('), 'arrêter doit être câblé');
  assert.ok(html.includes('resetImageMotion('), 'réinitialiser doit être câblé');
});

test("réinitialiser efface tout le réglage d'animation d'une image", () => {
  const app = read('public/js/app.js');
  const start = app.indexOf('resetImageMotion(secId, fieldPath, itemIndex) {');
  assert.ok(start > -1, 'la méthode doit exister');
  const method = app.slice(start, app.indexOf('\n  previewElementMotion', start));
  for (const bucket of ['imageMotions', 'imageMotionLoops', 'imageMotionSpeeds', 'imageMotionDelays']) {
    assert.ok(method.includes(bucket), bucket + ' doit être nettoyé');
  }
});

test("réinitialiser efface le réglage d'animation du texte", () => {
  const app = read('public/js/app.js');
  const start = app.indexOf('resetActiveTextMotion() {');
  assert.ok(start > -1, 'la méthode doit exister');
  const method = app.slice(start, app.indexOf('\n  playImageMotion', start));
  for (const bucket of ['elementMotions', 'elementMotionLoops', 'elementMotionSpeeds', 'elementMotionDelays']) {
    assert.ok(method.includes(bucket), bucket + ' doit être nettoyé');
  }
});

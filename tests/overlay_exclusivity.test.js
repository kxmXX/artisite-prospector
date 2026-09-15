import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test("les surcouches d'édition ne se superposent ni entre elles ni à une modale", () => {
  const css = read('public/css/app.css');
  assert.match(css, /body\.modal-open \.freeform-selection-box/, 'la sélection libre doit disparaître sous une modale');
  assert.match(css, /body\.modal-open \.sec-motion-popover/, "le panneau d'animation doit disparaître sous une modale");
  assert.match(css, /data-active-editor-toolbar="freeform"] \.cta-context-popover/, 'les contrôles concurrents restent exclusifs');

  const app = read('public/js/app.js');
  const motion = app.slice(app.indexOf('toggleSectionMotionMenu'));
  assert.ok(motion.includes('closeAllFloatingToolbars("section")'), "ouvrir le panneau d'animation doit fermer les autres familles");
  const bg = app.slice(app.indexOf('toggleSectionBgMenu'));
  assert.ok(bg.includes('closeAllFloatingToolbars("section")'), 'ouvrir le panneau de fond doit fermer les autres familles');
});

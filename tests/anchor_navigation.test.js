import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSite } from '../public/js/engine/generator.js';
import { renderWebsiteHTML } from '../public/js/components/renderer.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test("les raccourcis du site visent des ancres qui existent vraiment", () => {
  const site = generateSite({ name: 'Jardins Test', tradeId: 'paysagiste', city: 'Lyon' });
  const html = renderWebsiteHTML(site);
  const targets = [...html.matchAll(/href="#([a-zA-Z0-9_-]+)"/g)].map((match) => match[1]);
  assert.ok(targets.length >= 4, 'le site doit proposer des raccourcis');
  for (const target of new Set(targets)) {
    assert.ok(html.includes('id="' + target + '"'), 'ancre manquante: #' + target);
  }
});

test("la vue client fait défiler l'ancre au lieu de naviguer", () => {
  const app = fs.readFileSync(path.join(root, 'public/js/app.js'), 'utf8');
  assert.match(app, /initAnchorScrolling\(\)/);
  assert.match(app, /scrollToAnchor\(/);
  // Le mode conception continue de ne jamais naviguer : seul preview défile.
  assert.match(app, /state\.editorMode !== "preview"/);
});

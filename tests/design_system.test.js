import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { analysis, isDefined } from '../scripts/build-utilities.mjs';
import { UTILITY_CSS, BASE_UTILITY_CSS } from '../public/js/engine/exportStyles.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

// Classes émises par le balisage qui n'appartiennent à aucune famille d'utilitaires
// et n'ont encore aucune règle CSS : marqueurs décoratifs redondants, restes d'anciens
// gabarits, composants à styler. Liste gelée volontairement : toute NOUVELLE classe
// sans règle fait échouer ces tests. Le lot de finition UI doit la faire diminuer.
const UNSTYLED_APP = [
  'ai-avatar-wrapper', 'app-dashboard-shell', 'btn-sec-bg', 'btn-sec-down', 'btn-sec-dup',
  'btn-sec-insert', 'btn-sec-up', 'btn-sec-vis', 'card', 'cmd-group', 'cta-direct-gear',
  'dashboard-topbar', 'dashboard-v3-field-name', 'footer', 'gallery-card', 'header',
  'inclusions', 'no-scrollbar', 'placeholder-zinc-400', 'price-val', 'pricing',
  'review-rating-star', 'sig-box', 'sig-img', 'simulateur-roi-slider', 'site-theme-icon-dark',
  'site-theme-icon-light', 'site-theme-label', 'studio-system', 'sub', 'tab-nav-btn', 'title',
  'vitrine-about-copy', 'vitrine-brand-name'
];
const UNSTYLED_EXPORT = [
  'btn-sec-bg', 'btn-sec-down', 'btn-sec-dup', 'btn-sec-insert', 'btn-sec-up', 'btn-sec-vis',
  'cta-direct-gear', 'gallery-card', 'review-rating-star', 'simulateur-roi-slider',
  'site-theme-icon-dark', 'site-theme-icon-light', 'site-theme-label', 'tab-nav-btn',
  'vitrine-about-copy', 'vitrine-brand-name'
];

const tokensFor = (surface) => [...new Set(
  analysis.unresolved.filter((entry) => entry.surface === surface).map((entry) => entry.token)
)].sort();

test('la couche d\'utilitaires générée est à jour et déterministe', () => {
  const output = execFileSync(process.execPath, ['scripts/build-utilities.mjs', '--check'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  assert.match(output, /artefacts à jour/);
});

test('aucune nouvelle classe émise ne reste sans règle CSS', () => {
  assert.deepEqual(tokensFor('app'), UNSTYLED_APP, 'classes sans règle côté application');
  assert.deepEqual(tokensFor('export'), UNSTYLED_EXPORT, 'classes sans règle côté export');
  assert.ok(analysis.appRules > 300, 'la couche applicative doit couvrir les utilitaires manquants');
  assert.ok(analysis.exportRules > 300, 'la couche export doit couvrir les utilitaires manquants');
});

test('les tailles arbitraires, variantes et états sont réellement définis', () => {
  const app = read('public/css/utilities.css');
  for (const expected of [
    '.text-\\[10px\\]',
    '.text-\\[11px\\]',
    '.hover\\:bg-zinc-100:hover',
    '.focus\\:border-zinc-900:focus',
    'body.dark-theme .dark\\:text-white',
    '@media (min-width: 640px)'
  ]) {
    assert.ok(app.includes(expected), 'règle manquante dans la couche applicative : ' + expected);
  }
});

test('l\'export autonome embarque la même couche que l\'application', () => {
  assert.ok(UTILITY_CSS.includes(BASE_UTILITY_CSS), 'la base historique doit rester incluse');
  assert.ok(UTILITY_CSS.length > BASE_UTILITY_CSS.length + 5000, 'la couche générée doit être ajoutée à l\'export');
  for (const expected of ['border-radius', 'padding-left']) {
    assert.ok(UTILITY_CSS.includes(expected), 'déclaration absente de l\'export : ' + expected);
  }
});

test('la politique de focus reste unique et visible au clavier', () => {
  const tokens = read('public/css/tokens.css');
  assert.ok(tokens.includes('--ui-ring'), 'anneau de focus déclaré dans tokens.css');
  assert.ok(tokens.includes(':focus-visible'), 'règle :focus-visible globale');
  const app = read('public/css/utilities.css');
  assert.ok(!app.includes('.focus\\:outline-none'), 'focus:outline-none ne doit pas être généré');
  assert.ok(!app.includes('peer-focus\\:outline-none'), 'peer-focus:outline-none ne doit pas être généré');
});

test('les jetons historiquement référencés sans déclaration le sont désormais', () => {
  const tokens = read('public/css/tokens.css');
  for (const token of ['--primary', '--btn-radius', '--card-radius', '--motion-ease', '--font-heading', '--font-body', '--sticky-left', '--sticky-top', '--sticky-bottom']) {
    assert.ok(tokens.includes(token + ':'), 'jeton non déclaré : ' + token);
  }
});

test('les marqueurs décoratifs de type « IA » ne reviennent pas', () => {
  const appSource = read('public/js/app.js');
  const rendererSource = read('public/js/components/renderer.js');
  const appCss = read('public/css/app.css');
  for (const forbidden of ['from-indigo-500', 'to-purple-600', 'bg-indigo-50', 'text-indigo-700', 'border-indigo-200']) {
    assert.ok(!appSource.includes(forbidden), 'classe décorative interdite de retour : ' + forbidden);
  }
  assert.ok(!appSource.includes('animate-ping'), 'animation gratuite animate-ping retirée');
  assert.ok(!rendererSource.includes('animate-bounce'), 'animation gratuite animate-bounce retirée');
  assert.ok(!appCss.includes('#6366f1'), 'dégradé indigo/violet retiré du chrome');
});

test('le HTML autonome exporté se suffit à lui-même', async () => {
  const { exportStandaloneHTML } = await import('../public/js/engine/exporter.js');
  const { SAMPLE_PROJECTS } = await import('../public/js/data/sampleProjects.js');
  const html = exportStandaloneHTML(JSON.parse(JSON.stringify(SAMPLE_PROJECTS[0])));
  const styles = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((match) => match[1]).join('\n');

  const used = new Set();
  const attribute = /class="([^"]*)"/g;
  let match;
  while ((match = attribute.exec(html)) !== null) {
    for (const token of match[1].split(/\s+/)) {
      if (!token) continue;
      if (!/^-?[A-Za-z][A-Za-z0-9_:.#%[\]()!/,-]*$/.test(token)) continue;
      used.add(token);
    }
  }

  // Les marqueurs group-*/peer-* n'ont pas de déclaration : ce sont des crochets de variante.
  const markers = (token) => token === 'peer' || token.startsWith('group/') || token.startsWith('peer/');
  const missing = [...used]
    .filter((token) => !markers(token))
    .filter((token) => !isDefined(styles, token))
    .filter((token) => !UNSTYLED_EXPORT.includes(token))
    .sort();
  assert.deepEqual(missing, [], 'classes sans règle dans le HTML autonome exporté');
});

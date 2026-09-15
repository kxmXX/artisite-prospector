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
  'btn-sec-bg', 'btn-sec-down', 'btn-sec-dup', 'btn-sec-insert', 'btn-sec-up', 'btn-sec-vis',
  'card', 'cta-direct-gear', 'footer', 'gallery-card', 'header', 'inclusions', 'price-val',
  'pricing', 'review-rating-star', 'sig-box', 'sig-img', 'simulateur-roi-slider',
  'site-theme-icon-dark', 'site-theme-icon-light', 'site-theme-label', 'studio-system', 'sub',
  'tab-nav-btn', 'title', 'vitrine-about-copy', 'vitrine-brand-name'
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

const CHROME_FILES = [
  'public/js/app.js',
  'public/js/components/editor.js',
  'public/js/components/inspector.js',
  'public/js/components/dashboard.js',
  'public/js/components/commandPalette.js',
  'public/js/components/shareModal.js',
  'public/js/components/closerModal.js',
  'public/js/components/imageModal.js',
  'public/js/components/addSectionModal.js',
  'public/js/components/wizard.js'
];

test('le chrome n\'écrit plus de taille de texte arbitraire', () => {
  const offenders = [];
  for (const relative of CHROME_FILES) {
    const source = read(relative);
    for (const match of source.matchAll(/text-\[\d+(?:\.\d+)?px\]/g)) offenders.push(relative + ' → ' + match[0]);
  }
  assert.deepEqual(offenders, [], 'tailles arbitraires restantes dans le chrome');
  const tokens = read('public/css/tokens.css');
  for (const size of ['2xs', 'xs', 'sm', 'base', 'md']) {
    assert.ok(tokens.includes('.text-ui-' + size), 'classe d\'échelle manquante : text-ui-' + size);
  }
});

test('le chrome ne supprime plus l\'anneau de focus et n\'utilise plus de graisses intermédiaires', () => {
  const offenders = [];
  for (const relative of ['public/css/app.css', 'public/css/studio-v3.css', 'public/css/tokens.css', 'public/css/editor-canvas-viewport.css']) {
    const css = read(relative);
    for (const match of css.matchAll(/outline\s*:\s*(?:0|none)\s*(?:!important)?\s*;?/gi)) {
      offenders.push(relative + ' → ' + match[0].trim());
    }
    for (const match of css.matchAll(/(?:font-weight|font)\s*:\s*(?:600|700)?\s*(640|650|680|690|720|730|750|760)\b/g)) {
      offenders.push(relative + ' → graisse ' + match[1]);
    }
  }
  assert.deepEqual(offenders, [], 'contour de focus supprimé ou graisse non standard');
});

test('les couleurs de texte atténuées du chrome atteignent 4,5:1', () => {
  const luminance = (hex) => {
    const value = hex.replace('#', '');
    const channels = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16) / 255)
      .map((channel) => (channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)));
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const ratio = (first, second) => {
    const a = luminance(first);
    const b = luminance(second);
    const high = Math.max(a, b);
    const low = Math.min(a, b);
    return (high + 0.05) / (low + 0.05);
  };
  const tokens = read('public/css/tokens.css');
  const value = (name) => (new RegExp(name + ':\\s*(#[0-9a-fA-F]{6})').exec(tokens) || [])[1];
  assert.ok(ratio(value('--ui-muted'), '#fbfaf7') >= 4.5, 'texte atténué lisible sur panneau clair');
  assert.ok(ratio(value('--ui-muted'), '#e9ebe7') >= 4.5, 'texte atténué lisible sur canevas');
  assert.ok(ratio(value('--ui-muted-on-dark'), '#18201f') >= 4.5, 'texte atténué lisible sur fond sombre');
});

test('la feuille de style morte a bien été retirée', () => {
  assert.ok(!fs.existsSync(path.join(ROOT, 'public/css/product-precision.css')), 'product-precision.css doit rester supprimé');
  assert.ok(!read('public/index.html').includes('product-precision'), 'aucun lien vers la feuille retirée');
});

test('le chrome déclare une alternative de mouvement et des cibles tactiles de 44 px', () => {
  const css = read('public/css/studio-v3.css');
  assert.ok(css.includes('@media (pointer:coarse)'), 'bloc pointer:coarse présent');
  assert.ok(/@media \(pointer:coarse\)[\s\S]*?min-width:44px/.test(css), 'cibles tactiles portées à 44 px');
  assert.ok(/@media \(prefers-reduced-motion:reduce\)[\s\S]*?\.dashboard-v3-project[\s\S]*?transition:none/.test(css), 'alternative de mouvement sur le dashboard');
});

test('le chrome n a plus qu une seule valeur de rayon pilule', () => {
  const chrome = read('public/css/studio-v3.css');
  assert.ok(!/999px/.test(chrome), 'le chrome doit utiliser le jeton --ui-radius-full, pas une valeur littérale');
  assert.ok(!/9999px/.test(chrome), 'une seule famille de rayons pilule dans le chrome');
  const tokens = read('public/css/tokens.css');
  assert.ok(tokens.includes('--ui-radius-full: 999px'), 'le jeton de rayon pilule est déclaré une seule fois');
});


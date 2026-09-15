#!/usr/bin/env node
/**
 * Artist — générateur de la couche d'utilitaires manquante.
 *
 * Problème résolu : le balisage du produit utilise un vocabulaire d'utilitaires
 * (hérité de Tailwind) dont seules quelques familles sont définies à la main dans
 * app.css. Des centaines de classes émises n'ont donc aucune règle : tailles de
 * texte, états hover/focus, variantes responsive, mode sombre, opacités.
 *
 * Ce script :
 *   1. relève les classes réellement émises par le balisage ;
 *   2. déduit, pour chaque surface, celles qui n'ont aucune règle ;
 *   3. réutilise en priorité les déclarations déjà écrites quelque part dans le
 *      projet (une seule valeur par intention) ;
 *   4. ne synthétise que ce qui n'existe nulle part ;
 *   5. écrit DEUX artefacts depuis cette source unique :
 *        - public/css/utilities.css            (application / éditeur / aperçu)
 *        - public/js/engine/utilitiesCss.js    (site autonome exporté)
 *
 * Usage :
 *   node scripts/build-utilities.mjs            écrit les artefacts
 *   node scripts/build-utilities.mjs --check    vérifie qu'ils sont à jour (code 1 sinon)
 *   node scripts/build-utilities.mjs --report   affiche les classes non couvertes
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const OUT_APP = 'public/css/utilities.css';
const OUT_EXPORT = 'public/js/engine/utilitiesCss.js';

// Corpus « application » : tout ce qui est chargé dans la page de l'éditeur.
const APP_CSS = [
  'public/css/tokens.css',
  'public/css/app.css',
  'public/css/studio-v3.css',
  'public/css/product-precision.css',
  'public/css/editor-canvas-viewport.css'
];
// Corpus « export » : tout ce que le fichier HTML autonome embarque.
const EXPORT_CSS = [
  'public/js/engine/exportStyles.js',
  'public/js/engine/exporter.js'
];
// CSS injecté en ligne par le renderer, donc présent sur les DEUX surfaces.
const SHARED_INLINE_CSS = ['public/js/components/heroStyles.js'];

const APP_MARKUP = { dirs: ['public'], files: ['public/index.html'] };
// Le HTML autonome est assemblé par le renderer (corps) et par l'exporteur
// (coquille, en-tête, styles en ligne) : les deux doivent être analysés.
const EXPORT_MARKUP = { dirs: [], files: ['public/js/components/renderer.js', 'public/js/components/heroStyles.js', 'public/js/engine/exporter.js'] };

// Utilitaires volontairement NON générés : le produit possède une politique de
// focus unique (voir tokens.css). Générer focus:outline-none remettrait un
// outline transparent qui masquerait l'anneau de focus.
const SUPPRESSED = new Set(['outline-none', 'outline', 'focus:outline-none', 'peer-focus:outline-none']);

// Marqueurs de groupe Tailwind : ils n'ont pas de déclaration, ils servent de crochet
// aux variantes group-*/peer-* et sont donc attendus sans règle CSS.
const MARKERS = new Set(['group', 'peer']);

const PALETTE = {
  transparent: 'transparent',
  current: 'currentColor',
  black: '#000000',
  white: '#ffffff',
  slate: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617' },
  gray: { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827', 950: '#030712' },
  zinc: { 50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8', 400: '#a1a1aa', 500: '#71717a', 600: '#52525b', 700: '#3f3f46', 800: '#27272a', 900: '#18181b', 950: '#09090b' },
  red: { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a' },
  amber: { 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f', 950: '#451a03' },
  emerald: { 50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b', 950: '#022c22' },
  indigo: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81', 950: '#1e1b4b' },
  blue: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554' },
  purple: { 50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87', 950: '#3b0764' },
  orange: { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12', 950: '#431407' }
};

const FONT_SIZES = { '2xs': '0.625rem', xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem', '5xl': '3rem', '6xl': '3.75rem', '7xl': '4.5rem', '8xl': '6rem', '9xl': '8rem' };
const LEADINGS = { none: '1', tight: '1.25', snug: '1.375', normal: '1.5', relaxed: '1.625', loose: '2' };
const RADII = { none: '0px', sm: '0.125rem', DEFAULT: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', '2xl': '1rem', '3xl': '1.5rem', full: '9999px' };
const SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none'
};
const MAX_WIDTHS = { xs: '20rem', sm: '24rem', md: '28rem', lg: '32rem', xl: '36rem', '2xl': '42rem', '3xl': '48rem', '4xl': '56rem', '5xl': '64rem', '6xl': '72rem', '7xl': '80rem', full: '100%', none: 'none', min: 'min-content', max: 'max-content', fit: 'fit-content', prose: '65ch' };
const KEYWORDS = { full: '100%', auto: 'auto', screen: '100vw', min: 'min-content', max: 'max-content', fit: 'fit-content', none: 'none' };
const BREAKPOINTS = { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' };

const SPACING_SIDES = {
  p: ['padding'], px: ['padding-left', 'padding-right'], py: ['padding-top', 'padding-bottom'],
  pt: ['padding-top'], pb: ['padding-bottom'], pl: ['padding-left'], pr: ['padding-right'],
  m: ['margin'], mx: ['margin-left', 'margin-right'], my: ['margin-top', 'margin-bottom'],
  mt: ['margin-top'], mb: ['margin-bottom'], ml: ['margin-left'], mr: ['margin-right'],
  gap: ['gap'], 'row-gap': ['row-gap'], 'col-gap': ['column-gap']
};
const SIZE_PROPS = { w: ['width'], h: ['height'], 'min-w': ['min-width'], 'max-w': ['max-width'], 'min-h': ['min-height'], 'max-h': ['max-height'] };
const INSET_PROPS = { top: ['top'], right: ['right'], bottom: ['bottom'], left: ['left'], inset: ['inset'], 'inset-x': ['left', 'right'], 'inset-y': ['top', 'bottom'] };
const CHILD_SUFFIX = ' > :not([hidden]) ~ :not([hidden])';

const VARIANTS = [
  ['group-hover/', 'groupName'],
  ['group-focus/', 'groupName'],
  ['group-hover:', 'group'],
  ['group-focus:', 'group'],
  ['peer-checked:', 'peerChecked'],
  ['peer-focus:', 'peerFocus'],
  ['peer-hover:', 'peerHover'],
  ['focus-visible:', 'focusVisible'],
  ['placeholder:', 'placeholder'],
  ['selection:', 'selection'],
  ['after:', 'after'],
  ['before:', 'before'],
  ['hover:', 'hover'],
  ['focus:', 'focus'],
  ['active:', 'active'],
  ['disabled:', 'disabled'],
  ['sm:', 'sm'],
  ['md:', 'md'],
  ['lg:', 'lg'],
  ['xl:', 'xl'],
  ['dark:', 'dark']
];

const VARIANT_RANK = { hover: 1, focus: 1, focusVisible: 1, active: 1, disabled: 1, after: 1, before: 1, placeholder: 1, selection: 1, group: 2, groupName: 2, peerChecked: 2, peerFocus: 2, peerHover: 2, dark: 3, sm: 4, md: 5, lg: 6, xl: 7 };

function readIfExists(relative) {
  const absolute = path.join(ROOT, relative);
  return fs.existsSync(absolute) ? fs.readFileSync(absolute, 'utf8') : '';
}

function walk(dir, out) {
  const absolute = path.join(ROOT, dir);
  if (!fs.existsSync(absolute)) return out;
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(relative, out);
    else if (/\.(js|html)$/.test(entry.name)) out.push(relative);
  }
  return out;
}

function listMarkupFiles(spec) {
  const files = [];
  for (const dir of spec.dirs) walk(dir, files);
  for (const file of spec.files) if (fs.existsSync(path.join(ROOT, file))) files.push(file);
  return [...new Set(files)];
}

function stripTemplateExpressions(value) {
  let out = '';
  let i = 0;
  while (i < value.length) {
    if (value[i] === '$' && value[i + 1] === '{') {
      let depth = 1;
      i += 2;
      while (i < value.length && depth > 0) {
        if (value[i] === '{') depth += 1;
        else if (value[i] === '}') depth -= 1;
        i += 1;
      }
    } else {
      out += value[i];
      i += 1;
    }
  }
  return out;
}

function collectUsedClasses(files) {
  const used = new Map();
  const attribute = /class="([^"]*)"|class='([^']*)'/g;
  for (const file of files) {
    const source = readIfExists(file);
    let match;
    attribute.lastIndex = 0;
    while ((match = attribute.exec(source)) !== null) {
      const raw = match[1] !== undefined ? match[1] : match[2];
      for (const token of stripTemplateExpressions(raw).split(/[\s'"+,]+/)) {
        if (!token) continue;
        if (token.endsWith('-')) continue;
        if (token.includes('[') !== token.includes(']')) continue;
        if (!/^-?[A-Za-z][A-Za-z0-9_:.#%[\]()!/,-]*$/.test(token)) continue;
        used.set(token, (used.get(token) || 0) + 1);
      }
    }
  }
  return used;
}

function escapeClass(cls) {
  return cls.replace(/[^A-Za-z0-9_-]/g, (character) => '\\' + character);
}

// Un sélecteur est suivi soit par la fin d'un nom (accolade, virgule, deux-points…),
// soit par un combinateur. Exiger un caractère de sélecteur après le nom évite les faux
// positifs sur du code JavaScript (ex. « toast.style.transform = … » dans exporter.js).
const SELECTOR_TAIL = /[{,:.>#[+~*]/;

export function isDefined(corpus, cls) {
  const needle = '.' + escapeClass(cls);
  let from = 0;
  while (true) {
    const index = corpus.indexOf(needle, from);
    if (index < 0) return false;
    const after = corpus.slice(index + needle.length);
    if (!/[A-Za-z0-9_-]/.test(after.slice(0, 1))) {
      const next = after.replace(/^\s+/, '').slice(0, 1);
      if (SELECTOR_TAIL.test(next)) return true;
    }
    from = index + 1;
  }
}

function declarationsOf(corpus, cls) {
  const needle = '.' + escapeClass(cls);
  let from = 0;
  while (true) {
    const index = corpus.indexOf(needle, from);
    if (index < 0) return null;
    const after = corpus.slice(index + needle.length, index + needle.length + 1);
    if (/[A-Za-z0-9_-]/.test(after)) { from = index + 1; continue; }
    const open = corpus.indexOf('{', index);
    if (open < 0) return null;
    let depth = 1;
    let cursor = open + 1;
    while (cursor < corpus.length && depth > 0) {
      if (corpus[cursor] === '{') depth += 1;
      else if (corpus[cursor] === '}') depth -= 1;
      cursor += 1;
    }
    const body = corpus.slice(open + 1, cursor - 1);
    if (body.includes('{')) { from = index + 1; continue; }
    return body.split(';').map((piece) => piece.trim()).filter(Boolean);
  }
}

function hexToRgb(hex) {
  let value = hex.replace('#', '');
  if (value.length === 3) value = value.split('').map((character) => character + character).join('');
  if (value.length !== 6) return null;
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)];
}

function withAlpha(hex, alpha) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return 'rgba(' + rgb.join(', ') + ', ' + alpha + ')';
}

function resolveColorToken(token) {
  if (!token) return null;
  if (token.startsWith('#')) return token;
  if (token === 'white') return PALETTE.white;
  if (token === 'black') return PALETTE.black;
  if (token === 'transparent') return 'transparent';
  if (token === 'current') return 'currentColor';
  const match = /^([a-z]+)-([a-z0-9]+)$/.exec(token);
  if (!match) return null;
  const family = PALETTE[match[1]];
  if (!family || typeof family !== 'object') return null;
  return family[match[2]] || null;
}

function splitColorAndAlpha(value) {
  const index = value.lastIndexOf('/');
  if (index < 0) return { color: value, alpha: null };
  const alpha = value.slice(index + 1);
  if (!/^\d+(\.\d+)?$/.test(alpha)) return { color: value, alpha: null };
  return { color: value.slice(0, index), alpha: String(Number(alpha) / 100) };
}

function fractionValue(key) {
  const match = /^(\d+)\/(\d+)$/.exec(key);
  if (!match) return null;
  return (Number(match[1]) / Number(match[2]) * 100) + '%';
}

function spacingValue(key, corpus) {
  if (key.startsWith('[') && key.endsWith(']')) return key.slice(1, -1);
  const fraction = fractionValue(key);
  if (fraction) return fraction;
  if (KEYWORDS[key]) return KEYWORDS[key];
  const known = declarationsOf(corpus, 'gap-' + key) || declarationsOf(corpus, 'p-' + key);
  if (known) {
    const gap = known.find((piece) => piece.startsWith('gap:'));
    if (gap) return gap.slice(4).trim();
    const padding = known.find((piece) => piece.startsWith('padding:'));
    if (padding) return padding.slice(8).trim();
  }
  if (key === 'px') return '1px';
  if (key === 'auto') return 'auto';
  const numeric = Number(key);
  if (Number.isFinite(numeric)) return (numeric * 0.25) + 'rem';
  return null;
}

function sizeValue(key, corpus, property) {
  if (key.startsWith('[') && key.endsWith(']')) return key.slice(1, -1);
  const fraction = fractionValue(key);
  if (fraction) return fraction;
  if (property === 'max-width' && MAX_WIDTHS[key]) return MAX_WIDTHS[key];
  const existing = declarationsOf(corpus, (property === 'width' ? 'w-' : property === 'height' ? 'h-' : property.replace('min-', 'min-').replace('max-', 'max-')) + key);
  if (existing) {
    const declaration = existing.find((piece) => piece.startsWith(property + ':'));
    if (declaration) return declaration.slice(property.length + 1).trim();
  }
  if (KEYWORDS[key]) return KEYWORDS[key];
  const numeric = Number(key);
  if (Number.isFinite(numeric)) return (numeric * 0.25) + 'rem';
  return null;
}

function arbitraryValue(key) {
  if (key.startsWith('[') && key.endsWith(']')) return key.slice(1, -1);
  return null;
}

/**
 * Synthétise une utilité de base (sans variante). Renvoie { declarations, suffix }.
 * Renvoie null si la classe n'appartient à aucune famille connue.
 */
function synthesize(base, corpus) {
  const declarations = [];
  let suffix = null;

  // Couleur arbitraire : text-[#rrggbb], bg-[#rrggbb], border-[#rrggbb]
  let match = /^(text|bg|border|ring|accent|divide|from|via|to)-\[(#[0-9A-Fa-f]{3,8})\](?:\/(\d+))?$/.exec(base);
  if (match) {
    const [, family, hex, alpha] = match;
    const value = alpha ? withAlpha(hex, String(Number(alpha) / 100)) : hex;
    if (family === 'text') declarations.push('color: ' + value);
    if (family === 'bg') declarations.push('background-color: ' + value);
    if (family === 'border') declarations.push('border-color: ' + value);
    if (family === 'ring') declarations.push('--ui-ring-c: ' + value);
    if (family === 'accent') declarations.push('accent-color: ' + value);
    return { declarations, suffix };
  }

  // Taille de police arbitraire : text-[10.5px]
  match = /^text-\[(-?[\d.]+(?:px|rem|em))\]$/.exec(base);
  if (match) return { declarations: ['font-size: ' + match[1]], suffix };

  // Couleurs nommées
  match = /^(text|bg|border|divide|ring|accent|from|via|to)-(.+)$/.exec(base);
  if (match) {
    const [, family, rest] = match;
    if (family === 'text' && (FONT_SIZES[rest] || /^\[/.test(rest))) {
      const size = FONT_SIZES[rest] || arbitraryValue(rest);
      return { declarations: ['font-size: ' + size], suffix };
    }
    const { color, alpha } = splitColorAndAlpha(rest);
    const resolved = resolveColorToken(color);
    if (resolved) {
      const value = alpha ? withAlpha(resolved, alpha) : resolved;
      if (family === 'text') declarations.push('color: ' + value);
      if (family === 'bg') declarations.push('background-color: ' + value);
      if (family === 'border') declarations.push('border-color: ' + value);
      if (family === 'divide') { declarations.push('border-color: ' + value); suffix = CHILD_SUFFIX; }
      if (family === 'ring') declarations.push('--ui-ring-c: ' + value);
      if (family === 'accent') declarations.push('accent-color: ' + value);
      if (family === 'from') declarations.push('--ui-gradient-from: ' + value);
      if (family === 'via') declarations.push('--ui-gradient-via: ' + value);
      if (family === 'to') declarations.push('--ui-gradient-to: ' + value);
      if (family === 'ring' || family === 'from' || family === 'via' || family === 'to') {
        declarations.push('box-shadow: 0 0 0 var(--ui-ring-w, 0) var(--ui-ring-c, transparent)');
      }
      return { declarations, suffix };
    }
  }

  // Espacements
  match = /^(-?)(p[xytrbl]?|m[xytrbl]?|gap|space-[xy])-(.+)$/.exec(base);
  if (match) {
    const [, negative, family, key] = match;
    const value = spacingValue(key, corpus);
    if (value) {
      const signed = negative ? 'calc(-1 * ' + value + ')' : value;
      if (family === 'space-y') return { declarations: ['margin-top: ' + signed], suffix: CHILD_SUFFIX };
      if (family === 'space-x') return { declarations: ['margin-left: ' + signed], suffix: CHILD_SUFFIX };
      const props = SPACING_SIDES[family];
      if (props) return { declarations: props.map((property) => property + ': ' + signed), suffix };
    }
  }

  // Dimensions
  match = /^(w|h|min-w|max-w|min-h|max-h)-(.+)$/.exec(base);
  if (match) {
    const [, family, key] = match;
    const property = SIZE_PROPS[family][0];
    const value = sizeValue(key, corpus, property);
    if (value) return { declarations: [property + ': ' + value], suffix };
  }

  // Position
  match = /^(-?)(inset-x|inset-y|top|right|bottom|left|inset)-(.+)$/.exec(base);
  if (match) {
    const [, negative, family, key] = match;
    const value = spacingValue(key, corpus);
    if (value) {
      const signed = negative ? 'calc(-1 * ' + value + ')' : value;
      return { declarations: INSET_PROPS[family].map((property) => property + ': ' + signed), suffix };
    }
  }

  // Ratios
  match = /^aspect-(video|square|auto|\[.+\])$/.exec(base);
  if (match) {
    const preset = { video: '16 / 9', square: '1 / 1', auto: 'auto' }[match[1]];
    return { declarations: ['aspect-ratio: ' + (preset || arbitraryValue(match[1]))], suffix };
  }

  // Grilles
  match = /^grid-cols-(\d+|\[.+\])$/.exec(base);
  if (match) {
    const value = arbitraryValue(match[1]) || 'repeat(' + match[1] + ', minmax(0, 1fr))';
    return { declarations: ['grid-template-columns: ' + value], suffix };
  }
  match = /^col-span-(\d+)$/.exec(base);
  if (match) return { declarations: ['grid-column: span ' + match[1] + ' / span ' + match[1]], suffix };
  match = /^order-(\d+)$/.exec(base);
  if (match) return { declarations: ['order: ' + match[1]], suffix };
  if (base === 'divide-y') return { declarations: ['border-top-width: 1px'], suffix: CHILD_SUFFIX };
  if (base === 'divide-x') return { declarations: ['border-left-width: 1px'], suffix: CHILD_SUFFIX };
  if (base === 'divide-y-0') return { declarations: ['border-top-width: 0px'], suffix: CHILD_SUFFIX };

  // Rayons
  match = /^rounded(?:-(t|b|l|r|tl|tr|bl|br))?(?:-(.+))?$/.exec(base);
  if (match) {
    const [, side, key] = match;
    const radiusKey = key || 'DEFAULT';
    const existing = declarationsOf(corpus, 'rounded' + (key ? '-' + key : ''));
    let value = RADII[radiusKey];
    if (existing) {
      const declaration = existing.find((piece) => piece.startsWith('border-radius:'));
      if (declaration) value = declaration.slice('border-radius:'.length).trim();
    }
    if (value) {
      const corners = {
        t: ['border-top-left-radius', 'border-top-right-radius'],
        b: ['border-bottom-left-radius', 'border-bottom-right-radius'],
        l: ['border-top-left-radius', 'border-bottom-left-radius'],
        r: ['border-top-right-radius', 'border-bottom-right-radius'],
        tl: ['border-top-left-radius'], tr: ['border-top-right-radius'],
        bl: ['border-bottom-left-radius'], br: ['border-bottom-right-radius']
      };
      if (side && corners[side]) return { declarations: corners[side].map((property) => property + ': ' + value), suffix };
      return { declarations: ['border-radius: ' + value], suffix };
    }
  }

  // Bordures par côté
  match = /^border-([trblxyse])-(.+)$/.exec(base);
  if (match) {
    const { color, alpha } = splitColorAndAlpha(match[2]);
    const resolved = resolveColorToken(color);
    if (resolved) {
      const value = alpha ? withAlpha(resolved, alpha) : resolved;
      const sides = { t: 'border-top-color', r: 'border-right-color', b: 'border-bottom-color', l: 'border-left-color', x: ['border-left-color', 'border-right-color'], y: ['border-top-color', 'border-bottom-color'] }[match[1]];
      if (sides) {
        const list = Array.isArray(sides) ? sides : [sides];
        return { declarations: list.map((property) => property + ': ' + value), suffix };
      }
    }
  }

  // Flex
  if (base === 'shrink-0' || base === 'flex-shrink-0') return { declarations: ['flex-shrink: 0'], suffix };
  if (base === 'grow' || base === 'flex-grow') return { declarations: ['flex-grow: 1'], suffix };
  if (base === 'grow-0') return { declarations: ['flex-grow: 0'], suffix };

  // Filtres portés (drop-shadow)
  match = /^drop-shadow(?:-(.+))?$/.exec(base);
  if (match) {
    const key = match[1] || 'DEFAULT';
    const value = DROP_SHADOWS[key];
    if (value) return { declarations: ['filter: drop-shadow(' + value + ')'], suffix };
  }

  // Ombres et effets
  match = /^shadow-(.+)$/.exec(base);
  if (match && SHADOWS[match[1]]) return { declarations: ['box-shadow: ' + SHADOWS[match[1]]], suffix };
  match = /^ring-(\d+)$/.exec(base);
  if (match) return { declarations: ['--ui-ring-w: ' + match[1] + 'px', 'box-shadow: 0 0 0 var(--ui-ring-w, 0) var(--ui-ring-c, transparent)'], suffix };
  match = /^opacity-(\d+)$/.exec(base);
  if (match) return { declarations: ['opacity: ' + (Number(match[1]) / 100)], suffix };
  match = /^saturate-\[(.+)\]$/.exec(base);
  if (match) return { declarations: ['--ui-sat: ' + match[1], 'filter: saturate(var(--ui-sat, 1)) contrast(var(--ui-contr, 1))'], suffix };
  match = /^contrast-\[(.+)\]$/.exec(base);
  if (match) return { declarations: ['--ui-contr: ' + match[1], 'filter: saturate(var(--ui-sat, 1)) contrast(var(--ui-contr, 1))'], suffix };
  if (base === 'filter') return { declarations: ['filter: saturate(var(--ui-sat, 1)) contrast(var(--ui-contr, 1))'], suffix };
  match = /^backdrop-blur(?:-(.+))?$/.exec(base);
  if (match) {
    const value = match[1] ? arbitraryValue(match[1]) || SIZE_BLUR[match[1]] : '8px';
    if (value) return { declarations: ['backdrop-filter: blur(' + value + ')'], suffix };
  }

  // Dégradés
  match = /^bg-gradient-to-(t|tr|r|br|b|bl|l|tl)$/.exec(base);
  if (match) {
    const direction = { t: 'to top', tr: 'to top right', r: 'to right', br: 'to bottom right', b: 'to bottom', bl: 'to bottom left', l: 'to left', tl: 'to top left' }[match[1]];
    return {
      declarations: ['background-image: linear-gradient(' + direction + ', var(--ui-gradient-from, transparent), var(--ui-gradient-via, transparent), var(--ui-gradient-to, transparent))'],
      suffix
    };
  }

  // Transformation (le projet utilise les propriétés individuelles)
  if (base === 'transform') return { declarations: ['translate: var(--ui-tx, 0) var(--ui-ty, 0)'], suffix };
  match = /^(-?)(translate-[xy]|scale)-(.+)$/.exec(base);
  if (match) {
    const [, negative, family, key] = match;
    const value = sizeValue(key, corpus, 'width');
    if (!value) return null;
    const signed = negative ? 'calc(-1 * ' + value + ')' : value;
    if (family === 'translate-x') return { declarations: ['--ui-tx: ' + signed, 'translate: var(--ui-tx, 0) var(--ui-ty, 0)'], suffix };
    if (family === 'translate-y') return { declarations: ['--ui-ty: ' + signed, 'translate: var(--ui-tx, 0) var(--ui-ty, 0)'], suffix };
    return { declarations: ['scale: ' + signed], suffix };
  }
  match = /^scale-(\d+)$/.exec(base);
  if (match) return { declarations: ['scale: ' + (Number(match[1]) / 100)], suffix };

  // Typographie et divers
  match = /^leading-(.+)$/.exec(base);
  if (match) {
    const value = LEADINGS[match[1]] || arbitraryValue(match[1]);
    if (value) return { declarations: ['line-height: ' + value], suffix };
  }
  match = /^tracking-(.+)$/.exec(base);
  if (match) {
    const letters = { tighter: '-0.05em', tight: '-0.025em', normal: '0em', wide: '0.025em', wider: '0.05em', widest: '0.1em' };
    const value = letters[match[1]] || arbitraryValue(match[1]);
    if (value) return { declarations: ['letter-spacing: ' + value], suffix };
  }
  match = /^line-clamp-(\d+)$/.exec(base);
  if (match) return { declarations: ['display: -webkit-box', '-webkit-line-clamp: ' + match[1], '-webkit-box-orient: vertical', 'overflow: hidden'], suffix };
  match = /^z-\[(.+)\]$/.exec(base);
  if (match) return { declarations: ['z-index: ' + match[1]], suffix };
  match = /^duration-(\d+)$/.exec(base);
  if (match) return { declarations: ['transition-duration: ' + match[1] + 'ms'], suffix };
  match = /^delay-(\d+)$/.exec(base);
  if (match) return { declarations: ['transition-delay: ' + match[1] + 'ms'], suffix };

  const single = {
    'font-serif': ['font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'],
    'no-underline': ['text-decoration-line: none'],
    underline: ['text-decoration-line: underline'],
    'normal-case': ['text-transform: none'],
    'whitespace-nowrap': ['white-space: nowrap'],
    'whitespace-pre': ['white-space: pre'],
    'break-words': ['overflow-wrap: break-word'],
    antialiased: ['-webkit-font-smoothing: antialiased', '-moz-osx-font-smoothing: grayscale'],
    'scroll-smooth': ['scroll-behavior: smooth'],
    'sr-only': ['position: absolute', 'width: 1px', 'height: 1px', 'padding: 0', 'margin: -1px', 'overflow: hidden', 'clip-path: inset(50%)', 'white-space: nowrap', 'border-width: 0'],
    'select-none': ['user-select: none'],
    'select-all': ['user-select: all'],
    'appearance-none': ['appearance: none'],
    'pointer-events-none': ['pointer-events: none'],
    'pointer-events-auto': ['pointer-events: auto'],
    'cursor-crosshair': ['cursor: crosshair'],
    'touch-none': ['touch-action: none'],
    'overflow-x-auto': ['overflow-x: auto'],
    'overflow-x-hidden': ['overflow-x: hidden'],
    'overflow-visible': ['overflow: visible'],
    'transition-opacity': ['transition-property: opacity', 'transition-timing-function: var(--ui-ease, cubic-bezier(.16,.84,.24,1))', 'transition-duration: var(--ui-dur-base, 160ms)'],
    'transition-shadow': ['transition-property: box-shadow', 'transition-timing-function: var(--ui-ease, cubic-bezier(.16,.84,.24,1))', 'transition-duration: var(--ui-dur-base, 160ms)'],
    'transition-all': ['transition-property: all', 'transition-timing-function: var(--ui-ease, cubic-bezier(.16,.84,.24,1))', 'transition-duration: var(--ui-dur-base, 160ms)'],
    transform: ['translate: var(--ui-tx, 0) var(--ui-ty, 0)'],
    underline: ['text-decoration-line: underline'],
    'border-dashed': ['border-style: dashed'],
    'border-0': ['border-width: 0px'],
    'outline-none': ['outline: 2px solid transparent', 'outline-offset: 2px']
  };
  if (single[base]) return { declarations: single[base].slice(), suffix };

  return null;
}

const SIZE_BLUR = { none: '0', sm: '4px', DEFAULT: '8px', md: '12px', lg: '16px', xl: '24px', '2xl': '40px', '3xl': '64px' };

const DROP_SHADOWS = {
  '2xs': '0 1px 1px rgb(0 0 0 / 0.05)',
  xs: '0 1px 2px rgb(0 0 0 / 0.1)',
  sm: '0 1px 1px rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 2px rgb(0 0 0 / 0.1)',
  md: '0 4px 3px rgb(0 0 0 / 0.07), 0 2px 2px rgb(0 0 0 / 0.06)',
  lg: '0 10px 8px rgb(0 0 0 / 0.04), 0 4px 3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 13px rgb(0 0 0 / 0.03), 0 8px 5px rgb(0 0 0 / 0.08)',
  '2xl': '0 25px 25px rgb(0 0 0 / 0.15)',
  none: '0 0 #0000'
};

function stripVariants(token) {
  let rest = token;
  const chain = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const [prefix, kind] of VARIANTS) {
      if (rest.startsWith(prefix)) {
        let name = null;
        if (kind === 'groupName') {
          const remainder = rest.slice(prefix.length);
          const colon = remainder.indexOf(':');
          name = colon < 0 ? remainder : remainder.slice(0, colon);
          rest = colon < 0 ? '' : remainder.slice(colon + 1);
        } else {
          rest = rest.slice(prefix.length);
        }
        chain.push({ kind, name });
        changed = true;
        break;
      }
    }
  }
  return { base: rest, chain };
}

function buildSelector(cls, chain) {
  let selector = '.' + escapeClass(cls);
  const media = [];
  for (let index = chain.length - 1; index >= 0; index -= 1) {
    const { kind, name } = chain[index];
    if (kind === 'after') selector += '::after';
    else if (kind === 'before') selector += '::before';
    else if (kind === 'placeholder') selector += '::placeholder';
    else if (kind === 'selection') selector += '::selection';
    else if (kind === 'hover') selector += ':hover';
    else if (kind === 'focus') selector += ':focus';
    else if (kind === 'focusVisible') selector += ':focus-visible';
    else if (kind === 'active') selector += ':active';
    else if (kind === 'disabled') selector += ':disabled';
    else if (kind === 'group') selector = '.group:hover ' + selector;
    else if (kind === 'groupName') selector = '.group\\/' + name + ':hover ' + selector;
    else if (kind === 'peerChecked') selector = '.peer:checked ~ ' + selector;
    else if (kind === 'peerFocus') selector = '.peer:focus ~ ' + selector;
    else if (kind === 'peerHover') selector = '.peer:hover ~ ' + selector;
    else if (kind === 'dark') selector = 'body.dark-theme ' + selector;
    else if (BREAKPOINTS[kind]) media.push(BREAKPOINTS[kind]);
  }
  return { selector, media };
}

const appCorpus = APP_CSS.concat(SHARED_INLINE_CSS).map(readIfExists).join('\n');
const exportCorpus = EXPORT_CSS.concat(SHARED_INLINE_CSS).map(readIfExists).join('\n');
const everyCorpus = appCorpus + '\n' + exportCorpus;

const appUsed = collectUsedClasses(listMarkupFiles(APP_MARKUP));
const exportUsed = collectUsedClasses(listMarkupFiles(EXPORT_MARKUP));

const unresolved = [];
const generated = new Map();

function resolveClass(token, surfaceCorpus) {
  if (isDefined(surfaceCorpus, token)) return null;
  const suppressed = SUPPRESSED.has(token);
  const { base, chain } = stripVariants(token);
  if (SUPPRESSED.has(base)) return null;
  if (suppressed) return null;
  if (MARKERS.has(base)) return null;
  if (base.startsWith('group/') || base === 'peer') return null;

  let declarations = null;
  let suffix = null;

  for (const corpus of [everyCorpus]) {
    const existing = declarationsOf(corpus, base);
    if (existing && existing.length) { declarations = existing.slice(); break; }
  }
  if (!declarations) {
    const synthesized = synthesize(base, everyCorpus);
    if (synthesized) {
      declarations = synthesized.declarations;
      suffix = synthesized.suffix;
    }
  }
  if (!declarations || !declarations.length) return { unresolved: true };

  const { selector, media } = buildSelector(token, chain);
  const body = declarations.join('; ') + ';';
  let rule = selector + (suffix || '') + ' { ' + body + ' }';
  let rank = 0;
  for (const { kind } of chain) rank = Math.max(rank, VARIANT_RANK[kind] || 0);
  for (const width of media) rule = '@media (min-width: ' + width + ') { ' + rule + ' }';
  return { rule, rank };
}

for (const [token, count] of appUsed) {
  const result = resolveClass(token, appCorpus);
  if (!result) continue;
  if (result.unresolved) { unresolved.push({ token, count, surface: 'app' }); continue; }
  const current = generated.get(token);
  if (current) current.app = true;
  else generated.set(token, { app: true, exported: false, rule: result.rule, rank: result.rank });
}

for (const [token, count] of exportUsed) {
  const result = resolveClass(token, exportCorpus);
  if (!result) continue;
  if (result.unresolved) { unresolved.push({ token, count, surface: 'export' }); continue; }
  const current = generated.get(token);
  if (current) current.exported = true;
  else generated.set(token, { app: false, exported: true, rule: result.rule, rank: result.rank });
}

const appTokens = [...generated.entries()].filter(([, value]) => value.app);
const exportTokens = [...generated.entries()].filter(([, value]) => value.exported);

function render(tokens, title) {
  const sorted = tokens.slice().sort((a, b) => (a[1].rank - b[1].rank) || a[0].localeCompare(b[0]));
  const lines = sorted.map(([, value]) => value.rule);
  return '/* GÉNÉRÉ PAR scripts/build-utilities.mjs — NE PAS ÉDITER À LA MAIN.\n' +
    '   ' + title + '\n' +
    '   ' + sorted.length + ' règles. Relancer : npm run build:css */\n\n' +
    lines.join('\n') + '\n';
}

const appCss = render(appTokens, 'Couche d\'utilitaires de l\'application (éditeur, aperçu, dashboard).');
const exportCss = render(exportTokens, 'Couche d\'utilitaires du site autonome exporté.');

const exportModule = '// GÉNÉRÉ PAR scripts/build-utilities.mjs — NE PAS ÉDITER À LA MAIN.\n' +
  '// Couche d\'utilitaires manquante du site autonome exporté.\n' +
  'export const UTILITY_LAYER_CSS = ' + JSON.stringify(exportCss) + ';\n';

export const analysis = {
  appUsed,
  exportUsed,
  unresolved,
  appTokens,
  exportTokens,
  appCss,
  exportCss,
  exportModule,
  appRules: appTokens.length,
  exportRules: exportTokens.length
};

// Le module est importable par les tests : l'écriture et la vérification ne se
// produisent que lorsqu'il est exécuté directement.
const invokedDirectly = Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
if (process.argv.includes('--report')) {
  console.log('Classes utilisées : app ' + appUsed.size + ' · export ' + exportUsed.size);
  console.log('Règles générées : app ' + appTokens.length + ' · export ' + exportTokens.length);
  console.log('Classes sans famille connue (non générées) : ' + unresolved.length);
  const grouped = new Map();
  for (const item of unresolved) {
    if (!grouped.has(item.token)) grouped.set(item.token, item);
  }
  console.log([...grouped.keys()].sort().join(' '));
}

if (CHECK) {
  const currentApp = readIfExists(OUT_APP);
  const currentExport = readIfExists(OUT_EXPORT);
  const problems = [];
  if (currentApp !== appCss) problems.push(OUT_APP + ' n\'est pas à jour');
  if (currentExport !== exportModule) problems.push(OUT_EXPORT + ' n\'est pas à jour');
  if (problems.length) {
    console.error('build-utilities --check : ' + problems.join(' · '));
    process.exit(1);
  }
  console.log('build-utilities : artefacts à jour (' + appTokens.length + ' règles app, ' + exportTokens.length + ' règles export).');
} else {
  fs.writeFileSync(path.join(ROOT, OUT_APP), appCss);
  fs.writeFileSync(path.join(ROOT, OUT_EXPORT), exportModule);
  console.log('build-utilities : ' + appTokens.length + ' règles écrites dans ' + OUT_APP + ', ' + exportTokens.length + ' dans ' + OUT_EXPORT + '.');
  if (unresolved.length) console.log('Non couvertes (classes hors familles d\'utilitaires) : ' + unresolved.length);
}
}

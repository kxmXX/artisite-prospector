import test from 'node:test';
import assert from 'node:assert/strict';

const style = await import('../public/js/engine/elementStyle.js');
const { renderWebsiteHTML } = await import('../public/js/components/renderer.js');
const { exportStandaloneHTML } = await import('../public/js/engine/exporter.js');
const { SAMPLE_PROJECTS } = await import('../public/js/data/sampleProjects.js');

const project = () => ({ id: 'p1', branding: {}, business: {}, sections: [] });
// Les feuilles injectées contiennent les sélecteurs : on juge le balisage seul.
const markupOnly = (html) => html.replace(/<style[\s\S]*?<\/style>/g, '');

test('un element sans reglage ne produit aucune regle', () => {
  assert.equal(style.elementStyleCSS(project()), '', 'aucun réglage, aucune feuille');
  assert.deepEqual(style.getElementStyle(project(), 'E1'),
    { padding: 'normal', radius: 'soft', opacity: 'full', background: 'none', border: 'none', shadow: 'none', font: 'theme' },
    'les valeurs par défaut sont complètes');
  assert.equal(style.hasCustomElementStyle(project(), 'E1'), false);
});

test('un reglage produit une declaration ciblee', () => {
  let current = style.setElementStyle(project(), 'E1', 'padding', 'airy');
  assert.match(style.elementStyleCSS(current), /\[data-layout-key="E1"\] \{ padding: clamp\(1\.25rem, 4vw, 3rem\); \}/);
  current = style.setElementStyle(current, 'E1', 'radius', 'pill');
  current = style.setElementStyle(current, 'E1', 'opacity', 'faded');
  const css = style.elementStyleCSS(current);
  assert.match(css, /border-radius: var\(--ui-radius-full, 999px\);/);
  assert.match(css, /opacity: 0\.6;/);
});

test('fond, bordure et ombre suivent le meme contrat', () => {
  let current = style.setElementStyle(project(), 'E1', 'background', 'accent');
  const css = style.elementStyleCSS(current);
  assert.match(css, /background-color: var\(--primary, #527c22\);/);
  assert.match(css, /color: #ffffff;/, 'un fond accentué impose un texte lisible');
  current = style.setElementStyle(current, 'E1', 'border', 'hairline');
  current = style.setElementStyle(current, 'E1', 'shadow', 'lifted');
  const full = style.elementStyleCSS(current);
  assert.match(full, /border: 1px solid rgba\(0, 0, 0, 0\.12\);/);
  assert.match(full, /box-shadow: 0 8px 24px rgba\(0, 0, 0, 0\.10\);/);
  assert.equal(style.setElementStyle(current, 'E1', 'background', 'arc-en-ciel'), current,
    'une valeur inconnue ne change rien');
});

test('les reglages inconnus sont ignores, la source n est pas mutee', () => {
  const source = project();
  const unchanged = style.setElementStyle(source, 'E1', 'rotation', '45deg');
  assert.equal(unchanged, source, 'une propriété inconnue ne change rien');
  const bounded = style.setElementStyle(source, 'E1', 'padding', 'gigantesque');
  assert.equal(bounded, source, 'une valeur inconnue ne change rien');
  const bad = style.setElementStyle(source, '<script>', 'padding', 'airy');
  assert.equal(bad, source, 'une clé invalide ne change rien');
  const updated = style.setElementStyle(source, 'E1', 'padding', 'airy');
  assert.equal(source.elementStyles, undefined, 'la source reste intacte');
  assert.equal(updated.elementStyles.E1.padding, 'airy');
});

test('revenir au style du theme supprime bien l entree', () => {
  let current = style.setElementStyle(project(), 'E1', 'padding', 'airy');
  current = style.setElementStyle(current, 'E1', 'radius', 'round');
  current = style.clearElementStyle(current, 'E1', 'padding');
  assert.deepEqual(Object.keys(current.elementStyles.E1), ['radius'], 'les autres réglages restent');
  current = style.clearElementStyle(current, 'E1');
  assert.deepEqual(current.elementStyles, {}, 'tout retirer supprime l élément');
  assert.equal(style.elementStyleCSS(current), '', 'plus aucune règle');
});

test('le style d element atteint l apercu et l export, et rien par defaut', () => {
  const base = JSON.parse(JSON.stringify(SAMPLE_PROJECTS[0]));
  const untouched = renderWebsiteHTML(base, { isEditor: false, isStandalone: false });
  assert.ok(!/\[data-layout-key="[^"]+"\] \{/.test(untouched), 'aucun réglage par défaut');

  const key = 'E-TEST';
  const custom = style.setElementStyle(base, key, 'opacity', 'soft');
  const preview = renderWebsiteHTML(custom, { isEditor: false, isStandalone: false });
  assert.ok(preview.includes('[data-layout-key="E-TEST"] { opacity: 0.85; }'), 'règle présente dans l aperçu');
  assert.ok(preview.includes('data-element-style'), 'feuille partagée injectée');

  const exported = exportStandaloneHTML(custom);
  assert.ok(exported.includes('[data-layout-key="E-TEST"] { opacity: 0.85; }'),
    'le site autonome embarque exactement la même règle');
  assert.equal(markupOnly(exported).includes('data-element-style'), false, 'le style reste dans la feuille, pas dans le balisage');
});

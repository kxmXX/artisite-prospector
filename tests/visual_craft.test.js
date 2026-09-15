import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (rel) => fs.readFileSync(new URL('../' + rel, import.meta.url), 'utf8');

test('les kickers numerotes ont disparu du tableau de bord', () => {
  // La craft-floor d'Impeccable classe le kicker au-dessus d'un titre comme un
  // interdit : le titre porte son propre poids, l'etiquette part.
  const dashboard = read('public/js/components/dashboard.js');
  assert.ok(!dashboard.includes('dashboard-v3-chapter'), 'le motif kicker est banni');
  assert.ok(dashboard.includes('Un prospect.'), 'le titre principal doit rester');
  assert.ok(dashboard.includes('Vos projets, comme une'), 'le titre de bibliotheque doit rester');
  const studio = read('public/css/studio-v3.css');
  assert.ok(!studio.includes('dashboard-v3-chapter'), 'aucune regle morte ne doit rester');
});

test('le lanceur d assistant ne recouvre plus le canevas', () => {
  const editor = read('public/js/components/editor.js');
  const after = editor.split('copilot-launcher')[1] || '';
  assert.ok(after.length > 0, 'le lanceur doit exister');
  assert.ok(!after.slice(0, 420).includes('text-left flex flex-col'),
    'plus de bloc de texte large au-dessus du canevas');
  const app = read('public/css/app.css');
  assert.ok(!app.includes('border-bottom: 3px solid #09090b'),
    'antipattern border-accent-on-rounded retire du lanceur');
});

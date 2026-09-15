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

test('les statuts du chrome passent par le systeme d icones, pas par des glyphes', () => {
  const app = read('public/js/app.js');
  assert.ok(!app.includes('"✓ Copié !"'), 'plus de coche en texte dans les confirmations');
  assert.ok(!app.includes('"✓ Enregistré"'), 'plus de coche dans le statut d enregistrement');
  assert.ok(!app.includes('alert("✓ '), 'plus de coche dans les messages');
  assert.ok(!app.includes('{ idle: "○"'), 'plus de glyphes comme icones d etape');
  // Les icones d etat viennent du systeme, et le contenu du site reste intact :
  // les badges de confiance sont du contenu, pas du chrome.
  assert.ok(app.includes('getIcon("check"'), 'la coche vient du systeme d icones');
  assert.ok(app.includes('getIcon("helpCircle"'), 'le repli vient du systeme d icones');
});

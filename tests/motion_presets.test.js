import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const motion = await import('../public/js/data/motionPresets.js');

test('le catalogue est unique et sans doublon', () => {
  const ids = motion.motionPresetIds();
  assert.equal(new Set(ids).size, ids.length, 'aucun identifiant en double');
  assert.ok(ids.includes('none'), 'le catalogue doit proposer de ne rien animer');
  for (const preset of motion.MOTION_PRESETS) {
    assert.ok(preset.label && preset.label.length > 2, 'chaque entrée porte un nom lisible : ' + preset.id);
    assert.ok(preset.description && preset.description.length > 10, 'chaque entrée explique ce qu’elle fait : ' + preset.id);
    assert.ok(['none', 'entrance', 'attention', 'loop'].includes(preset.kind), 'nature explicite : ' + preset.id);
    assert.equal(typeof preset.durationMs, 'number');
  }
});

test('le catalogue est en français et sans jargon anglais isolé', () => {
  // Un nom affiché ne doit jamais être le mot anglais brut : c'est ce que voyait
  // l'auteur avec « Fade », « Slide », « Spring », « Shimmer »…
  const englishNames = ['fade', 'slide', 'slide up', 'spring', 'zoom', 'stagger', 'shimmer', 'pulse', 'bounce', 'glow', 'reveal', 'magnetic', 'none', 'progress fill'];
  for (const preset of motion.MOTION_PRESETS) {
    assert.ok(!englishNames.includes(preset.label.trim().toLowerCase()),
      'le nom doit être humain, pas un mot anglais : ' + preset.id + ' → ' + preset.label);
  }
});

test('la répétition est explicite : une fois, plusieurs fois, ou en continu', () => {
  assert.equal(motion.motionIterations('once'), 1);
  assert.equal(motion.motionIterations('twice'), 2);
  assert.equal(motion.motionIterations('loop'), 'infinite');
  assert.equal(motion.motionIterations('inconnu'), 1, 'une valeur inconnue retombe sur une seule fois');
  assert.match(motion.getMotionRepeat('loop').description, /jamais/);
});

test('les declencheurs couvrent les quatre moments utiles', () => {
  const ids = motion.MOTION_TRIGGERS.map((trigger) => trigger.id);
  assert.deepEqual(ids, ['apparition', 'chargement', 'survol', 'clic']);
});

test('les replis sont surs pour les projets anciens', () => {
  assert.equal(motion.getMotionPreset('preset-disparu').id, 'none');
  assert.equal(motion.getMotionPreset(null).id, 'none');
  assert.equal(motion.motionLabel('pulse'), 'Pulsation');
  assert.equal(motion.motionLabel('preset-disparu'), 'preset-disparu', 'un identifiant inconnu s’affiche tel quel plutôt que de disparaître');
  assert.equal(motion.isMotionPreset('fade-in'), true);
  assert.equal(motion.isMotionPreset('fade'), false);
});

test('le catalogue vit dans un seul fichier', () => {
  const other = ['public/js/components/editor.js', 'public/js/components/inspector.js', 'public/js/components/renderer.js'];
  for (const relative of other) {
    const source = fs.readFileSync(new URL('../' + relative, import.meta.url), 'utf8');
    assert.ok(!/const\s+\w*PRESETS\s*=\s*\[/.test(source),
      'une surface ne doit plus déclarer son propre catalogue : ' + relative);
  }
});

test('chaque animation du catalogue est réellement jouable par le rendu', () => {
  // Un catalogue qui promet un effet absent du CSS est un mensonge à l'auteur.
  const css = ['public/css/app.css', 'public/js/components/heroStyles.js']
    .map((relative) => fs.readFileSync(new URL('../' + relative, import.meta.url), 'utf8'))
    .join('\n');
  const missing = motion.motionPresetIds()
    .filter((id) => id !== 'none')
    .filter((id) => !css.includes('data-motion="' + id + '"') && !css.includes("data-motion='" + id + "'"));
  assert.deepEqual(missing, [], 'animations annoncées mais absentes du rendu');
});

test('l inspecteur affiche le catalogue au lieu de sa propre liste', () => {
  const inspector = fs.readFileSync(new URL('../public/js/components/inspector.js', import.meta.url), 'utf8');
  assert.ok(inspector.includes('MOTION_PRESETS.map'), 'l’inspecteur doit lire le catalogue unique');
  assert.ok(!inspector.includes("['fade-in', 'Fade']"), 'la liste locale doit avoir disparu');
  assert.ok(!inspector.includes("'Shimmer'"), 'plus aucun nom anglais brut dans l’interface');
});

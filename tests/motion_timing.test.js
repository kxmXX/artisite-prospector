import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const motion = await import('../public/js/data/motionPresets.js');

test('la duree jouee vient du catalogue, preset par preset', () => {
  const css = motion.motionTimingCSS();
  for (const preset of motion.MOTION_PRESETS) {
    if (preset.id === 'none') continue;
    const expected = '[data-motion="' + preset.id + '"] { --motion-base: ' + preset.durationMs + 'ms; }';
    assert.ok(css.includes(expected), 'duree absente du CSS pour ' + preset.id);
  }
});

test('la vitesse multiplie la duree du catalogue au lieu de l uniformiser', () => {
  assert.equal(motion.motionDurationMs('fade-in', 'normal'), 650);
  assert.equal(motion.motionDurationMs('fade-in', 'lente'), 1040);
  assert.equal(motion.motionDurationMs('fade-in', 'rapide'), 423);
  assert.equal(motion.motionDurationMs('none', 'lente'), 0, 'ne rien animer reste sans duree');
  // Deux animations doivent garder des durees differentes : l ancien reglage global
  // forcait 0.85s pour tout le monde et ignorait la duree propre de chaque animation.
  assert.notEqual(motion.motionDurationMs('fade-in', 'normal'), motion.motionDurationMs('shimmer', 'normal'));
});

test('vitesse et delai retombent sur le reglage neutre si la valeur est inconnue', () => {
  assert.equal(motion.getMotionSpeed('inexistant').id, 'normal');
  assert.equal(motion.getMotionSpeed(null).factor, 1);
  assert.equal(motion.getMotionDelay('inexistant').id, 'aucun');
  assert.equal(motion.getMotionDelay(undefined).ms, 0);
  assert.deepEqual(motion.motionSpeedIds(), ['normal', 'lente', 'rapide']);
  assert.deepEqual(motion.motionDelayIds(), ['aucun', 'leger', 'net']);
});

test('le CSS de rythme expose vitesse et delai et respecte les mouvements reduits', () => {
  const css = motion.motionTimingCSS();
  assert.ok(css.includes('[data-motion-speed="lente"] { --motion-speed: 1.6; }'));
  assert.ok(css.includes('[data-motion-speed="rapide"] { --motion-speed: 0.65; }'));
  assert.ok(css.includes('[data-motion-delay="leger"] { --motion-delay: 150ms; }'));
  assert.ok(css.includes('[data-motion-delay="net"] { --motion-delay: 350ms; }'));
  assert.ok(!css.includes('[data-motion-speed="normal"]'), 'le reglage neutre ne doit rien ajouter');
  assert.ok(css.includes('animation-delay: var(--motion-delay, 0ms)'), 'le delai est independant de la duree');
  const reduced = css.slice(css.indexOf('prefers-reduced-motion'));
  assert.match(reduced, /animation-delay:\s*0ms\s*!important/, 'un delai ne doit pas retarder le contenu quand le mouvement est reduit');
});

test('le rendu, l inspecteur et l application branchent le rythme', () => {
  const read = (rel) => fs.readFileSync(new URL('../' + rel, import.meta.url), 'utf8');
  const renderer = read('public/js/components/renderer.js');
  assert.ok(renderer.includes('motionTimingCSS()'), 'le rendu doit injecter le CSS de rythme');
  assert.ok(renderer.includes('data-motion-speed'), 'le rendu doit emettre la vitesse');
  assert.ok(renderer.includes('data-motion-delay'), 'le rendu doit emettre le delai');
  const inspector = read('public/js/components/inspector.js');
  assert.ok(inspector.includes('setSectionMotionSpeed'), 'l inspecteur doit offrir la vitesse');
  assert.ok(inspector.includes('setSectionMotionDelay'), 'l inspecteur doit offrir le delai');
  const app = read('public/js/app.js');
  assert.ok(app.includes('setSectionMotionTiming(sectionId, key, defaultId, valueId, label)'), 'un seul chemin d ecriture pour le rythme');
});

// Les feuilles injectees contiennent les selecteurs : on juge le balisage seul.
const markupOnly = (html) => html.replace(/<style[\s\S]*?<\/style>/g, '');

test('le rythme choisi apparait vraiment dans le rendu, et jamais quand il est neutre', async () => {
  const { generateSite } = await import('../public/js/engine/generator.js');
  const { renderWebsiteHTML } = await import('../public/js/components/renderer.js');
  const project = generateSite({ name: 'Plomberie Dupont', tradeId: 'plombier' });
  assert.ok(project.sections.length > 0, 'le projet de reference doit avoir des sections');

  const defaults = renderWebsiteHTML(project, { isEditor: true });
  assert.ok(defaults.includes('<style data-motion-timing>'), 'la feuille de rythme doit etre injectee');
  assert.ok(defaults.includes('[data-motion="fade-in"] { --motion-base: 650ms; }'), 'la duree du catalogue doit etre presente');
  assert.ok(!markupOnly(defaults).includes('data-motion-speed='), 'aucune vitesse quand le reglage est neutre');
  assert.ok(!markupOnly(defaults).includes('data-motion-delay='), 'aucun delai quand le reglage est neutre');

  const tuned = JSON.parse(JSON.stringify(project));
  tuned.sections[0].settings = Object.assign({}, tuned.sections[0].settings, {
    motionPreset: 'fade-in', motionSpeed: 'lente', motionDelay: 'leger'
  });
  const markup = markupOnly(renderWebsiteHTML(tuned, { isEditor: true }));
  assert.ok(markup.includes('data-motion="fade-in"'), 'le preset doit etre pose');
  assert.ok(markup.includes('data-motion-speed="lente"'), 'la vitesse doit etre posee sur la section');
  assert.ok(markup.includes('data-motion-delay="leger"'), 'le delai doit etre pose sur la section');

  const html = renderWebsiteHTML(tuned, { isEditor: true });
  assert.ok(html.includes('[data-motion-speed="lente"] { --motion-speed: 1.6; }'), 'la feuille doit expliquer la vitesse');
  assert.ok(html.includes('[data-motion-delay="leger"] { --motion-delay: 150ms; }'), 'la feuille doit expliquer le delai');
});

test('le menu texte lit le catalogue au lieu de sa propre liste anglaise', () => {
  const editor = fs.readFileSync(new URL('../public/js/components/editor.js', import.meta.url), 'utf8');
  assert.ok(editor.includes('MOTION_PRESETS.map'), 'le menu texte doit lire le catalogue');
  assert.ok(!editor.includes('Fade '), 'plus de nom anglais brut dans le menu texte');
  assert.ok(!editor.includes("setActiveTextMotion('fade-in')"), 'plus de bouton code en dur');
  assert.equal(editor.split('motion-preview-hint').length - 1, 1, 'une seule aide de survol, pas deux lignes identiques');
});

test('le rythme est disponible pour les elements et les images', () => {
  const read = (rel) => fs.readFileSync(new URL('../' + rel, import.meta.url), 'utf8');
  const renderer = read('public/js/components/renderer.js');
  for (const key of ['elementMotionSpeeds', 'elementMotionDelays', 'imageMotionSpeeds', 'imageMotionDelays']) {
    assert.ok(renderer.includes(key), 'le rendu doit lire ' + key);
  }
  const app = read('public/js/app.js');
  assert.ok(app.includes('setActiveTextTiming(key, defaultId, valueId, label)'), 'un seul chemin d ecriture pour le texte');
  assert.ok(app.includes('setImageMotionTiming(secId, fieldPath, itemIndex, key, defaultId, valueId, label)'), 'un seul chemin d ecriture pour l image');
  const editor = read('public/js/components/editor.js');
  assert.ok(editor.includes('setActiveTextMotionSpeed') && editor.includes('setActiveTextMotionDelay'), 'le menu texte doit offrir vitesse et delai');
  assert.ok(renderer.includes('setImageMotionSpeed') && renderer.includes('setImageMotionDelay'), 'le menu image doit offrir vitesse et delai');
});

test('le menu texte rendu par l editeur lit le catalogue et offre vitesse et delai', async () => {
  const { generateSite } = await import('../public/js/engine/generator.js');
  const { renderEditor } = await import('../public/js/components/editor.js');
  const { state } = await import('../public/js/state.js');
  state.currentProject = generateSite({ name: 'Controle Rythme', tradeId: 'menuisier' });
  state.currentView = 'editor';
  state.editorMode = 'edit';
  const html = renderEditor(state);
  assert.ok(html.includes('id="ftb-anim-menu"'), 'le menu texte doit exister');
  assert.ok(html.includes('Apparition en fondu'), 'le menu texte doit afficher les noms du catalogue');
  assert.equal(html.split('setActiveTextMotion(').length - 1, 12, 'le menu rendu doit generer les 12 entrees du catalogue, pas une liste locale');
  assert.ok(html.includes('data-text-speed="normal"') && html.includes('data-text-speed="lente"'), 'la vitesse doit etre offerte');
  assert.ok(html.includes('data-text-delay="aucun"') && html.includes('data-text-delay="net"'), 'le delai doit etre offert');
});

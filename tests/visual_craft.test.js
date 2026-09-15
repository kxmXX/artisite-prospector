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

test('la barre de selection freeform utilise le systeme d icones', () => {
  const app = read('public/js/app.js');
  for (const g of ['>↻</button>', '>⇤</button>', '>⇥</button>', '>−</button>', '>+</button>', '>H↔</button>', '>V↕</button>']) {
    assert.ok(!app.includes(g), 'glyphe encore present : ' + g);
  }
  for (const key of ['rotateCw', 'bringToFront', 'sendToBack', 'bringForward', 'sendBackward', 'distributeHorizontal', 'distributeVertical']) {
    assert.ok(app.includes('getIcon("' + key + '"'), 'icone non utilisee : ' + key);
  }
});

test('les nouvelles icones sont des SVG bien formes, sans glyphe', async () => {
  const { getIcon } = await import('../public/js/components/icons.js');
  for (const key of ['rotateCw', 'bringToFront', 'sendToBack', 'bringForward', 'sendBackward', 'distributeHorizontal', 'distributeVertical']) {
    const svg = getIcon(key, 'w-3.5 h-3.5');
    assert.ok(svg.startsWith('<svg'), key + ' doit rendre un svg');
    assert.ok(svg.includes('viewBox'), key + ' doit declarer un viewBox');
    assert.ok(!/[\u2190-\u21FF\u2600-\u27BF]/.test(svg), key + ' ne doit contenir aucun glyphe');
  }
});

test('les derniers glyphes du chrome et du rendu passent par les icones', async () => {
  const { getIcon } = await import('../public/js/components/icons.js');
  assert.ok(getIcon('play', 'w-4 h-4').startsWith('<svg'), 'l icone de lecture doit exister');
  assert.ok(!read('public/js/components/wizard.js').includes('>○</span>'), 'plus de cercle en glyphe');
  assert.ok(!read('public/js/components/renderer.js').includes('>▶</span>'), 'plus de triangle de lecture en glyphe');
  assert.ok(!read('public/js/components/inspector.js').includes('▶ Tester'), 'plus de triangle dans le bouton de test');
});

test('changer de section rafraichit le panneau de proprietes', () => {
  const app = read('public/js/app.js');
  const start = app.indexOf('selectSection(sectionId, options = {}) {');
  assert.ok(start > 0, 'selectSection doit exister');
  const end = app.indexOf('\n  }', start);
  const body = app.slice(start, end);
  assert.ok(body.includes('this.updateSelectedSectionUI();'), 'le panneau doit suivre la section choisie');
  assert.ok(!body.includes('if (alreadySelected)'), 'l ancienne condition ne doit pas revenir');
});

test('le panneau de proprietes a un controle explicite', () => {
  const editor = read('public/js/components/editor.js');
  const app = read('public/js/app.js');
  assert.ok(editor.includes('window.app.toggleInspectorPanel()'), 'l editeur doit offrir un bouton');
  assert.ok(editor.includes('aria-controls="right-inspector-panel"'), 'le bouton doit cibler le panneau');
  assert.ok(app.includes('toggleInspectorPanel() {'), 'la methode doit exister');
  assert.ok(app.includes('state.inspectorPanelOpen'), 'elle doit piloter un etat, pas une requete media');
});

test('la liste des elements est le chemin vers les reglages d element', () => {
  const inspector = read('public/js/components/inspector.js');
  const app = read('public/js/app.js');
  assert.ok(inspector.includes('sectionElementsHTML'), 'la liste doit exister');
  assert.ok(inspector.includes('window.app.selectElementForEditing('), 'chaque element doit etre selectionnable');
  assert.ok(app.includes('selectElementForEditing(layoutKey) {'), 'le chemin de selection doit exister');
  assert.ok(app.includes('state.elementStyleState = "default";'), 'l etat neutre est default, pas base');
});

test('l inspecteur liste les elements de la section', async () => {
  const { generateSite } = await import('../public/js/engine/generator.js');
  const { renderEditor } = await import('../public/js/components/editor.js');
  const { state } = await import('../public/js/state.js');
  const project = generateSite({ name: 'Controle Elements', tradeId: 'menuisier' });
  state.currentProject = project;
  state.currentView = 'editor';
  state.editorMode = 'edit';
  state.selectedElementKey = null;
  const html = renderEditor(state);
  assert.ok(html.includes('Elements de la section'), 'la liste doit etre rendue');
  assert.ok(html.includes('selectElementForEditing('), 'les elements doivent etre selectionnables');
});

test('la selection d un element a un seul indicateur, partage avec la selection libre', () => {
  const app = read('public/js/app.js');
  assert.ok(app.includes('highlightSelectedElement(layoutKey) {'), 'l indicateur doit etre partage');
  assert.ok(app.includes('this.highlightSelectedElement(state.selectedElementKey);'), 'le setter unique doit l appliquer');
  assert.ok(app.includes('classList.add("is-freeform-selected")'), 'meme classe que la selection libre');
  const studio = read('public/css/studio-v3.css');
  assert.ok(studio.includes('[data-layout-key].is-freeform-selected'), 'le style doit exister');
});

test('les familles de boutons partagent un seul vocabulaire', () => {
  const tokens = read('public/css/tokens.css');
  for (const t of ['--ui-control-height', '--ui-radius-control', '--ui-control-gap', '--ui-disabled-opacity', '--ui-transition-control']) {
    assert.ok(tokens.includes(t + ':'), 'jeton manquant : ' + t);
  }
  const studio = read('public/css/studio-v3.css');
  assert.ok(studio.includes('height:var(--ui-control-height)'), 'les boutons du studio doivent partager la hauteur');
  assert.ok(studio.includes('border-radius:var(--ui-radius-control)'), 'et le rayon');
  assert.ok(!studio.includes('height:34px;border-radius:10px'), 'plus de hauteur et de rayon arbitraires dans la regle partagee');
  assert.ok(!studio.includes('opacity:.28'), 'plus d opacite arbitraire');
  const app = read('public/css/app.css');
  assert.match(app, /\.motion-loop-btn[^}]*border-radius: var\(--ui-radius-md\)/, 'les pastilles passent par un jeton de rayon');
  assert.ok(!/\.motion-loop-btn[^}]*border-radius:\s*\.5rem/.test(app), 'plus de rayon arbitraire sur les pastilles');
  assert.ok(!app.includes('border-radius: var(--btn-radius, var(--cta-radius, 8px))'), 'le keycap ne fige plus 8px');
});

test('le chrome de l editeur n a plus de verre decoratif', () => {
  const editor = read('public/js/components/editor.js');
  const renderer = read('public/js/components/renderer.js');
  assert.ok(!editor.includes('backdrop-blur'), 'plus de flou decoratif dans les menus de texte');
  assert.ok(!renderer.includes('bg-zinc-900/95 backdrop-blur-md'), 'plus de flou dans les menus de section');
  const app = read('public/css/app.css');
  assert.ok(!/\.canva-dock\s*\{[^}]*backdrop-filter/.test(app), 'le dock Canva doit etre opaque');
  assert.ok(!/\.sticky-dock-glass\s*\{[^}]*backdrop-filter/.test(app), 'le dock collant doit etre opaque');
  const studio = read('public/css/studio-v3.css');
  assert.ok(!studio.includes('backdrop-filter:blur(14px)'), 'le panneau de structure doit etre opaque');
  assert.ok(!studio.includes('blur(18px) saturate(1.2)'), 'la barre du haut doit etre opaque');
  // Le voile de modale garde son flou : c'est un effet au service d'une intention.
  assert.ok(studio.includes('backdrop-filter:blur(18px) saturate(.9)'), 'le voile de modale reste floute');
});

test('les en-tetes de reglages sont des controles accessibles', () => {
  const editor = read('public/js/components/editor.js');
  const app = read('public/js/app.js');
  const headers = editor.split('role="button" tabindex="0" aria-expanded=').length - 1;
  assert.ok(headers >= 10, 'les groupes de reglages doivent etre focusables, trouves : ' + headers);
  assert.ok(editor.includes('aria-controls="settings-body-'), 'chaque en-tete doit designer son corps');
  assert.ok(editor.includes('window.app.toggleSettingsItem'), 'le basculement doit rester branche');
  assert.ok(app.includes('setAttribute("aria-expanded", body.classList.contains("hidden") ? "false" : "true")'), 'l etat doit suivre le basculement');
});

test('la selection d element n a qu un seul point d ecriture', () => {
  const app = read('public/js/app.js');
  assert.ok(app.includes('setElementSelection(layoutKey, options = {}) {'), 'le point d ecriture unique doit exister');
  assert.equal(app.split('state.selectedElementKey = ').length - 1, 1,
    'une seule affectation directe doit subsister, dans le setter');
  assert.ok(app.includes('this.setElementSelection(this._freeformSelectedKey'), 'la selection libre passe par le setter');
  assert.ok(app.includes('this.setElementSelection(null, { highlight: false })'), 'le nettoyage passe par le setter');
});

test('changer de section relache l element selectionne', () => {
  const app = read('public/js/app.js');
  const start = app.indexOf('selectSection(sectionId, options = {}) {');
  assert.ok(start > 0, 'selectSection doit exister');
  const body = app.slice(start, app.indexOf('\n  }', start));
  assert.ok(body.includes('state.selectedSectionId !== sectionId && state.selectedElementKey'),
    'la selection d element doit etre relachee quand la section change');
  assert.ok(body.includes('this.setElementSelection(null'), 'par le point d ecriture unique');
});

test('l arbre des elements est accessible depuis le panneau de structure', () => {
  const editor = read('public/js/components/editor.js');
  const app = read('public/js/app.js');
  assert.ok(editor.includes('collectSectionElements(project, s)'), 'chaque section expose ses elements');
  assert.ok(editor.includes('window.app.toggleStructureSection('), 'la liste doit pouvoir se deplier');
  assert.ok(editor.includes('window.app.selectStructureElement('), 'un element doit etre selectionnable');
  assert.ok(editor.includes('aria-controls="structure-elements-'), 'le bouton doit designer sa liste');
  assert.ok(app.includes('toggleStructureSection(sectionId) {'), 'la bascule doit exister');
  assert.ok(app.includes('selectStructureElement(sectionId, layoutKey) {'), 'la selection doit exister');
  const css = read('public/css/studio-v3.css');
  assert.ok(css.includes('.studio-v3-elements-list'), 'la liste doit etre stylee');
});

test('les deux panneaux nomment les elements de la meme facon', async () => {
  const editor = read('public/js/components/editor.js');
  const inspector = read('public/js/components/inspector.js');
  assert.ok(editor.includes('numberedLabels') && inspector.includes('numberedLabels'), 'les deux doivent partager les libelles');
  assert.ok(!inspector.includes('const ELEMENT_LABELS = {'), 'plus de table locale dans l inspecteur');
  const { elementLabelFor, numberedLabels } = await import('../public/js/data/elementLabels.js');
  assert.equal(elementLabelFor('ctaText', 'button'), 'Texte du bouton');
  assert.equal(elementLabelFor('inconnu', 'image'), 'inconnu', 'un champ inconnu s affiche tel quel');
  assert.equal(elementLabelFor('', 'button'), 'Bouton', 'sans champ, la nature suffit');
  assert.deepEqual(numberedLabels([{ field: 'title' }, { field: 'title' }, { field: 'text' }]), ['Titre 1', 'Titre 2', 'Texte']);
});

test('les listes de la section sont editables depuis l inspecteur', async () => {
  const { renderInspector } = await import('../public/js/components/inspector.js');
  const { generateSite } = await import('../public/js/engine/generator.js');
  const { state } = await import('../public/js/state.js');
  const app = read('public/js/app.js');
  const project = generateSite({ name: 'Controle Listes', tradeId: 'plombier' });
  state.currentProject = project;
  const services = project.sections.find((s) => s.type === 'services');
  const html = renderInspector(services, project, state);
  assert.ok(html.includes('Listes de la section'), 'le bloc des listes doit etre rendu');
  assert.ok(html.includes('window.app.addServiceItem('), 'on doit pouvoir ajouter un service');
  assert.ok(html.includes('window.app.removeListEntry('), 'on doit pouvoir retirer une entree');
  assert.ok(html.includes('Services · ' + services.content.services.length), 'le compte doit etre affiche');
  assert.ok(app.includes('removeListEntry(sectionId, listKey, index) {'), 'l operation generique doit exister');
  assert.ok(app.includes('state.pushHistory("Suppression dans la liste "'), 'la suppression doit etre annulable');
  state.selectedElementKey = null;
});

test('assombrissement, tailles et motifs sont accessibles depuis l inspecteur', async () => {
  const { renderInspector } = await import('../public/js/components/inspector.js');
  const { generateSite } = await import('../public/js/engine/generator.js');
  const { state } = await import('../public/js/state.js');
  const project = generateSite({ name: 'Controle Avance', tradeId: 'plombier' });
  state.currentProject = project;
  const hero = project.sections.find((s) => s.type === 'hero');
  const heroHtml = renderInspector(hero, project, state);
  assert.ok(heroHtml.includes('window.app.setHeroOverlayDarkening('), 'l assombrissement du hero doit etre reglable');
  assert.equal((heroHtml.match(/adjustFieldFontSizeSlider/g) || []).length, 3, 'trois curseurs de taille');
  assert.equal((heroHtml.match(/applyInspirationPattern/g) || []).length, 6, 'six motifs proposes');
  // Hors du hero, l'assombrissement n'a pas de sens : il ne doit pas apparaitre.
  const services = project.sections.find((s) => s.type === 'services');
  assert.ok(!renderInspector(services, project, state).includes('setHeroOverlayDarkening'),
    'pas d assombrissement hors du hero');
  state.selectedElementKey = null;
});

test('galerie et boutons masques sont reglables depuis l inspecteur', async () => {
  const { renderInspector } = await import('../public/js/components/inspector.js');
  const { generateSite } = await import('../public/js/engine/generator.js');
  const { state } = await import('../public/js/state.js');
  const base = generateSite({ name: 'Controle Galerie', tradeId: 'plombier' });
  state.currentProject = base;
  const gallery = base.sections.find((s) => s.type === 'gallery');
  const html = renderInspector(gallery, base, state);
  assert.equal((html.match(/setGalleryAspectRatio/g) || []).length, 3, 'trois formats proposes');
  for (const ratio of ['4/3', '16/9', '1/1']) {
    assert.ok(html.includes("'" + ratio + "'"), 'le format ' + ratio + ' doit etre propose');
  }
  const clone = JSON.parse(JSON.stringify(base));
  const target = clone.sections.find((s) => s.type === 'hero') || clone.sections[0];
  target.settings = Object.assign({}, target.settings, { hiddenButtons: ['primary'] });
  state.currentProject = clone;
  const restored = renderInspector(target, clone, state);
  assert.ok(restored.includes("restoreButton('" + target.id + "', 'primary')"), 'un bouton masque doit pouvoir etre restaure');
  const untouched = base.sections.find((s) => s.type === 'hero') || base.sections[0];
  assert.ok(!renderInspector(untouched, base, state).includes('restoreButton'), 'aucune restauration quand rien n est masque');
  state.selectedElementKey = null;
});

test('l animation de section peut etre testee, arretee et reinitialisee', async () => {
  const { renderInspector } = await import('../public/js/components/inspector.js');
  const { generateSite } = await import('../public/js/engine/generator.js');
  const { state } = await import('../public/js/state.js');
  const app = read('public/js/app.js');
  const project = generateSite({ name: 'Controle Rythme', tradeId: 'plombier' });
  state.currentProject = project;
  const hero = project.sections.find((s) => s.type === 'hero');
  const html = renderInspector(hero, project, state);
  assert.ok(html.includes('window.app.previewSectionMotion('), 'tester l animation');
  assert.ok(html.includes("window.app.stopSectionMotion('" + hero.id + "')"), 'arreter l animation');
  assert.ok(html.includes("window.app.resetSectionMotion('" + hero.id + "')"), 'reinitialiser l animation');
  assert.ok(app.includes('stopSectionMotion(sectionId) {'), 'la methode arreter doit exister');
  assert.ok(app.includes('resetSectionMotion(sectionId) {'), 'la methode reinitialiser doit exister');
  assert.ok(app.includes("state.pushHistory(\"Reinitialisation de l'animation\")"), 'la reinitialisation doit etre annulable');
  state.selectedElementKey = null;
});

test('la courbe d animation est reglable et atteint le rendu', async () => {
  const m = await import('../public/js/data/motionPresets.js');
  assert.deepEqual(m.motionEasingIds(), ['douce', 'rebond', 'lineaire']);
  assert.equal(m.getMotionEasing('rebond').value, 'cubic-bezier(.34, 1.56, .64, 1)');
  assert.equal(m.getMotionEasing('inconnu').id, 'douce', 'repli sur la courbe douce');
  const css = m.motionTimingCSS();
  assert.ok(css.includes('animation-timing-function: var(--motion-ease-override)'), 'la courbe choisie doit primer sur celle du preset');
  for (const id of m.motionEasingIds()) {
    assert.ok(css.includes('[data-motion-easing="' + id + '"]'), 'regle manquante pour ' + id);
  }
  // Le reglage doit survivre au rechargement : il est emis par le rendu.
  const { generateSite } = await import('../public/js/engine/generator.js');
  const { renderWebsiteHTML } = await import('../public/js/components/renderer.js');
  const project = generateSite({ name: 'Controle Courbe', tradeId: 'plombier' });
  const hero = project.sections.find((s) => s.type === 'hero');
  hero.settings = Object.assign({}, hero.settings, { motionPreset: 'fade-in', motionEasing: 'rebond' });
  assert.ok(renderWebsiteHTML(project, { isEditor: true }).includes('data-motion-easing="rebond"'), 'la courbe doit atteindre le rendu');
});


import test from 'node:test';
import assert from 'node:assert/strict';

const section = await import('../public/js/engine/sectionStyle.js');

test('une section sans reglage ne produit aucun attribut ni variable', () => {
  const plain = { id: 'sec-1', type: 'services' };
  assert.equal(section.hasCustomSectionLayout(plain), false, 'rien n a ete modifie');
  assert.deepEqual(section.sectionLayoutAttributes(plain), { attributes: '', style: '' },
    'aucun rendu ne doit changer pour les vitrines existantes');
  assert.deepEqual(section.getSectionLayout(plain),
    { width: 'content', spacing: 'normal', align: 'center' }, 'les valeurs par defaut sont completes');
});

test('un reglage produit des variables CSS bornees', () => {
  const narrow = section.setSectionLayout({ id: 's', type: 'services' }, { width: 'narrow', spacing: 'airy', align: 'left' });
  const result = section.sectionLayoutAttributes(narrow);
  assert.equal(result.attributes, ' data-section-layout="custom"');
  assert.match(result.style, /--section-max: 56rem;/);
  assert.match(result.style, /--section-pad: clamp\(3rem, 7vw, 6rem\);/);
  assert.match(result.style, /--section-align: flex-start;/);
});

test('les valeurs inconnues retombent sur les valeurs sures', () => {
  const weird = section.setSectionLayout({ id: 's' }, { width: 'infini', spacing: 'enorme', align: 'diagonale' });
  assert.deepEqual(section.getSectionLayout(weird),
    { width: 'content', spacing: 'normal', align: 'center' });
  assert.equal(section.hasCustomSectionLayout(weird), false, 'un reglage invalide ne declenche aucun rendu');
});

test('appliquer un reglage ne mute pas la section source', () => {
  const source = { id: 's', type: 'hero' };
  const updated = section.setSectionLayout(source, { spacing: 'compact' });
  assert.equal(source.style, undefined, 'la section source reste intacte');
  assert.equal(updated.style.spacing, 'compact');
  assert.notEqual(updated, source);
});

test('le CSS partage ne cible que les sections personnalisees', () => {
  assert.ok(section.SECTION_LAYOUT_CSS.includes('[data-section-layout="custom"]'),
    'le CSS doit etre conditionne, sinon toutes les vitrines changeraient de rendu');
  assert.ok(section.SECTION_LAYOUT_CSS.includes('prefers-reduced-motion'),
    'une transition eventuelle doit respecter l alternative de mouvement');
  assert.ok(!/^\s*\.artisite-root \.site-section \{/m.test(section.SECTION_LAYOUT_CSS),
    'aucune regle non conditionnee sur .site-section');
});

test('les identifiants de section sont valides avant usage', () => {
  assert.equal(section.isValidSectionId('sec-hero_1'), true);
  assert.equal(section.isValidSectionId('sec hero'), false);
  assert.equal(section.isValidSectionId('<script>'), false);
  assert.equal(section.isValidSectionId(null), false);
});

const { renderWebsiteHTML } = await import('../public/js/components/renderer.js');
const { exportStandaloneHTML } = await import('../public/js/engine/exporter.js');
const { SAMPLE_PROJECTS } = await import('../public/js/data/sampleProjects.js');

// Les feuilles de style injectées contiennent elles aussi le sélecteur
// [data-section-layout="custom"] : on les retire avant de conclure quoi que ce soit
// sur le balisage. C'est l'erreur qui avait fait échouer la première version du test.
const markupOnly = (html) => html.replace(/<style[\s\S]*?<\/style>/g, '');

test('le rendu partage applique la mise en page sans toucher aux sections par defaut', () => {
  const base = JSON.parse(JSON.stringify(SAMPLE_PROJECTS[0]));
  const plain = markupOnly(renderWebsiteHTML(base, { isEditor: false, isStandalone: false }));
  assert.ok(!plain.includes('data-section-layout="custom"'),
    'aucune section personnalisee : le balisage doit rester identique');
  assert.ok(renderWebsiteHTML(base, { isEditor: false, isStandalone: false }).includes('<style data-section-layout>'),
    'la feuille partagee doit etre injectee pour les trois surfaces');

  const custom = JSON.parse(JSON.stringify(SAMPLE_PROJECTS[0]));
  custom.sections[0] = section.setSectionLayout(custom.sections[0], { width: 'narrow', spacing: 'airy' });
  const rendered = renderWebsiteHTML(custom, { isEditor: false, isStandalone: false });
  assert.ok(markupOnly(rendered).includes('data-section-layout="custom"'), 'la section personnalisee est marquee');
  assert.match(rendered, /--section-max: 56rem/, 'la largeur passe en variable CSS');

  const exported = exportStandaloneHTML(custom);
  assert.ok(markupOnly(exported).includes('data-section-layout="custom"'),
    'le site autonome recoit le meme marquage, donc le meme rendu');
  assert.match(exported, /--section-max: 56rem/);
});

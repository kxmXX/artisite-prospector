
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

import test from 'node:test';
import assert from 'node:assert/strict';
import { setSectionLayout } from '../public/js/engine/sectionStyle.js';

test("changer la mise en page d'une section ne perd jamais son contenu", () => {
  const section = {
    id: 'sec-services',
    type: 'services',
    visibility: true,
    settings: { variant: 'cards-3' },
    content: { services: [{ id: 'srv-1', title: 'Taille' }, { id: 'srv-2', title: 'Tonte' }, { id: 'srv-3', title: 'Élagage' }] }
  };
  for (const patch of [{ align: 'center' }, { width: 'narrow' }, { spacing: 'airy' }]) {
    const next = setSectionLayout(section, patch);
    assert.deepEqual(next.content, section.content, 'le contenu doit être intact');
    assert.equal(next.content.services.length, 3, 'aucun service ne doit disparaître');
    assert.deepEqual(next.settings, section.settings, 'les réglages de section sont préservés');
    assert.equal(next.id, section.id);
    assert.equal(next.visibility, true);
  }
  // La valeur invalide retombe sur la valeur courante, elle ne vide rien.
  assert.equal(setSectionLayout(section, { align: 'inconnu' }).content.services.length, 3);
});

test("chaque bouton de mise en page passe par le meme chemin sans perdre le contenu", () => {
  // Le signalement parlait d'items supprimes apres un clic sur « Centrage ».
  // On reproduit exactement setSectionLayoutValue : clone, find, remplacement.
  const project = {
    sections: [{
      id: 'sec-services',
      type: 'services',
      visibility: true,
      settings: { variant: 'cards-3' },
      content: { services: [{ id: 'srv-1', title: 'Taille' }, { id: 'srv-2', title: 'Tonte' }, { id: 'srv-3', title: 'Elagage' }] }
    }]
  };
  const expectations = {
    width: ['full', 'content', 'narrow'],
    spacing: ['compact', 'normal', 'airy'],
    align: ['left', 'center', 'right']
  };
  for (const [key, values] of Object.entries(expectations)) {
    for (const value of values) {
      const updated = JSON.parse(JSON.stringify(project));
      const section = updated.sections.find(s => s.id === 'sec-services');
      const next = setSectionLayout(section, { [key]: value });
      updated.sections[updated.sections.indexOf(section)] = next;
      const after = updated.sections.find(s => s.id === 'sec-services');
      assert.equal(after.content.services.length, 3, key + '=' + value + ' ne doit perdre aucun service');
      assert.deepEqual(after.content, project.sections[0].content, key + '=' + value + ' : contenu identique');
      assert.deepEqual(after.settings, project.sections[0].settings, key + '=' + value + ' : reglages identiques');
      assert.equal(after.visibility, true);
    }
  }
});


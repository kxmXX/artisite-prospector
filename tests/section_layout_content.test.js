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

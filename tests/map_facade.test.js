import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSite } from '../public/js/engine/generator.js';
import { renderWebsiteHTML } from '../public/js/components/renderer.js';

test("la carte Google ne se charge qu'à la demande", () => {
  const site = generateSite({ name: 'Test Map', tradeId: 'plombier', city: 'Lyon' });
  const html = renderWebsiteHTML(site);
  assert.ok(html.includes('Afficher la carte interactive'), 'la façade doit être présente');
  assert.doesNotMatch(html, /<iframe[^>]*\ssrc="https:\/\/maps\.google\.com/, 'la carte ne doit pas charger directement');
  assert.match(html, /data-src="https:\/\/maps\.google\.com/, 'la source doit être différée dans data-src');
});

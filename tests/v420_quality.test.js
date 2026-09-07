import test from 'node:test';
import assert from 'node:assert/strict';
import { TRADES } from '../public/js/data/trades.js';
import { generateSite } from '../public/js/engine/generator.js';
import { exportStandaloneHTML } from '../public/js/engine/exporter.js';
import { renderStickyCallBar } from '../public/js/components/renderer.js';
import { renderCloserModal } from '../public/js/components/closerModal.js';
import { renderShareModal } from '../public/js/components/shareModal.js';

test('v4.2.0 Quality: Trade accuracy and certifications', () => {
  const couvreur = TRADES.find(t => t.id === 'couvreur');
  assert.ok(couvreur.trustBadges.some(b => (b.title + b.desc).includes('Qualibat')), 'Couvreur has Qualibat');

  const macon = TRADES.find(t => t.id === 'macon');
  assert.ok(macon.trustBadges.some(b => (b.title + b.desc).includes('Qualibat')), 'Macon has Qualibat');

  const peintre = TRADES.find(t => t.id === 'peintre');
  assert.ok(peintre.trustBadges.some(b => (b.title + b.desc).includes('Qualibat')), 'Peintre has Qualibat');

  // Test Boulangerie does not have Garantie décennale in about points
  const boulangerieSite = generateSite({
    name: 'Boulangerie Tradition',
    tradeId: 'boulangerie',
    city: 'Lyon'
  });
  const aboutSec = boulangerieSite.sections.find(s => s.type === 'about');
  assert.ok(aboutSec, 'About section exists');
  const pointsText = JSON.stringify(aboutSec.content.points || []);
  assert.ok(!pointsText.includes('décennale'), 'Boulangerie does not mention garantie décennale');

  // Test Hours are trade-adapted
  const hoursSec = boulangerieSite.sections.find(s => s.type === 'hours');
  assert.ok(hoursSec, 'Hours section exists');
  assert.ok(hoursSec.content.hours?.mardi?.includes('06h30'), 'Boulangerie opens early at 06h30');
});

test('v4.2.0 Quality: Exporter includes Fontshare and complete motion engine', () => {
  const project = generateSite({
    name: 'Test Artisan',
    tradeId: 'menuisier',
    city: 'Bordeaux'
  });
  const html = exportStandaloneHTML(project);

  assert.ok(html.includes('api.fontshare.com'), 'Standalone HTML includes Fontshare stylesheet');
  assert.ok(html.includes('[data-motion="reveal"].is-revealed'), 'Includes reveal motion keyframe selector');
  assert.ok(html.includes('[data-motion="stagger"].is-revealed'), 'Includes stagger motion selector');
  assert.ok(html.includes('.is-revealed { opacity: 1 !important; }'), 'Guarantees revealed elements have full opacity');
  assert.ok(html.includes('.sr-percent-badge { position: absolute; bottom: 1rem; right: 1rem;'), 'SplitReveal badge positioned bottom-right');
  assert.ok(html.includes('.artisite-root[data-site-theme="dark"] .faq-item'), 'Dark mode overrides FAQ item');
  assert.ok(html.includes('.sticky-call-btn'), 'Sticky call bar button class included');
});

test('v4.2.0 Quality: Client demo isolation on Sticky Call Bar and Modals', () => {
  const project = generateSite({
    name: 'Atelier Bois',
    tradeId: 'menuisier',
    city: 'Nantes'
  });

  // Client mode: no drag handle
  const clientSticky = renderStickyCallBar(project, { isEditor: false });
  assert.ok(!clientSticky.includes('sticky-drag-handle'), 'Client sticky bar does not render drag handle');
  assert.ok(clientSticky.includes('sticky-call-btn'), 'Sticky bar renders high-contrast call button');

  // Editor mode: has drag handle
  const editorSticky = renderStickyCallBar(project, { isEditor: true });
  assert.ok(editorSticky.includes('sticky-drag-handle'), 'Editor sticky bar renders drag handle');

  // Closer modal incorporates ?demo= url
  const closerHtml = renderCloserModal(project);
  assert.ok(closerHtml.includes(`?demo=${project.id}`), 'Closer modal incorporates demo query parameter');

  // Share modal cleans spaces from SMS phone link
  project.business.phone = '06 12 34 56 78';
  const shareHtml = renderShareModal(project);
  assert.ok(shareHtml.includes('href="sms:0612345678'), 'Share modal strips whitespace from phone in sms: link');
});

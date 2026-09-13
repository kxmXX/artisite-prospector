import test from 'node:test';
import assert from 'node:assert/strict';
import { TRADES } from '../public/js/data/trades.js';
import { generateSite } from '../public/js/engine/generator.js';
import { exportStandaloneHTML } from '../public/js/engine/exporter.js';
import { renderStickyCallBar } from '../public/js/components/renderer.js';
import { renderCloserModal } from '../public/js/components/closerModal.js';
import { renderShareModal } from '../public/js/components/shareModal.js';

test('Generation defaults do not fabricate client facts', () => {
  for (const trade of TRADES) {
    assert.deepEqual(trade.trustBadges, [], `${trade.id} must not receive unverified trust badges`);
    assert.deepEqual(trade.reviews, [], `${trade.id} must not receive fake reviews`);
  }

  const site = generateSite({ name: 'Boulangerie Tradition', tradeId: 'boulanger', city: 'Lyon' });
  assert.equal(site.business.phone, '', 'Missing phone stays empty');
  assert.equal(site.business.email, '', 'Missing email stays empty');
  assert.equal(site.business.address, '', 'Missing address stays empty');
  assert.deepEqual(site.business.openingHours, {}, 'Missing opening hours stay empty');
  assert.equal(site.branding.socialProofEnabled, false, 'Social proof is opt-in');

  const aboutSec = site.sections.find(s => s.type === 'about');
  const hoursSec = site.sections.find(s => s.type === 'hours');
  const reviewsSec = site.sections.find(s => s.type === 'reviews');
  const beforeAfterSec = site.sections.find(s => s.type === 'beforeAfter');
  assert.equal(aboutSec.content.certified, '', 'No certification is invented');
  assert.equal(hoursSec.visibility, false, 'Hours stay hidden until provided');
  assert.equal(reviewsSec.visibility, false, 'Reviews stay hidden until provided');
  assert.equal(reviewsSec.content.overallRating, '', 'No rating is invented');
  assert.equal(beforeAfterSec.visibility, false, 'Before/after stays hidden without real images');

  const withFacts = generateSite({
    name: 'Boulangerie Tradition', tradeId: 'boulanger', city: 'Lyon',
    phone: '04 00 00 00 00', email: 'contact@example.test', address: '1 rue Test',
    openingHours: { mardi: '06h30 - 19h30' }
  });
  assert.equal(withFacts.business.phone, '04 00 00 00 00');
  assert.equal(withFacts.business.email, 'contact@example.test');
  assert.equal(withFacts.business.address, '1 rue Test');
  assert.equal(withFacts.sections.find(s => s.type === 'hours').content.hours.mardi, '06h30 - 19h30');
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

import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSite } from '../public/js/engine/generator.js';
import { renderWebsiteHTML, renderStickyCallBar } from '../public/js/components/renderer.js';
import { renderEditor } from '../public/js/components/editor.js';
import { renderWizardModal } from '../public/js/components/wizard.js';
import { renderImageModal } from '../public/js/components/imageModal.js';
import { state } from '../public/js/state.js';

test('v4.3.0 Craft: Floating text toolbar contains B, I, U and no Monter/Descendre', () => {
  const project = generateSite({ name: 'Test Craft', tradeId: 'menuisier', city: 'Paris' });
  state.currentProject = project;
  state.currentView = 'editor';
  state.editorMode = 'edit';
  const editorHtml = renderEditor(state);

  assert.ok(editorHtml.includes('id="floating-text-toolbar"'), 'Floating text toolbar is present');
  assert.ok(editorHtml.includes('id="ftb-bold"'), 'Has Bold button');
  assert.ok(editorHtml.includes('id="ftb-italic"'), 'Has Italic button');
  assert.ok(editorHtml.includes('id="ftb-underline"'), 'Has Underline button');
  assert.ok(!editorHtml.includes('id="ftb-move-up"'), 'Section move-up was removed from text toolbar');
  assert.ok(!editorHtml.includes('id="ftb-move-down"'), 'Section move-down was removed from text toolbar');
});

test('v4.3.0 Craft: Button popover has continuous scale slider, ID tag, and motion presets', () => {
  const project = generateSite({ name: 'Menuiserie Test', tradeId: 'menuisier', city: 'Lyon' });
  const html = renderWebsiteHTML(project, { isEditor: true });

  assert.ok(html.includes('data-cta-scale-slider'), 'Has continuous scale slider');
  assert.ok(html.includes('setButtonScale(this.value, true)'), 'Has live slider input event');
  assert.ok(html.includes('setButtonScale(this.value, false)'), 'Has commit slider change event');
  assert.ok(html.includes('setButtonMotion'), 'Has button motion options');
  assert.ok(html.includes('Pulse') && html.includes('Shimmer') && html.includes('Glow'), 'Includes motion presets');
});

test('v4.3.0 Craft: State manager setButtonScale with isLive and setButtonMotion', () => {
  const project = generateSite({ name: 'State Test', tradeId: 'plombier', city: 'Nice' });
  state.currentProject = JSON.parse(JSON.stringify(project));
  const heroSec = state.currentProject.sections.find(s => s.type === 'hero');

  // isLive = true modifies scale without notify
  state.setButtonScale(125, true);
  assert.equal(state.currentProject.branding.ctaScale, 125, 'ctaScale updated live');

  // isLive = false persists scale
  state.setButtonScale(130, false);
  assert.equal(state.currentProject.branding.ctaScale, 130, 'ctaScale persisted');

  // setButtonMotion applies motion preset
  state.setButtonMotion(heroSec.id, 'primary', 'shimmer');
  const updatedHero = state.currentProject.sections.find(s => s.id === heroSec.id);
  assert.equal(updatedHero.settings['primary-motion'], 'shimmer', 'Hero primary button has shimmer motion');
  assert.equal(updatedHero.settings['btn-primary-motion'], 'shimmer', 'btn-primary-motion set');
});

test('v4.3.0 Craft: Location section renders interactive Google Maps iframe with route overlay', () => {
  const project = generateSite({ name: 'Jardin & Co', tradeId: 'paysagiste', city: 'Toulouse' });
  // Location is an optional section in the landscaper composition, independent of hours.
  project.sections.find(s => s.type === 'location').visibility = true;
  const html = renderWebsiteHTML(project, { isEditor: false });

  assert.ok(html.includes('iframe'), 'Location renders an embedded iframe');
  assert.ok(html.includes('maps.google.com/maps'), 'Iframe uses Google Maps embed');
  assert.ok(html.includes('maps.google.com/?q=') || html.includes('Calculer mon itinéraire'), 'Includes live route overlay button');
});

test('v4.3.0 Craft: Services CTA has data-editable attribute', () => {
  const project = generateSite({ name: 'Services Test', tradeId: 'electricien', city: 'Bordeaux' });
  assert.equal(project.sections.find(s => s.type === 'services').content.services[0].price, '');
  const html = renderWebsiteHTML(project, { isEditor: true });

  assert.ok(html.includes('data-editable="services.0.ctaText"'), 'First service CTA button is inline editable');
});

test('v4.3.0 Craft: Wizard modal has Advanced parameters (Ambiance, Tone, Color)', () => {
  const wizardHtml = renderWizardModal();
  assert.ok(wizardHtml.includes('id="wiz-ambiance"'), 'Wizard includes ambiance selector');
  assert.ok(wizardHtml.includes('id="wiz-tone"'), 'Wizard includes tone selector');
  assert.ok(wizardHtml.includes('id="wiz-color"'), 'Wizard includes color input');
  assert.ok(wizardHtml.includes('id="wiz-color-picker"'), 'Wizard includes color picker');
});

test('v4.3.0 Craft: Image modal has bounded thumbnail size preventing SVG blowout', () => {
  const project = generateSite({ name: 'Img Test', tradeId: 'plombier', city: 'Lyon' });
  state.currentProject = project;
  state.activeImageMeta = { sectionType: 'hero', currentUrl: '' };
  const imgModalHtml = renderImageModal(state);
  assert.ok(imgModalHtml.includes('max-w-[5rem]'), 'Image modal limits preview width');
  assert.ok(imgModalHtml.includes('max-h-[5rem]'), 'Image modal limits preview height');
  assert.ok(!imgModalHtml.includes('w-18'), 'Invalid w-18 Tailwind class removed');
});

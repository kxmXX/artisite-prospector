import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { generateSite } from '../public/js/engine/generator.js';
import { renderWebsiteHTML } from '../public/js/components/renderer.js';

const appSource = fs.readFileSync(new URL('../public/js/app.js', import.meta.url), 'utf8');
const appCss = fs.readFileSync(new URL('../public/css/app.css', import.meta.url), 'utf8');
const editorSource = fs.readFileSync(new URL('../public/js/components/editor.js', import.meta.url), 'utf8');
const inspectorSource = fs.readFileSync(new URL('../public/js/components/inspector.js', import.meta.url), 'utf8');
const rendererSource = fs.readFileSync(new URL('../public/js/components/renderer.js', import.meta.url), 'utf8');

function projectWithLoops() {
  const project = generateSite({ name: 'Loop', tradeId: 'paysagiste' });
  const hero = project.sections.find(section => section.type === 'hero');
  hero.settings = {
    motionPreset: 'fade-in',
    motionLoop: 'infinite',
    elementMotions: { title: 'slide-up' },
    elementMotionLoops: { title: 'twice' },
    imageMotions: { heroImage_0: 'pulse' },
    imageMotionLoops: { heroImage_0: 'infinite' }
  };
  return { project, hero };
}

test('loops render on the section, the element and the image', () => {
  const { project, hero } = projectWithLoops();
  const html = renderWebsiteHTML(project, { isEditor: true });
  const sectionTag = (html.match(new RegExp('data-section-id="' + hero.id + '"[^>]*>')) || [''])[0];
  assert.ok(sectionTag.includes('data-motion="fade-in"'), 'section keeps its preset');
  assert.ok(sectionTag.includes('data-motion-loop="infinite"'), 'section loop attribute must render');
  const titleTag = (html.match(/<[^>]*data-editable="title"[^>]*>/) || [''])[0];
  assert.ok(titleTag.includes('data-motion-loop="twice"'), 'element loop attribute must render');
  const firstImage = html.slice(html.indexOf('<img'));
  assert.ok(firstImage.includes('data-motion-loop="infinite"'), 'image loop attribute must render');
});

test('a loop only applies when asked, and reduced motion neutralises it', () => {
  const project = generateSite({ name: 'No Loop', tradeId: 'paysagiste' });
  const hero = project.sections.find(section => section.type === 'hero');
  hero.settings = { motionPreset: 'fade-in' };
  const html = renderWebsiteHTML(project, { isEditor: true });
  const sectionTag = (html.match(new RegExp('data-section-id="' + hero.id + '"[^>]*>')) || [''])[0];
  assert.ok(sectionTag.includes('data-motion="fade-in"'));
  assert.ok(!sectionTag.includes('data-motion-loop'), 'no loop is emitted unless the author asks');
  assert.ok(appCss.includes('[data-motion-loop="twice"] { animation-iteration-count: 2 !important; }'));
  assert.ok(appCss.includes('[data-motion-loop="infinite"] { animation-iteration-count: infinite !important; }'));
  assert.ok(appCss.includes('@media (prefers-reduced-motion: reduce) {'), 'reduced motion block exists');
  assert.ok(appCss.includes('[data-motion-loop] { animation-iteration-count: 1 !important; }'), 'loops are neutralised for reduced motion');
});

test('loop controls exist and are shared by the three menus', () => {
  assert.ok(appSource.includes('setSectionMotionLoop(sectionId, mode)'));
  assert.ok(appSource.includes('setActiveTextMotionLoop(mode)'));
  assert.ok(appSource.includes('setImageMotionLoop(secId, fieldPath, itemIndex, mode)'));
  assert.ok(appSource.includes('syncMotionLoopButtons'));
  assert.ok(appSource.includes('elementMotionLoops'));
  assert.ok(appSource.includes('imageMotionLoops'));
  assert.ok(inspectorSource.includes('data-section-loop'), 'la boucle de section est dans l inspecteur');
  assert.ok(editorSource.includes('data-text-loop'));
  assert.ok(rendererSource.includes('data-image-loop'));
  assert.ok(editorSource.includes('mission-loop') || editorSource.includes('motion-loop-row'));
  assert.ok(appCss.includes('.motion-loop-btn.is-active'));
});

test('the editor names the block and the element distinctly', () => {
  assert.ok(inspectorSource.includes('Animation de la section'), 'section-level motion is labelled explicitly');
  assert.ok(editorSource.includes('Animation de l’élément'), 'element-level motion is labelled explicitly');
  assert.ok(rendererSource.includes('Animation de l’image'), 'image-level motion is labelled explicitly');
  assert.ok(!editorSource.includes('Animation du bloc'), 'the ambiguous block label is gone');
});

test('every preset previews its own motion on hover', () => {
  assert.ok(appCss.includes('.motion-option[data-motion-preview="fade-in"]:hover, .motion-chip[data-motion-preview="fade-in"]:hover { animation: motion-fade-in 650ms'), 'fade preview');
  assert.ok(appCss.includes('.motion-option[data-motion-preview="slide-up"]:hover'), 'slide preview');
  assert.ok(appCss.includes('.motion-option[data-motion-preview="pulse"]:hover, .motion-chip[data-motion-preview="pulse"]:hover { animation: textPulse 1.6s'), 'pulse preview');
  assert.ok(appCss.includes('.motion-option[data-motion-preview]:hover, .motion-chip[data-motion-preview]:hover { animation: none !important; }'), 'reduced motion disables previews');
  assert.ok(editorSource.includes('data-motion-preview='), 'editor menus wire the preview');
  assert.ok(rendererSource.includes('data-motion-preview='), 'image menu wires the preview');
  assert.ok(editorSource.includes('Survolez une animation pour la voir jouer'), 'the editor explains the hover preview in plain words');
  assert.ok(rendererSource.includes('motion-preview-hint'), 'the image menu explains the hover preview');
});
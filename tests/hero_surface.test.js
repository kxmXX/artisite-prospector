import test from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLE_PROJECTS } from '../public/js/data/sampleProjects.js';
import { renderWebsiteHTML } from '../public/js/components/renderer.js';
import { exportStandaloneHTML } from '../public/js/engine/exporter.js';
import { HERO_STYLES } from '../public/js/components/heroStyles.js';

test('fullscreen hero shares explicit layers and responsive styles across delivery modes', () => {
  const project = structuredClone(SAMPLE_PROJECTS[0]);
  const hero = project.sections.find(s => s.type === 'hero');
  hero.settings.overlayDarkening = 70;
  const before = JSON.stringify(project);
  for (const html of [renderWebsiteHTML(project), renderWebsiteHTML(project, { isEditor: true }), exportStandaloneHTML(project)]) {
    assert.ok(html.includes(HERO_STYLES));
    assert.match(html, /class="hero-background"/);
    assert.match(html, /class="hero-content text-center/);
    assert.match(html, /rgba\(0, 0, 0, 0\.7\)/);
    assert.ok(html.includes(hero.content.title));
    assert.match(html, /href="#about"/);
    assert.match(html, /href="#simulateur"/);
  }
  assert.equal(JSON.stringify(project), before);
  assert.match(HERO_STYLES, /isolation: isolate/);
  assert.match(HERO_STYLES, /z-index: 0/);
  assert.match(HERO_STYLES, /z-index: 1/);
  assert.match(HERO_STYLES, /z-index: 2/);
  assert.match(HERO_STYLES, /56\.25vw/);
  assert.match(HERO_STYLES, /min-height: 42rem/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createEspritNatureDemoProject } from '../public/js/data/sampleProjects.js';

test('canonical Esprit Nature demo instances never reuse persisted project mutations', () => {
  const first = createEspritNatureDemoProject();
  const header = first.sections.find(section => section.type === 'header');
  header.content.ctaText = 'CORROMPU';
  first.freeformLayout = { desktop: { bogus: { x: 999, y: 999, width: 10, height: 10 } } };

  const second = createEspritNatureDemoProject();
  const freshHeader = second.sections.find(section => section.type === 'header');
  assert.equal(freshHeader.content.ctaText, 'Demander un devis personnalisé');
  assert.equal(second.freeformLayout, undefined);
  assert.notEqual(first, second);
});

test('app navigation gives editor, preview and canonical vitrine real browser history routes', () => {
  const appSource = fs.readFileSync(path.resolve(process.cwd(), 'public/js/app.js'), 'utf8');
  const editorSource = fs.readFileSync(path.resolve(process.cwd(), 'public/js/components/editor.js'), 'utf8');
  assert.ok(appSource.includes('window.addEventListener("popstate"'));
  assert.ok(appSource.includes('window.history[replace ? "replaceState" : "pushState"]'));
  assert.ok(appSource.includes('createEspritNatureDemoProject()'));
  assert.ok(appSource.includes('url.searchParams.set("vitrine", "1")'));
  assert.ok(editorSource.includes('window.app.openPreview(\'${project.id}\')'));
});

import { SITE_TEMPLATES, getDefaultTemplateIdForTrade, instantiateSiteTemplate } from '../public/js/data/templates.js';
import { renderWizardModal } from '../public/js/components/wizard.js';
import { renderWebsiteHTML } from '../public/js/components/renderer.js';

test('template registry exposes explicit visual bases and safe defaults by trade', () => {
  assert.deepEqual(SITE_TEMPLATES.map(template => template.id), ['esprit-reference', 'artisan-modern', 'local-warm']);
  assert.equal(getDefaultTemplateIdForTrade('paysagiste'), 'esprit-reference');
  assert.equal(getDefaultTemplateIdForTrade('plombier'), 'artisan-modern');
  assert.equal(getDefaultTemplateIdForTrade('restaurant'), 'local-warm');
});

test('Esprit reference template preserves canonical composition without copying demo state', () => {
  const canonical = createEspritNatureDemoProject();
  const project = instantiateSiteTemplate('esprit-reference', {
    name: 'Jardins Martin', tradeId: 'paysagiste', city: 'Nantes', phone: '01 02 03 04 05'
  });
  assert.equal(project.templateId, 'esprit-reference');
  assert.equal(project.isDemo, false);
  assert.equal(project.business.name, 'Jardins Martin');
  assert.equal(project.business.city, 'Nantes');
  assert.equal(project.freeformLayout, undefined);
  assert.deepEqual(
    project.sections.map(section => [section.type, section.variant]),
    canonical.sections.map(section => [section.type, section.variant])
  );
  assert.deepEqual(
    project.sections.filter(section => section.visibility !== false).map(section => section.type),
    canonical.sections.filter(section => section.visibility !== false).map(section => section.type)
  );
  assert.equal(project.sections.find(section => section.type === 'about').content.certified, '');
  assert.ok(project.sections.find(section => section.type === 'reviews').content.reviews.length >= 1);
  assert.deepEqual(project.sections.find(section => section.type === 'hours').content.hours, {});
  const visibleTypes = project.sections.filter(section => section.visibility !== false).map(section => section.type);
  assert.equal(visibleTypes.at(-1), 'footer');
  assert.ok(visibleTypes.indexOf('quoteSimulator') < visibleTypes.indexOf('footer'));
  const html = renderWebsiteHTML(project);
  assert.match(html, /vitrine-template/);
  assert.match(html, /Othman Mercier/);
  assert.match(html, /Horaires à renseigner avant publication/);
  assert.doesNotMatch(html, /5\.0\/5 — 5 avis/);
  assert.doesNotMatch(html, />9h - 12h \/ 14h - 18h</);
});

test('alternative template can give a paysagiste a non-reference composition', () => {
  const project = instantiateSiteTemplate('artisan-modern', {
    name: 'Jardins Techniques', tradeId: 'paysagiste', city: 'Lille'
  });
  assert.equal(project.templateId, 'artisan-modern');
  assert.equal(project.branding.presetId, 'artisan-moderne');
  assert.doesNotMatch(renderWebsiteHTML(project), /public-mode vitrine-template/);
});

test('wizard presents template choice before generation', () => {
  const html = renderWizardModal();
  assert.match(html, /Template de départ/);
  assert.match(html, /name="wiz-template" value="esprit-reference"/);
  assert.match(html, /name="wiz-template" value="artisan-modern"/);
  assert.match(html, /name="wiz-template" value="local-warm"/);
});

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

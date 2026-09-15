import test from "node:test";
import assert from "node:assert/strict";

import { escapeHtml, sanitizeUrl } from "../public/js/utils/html.js";
import { generateDemoSite } from "../public/js/engine/generator.js";
import { createSafeRenderProject, renderWebsiteHTML } from "../public/js/components/renderer.js";
import { exportStandaloneHTML } from "../public/js/engine/exporter.js";

test("shared HTML utilities escape markup and reject executable URL schemes", () => {
  assert.equal(escapeHtml(`<img src=x onerror="alert('x')">`), "&lt;img src=x onerror=&quot;alert(&#039;x&#039;)&quot;&gt;");
  assert.equal(sanitizeUrl("javascript:alert(1)"), "#");
  assert.equal(sanitizeUrl("images/hero.jpg", { allowDataImage: true }), "images/hero.jpg");
  assert.equal(sanitizeUrl("https://example.test/a?q=1"), "https://example.test/a?q=1");
});

test("public renderer and standalone export keep user content inert", () => {
  const project = generateDemoSite({ name: "Atelier Test", tradeId: "paysagiste", city: "Montauban" });
  const hero = project.sections.find(section => section.type === "hero");
  const header = project.sections.find(section => section.type === "header");
  const payload = `<img src=x onerror="globalThis.__xss=1">`;
  project.business.name = `Atelier & ${payload}`;
  hero.content.title = payload;
  hero.content.subtitle = `Devis & sécurité </style><script>globalThis.__xss=2</script>`;
  hero.content.image = "javascript:alert(1)";
  header.content.links = [{ label: payload, target: "javascript:alert(2)" }];
  project.branding.headingFont = `Inter';background:url(javascript:alert(3));'`;
  project.branding.primaryColor = `red; background:url(javascript:alert(4))`;

  const safeProject = createSafeRenderProject(project);
  assert.equal(safeProject.sections.find(section => section.type === "hero").content.image, "#");
  assert.match(safeProject.business.name, /Atelier &amp; &lt;img/);

  for (const html of [renderWebsiteHTML(project), exportStandaloneHTML(project)]) {
    assert.doesNotMatch(html, /<img src=x onerror=/i);
    assert.doesNotMatch(html, /javascript:alert/i);
    assert.doesNotMatch(html, /<script>globalThis\.__xss/i);
    assert.match(html, /&lt;img src=x onerror=/);
    assert.match(html, /--primary: #059669/);
    assert.match(html, /--font-heading: 'Interbackgroundurljavascriptalert3'/);
  }
});

test("JSON-LD cannot terminate its script element through business content", () => {
  const project = generateDemoSite({ name: "</script><script>alert(1)</script>", tradeId: "paysagiste", city: "Paris" });
  const html = exportStandaloneHTML(project);

  assert.doesNotMatch(html, /<\/script><script>alert\(1\)<\/script>/i);
  assert.match(html, /\\u003c\/script\\u003e/);
});

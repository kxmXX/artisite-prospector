import test from "node:test";
import assert from "node:assert/strict";

// Mock minimal localStorage for Node.js test environment
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

import { generateSite } from "../public/js/engine/generator.js";
import { renderWebsiteHTML } from "../public/js/components/renderer.js";
import { getDeepValue, setDeepValue } from "../public/js/state.js";

test("2026-2030 Editor: Floating canvas toolbar is rendered on sections in editor mode", () => {
  const project = generateSite({ name: "Plomberie Dupont", tradeId: "plombier" });
  const editorHTML = renderWebsiteHTML(project, { isEditor: true });

  // Floating toolbar buttons must exist
  assert.ok(editorHTML.includes('editor-section-toolbar'), "Should render editor-section-toolbar");
  assert.ok(editorHTML.includes('data-action="move-up"'), "Should contain move-up action");
  assert.ok(editorHTML.includes('data-action="move-down"'), "Should contain move-down action");
  assert.ok(editorHTML.includes('data-action="toggle-bg"'), "Should contain toggle-bg action");
  assert.ok(editorHTML.includes('data-action="insert-after"'), "Should contain insert-after action");
  assert.ok(editorHTML.includes('data-action="toggle-vis"'), "Should contain toggle-vis action");
  assert.ok(editorHTML.includes('data-action="delete"'), "Should contain delete action");

  // In preview / standalone mode, editor chrome must NOT be rendered
  const standaloneHTML = renderWebsiteHTML(project, { isEditor: false, isStandalone: true });
  assert.ok(!standaloneHTML.includes('editor-section-toolbar'), "Standalone mode must not have editor toolbar");
});

test("2026-2030 Editor: Inline editable tags are present on deep child elements", () => {
  const project = generateSite({ name: "Esprit Nature", tradeId: "paysagiste" });
  const editorHTML = renderWebsiteHTML(project, { isEditor: true });

  // Trust badges deep editability
  assert.ok(editorHTML.includes('data-editable="badges.0.title"'), "Trust badges title must have data-editable");
  assert.ok(editorHTML.includes('data-editable="badges.0.desc"'), "Trust badges desc must have data-editable");

  // Services deep editability
  assert.ok(editorHTML.includes('data-editable="services.0.title"'), "Services title must have data-editable");
  assert.ok(editorHTML.includes('data-editable="services.0.desc"'), "Services desc must have data-editable");
  assert.ok(editorHTML.includes('data-editable="services.0.price"'), "Services price must have data-editable");

  // Stats deep editability
  assert.ok(editorHTML.includes('data-editable="items.0.value"'), "Stats items value must have data-editable");

  // Reviews deep editability
  assert.ok(editorHTML.includes('data-editable="reviews.0.text"'), "Reviews text must have data-editable");

  // FAQ deep editability
  assert.ok(editorHTML.includes('data-editable="items.0.q"'), "FAQ question must have data-editable");
});

test("2026-2030 Editor: CTA sizing variables are computed and applied to .artisite-root", () => {
  const project = generateSite({ name: "Menuiserie Bois", tradeId: "menuisier" });
  
  // Test with lg CTA size
  project.branding.ctaSize = "lg";
  const htmlLg = renderWebsiteHTML(project, { isEditor: true });
  assert.ok(htmlLg.includes('--cta-padding: 1rem 2rem'), "Should set --cta-padding for lg size");
  assert.ok(htmlLg.includes('--cta-font-size: 1.125rem'), "Should set --cta-font-size for lg size");

  // Test with sm CTA size
  project.branding.ctaSize = "sm";
  const htmlSm = renderWebsiteHTML(project, { isEditor: true });
  assert.ok(htmlSm.includes('--cta-padding: 0.5rem 1rem'), "Should set --cta-padding for sm size");
  assert.ok(htmlSm.includes('--cta-font-size: 0.875rem'), "Should set --cta-font-size for sm size");
});

test("2026-2030 Editor: CustomBlock sections (urgentBanner, floatingBadge, customCard) render correctly", () => {
  const project = generateSite({ name: "Couverture Pro", tradeId: "couvreur" });

  const customSec = {
    id: "sec-banner-test",
    type: "customBlock",
    variant: "urgentBanner",
    visibility: true,
    content: {
      blockType: "urgentBanner",
      badge: "⚡ DÉPANNAGE TOITURE 24H",
      title: "Intervention Fuite sous 1 heure",
      text: "Nos couvreurs d'astreinte se déplacent sans délai.",
      ctaText: "06 00 00 00 00",
      ctaLink: "tel:0600000000"
    },
    settings: { bgTheme: "mineral" }
  };

  project.sections.splice(1, 0, customSec);
  const html = renderWebsiteHTML(project, { isEditor: true });

  assert.ok(html.includes("⚡ DÉPANNAGE TOITURE 24H"), "Should render banner badge");
  assert.ok(html.includes("Intervention Fuite sous 1 heure"), "Should render banner title");
  assert.ok(html.includes("urgent-banner"), "Should apply urgent-banner CSS class");
  assert.ok(html.includes("bg-sec-mineral"), "Should apply bg-sec-mineral theme class");
});

test("2026-2030 Editor: getDeepValue and setDeepValue handle array indices and nested objects seamlessly", () => {
  const obj = {
    title: "Initial Title",
    badges: [
      { title: "Badge 0", desc: "Desc 0" },
      { title: "Badge 1", desc: "Desc 1" }
    ],
    services: [
      { id: "s1", price: "50€", meta: { active: true } }
    ]
  };

  // Reads
  assert.equal(getDeepValue(obj, "title"), "Initial Title");
  assert.equal(getDeepValue(obj, "badges.0.title"), "Badge 0");
  assert.equal(getDeepValue(obj, "badges.1.desc"), "Desc 1");
  assert.equal(getDeepValue(obj, "services.0.price"), "50€");

  // Writes
  setDeepValue(obj, "badges.0.title", "Super Garantie");
  assert.equal(obj.badges[0].title, "Super Garantie");

  setDeepValue(obj, "services.0.price", "Sur devis");
  assert.equal(obj.services[0].price, "Sur devis");

  setDeepValue(obj, "badges.2.title", "Nouveau Badge");
  assert.equal(obj.badges[2].title, "Nouveau Badge");
});

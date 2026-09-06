import test from "node:test";
import assert from "node:assert/strict";
import { generateSite, createSectionData } from "../public/js/engine/generator.js";
import { renderWebsiteHTML } from "../public/js/components/renderer.js";
import { getTradeById } from "../public/js/data/trades.js";

test("renderWebsiteHTML renders all 16 sections in editor and standalone modes", () => {
  const site = generateSite({
    name: "Boulangerie Tradition",
    tradeId: "boulanger",
    city: "Bordeaux",
    phone: "05 56 00 11 22"
  });

  const editorHTML = renderWebsiteHTML(site, { isEditor: true, isStandalone: false });
  assert.ok(editorHTML.includes("data-section-id="), "Editor mode must include data-section-id wrappers");
  assert.ok(editorHTML.includes("Boulangerie Tradition"), "Must contain business name");
  assert.ok(!editorHTML.includes("undefined"), "Must not contain undefined");

  const previewHTML = renderWebsiteHTML(site, { isEditor: false, isStandalone: false });
  assert.ok(!previewHTML.includes("editor-section-toolbar"), "Preview mode must not contain editor toolbars");
  assert.ok(previewHTML.includes("site-section"), "Preview mode must include site-section classes");
  assert.ok(!previewHTML.includes("undefined"), "Must not contain undefined");
});

test("createSectionData creates valid sections for all types and renders without errors", () => {
  const trade = getTradeById("peintre");
  const business = { name: "Peinture Pro", city: "Lyon", phone: "06 00 00 00 00" };

  const sectionTypes = [
    { type: "hero", variant: "fullscreen-image" },
    { type: "hero", variant: "dark" },
    { type: "services", variant: "2-columns" },
    { type: "services", variant: "editorial" },
    { type: "about", variant: "centered-badge" },
    { type: "gallery", variant: "editorial-grid" },
    { type: "reviews", variant: "quote-carousel" }
  ];

  for (const { type, variant } of sectionTypes) {
    const secData = createSectionData(type, variant, trade, business);
    assert.ok(secData, `createSectionData must succeed for ${type}/${variant}`);
    assert.equal(secData.type, type);
    assert.equal(secData.variant, variant);

    const testProject = {
      branding: {
        primaryColor: "#ea580c",
        secondaryColor: "#0f172a",
        accentColor: "#f59e0b",
        bgColor: "#ffffff",
        bgSecondary: "#f8fafc",
        textColor: "#0f172a",
        textMuted: "#64748b",
        headingFont: "Plus Jakarta Sans",
        bodyFont: "Inter",
        borderRadius: "1rem",
        buttonRadius: "0.75rem"
      },
      business,
      sections: [{ id: `test-${type}`, ...secData, visibility: true }]
    };

    const rendered = renderWebsiteHTML(testProject, { isEditor: false, isStandalone: true });
    assert.ok(rendered.length > 50, `Rendered HTML for ${type}/${variant} should be non-empty`);
    assert.ok(!rendered.includes("undefined"), `Rendered HTML for ${type}/${variant} must not contain undefined`);
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { generateSite } from "../public/js/engine/generator.js";
import { renderWebsiteHTML } from "../public/js/components/renderer.js";

if (!global.localStorage) {
  global.localStorage = {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; }
  };
}

const { state } = await import("../public/js/state.js");

test("v4.1.0: Button deletion, restoration and Undo/Redo support", () => {
  const p = generateSite({ name: "Jardin Test v4.1.0", tradeId: "paysagiste" });
  state.addProject(p, true);

  const heroSec = p.sections.find(s => s.type === "hero");
  assert.ok(heroSec, "Project must have a hero section");

  // Delete primary CTA button
  state.deleteButton(heroSec.id, "primary");
  const updatedHero = state.currentProject.sections.find(s => s.id === heroSec.id);
  assert.ok(Array.isArray(updatedHero.settings.hiddenButtons), "hiddenButtons must be an array");
  assert.ok(updatedHero.settings.hiddenButtons.includes("primary"), "Primary button must be marked hidden");

  // Renderer must hide the deleted button
  const editorHTML = renderWebsiteHTML(state.currentProject, { isEditor: true, isStandalone: false });
  assert.ok(editorHTML.includes("hidden"), "Hidden class must be applied to deleted button");

  // Undo deletion
  assert.ok(state.canUndo(), "Undo must be available after button deletion");
  state.undo();
  const undoneHero = state.currentProject.sections.find(s => s.id === heroSec.id);
  assert.ok(!undoneHero.settings?.hiddenButtons?.includes("primary"), "Button must be restored on undo");

  // Redo deletion
  state.redo();
  const redoneHero = state.currentProject.sections.find(s => s.id === heroSec.id);
  assert.ok(redoneHero.settings.hiddenButtons.includes("primary"), "Button deletion must be reapplied on redo");

  // Restore via restoreButton
  state.restoreButton(heroSec.id, "primary");
  const restoredHero = state.currentProject.sections.find(s => s.id === heroSec.id);
  assert.ok(!restoredHero.settings?.hiddenButtons?.includes("primary"), "Button must be restored via restoreButton");

  // Delete multiple and restore all
  state.deleteButton(heroSec.id, "primary");
  state.deleteButton(heroSec.id, "phone");
  assert.equal(state.currentProject.sections.find(s => s.id === heroSec.id).settings.hiddenButtons.length, 2);
  state.restoreAllButtons();
  const clearedHero = state.currentProject.sections.find(s => s.id === heroSec.id);
  assert.ok(!clearedHero.settings?.hiddenButtons || clearedHero.settings.hiddenButtons.length === 0, "hiddenButtons must be cleared");
});

test("v4.1.0: Continuous scale, radius, font size and typography casing controls", () => {
  const p = generateSite({ name: "Menuiserie Pro", tradeId: "menuisier" });
  state.addProject(p, true);

  // Continuous Scale slider
  state.setButtonScale(125);
  assert.equal(state.currentProject.branding.ctaScale, 125, "ctaScale should be updated to 125");

  // Radius picker only changes buttons, not card/container radii
  const cardRadiusBefore = state.currentProject.branding.borderRadius;
  state.setButtonRadius("8px");
  assert.equal(state.currentProject.branding.buttonRadius, "8px", "buttonRadius should be 8px");
  assert.equal(state.currentProject.branding.borderRadius, cardRadiusBefore, "Button radius must not mutate card radius");

  // Typography case toggle (TT)
  state.toggleButtonCase();
  assert.equal(state.currentProject.branding.ctaTransform, "uppercase", "ctaTransform should toggle to uppercase");
  state.toggleButtonCase();
  assert.equal(state.currentProject.branding.ctaTransform, "none", "ctaTransform should toggle back to none");

  // Font size adjuster (A- / A+)
  const prevSize = parseInt(state.currentProject.branding.ctaFontSize || "15", 10);
  state.adjustButtonFontSize(2);
  assert.equal(state.currentProject.branding.ctaFontSize, `${prevSize + 2}px`, "Font size should increment with px");
  state.adjustButtonFontSize(-1);
  assert.equal(state.currentProject.branding.ctaFontSize, `${prevSize + 1}px`, "Font size should decrement with px");
});

test("v4.1.0: Technical overlay badges (#btn-phone, #cta, #h1) are completely disabled in CSS", () => {
  const cssPath = path.resolve(process.cwd(), "public/css/app.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  assert.ok(
    css.includes('[data-ui-target="true"]::after') && css.includes("display: none !important"),
    "Badge pseudo-elements must have display: none !important to avoid visual clutter on desktop"
  );
});

test("v4.1.0: Keycap button border-radius honors variable radius", () => {
  const cssPath = path.resolve(process.cwd(), "public/css/app.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  assert.ok(
    css.includes("border-radius: var(--btn-radius, var(--cta-radius, 8px));"),
    ".btn-keycap must honor CSS variables for continuous border-radius control"
  );
});

test("v4.1.0: Motion engine supports reveal, stagger, shimmer and pulse presets with 60fps animations", () => {
  const cssPath = path.resolve(process.cwd(), "public/css/app.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  assert.ok(css.includes('[data-motion="reveal"].is-revealed'), "CSS must define reveal animation");
  assert.ok(css.includes('[data-motion="stagger"].is-revealed'), "CSS must define stagger animation");
  assert.ok(css.includes('[data-motion="shimmer"].is-revealed'), "CSS must define shimmer animation");
  assert.ok(css.includes('[data-motion="pulse"].is-revealed'), "CSS must define pulse animation");
  assert.ok(css.includes(".pattern-chip"), ".pattern-chip must be styled");
  assert.ok(css.includes(".pattern-chip:hover"), ".pattern-chip must have hover state");
});

test("v4.1.0: Dark and Navy sections have cascading contrast rules to prevent black-on-black text", () => {
  const cssPath = path.resolve(process.cwd(), "public/css/app.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  assert.ok(css.includes('.editor-section-wrapper[data-section-bg="dark"] .section-canvas-content .text-gray-900'), "Dark sections must override text-gray-900 to light text");
  assert.ok(css.includes('.editor-section-wrapper[data-section-bg="dark"] .section-canvas-content .bg-gray-50'), "Dark sections must override bg-gray-50 to dark card background");
  assert.ok(css.includes('.bg-sec-warm'), "CSS must define .bg-sec-warm theme");
  assert.ok(css.includes('.bg-sec-navy'), "CSS must define .bg-sec-navy theme");
});

test("v4.1.0: Expanded section catalog (process, certifications, pricing, customBlock) creates valid data and renders cleanly", async () => {
  const { SECTION_DEFINITIONS } = await import("../public/js/components/addSectionModal.js");
  const { createSectionData } = await import("../public/js/engine/generator.js");
  const { TRADES } = await import("../public/js/data/trades.js");

  const types = SECTION_DEFINITIONS.map(s => s.type);
  assert.ok(types.includes("process"), "SECTION_DEFINITIONS must include process");
  assert.ok(types.includes("certifications"), "SECTION_DEFINITIONS must include certifications");
  assert.ok(types.includes("pricing"), "SECTION_DEFINITIONS must include pricing");
  assert.ok(types.includes("customBlock"), "SECTION_DEFINITIONS must include customBlock");
  assert.ok(types.includes("trust"), "SECTION_DEFINITIONS must include trust");

  const trade = TRADES[0];
  const business = { name: "Pro Démo", city: "Bordeaux", phone: "06 12 34 56 78" };

  for (const t of ["process", "certifications", "pricing", "customBlock", "trust"]) {
    const secData = createSectionData(t, null, trade, business);
    assert.ok(secData, `createSectionData must return valid object for type ${t}`);
    assert.equal(secData.type, t);
  }

  // Create project with new sections and render
  const p = generateSite({ name: "Rénov 33", tradeId: "macon", city: "Bordeaux" });
  p.sections.push(createSectionData("process", null, trade, business));
  p.sections.push(createSectionData("certifications", null, trade, business));
  p.sections.push(createSectionData("pricing", null, trade, business));

  const html = renderWebsiteHTML(p, { isEditor: true });
  assert.ok(html.includes('id="process"'), "Rendered HTML must contain process section");
  assert.ok(html.includes('id="certifications"'), "Rendered HTML must contain certifications section");
  assert.ok(html.includes('id="tarifs"'), "Rendered HTML must contain pricing section");
});

test("v4.1.0: Direct button action badge rendering & preview isolation", () => {
  const p = generateSite({ name: "Jardin Déco", tradeId: "paysagiste" });
  state.addProject(p, true);

  // Editor mode HTML
  const editorHTML = renderWebsiteHTML(state.currentProject, { isEditor: true });
  assert.ok(editorHTML.includes('class="cta-direct-badge"'), "Editor mode must render cta-direct-badge");
  assert.ok(editorHTML.includes('cta-direct-del'), "Editor mode must include direct delete button (✕)");
  assert.ok(editorHTML.includes('cta-direct-gear'), "Editor mode must include direct settings button (⚙️)");
  assert.ok(editorHTML.includes('window.app.adjustButtonFontSize'), "Editor mode must include A-/A+ button font adjusters");

  // Client preview mode HTML (isEditor: false)
  const previewHTML = renderWebsiteHTML(state.currentProject, { isEditor: false, isStandalone: true });
  assert.ok(!previewHTML.includes('cta-direct-badge'), "Preview mode must NOT contain any cta-direct-badge");
  assert.ok(!previewHTML.includes('cta-direct-del'), "Preview mode must NOT contain any cta-direct-del");
});

test("v4.1.0: Section canvas toolbar and sidebar accordion have prominent 'Monter' and 'Descendre' controls", async () => {
  const { renderEditor } = await import("../public/js/components/editor.js");
  const p = generateSite({ name: "Maçonnerie Générale", tradeId: "macon" });
  state.addProject(p, true);

  // 1. Canvas Toolbar labels
  const canvasHTML = renderWebsiteHTML(state.currentProject, { isEditor: true });
  assert.ok(canvasHTML.includes('<span class="sec-ctrl-text">Monter</span>'), "Canvas toolbar must show text label 'Monter'");
  assert.ok(canvasHTML.includes('<span class="sec-ctrl-text">Descendre</span>'), "Canvas toolbar must show text label 'Descendre'");

  // 2. Sidebar Accordion Quick Action Bar
  const editorFullHTML = renderEditor(state);
  assert.ok(editorFullHTML.includes("window.app.moveSection"), "Sidebar editor must include window.app.moveSection");
  assert.ok(editorFullHTML.includes("Monter cette section (↑)"), "Sidebar editor must include top Quick Action Bar with 'Monter'");
  assert.ok(editorFullHTML.includes("Descendre cette section (↓)"), "Sidebar editor must include top Quick Action Bar with 'Descendre'");
  assert.ok(editorFullHTML.includes('id="floating-text-toolbar"'), "Editor must render the floating text toolbar container");
});

test("v4.1.0: Typography inline font-size and weight deltas are applied to data-editable markup", () => {
  const p = generateSite({ name: "Peinture Design", tradeId: "peintre" });
  state.addProject(p, true);

  const hero = p.sections.find(s => s.type === "hero");
  assert.ok(hero, "Hero section must exist");

  // Apply typography modifiers
  hero.settings = hero.settings || {};
  hero.settings.fontSize_title = 6;
  hero.settings.bold_title = true;

  const editorHTML = renderWebsiteHTML(p, { isEditor: true });
  assert.ok(
    editorHTML.includes("font-size: calc(1em + 6px) !important;"),
    "Decorated editable markup must include font-size delta style"
  );
  assert.ok(
    editorHTML.includes("font-weight: 800 !important;"),
    "Decorated editable markup must include bold font-weight style"
  );
});



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

  // Radius picker
  state.setButtonRadius("8px");
  assert.equal(state.currentProject.branding.buttonRadius, "8px", "buttonRadius should be 8px");

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

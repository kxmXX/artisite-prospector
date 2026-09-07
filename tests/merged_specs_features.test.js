import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { renderWebsiteHTML } from "../public/js/components/renderer.js";
import { generateSite, createSectionData } from "../public/js/engine/generator.js";
import { STYLE_PRESETS, getStylePresetById } from "../public/js/data/styles.js";
import { exportStandaloneHTML } from "../public/js/engine/exporter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("merged.txt Feature 1: SplitReveal supports Horizontal & Vertical orientation, percent badge & caption", () => {
  const project = generateSite({
    businessName: "Toitures & Façades de France",
    tradeQuery: "couvreur",
    city: "Toulouse",
    phone: "05 61 00 00 00"
  });

  // Test Horizontal SplitReveal
  const baSecH = createSectionData("beforeAfter", project.business, "interactive-slider");
  baSecH.id = "sec-ba-h";
  baSecH.content.caption = "Nettoyage haute pression et traitement hydrofuge toiture";
  project.sections.push(baSecH);

  const htmlEditor = renderWebsiteHTML(project, { isEditor: true });
  assert.ok(htmlEditor.includes("split-reveal-container"), "Must include .split-reveal-container");
  assert.ok(htmlEditor.includes("ba-container"), "Must preserve .ba-container for backwards compatibility");
  assert.ok(htmlEditor.includes("sr-percent-badge"), "Must render real-time percentage badge");
  assert.ok(htmlEditor.includes("50%"), "Must display initial split percentage");
  assert.ok(htmlEditor.includes("sr-caption"), "Must render caption container");
  assert.ok(htmlEditor.includes("Nettoyage haute pression"), "Must display custom caption");
  assert.ok(htmlEditor.includes("⬌ Horizontal"), "Editor mode must include horizontal switch button");
  assert.ok(htmlEditor.includes("⬍ Vertical"), "Editor mode must include vertical switch button");

  // Test Vertical SplitReveal (ideal for façades and roofs as specified in Ch. 34.4)
  const baSecV = createSectionData("beforeAfter", project.business, "vertical");
  baSecV.id = "sec-ba-v";
  project.sections = [baSecV];

  const htmlVertical = renderWebsiteHTML(project, { isEditor: false });
  assert.ok(htmlVertical.includes('data-split-direction="vertical"'), "Must mark container with vertical split direction");
  assert.ok(htmlVertical.includes("polygon(0 0, 100% 0, 100% 50%, 0 50%)"), "Must apply vertical clip-path");
  assert.ok(!htmlVertical.includes("⬌ Horizontal"), "Preview mode must NOT contain editor direction toggle buttons");
});

test("merged.txt Feature 2: Papercraft Texture & Organic Grain Presets (Ch. 21.3, 28, 34.6)", () => {
  // Check style presets existence
  const terroir = getStylePresetById("editorial-terroir");
  assert.ok(terroir, "Must include editorial-terroir preset");
  assert.strictEqual(terroir.paperGrain, true, "editorial-terroir must have paperGrain enabled");
  assert.strictEqual(terroir.bgColor, "#F5F1E8", "editorial-terroir must use warm cream background");

  const papercraft = getStylePresetById("papercraft-mineral");
  assert.ok(papercraft, "Must include papercraft-mineral preset");
  assert.strictEqual(papercraft.paperGrain, true, "papercraft-mineral must have paperGrain enabled");
  assert.strictEqual(papercraft.borderRadius, "0px", "papercraft must have crisp 0px radius as in checklist");

  // Check CSS data-URI feTurbulence noise filter
  const cssPath = path.join(__dirname, "../public/css/app.css");
  const css = fs.readFileSync(cssPath, "utf-8");
  assert.ok(css.includes("feTurbulence"), "CSS must contain SVG feTurbulence noise filter");
  assert.ok(css.includes("--bg-cream"), "CSS must define --bg-cream token");
  assert.ok(css.includes("--shadow-paper"), "CSS must define --shadow-paper token");

  // Check HTML rendering with paper grain
  const project = generateSite({ businessName: "Le Pain du Terroir", tradeQuery: "boulanger", city: "Lyon" });
  project.branding.stylePreset = "editorial-terroir";
  project.branding.paperGrain = true;

  const html = renderWebsiteHTML(project, { isEditor: false });
  assert.ok(html.includes("texture-paper-grain"), "Root element must receive texture-paper-grain class");
  assert.ok(html.includes('data-paper-grain="true"'), "Root element must set data-paper-grain attribute");
});

test("merged.txt Feature 3: CampaignCard & Dynamic Bookings Counter (Ch. 27.2.E, 34.5)", () => {
  const project = generateSite({ businessName: "Artisans Réunis", tradeQuery: "plombier", city: "Bordeaux" });
  const campaignSec = createSectionData("customBlock", project.business, "campaignCard");
  assert.strictEqual(campaignSec.variant, "campaignCard");
  assert.strictEqual(campaignSec.content.currentBookings, 18);
  assert.strictEqual(campaignSec.content.targetBookings, 25);

  project.sections = [campaignSec];
  const html = renderWebsiteHTML(project, { isEditor: false });

  assert.ok(html.includes("campaign-card"), "Must render .campaign-card container");
  assert.ok(html.includes("campaign-progress-bar"), "Must render progress bar");
  assert.ok(html.includes("campaign-progress-fill"), "Must render progress fill");
  assert.ok(html.includes("18 / 25 chantiers confirmés"), "Must render bookings ratio");
  assert.ok(html.includes("72%"), "Must compute and render progress percentage (18/25 = 72%)");
  assert.ok(html.includes("campaign-pill-option"), "Must render pack selector pills");
  assert.ok(html.includes("Formule Confort"), "Must include pack options");
});

test("merged.txt Feature 4: Emergency 24/7 Radar Banner & Physical Tilted Stickers (Ch. 11, 27.2.F)", () => {
  const project = generateSite({ businessName: "SOS Dépannage Express", tradeQuery: "electricien", city: "Marseille", phone: "06 00 11 22 33" });
  const radarSec = createSectionData("customBlock", project.business, "radarEmergency");
  assert.strictEqual(radarSec.variant, "radarEmergency");
  assert.strictEqual(radarSec.content.isRadar, true);

  project.sections = [radarSec];
  const html = renderWebsiteHTML(project, { isEditor: false });

  assert.ok(html.includes("radar-pulse-dot"), "Must render pulsating radar dot");
  assert.ok(html.includes("physical-sticker"), "Must render physical paper sticker");
  assert.ok(html.includes("sticker-tilt-right"), "Must render right-tilted sticker");
  assert.ok(html.includes("06 00 11 22 33"), "Must link to emergency phone");
});

test("merged.txt Feature 5: AI State Machine & Approval Card Styles and Exporter Integration", () => {
  // Check CSS for AI approval card and confidence meter
  const cssPath = path.join(__dirname, "../public/css/app.css");
  const css = fs.readFileSync(cssPath, "utf-8");
  assert.ok(css.includes(".ai-approval-card"), "Must define .ai-approval-card");
  assert.ok(css.includes(".ai-confidence-bar"), "Must define .ai-confidence-bar");
  assert.ok(css.includes(".ai-confidence-fill"), "Must define .ai-confidence-fill");

  // Check standalone export includes SplitReveal & Papercraft styles and scripts
  const project = generateSite({ businessName: "Esprit Nature", tradeQuery: "paysagiste", city: "Montauban" });
  const standalone = exportStandaloneHTML(project);
  assert.ok(standalone.includes("split-reveal-container"), "Standalone export must contain SplitReveal CSS");
  assert.ok(standalone.includes("data:image/svg+xml,%3Csvg"), "Standalone export must embed paper grain SVG filter");
  assert.ok(standalone.includes("initBeforeAfter"), "Standalone export must embed initBeforeAfter script");
  assert.ok(standalone.includes("sr-percent-badge"), "Standalone export must embed percent badge script and styles");
});

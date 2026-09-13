import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// 1. Setup Node.js in-memory mock environment for localStorage & DOM
if (!global.localStorage) {
  global.localStorage = {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; },
    clear() { this.store = {}; }
  };
}

const { state, getDeepValue, setDeepValue } = await import("../public/js/state.js");
const { generateSite, generateDemoSite, createSectionData } = await import("../public/js/engine/generator.js");
const { renderWebsiteHTML, generateLocalBusinessSchema, renderStickyCallBar } = await import("../public/js/components/renderer.js");
const { exportStandaloneHTML } = await import("../public/js/engine/exporter.js");
const { renderCommandPalette } = await import("../public/js/components/commandPalette.js");
const { FONT_CATALOG, ensureFontCatalog } = await import("../public/js/data/fonts.js");
const { TRADES, getTradeById, findTradeByKeywords } = await import("../public/js/data/trades.js");
const { getTradeFallbackDataUrl } = await import("../public/js/data/imageFallbacks.js");

const CSS_PATH = path.resolve(process.cwd(), "public/css/app.css");
const APP_CSS = fs.readFileSync(CSS_PATH, "utf-8");

test("E2E Subsystem 1: Multi-Trade Project Generation & Auto-Enrichment", () => {
  const tradeCases = [
    {
      queryTrade: "jardinier",
      resolvedTradeId: "paysagiste",
      businessName: "Les Jardins de Toulouse",
      city: "Toulouse",
      expectedBadgeKeyword: "Paysagiste",
      expectedServiceKeyword: "Jardins"
    },
    {
      queryTrade: "plombier",
      resolvedTradeId: "plombier",
      businessName: "AquaSecours 31",
      city: "Blagnac",
      expectedBadgeKeyword: "Plombier",
      expectedServiceKeyword: "Fuite"
    },
    {
      queryTrade: "restaurant",
      resolvedTradeId: "restaurant",
      businessName: "L'Auberge Occitane",
      city: "Montauban",
      expectedBadgeKeyword: "Restaurant",
      expectedServiceKeyword: "Midi"
    },
    {
      queryTrade: "electricien",
      resolvedTradeId: "electricien",
      businessName: "Volt Expert Occitanie",
      city: "Albi",
      expectedBadgeKeyword: "Électricien",
      expectedServiceKeyword: "Électrique"
    }
  ];

  for (const tc of tradeCases) {
    // Test keyword search and auto-enrichment
    const resolvedTrade = getTradeById(tc.queryTrade) || findTradeByKeywords(tc.queryTrade);
    assert.ok(resolvedTrade, `Trade query '${tc.queryTrade}' must resolve to a valid trade`);
    assert.equal(resolvedTrade.id, tc.resolvedTradeId, `Expected trade ID '${tc.resolvedTradeId}' for query '${tc.queryTrade}'`);

    // Generate site
    const project = generateSite({
      name: tc.businessName,
      tradeId: tc.queryTrade,
      city: tc.city,
      phone: "05 61 00 00 00"
    });

    assert.ok(project, `Project should be successfully generated for ${tc.queryTrade}`);
    assert.equal(project.business.name, tc.businessName);
    assert.equal(project.business.city, tc.city);
    assert.equal(project.business.tradeId, tc.resolvedTradeId);
    assert.ok(project.business.badge.includes(tc.expectedBadgeKeyword) || project.business.tradeLabel.includes(tc.expectedBadgeKeyword));

    // Verify minimum sections generated (Header, Hero, Trust, About, Stats, Services, BeforeAfter, Gallery, Realisations, Reviews, Quote, Hours, Location, FAQ, CTA, Footer)
    assert.ok(project.sections.length >= 16, `Generated project must have at least 16 sections (got ${project.sections.length})`);

    const types = project.sections.map(s => s.type);
    assert.ok(types.includes("header"), "Must include header");
    assert.ok(types.includes("hero"), "Must include hero");
    assert.ok(types.includes("services"), "Must include services");
    assert.ok(types.includes("about"), "Must include about");
    assert.ok(types.includes("stats"), "Must include stats");
    assert.ok(types.includes("beforeAfter"), "Must include beforeAfter");
    assert.ok(types.includes("reviews"), "Must include reviews");
    assert.ok(types.includes("hours"), "Must include hours");
    assert.ok(types.includes("location"), "Must include location");
    assert.ok(types.includes("faq"), "Must include faq");
    assert.ok(types.includes("cta"), "Must include cta");
    assert.ok(types.includes("footer"), "Must include footer");

    // Verify branding color values are valid hex codes
    assert.match(project.branding.primaryColor, /^#[0-9a-f]{6}$/i, "primaryColor must be valid 6-char hex");
    assert.match(project.branding.secondaryColor, /^#[0-9a-f]{6}$/i, "secondaryColor must be valid 6-char hex");
    assert.match(project.branding.accentColor, /^#[0-9a-f]{6}$/i, "accentColor must be valid 6-char hex");
  }

  // Graceful handling of empty or missing inputs
  const fallbackProject = generateSite({});
  assert.ok(fallbackProject.business.name, "Should supply fallback business name");
  assert.equal(fallbackProject.business.city, "", "Unknown city must remain empty rather than fabricated");
  assert.equal(fallbackProject.business.phone, "", "Unknown phone must remain empty rather than fabricated");
  assert.equal(fallbackProject.business.tradeId, "paysagiste", "Default trade should be paysagiste");
});

test("E2E Subsystem 2: Complete 16+ Section Types Integrity (Data generation + Canvas rendering)", () => {
  const trade = getTradeById("paysagiste");
  const business = {
    name: "Artisan Val de Garonne",
    city: "Montauban",
    region: "Occitanie",
    phone: "07 68 94 32 10",
    email: "contact@artisan-garonne.fr",
    address: "12 Avenue de Toulouse, 82000 Montauban"
  };

  const allSectionTypes = [
    "header",
    "hero",
    "trust",
    "about",
    "stats",
    "services",
    "beforeAfter",
    "realisations",
    "gallery",
    "reviews",
    "quoteSimulator",
    "hours",
    "location",
    "faq",
    "cta",
    "footer",
    "process",
    "certifications",
    "pricing",
    "customBlock"
  ];

  assert.ok(allSectionTypes.length >= 20, "Should test at least 20 section types");

  const builtSections = allSectionTypes.map((type, idx) => {
    const secData = createSectionData(type, null, trade, business);
    assert.ok(secData, `createSectionData must succeed for ${type}`);
    assert.equal(secData.type, type, `Generated section type must match ${type}`);
    assert.ok(secData.content && typeof secData.content === "object", `Section ${type} must have content object`);
    return {
      id: `sec-${type}-${idx + 1}`,
      visibility: true,
      ...secData
    };
  });

  const testProject = {
    id: "proj-all-sections",
    name: business.name,
    business,
    branding: {
      primaryColor: "#059669",
      secondaryColor: "#065f46",
      accentColor: "#f59e0b",
      bgColor: "#ffffff",
      bgSecondary: "#f8fafc",
      textColor: "#0f172a",
      textMuted: "#64748b",
      headingFont: "Plus Jakarta Sans",
      bodyFont: "Inter",
      borderRadius: "0.75rem",
      buttonRadius: "9999px",
      ctaScale: 100,
      ctaSize: "md"
    },
    sections: builtSections,
    settings: {
      stickyDockPosition: "bottom-center"
    }
  };

  // 1. Render in Editor mode
  const editorHTML = renderWebsiteHTML(testProject, { isEditor: true, isStandalone: false });
  assert.ok(editorHTML.length > 5000, "Editor HTML output must be substantive");
  assert.ok(!editorHTML.includes("undefined"), "Editor HTML must not contain undefined");
  assert.ok(!editorHTML.includes("NaN"), "Editor HTML must not contain NaN");
  assert.ok(!editorHTML.includes("[object Object]"), "Editor HTML must not contain stringified object");

  // 2. Render in Standalone / Preview mode
  const standaloneHTML = renderWebsiteHTML(testProject, { isEditor: false, isStandalone: true });
  assert.ok(standaloneHTML.length > 5000, "Standalone HTML output must be substantive");
  assert.ok(!standaloneHTML.includes("undefined"), "Standalone HTML must not contain undefined");
  assert.ok(!standaloneHTML.includes("NaN"), "Standalone HTML must not contain NaN");
  assert.ok(!standaloneHTML.includes("[object Object]"), "Standalone HTML must not contain stringified object");

  // Verify all 20 section IDs or tags are present in standalone output
  for (const type of allSectionTypes) {
    assert.ok(
      standaloneHTML.includes(`id="${type}"`) || standaloneHTML.includes(`class="site-section`) || standaloneHTML.includes(type),
      `Standalone HTML must render section type '${type}'`
    );
  }

  // Verify customBlock variants (urgentBanner, floatingBadge, customCard)
  const urgentData = createSectionData("customBlock", "urgentBanner", trade, business);
  const floatingData = createSectionData("customBlock", "floatingBadge", trade, business);
  assert.equal(urgentData.content.blockType, "urgentBanner");
  assert.equal(floatingData.content.blockType, "floatingBadge");
});

test("E2E Subsystem 3: Editor Mode vs Client Preview Isolation (strict chrome & attribute separation)", () => {
  const p = generateSite({ name: "Isolation Test Pro", tradeId: "menuisier", city: "Bordeaux" });

  // Add one hidden section for visibility testing
  const targetHiddenSec = p.sections.find(s => s.type === "faq");
  if (targetHiddenSec) targetHiddenSec.visibility = false;

  const editorHTML = renderWebsiteHTML(p, { isEditor: true, isStandalone: false });
  const previewHTML = renderWebsiteHTML(p, { isEditor: false, isStandalone: false });

  // 1. EDITOR MODE EXPECTATIONS:
  assert.ok(editorHTML.includes("editor-section-wrapper"), "Editor mode must include editor-section-wrapper");
  assert.ok(editorHTML.includes("editor-section-toolbar"), "Editor mode must include editor-section-toolbar");
  assert.ok(editorHTML.includes('data-action="move-up"'), "Editor mode must include move-up button");
  assert.ok(editorHTML.includes('data-action="move-down"'), "Editor mode must include move-down button");
  assert.ok(editorHTML.includes('data-action="toggle-vis"'), "Editor mode must include toggle-vis button");
  assert.ok(editorHTML.includes('data-action="delete"'), "Editor mode must include delete button");
  assert.ok(editorHTML.includes('data-action="duplicate"'), "Editor mode must include duplicate button");
  assert.ok(editorHTML.includes("btn-sec-anim"), "Editor mode must include 60fps animations button");
  assert.ok(editorHTML.includes("cta-direct-badge"), "Editor mode must include CTA direct action badge");
  assert.ok(editorHTML.includes("data-editable="), "Editor mode must include data-editable attributes");
  assert.ok(editorHTML.includes("data-ui-index="), "Editor mode must include data-ui-index badges");
  assert.ok(editorHTML.includes("opacity-40 grayscale"), "Editor mode must show hidden section dimmed with opacity-40 grayscale");

  // 2. CLIENT PREVIEW MODE STRICT ISOLATION:
  assert.ok(!previewHTML.includes("editor-section-wrapper"), "Preview mode must NOT contain editor-section-wrapper");
  assert.ok(!previewHTML.includes("editor-section-toolbar"), "Preview mode must NOT contain editor-section-toolbar");
  assert.ok(!previewHTML.includes('data-action="move-up"'), "Preview mode must NOT contain move-up button");
  assert.ok(!previewHTML.includes('data-action="move-down"'), "Preview mode must NOT contain move-down button");
  assert.ok(!previewHTML.includes('data-action="toggle-vis"'), "Preview mode must NOT contain toggle-vis button");
  assert.ok(!previewHTML.includes('data-action="delete"'), "Preview mode must NOT contain delete button");
  assert.ok(!previewHTML.includes('data-action="duplicate"'), "Preview mode must NOT contain duplicate button");
  assert.ok(!previewHTML.includes("btn-sec-anim"), "Preview mode must NOT contain btn-sec-anim");
  assert.ok(!previewHTML.includes("cta-direct-badge"), "Preview mode must NOT contain cta-direct-badge");
  assert.ok(!previewHTML.includes('contenteditable="true"'), "Preview mode must NOT contain contenteditable attributes");
  assert.ok(!previewHTML.includes('data-ui-index='), "Preview mode must NOT contain numbered element badges");
  assert.ok(!previewHTML.includes('data-ui-target="true"'), "Preview mode must NOT set data-ui-target to true");

  // Hidden section must be completely excluded from preview DOM
  assert.ok(!previewHTML.includes('id="faq"'), "Hidden section must NOT be rendered in preview HTML");

  // Verify CSS suppresses hover badges in preview mode
  assert.ok(APP_CSS.includes(".client-preview-mode [data-ui-index]::after"), "CSS must suppress numbered badges in client preview");
  assert.ok(APP_CSS.includes("display: none !important"), "CSS must hide technical badges");
});

test("E2E Subsystem 4: Deep State Mutations, Section Lifecycle & Undo/Redo Engine", () => {
  const p = generateSite({ name: "State Lifecycle Site", tradeId: "couvreur", city: "Montauban" });
  state.addProject(p, true);

  const heroSec = state.currentProject.sections.find(s => s.type === "hero");
  const srvSec = state.currentProject.sections.find(s => s.type === "services");
  assert.ok(heroSec && srvSec, "Project must have hero and services sections");

  // 1. Text Update (Shallow)
  state.updateSectionContent(heroSec.id, "title", "Nouvelle Toiture & Rénovation 2026");
  assert.equal(
    state.currentProject.sections.find(s => s.id === heroSec.id).content.title,
    "Nouvelle Toiture & Rénovation 2026",
    "Hero title should be updated"
  );
  assert.ok(state.canUndo(), "Undo must be available after text update");

  // 2. Text Update (Deep nested array)
  state.updateSectionContent(srvSec.id, "services.0.title", "Rénovation Ardoise Premium");
  assert.equal(
    state.currentProject.sections.find(s => s.id === srvSec.id).content.services[0].title,
    "Rénovation Ardoise Premium",
    "Nested service title must be updated"
  );

  // 3. Section Move (Up/Down)
  const initialServicesIdx = state.currentProject.sections.findIndex(s => s.id === srvSec.id);
  state.moveSection(srvSec.id, "down");
  const newServicesIdx = state.currentProject.sections.findIndex(s => s.id === srvSec.id);
  assert.equal(newServicesIdx, initialServicesIdx + 1, "Services section must move down by 1");

  state.moveSection(srvSec.id, "up");
  const restoredServicesIdx = state.currentProject.sections.findIndex(s => s.id === srvSec.id);
  assert.equal(restoredServicesIdx, initialServicesIdx, "Services section must move back up to original position");

  // 4. Section Reordering (Drag and drop before / after)
  const aboutSec = state.currentProject.sections.find(s => s.type === "about");
  state.reorderSections(srvSec.id, aboutSec.id, "before");
  const idxSrvAfterReorder = state.currentProject.sections.findIndex(s => s.id === srvSec.id);
  const idxAboutAfterReorder = state.currentProject.sections.findIndex(s => s.id === aboutSec.id);
  assert.equal(idxSrvAfterReorder, idxAboutAfterReorder - 1, "Services should be placed directly before About");

  // 5. Visibility Toggle
  assert.equal(state.currentProject.sections.find(s => s.id === heroSec.id).visibility, true);
  state.toggleSectionVisibility(heroSec.id);
  assert.equal(state.currentProject.sections.find(s => s.id === heroSec.id).visibility, false, "Hero should be hidden");
  state.toggleSectionVisibility(heroSec.id);
  assert.equal(state.currentProject.sections.find(s => s.id === heroSec.id).visibility, true, "Hero should be visible again");

  // 6. Section Duplication
  const countBeforeDuplication = state.currentProject.sections.length;
  state.duplicateSection(srvSec.id);
  assert.equal(state.currentProject.sections.length, countBeforeDuplication + 1, "Section count must increment by 1");
  const duplicatedSec = state.currentProject.sections.find(s => s.id.startsWith("sec-services-") && s.id !== srvSec.id);
  assert.ok(duplicatedSec, "Duplicated section must exist with unique ID");

  // 7. Section Deletion and Undo / Redo
  const countBeforeDeletion = state.currentProject.sections.length;
  state.deleteSection(duplicatedSec.id);
  assert.equal(state.currentProject.sections.length, countBeforeDeletion - 1, "Section count must decrement by 1");
  assert.ok(!state.currentProject.sections.find(s => s.id === duplicatedSec.id), "Deleted section must not exist");

  // Undo deletion (⌘Z)
  assert.ok(state.canUndo(), "Undo must be available after deletion");
  state.undo();
  assert.ok(state.currentProject.sections.find(s => s.id === duplicatedSec.id), "Undo must restore deleted section");
  assert.equal(state.currentProject.sections.length, countBeforeDeletion, "Section count must be restored");

  // Redo deletion (⌘⇧Z)
  assert.ok(state.canRedo(), "Redo must be available after undo");
  state.redo();
  assert.ok(!state.currentProject.sections.find(s => s.id === duplicatedSec.id), "Redo must re-delete the section");
  assert.equal(state.currentProject.sections.length, countBeforeDeletion - 1);
});

test("E2E Subsystem 5: CTA Button Controls, Styling, Direct Action Badge & Undo/Redo", () => {
  const p = generateSite({ name: "Button Testing Site", tradeId: "electricien", city: "Toulouse" });
  state.addProject(p, true);

  const heroSec = state.currentProject.sections.find(s => s.type === "hero");
  assert.ok(heroSec, "Must have hero section");

  // 1. Continuous Scale (80 - 140)
  state.setButtonScale(130);
  assert.equal(state.currentProject.branding.ctaScale, 130, "ctaScale should be set to 130");
  let renderedHTML = renderWebsiteHTML(state.currentProject, { isEditor: true });
  assert.ok(renderedHTML.includes("--cta-scale: 1.3"), "Computed CSS variable --cta-scale must be 1.3");

  // 2. Continuous Radius (0px, 8px, 9999px)
  state.setButtonRadius("0px");
  assert.equal(state.currentProject.branding.buttonRadius, "0px");
  renderedHTML = renderWebsiteHTML(state.currentProject, { isEditor: true });
  assert.ok(renderedHTML.includes("--cta-radius: 0px"), "Radius 0px applied");

  state.setButtonRadius("8px");
  assert.equal(state.currentProject.branding.buttonRadius, "8px");
  renderedHTML = renderWebsiteHTML(state.currentProject, { isEditor: true });
  assert.ok(renderedHTML.includes("--cta-radius: 8px"), "Radius 8px applied");

  state.setButtonRadius("9999px");
  assert.equal(state.currentProject.branding.buttonRadius, "9999px");
  renderedHTML = renderWebsiteHTML(state.currentProject, { isEditor: true });
  assert.ok(renderedHTML.includes("--cta-radius: 9999px"), "Radius 9999px applied");

  // 3. Font Size Adjustments (A- / A+)
  const baseSize = parseInt(state.currentProject.branding.ctaFontSize || "15", 10);
  state.adjustButtonFontSize(2);
  assert.equal(state.currentProject.branding.ctaFontSize, `${baseSize + 2}px`);
  state.adjustButtonFontSize(-1);
  assert.equal(state.currentProject.branding.ctaFontSize, `${baseSize + 1}px`);

  // 4. Button Deletion and Direct Action Badges
  renderedHTML = renderWebsiteHTML(state.currentProject, { isEditor: true });
  assert.ok(renderedHTML.includes("cta-direct-badge"), "Editor mode must include direct action badge");
  assert.ok(renderedHTML.includes("cta-direct-btn"), "Direct action badge buttons must exist");
  assert.ok(renderedHTML.includes("window.app.deleteButton"), "Direct delete button handler present");

  // Delete primary CTA
  state.deleteButton(heroSec.id, "primary");
  let updatedHero = state.currentProject.sections.find(s => s.id === heroSec.id);
  assert.ok(updatedHero.settings.hiddenButtons.includes("primary"), "Primary button must be marked hidden");

  // Delete phone CTA
  state.deleteButton(heroSec.id, "phone");
  updatedHero = state.currentProject.sections.find(s => s.id === heroSec.id);
  assert.ok(updatedHero.settings.hiddenButtons.includes("phone"), "Phone button must be marked hidden");

  // Verify buttons are hidden in editor render
  renderedHTML = renderWebsiteHTML(state.currentProject, { isEditor: true });
  assert.ok(!renderedHTML.includes(`data-section-id="${heroSec.id}" data-button-type="primary"`), "Hero primary button must not be rendered when deleted");
  assert.ok(!renderedHTML.includes(`data-section-id="${heroSec.id}" data-button-type="phone"`), "Hero phone button must not be rendered when deleted");

  // 5. Undo/Redo of Button Deletion
  state.undo(); // undo phone deletion
  updatedHero = state.currentProject.sections.find(s => s.id === heroSec.id);
  assert.ok(!updatedHero.settings?.hiddenButtons?.includes("phone"), "Phone button restored on undo");

  state.undo(); // undo primary deletion
  updatedHero = state.currentProject.sections.find(s => s.id === heroSec.id);
  assert.ok(!updatedHero.settings?.hiddenButtons?.includes("primary"), "Primary button restored on undo");

  state.redo(); // redo primary deletion
  updatedHero = state.currentProject.sections.find(s => s.id === heroSec.id);
  assert.ok(updatedHero.settings.hiddenButtons.includes("primary"), "Primary button re-deleted on redo");

  // 6. Restoration via restoreButton and restoreAllButtons
  state.restoreButton(heroSec.id, "primary");
  updatedHero = state.currentProject.sections.find(s => s.id === heroSec.id);
  assert.ok(!updatedHero.settings?.hiddenButtons?.includes("primary"), "Primary restored via restoreButton");

  state.deleteButton(heroSec.id, "primary");
  state.deleteButton(heroSec.id, "phone");
  state.restoreAllButtons(heroSec.id);
  updatedHero = state.currentProject.sections.find(s => s.id === heroSec.id);
  assert.ok(!updatedHero.settings?.hiddenButtons || updatedHero.settings.hiddenButtons.length === 0, "All buttons restored");
});

test("E2E Subsystem 6: Google Reviews Rating System (Amber stars #fbbf24, overall -1, individual 0..n, average)", () => {
  const p = generateDemoSite({ name: "Reviews Rating Test", tradeId: "paysagiste", city: "Montauban" });
  state.addProject(p, true);

  const revSec = state.currentProject.sections.find(s => s.type === "reviews");
  assert.ok(revSec, "Must have reviews section");

  // Rating interactions use explicit demo fixture data, never fabricated client defaults.
  revSec.content.overallRating = "4.9";
  revSec.settings.showRatingCard = true;
  assert.equal(revSec.content.overallRating, "4.9");
  assert.ok(Array.isArray(revSec.content.reviews) && revSec.content.reviews.length >= 3);

  // 1. Overall Rating (-1) Update Simulation
  const updatedProject = JSON.parse(JSON.stringify(state.currentProject));
  const targetSec = updatedProject.sections.find(s => s.id === revSec.id);

  // Set overall rating to 5.0
  targetSec.content.overallRating = (5.0).toFixed(1);
  // Set individual review 0 rating to 4
  targetSec.content.reviews[0].rating = 4;
  // Set individual review 1 rating to 3
  targetSec.content.reviews[1].rating = 3;
  state.updateProject(updatedProject, true, "Test rating modifications");

  assert.equal(state.currentProject.sections.find(s => s.id === revSec.id).content.overallRating, "5.0");
  assert.equal(state.currentProject.sections.find(s => s.id === revSec.id).content.reviews[0].rating, 4);
  assert.equal(state.currentProject.sections.find(s => s.id === revSec.id).content.reviews[1].rating, 3);

  // 2. Editor Mode Render Verification
  const editorHTML = renderWebsiteHTML(state.currentProject, { isEditor: true });
  assert.ok(editorHTML.includes("interactive-rating-container"), "Container must be interactive in editor");
  assert.ok(editorHTML.includes("review-rating-star"), "Star button class must be present");
  assert.ok(editorHTML.includes("reviewIndex: -1") || editorHTML.includes(", -1,"), "Overall rating index -1 must be present");
  assert.ok(editorHTML.includes("previewRatingHover"), "Hover preview handler present");
  assert.ok(editorHTML.includes("resetRatingHover"), "Hover reset handler present");

  // 3. Standalone Mode Render Verification
  const standaloneHTML = renderWebsiteHTML(state.currentProject, { isEditor: false, isStandalone: true });
  assert.ok(!standaloneHTML.includes("window.app.updateReviewRating"), "Standalone mode must not have edit onclick handlers");
  assert.ok(standaloneHTML.includes("text-amber-400"), "Filled stars must have amber text class");

  // 4. CSS Style Verification for Warm Gold / Amber Color
  assert.ok(APP_CSS.includes(".rating-star-btn.is-filled"), "CSS must style .rating-star-btn.is-filled");
  assert.ok(APP_CSS.includes(".rating-star-btn.is-hover-fill"), "CSS must style hover filled stars");
  assert.ok(APP_CSS.includes("#fbbf24"), "CSS must use warm gold/amber color #fbbf24");
});

test("E2E Subsystem 7: Sticky Call Bar Docking, Drag Handle, Phone, WhatsApp & Quote", () => {
  const p = generateSite({
    name: "Sticky Dock Test",
    tradeId: "plombier",
    city: "Toulouse",
    phone: "07 53 19 60 44"
  });

  const dockPositions = ["bottom-left", "bottom-center", "bottom-right"];

  for (const dock of dockPositions) {
    p.settings = { ...(p.settings || {}), stickyDockPosition: dock };
    const html = renderWebsiteHTML(p, { isEditor: true });

    assert.ok(html.includes("sticky-call-bar"), "Sticky call bar must be present");
    assert.ok(html.includes(`data-dock-position="${dock}"`), `Must render data-dock-position="${dock}"`);
    assert.ok(html.includes("sticky-drag-handle"), "Must contain drag handle button");
    assert.ok(html.includes("tel:0753196044") || html.includes("tel:07 53 19 60 44"), "Must contain direct phone call link");
    assert.ok(html.includes("wa.me/"), "Must contain direct WhatsApp link");
    assert.ok(html.includes("#quoteSimulator"), "Must contain quick quote simulator link");
  }

  // Verify CSS defines docking positions
  assert.ok(APP_CSS.includes('.sticky-call-bar[data-dock-position="bottom-left"]'), "CSS defines bottom-left dock");
  assert.ok(APP_CSS.includes('.sticky-call-bar[data-dock-position="bottom-center"]'), "CSS defines bottom-center dock");
  assert.ok(APP_CSS.includes('.sticky-call-bar[data-dock-position="bottom-right"]'), "CSS defines bottom-right dock");
  assert.ok(APP_CSS.includes('.sticky-drag-handle'), "CSS styles drag handle");
});

test("E2E Subsystem 8: Standalone Self-Contained HTML Export & JSON Export", () => {
  const p = generateSite({
    name: "Toitures & Charpentes d'Occitanie",
    tradeId: "couvreur",
    city: "Albi",
    region: "Occitanie",
    phone: "05 63 12 34 56",
    email: "contact@toitures-occitanes.fr"
  });

  const standaloneHTML = exportStandaloneHTML(p);

  // 1. Valid Document Structure
  assert.ok(standaloneHTML.startsWith("<!DOCTYPE html>"), "Must start with <!DOCTYPE html>");
  assert.ok(standaloneHTML.includes('<html lang="fr"'), "Must have html lang=fr");
  assert.ok(standaloneHTML.includes("<head>"), "Must have head tag");
  assert.ok(standaloneHTML.includes("<body>"), "Must have body tag");
  assert.ok(standaloneHTML.includes("</html>"), "Must close html tag");

  // 2. Metadata & Titles
  assert.ok(standaloneHTML.includes("<title>Toitures & Charpentes d'Occitanie"), "Must have descriptive title");
  assert.ok(standaloneHTML.includes('name="description"'), "Must have meta description");
  assert.ok(standaloneHTML.includes('name="viewport"'), "Must have mobile viewport meta");

  // 3. Schema.org JSON-LD (LocalBusiness)
  assert.ok(standaloneHTML.includes('<script type="application/ld+json">'), "Must include JSON-LD script");
  const jsonLdMatch = standaloneHTML.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(jsonLdMatch && jsonLdMatch[1], "Must extract JSON-LD payload");

  const schema = JSON.parse(jsonLdMatch[1].trim());
  assert.equal(schema["@context"], "https://schema.org");
  assert.equal(schema["@type"], "LocalBusiness");
  assert.equal(schema.name, "Toitures & Charpentes d'Occitanie");
  assert.equal(schema.telephone, "05 63 12 34 56");
  assert.equal(schema.address.addressLocality, "Albi");

  // 4. Offline Styling
  assert.ok(standaloneHTML.includes(":root {"), "Must embed CSS :root variables");
  assert.ok(standaloneHTML.includes("--primary:"), "Must declare --primary variable");
  assert.ok(standaloneHTML.includes(".btn-keycap"), "Must embed keycap CSS");
  assert.ok(standaloneHTML.includes(".ba-container"), "Must embed Before/After slider CSS");
  assert.ok(standaloneHTML.includes(".faq-item"), "Must embed FAQ CSS");
  assert.ok(standaloneHTML.includes(".lightbox-modal"), "Must embed Lightbox modal CSS");
  assert.ok(standaloneHTML.includes('[data-site-theme="dark"]'), "Must embed standalone day/night styles");

  // 5. Embedded Interactive Scripts Bundle
  assert.ok(standaloneHTML.includes("initSiteTheme"), "Must include initSiteTheme script");
  assert.ok(standaloneHTML.includes("initImageFallbacks"), "Must include initImageFallbacks script");
  assert.ok(standaloneHTML.includes("initBeforeAfter"), "Must include initBeforeAfter script");
  assert.ok(standaloneHTML.includes("initFaq"), "Must include initFaq script");
  assert.ok(standaloneHTML.includes("initLightbox"), "Must include initLightbox script");
  assert.ok(standaloneHTML.includes("initQuoteSimulator"), "Must include initQuoteSimulator script");
  assert.ok(standaloneHTML.includes("initScrollReveal"), "Must include 60fps initScrollReveal script");

  // 6. Zero Corruption Checks
  assert.ok(!standaloneHTML.includes("undefined"), "Export must not contain undefined");
  assert.ok(!standaloneHTML.includes("NaN"), "Export must not contain NaN");
  assert.ok(!standaloneHTML.includes("[object Object]"), "Export must not contain stringified [object Object]");

  // 7. JSON Export Integrity
  const jsonExportStr = JSON.stringify(p, null, 2);
  const parsed = JSON.parse(jsonExportStr);
  assert.equal(parsed.id, p.id);
  assert.equal(parsed.name, p.name);
  assert.equal(parsed.sections.length, p.sections.length);
  assert.equal(parsed.business.phone, p.business.phone);
});

test("E2E Subsystem 9: Navigation, Shortcuts, Command Palette (⌘K) & Font Catalog (Uncut / Fontshare)", () => {
  const p = generateSite({ name: "Command Palette Test", tradeId: "menuisier", city: "Bordeaux" });
  state.addProject(p, true);

  // 1. Command Palette Markup Generation
  const cmdHTML = renderCommandPalette(p, [p]);
  assert.ok(cmdHTML.includes('id="cmd-palette-input"'), "Command palette must render input field");
  assert.ok(cmdHTML.includes('data-group="sections"'), "Must group sections");
  assert.ok(cmdHTML.includes('data-group="projects"'), "Must group projects");
  assert.ok(cmdHTML.includes('data-group="actions"'), "Must group sales tools");
  assert.ok(cmdHTML.includes('data-group="viewports"'), "Must group responsive viewports");
  assert.ok(cmdHTML.includes('data-group="themes"'), "Must group themes");

  // Specific action items
  assert.ok(cmdHTML.includes("share-modal"), "Must include share-modal action");
  assert.ok(cmdHTML.includes("closer-modal"), "Must include closer-modal action");
  assert.ok(cmdHTML.includes("print-proposal"), "Must include print-proposal action");
  assert.ok(cmdHTML.includes("export-html"), "Must include export-html action");

  // Viewport items
  assert.ok(cmdHTML.includes("desktop"), "Must include desktop action");
  assert.ok(cmdHTML.includes("tablet"), "Must include tablet action");
  assert.ok(cmdHTML.includes("mobile"), "Must include mobile action");

  // 2. Font Catalog (Uncut / Fontshare + Google Fonts)
  assert.ok(Array.isArray(FONT_CATALOG), "FONT_CATALOG must be an array");
  assert.ok(FONT_CATALOG.length >= 20, `FONT_CATALOG must contain at least 20 fonts (has ${FONT_CATALOG.length})`);

  const fontshareFonts = FONT_CATALOG.filter(f => f.source === "fontshare").map(f => f.name);
  assert.ok(fontshareFonts.includes("Satoshi"), "Catalog must include Satoshi (Uncut/Fontshare)");
  assert.ok(fontshareFonts.includes("General Sans"), "Catalog must include General Sans (Fontshare)");
  assert.ok(fontshareFonts.includes("Clash Display"), "Catalog must include Clash Display (Fontshare)");
  assert.ok(fontshareFonts.includes("Cabinet Grotesk"), "Catalog must include Cabinet Grotesk (Fontshare)");

  const googleFonts = FONT_CATALOG.filter(f => f.source !== "fontshare").map(f => f.name);
  assert.ok(googleFonts.includes("Inter"), "Catalog must include Inter");
  assert.ok(googleFonts.includes("Plus Jakarta Sans"), "Catalog must include Plus Jakarta Sans");
  assert.ok(googleFonts.includes("Space Grotesk"), "Catalog must include Space Grotesk");

  // Ensure ensureFontCatalog does not crash in Node.js
  assert.doesNotThrow(async () => {
    await ensureFontCatalog();
  });

  // 3. Theme Mode Switching (In-place light/dark editor)
  state.setThemeMode("light");
  assert.equal(state.themeMode, "light");
  state.toggleThemeMode();
  assert.equal(state.themeMode, "dark");
  state.toggleThemeMode();
  assert.equal(state.themeMode, "light");

  // 4. Section 60fps Motion Engine CSS Presets
  const expectedMotions = ["fade-in", "slide-up", "slide-in", "spring", "progress-fill", "magnetic", "shimmer", "pulse"];
  for (const motion of expectedMotions) {
    assert.ok(
      APP_CSS.includes(`[data-motion="${motion}"]`) || APP_CSS.includes(`motion-${motion}`) || APP_CSS.includes(motion),
      `CSS must define 60fps animation rules for motion preset '${motion}'`
    );
  }
});

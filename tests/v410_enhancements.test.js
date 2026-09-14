import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { state } from "../public/js/state.js";
import { generateSite } from "../public/js/engine/generator.js";
import { renderWebsiteHTML } from "../public/js/components/renderer.js";
import { renderEditor } from "../public/js/components/editor.js";
import { FONT_CATALOG } from "../public/js/data/fonts.js";

test("v4.1.0 Enhancements: Google Reviews 5-star rating uses filled amber stars and supports overall rating editing", () => {
  const p = generateSite({ name: "Jardin Pro", tradeId: "paysagiste", city: "Toulouse" });
  state.addProject(p, true);

  const editorHTML = renderWebsiteHTML(p, { isEditor: true });
  assert.ok(editorHTML.includes("interactive-rating-container"), "HTML must contain interactive-rating-container");
  assert.ok(editorHTML.includes("rating-star-btn"), "Editor mode must include rating-star-btn");
  assert.ok(editorHTML.includes("window.app.updateReviewRating"), "Rating buttons must call updateReviewRating");
  assert.ok(editorHTML.includes("previewRatingHover"), "Rating buttons must include previewRatingHover");
  assert.ok(editorHTML.includes("resetRatingHover"), "Rating buttons must include resetRatingHover");

  // Overall rating (-1) must be present in HTML
  assert.ok(editorHTML.includes("reviewIndex: -1") || editorHTML.includes(", -1,"), "Editor mode must render overall rating with reviewIndex -1");

  // Verify CSS defines gold/amber star styling
  const cssPath = path.resolve(process.cwd(), "public/css/app.css");
  const css = fs.readFileSync(cssPath, "utf-8");
  assert.ok(css.includes(".rating-star-btn.is-filled"), "CSS must style filled rating stars");
  assert.ok(css.includes("#fbbf24"), "CSS must use warm gold/amber color #fbbf24");
});

test("v4.1.0 Enhancements: Sequential numbered element badges (#1, #2, #3...) with S, M, L keycaps", () => {
  const p = generateSite({ name: "Maçonnerie Moderne", tradeId: "macon", city: "Bordeaux" });
  state.addProject(p, true);

  const editorHTML = renderWebsiteHTML(p, { isEditor: true });
  assert.ok(editorHTML.includes('data-ui-index="1"'), "Editor HTML must contain data-ui-index=\"1\"");
  assert.ok(editorHTML.includes('data-ui-index="2"'), "Editor HTML must contain data-ui-index=\"2\"");
  assert.ok(editorHTML.includes('data-ui-index-size="l"') || editorHTML.includes('data-ui-index-size="m"'), "Editor HTML must contain sizing attributes");

  // Standalone/preview mode must NOT display hover badges
  const cssPath = path.resolve(process.cwd(), "public/css/app.css");
  const css = fs.readFileSync(cssPath, "utf-8");
  assert.ok(css.includes(".editor-section-wrapper [data-ui-index]:hover::after"), "CSS must show badge on hover in editor wrapper");
  assert.ok(css.includes('content: "#" attr(data-ui-code)'), "Stable UI reference must be shown instead of relying only on sequential numbering");
  assert.ok(css.includes('right: calc(100% + 6px)'), "Stable reference must sit outside editable text bounds");
  assert.ok(css.includes('.client-preview-mode [data-ui-index]::after'), "CSS must suppress badges in client preview mode");
});

test("v4.1.0 Enhancements: Sticky Call Bar supports positionable dock attributes", () => {
  const p = generateSite({ name: "Plomberie Express", tradeId: "plombier", city: "Paris" });
  p.settings = { ...(p.settings || {}), stickyDockPosition: "bottom-left" };
  state.addProject(p, true);

  const html = renderWebsiteHTML(p, { isEditor: true });
  assert.ok(html.includes('data-dock-position="bottom-left"'), "Sticky bar must render data-dock-position=\"bottom-left\"");

  // Verify CSS defines dock positions
  const cssPath = path.resolve(process.cwd(), "public/css/app.css");
  const css = fs.readFileSync(cssPath, "utf-8");
  assert.ok(css.includes('[data-dock-position="bottom-left"]'), "CSS must define bottom-left dock");
  assert.ok(css.includes('[data-dock-position="bottom-right"]'), "CSS must define bottom-right dock");
  assert.ok(css.includes('[data-dock-position="bottom-center"]'), "CSS must define bottom-center dock");
});

test("v4.1.0 Enhancements: 60fps animations toolbar button and popover", () => {
  const p = generateSite({ name: "Élec Pro", tradeId: "electricien", city: "Lyon" });
  state.addProject(p, true);

  const editorHTML = renderWebsiteHTML(p, { isEditor: true });
  assert.ok(editorHTML.includes('btn-sec-anim'), "Canvas toolbar must render btn-sec-anim");
  assert.ok(editorHTML.includes('sec-motion-popover'), "Canvas toolbar must render sec-motion-popover");
  assert.ok(editorHTML.includes('window.app.setSectionMotion'), "Popover must contain window.app.setSectionMotion");

  const cssPath = path.resolve(process.cwd(), "public/css/app.css");
  const css = fs.readFileSync(cssPath, "utf-8");
  assert.ok(css.includes(".sec-motion-popover"), "CSS must style .sec-motion-popover");
  assert.ok(css.includes(".motion-chip"), "CSS must style .motion-chip");
  assert.ok(css.includes('[data-motion="magnetic"]'), "CSS must define magnetic 60fps animation");
});

test("v4.1.0 Enhancements: Studio Assistant IA launcher pill with online status dot", () => {
  const editorFullHTML = renderEditor(state);
  assert.ok(editorFullHTML.includes("ai-launcher-pill"), "Editor must render ai-launcher-pill");
  assert.ok(editorFullHTML.includes("ai-status-dot"), "Editor must render ai-status-dot");
  assert.ok(editorFullHTML.includes("Studio Assistant IA"), "Editor must render title 'Studio Assistant IA'");
});

test("v4.1.0 Enhancements: Typography catalog includes Uncut / Fontshare fonts with no escaped URL errors", () => {
  const satoshi = FONT_CATALOG.find(f => f.name === "Satoshi");
  const generalSans = FONT_CATALOG.find(f => f.name === "General Sans");
  const clashDisplay = FONT_CATALOG.find(f => f.name === "Clash Display");
  const cabinetGrotesk = FONT_CATALOG.find(f => f.name === "Cabinet Grotesk");

  assert.ok(satoshi, "Font catalog must include Satoshi");
  assert.ok(generalSans, "Font catalog must include General Sans");
  assert.ok(clashDisplay, "Font catalog must include Clash Display");
  assert.ok(cabinetGrotesk, "Font catalog must include Cabinet Grotesk");

  // Verify index.html preconnects and loads Fontshare CDN
  const indexPath = path.resolve(process.cwd(), "public/index.html");
  const indexHtml = fs.readFileSync(indexPath, "utf-8");
  assert.ok(indexHtml.includes("api.fontshare.com"), "index.html must link to api.fontshare.com");
  assert.ok(indexHtml.includes("fonts.googleapis.com"), "index.html must link to Google Fonts");
});

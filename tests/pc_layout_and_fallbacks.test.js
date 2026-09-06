import test from "node:test";
import assert from "node:assert/strict";
import { TRADES } from "../public/js/data/trades.js";
import { TRADE_PALETTES, getTradeFallbackDataUrl } from "../public/js/data/imageFallbacks.js";
import { generateSite } from "../public/js/engine/generator.js";
import { renderWebsiteHTML } from "../public/js/components/renderer.js";

// Mock minimal localStorage if not present
if (!global.localStorage) {
  global.localStorage = {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; }
  };
}

const { state } = await import("../public/js/state.js");

test("Image Fallbacks: All 12 trades have distinct vector SVG fallback palettes", () => {
  for (const trade of TRADES) {
    const palette = TRADE_PALETTES[trade.id];
    assert.ok(palette, `Trade ${trade.id} should have a defined TRADE_PALETTES entry`);
    assert.ok(palette.title, `Trade ${trade.id} must have a title`);
    assert.ok(palette.sub, `Trade ${trade.id} must have a subtitle`);
    assert.ok(palette.gradStart && palette.gradEnd, `Trade ${trade.id} must have gradient bounds`);
    assert.ok(palette.accent, `Trade ${trade.id} must have accent color`);
    assert.ok(palette.icon && palette.icon.length > 10, `Trade ${trade.id} must have an SVG icon`);
  }
});

test("Image Fallbacks: getTradeFallbackDataUrl returns valid SVG data URI with safe XML escaping", () => {
  const dataUrl = getTradeFallbackDataUrl("paysagiste", "hero", "Création & Design <Pro> & \"Luxe\"");
  assert.ok(dataUrl.startsWith("data:image/svg+xml;utf8,"), "Must be an SVG data URI");
  
  const decoded = decodeURIComponent(dataUrl.replace("data:image/svg+xml;utf8,", ""));
  assert.ok(decoded.includes("<svg"), "Must contain SVG opening tag");
  assert.ok(decoded.includes("</svg>"), "Must contain SVG closing tag");
  assert.ok(decoded.includes("Création &amp; Design &lt;Pro&gt; &amp; &quot;Luxe&quot;"), "XML characters must be safely escaped");
  assert.ok(decoded.includes("linearGradient"), "Must include linear gradient definitions");
  
  // Test fallback for non-existent trade
  const unknownFallback = getTradeFallbackDataUrl("unknown_trade_xyz", "gallery");
  assert.ok(unknownFallback.startsWith("data:image/svg+xml;utf8,"), "Must gracefully fall back for unknown trades");
});

test("State Manager: handles editorMode and themeMode toggling with pub/sub", () => {
  let lastMode = null;
  let lastTheme = null;

  const unsubMode = state.subscribe("editor_mode_change", (s) => {
    lastMode = s.editorMode;
  });
  const unsubTheme = state.subscribe("theme_mode_change", (s) => {
    lastTheme = s.themeMode;
  });

  // Editor mode toggling
  state.setEditorMode("preview");
  assert.equal(state.editorMode, "preview");
  assert.equal(lastMode, "preview");

  state.setEditorMode("conception");
  assert.equal(state.editorMode, "conception");
  assert.equal(lastMode, "conception");

  // Theme mode toggling
  state.setThemeMode("dark");
  assert.equal(state.themeMode, "dark");
  assert.equal(lastTheme, "dark");

  const toggled = state.toggleThemeMode();
  assert.equal(toggled, "light");
  assert.equal(state.themeMode, "light");
  assert.equal(lastTheme, "light");

  unsubMode();
  unsubTheme();
});

test("PC Layout & Renderer: Injects SVG onerror fallbacks and mechanical keycap controls", () => {
  const site = generateSite({
    name: "Esprit Nature",
    tradeId: "paysagiste",
    city: "Montauban",
    phone: "05 63 00 11 22"
  });

  // 1. Editor mode render
  const editorHTML = renderWebsiteHTML(site, { isEditor: true, isStandalone: false });
  
  // Must have onerror SVG fallback injected on editable images
  assert.ok(editorHTML.includes("onerror=\"if(!this.dataset.fallbackApplied)") && editorHTML.includes("data:image/svg+xml"), "Images must have standalone vector SVG fallback injected");
  
  // Floating action toolbar must have tactile keycap styling
  assert.ok(editorHTML.includes("editor-section-toolbar"), "Editor must have floating section toolbar");
  assert.ok(editorHTML.includes("btn-keycap"), "Toolbar must use mechanical tactile keycaps");
  assert.ok(editorHTML.includes("data-action=\"move-up\""), "Toolbar must retain move-up action");
  assert.ok(editorHTML.includes("data-action=\"move-down\""), "Toolbar must retain move-down action");
  assert.ok(editorHTML.includes("data-action=\"delete\""), "Toolbar must retain delete action");
  
  // Inline contextual CTA controls
  assert.ok(editorHTML.includes("cta-button-wrapper"), "Hero CTAs must have contextual button wrapper");
  assert.ok(editorHTML.includes("cta-context-popover"), "Hero CTAs must have size/pulse contextual popover");
  assert.ok(editorHTML.includes("data-cta-size=\"sm\""), "Must contain Small size toggle");
  assert.ok(editorHTML.includes("data-cta-size=\"xl\""), "Must contain XL size toggle");

  // 2. Client Preview mode render (when isEditor: false)
  const clientHTML = renderWebsiteHTML(site, { isEditor: false, isStandalone: false });
  assert.ok(!clientHTML.includes("editor-section-toolbar"), "Preview mode must strip floating action bar");
  assert.ok(!clientHTML.includes("cta-context-popover"), "Preview mode must strip inline CTA popover controls");
  assert.ok(clientHTML.includes("Esprit Nature"), "Client preview must retain business content");
});

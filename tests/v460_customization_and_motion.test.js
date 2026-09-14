import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateSite } from "../public/js/engine/generator.js";
import { state } from "../public/js/state.js";
import { renderWebsiteHTML } from "../public/js/components/renderer.js";
import { exportStandaloneHTML } from "../public/js/engine/exporter.js";
import { renderEditor } from "../public/js/components/editor.js";
import { renderDashboard } from "../public/js/components/dashboard.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("v4.6.0: Quick-Gen Bar flex layout prevents input squashing and offers instant presets", () => {
  state.currentView = "dashboard";
  const dashboardHTML = renderDashboard(state);

  // Must render the resilient .quick-gen-bar flex container
  assert.ok(dashboardHTML.includes("quick-gen-bar"), "Dashboard must include .quick-gen-bar layout container");
  assert.ok(dashboardHTML.includes('id="quick-gen-name"'), "Must include dedicated #quick-gen-name input");
  assert.ok(dashboardHTML.includes('id="quick-gen-trade"'), "Must include dedicated #quick-gen-trade select");
  assert.ok(dashboardHTML.includes('id="quick-gen-city"'), "Must include dedicated #quick-gen-city input");

  // CSS must enforce min-width and flex properties to avoid 0px collapse
  const cssPath = path.resolve(process.cwd(), "public/css/app.css");
  const css = fs.readFileSync(cssPath, "utf-8");
  assert.ok(css.includes(".quick-gen-bar"), "CSS must define .quick-gen-bar");
  assert.ok(css.includes("min-width: 200px !important;"), "CSS must enforce min-width: 200px to prevent input squashing");
});

test("v4.6.0: Location section renders crisp, unblurred Google Maps with compact route overlay", () => {
  const p = generateSite({ name: "Atelier Peinture", tradeId: "peintre", city: "Paris" });
  state.currentProject = p;
  const html = renderWebsiteHTML(p, { isEditor: false });

  // Verify location section exists and has .map-clean-overlay
  assert.ok(html.includes("map-clean-overlay"), "Must render compact .map-clean-overlay");
  assert.ok(html.includes("maps.google.com/maps"), "Must embed Google Maps iframe");

  // Must not obscure the whole map with full-card backdrop blur
  assert.ok(!html.includes("backdrop-blur-md p-8 rounded-3xl max-w-md w-full shadow-2xl"), "Must not blur out the map with giant frosted overlay");

  const cssPath = path.resolve(process.cwd(), "public/css/app.css");
  const css = fs.readFileSync(cssPath, "utf-8");
  assert.ok(css.includes(".map-clean-overlay"), "CSS must define .map-clean-overlay");
});

test("v4.6.0: In-toolbar text color studio serializes color and applies inline style", () => {
  const p = generateSite({ name: "Esprit Nature", tradeId: "paysagiste", city: "Toulouse" });
  state.currentProject = JSON.parse(JSON.stringify(p));

  // Set custom color on hero title
  const heroSec = state.currentProject.sections.find(s => s.type === "hero");
  if (!heroSec.settings) heroSec.settings = {};
  heroSec.settings.color_title = "#10b981";

  const editorHTML = renderWebsiteHTML(state.currentProject, { isEditor: true });
  assert.ok(editorHTML.includes("color: #10b981"), "Hero title must serialize custom text color in style attribute");

  // Editor floating toolbar must contain #ftb-color-menu
  state.currentView = "editor";
  const editorShell = renderEditor(state);
  assert.ok(editorShell.includes("ftb-color-menu"), "Floating text toolbar must provide #ftb-color-menu color picker");
  assert.ok(editorShell.includes("ftb-color-indicator"), "Floating text toolbar must provide color preview indicator");
});

test("v4.6.0: Dynamic Stepper block adapts grid columns and provides step add/remove controls in editor", () => {
  const p = generateSite({ name: "Rénov Express", tradeId: "plombier", city: "Bordeaux" });
  
  // Add stepper section if not present or create one
  let stepperSec = p.sections.find(s => s.type === "stepper" || s.type === "process");
  if (!stepperSec) {
    stepperSec = {
      id: "sec_test_stepper",
      type: "stepper",
      title: "Notre Démarche",
      steps: [
        { num: 1, title: "Diagnostic", desc: "Évaluation initiale" },
        { num: 2, title: "Devis", desc: "Proposition claire" },
        { num: 3, title: "Travaux", desc: "Réalisation soignée" }
      ]
    };
    p.sections.push(stepperSec);
  }

  const editorHTML = renderWebsiteHTML(p, { isEditor: true });
  assert.ok(editorHTML.includes("stepper-cols-3") || editorHTML.includes("grid-cols-3") || editorHTML.includes("addStepperStep"), "Must adapt columns and offer step management");
  assert.ok(editorHTML.includes("addStepperStep"), "Must render + Ajouter une étape button in editor mode");

  // Preview mode should NOT render edit buttons
  const previewHTML = renderWebsiteHTML(p, { isEditor: false });
  assert.ok(!previewHTML.includes("addStepperStep"), "Preview mode must not render addStepperStep controls");
});

test("v4.6.0: Section background studio popover and auto-contrast CSS protection", () => {
  const p = generateSite({ name: "Artisan Plafond", tradeId: "peintre", city: "Lyon" });
  state.currentProject = p;
  const editorHTML = renderWebsiteHTML(p, { isEditor: true });

  // Section toolbar should offer background color popover trigger
  assert.ok(editorHTML.includes("toggleSectionBgMenu"), "Section controls must include background studio popover trigger");
  assert.ok(editorHTML.includes("sec-bg-popover"), "Section markup must embed .sec-bg-popover");

  // Auto-contrast CSS rules must protect white, mineral, and warm backgrounds
  const cssPath = path.resolve(process.cwd(), "public/css/app.css");
  const css = fs.readFileSync(cssPath, "utf-8");
  assert.ok(css.includes('[data-section-bg="white"]'), "CSS must include contrast cascade for white backgrounds");
  assert.ok(css.includes('[data-section-bg="mineral"]'), "CSS must include contrast cascade for mineral backgrounds");
  assert.ok(css.includes('[data-section-bg="warm"]'), "CSS must include contrast cascade for warm backgrounds");
});

test("v4.8.0: Section backgrounds survive public render and standalone export", () => {
  const p = generateSite({ name: "Fond Export", tradeId: "peintre", city: "Lyon" });
  const target = p.sections.find(section => section.type === "services") || p.sections[1];
  target.settings = { ...(target.settings || {}), bgTheme: "custom", customBackground: "#112233" };

  const publicHTML = renderWebsiteHTML(p, { isEditor: false });
  const exportedHTML = exportStandaloneHTML(p);

  assert.ok(publicHTML.includes('data-has-custom-bg="true"'), "Public section must mark an active custom background");
  assert.ok(publicHTML.includes('background-color: #112233 !important'), "Public section must carry the chosen custom color");
  assert.ok(exportedHTML.includes('.site-section[data-section-bg] > :first-child'), "Standalone CSS must expose the section surface instead of an opaque inner wrapper");
  assert.ok(exportedHTML.includes('.bg-sec-dark { background-color: #09090b !important;'), "Standalone CSS must ship section theme colors");
});

test("v4.8.0: Heading and body typography remain independent through render and export", () => {
  const p = generateSite({ name: "Typo Export", tradeId: "peintre", city: "Lyon" });
  p.branding.headingFont = "Playfair Display";
  p.branding.bodyFont = "Manrope";

  const publicHTML = renderWebsiteHTML(p, { isEditor: false });
  const exportedHTML = exportStandaloneHTML(p);
  const appSource = fs.readFileSync(path.resolve(process.cwd(), "public/js/app.js"), "utf-8");

  assert.ok(publicHTML.includes("--font-heading: 'Playfair Display'"), "Preview must use the chosen heading font");
  assert.ok(publicHTML.includes("--font-body: 'Manrope'"), "Preview must use the chosen body font");
  assert.ok(exportedHTML.includes("--font-heading: 'Playfair Display'"), "Export must preserve the heading font");
  assert.ok(exportedHTML.includes("--font-body: 'Manrope'"), "Export must preserve the body font");
  assert.match(appSource, /state\.updateProject\(updated, true, `Typographie :/, "Typography commits must go through Undo-aware project state");
});

test("v4.8.0: Global CTA radius overrides hard-coded rounded utilities in preview and export", () => {
  const p = generateSite({ name: "Radius Export", tradeId: "paysagiste", city: "Montauban" });
  p.branding.buttonRadius = "0px";
  const publicHTML = renderWebsiteHTML(p, { isEditor: false });
  const exportedHTML = exportStandaloneHTML(p);

  assert.ok(publicHTML.includes("--cta-radius: 0px"), "Preview must expose the chosen button radius");
  assert.ok(publicHTML.includes("btn-cta inline-flex items-center gap-2.5"), "About conversion CTA must participate in global radius styling");
  assert.ok(exportedHTML.includes("--cta-radius: 0px"), "Export must preserve the chosen button radius");
  assert.ok(exportedHTML.includes(".btn-cta, [data-cta-button] { border-radius: var(--cta-radius"), "Export CSS must override rounded utility classes for CTAs");
});

test("v4.6.0: Continuous pulse animation keyframes and active checkmarks on presets", () => {
  const cssPath = path.resolve(process.cwd(), "public/css/app.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  // Continuous animation keyframes
  assert.ok(css.includes("@keyframes textPulse"), "CSS must define @keyframes textPulse");
  assert.ok(css.includes("@keyframes imgPulse"), "CSS must define @keyframes imgPulse");
  assert.ok(css.includes("@keyframes continuousPulse"), "CSS must define @keyframes continuousPulse");

  const p = generateSite({ name: "Menuiserie Bois", tradeId: "menuisier", city: "Nantes" });
  state.currentProject = JSON.parse(JSON.stringify(p));

  // Set motion on image
  const heroSec = state.currentProject.sections.find(s => s.type === "hero");
  if (!heroSec.settings) heroSec.settings = {};
  heroSec.settings.motion_image = "pulse";

  const editorHTML = renderWebsiteHTML(state.currentProject, { isEditor: true });
  assert.ok(editorHTML.includes('data-motion="pulse"'), "Image must serialize data-motion='pulse'");
});

test("v4.6.0: Apple scroll-fx toggle and animation speed multiplier", () => {
  state.currentView = "editor";
  const p = generateSite({ name: "Toiture Protect", tradeId: "couvreur", city: "Lille" });
  state.currentProject = p;
  const editorShell = renderEditor(state);

  // Settings drawer should offer Apple Scroll Reveal and Animation Speed controls
  assert.ok(editorShell.includes("toggleAppleScrollFx"), "Editor must include Apple Scroll FX toggle");
  assert.ok(editorShell.includes("setAnimationSpeed"), "Editor must include Animation Speed selector");

  // CSS must support --anim-duration-multiplier variable
  const cssPath = path.resolve(process.cwd(), "public/css/app.css");
  const css = fs.readFileSync(cssPath, "utf-8");
  assert.ok(css.includes("--anim-duration-multiplier"), "CSS must define and use --anim-duration-multiplier");
});

test("v4.8.0: Animation presets, speed and reduced-motion survive standalone export", () => {
  const p = generateSite({ name: "Motion Export", tradeId: "peintre", city: "Lyon" });
  p.branding.motionPreset = "reveal";
  p.branding.animationSpeed = "slow";
  const publicHTML = renderWebsiteHTML(p, { isEditor: false });
  const exportedHTML = exportStandaloneHTML(p);

  assert.ok(publicHTML.includes('data-motion="reveal"'), "Global motion preset must reach rendered sections");
  assert.ok(publicHTML.includes("--anim-duration-multiplier: 1.5"), "Preview must persist the selected animation speed");
  assert.ok(exportedHTML.includes("--anim-duration-multiplier: 1.5"), "Export must persist the selected animation speed");
  assert.ok(exportedHTML.includes('@keyframes motion-magnetic'), "Export must ship real per-block motion keyframes");
  assert.ok(exportedHTML.includes('@keyframes motion-shimmer'), "Export must ship shimmer rather than degrading every preset to fade");
  assert.ok(exportedHTML.includes('animation-iteration-count: 1 !important'), "Reduced-motion export must stop continuous animations");
});

test("v4.6.0: State manager includes save() alias for resilient persistence", () => {
  assert.equal(typeof state.save, "function", "state.save must be defined as a function");
  // Calling state.save() should not throw
  assert.doesNotThrow(() => {
    state.save();
  }, "state.save() should execute cleanly");
});

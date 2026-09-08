import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateSite } from "../public/js/engine/generator.js";
import { state } from "../public/js/state.js";
import { renderWebsiteHTML } from "../public/js/components/renderer.js";
import { renderEditor } from "../public/js/components/editor.js";
import { renderDashboard } from "../public/js/components/dashboard.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("v4.4.0: Cross-browser Safari/WebKit & Chrome Flexbox scroll engine constraints", () => {
  const p = generateSite({ name: "Jardin & Co", tradeId: "paysagiste", city: "Montauban" });
  state.currentProject = p;
  state.currentView = "editor";
  const editorHTML = renderEditor(state);

  // Editor workspace flex layout must include min-h-0 and height constraints
  assert.ok(editorHTML.includes("editor-workspace-layout"), "Must render .editor-workspace-layout");
  assert.ok(editorHTML.includes("editor-canvas-scroll-host"), "Must render .editor-canvas-scroll-host on <main>");
  assert.ok(editorHTML.includes('id="editor-main-canvas"'), "Must have id='editor-main-canvas' for smooth programmatic scroll");

  const cssPath = path.resolve(process.cwd(), "public/css/app.css");
  const css = fs.readFileSync(cssPath, "utf-8");
  assert.ok(css.includes(".editor-workspace-layout"), "CSS must define .editor-workspace-layout");
  assert.ok(css.includes(".editor-canvas-scroll-host"), "CSS must define .editor-canvas-scroll-host");
  assert.ok(css.includes("min-height: 0 !important;"), "CSS must enforce min-height: 0 !important on flex containers for WebKit");
  assert.ok(css.includes("scroll-behavior: smooth !important;"), "CSS must enforce smooth scrolling");
});

test("v4.4.0: Sequential clean button numbers (#1, #2...) and hover-only badge display", () => {
  const p = generateSite({ name: "Plomberie Pro", tradeId: "plombier", city: "Paris" });
  state.currentProject = p;
  const editorHTML = renderWebsiteHTML(p, { isEditor: true });

  // Sequential numbered badges instead of complex hashes
  assert.ok(editorHTML.includes(">#1</span>"), "Must display sequential badge #1 for primary button");
  assert.ok(editorHTML.includes(">#2</span>"), "Must display sequential badge #2 for secondary button");

  // CSS must hide direct badge by default and reveal on hover
  const cssPath = path.resolve(process.cwd(), "public/css/app.css");
  const css = fs.readFileSync(cssPath, "utf-8");
  assert.ok(css.includes(".cta-direct-badge"), "CSS must define .cta-direct-badge");
  assert.ok(css.includes("opacity: 0;"), "Direct badge must have opacity: 0 by default to prevent visual clutter");
  assert.ok(css.includes(".cta-button-wrapper:hover .cta-direct-badge"), "Must reveal on button wrapper hover");
});

test("v4.4.0: Button motion resolution and continuous pulse keyframes", () => {
  const p = generateSite({ name: "Esprit Nature", tradeId: "paysagiste", city: "Toulouse" });
  state.currentProject = JSON.parse(JSON.stringify(p));
  const heroSec = state.currentProject.sections.find(s => s.type === "hero");

  // Set pulse motion via state
  state.setButtonMotion(heroSec.id, "primary", "pulse");
  const editorHTML = renderWebsiteHTML(state.currentProject, { isEditor: true });

  assert.ok(editorHTML.includes("btn-motion-pulse"), "Must render btn-motion-pulse on hero button");
  assert.ok(editorHTML.includes('data-btn-motion="pulse"'), "Must render data-btn-motion attribute");

  // CSS pulse keyframes must be continuous infinite
  const cssPath = path.resolve(process.cwd(), "public/css/app.css");
  const css = fs.readFileSync(cssPath, "utf-8");
  assert.ok(css.includes("@keyframes ctaPulse"), "Must define @keyframes ctaPulse");
  assert.ok(css.includes("box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);"), "ctaPulse must include animated box-shadow ring");
});

test("v4.4.0: About section key points (Notre Savoir-Faire) have data-editable attributes", () => {
  const p = generateSite({ name: "Artisan Bois", tradeId: "menuisier", city: "Nantes" });
  state.currentProject = p;
  const editorHTML = renderWebsiteHTML(p, { isEditor: true });

  assert.ok(editorHTML.includes('data-editable="points.0"'), "First point of savoir-faire must be editable");
  assert.ok(editorHTML.includes('data-editable="points.1"'), "Second point of savoir-faire must be editable");
});

test("v4.4.0: 2026 SaaS Dashboard Cockpit with 1-click prompt chips and KPI metrics", () => {
  const p1 = generateSite({ name: "Esprit Nature", tradeId: "paysagiste", city: "Montauban" });
  state.projects = [p1];
  const dashboardHTML = renderDashboard(state);

  assert.ok(dashboardHTML.includes("ARTISITE PROSPECTOR"), "Dashboard must render brand title");
  assert.ok(dashboardHTML.includes("v4.3 PRO"), "Dashboard must render version badge");
  assert.ok(dashboardHTML.includes("quick-gen-form"), "Dashboard must render quick generation form");
  assert.ok(dashboardHTML.includes("fillQuickGen"), "Dashboard must render 1-click suggestion chips");
  assert.ok(dashboardHTML.includes("Esprit Nature"), "Dashboard must render project card");
  assert.ok(dashboardHTML.includes("Pipeline de vente"), "Dashboard must render pipeline KPI card");
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateSite } from "../public/js/engine/generator.js";
import { state } from "../public/js/state.js";
import { renderWebsiteHTML } from "../public/js/components/renderer.js";
import { renderEditor } from "../public/js/components/editor.js";
import { renderShareModal } from "../public/js/components/shareModal.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("v4.7.0 Consolidation: Fullscreen Hero renders liquid-glass badge, dynamic darkening overlay, and discover anchor", () => {
  const project = generateSite({ name: "Esprit Nature", tradeId: "paysagiste", city: "Montauban", phone: "07 12 34 56 78" });
  state.currentProject = project;

  const html = renderWebsiteHTML(project, { isEditor: false });

  // 1. Liquid glass badge with profession badge
  assert.ok(html.includes("liquid-glass-badge"), "Hero must include .liquid-glass-badge");
  assert.ok(html.includes("Artisan Paysagiste"), "Must include profession badge text");

  // 2. Dynamic darkening overlay
  assert.ok(html.includes("background-color: rgba(0, 0, 0, 0.45)"), "Default paysagiste hero must have 45% overlay darkening");

  // 3. Pill buttons
  assert.ok(html.includes("rounded-full"), "Hero buttons must use rounded-full pill styling");

  // 4. Discover anchor link
  assert.ok(html.includes("hero-scroll-discover"), "Hero must render .hero-scroll-discover button");
  assert.ok(html.includes("DÉCOUVRIR"), "Hero must render DÉCOUVRIR scroll anchor text");

  // 5. CSS definitions
  const cssPath = path.resolve(process.cwd(), "public/css/app.css");
  const css = fs.readFileSync(cssPath, "utf-8");
  assert.ok(css.includes(".liquid-glass-badge"), "CSS must define .liquid-glass-badge");
  assert.ok(css.includes(".hero-scroll-discover"), "CSS must define .hero-scroll-discover");
});

test("v4.7.0 Consolidation: Editorial Gallery renders 3-column grid with mixed Before/After comparison card", () => {
  const project = generateSite({ name: "Esprit Nature", tradeId: "paysagiste", city: "Montauban" });
  state.currentProject = project;

  const html = renderWebsiteHTML(project, { isEditor: false });

  // 1. 3-column editorial grid
  assert.ok(html.includes("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"), "Gallery must render 3-column responsive grid");
  assert.ok(html.includes("aspect-[4/3]"), "Default gallery items must use 4/3 aspect ratio");

  // 2. Mixed Before/After card in gallery
  assert.ok(html.includes("ba-card"), "Gallery must include .ba-card before/after comparison item");
  assert.ok(html.includes("ba-container"), "Gallery must include .ba-container wrapper");
  assert.ok(html.includes("AVANT"), "Comparison card must display AVANT badge");
  assert.ok(html.includes("APRÈS"), "Comparison card must display APRÈS badge");

  // 3. CSS definition
  const cssPath = path.resolve(process.cwd(), "public/css/app.css");
  const css = fs.readFileSync(cssPath, "utf-8");
  assert.ok(css.includes(".ba-container.ba-card"), "CSS must define .ba-container.ba-card");
});

test("v4.7.0 Consolidation: FAQ renders minimalist divider rows with rotating plus-minus toggle button", () => {
  const project = generateSite({ name: "Esprit Nature", tradeId: "paysagiste", city: "Montauban" });
  state.currentProject = project;

  const html = renderWebsiteHTML(project, { isEditor: false });

  // 1. FAQ divider structure
  assert.ok(html.includes("divide-y divide-zinc-200/80"), "FAQ must use clean divider rows");
  assert.ok(html.includes("faq-item"), "FAQ must contain .faq-item elements");
  assert.ok(html.includes("faq-header"), "FAQ items must have .faq-header click targets");

  // 2. Circular toggle button
  assert.ok(html.includes("faq-icon-btn"), "FAQ must render .faq-icon-btn");

  // 3. CSS definition for toggle
  const cssPath = path.resolve(process.cwd(), "public/css/app.css");
  const css = fs.readFileSync(cssPath, "utf-8");
  assert.ok(css.includes(".faq-icon-btn"), "CSS must define .faq-icon-btn");
  assert.ok(css.includes("rotate(45deg)"), "CSS must define 45deg rotation for active toggle icon");
});

test("v4.7.0 Consolidation: 5-Tab Share Modal provides client demo PIN, editor link, fullscreen preview, domain DNS and vanilla ZIP export", () => {
  const project = generateSite({ name: "Esprit Nature", tradeId: "paysagiste", city: "Montauban", phone: "0612345678" });
  state.currentProject = project;

  // 1. Default demo tab
  const demoModal = renderShareModal(project, "demo");
  assert.ok(demoModal.includes("Partager la Démonstration Client"), "Demo tab must render title");
  assert.ok(demoModal.includes("setShareModalTab('demo')"), "Demo tab button must exist");
  assert.ok(demoModal.includes("setShareModalTab('editor')"), "Editor tab button must exist");
  assert.ok(demoModal.includes("setShareModalTab('preview')"), "Preview tab button must exist");
  assert.ok(demoModal.includes("setShareModalTab('domain')"), "Domain tab button must exist");
  assert.ok(demoModal.includes("setShareModalTab('export')"), "Export tab button must exist");
  assert.ok(demoModal.includes("<svg"), "Demo tab must render QR Code SVG");
  assert.ok(demoModal.includes("href=\"sms:0612345678"), "Demo tab must render SMS link");
  assert.ok(demoModal.includes("wa.me/"), "Demo tab must render WhatsApp link");
  assert.ok(demoModal.includes("setClientDemoPin"), "Demo tab must provide PIN protection switch");
  assert.ok(demoModal.includes("Verrouillage par Code PIN Client"), "Demo tab must render PIN protection title");

  // 2. Editor tab
  const editorModal = renderShareModal(project, "editor");
  assert.ok(editorModal.includes("Accès Collaborateur / Agence"), "Editor tab must render collaborative editor headline");
  assert.ok(editorModal.includes("share-modal-editor-url"), "Editor tab must have editor url input");
  assert.ok(editorModal.includes("#project=" + project.id), "Editor tab must contain project hash URL");

  // 3. Preview tab
  const previewModal = renderShareModal(project, "preview");
  assert.ok(previewModal.includes("Lancer la Démonstration Plein Écran Immédiate"), "Preview tab must render fullscreen preview option");
  assert.ok(previewModal.includes("enterCommercialDemoMode"), "Preview tab must trigger commercial demo mode");

  // 4. Domain tab
  const domainModal = renderShareModal(project, "domain");
  assert.ok(domainModal.includes("Nom de domaine personnalisé"), "Domain tab must render domain configuration");
  assert.ok(domainModal.includes("Type A"), "Domain tab must list Type A DNS record");
  assert.ok(domainModal.includes("CNAME"), "Domain tab must list CNAME DNS record");

  // 5. Export tab
  const exportModal = renderShareModal(project, "export");
  assert.ok(exportModal.includes("Pack de Déploiement Autonome Pure Vanilla"), "Export tab must render production export");
  assert.ok(exportModal.includes("exportProductionPackage"), "Export tab must trigger production zip package download");
  assert.ok(exportModal.includes("downloadStandaloneHTML"), "Export tab must trigger standalone HTML download");
});

test("v4.7.0 Consolidation: Editor sidebar retains accordion open state and provides gallery & hero overlay controls", () => {
  const project = generateSite({ name: "Esprit Nature", tradeId: "paysagiste", city: "Montauban" });
  state.currentProject = project;
  state.currentView = "editor";

  // Test with state._openSettingsItem = 'colors' and activeSidebarTab = 'settings'
  state.activeSidebarTab = "settings";
  state._openSettingsItem = "colors";
  let editorHtml = renderEditor(state);
  assert.ok(editorHtml.includes('id="settings-body-colors"'), "Colors section content must exist");
  assert.ok(!editorHtml.includes('class="section-accordion-body hidden space-y-3" id="settings-body-colors"'), "Colors section must be opened when _openSettingsItem='colors'");

  // Test sections tab controls
  state.activeSidebarTab = "sections";
  editorHtml = renderEditor(state);

  // Test hero overlay slider
  assert.ok(editorHtml.includes("setHeroOverlayDarkening"), "Editor must bind setHeroOverlayDarkening handler");

  // Test gallery aspect ratio selector
  assert.ok(editorHtml.includes("setGalleryAspectRatio"), "Editor must bind setGalleryAspectRatio handler");
  assert.ok(editorHtml.includes("addGalleryItem"), "Editor must bind addGalleryItem handler");
  assert.ok(editorHtml.includes("toggleGalleryItemType"), "Editor must bind toggleGalleryItemType handler");
});

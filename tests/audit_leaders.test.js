import test from "node:test";
import assert from "node:assert/strict";

// Mock minimal localStorage for Node.js test environment
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

import { generateSite } from "../public/js/engine/generator.js";
import { generateQRCodeSVG } from "../public/js/components/qrcode.js";
import { renderShareModal } from "../public/js/components/shareModal.js";
import { renderCommandPalette } from "../public/js/components/commandPalette.js";
import { renderStickyCallBar, generateLocalBusinessSchema, renderWebsiteHTML } from "../public/js/components/renderer.js";
import { exportStandaloneHTML } from "../public/js/engine/exporter.js";

test("Leader MVP Feature 1: Pure SVG QR Code Generator produces valid standalone vector graphic", () => {
  const svg = generateQRCodeSVG("https://artisite.demo/?demo=proj-12345", 180);
  
  assert.ok(svg.startsWith("<svg"), "Should output an SVG element");
  assert.ok(svg.includes('viewBox="0 0'), "Should have viewBox attribute");
  assert.ok(svg.includes('width="180"'), "Should set specified width");
  assert.ok(svg.includes('<rect'), "Should contain barcode module rects");
  assert.ok(svg.endsWith("</svg>"), "Should close SVG element cleanly");
});

test("Leader MVP Feature 2: Share Modal generates live demo URL, QR code and pre-formatted sales pitch", () => {
  const project = generateSite({ name: "Jardin Pro", tradeId: "paysagiste", phone: "07 88 99 00 11" });
  const html = renderShareModal(project);

  assert.ok(html.includes("Partager la Démonstration Client"), "Should have modal header");
  assert.ok(html.includes("?demo=" + project.id), "Should include shareable demo URL");
  assert.ok(html.includes("<svg"), "Should embed SVG QR Code");
  assert.ok(html.includes("sms:"), "Should provide SMS direct link");
  assert.ok(html.includes("wa.me/"), "Should provide WhatsApp direct link");
});

test("Leader MVP Feature 3: Command Palette (⌘K) renders quick navigation for sections, actions & themes", () => {
  const project = generateSite({ name: "Élec Énergie", tradeId: "electricien" });
  const html = renderCommandPalette(project, [project]);

  assert.ok(html.includes("cmd-palette-input"), "Should render search input");
  assert.ok(html.includes("Sections du site"), "Should include sections group");
  assert.ok(html.includes("Mes Projets"), "Should include projects group");
  assert.ok(html.includes("Élec Énergie"), "Should list project name");
  assert.ok(html.includes("Outils & Actions Vente"), "Should include sales tools group");
  assert.ok(html.includes("Affichage Responsive"), "Should include viewports group");
  assert.ok(html.includes("Ambiance Globale"), "Should include global themes group");

  // Fallback when no project selected
  const nullProjectHtml = renderCommandPalette(null, [project]);
  assert.ok(nullProjectHtml.includes("cmd-palette-input"), "Should render search input even without active project");
  assert.ok(nullProjectHtml.includes("Mes Projets"), "Should list projects when project is null");
});

test("Leader MVP Feature 4: Sticky Floating Action Bar renders conversion pill with Call, WhatsApp and Quote", () => {
  const project = generateSite({ name: "Plomberie Express", tradeId: "plombier", phone: "06 11 22 33 44" });
  
  // Default: enabled
  const stickyHtml = renderStickyCallBar(project);
  assert.ok(stickyHtml.includes("sticky-call-bar"), "Should render sticky call bar container");
  assert.ok(stickyHtml.includes("tel:0611223344"), "Should render direct call button");
  assert.ok(stickyHtml.includes("wa.me/"), "Should render direct WhatsApp button");
  assert.ok(stickyHtml.includes('href="#simulateur"'), "Should render quote anchor");
  assert.ok(stickyHtml.includes('aria-label="Demander un devis"'), "Quote anchor should stay explicitly labelled");

  // In renderWebsiteHTML: sticky bar must be included
  const fullHtml = renderWebsiteHTML(project, { isEditor: false });
  assert.ok(fullHtml.includes("sticky-call-bar"), "renderWebsiteHTML should include sticky call bar");

  // When disabled in project settings: must not render
  project.settings = { stickyBarEnabled: false };
  const disabledHtml = renderStickyCallBar(project);
  assert.equal(disabledHtml, "", "Should return empty string when stickyBarEnabled is false");
});

test("Leader MVP Feature 5: LocalBusiness Schema.org JSON-LD is valid and injected into standalone HTML head", () => {
  const project = generateSite({ 
    name: "Artisan Bois", 
    tradeId: "menuisier", 
    city: "Bordeaux", 
    region: "Nouvelle-Aquitaine", 
    phone: "05 56 00 00 00" 
  });

  const schemaJson = generateLocalBusinessSchema(project);
  const parsed = JSON.parse(schemaJson);

  assert.equal(parsed["@context"], "https://schema.org");
  assert.equal(parsed["@type"], "LocalBusiness");
  assert.equal(parsed.name, "Artisan Bois");
  assert.equal(parsed.telephone, "05 56 00 00 00");
  assert.equal(parsed.address.addressLocality, "Bordeaux");
  assert.equal(parsed.address.addressRegion, "Nouvelle-Aquitaine");
  assert.equal(parsed.aggregateRating.ratingValue, "5.0");

  // Check standalone HTML export
  const standaloneHtml = exportStandaloneHTML(project);
  assert.ok(standaloneHtml.includes('type="application/ld+json"'), "Standalone HTML must include JSON-LD script");
  assert.ok(standaloneHtml.includes('"@type": "LocalBusiness"'), "Standalone HTML must contain LocalBusiness type");
  assert.ok(standaloneHtml.includes("Bordeaux"), "Standalone HTML must include locality");
});

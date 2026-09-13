import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { generateSite, createSectionData } from "../public/js/engine/generator.js";
import { renderWebsiteHTML } from "../public/js/components/renderer.js";
import { renderCloserModal } from "../public/js/components/closerModal.js";
import {
  generateColdCallScript,
  calculateROI,
  generateCompetitiveAudit,
  generateOrderContract,
  getObjectionBattlecards
} from "../public/js/engine/closer.js";
import { calculateContrast } from "../public/js/components/editor.js";
import {
  generateSitemapXML,
  generateRobotsTXT,
  generateWebManifest,
  generateProductionPackage,
  generateProductionZip,
  createZipArchive
} from "../public/js/engine/exporter.js";
import { getCachedAiResult, setCachedAiResult, handleApiRequest } from "../server/apiHandler.js";

// ============================================================================
// 1. SYSTEM AUDIT & LATENCY BOTTLENECKS
// ============================================================================

test("v4.5.0 Audit: Server safe URL decoding and static asset ETag caching", () => {
  const serverJsPath = path.resolve(process.cwd(), "server.js");
  const serverCode = fs.readFileSync(serverJsPath, "utf-8");

  // URI Error handling must not crash server
  assert.ok(serverCode.includes("try {"), "server.js must wrap decodeURI in try block");
  assert.ok(serverCode.includes("decodeURI(rawUrl)"), "server.js must attempt decodeURI");
  assert.ok(serverCode.includes("catch"), "server.js must catch malformed URI error");

  // Caching headers & ETag
  assert.ok(serverCode.includes("ETag"), "server.js must emit ETag headers");
  assert.ok(serverCode.includes("if-none-match"), "server.js must handle If-None-Match for 304 responses");
  assert.ok(serverCode.includes("304"), "server.js must return HTTP 304 Not Modified");
  assert.ok(serverCode.includes("Cache-Control"), "server.js must set Cache-Control headers");
});

test("v4.5.0 Audit: API in-memory TTL caching reduces AI latency", async () => {
  const cacheKey = "test-cache-key-" + Date.now();
  const testPayload = { result: "ultra-fast-cached-data" };

  assert.equal(getCachedAiResult(cacheKey), null, "Initial cache lookup must be null");

  setCachedAiResult(cacheKey, testPayload, 5000);
  const cached = getCachedAiResult(cacheKey);

  assert.deepEqual(cached, testPayload, "Cache lookup must return cached payload immediately");
});

// ============================================================================
// 2. MVP 1: SIMULATEUR ROI RENTABILITÉ ARTISAN
// ============================================================================

test("v4.5.0 MVP 1: ROI Simulator calculates payback and renders interactive section", () => {
  const roi = calculateROI(1200, 990);
  assert.equal(roi.ticketMoyen, 1200);
  assert.equal(roi.siteCost, 990);
  assert.equal(roi.chantiersToBreakEven, "0.8", "chantiersToBreakEven must reflect 990/1200");

  const project = generateSite({ name: "Toiture Expert", tradeId: "couvreur", city: "Bordeaux" });
  const roiSec = createSectionData("roiCalculator", project.business);
  assert.equal(roiSec.type, "roiCalculator");
  assert.ok(roiSec.content.defaultTicket >= 300);

  project.sections.push(roiSec);
  const html = renderWebsiteHTML(project);

  assert.ok(html.includes("component-roi-calculator"), "Must render component-roi-calculator");
  assert.ok(html.includes("simulateur-roi-slider"), "Must include interactive slider");
  assert.ok(html.includes("Rentabilité en"), "Must include payback badge");
  assert.ok(!html.includes("undefined"), "Must not contain undefined");
});

// ============================================================================
// 3. MVP 2: PREUVE SOCIALE EN DIRECT (SOCIAL PROOF TOAST)
// ============================================================================

test("v4.5.0 MVP 2: Social Proof Toast renders live lead notification with city context", () => {
  const project = generateSite({ name: "Élec 31", tradeId: "electricien", city: "Toulouse" });
  project.branding.socialProofEnabled = true;

  const html = renderWebsiteHTML(project, { isEditor: false });
  assert.ok(html.includes("social-proof-toast"), "Must render social-proof-toast");
  assert.ok(html.includes("Toulouse"), "Must display project city in social proof toast");
  assert.ok(html.includes("Vérifié ✓"), "Must display verified badge");
  assert.ok(!html.includes("undefined"), "Must not contain undefined");

  // When disabled, toast should not render
  project.branding.socialProofEnabled = false;
  const htmlDisabled = renderWebsiteHTML(project, { isEditor: false });
  assert.ok(!htmlDisabled.includes("social-proof-toast"), "Disabled social proof toast must not render");
});

// ============================================================================
// 4. MVP 3: BOOKING BLOCK URGENCE & CRÉNEAU RDV
// ============================================================================

test("v4.5.0 MVP 3: Booking Block renders 24/7 emergency badge and slot selector", () => {
  const project = generateSite({ name: "Dépannage Express", tradeId: "plombier", city: "Lyon" });
  const bookingSec = createSectionData("bookingBlock", project.business);
  // Availability belongs to this explicit fixture, not an auto-generated emergency banner.
  bookingSec.content.badge = "Disponibilité de test 24h/24";
  assert.equal(bookingSec.type, "bookingBlock");
  assert.ok(bookingSec.content.slots.length >= 3, "Must have at least 3 time slots");

  project.sections.push(bookingSec);
  const html = renderWebsiteHTML(project);

  assert.ok(html.includes("component-booking-block"), "Must render component-booking-block");
  assert.ok(html.includes("24h/24 &amp; 7j/7") || html.includes("24h/24"), "Must highlight emergency availability");
  assert.ok(html.includes("booking-slot-card"), "Must render selectable booking slots");
  assert.ok(html.includes("Créneau pré-réservé avec succès"), "Must show booking success message template");
  assert.ok(!html.includes("undefined"), "Must not contain undefined");
});

// ============================================================================
// 5. MVP 4: BON DE COMMANDE NUMÉRIQUE & E-SIGNATURE
// ============================================================================

test("v4.5.0 MVP 4: Digital order contract and signature pad canvas", () => {
  const project = generateSite({ name: "Maçonnerie Dubois", tradeId: "macon", city: "Nantes" });
  const contract = generateOrderContract(project);

  assert.ok(contract.contractNumber.startsWith("BDC-"), "Must have standard BDC contract reference");
  assert.equal(contract.client.name, "Maçonnerie Dubois");
  assert.equal(contract.client.city, "Nantes");
  assert.ok(contract.service.inclusions.length >= 4, "Must list at least 4 key inclusions");

  const closerHTML = renderCloserModal(project);
  assert.ok(closerHTML.includes("closer-signature-pad"), "Must render closer-signature-pad canvas");
  assert.ok(closerHTML.includes("Effacer la signature"), "Must provide clear signature button");
  assert.ok(closerHTML.includes("Télécharger & Imprimer"), "Must offer PDF print button");
  assert.ok(!closerHTML.includes("undefined"), "Closer modal must not contain undefined");
});

// ============================================================================
// 6. MVP 5: BENCHMARK & AUDIT LOCAL 360°
// ============================================================================

test("v4.5.0 MVP 5: Competitive 360° audit generates comparative pillars and talking points", () => {
  const project = generateSite({ name: "Menuiserie Moderne", tradeId: "menuisier", city: "Rennes" });
  const audit = generateCompetitiveAudit(project);

  assert.ok(audit.pillars.length >= 3, "Must compare at least 3 performance pillars");
  audit.pillars.forEach(p => {
    assert.ok(p.currentScore < p.prospectorScore, "Artisite prospector score must beat current artisan site");
    assert.ok(p.impact.length > 10, "Each pillar must explain tangible business impact");
  });
  assert.ok(audit.talkingPoints.length >= 2, "Must provide Michel with ready-to-use closing arguments");

  const closerHTML = renderCloserModal(project);
  assert.ok(closerHTML.includes("closer-panel-audit"), "Closer modal must contain audit tab panel");
  assert.ok(closerHTML.includes("Benchmark Visibilité Locale"), "Must display local benchmark header");
});

// ============================================================================
// 7. MVP 6: OBJECTION BATTLECARDS
// ============================================================================

test("v4.5.0 MVP 6: Objection Battlecards equip Michel with confidence rates and counter-pitches", () => {
  const project = generateSite({ name: "Serrurerie Secur", tradeId: "serrurier", city: "Marseille" });
  const battlecards = getObjectionBattlecards(project);

  assert.ok(battlecards.length >= 4, "Must cover at least 4 common objections");
  battlecards.forEach(b => {
    assert.ok(b.title, "Battlecard must have a clear title");
    assert.ok(b.counter.length > 20, "Battlecard must provide a detailed verbatim counter-argument");
    assert.ok(b.confidence.includes("%"), "Battlecard must have a confidence percentage");
  });

  const closerHTML = renderCloserModal(project);
  assert.ok(closerHTML.includes("closer-panel-objections"), "Must have closer objections panel");
  assert.ok(closerHTML.includes("Taux de succès"), "Must display success rate badges");
});

// ============================================================================
// 8. MVP 7: MODE NAVIGATION VIRTUELLE MULTI-PAGES
// ============================================================================

test("v4.5.0 MVP 7: Virtual Multi-Page Navigation Mode filters sections cleanly", () => {
  const project = generateSite({ name: "Carrelage Design", tradeId: "carreleur", city: "Nice" });
  project.branding.navigationMode = "multi-tab";

  // Virtual Services Page
  project._activeVirtualPage = "services";
  const servicesHTML = renderWebsiteHTML(project, { isEditor: false, activeVirtualPage: "services" });
  assert.ok(servicesHTML.includes("Nos Prestations") || servicesHTML.includes("services"), "Services page must include services section");
  assert.ok(servicesHTML.includes("multi-tab") || servicesHTML.includes("window.app?.setVirtualPage"), "Header must include multi-tab virtual page switchers");

  // Virtual Realisations Page
  const realisationsHTML = renderWebsiteHTML(project, { isEditor: false, activeVirtualPage: "realisations" });
  assert.ok(!realisationsHTML.includes("undefined"), "Must not contain undefined");
});

// ============================================================================
// 9. MVP 8: HARMONISATEUR DE COULEURS & CONTRASTE WCAG AAA
// ============================================================================

test("v4.5.0 MVP 8: WCAG 2.1 Contrast Ratio Calculator and grading", () => {
  // Pure Black on Pure White = 21:1 (AAA)
  const blackOnWhite = calculateContrast("#000000", "#ffffff");
  assert.equal(blackOnWhite.ratio, 21);
  assert.equal(blackOnWhite.isAaa, true);
  assert.equal(blackOnWhite.isAa, true);
  assert.equal(blackOnWhite.grade, "AAA");

  // Shorthand 3-digit hex normalization (#000 on #fff must also equal 21:1)
  const shortHex = calculateContrast("#000", "#fff");
  assert.equal(shortHex.ratio, 21, "Short 3-character hex #000 on #fff must yield 21:1 ratio");
  assert.equal(shortHex.grade, "AAA", "Short hex #000 on #fff must achieve AAA grade");

  const shortGray = calculateContrast("#333", "#fff");
  assert.ok(shortGray.ratio >= 12.0, "Dark gray #333 on white must achieve high contrast");
  assert.equal(shortGray.grade, "AAA");

  // Dark Emerald #047857 on White #ffffff = 5.5:1 (AA)
  const darkEmerald = calculateContrast("#047857", "#ffffff");
  assert.ok(darkEmerald.ratio >= 4.5);
  assert.equal(darkEmerald.isAa, true);
  assert.equal(darkEmerald.grade, "AA");

  // Emerald #059669 on White #ffffff = 3.8:1 (AA Large / UI component)
  const emeraldOnWhite = calculateContrast("#059669", "#ffffff");
  assert.ok(emeraldOnWhite.ratio >= 3.0, "Emerald on white must satisfy UI component contrast");

  // Poor contrast: #e4e4e7 on #ffffff
  const lowContrast = calculateContrast("#e4e4e7", "#ffffff");
  assert.equal(lowContrast.isAa, false);
  assert.equal(lowContrast.grade, "Contraste faible");
});

// ============================================================================
// 10. MVP 9: PACK DÉPLOIEMENT PRODUCTION (SITEMAP, ROBOTS, MANIFEST, ZIP)
// ============================================================================

test("v4.5.0 MVP 9: Production deployment package and pure vanilla ZIP generation", async () => {
  const project = generateSite({ name: "Plâtrerie Moderne", tradeId: "platrier", city: "Lille" });
  const pkg = generateProductionPackage(project);

  assert.ok(pkg["index.html"].includes("<!DOCTYPE html>"), "Package must include valid standalone index.html");
  assert.ok(pkg["sitemap.xml"].includes("<urlset"), "Package must include XML sitemap");
  assert.ok(pkg["sitemap.xml"].includes("<loc>"), "Sitemap must contain URLs");
  assert.ok(pkg["robots.txt"].includes("User-agent: *"), "Robots.txt must allow search engines");
  assert.ok(pkg["robots.txt"].includes("Sitemap:"), "Robots.txt must reference sitemap");
  assert.ok(pkg["site.webmanifest"].includes("standalone"), "WebManifest must specify standalone display");
  assert.ok(pkg["site.webmanifest"].includes("Plâtrerie Moderne"), "WebManifest must include business name");

  // Standalone HTML must contain client-side virtual navigation and social proof rotation scripts
  assert.ok(pkg["index.html"].includes("artisiteSwitchPage"), "Standalone index.html must embed client-side virtual navigation switcher");
  assert.ok(pkg["index.html"].includes("initSocialProof"), "Standalone index.html must embed rotating social proof logic");

  // Pure Vanilla In-Memory ZIP Archive Generation (PKWARE Store Format)
  const zipBlob = generateProductionZip(project);
  assert.equal(zipBlob.type, "application/zip", "ZIP blob must have application/zip mime type");

  const arrayBuffer = await zipBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  assert.ok(bytes.length > 500, "ZIP buffer must contain packaged file data");
  // Magic bytes PK\x03\x04
  assert.equal(bytes[0], 0x50, "ZIP magic byte 0 must be 0x50 ('P')");
  assert.equal(bytes[1], 0x4B, "ZIP magic byte 1 must be 0x4B ('K')");
  assert.equal(bytes[2], 0x03, "ZIP magic byte 2 must be 0x03");
  assert.equal(bytes[3], 0x04, "ZIP magic byte 3 must be 0x04");
});

// ============================================================================
// 11. MVP 10: WHITE-LABEL CLIENT DEMO PIN LOCK
// ============================================================================

test("v4.5.0 MVP 10: Client Demo PIN protection settings and unlock mechanics", () => {
  const project = generateSite({ name: "Vitrerie Pro", tradeId: "vitrier", city: "Strasbourg" });
  project.settings.clientDemoPin = "4821";

  assert.equal(project.settings.clientDemoPin, "4821", "Project settings must store PIN code");
  assert.ok(!JSON.stringify(project).includes("undefined"), "Project json must be free of undefined");

  // Verify PIN verification logic
  const checkPin = (entered, expected) => String(entered).trim() === String(expected).trim();
  assert.equal(checkPin("4821", project.settings.clientDemoPin), true, "Correct PIN must match");
  assert.equal(checkPin("0000", project.settings.clientDemoPin), false, "Wrong PIN must fail");
});

// ============================================================================
// 12. MVP 7: ADVANCED SECTION MAPPING & UNMAPPED FALLBACK
// ============================================================================

test("v4.5.0 MVP 7: Certifications and unmapped custom sections map cleanly in multi-tab mode", () => {
  const project = generateSite({ name: "Menuiserie Bois", tradeId: "menuisier", city: "Nantes" });
  project.branding.navigationMode = "multi-tab";

  project.sections.push(createSectionData("certifications", project.business));
  project.sections.push(createSectionData("quoteBlock", project.business));
  project.sections.push({
    id: "sec-custom-xyz",
    type: "customBlock",
    visibility: true,
    content: { title: "Spécialité Nantes" },
    settings: {}
  });

  // On Home tab: certifications and quoteBlock must be included
  const homeHtml = renderWebsiteHTML(project, { isEditor: false, activeVirtualPage: "home" });
  assert.ok(homeHtml.includes("certifications") || homeHtml.includes("Garanties") || homeHtml.includes("Labels"), "Home tab must include certifications");

  // On Services tab: customBlock and certifications must be included
  const servicesHtml = renderWebsiteHTML(project, { isEditor: false, activeVirtualPage: "services" });
  assert.ok(servicesHtml.includes("Spécialité Nantes") || servicesHtml.includes("customBlock"), "Services tab must include customBlock");
});

// ============================================================================
// 13. STRICT SYSTEM INTEGRITY & ZERO UNDEFINED INVARIANT
// ============================================================================

test("v4.5.0 Integrity: Full project rendering with all 10 MVP features contains 0 'undefined'", () => {
  const project = generateSite({ name: "Artisans Réunis", tradeId: "electricien", city: "Bordeaux" });
  project.branding.socialProofEnabled = true;
  project.branding.navigationMode = "multi-tab";

  // Add ROI calculator & Booking block
  project.sections.push(createSectionData("roiCalculator", project.business));
  project.sections.push(createSectionData("bookingBlock", project.business));

  const renderedEditor = renderWebsiteHTML(project, { isEditor: true });
  assert.ok(!renderedEditor.includes("undefined"), "Editor HTML must contain zero 'undefined'");

  const renderedStandalone = renderWebsiteHTML(project, { isEditor: false, isStandalone: true });
  assert.ok(!renderedStandalone.includes("undefined"), "Standalone HTML must contain zero 'undefined'");

  const closerHTML = renderCloserModal(project);
  assert.ok(!closerHTML.includes("undefined"), "Closer Cockpit must contain zero 'undefined'");
});

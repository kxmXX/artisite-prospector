import test from "node:test";
import assert from "node:assert/strict";
import { generateSite } from "../public/js/engine/generator.js";
import { exportStandaloneHTML } from "../public/js/engine/exporter.js";

test("exportStandaloneHTML produces complete, self-contained offline production HTML", () => {
  const site = generateSite({
    name: "Toitures du Sud",
    tradeId: "couvreur",
    city: "Albi",
    phone: "07 53 19 60 44"
  });

  const html = exportStandaloneHTML(site);

  // Must be complete HTML document
  assert.ok(html.startsWith("<!DOCTYPE html>"), "Must have standard doctype");
  assert.ok(html.includes("<title>Toitures du Sud"), "Must have custom title");
  assert.ok(html.includes("07 53 19 60 44"), "Must include phone number");
  assert.ok(html.includes("Albi"), "Must include city");

  // Must include embedded CSS variables and utility classes for offline styling
  assert.ok(html.includes("--primary:"), "Must include CSS variables");
  assert.ok(html.includes(".max-w-7xl"), "Must include utility classes like max-w-7xl");
  assert.ok(html.includes(".grid"), "Must include grid layout classes");
  assert.ok(html.includes(".ba-container"), "Must include Before/After container styles");

  // Must include interactive scripts
  assert.ok(html.includes("initBeforeAfter"), "Must include Before/After interactive slider script");
  assert.ok(html.includes("initFaq"), "Must include FAQ accordion script");
  assert.ok(html.includes("initLightbox"), "Must include Lightbox modal script");
  assert.ok(html.includes("initQuoteSimulator"), "Must include quote calculator script");

  // Must not have broken template variables
  assert.ok(!html.includes("undefined"), "Must not contain undefined");
  assert.ok(!html.includes("NaN"), "Must not contain NaN");
});

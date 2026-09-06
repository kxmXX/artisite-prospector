import test from "node:test";
import assert from "node:assert/strict";
import { generateSite } from "../public/js/engine/generator.js";

test("generateSite generates complete 16-section website for Esprit Nature (Paysagiste, Montauban)", () => {
  const site = generateSite({
    name: "Esprit Nature",
    tradeId: "paysagiste",
    city: "Montauban",
    region: "Occitanie",
    phone: "07 82 14 39 50"
  });

  assert.equal(site.name, "Esprit Nature");
  assert.equal(site.business.city, "Montauban");
  assert.equal(site.business.region, "Occitanie");
  assert.equal(site.business.phone, "07 82 14 39 50");
  assert.equal(site.business.tradeLabel, "Jardinier / Paysagiste");

  // Verify all 16 sections are generated
  const expectedTypes = [
    "header", "hero", "trust", "about", "stats", "services",
    "beforeAfter", "gallery", "realisations", "reviews",
    "quoteSimulator", "hours", "location", "faq", "cta", "footer"
  ];

  for (const expected of expectedTypes) {
    const sec = site.sections.find(s => s.type === expected);
    assert.ok(sec, `Section ${expected} must exist`);
    assert.equal(sec.visibility, true);
    assert.ok(sec.content, `Section ${expected} must have content`);
  }

  // Verify before / after slider content
  const ba = site.sections.find(s => s.type === "beforeAfter");
  assert.ok(ba.content.beforeImage);
  assert.ok(ba.content.afterImage);
  assert.ok(ba.content.beforeLabel);
  assert.ok(ba.content.afterLabel);

  // Verify quote simulator
  const qs = site.sections.find(s => s.type === "quoteSimulator");
  assert.ok(qs.content.types.length >= 3);
  assert.ok(qs.content.sizes.length >= 3);

  // Stringify and verify no "undefined" or broken placeholders
  const jsonStr = JSON.stringify(site);
  assert.ok(!jsonStr.includes("undefined"), "Output must never contain literal undefined");
  assert.ok(!jsonStr.includes("NaN"), "Output must never contain NaN");
});

test("generateSite handles empty inputs gracefully with robust defaults", () => {
  const fallbackSite = generateSite();
  assert.ok(fallbackSite.id);
  assert.ok(fallbackSite.name);
  assert.ok(fallbackSite.business.city);
  assert.ok(fallbackSite.sections.length >= 10);
});

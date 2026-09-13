import test from "node:test";
import assert from "node:assert/strict";
import { TRADES, getTradeById, findTradeByKeywords } from "../public/js/data/trades.js";

test("TRADES catalog contains all required trades with safe generation defaults", () => {
  assert.ok(TRADES.length >= 12, `Expected at least 12 trades, got ${TRADES.length}`);

  const requiredTrades = [
    "paysagiste", "plombier", "couvreur", "restaurant", "electricien",
    "coiffeur", "menuisier", "climatisation", "boulanger", "peintre", "macon", "avocat"
  ];
  for (const id of requiredTrades) {
    const t = getTradeById(id);
    assert.ok(t, `Trade ${id} should exist`);
    assert.ok(t.label, `Trade ${id} missing label`);
    assert.ok(t.badge, `Trade ${id} missing badge`);
    assert.ok(t.heroTitles?.length > 0, `Trade ${id} missing heroTitles`);
    assert.ok(t.defaultServices?.length >= 3, `Trade ${id} needs at least 3 services`);
    assert.equal(t.beforeAfter?.beforeImage, "", `Trade ${id} must not invent a before image`);
    assert.equal(t.beforeAfter?.afterImage, "", `Trade ${id} must not invent an after image`);
    assert.deepEqual(t.trustBadges, [], `Trade ${id} must not invent certifications or trust badges`);
    assert.deepEqual(t.reviews, [], `Trade ${id} must not invent client reviews`);
    assert.equal(t.heroImageProvenance, "illustrative", `Trade ${id} hero image must be marked illustrative`);
    assert.ok(t.faq?.length >= 1, `Trade ${id} missing faq`);
    assert.ok(t.quoteConfig?.types?.length >= 2, `Trade ${id} missing quoteConfig`);
    assert.ok(t.closerTips?.hook, `Trade ${id} missing closerTips hook`);
  }
});

test("findTradeByKeywords correctly matches trades or returns fallback", () => {
  assert.equal(findTradeByKeywords("jardin").id, "paysagiste");
  assert.equal(findTradeByKeywords("fuite").id, "plombier");
  assert.equal(findTradeByKeywords("toiture").id, "couvreur");
  assert.equal(findTradeByKeywords("barbe").id, "coiffeur");
  assert.equal(findTradeByKeywords("restaurant").id, "restaurant");
  assert.equal(findTradeByKeywords("borne").id, "electricien");
  assert.equal(findTradeByKeywords("pompe").id, "climatisation");
  assert.equal(findTradeByKeywords("boulangerie").id, "boulanger");
  assert.equal(findTradeByKeywords("croissant").id, "boulanger");
  assert.equal(findTradeByKeywords("peinture").id, "peintre");
  assert.equal(findTradeByKeywords("ravalement").id, "peintre");
  assert.equal(findTradeByKeywords("maçon").id, "macon");
  assert.equal(findTradeByKeywords("terrassement").id, "macon");
  assert.equal(findTradeByKeywords("avocat").id, "avocat");
  assert.equal(findTradeByKeywords("juridique").id, "avocat");

  // Empty or unknown fallback
  assert.equal(findTradeByKeywords("").id, "paysagiste");
  assert.equal(findTradeByKeywords("inconnu-xyz-123").id, "paysagiste");
});

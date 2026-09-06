import test from "node:test";
import assert from "node:assert/strict";
import { TRADES, getTradeById, findTradeByKeywords } from "../public/js/data/trades.js";

test("TRADES catalog contains all required trades with full data integrity", () => {
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
    assert.ok(t.beforeAfter?.beforeImage, `Trade ${id} missing beforeAfter beforeImage`);
    assert.ok(t.beforeAfter?.afterImage, `Trade ${id} missing beforeAfter afterImage`);
    assert.ok(t.trustBadges?.length >= 3, `Trade ${id} missing trustBadges`);
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

import test from "node:test";
import assert from "node:assert/strict";
import { generateSite } from "../public/js/engine/generator.js";
import { generateColdCallScript, generateWhatsappPitch, generateEmailPitch, calculateROI } from "../public/js/engine/closer.js";

test("closer engine produces high-converting personalized sales collateral", () => {
  const site = generateSite({
    name: "Dupont Plomberie",
    tradeId: "plombier",
    city: "Toulouse",
    phone: "06 11 22 33 44"
  });

  // Cold call script
  const script = generateColdCallScript(site);
  assert.ok(script.intro.speech.includes("Dupont Plomberie"));
  assert.ok(script.intro.speech.includes("Toulouse"));
  assert.ok(script.objections.length >= 3);
  assert.ok(script.closing.speech.length > 10);

  // WhatsApp pitch
  const whatsapp = generateWhatsappPitch(site, "https://demo.example.com/dupont");
  assert.ok(whatsapp.includes("Dupont Plomberie"));
  assert.ok(whatsapp.includes("Toulouse"));
  assert.ok(whatsapp.includes("https://demo.example.com/dupont"));

  // Email pitch
  const email = generateEmailPitch(site, "https://demo.example.com/dupont");
  assert.ok(email.subject.includes("Dupont Plomberie"));
  assert.ok(email.body.includes("https://demo.example.com/dupont"));

  // ROI Calculator
  const roi = calculateROI(1000, 1200);
  assert.equal(roi.chantiersToBreakEven, "1.2");
  assert.equal(roi.yearlyGainOnePerMonth, 10800);
});

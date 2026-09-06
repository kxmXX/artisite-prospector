import test from "node:test";
import assert from "node:assert/strict";
import { generateSite } from "../public/js/engine/generator.js";
import { processCopilotPrompt } from "../public/js/engine/copilot.js";

test("Copilot modifies styles, content and visibility via natural language", () => {
  const site = generateSite({ name: "Test Pro", tradeId: "paysagiste" });

  // 1. Change style to dark luxe
  const resLuxe = processCopilotPrompt(site, "passe le site en noir et or sombre luxe");
  assert.equal(resLuxe.project.branding.presetId, "luxe-sombre");

  // 2. Change phone number
  const resPhone = processCopilotPrompt(site, "change le numéro pour 06 99 88 77 66 s'il te plaît");
  assert.equal(resPhone.project.business.phone, "06 99 88 77 66");

  // 3. Toggle section visibility
  const resHideBA = processCopilotPrompt(site, "masque la section avant/après");
  const ba = resHideBA.project.sections.find(s => s.type === "beforeAfter");
  assert.equal(ba.visibility, false);

  // 4. Urgency
  const resUrgence = processCopilotPrompt(site, "mets l'accent sur les urgences de nuit");
  const hero = resUrgence.project.sections.find(s => s.type === "hero");
  assert.ok(hero.content.badge.includes("URGENCE"));
});

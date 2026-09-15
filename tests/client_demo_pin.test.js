import test from "node:test";
import assert from "node:assert/strict";

import { renderShareModal } from "../public/js/components/shareModal.js";
import { generateSite } from "../public/js/engine/generator.js";
import { parseClientDemoPin, verifyClientDemoPin } from "../public/js/utils/clientDemoPin.js";

test("client demo PIN requires an explicit 4 to 6 digit secret", () => {
  assert.deepEqual(parseClientDemoPin("4821"), { valid: true, pin: "4821" });
  assert.deepEqual(parseClientDemoPin(""), { valid: true, pin: null });
  assert.equal(parseClientDemoPin("123").valid, false);
  assert.equal(parseClientDemoPin("12ab").valid, false);
  assert.equal(verifyClientDemoPin("1234", null), false);
  assert.equal(verifyClientDemoPin("4821", "4821"), true);
  assert.equal(verifyClientDemoPin("0000", "4821"), false);
});

test("share modal never reveals the saved PIN and explains its internal-demo scope", () => {
  const project = generateSite({ name: "Atelier Test", tradeId: "paysagiste", city: "Montauban" });
  project.settings.clientDemoPin = "4821";
  const html = renderShareModal(project, "demo");

  assert.doesNotMatch(html, /4821/);
  assert.match(html, /type="password"/);
  assert.match(html, /protège uniquement la présentation ouverte via Artist/);
  assert.match(html, /export HTML ou ZIP reste un site public/);
});

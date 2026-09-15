import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { renderWizardModal } from "../public/js/components/wizard.js";

test("wizard labels are explicitly associated with every named form control", () => {
  const html = renderWizardModal();
  for (const id of [
    "wiz-name", "wiz-trade", "wiz-city", "wiz-phone", "wiz-region",
    "wiz-preset", "wiz-ambiance", "wiz-tone", "wiz-color", "wiz-email"
  ]) {
    assert.match(html, new RegExp(`<label[^>]+for=["']${id}["']`), `missing label for ${id}`);
    assert.match(html, new RegExp(`<(?:input|select)[^>]+id=["']${id}["']`), `missing control ${id}`);
  }
});

test("Google Fonts are linked once and are not re-imported by app CSS", () => {
  const index = fs.readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  const css = fs.readFileSync(new URL("../public/css/app.css", import.meta.url), "utf8");
  assert.equal((index.match(/fonts\.googleapis\.com\/css2/g) || []).length, 1);
  assert.doesNotMatch(css, /@import\s+url\([^)]*fonts\.googleapis\.com/i);
});

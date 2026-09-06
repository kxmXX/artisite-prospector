import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { generateSite } from "../public/js/engine/generator.js";
import { renderWebsiteHTML } from "../public/js/components/renderer.js";
import { FONT_CATALOG } from "../public/js/data/fonts.js";
import { getProjectUiTargets, applyCopilotOperations } from "../public/js/engine/copilot.js";

test("Gold: typography catalog contains at least 20 usable modern fonts", () => {
  assert.ok(FONT_CATALOG.length >= 20);
  assert.equal(new Set(FONT_CATALOG.map(font => font.name)).size, FONT_CATALOG.length);
  assert.ok(FONT_CATALOG.every(font => font.name && font.category));
});

test("Gold: editor IDs are stable, preview IDs remain non-interactive, and sticky bar is rendered", () => {
  const site = generateSite({ name: "Gold Test", tradeId: "paysagiste", phone: "06 12 34 56 78" });
  const editorHTML = renderWebsiteHTML(site, { isEditor: true, includeStickyBar: true });
  const previewHTML = renderWebsiteHTML(site, { isEditor: false, includeStickyBar: true });

  assert.match(editorHTML, /data-ui-id="section-[^"]+"/);
  assert.match(editorHTML, /data-ui-target="true"/);
  assert.match(editorHTML, /sticky-call-bar/);
  assert.match(previewHTML, /data-ui-target="false"/);
  assert.ok(!previewHTML.includes("data-ui-target=\"true\""));
});

test("Gold: targeted Copilot operations preserve unrelated project properties and support Undo-ready mutations", () => {
  const site = generateSite({ name: "Gold Test", tradeId: "paysagiste" });
  const target = [...getProjectUiTargets(site).values()].find(item => item.type === "section");
  assert.ok(target);

  const originalSection = site.sections.find(section => section.id === target.sectionId);
  const originalTitle = originalSection.content?.title;
  const result = applyCopilotOperations(site, [
    { op: "set", targetId: target.targetId, path: "backgroundColor", value: "#112233" }
  ]);

  const updatedSection = result.project.sections.find(section => section.id === target.sectionId);
  assert.equal(result.applied.length, 1);
  assert.equal(updatedSection.settings.customBackground, "#112233");
  assert.equal(updatedSection.content?.title, originalTitle);
  assert.equal(result.project.business.name, site.business.name);
});

test("Gold: navigation implementation keeps sidebar and canvas scroll hosts separate", async () => {
  const source = await readFile(new URL("../public/js/app.js", import.meta.url), "utf8");
  assert.match(source, /scrollSidebarCardIntoView/);
  assert.match(source, /canvas\?\.closest\("main"\)/);
  assert.match(source, /scrollHost\.scrollTo\(\{[\s\S]*behavior: "smooth"/);
  assert.match(source, /handleSectionNavigation\(sectionId, event\)/);
  assert.doesNotMatch(source, /updateSelectedSectionUI\([\s\S]{0,250}card\.scrollIntoView/);
});

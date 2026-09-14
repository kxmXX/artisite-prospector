import test from "node:test";
import assert from "node:assert/strict";
import { generateSite, generateDemoSite } from "../public/js/engine/generator.js";
import { renderWebsiteHTML } from "../public/js/components/renderer.js";
import { readFile } from "node:fs/promises";

test("vitrine quote CTAs resolve to a visible, labelled contact form", () => {
  for (const create of [generateSite, generateDemoSite]) {
    const project = create({ name: "Atelier Test", tradeId: "paysagiste", phone: "06 00 00 00 00" });
    const quote = project.sections.find(section => section.type === "quoteSimulator");
    assert.equal(quote.visibility, true, "a quote CTA must retain its destination");

    const html = renderWebsiteHTML(project);
    assert.match(html, /id="simulateur"/);
    assert.match(html, /href="#simulateur"/);
    assert.doesNotMatch(html, /#quoteSimulator/);
    assert.match(html, /for="quote-name-/);
    assert.match(html, /autocomplete="tel"/);
    assert.match(html, /Cette démo prépare votre demande localement/);
    assert.match(html, /href="tel:0600000000"/);
  }
});

test("the quote form does not claim delivery before a real endpoint exists", () => {
  const project = generateSite({ name: "Atelier Test", tradeId: "menuisier" });
  const html = renderWebsiteHTML(project);
  assert.match(html, /Votre demande est prête/);
  assert.match(html, /Pour l'envoyer réellement/);
  assert.doesNotMatch(html, /Demande bien enregistrée/);
  assert.doesNotMatch(html, /recontactera sous 24h/);
});

test("public CTA wrappers do not receive the editor popover click interception", async () => {
  const appSource = await readFile(new URL("../public/js/app.js", import.meta.url), "utf8");
  assert.match(appSource, /wrapper\.dataset\.uiTarget !== "true"\) return/);
  assert.match(appSource, /state\.currentView === "preview" \|\| state\.editorMode === "preview"/);
  assert.match(appSource, /is-hero-obscured/);
});

test("paysagiste vitrine keeps its location template wide and bound to editable data", async () => {
  const project = generateSite({ name: "Atelier Test", tradeId: "paysagiste", city: "Albi" });
  const header = project.sections.find(section => section.type === "header");
  const about = project.sections.find(section => section.type === "about");
  const hours = project.sections.find(section => section.type === "hours");
  header.content.links = [];
  about.content.certified = "";
  hours.visibility = true;
  hours.content.address = "Albi, France";

  const html = renderWebsiteHTML(project);
  const css = await readFile(new URL("../public/css/app.css", import.meta.url), "utf8");

  assert.match(html, />Services<\/a>/);
  assert.match(html, />À propos<\/a>/);
  assert.doesNotMatch(html, /Artisan certifié/);
  assert.match(html, /maps\.google\.com\/maps\?q=Albi%2C%20France/);
  assert.doesNotMatch(html, /map-montauban\.png/);
  assert.match(css, /\.lg\\:col-span-6 \{ grid-column: span 6 \/ span 6; \}/);
});

test("new paysagiste vitrines do not invent a certification", () => {
  const project = generateSite({ name: "Atelier Test", tradeId: "paysagiste" });
  const about = project.sections.find(section => section.type === "about");
  assert.equal(about.content.certified, "");
  assert.doesNotMatch(renderWebsiteHTML(project), /Artisan certifié/);
});

test("the demo map visual remains replaceable in the editor", () => {
  const project = generateDemoSite({ name: "Esprit Nature", tradeId: "paysagiste", city: "Montauban" });
  const html = renderWebsiteHTML(project, { isEditor: true });
  assert.match(html, /fieldPath: "mapImage"|openImagePicker\('[^']+', 'mapImage'/);
  assert.match(html, /images\/map-montauban\.png/);
});

test("the hours and location template keeps a real mobile stack", () => {
  const project = generateDemoSite({ name: "Esprit Nature", tradeId: "paysagiste", city: "Montauban" });
  const hours = project.sections.find(section => section.type === "hours");
  hours.visibility = true;

  const html = renderWebsiteHTML(project);

  assert.match(html, /grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch/);
  assert.match(html, /lg:col-span-6[^>]*min-h-\[380px\] sm:min-h-\[440px\]/);
  assert.match(html, /<svg[^>]*text-\[#527c22\][^>]*>/);
  assert.doesNotMatch(html, />📍</);
});

test("desktop vitrine navigation keeps a deliberate gap between links", async () => {
  const css = await readFile(new URL("../public/css/app.css", import.meta.url), "utf8");
  assert.match(css, /\.gap-7 \{ gap: 1\.75rem; \}/);
});

test("paysagiste vitrine keeps its fixed one-page navigation and generous editorial proportions", async () => {
  const project = generateDemoSite({ name: "Esprit Nature", tradeId: "paysagiste", city: "Montauban" });
  const html = renderWebsiteHTML(project);
  const css = await readFile(new URL("../public/css/app.css", import.meta.url), "utf8");

  for (const label of ["Services", "À propos", "Avis", "Galerie", "FAQ"]) {
    assert.match(html, new RegExp(`>${label}</a>`));
  }
  assert.match(html, /class="sticky top-0 z-50/);
  assert.match(html, /vitrine-shell/);
  assert.match(html, /lg:col-span-6 order-1/);
  assert.match(html, /lg:col-span-6 order-2/);
  assert.match(html, /vitrine-about-image/);
  assert.match(css, /\.vitrine-shell \{ max-width: 96rem; \}/);
  assert.match(css, /\.vitrine-about-image \{ min-height: 32rem; \}/);
  assert.match(css, /scroll-margin-top: 6rem/);
});

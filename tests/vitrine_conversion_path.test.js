import test from "node:test";
import assert from "node:assert/strict";
import { generateSite, generateDemoSite } from "../public/js/engine/generator.js";
import { renderWebsiteHTML } from "../public/js/components/renderer.js";
import { exportStandaloneHTML } from "../public/js/engine/exporter.js";
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

test("the demo hours block defaults to an interactive map and keeps image mode editable", async () => {
  const project = generateDemoSite({ name: "Esprit Nature", tradeId: "paysagiste", city: "Montauban" });
  const hours = project.sections.find(section => section.type === "hours");
  assert.equal(hours.visibility, true);
  assert.equal(hours.content.mapMode, "interactive");
  assert.equal(hours.content.subtitle, "Montauban");

  const html = renderWebsiteHTML(project, { isEditor: false });
  assert.match(html, /title="Carte Horaires et Lieu"/);
  assert.match(html, /maps\.google\.com\/maps\?q=Montauban%2C%20France/);
  assert.match(html, /allowfullscreen/);

  const editorSource = await readFile(new URL("../public/js/components/editor.js", import.meta.url), "utf8");
  assert.match(editorSource, /Interactive Google Maps/);
  assert.match(editorSource, /Choisir l'image de carte/);
  assert.match(editorSource, /openImagePicker\('\$\{sectionId\}', 'mapImage'\)/);
});

test("the hours and location template keeps a real mobile stack", () => {
  const project = generateDemoSite({ name: "Esprit Nature", tradeId: "paysagiste", city: "Montauban" });
  const hours = project.sections.find(section => section.type === "hours");
  hours.visibility = true;

  const html = renderWebsiteHTML(project);

  assert.match(html, /grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch/);
  assert.match(html, /lg:col-span-6[^>]*vitrine-hours-map/);
  assert.match(html, /vitrine-hours-card/);
  assert.match(html, /<svg[^>]*text-\[#527c22\][^>]*>/);
  assert.doesNotMatch(html, />📍</);
});

test("desktop vitrine navigation keeps a deliberate gap between links", async () => {
  const css = await readFile(new URL("../public/css/app.css", import.meta.url), "utf8");
  assert.match(css, /\.gap-7 \{ gap: 1\.75rem; \}/);
});

test("paysagiste vitrine keeps its fixed one-page navigation and generous editorial proportions", async () => {
  const project = generateDemoSite({ name: "Esprit Nature", tradeId: "paysagiste", city: "Montauban" });
  const hours = project.sections.find(section => section.type === "hours");
  if (hours) hours.visibility = true;
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
  assert.match(css, /\.max-w-7xl\.vitrine-shell \{ max-width: 112rem; \}/);
  assert.match(html, /vitrine-site-header[\s\S]{0,420}max-w-7xl vitrine-shell/, "header must share the About canvas");
  for (const id of ["services", "about", "galerie", "avis", "horaires", "faq"]) {
    const start = html.indexOf(`id="${id}"`);
    assert.notEqual(start, -1, `${id} must be rendered`);
    assert.match(html.slice(start, start + 420), /max-w-7xl vitrine-shell/, `${id} must share the About canvas`);
  }
  assert.match(html, /vitrine-section-title/);
  assert.match(html, /vitrine-service-card-body/);
  assert.match(css, /\.vitrine-review-grid \{ max-width: 96rem; \}/);
  assert.match(css, /\.vitrine-hours-grid \{ max-width: 92rem; \}/);
  assert.match(css, /\.max-w-7xl\.vitrine-faq-shell \{ max-width: 112rem; \}/);
  assert.match(css, /\.vitrine-faq-list \{ max-width: 80rem; \}/);
  assert.match(css, /\.vitrine-about-image \{ min-height: 32rem; \}/);
  assert.match(css, /max-width: 1023px[^}]*vitrine-about-grid[^}]*grid-template-columns: minmax\(0, 1fr\)/s);
  assert.match(css, /max-width: 639px[^}]*vitrine-about-image[^}]*min-height: 0/s);
  assert.match(css, /scroll-margin-top: 5rem/);
  assert.match(html, /vitrine-site-nav/);
  assert.match(html, /vitrine-site-footer/);
  assert.doesNotMatch(html, /sticky-call-bar/);
  assert.match(css, /vitrine-section-arrival/);
  assert.match(css, /site-section\[data-section-type="header"\][^{]*\{\s*position: sticky/);
});

test("paysagiste reviews and FAQ preserve the spacious vitrine rhythm", () => {
  const project = generateDemoSite({ name: "Esprit Nature", tradeId: "paysagiste", city: "Montauban" });
  const html = renderWebsiteHTML(project);

  assert.match(html, /data-review-summary/);
  assert.match(html, /vitrine-review-grid/);
  assert.match(html, /vitrine-review-card/);
  assert.match(html, /vitrine-review-copy/);
  assert.match(html, /vitrine-faq-shell/);
  assert.match(html, /vitrine-faq-list/);
  assert.match(html, /faq-item group\/faq transition-colors py-6 sm:py-7/);
});

test("standalone vitrine export retains navigation offsets and editorial proportions", () => {
  const project = generateDemoSite({ name: "Esprit Nature", tradeId: "paysagiste", city: "Montauban" });
  const html = exportStandaloneHTML(project);

  assert.match(html, /\.max-w-7xl\.vitrine-shell \{ max-width: 112rem; \}/);
  assert.match(html, /\.vitrine-review-grid \{ max-width: 96rem; \}/);
  assert.match(html, /\.vitrine-hours-grid \{ max-width: 92rem; \}/);
  assert.match(html, /\.max-w-7xl\.vitrine-faq-shell \{ max-width: 112rem; \}/);
  assert.match(html, /\.vitrine-faq-list \{ max-width: 80rem; \}/);
  assert.match(html, /scroll-margin-top: 5rem/);
  assert.ok(html.includes('.md\\:flex { display: flex !important; }'), "standalone desktop navigation must override hidden");
  assert.match(html, /vitrine-site-header-inner \{ min-height: 5rem; max-width: 80rem !important; \}/);
  assert.match(html, /\.lg\\:col-span-6 \{ grid-column: span 6 \/ span 6; \}/);
  assert.match(html, /\.vitrine-faq-shell \.faq-item \{ border: 0;/);
  assert.match(html, /href="#services"/);
  assert.match(html, /href="#faq"/);
});

test("Esprit Nature demo matches the reference About and FAQ copy hierarchy", () => {
  const project = generateDemoSite({ name: "Esprit Nature", tradeId: "paysagiste", city: "Montauban" });
  const about = project.sections.find(section => section.type === "about");
  const faq = project.sections.find(section => section.type === "faq");
  const html = renderWebsiteHTML(project);

  assert.equal(about.content.certified, "Artisan certifié");
  assert.equal(faq.content.badge, "FAQ");
  assert.equal(faq.content.title, "Questions fréquentes");
  assert.match(html, /Artisan certifié/);
  assert.match(html, /data-editable="badge">\s*FAQ\s*<\/div>/);
  assert.match(html, /data-editable="title">\s*Questions fréquentes\s*<\/h2>/);
});

test("paysagiste navigation labels stay editable without losing required one-page destinations", () => {
  const project = generateDemoSite({ name: "Esprit Nature", tradeId: "paysagiste", city: "Montauban" });
  const header = project.sections.find(section => section.type === "header");
  header.content.links[0].label = "Prestations";
  const html = renderWebsiteHTML(project);

  assert.match(html, />Prestations<\/a>/);
  for (const href of ["#services", "#about", "#avis", "#galerie", "#faq"]) {
    assert.match(html, new RegExp(`href="${href}"`));
  }
});

test("editor exposes the vitrine template content controls", async () => {
  const editorSource = await readFile(new URL("../public/js/components/editor.js", import.meta.url), "utf8");
  const appSource = await readFile(new URL("../public/js/app.js", import.meta.url), "utf8");

  for (const marker of [
    "Identité & Navigation Vitrine",
    "À propos — contenu du template",
    "Avis clients (",
    "Horaires & carte",
    "Simulateur de devis",
    "Pied de page",
    "updateListField('${sectionId}', 'types'",
    "services.${sIdx}.image",
    "Choisir l'image de carte"
  ]) assert.ok(editorSource.includes(marker), `missing vitrine editor control: ${marker}`);
  assert.match(appSource, /addReviewItem\(sectionId\)/);
  assert.match(appSource, /removeReviewItem\(sectionId, idx\)/);
  assert.match(appSource, /updateListField\(sectionId, field, rawValue\)/);
});

test("quote simulator exposes editable urgency choices in the rendered conversion form", () => {
  const project = generateDemoSite({ name: "Esprit Nature", tradeId: "paysagiste", city: "Montauban" });
  const quote = project.sections.find(section => section.type === "quoteSimulator");
  quote.content.urgencyLabel = "Quand intervenir ?";
  quote.content.urgencyOptions = ["Cette semaine", "Le mois prochain"];
  const html = renderWebsiteHTML(project);
  assert.match(html, /data-editable="urgencyLabel">Quand intervenir \?<\/label>/);
  assert.match(html, /<option value="Cette semaine">Cette semaine<\/option>/);
  assert.match(html, /<option value="Le mois prochain">Le mois prochain<\/option>/);
});

test("vitrine keeps every anchored section paintable while editor mode stays explicit", async () => {
  const project = generateDemoSite({ name: "Esprit Nature", tradeId: "paysagiste", city: "Montauban" });
  const preview = renderWebsiteHTML(project, { isEditor: false });
  const editor = renderWebsiteHTML(project, { isEditor: true });
  const css = await readFile(new URL("../public/css/app.css", import.meta.url), "utf8");

  assert.match(preview, /artisite-root public-mode vitrine-template/);
  assert.match(editor, /artisite-root editor-mode vitrine-template/);
  assert.doesNotMatch(preview, /apple-scrollfx-enabled/);
  assert.match(css, /public-mode:not\(\.vitrine-template\)/);
  assert.doesNotMatch(css, /:not\(\.editor-mode\) \.site-section/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { generateSite } from "../public/js/engine/generator.js";

// Mock minimal localStorage
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

const { state } = await import("../public/js/state.js");

test("state manager handles project CRUD, duplication and selection", () => {
  assert.ok(state.projects.length >= 1, "Should seed initial sample projects");

  const initialCount = state.projects.length;
  const newProj = generateSite({ name: "Atelier Test", tradeId: "menuisier" });
  state.addProject(newProj, false);

  assert.equal(state.projects.length, initialCount + 1);
  assert.equal(state.projects[0].name, "Atelier Test");

  // Duplicate
  const dup = state.duplicateProject(newProj.id);
  assert.ok(dup);
  assert.ok(dup.name.includes("Copie"));
  assert.equal(state.projects.length, initialCount + 2);

  // Delete
  state.deleteProject(dup.id);
  state.deleteProject(newProj.id);
  assert.equal(state.projects.length, initialCount);
});

test("state manager supports Undo / Redo history for section modifications", () => {
  const p = generateSite({ name: "Undo Test", tradeId: "plombier" });
  state.addProject(p, true);

  const heroSec = p.sections.find(s => s.type === "hero");
  assert.ok(heroSec);

  const originalTitle = heroSec.content.title;

  // Modify title
  state.updateSectionContent(heroSec.id, "title", "Titre Modifié");
  assert.equal(state.currentProject.sections.find(s => s.id === heroSec.id).content.title, "Titre Modifié");
  assert.equal(state.canUndo(), true);

  // Undo
  state.undo();
  assert.equal(state.currentProject.sections.find(s => s.id === heroSec.id).content.title, originalTitle);
  assert.equal(state.canRedo(), true);

  // Redo
  state.redo();
  assert.equal(state.currentProject.sections.find(s => s.id === heroSec.id).content.title, "Titre Modifié");
});

test("state manager handles section moving and visibility toggling", () => {
  const p = generateSite({ name: "Move Test", tradeId: "couvreur" });
  state.addProject(p, true);

  const sec1 = state.currentProject.sections[0];
  const sec2 = state.currentProject.sections[1];

  // Move section 0 down
  state.moveSection(sec1.id, "down");
  assert.equal(state.currentProject.sections[1].id, sec1.id);
  assert.equal(state.currentProject.sections[0].id, sec2.id);

  // Toggle visibility
  assert.equal(state.currentProject.sections[1].visibility, true);
  state.toggleSectionVisibility(sec1.id);
  assert.equal(state.currentProject.sections[1].visibility, false);
});

test("state manager handles reorderSections (drag-and-drop) correctly", () => {
  const p = generateSite({ name: "Reorder Test", tradeId: "menuisier" });
  state.addProject(p, true);

  const id0 = state.currentProject.sections[0].id;
  const id1 = state.currentProject.sections[1].id;
  const id2 = state.currentProject.sections[2].id;

  // Move section 0 after section 2
  state.reorderSections(id0, id2, "after");
  assert.equal(state.currentProject.sections[0].id, id1);
  assert.equal(state.currentProject.sections[1].id, id2);
  assert.equal(state.currentProject.sections[2].id, id0);

  // Undo restores original order
  state.undo();
  assert.equal(state.currentProject.sections[0].id, id0);
  assert.equal(state.currentProject.sections[1].id, id1);
});

test("state manager handles addSection, variant changes and deep array paths", () => {
  const p = generateSite({ name: "AddSection Test", tradeId: "boulanger" });
  state.addProject(p, true);

  const initialSecCount = state.currentProject.sections.length;

  // Add a new section
  state.addSection({
    type: "faq",
    variant: "accordion",
    content: { badge: "Questions", items: [{ q: "Horaires ?", a: "6h-20h" }] }
  });

  assert.equal(state.currentProject.sections.length, initialSecCount + 1);
  const newSec = state.currentProject.sections.find(s => s.content.badge === "Questions");
  assert.ok(newSec);
  assert.equal(newSec.variant, "accordion");

  // Change section variant
  state.updateSectionVariant(newSec.id, "cards");
  assert.equal(state.currentProject.sections.find(s => s.id === newSec.id).variant, "cards");

  // Deep array path update: items.0.q
  state.updateSectionContent(newSec.id, "items.0.q", "Pains bio ?");
  assert.equal(state.currentProject.sections.find(s => s.id === newSec.id).content.items[0].q, "Pains bio ?");
});


test("state init preserves an existing customized demo project", async () => {
  const previousStore = { ...global.localStorage.store };
  const customized = [{
    id: "proj-esprit-nature",
    name: "Esprit Nature personnalisé",
    sections: [],
    branding: {},
    business: { name: "Esprit Nature personnalisé" }
  }];
  global.localStorage.store = { artisite_projects_v11: JSON.stringify(customized) };
  const freshModule = await import(`../public/js/state.js?preserve-demo=${Date.now()}`);
  assert.equal(freshModule.state.projects[0].name, "Esprit Nature personnalisé");
  global.localStorage.store = previousStore;
});

for (const storageKey of ["artisite_projects_v11", "artisite_projects_v5", "artisite_projects_v4"]) {
  test(`loading ${storageKey} preserves complete custom project data`, async () => {
    const previousStore = global.localStorage.store;
    const projects = [{
      id: "proj-esprit-nature", name: "Mon jardin",
      business: { name: "Mon jardin", phone: "", customField: "conservé" },
      branding: { primaryColor: "#123456", buttonRadius: "0px" },
      sections: [{ id: "faq-custom", type: "faq", visibility: false,
        content: { items: [{ q: "Ma question", a: "Ma réponse" }] }, settings: { motion: "none" } }]
    }, { id: "client-2", name: "Autre client", sections: [] }];
    global.localStorage.store = { [storageKey]: JSON.stringify(projects) };
    try {
      const fresh = await import(`../public/js/state.js?preserve=${storageKey}`);
      assert.deepEqual(fresh.state.projects, projects);
      assert.deepEqual(fresh.state.currentProject, projects[0]);
      assert.deepEqual(JSON.parse(global.localStorage.getItem("artisite_projects_v11")), projects);
    } finally {
      global.localStorage.store = previousStore;
    }
  });
}

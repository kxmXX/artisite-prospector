import { generateSite } from "../engine/generator.js";
import { createEspritNatureDemoProject } from "./sampleProjects.js";

const clone = value => JSON.parse(JSON.stringify(value));

export const SITE_TEMPLATES = [
  {
    id: "esprit-reference",
    name: "Esprit Nature — Référence 1:1",
    description: "La vitrine éditoriale de référence : hero photo, récit, services, galerie, horaires, avis et FAQ.",
    presetId: "nature-premium",
    badge: "Référence"
  },
  {
    id: "artisan-modern",
    name: "Artisan Moderne",
    description: "Direction plus technique et directe pour bâtiment, dépannage et services à forte réassurance.",
    presetId: "artisan-moderne",
    badge: "Conversion"
  },
  {
    id: "local-warm",
    name: "Local Chaleureux",
    description: "Direction plus douce et locale pour commerce, restauration, artisanat et métiers de proximité.",
    presetId: "local-chaleureux",
    badge: "Local"
  }
];

export function getSiteTemplate(templateId) {
  return SITE_TEMPLATES.find(template => template.id === templateId) || SITE_TEMPLATES[0];
}

export function getDefaultTemplateIdForTrade(tradeId) {
  if (tradeId === "paysagiste") return "esprit-reference";
  if (["restaurant", "restaurateur", "boulanger", "coiffeur", "menuisier"].includes(tradeId)) return "local-warm";
  return "artisan-modern";
}

function instantiateReferenceTemplate(input, template) {
  const generated = generateSite({ ...input, templateId: template.id, presetId: input.presetId || template.presetId });
  const reference = createEspritNatureDemoProject();
  const generatedByType = new Map(generated.sections.map(section => [section.type, section]));
  const sections = reference.sections.map(referenceSection => {
    const source = generatedByType.get(referenceSection.type);
    if (!source) return clone(referenceSection);
    return {
      ...clone(referenceSection),
      id: source.id,
      visibility: referenceSection.visibility,
      content: clone(source.content),
      settings: { ...clone(source.settings || {}), ...clone(referenceSection.settings || {}) }
    };
  });
  const project = {
    ...generated,
    sections,
    templateId: template.id,
    templateName: template.name,
    isDemo: false,
    dataProvenance: "template-instance"
  };
  delete project.freeformLayout;
  delete project.freeformGroups;
  return project;
}

export function instantiateSiteTemplate(templateId, input = {}) {
  const template = getSiteTemplate(templateId);
  if (template.id === "esprit-reference") return instantiateReferenceTemplate(input, template);
  const project = generateSite({ ...input, templateId: template.id, presetId: input.presetId || template.presetId });
  project.templateId = template.id;
  project.templateName = template.name;
  project.dataProvenance = "template-instance";
  return project;
}

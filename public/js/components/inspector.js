import { getIcon } from "./icons.js";
import { SECTION_DEFINITIONS } from "./addSectionModal.js";
import { getSectionFriendlyTitle } from "./editor.js";
import {
  COMPONENT_INTELLIGENCE_REGISTRY,
  calculateComponentConfidence,
  verifyAccessibility,
  detectAntiPatterns
} from "../engine/componentIntelligence.js";
import { escapeHtml } from "../utils/html.js";
import { SECTION_WIDTHS, SECTION_SPACING, SECTION_ALIGN, getSectionLayout } from "../engine/sectionStyle.js";
import { ELEMENT_PADDING, ELEMENT_RADIUS, ELEMENT_FONT, ELEMENT_OPACITY, ELEMENT_BACKGROUND, ELEMENT_BORDER, ELEMENT_SHADOW, getElementStyle } from "../engine/elementStyle.js";
import { ELEMENT_STATES, ELEMENT_STATE_LABELS, ELEMENT_STATE_DESCRIPTIONS, getElementState } from "../engine/elementStates.js";
import { MOTION_PRESETS, MOTION_SPEEDS, MOTION_DELAYS, MOTION_EASINGS } from "../data/motionPresets.js";
import { TRANSFORM_FIELDS, getElementTransform, hasElementTransform } from "../engine/elementTransform.js";
import { collectSectionElements } from "./renderer.js";
import { numberedLabels } from "../data/elementLabels.js";
import { INSPIRATION_PATTERNS } from "../data/inspiration.js";

/**
 * Divulgation progressive : l'inspecteur montre d'abord l'essentiel — choisir une
 * animation — et garde les réglages de rythme derrière « Réglages avancés ». L'état
 * est retenu par module pour survivre au nouveau rendu du panneau après chaque
 * modification : sans cela, le panneau se refermerait à chaque clic.
 */
const DISCLOSURE_STATE = new Map();

export function isDisclosureOpen(key) {
  return DISCLOSURE_STATE.get(key) === true;
}

export function rememberDisclosure(key, isOpen) {
  DISCLOSURE_STATE.set(key, isOpen === true);
}

if (typeof window !== "undefined") {
  window.artistRememberDisclosure = (key, isOpen) => rememberDisclosure(key, isOpen);
}

function disclosure(key, summary, body) {
  const open = isDisclosureOpen(key) ? " open" : "";
  return `<details class="ui-disclosure" data-disclosure="${key}"${open} ontoggle="window.artistRememberDisclosure('${key}', this.open)">
            <summary class="ui-disclosure-summary">${summary}</summary>
            <div class="ui-disclosure-body">${body}</div>
          </details>`;
}

const ELEMENT_SCALE_ROWS = [
  ["padding", ELEMENT_PADDING],
  ["radius", ELEMENT_RADIUS],
  ["font", ELEMENT_FONT],
  ["opacity", ELEMENT_OPACITY],
  ["background", ELEMENT_BACKGROUND],
  ["border", ELEMENT_BORDER],
  ["shadow", ELEMENT_SHADOW]
];

/**
 * Réglages de l'élément sélectionné (clé de mise en page stable).
 * Construit par concaténation, sans valeur libre : tout vient d'énumérations.
 */
/**
 * Position et taille de l'element selectionne, en nombres.
 * Les champs restent vides tant que l'auteur n'a rien saisi : un element sans
 * valeur reste dans le flux normal. C'est la position libre « en option ».
 */


/**
 * Liste des elements de la section.
 *
 * C'est le seul chemin decouvrable vers les reglages d'element : sans elle, la
 * selection d'element n'existait qu'en selection libre, c'est-a-dire derriere un
 * geste de glisser que rien dans l'interface n'annoncait.
 */
const LIST_LABELS = {
  reviews: "Avis", services: "Services", photos: "Photos", items: "Éléments",
  links: "Liens", badges: "Badges", points: "Points forts", citiesCovered: "Villes",
  stickers: "Autocollants", types: "Types", sizes: "Tailles", urgencyOptions: "Options d'urgence"
};

/** Ajout : seules les listes dont l'application sait fabriquer une entree complete. */
const LIST_ADDERS = {
  "reviews:reviews": { method: "addReviewItem", arg: "" },
  "services:services": { method: "addServiceItem", arg: "" },
  "faq:items": { method: "addFaqItem", arg: "" },
  "gallery:photos": { method: "addGalleryItem", arg: ", 'photo'" }
};

/**
 * Listes de la section : ajouter et retirer des entrees.
 *
 * Ces controles vivaient uniquement dans un gabarit jamais rendu
 * (`renderSectionAccordionContent`, 837 lignes inertes). Sans eux, on pouvait
 * modifier un avis existant mais ni en ajouter ni en supprimer un.
 */
const FIELD_SIZE_ROWS = [
  { field: "title", label: "Titre" },
  { field: "subtitle", label: "Sous-titre" },
  { field: "text", label: "Texte" }
];

/**
 * Reglages de contenu qui n'existaient que dans le gabarit mort : assombrissement
 * du hero, taille des champs, et motifs d'inspiration.
 */
const GALLERY_RATIOS = [
  { id: "4/3", label: "4/3" },
  { id: "16/9", label: "16/9" },
  { id: "1/1", label: "Carré" }
];

/**
 * Galerie : format d'image et nature de chaque entree.
 * Ces deux controles vivaient dans le gabarit jamais rendu — on pouvait voir la
 * galerie mais ni choisir son format, ni basculer une entree en comparatif.
 */
function sectionGalleryHTML(section, sectionId) {
  const photos = section?.content?.photos;
  if (!Array.isArray(photos)) return "";
  const current = section?.settings?.aspectRatio || "4/3";
  const isBeforeAfter = (item) => item?.type === "beforeAfter" || (item?.beforeImage && item?.afterImage);
  return `
    <div class="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
      <label class="text-ui-xs font-bold uppercase tracking-wider text-zinc-700">Format de la galerie</label>
      <div class="flex flex-wrap gap-1">
        ${GALLERY_RATIOS.map((ratio) => `
          <button type="button" class="motion-loop-btn ${current === ratio.id ? 'is-active' : ''}"
                  onclick="window.app.setGalleryAspectRatio('${sectionId}', '${ratio.id}')">${ratio.label}</button>`).join("")}
      </div>
      ${photos.length ? `<div class="space-y-1">${photos.map((photo, index) => `
        <div class="flex items-center justify-between gap-2 text-ui-xs text-zinc-600">
          <span>#${index + 1} ${isBeforeAfter(photo) ? "Comparatif Avant/Après" : "Photo"}</span>
          <button type="button" class="text-ui-2xs text-zinc-600 font-semibold border border-zinc-200 rounded-md px-1.5 py-0.5 bg-white"
                  onclick="window.app.toggleGalleryItemType('${sectionId}', ${index})">${isBeforeAfter(photo) ? "En photo" : "En comparatif"}</button>
        </div>`).join("")}</div>` : ''}
    </div>`;
}

/**
 * Boutons masques : le seul endroit pour les remettre.
 * Sans ce bloc, retirer un bouton etait definitif dans l'interface.
 */
/**
 * Carte du bloc horaires : mode d'affichage et image personnalisee.
 * Ce reglage n'existait que dans le gabarit jamais rendu.
 */
function sectionMapHTML(section, sectionId) {
  if (section?.type !== "hours") return "";
  const content = section?.content || {};
  const mode = content.mapMode || "interactive";
  return `
    <div class="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
      <label class="text-ui-xs font-bold uppercase tracking-wider text-zinc-700">Carte</label>
      <select class="w-full px-2 py-1 border border-zinc-200 rounded-md text-ui-xs bg-white text-zinc-800"
              onchange="window.app.updateSectionContent('${sectionId}', 'mapMode', this.value)">
        <option value="interactive" ${mode === "interactive" ? "selected" : ""}>Carte interactive</option>
        <option value="image" ${mode === "image" ? "selected" : ""}>Image personnalisée</option>
      </select>
      <div class="flex items-center gap-2">
        ${content.mapImage ? `<img src="${content.mapImage}" alt="Carte" class="w-20 h-12 rounded border border-zinc-200 object-cover">` : ''}
        <button type="button" class="text-ui-2xs font-semibold text-zinc-700 border border-zinc-200 rounded-md px-2 py-1 bg-white hover:border-zinc-400"
                onclick="window.app.openImagePicker('${sectionId}', 'mapImage')">Choisir l'image de carte</button>
      </div>
    </div>`;
}

function sectionButtonsHTML(section, sectionId) {
  const hidden = Array.isArray(section?.settings?.hiddenButtons) ? section.settings.hiddenButtons : [];
  const targets = [["primary", "Bouton principal"], ["phone", "Bouton téléphone"]].filter((pair) => hidden.includes(pair[0]));
  if (!targets.length) return "";
  return `
    <div class="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
      <label class="text-ui-xs font-bold uppercase tracking-wider text-zinc-700">Boutons masqués</label>
      ${targets.map((pair) => `
        <button type="button" class="w-full py-1 bg-white hover:bg-zinc-100 text-zinc-700 rounded-lg text-ui-xs font-semibold border border-zinc-200"
                onclick="window.app.restoreButton('${sectionId}', '${pair[0]}')">Restaurer : ${pair[1]}</button>`).join("")}
    </div>`;
}

function sectionContentSettingsHTML(section, sectionId) {
  const settings = section?.settings || {};
  const darkening = settings.overlayDarkening !== undefined ? settings.overlayDarkening : 45;
  const sizeRow = (row) => {
    const value = Number(settings["fontSize_" + row.field]) || 0;
    return `
      <label class="block space-y-1">
        <span class="text-ui-2xs uppercase tracking-wider text-zinc-500">${row.label}</span>
        <input type="range" min="-8" max="24" step="1" value="${value}" class="w-full"
               oninput="window.app.adjustFieldFontSizeSlider('${sectionId}', '${row.field}', this.value)">
      </label>`;
  };
  return disclosure("section-content-settings", "Réglages avancés : contenu et inspiration", `
    ${section?.type === "hero" ? `
      <label class="block space-y-1">
        <span class="text-ui-2xs uppercase tracking-wider text-zinc-500">Assombrissement du hero</span>
        <input type="range" min="0" max="100" step="5" value="${darkening}" class="w-full"
               oninput="window.app.setHeroOverlayDarkening('${sectionId}', this.value)">
      </label>` : ''}
    ${FIELD_SIZE_ROWS.map(sizeRow).join("")}
    <div class="space-y-1">
      <span class="text-ui-2xs uppercase tracking-wider text-zinc-500">Motifs d'inspiration</span>
      <div class="flex flex-wrap gap-1">
        ${INSPIRATION_PATTERNS.slice(0, 6).map((pattern) => `
          <button type="button" class="motion-loop-btn" title="${pattern.description}"
                  onclick="window.app.applyInspirationPattern('${sectionId}', '${pattern.id}')">${pattern.label}</button>
        `).join("")}
      </div>
    </div>
  `);
}

function sectionListsHTML(section, sectionId) {
  const content = section?.content || {};
  const lists = Object.keys(content).filter((key) => Array.isArray(content[key]));
  if (!lists.length) return "";
  const itemLabel = (item, index) => {
    if (typeof item === "string") return item;
    const candidate = item && (item.title || item.label || item.name || item.text || item.role);
    return candidate ? String(candidate) : "Élément " + (index + 1);
  };
  return `
    <div class="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
      <label class="text-ui-xs font-bold uppercase tracking-wider text-zinc-700">Listes de la section</label>
      ${lists.map((key) => {
        const items = content[key];
        const adder = LIST_ADDERS[section.type + ":" + key];
        return `
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-ui-2xs uppercase tracking-wider text-zinc-500">${LIST_LABELS[key] || key} · ${items.length}</span>
            ${adder ? `<button type="button" class="text-ui-2xs font-semibold text-zinc-700 border border-zinc-200 rounded-md px-1.5 py-0.5 bg-white hover:border-zinc-400" onclick="window.app.${adder.method}('${sectionId}'${adder.arg})">Ajouter</button>` : ''}
          </div>
          ${items.map((item, index) => `
            <div class="flex items-center justify-between gap-2 text-ui-xs text-zinc-600">
              <span class="truncate">${escapeHtml(itemLabel(item, index))}</span>
              <button type="button" class="text-ui-2xs text-red-600 font-semibold whitespace-nowrap" title="Retirer cette entrée" onclick="window.app.removeListEntry('${sectionId}', '${key}', ${index})">Retirer</button>
            </div>`).join("")}
        </div>`;
      }).join("")}
    </div>
  `;
}

function sectionElementsHTML(section, project, selectedKey) {
  const elements = collectSectionElements(project, section);
  if (!elements.length) return "";
  // Les libelles viennent du module partage : le panneau de proprietes et l'arbre de
  // la structure doivent nommer le meme element de la meme facon.
  const displayed = numberedLabels(elements);
  return `
    <div class="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
      <label class="text-ui-xs font-bold uppercase tracking-wider text-zinc-700">Elements de la section</label>
      <div class="space-y-1">
        ${elements.map((element, index) => {
          const active = element.key === selectedKey;
          return `<button type="button"
                          class="w-full text-left px-2 py-1 rounded-md text-ui-xs border transition-colors ${active ? 'border-zinc-900 bg-zinc-900 text-white font-semibold' : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'}"
                          onclick="window.app.selectElementForEditing('${element.key}')">${displayed[index]}</button>`;
        }).join("")}
      </div>
    </div>
  `;
}

function elementTransformControlsHTML(project, layoutKey, viewport) {
  const values = getElementTransform(project, layoutKey, viewport);
  const positioned = hasElementTransform(project, layoutKey, viewport);
  return `
    <div class="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
      <div class="flex items-center justify-between">
        <label class="text-ui-xs font-bold uppercase tracking-wider text-zinc-700">Position et taille</label>
        <span class="text-ui-2xs font-mono px-1.5 py-0.5 rounded border ${positioned ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-zinc-500 border-zinc-200'}">
          ${positioned ? 'position libre' : 'flux normal'}
        </span>
      </div>
      <div class="grid grid-cols-3 gap-1.5">
        ${TRANSFORM_FIELDS.map((field) => `
          <label class="flex flex-col gap-0.5">
            <span class="text-ui-2xs uppercase tracking-wider text-zinc-500">${field.label}${field.unit === 'px' ? '' : ' ' + field.unit}</span>
            <input type="number" inputmode="decimal" step="${field.step}" data-transform-field="${field.key}"
                   class="px-1.5 py-1 border border-zinc-300 rounded-md text-ui-xs bg-white text-zinc-800"
                   value="${values[field.key] === null ? '' : values[field.key]}" placeholder="auto"
                   title="${field.description}"
                   onchange="window.app.setElementTransformValue('${layoutKey}', '${field.key}', this.value)">
          </label>
        `).join('')}
      </div>
      ${positioned ? `
      <button type="button"
              class="w-full py-1 bg-white hover:bg-zinc-100 text-zinc-700 rounded-lg text-ui-xs font-semibold border border-zinc-200 transition-colors"
              onclick="window.app.resetElementTransform('${layoutKey}')">Revenir au flux</button>` : `
      <p class="text-ui-2xs text-zinc-500">Cet element suit le flux normal. Activez la position libre pour le placer au pixel pres.</p>
      <button type="button"
              class="w-full py-1 bg-white hover:bg-zinc-100 text-zinc-700 rounded-lg text-ui-xs font-semibold border border-zinc-200 transition-colors"
              onclick="window.app.enableElementTransform('${layoutKey}')">Activer la position libre</button>`}
    </div>
  `;
}

function elementStyleControlsHTML(project, layoutKey, activeState, sectionId) {
  const stateName = ELEMENT_STATES.includes(activeState) ? activeState : 'default';
  // Les réglages et leurs valeurs vivent dans deux magasins selon l'état choisi :
  // le style de base de l'élément, ou les écarts de l'état. Une seule grille pilote
  // les deux, ce qui évite deux interfaces à maintenir.
  const values = stateName === 'default'
    ? getElementStyle(project, layoutKey)
    : getElementState(project, layoutKey, stateName);
  const command = stateName === 'default' ? 'setSelectedElementStyle' : 'setSelectedElementStateValue';
  const isActive = (property, id) => Object.prototype.hasOwnProperty.call(values, property) && values[property] === id;

  const stateRow = '<div class="flex flex-wrap gap-1">' + [['default', 'Principal']]
    .concat(ELEMENT_STATES.map(function (name) { return [name, ELEMENT_STATE_LABELS[name]]; }))
    .map(function (pair) {
      const cls = 'motion-loop-btn' + (stateName === pair[0] ? ' is-active' : '');
      const title = pair[0] === 'default' ? "Le style normal de l'element." : (ELEMENT_STATE_DESCRIPTIONS[pair[0]] || '');
      return '<button type="button" class="' + cls + '" title="' + title + '" onclick="window.app.setElementStyleState(\'' + pair[0] + '\')">' + pair[1] + '</button>';
    }).join('') + '</div>';

  const row = (property, scale) => '<div class="flex flex-wrap gap-1">' + Object.keys(scale).map(function (id) {
    const cls = 'motion-loop-btn' + (isActive(property, id) ? ' is-active' : '');
    return '<button type="button" class="' + cls +
      '" onclick="window.app.' + command + '(\'' + property + '\', \'' + id + '\')">' +
      scale[id].label + '</button>';
  }).join('') + '</div>';

  const reset = stateName === 'default'
    ? 'window.app.clearSelectedElementStyle()'
    : 'window.app.clearSelectedElementState()';

  // Divulgation progressive : l'auteur regle d'abord l'espacement et la forme, qui font
  // l'essentiel du travail ; le reste s'ouvre a la demande (mode Operate de la skill).
  const ESSENTIAL_STYLE_ROWS = ["padding", "radius", "font"];
  const essentialRows = ELEMENT_SCALE_ROWS.filter(function (entry) { return ESSENTIAL_STYLE_ROWS.indexOf(entry[0]) >= 0; })
    .map(function (entry) { return row(entry[0], entry[1]); }).join('');
  const advancedRows = ELEMENT_SCALE_ROWS.filter(function (entry) { return ESSENTIAL_STYLE_ROWS.indexOf(entry[0]) < 0; })
    .map(function (entry) { return row(entry[0], entry[1]); }).join('');

  return '<div class="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">' +
    '<label class="block text-ui-xs font-medium text-zinc-500 uppercase tracking-wider">Élément sélectionné</label>' +
    '<div class="text-ui-2xs font-mono text-zinc-400">' + escapeHtml(layoutKey) + '</div>' +
    stateRow +
    '<p class="text-ui-2xs text-zinc-500">Chaque état est une variante : survol = souris dessus, focus clavier = tabulation, actif = pendant le clic.</p>' +
    (stateName === 'default' ? '' : '<p class="text-ui-2xs text-zinc-500">Les réglages suivants ne s\'appliquent qu\'à l\'état « ' + ELEMENT_STATE_LABELS[stateName] + ' ».</p>') +
    essentialRows +
    disclosure('element-advanced', 'R\u00e9glages avanc\u00e9s : opacit\u00e9, fond, bordure, ombre', advancedRows) +
    (stateName === 'default' && sectionId
      ? '<button type="button" onclick="window.app.applyElementStyleToSection(\'' + sectionId + '\')" class="w-full py-1.5 rounded-md border border-zinc-300 bg-zinc-900 text-ui-2xs font-semibold text-white" title="Copier ces réglages sur tous les éléments de la section, par exemple toutes les cartes service">Appliquer à tous les éléments de la section</button>'
      : '') +
    '<button type="button" onclick="' + reset + '" class="w-full py-1.5 rounded-md border border-zinc-200 bg-white text-ui-2xs font-semibold text-zinc-600">' +
      (stateName === 'default' ? 'Revenir au style du thème' : 'Effacer cet état') + '</button>' +
  '</div>';
}

/**
 * Réglages de mise en page de la section : largeur, respiration, alignement.
 * Construit par concaténation pour rester lisible dans un gabarit déjà long.
 */
function sectionLayoutControlsHTML(section, sectionId) {
  const layout = getSectionLayout(section);
  const row = (key, scale) => '<div class="flex flex-wrap gap-1">' + Object.keys(scale).map(function (id) {
    return '<button type="button" class="motion-loop-btn' + (layout[key] === id ? ' is-active' : '') +
      '" onclick="window.app.setSectionLayoutValue(\'' + sectionId + '\', \'' + key + '\', \'' + id + '\')">' +
      scale[id].label + '</button>';
  }).join('') + '</div>';
  return '<div class="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">' +
    '<label class="block text-ui-xs font-medium text-zinc-500 uppercase tracking-wider">Mise en page</label>' +
    row('width', SECTION_WIDTHS) +
    row('spacing', SECTION_SPACING) +
    row('align', SECTION_ALIGN) +
    '<p class="text-ui-xs text-zinc-400">Ces trois réglages ne concernent que cette section.</p>' +
  '</div>';
}

/**
 * Sendpage / Linear Minimalist Inspector Panel.
 * Clean 1px micro-borders, refined typography, and real-time live typing.
 */

export function renderInspector(section, project, state) {
  if (!section) {
    return `
      <div class="p-8 text-center text-zinc-400 space-y-2">
        <div class="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400 border border-zinc-200">
          ${getIcon("sliders", "w-5 h-5")}
        </div>
        <div class="text-xs font-medium text-zinc-600">Aucune section sélectionnée</div>
        <div class="text-ui-sm text-zinc-400">Cliquez sur une section pour ajuster son contenu en direct.</div>
      </div>
    `;
  }

  const c = section.content || {};
  const sectionId = section.id;
  const isHidden = section.visibility === false;

  const secDef = SECTION_DEFINITIONS.find(d => d.type === section.type);
  const variants = secDef?.variants || [];
  const friendlyTitle = getSectionFriendlyTitle(section);

  return `
    <div class="p-4 space-y-5" id="inspector-panel-content">
      
      <!-- Section Header Info -->
      <div class="flex items-center justify-between pb-3 border-b border-zinc-200">
        <div>
          <div class="text-ui-xs font-medium uppercase tracking-wider text-zinc-400">Réglages de la section</div>
          <h3 class="font-semibold text-sm text-zinc-900 capitalize">${friendlyTitle}</h3>
        </div>

        <div class="flex items-center gap-1">
          <button type="button" onclick="window.app.toggleSectionVisibility('${sectionId}')" class="p-1 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors" title="${isHidden ? 'Afficher' : 'Masquer'}">
            ${getIcon(isHidden ? "eyeOff" : "eye", "w-3.5 h-3.5")}
          </button>
          <button type="button" onclick="window.app.duplicateSection('${sectionId}')" class="p-1 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors" title="Dupliquer">
            ${getIcon("copy", "w-3.5 h-3.5")}
          </button>
          <button type="button" onclick="window.app.deleteSection('${sectionId}')" class="p-1 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Supprimer">
            ${getIcon("trash", "w-3.5 h-3.5")}
          </button>
        </div>
      </div>

      <!-- Section Variant Switcher -->
      ${sectionLayoutControlsHTML(section, sectionId)}

      ${state.selectedElementKey ? elementStyleControlsHTML(project, state.selectedElementKey, state.elementStyleState, sectionId) : ''}
      ${state.selectedElementKey ? elementTransformControlsHTML(project, state.selectedElementKey, state.viewport) : ''}
      ${sectionElementsHTML(section, project, state.selectedElementKey)}
      ${sectionListsHTML(section, sectionId)}
      ${sectionContentSettingsHTML(section, sectionId)}
      ${sectionGalleryHTML(section, sectionId)}
      ${sectionButtonsHTML(section, sectionId)}
      ${sectionMapHTML(section, sectionId)}

      ${variants.length > 1 ? `
        <div class="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
          <label class="block text-ui-xs font-medium text-zinc-500 uppercase tracking-wider">Variante d'Affichage</label>
          <select onchange="window.app.changeSectionVariant('${sectionId}', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-900 focus:border-zinc-900 focus:outline-none">
            ${variants.map(v => `
              <option value="${v.id}" ${section.variant === v.id ? 'selected' : ''}>${v.label}</option>
            `).join('')}
          </select>
          <div class="text-ui-xs text-zinc-400">
            ${variants.find(v => v.id === section.variant)?.desc || ''}
          </div>
        </div>
      ` : ''}

      <!-- Réglages d’animation -->
      <div class="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class="text-amber-500">${getIcon("sparkles", "w-3.5 h-3.5")}</span>
            <label class="text-ui-xs font-bold uppercase tracking-wider text-zinc-700">Animation de la section</label>
          </div>
          <span class="text-ui-2xs font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
            ${section.settings?.motionPreset || section.motionPreset || 'aucune'}
          </span>
        </div>

        <div class="grid grid-cols-4 gap-1">
          ${MOTION_PRESETS.map((motion) => [motion.id, motion.label]).map(([preset, label]) => `
            <button type="button"
                    onmouseenter="window.app.previewSectionMotion('${sectionId}', '${preset}')"
                    onclick="window.app.setSectionMotion('${sectionId}', '${preset}')"
                    class="py-1 px-1 border rounded text-ui-xs font-medium text-center transition-all ${((section.settings?.motionPreset || section.motionPreset || 'none') === preset || (!section.settings?.motionPreset && !section.motionPreset && preset === 'none')) ? 'border-zinc-900 bg-zinc-900 text-white font-semibold shadow-2xs' : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'}">
              ${label}
            </button>
          `).join('')}
        </div>

        ${disclosure("section-motion-timing", "Réglages avancés : vitesse et délai", `
        <div class="motion-loop-row" data-section-loop-row>
          <span class="motion-loop-label">Répétition</span>
          <button type="button" data-section-loop="once" class="motion-loop-btn ${(section.settings?.motionLoop || 'once') === 'once' ? 'is-active' : ''}" onclick="window.app.setSectionMotionLoop('${sectionId}', 'once')">Une fois</button>
          <button type="button" data-section-loop="twice" class="motion-loop-btn ${section.settings?.motionLoop === 'twice' ? 'is-active' : ''}" onclick="window.app.setSectionMotionLoop('${sectionId}', 'twice')">×2</button>
          <button type="button" data-section-loop="infinite" class="motion-loop-btn ${section.settings?.motionLoop === 'infinite' ? 'is-active' : ''}" onclick="window.app.setSectionMotionLoop('${sectionId}', 'infinite')">Boucle</button>
        </div>
        <div class="motion-loop-row" data-section-timing>
          <span class="motion-loop-label">Vitesse</span>
          ${MOTION_SPEEDS.map((speed) => `
            <button type="button"
                    class="motion-loop-btn ${((section.settings?.motionSpeed || 'normal') === speed.id) ? 'is-active' : ''}"
                    title="${speed.description}"
                    onclick="window.app.setSectionMotionSpeed('${sectionId}', '${speed.id}')">${speed.label}</button>
          `).join('')}
        </div>
        <div class="motion-loop-row" data-section-timing>
          <span class="motion-loop-label">Délai</span>
          ${MOTION_DELAYS.map((delay) => `
            <button type="button"
                    class="motion-loop-btn ${((section.settings?.motionDelay || 'aucun') === delay.id) ? 'is-active' : ''}"
                    title="${delay.description}"
                    onclick="window.app.setSectionMotionDelay('${sectionId}', '${delay.id}')">${delay.label}</button>
          `).join('')}
        </div>
        <div class="motion-loop-row" data-section-timing>
          <span class="motion-loop-label">Courbe</span>
          ${MOTION_EASINGS.map((easing) => `
            <button type="button"
                    class="motion-loop-btn ${((section.settings?.motionEasing || 'douce') === easing.id) ? 'is-active' : ''}"
                    title="${easing.description}"
                    onclick="window.app.setSectionMotionEasing('${sectionId}', '${easing.id}')">${easing.label}</button>
          `).join('')}
        </div>
        `)}

        <button type="button"
                onclick="window.app.previewSectionMotion('${sectionId}', '${section.settings?.motionPreset || section.motionPreset || 'fade-in'}')"
                class="w-full py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 rounded-lg text-xs font-semibold border border-zinc-200 flex items-center justify-center gap-1.5 shadow-2xs transition-colors">
          ${getIcon("play", "w-3.5 h-3.5")}<span>Tester l'animation en direct</span>
        </button>
        <div class="grid grid-cols-2 gap-1.5">
          <button type="button"
                  class="py-1 bg-white hover:bg-zinc-100 text-zinc-700 rounded-lg text-ui-xs font-semibold border border-zinc-200 transition-colors"
                  onclick="window.app.stopSectionMotion('${sectionId}')">Arrêter</button>
          <button type="button"
                  class="py-1 bg-white hover:bg-zinc-100 text-zinc-700 rounded-lg text-ui-xs font-semibold border border-zinc-200 transition-colors"
                  onclick="window.app.resetSectionMotion('${sectionId}')">Réinitialiser</button>
        </div>
      </div>

      <!-- Quick Component Inserter -->
      <div class="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-ui-xs font-bold uppercase tracking-wider text-zinc-700">+ Ajouter un élément</label>
          <button type="button" onclick="window.app.openAddSectionModal('components')" class="text-ui-xs font-semibold text-zinc-900 hover:underline">Catalogue complet →</button>
        </div>
        <div class="grid grid-cols-2 gap-1 text-ui-sm">
          <button type="button" onclick="window.app.insertQuickComponent('${sectionId}', 'button')" class="py-1.5 px-2 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-700 font-medium flex items-center gap-1.5 transition-colors">
            ${getIcon("circleDot", "w-3.5 h-3.5")}<span>Bouton CTA</span>
          </button>
          <button type="button" onclick="window.app.insertQuickComponent('${sectionId}', 'badge')" class="py-1.5 px-2 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-700 font-medium flex items-center gap-1.5 transition-colors">
            ${getIcon("tag", "w-3.5 h-3.5")}<span>Badge Confiance</span>
          </button>
          <button type="button" onclick="window.app.insertQuickComponent('${sectionId}', 'quote')" class="py-1.5 px-2 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-700 font-medium flex items-center gap-1.5 transition-colors">
            ${getIcon("message", "w-3.5 h-3.5")}<span>Citation Avis</span>
          </button>
          <button type="button" onclick="window.app.insertQuickComponent('${sectionId}', 'separator')" class="py-1.5 px-2 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-700 font-medium flex items-center gap-1.5 transition-colors">
            ${getIcon("minus", "w-3.5 h-3.5")}<span>Séparateur</span>
          </button>
        </div>
      </div>

      <!-- Quick Fields Form with Live OnInput -->
      <form id="inspector-form" onsubmit="event.preventDefault();" class="space-y-3.5 text-xs">
        
        ${c.badge !== undefined ? `
          <div>
            <label class="block text-ui-xs font-medium text-zinc-500 mb-1">Badge / Surtitre :</label>
            <input type="text" value="${escapeHtml(c.badge)}" 
                   data-field="badge"
                   oninput="window.app.liveUpdateText('${sectionId}', 'badge', this.value)"
                   onchange="window.app.commitTextUpdate('${sectionId}', 'badge', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-zinc-900 focus:border-zinc-900 focus:outline-none transition-colors">
          </div>
        ` : ''}

        ${c.title !== undefined ? `
          <div>
            <label class="block text-ui-xs font-medium text-zinc-500 mb-1">Titre principal :</label>
            <textarea rows="2" 
                      data-field="title"
                      oninput="window.app.liveUpdateText('${sectionId}', 'title', this.value)"
                      onchange="window.app.commitTextUpdate('${sectionId}', 'title', this.value)"
                      class="w-full bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-zinc-900 focus:border-zinc-900 focus:outline-none transition-colors leading-snug">${escapeHtml(c.title)}</textarea>
          </div>
        ` : ''}

        ${c.subtitle !== undefined ? `
          <div>
            <label class="block text-ui-xs font-medium text-zinc-500 mb-1">Sous-titre / Descriptif :</label>
            <textarea rows="3" 
                      data-field="subtitle"
                      oninput="window.app.liveUpdateText('${sectionId}', 'subtitle', this.value)"
                      onchange="window.app.commitTextUpdate('${sectionId}', 'subtitle', this.value)"
                      class="w-full bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-zinc-900 focus:border-zinc-900 focus:outline-none transition-colors leading-relaxed">${escapeHtml(c.subtitle)}</textarea>
          </div>
        ` : ''}

        <!-- Hero photo with quick trash & replace -->
        ${c.heroImage !== undefined ? `
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="block text-ui-xs font-medium text-zinc-500">Photo Principale :</label>
              <div class="flex items-center gap-1">
                <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'heroImage')" class="text-zinc-700 hover:text-zinc-900 font-medium text-ui-xs bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded border border-zinc-200 transition-colors">
                  <span>Remplacer</span>
                </button>
                <button type="button" onclick="window.app.deletePhoto('${sectionId}', 'heroImage')" class="text-red-600 hover:text-red-700 font-medium text-ui-xs bg-red-50 hover:bg-red-100 px-1.5 py-0.5 rounded border border-red-200 transition-colors" title="Supprimer (Poubelle)">
                  ${getIcon("trash", "w-3.5 h-3.5")}
                </button>
              </div>
            </div>
            <div class="aspect-[16/9] rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100 relative group">
              <img src="${c.heroImage || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80'}" alt="Visuel Hero" class="w-full h-full object-cover">
            </div>
          </div>
        ` : ''}

        ${c.ctaPrimary !== undefined ? `
          <div>
            <label class="block text-ui-xs font-medium text-zinc-500 mb-1">Bouton Principal :</label>
            <input type="text" value="${escapeHtml(c.ctaPrimary)}" 
                   data-field="ctaPrimary"
                   oninput="window.app.liveUpdateText('${sectionId}', 'ctaPrimary', this.value)"
                   onchange="window.app.commitTextUpdate('${sectionId}', 'ctaPrimary', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-zinc-900 focus:border-zinc-900 focus:outline-none">
          </div>
        ` : ''}

        ${c.ctaSecondary !== undefined ? `
          <div>
            <label class="block text-ui-xs font-medium text-zinc-500 mb-1">Bouton Secondaire :</label>
            <input type="text" value="${escapeHtml(c.ctaSecondary)}" 
                   data-field="ctaSecondary"
                   oninput="window.app.liveUpdateText('${sectionId}', 'ctaSecondary', this.value)"
                   onchange="window.app.commitTextUpdate('${sectionId}', 'ctaSecondary', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-zinc-900 focus:border-zinc-900 focus:outline-none">
          </div>
        ` : ''}

        ${c.text !== undefined ? `
          <div>
            <label class="block text-ui-xs font-medium text-zinc-500 mb-1">Texte / Argumentaire :</label>
            <textarea rows="3" 
                      data-field="text"
                      oninput="window.app.liveUpdateText('${sectionId}', 'text', this.value)"
                      onchange="window.app.commitTextUpdate('${sectionId}', 'text', this.value)"
                      class="w-full bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-zinc-900 focus:border-zinc-900 focus:outline-none transition-colors leading-relaxed">${escapeHtml(c.text)}</textarea>
          </div>
        ` : ''}

        ${c.ctaText !== undefined ? `
          <div>
            <label class="block text-ui-xs font-medium text-zinc-500 mb-1">Bouton d'Appel / Action :</label>
            <input type="text" value="${escapeHtml(c.ctaText)}" 
                   data-field="ctaText"
                   oninput="window.app.liveUpdateText('${sectionId}', 'ctaText', this.value)"
                   onchange="window.app.commitTextUpdate('${sectionId}', 'ctaText', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-zinc-900 focus:border-zinc-900 focus:outline-none">
          </div>
        ` : ''}

        ${c.phone !== undefined ? `
          <div>
            <label class="block text-ui-xs font-medium text-zinc-500 mb-1">Téléphone Direct :</label>
            <input type="text" value="${escapeHtml(c.phone)}" 
                   data-field="phone"
                   oninput="window.app.liveUpdateText('${sectionId}', 'phone', this.value)"
                   onchange="window.app.commitTextUpdate('${sectionId}', 'phone', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-zinc-900 focus:border-zinc-900 focus:outline-none">
          </div>
        ` : ''}

        <!-- Before / After specific fields -->
        ${section.type === 'beforeAfter' ? `
          <div class="space-y-2.5 pt-2 border-t border-zinc-100">
            <div class="font-medium text-zinc-700 text-xs">Photos Comparatives</div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="block text-ui-xs text-zinc-500">Photo Avant :</label>
                <div class="flex items-center gap-1">
                  <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'beforeImage')" class="text-zinc-700 hover:underline text-ui-xs font-medium">Changer</button>
                  <button type="button" onclick="window.app.deletePhoto('${sectionId}', 'beforeImage')" class="text-red-600 text-ui-xs" title="Supprimer">${getIcon("trash", "w-3.5 h-3.5")}</button>
                </div>
              </div>
              <div class="h-20 rounded-md overflow-hidden border border-zinc-200">
                <img src="${c.beforeImage || ''}" alt="Avant" class="w-full h-full object-cover">
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="block text-ui-xs text-zinc-500">Photo Après :</label>
                <div class="flex items-center gap-1">
                  <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'afterImage')" class="text-zinc-700 hover:underline text-ui-xs font-medium">Changer</button>
                  <button type="button" onclick="window.app.deletePhoto('${sectionId}', 'afterImage')" class="text-red-600 text-ui-xs" title="Supprimer">${getIcon("trash", "w-3.5 h-3.5")}</button>
                </div>
              </div>
              <div class="h-20 rounded-md overflow-hidden border border-zinc-200">
                <img src="${c.afterImage || ''}" alt="Après" class="w-full h-full object-cover">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-ui-xs text-zinc-500 mb-1">Label Avant :</label>
                <input type="text" value="${escapeHtml(c.beforeLabel || '')}" 
                       data-field="beforeLabel"
                       oninput="window.app.liveUpdateText('${sectionId}', 'beforeLabel', this.value)"
                       onchange="window.app.commitTextUpdate('${sectionId}', 'beforeLabel', this.value)" 
                       class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs">
              </div>
              <div>
                <label class="block text-ui-xs text-zinc-500 mb-1">Label Après :</label>
                <input type="text" value="${escapeHtml(c.afterLabel || '')}" 
                       data-field="afterLabel"
                       oninput="window.app.liveUpdateText('${sectionId}', 'afterLabel', this.value)"
                       onchange="window.app.commitTextUpdate('${sectionId}', 'afterLabel', this.value)" 
                       class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs">
              </div>
            </div>
          </div>
        ` : ''}

        <!-- About specific fields with portrait photo management -->
        ${section.type === 'about' ? `
          <div class="space-y-2.5 pt-2 border-t border-zinc-100">
            <div class="font-medium text-zinc-700 text-xs">Informations Fondateur</div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-ui-xs text-zinc-500 mb-1">Nom / Équipe :</label>
                <input type="text" value="${escapeHtml(c.owner || '')}" 
                       data-field="owner"
                       oninput="window.app.liveUpdateText('${sectionId}', 'owner', this.value)"
                       onchange="window.app.commitTextUpdate('${sectionId}', 'owner', this.value)" 
                       class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs">
              </div>
              <div>
                <label class="block text-ui-xs text-zinc-500 mb-1">Titre / Rôle :</label>
                <input type="text" value="${escapeHtml(c.role || '')}" 
                       data-field="role"
                       oninput="window.app.liveUpdateText('${sectionId}', 'role', this.value)"
                       onchange="window.app.commitTextUpdate('${sectionId}', 'role', this.value)" 
                       class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs">
              </div>
            </div>
            <div>
              <label class="block text-ui-xs text-zinc-500 mb-1">Histoire de l'entreprise :</label>
              <textarea rows="3" 
                        data-field="story"
                        oninput="window.app.liveUpdateText('${sectionId}', 'story', this.value)"
                        onchange="window.app.commitTextUpdate('${sectionId}', 'story', this.value)" 
                        class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1.5 text-xs leading-relaxed">${escapeHtml(c.story || '')}</textarea>
            </div>
            ${Array.isArray(c.points) && c.points.length > 0 ? `
              <div>
                <label class="block text-ui-xs text-zinc-500 mb-1">Points forts & Savoir-faire :</label>
                <div class="space-y-1.5">
                  ${c.points.map((pt, pIdx) => `
                    <div class="flex items-center gap-1.5">
                      <span class="text-ui-xs text-zinc-400 font-mono w-4">${pIdx + 1}.</span>
                      <input type="text" value="${escapeHtml(pt || '')}"
                             data-field="points.${pIdx}"
                             oninput="window.app.liveUpdateText('${sectionId}', 'points.${pIdx}', this.value)"
                             onchange="window.app.commitTextUpdate('${sectionId}', 'points.${pIdx}', this.value)"
                             class="flex-1 bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs">
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="block text-ui-xs text-zinc-500">Photo Portrait :</label>
                <div class="flex items-center gap-1">
                  <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'image')" class="text-zinc-700 hover:underline text-ui-xs font-medium">Changer</button>
                  <button type="button" onclick="window.app.deletePhoto('${sectionId}', 'image')" class="text-red-600 text-ui-xs" title="Supprimer">${getIcon("trash", "w-3.5 h-3.5")}</button>
                </div>
              </div>
              <div class="h-20 rounded-md overflow-hidden border border-zinc-200">
                <img src="${c.image || ''}" alt="Portrait" class="w-full h-full object-cover">
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Services list editor with service photo management -->
        ${section.type === 'services' && Array.isArray(c.services) ? `
          <div class="space-y-2.5 pt-2 border-t border-zinc-100">
            <div class="flex items-center justify-between">
              <span class="font-medium text-zinc-700 text-xs">Prestations (${c.services.length})</span>
              <button type="button" onclick="window.app.addServiceItem('${sectionId}')" class="text-ui-xs font-medium text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded border border-zinc-200 flex items-center gap-1">
                ${getIcon("plus", "w-3 h-3")}
                <span>Ajouter</span>
              </button>
            </div>

            <div class="space-y-2">
              ${c.services.map((srv, idx) => `
                <div class="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200 space-y-2">
                  <div class="flex items-center justify-between text-ui-sm">
                    <span class="font-medium text-zinc-700">Prestation #${idx + 1}</span>
                    <button type="button" onclick="window.app.removeServiceItem('${sectionId}', ${idx})" class="text-zinc-400 hover:text-red-600" title="Supprimer">
                      ${getIcon("trash", "w-3.5 h-3.5")}
                    </button>
                  </div>
                  <input type="text" placeholder="Titre prestation" value="${escapeHtml(srv.title)}" onchange="window.app.updateSectionContent('${sectionId}', 'services.${idx}.title', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs font-medium">
                  
                  <div class="flex items-center gap-2">
                    <div class="w-10 h-10 rounded-md overflow-hidden border border-zinc-200 bg-zinc-100 flex-shrink-0">
                      <img src="${srv.image || ''}" alt="${srv.title}" class="w-full h-full object-cover">
                    </div>
                    <div class="flex gap-1 text-ui-xs">
                      <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'services.${idx}.image', ${idx})" class="text-zinc-700 bg-white border border-zinc-200 px-2 py-0.5 rounded font-medium hover:bg-zinc-50">Photo ${getIcon("refreshCw", "w-3 h-3")}</button>
                      <button type="button" onclick="window.app.deletePhoto('${sectionId}', 'services.${idx}.image', ${idx})" class="text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-medium hover:bg-red-100" title="Poubelle">${getIcon("trash", "w-3.5 h-3.5")}</button>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Badge tag" value="${escapeHtml(srv.tag || '')}" onchange="window.app.updateSectionContent('${sectionId}', 'services.${idx}.tag', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-ui-sm">
                    <input type="text" placeholder="Prix" value="${escapeHtml(srv.price || '')}" onchange="window.app.updateSectionContent('${sectionId}', 'services.${idx}.price', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-ui-sm">
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Gallery list editor with photo replacement and trash -->
        ${section.type === 'gallery' && Array.isArray(c.photos) ? `
          <div class="space-y-2.5 pt-2 border-t border-zinc-100">
            <div class="flex items-center justify-between">
              <span class="font-medium text-zinc-700 text-xs">Photos Galerie (${c.photos.length})</span>
              <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'photos', ${c.photos.length})" class="text-ui-xs font-medium text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded border border-zinc-200 flex items-center gap-1">
                ${getIcon("plus", "w-3 h-3")}
                <span>Ajouter</span>
              </button>
            </div>

            <div class="grid grid-cols-3 gap-1.5">
              ${c.photos.map((photo, idx) => `
                <div class="relative group rounded-md overflow-hidden border border-zinc-200 bg-zinc-900 h-14">
                  <img src="${photo.url || ''}" alt="${photo.title || 'Photo'}" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'photos.${idx}.url', ${idx})" class="p-1 bg-white text-zinc-900 rounded text-ui-xs" title="Remplacer">${getIcon("refreshCw", "w-3.5 h-3.5")}</button>
                    <button type="button" onclick="window.app.deletePhoto('${sectionId}', 'photos.${idx}.url', ${idx})" class="p-1 bg-red-600 text-white rounded text-ui-xs" title="Poubelle">${getIcon("trash", "w-3.5 h-3.5")}</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- FAQ list editor -->
        ${section.type === 'faq' && Array.isArray(c.items) ? `
          <div class="space-y-2.5 pt-2 border-t border-zinc-100">
            <div class="flex items-center justify-between">
              <span class="font-medium text-zinc-700 text-xs">Questions FAQ (${c.items.length})</span>
              <button type="button" onclick="window.app.addFaqItem('${sectionId}')" class="text-ui-xs font-medium text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded border border-zinc-200 flex items-center gap-1">
                ${getIcon("plus", "w-3 h-3")}
                <span>Ajouter</span>
              </button>
            </div>

            <div class="space-y-2">
              ${c.items.map((item, idx) => `
                <div class="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1.5">
                  <div class="flex items-center justify-between text-ui-sm">
                    <span class="font-medium text-zinc-700">Q#${idx + 1}</span>
                    <button type="button" onclick="window.app.removeFaqItem('${sectionId}', ${idx})" class="text-zinc-400 hover:text-red-600" title="Supprimer">
                      ${getIcon("trash", "w-3.5 h-3.5")}
                    </button>
                  </div>
                  <input type="text" value="${escapeHtml(item.q)}" onchange="window.app.updateSectionContent('${sectionId}', 'items.${idx}.q', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs font-medium" placeholder="Question...">
                  <textarea rows="2" onchange="window.app.updateSectionContent('${sectionId}', 'items.${idx}.a', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-ui-sm leading-snug" placeholder="Réponse...">${escapeHtml(item.a)}</textarea>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Location specific fields -->
        ${section.type === 'location' ? `
          <div class="space-y-2 pt-2 border-t border-zinc-100">
            <div class="font-medium text-zinc-700 text-xs">Localisation & Rayon</div>
            <div>
              <label class="block text-ui-xs text-zinc-500 mb-1">Adresse ou Zone :</label>
              <input type="text" value="${escapeHtml(c.address || '')}" 
                     data-field="address"
                     oninput="window.app.liveUpdateText('${sectionId}', 'address', this.value)"
                     onchange="window.app.commitTextUpdate('${sectionId}', 'address', this.value)" 
                     class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs">
            </div>
            <div>
              <label class="block text-ui-xs text-zinc-500 mb-1">Rayon d'intervention :</label>
              <input type="text" value="${escapeHtml(c.radius || '')}" 
                     data-field="radius"
                     oninput="window.app.liveUpdateText('${sectionId}', 'radius', this.value)"
                     onchange="window.app.commitTextUpdate('${sectionId}', 'radius', this.value)" 
                     class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs">
            </div>
          </div>
        ` : ''}

        <!-- Quote Block specific fields -->
        ${section.type === 'quoteBlock' ? `
          <div class="space-y-2 pt-2 border-t border-zinc-100">
            <div class="font-medium text-zinc-700 text-xs">Citation & Dirigeant</div>
            <div>
              <label class="block text-ui-xs text-zinc-500 mb-1">Texte de la citation :</label>
              <textarea rows="3" data-field="quote" oninput="window.app.liveUpdateText('${sectionId}', 'quote', this.value)" onchange="window.app.commitTextUpdate('${sectionId}', 'quote', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1.5 text-xs">${escapeHtml(c.quote || '')}</textarea>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-ui-xs text-zinc-500 mb-1">Nom Auteur :</label>
                <input type="text" value="${escapeHtml(c.authorName || '')}" data-field="authorName" oninput="window.app.liveUpdateText('${sectionId}', 'authorName', this.value)" onchange="window.app.commitTextUpdate('${sectionId}', 'authorName', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs">
              </div>
              <div>
                <label class="block text-ui-xs text-zinc-500 mb-1">Rôle / Titre :</label>
                <input type="text" value="${escapeHtml(c.authorRole || '')}" data-field="authorRole" oninput="window.app.liveUpdateText('${sectionId}', 'authorRole', this.value)" onchange="window.app.commitTextUpdate('${sectionId}', 'authorRole', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs">
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Video Block specific fields -->
        ${section.type === 'videoBlock' ? `
          <div class="space-y-2 pt-2 border-t border-zinc-100">
            <div class="font-medium text-zinc-700 text-xs">Lecteur Vidéo Immersif</div>
            <div>
              <label class="block text-ui-xs text-zinc-500 mb-1">Image de couverture (Poster) :</label>
              <input type="text" value="${escapeHtml(c.poster || '')}" data-field="poster" oninput="window.app.liveUpdateText('${sectionId}', 'poster', this.value)" onchange="window.app.commitTextUpdate('${sectionId}', 'poster', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs">
            </div>
          </div>
        ` : ''}

        <!-- Stepper Block specific fields -->
        ${section.type === 'stepperBlock' && Array.isArray(c.steps) ? `
          <div class="space-y-2.5 pt-2 border-t border-zinc-100">
            <div class="font-medium text-zinc-700 text-xs">Étapes de Chantier (4 étapes)</div>
            ${c.steps.map((st, sIdx) => `
              <div class="p-2 bg-zinc-50 rounded-md border border-zinc-200 space-y-1">
                <span class="text-ui-2xs font-bold text-zinc-500 uppercase">Étape 0${sIdx + 1}</span>
                <input type="text" value="${escapeHtml(st.title || '')}" placeholder="Titre de l'étape" onchange="window.app.updateSectionContent('${sectionId}', 'steps.${sIdx}.title', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs font-semibold">
                <textarea rows="2" placeholder="Description de l'étape" onchange="window.app.updateSectionContent('${sectionId}', 'steps.${sIdx}.desc', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm leading-snug">${escapeHtml(st.desc || '')}</textarea>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Table Block specific fields -->
        ${section.type === 'tableBlock' && Array.isArray(c.rows) ? `
          <div class="space-y-2.5 pt-2 border-t border-zinc-100">
            <div class="font-medium text-zinc-700 text-xs">Tableau Comparatif</div>
            ${c.rows.map((row, rIdx) => `
              <div class="p-2 bg-zinc-50 rounded-md border border-zinc-200 space-y-1">
                <input type="text" value="${escapeHtml(row.label || '')}" placeholder="Critère" onchange="window.app.updateSectionContent('${sectionId}', 'rows.${rIdx}.label', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs font-semibold">
                <div class="grid grid-cols-2 gap-1.5">
                  <input type="text" value="${escapeHtml(row.standard || '')}" placeholder="Standard" onchange="window.app.updateSectionContent('${sectionId}', 'rows.${rIdx}.standard', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm">
                  <input type="text" value="${escapeHtml(row.premium || '')}" placeholder="Formule Pro" onchange="window.app.updateSectionContent('${sectionId}', 'rows.${rIdx}.premium', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm font-bold text-emerald-700">
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Slider Block specific fields -->
        ${section.type === 'sliderBlock' ? `
          <div class="space-y-2 pt-2 border-t border-zinc-100">
            <div class="font-medium text-zinc-700 text-xs">Curseur de Surface m²</div>
            <div>
              <label class="block text-ui-xs text-zinc-500 mb-1">Chiffrage / Argument d'accompagnement :</label>
              <input type="text" value="${escapeHtml(c.text || 'Devis ferme sous 24h • Déplacement offert')}" data-field="text" oninput="window.app.liveUpdateText('${sectionId}', 'text', this.value)" onchange="window.app.commitTextUpdate('${sectionId}', 'text', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs">
            </div>
          </div>
        ` : ''}

        <!-- Tabs Block specific fields -->
        ${section.type === 'tabsBlock' && Array.isArray(c.tabs) ? `
          <div class="space-y-2.5 pt-2 border-t border-zinc-100">
            <div class="font-medium text-zinc-700 text-xs">Onglets Prestations (${c.tabs.length})</div>
            ${c.tabs.map((tb, tIdx) => `
              <div class="p-2 bg-zinc-50 rounded-md border border-zinc-200 space-y-1">
                <input type="text" value="${escapeHtml(tb.title || '')}" placeholder="Nom de l'onglet" onchange="window.app.updateSectionContent('${sectionId}', 'tabs.${tIdx}.title', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs font-semibold">
                <input type="text" value="${escapeHtml(tb.tag || '')}" placeholder="Tag (ex: Formule Abonnement)" onchange="window.app.updateSectionContent('${sectionId}', 'tabs.${tIdx}.tag', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm">
                <textarea rows="2" placeholder="Description de la prestation" onchange="window.app.updateSectionContent('${sectionId}', 'tabs.${tIdx}.text', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm leading-snug">${escapeHtml(tb.text || '')}</textarea>
              </div>
            `).join('')}
          </div>
        ` : ''}

      </form>

      <!-- Component Intelligence & Audit Qualité (Section 16) -->
      ${(() => {
        const typeMap = {
          hero: 'hero',
          trust: 'badge',
          services: 'card',
          about: 'card',
          gallery: 'carousel',
          beforeAfter: 'carousel',
          reviews: 'card',
          location: 'card',
          hours: 'card',
          faq: 'accordion',
          cta: 'button',
          process: 'card',
          certifications: 'badge',
          pricing: 'card',
          customBlock: 'card',
          quoteBlock: 'card',
          videoBlock: 'carousel',
          stepperBlock: 'card',
          tableBlock: 'card',
          sliderBlock: 'card',
          tabsBlock: 'tabs'
        };
        const compId = typeMap[section.type] || 'card';
        const compDef = COMPONENT_INTELLIGENCE_REGISTRY[compId] || COMPONENT_INTELLIGENCE_REGISTRY.card;
        const tradeId = project?.business?.trade || project?.business?.category || 'paysagiste';
        const confidence = calculateComponentConfidence(compId, { tradeId, pageType: 'landing' });
        const a11y = verifyAccessibility({
          type: compId,
          content: { label: section.content?.title || section.content?.badge || section.type },
          props: { ariaLabel: friendlyTitle }
        });
        const projectSectionTypes = (project?.sections || []).map(s => typeMap[s.type] || s.type);
        const antiPatterns = detectAntiPatterns(projectSectionTypes, { pageType: 'landing' });

        return `
          <div class="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2.5 text-xs">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span class="text-ui-xs font-semibold uppercase tracking-wider text-zinc-500">Analyse du bloc</span>
                <span class="px-1.5 py-0.5 rounded text-ui-2xs font-medium bg-zinc-200 text-zinc-700">${compDef.family}</span>
              </div>
              <span class="px-2 py-0.5 rounded-full text-ui-xs font-semibold ${confidence.score >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                Score: ${confidence.score}%
              </span>
            </div>

            <div class="text-ui-sm text-zinc-600 leading-snug">
              <span class="font-medium text-zinc-800">${compDef.name} :</span> ${compDef.primaryUseCases?.[0] || compDef.intent?.[0]}
            </div>

            <div class="grid grid-cols-2 gap-1.5 pt-1 text-ui-xs">
              <div class="bg-white p-1.5 rounded border border-zinc-200">
                <span class="text-zinc-400 block text-ui-2xs">Rôle dans la page</span>
                <span class="font-mono text-zinc-700">&lt;${compDef.accessibilityPolicy?.semanticRole || 'section'}&gt;</span>
              </div>
              <div class="bg-white p-1.5 rounded border border-zinc-200">
                <span class="text-zinc-400 block text-ui-2xs">Accessibilité</span>
                <span class="text-emerald-600 font-medium">${a11y.compliant ? '✓ WCAG Conforme' : `${getIcon("alertTriangle", "w-3 h-3")} Vérifier labels`}</span>
              </div>
            </div>

            <div class="text-ui-2xs text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-200">
              <span>Tag Analytics:</span>
              <span class="font-mono text-zinc-500">track-${section.type}</span>
            </div>

            ${antiPatterns.length > 0 ? `
              <div class="p-1.5 bg-amber-50 border border-amber-200 rounded text-ui-xs text-amber-800 space-y-0.5">
                <span class="font-semibold flex items-center gap-1">${getIcon("alertTriangle", "w-3.5 h-3.5")} Alerte Anti-Pattern :</span>
                ${antiPatterns.map(ap => `<div>• ${escapeHtml(ap.message)}</div>`).join('')}
              </div>
            ` : ''}
          </div>
        `;
      })()}

      <!-- Section Actions -->
      <div class="pt-3 border-t border-zinc-100 space-y-1.5">
        <button type="button" onclick="window.app.moveSection('${sectionId}', 'up')" class="w-full py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border border-zinc-200 transition-colors">
          ${getIcon("chevronUp", "w-3.5 h-3.5")}
          <span>Remonter d'un cran</span>
        </button>
        <button type="button" onclick="window.app.moveSection('${sectionId}', 'down')" class="w-full py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border border-zinc-200 transition-colors">
          ${getIcon("chevronDown", "w-3.5 h-3.5")}
          <span>Descendre d'un cran</span>
        </button>
      </div>

    </div>
  `;
}

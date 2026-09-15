/**
 * États des éléments : survol, focus, actif, désactivé (mission « états »).
 *
 * Le style par défaut d'un élément vit dans le rendu habituel ; ce module ne
 * stocke QUE les écarts pour chaque état, sous forme de déclarations CSS portées
 * par la clé de mise en page stable de l'élément (\`data-layout-key\`).
 *
 * Une seule primitive produit le CSS, utilisée par l'éditeur, l'aperçu et l'export
 * puisque les trois passent par renderWebsiteHTML : ce que l'auteur voit est ce qui
 * est publié.
 *
 * Sécurité : les propriétés sont restreintes à une liste blanche et les valeurs sont
 * refusées si elles contiennent de quoi sortir d'une déclaration ou d'une règle.
 */

export const ELEMENT_STATES = ["hover", "focus", "active", "disabled"];

export const ELEMENT_STATE_LABELS = {
  hover: "Survol",
  focus: "Focus clavier",
  active: "Actif",
  disabled: "Désactivé"
};

// focus est traduit en :focus-visible : le produit n'a qu'une politique de focus,
// visible au clavier uniquement (voir public/css/tokens.css).
const STATE_SELECTORS = {
  hover: ":hover",
  focus: ":focus-visible",
  active: ":active",
  disabled: ":disabled"
};

const ALLOWED_PROPERTIES = new Set([
  "color",
  "background-color",
  "border-color",
  "border-width",
  "border-style",
  "border-radius",
  "box-shadow",
  "opacity",
  "transform",
  "translate",
  "scale",
  "rotate",
  "text-decoration-line",
  "font-weight",
  "outline-color",
  "outline-width",
  "outline-offset",
  "filter",
  "backdrop-filter",
  "letter-spacing",
  "padding",
  "margin"
]);

const FORBIDDEN_VALUE = /[;{}<>]|\/\*|\*\/|url\s*\(|expression\s*\(|javascript:|@import/i;
const SAFE_KEY = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_RULES = 400;

export function isElementState(stateName) {
  return ELEMENT_STATES.includes(stateName);
}

/** Renvoie { property, value } normalisés, ou null si la déclaration est refusée. */
export function sanitizeDeclaration(property, value) {
  const name = String(property || "").trim().toLowerCase();
  if (!ALLOWED_PROPERTIES.has(name)) return null;
  const raw = String(value === undefined || value === null ? "" : value).trim();
  if (!raw || raw.length > 200) return null;
  if (FORBIDDEN_VALUE.test(raw)) return null;
  return { property: name, value: raw };
}

/** Déclarations enregistrées pour un élément dans un état donné. */
export function getElementState(project, layoutKey, stateName) {
  if (!project || !project.elementStates || !isElementState(stateName)) return {};
  const forElement = project.elementStates[layoutKey];
  if (!forElement || typeof forElement !== "object") return {};
  const forState = forElement[stateName];
  return forState && typeof forState === "object" ? { ...forState } : {};
}

/** Ajoute ou remplace une déclaration. Renvoie un nouveau projet. */
export function setElementState(project, layoutKey, stateName, property, value) {
  if (!project || !SAFE_KEY.test(String(layoutKey || "")) || !isElementState(stateName)) return project;
  const declaration = sanitizeDeclaration(property, value);
  if (!declaration) return project;
  const elementStates = { ...(project.elementStates || {}) };
  const forElement = { ...(elementStates[layoutKey] || {}) };
  forElement[stateName] = { ...(forElement[stateName] || {}), [declaration.property]: declaration.value };
  elementStates[layoutKey] = forElement;
  return { ...project, elementStates };
}

/** Retire un état, ou l'élément entier s'il ne reste rien. Renvoie un nouveau projet. */
export function clearElementState(project, layoutKey, stateName) {
  if (!project || !project.elementStates) return project;
  const elementStates = { ...project.elementStates };
  const forElement = { ...(elementStates[layoutKey] || {}) };
  if (isElementState(stateName)) delete forElement[stateName];
  else return project;
  if (Object.keys(forElement).length) elementStates[layoutKey] = forElement;
  else delete elementStates[layoutKey];
  return { ...project, elementStates };
}

/**
 * CSS des états. Une chaîne vide quand aucun état n'est défini, pour que les projets
 * existants ne reçoivent pas une feuille de style inutile.
 */
export function elementStateCSS(project) {
  const all = project && project.elementStates;
  if (!all || typeof all !== "object") return "";
  const rules = [];
  for (const layoutKey of Object.keys(all)) {
    if (!SAFE_KEY.test(layoutKey)) continue;
    const forElement = all[layoutKey];
    if (!forElement || typeof forElement !== "object") continue;
    for (const stateName of ELEMENT_STATES) {
      const forState = forElement[stateName];
      if (!forState || typeof forState !== "object") continue;
      const declarations = [];
      for (const property of Object.keys(forState)) {
        const declaration = sanitizeDeclaration(property, forState[property]);
        if (declaration) declarations.push(declaration.property + ": " + declaration.value + ";");
      }
      if (!declarations.length) continue;
      rules.push('[data-layout-key="' + layoutKey + '"]' + STATE_SELECTORS[stateName] + " { " + declarations.join(" ") + " }");
      if (rules.length >= MAX_RULES) break;
    }
    if (rules.length >= MAX_RULES) break;
  }
  return rules.join("\n");
}

/** Nombre d'éléments portant au moins un état : sert aux compteurs d'interface. */
export function countStyledStates(project) {
  const all = project && project.elementStates;
  if (!all || typeof all !== "object") return 0;
  return Object.keys(all).filter((layoutKey) => {
    const forElement = all[layoutKey];
    return forElement && ELEMENT_STATES.some((stateName) => {
      const forState = forElement[stateName];
      return forState && typeof forState === "object" && Object.keys(forState).length > 0;
    });
  }).length;
}

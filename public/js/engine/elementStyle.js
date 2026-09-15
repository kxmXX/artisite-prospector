/**
 * Style d'un élément : respiration interne, arrondi, opacité.
 *
 * Même principe que les sections et les états : rien n'est rendu tant que l'auteur
 * n'a pas touché un réglage, le CSS est produit par une primitive unique injectée par
 * renderWebsiteHTML (éditeur, aperçu et site autonome partagent donc la même feuille),
 * et il cible la clé de mise en page stable déjà posée sur chaque élément par le
 * renderer — aucun balisage à modifier.
 *
 * Les valeurs sont des énumérations : aucune valeur libre n'entre dans le CSS.
 */

export const ELEMENT_PADDING = {
  none: { label: "Aucune", value: "0" },
  compact: { label: "Compacte", value: "clamp(0.5rem, 1.5vw, 1rem)" },
  normal: { label: "Normale", value: "clamp(0.75rem, 2.5vw, 1.75rem)" },
  airy: { label: "Aérée", value: "clamp(1.25rem, 4vw, 3rem)" }
};

export const ELEMENT_RADIUS = {
  square: { label: "Angles vifs", value: "0" },
  soft: { label: "Adouci", value: "var(--ui-radius-md, 8px)" },
  round: { label: "Arrondi", value: "var(--ui-radius-xl, 16px)" },
  pill: { label: "Pilule", value: "var(--ui-radius-full, 999px)" }
};

export const ELEMENT_OPACITY = {
  full: { label: "100 %", value: "1" },
  soft: { label: "85 %", value: "0.85" },
  faded: { label: "60 %", value: "0.6" }
};

export const ELEMENT_STYLE_DEFAULTS = Object.freeze({ padding: "normal", radius: "soft", opacity: "full" });

const SAFE_KEY = /^[A-Za-z0-9_-]{1,64}$/;

function pick(scale, value, fallback) {
  return Object.prototype.hasOwnProperty.call(scale, value) ? value : fallback;
}

/** Réglages normalisés d'un élément, toujours complets. */
export function getElementStyle(project, layoutKey) {
  const raw = (project && project.elementStyles && project.elementStyles[layoutKey]) || {};
  return {
    padding: pick(ELEMENT_PADDING, raw.padding, ELEMENT_STYLE_DEFAULTS.padding),
    radius: pick(ELEMENT_RADIUS, raw.radius, ELEMENT_STYLE_DEFAULTS.radius),
    opacity: pick(ELEMENT_OPACITY, raw.opacity, ELEMENT_STYLE_DEFAULTS.opacity)
  };
}

export function hasCustomElementStyle(project, layoutKey) {
  const style = getElementStyle(project, layoutKey);
  return Object.keys(ELEMENT_STYLE_DEFAULTS).some((key) => style[key] !== ELEMENT_STYLE_DEFAULTS[key]);
}

/** Applique un réglage. Renvoie un nouveau projet, sans muter la source. */
export function setElementStyle(project, layoutKey, property, value) {
  if (!project || !SAFE_KEY.test(String(layoutKey || ""))) return project;
  const scales = { padding: ELEMENT_PADDING, radius: ELEMENT_RADIUS, opacity: ELEMENT_OPACITY };
  const scale = scales[property];
  if (!scale || !Object.prototype.hasOwnProperty.call(scale, value)) return project;
  const elementStyles = { ...(project.elementStyles || {}) };
  elementStyles[layoutKey] = { ...(elementStyles[layoutKey] || {}), [property]: value };
  return { ...project, elementStyles };
}

/** Retire un réglage. L'entrée disparaît quand il ne reste rien. Renvoie un nouveau projet. */
export function clearElementStyle(project, layoutKey, property) {
  if (!project || !project.elementStyles || !project.elementStyles[layoutKey]) return project;
  const elementStyles = { ...project.elementStyles };
  const forElement = { ...elementStyles[layoutKey] };
  if (property === undefined) delete elementStyles[layoutKey];
  else delete forElement[property];
  if (property !== undefined) {
    if (Object.keys(forElement).length) elementStyles[layoutKey] = forElement;
    else delete elementStyles[layoutKey];
  }
  return { ...project, elementStyles };
}

/**
 * CSS des éléments personnalisés. Chaîne vide si aucun réglage : les projets
 * existants ne reçoivent rien.
 */
export function elementStyleCSS(project) {
  const all = project && project.elementStyles;
  if (!all || typeof all !== "object") return "";
  const rules = [];
  for (const layoutKey of Object.keys(all)) {
    if (!SAFE_KEY.test(layoutKey)) continue;
    if (!hasCustomElementStyle(project, layoutKey)) continue;
    const style = getElementStyle(project, layoutKey);
    const declarations = [];
    if (style.padding !== ELEMENT_STYLE_DEFAULTS.padding) declarations.push("padding: " + ELEMENT_PADDING[style.padding].value + ";");
    if (style.radius !== ELEMENT_STYLE_DEFAULTS.radius) declarations.push("border-radius: " + ELEMENT_RADIUS[style.radius].value + ";");
    if (style.opacity !== ELEMENT_STYLE_DEFAULTS.opacity) declarations.push("opacity: " + ELEMENT_OPACITY[style.opacity].value + ";");
    if (!declarations.length) continue;
    rules.push('[data-layout-key="' + layoutKey + '"] { ' + declarations.join(" ") + " }");
    if (rules.length >= 400) break;
  }
  return rules.join("\n") + (rules.length ? "\n" : "");
}

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

export const ELEMENT_BACKGROUND = {
  none: { label: "Aucun", value: "" },
  surface: { label: "Surface", value: "var(--bg-sec, #f0f2eb)" },
  accent: { label: "Accent", value: "var(--primary, #527c22)", contrast: "color: #ffffff;" }
};

export const ELEMENT_BORDER = {
  none: { label: "Aucune", value: "" },
  hairline: { label: "Fine", value: "1px solid rgba(0, 0, 0, 0.12)" },
  strong: { label: "Marquée", value: "2px solid var(--primary, #527c22)" }
};

export const ELEMENT_SHADOW = {
  none: { label: "Aucune", value: "" },
  soft: { label: "Douce", value: "0 1px 2px rgba(0, 0, 0, 0.06)" },
  lifted: { label: "Portée", value: "0 8px 24px rgba(0, 0, 0, 0.10)" }
};

export const ELEMENT_STYLE_DEFAULTS = Object.freeze({
  padding: "normal",
  radius: "soft",
  opacity: "full",
  background: "none",
  border: "none",
  shadow: "none"
});

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
    opacity: pick(ELEMENT_OPACITY, raw.opacity, ELEMENT_STYLE_DEFAULTS.opacity),
    background: pick(ELEMENT_BACKGROUND, raw.background, ELEMENT_STYLE_DEFAULTS.background),
    border: pick(ELEMENT_BORDER, raw.border, ELEMENT_STYLE_DEFAULTS.border),
    shadow: pick(ELEMENT_SHADOW, raw.shadow, ELEMENT_STYLE_DEFAULTS.shadow)
  };
}

export function hasCustomElementStyle(project, layoutKey) {
  const style = getElementStyle(project, layoutKey);
  return Object.keys(ELEMENT_STYLE_DEFAULTS).some((key) => style[key] !== ELEMENT_STYLE_DEFAULTS[key]);
}

/** Applique un réglage. Renvoie un nouveau projet, sans muter la source. */
export function setElementStyle(project, layoutKey, property, value) {
  if (!project || !SAFE_KEY.test(String(layoutKey || ""))) return project;
  const scales = {
    padding: ELEMENT_PADDING,
    radius: ELEMENT_RADIUS,
    opacity: ELEMENT_OPACITY,
    background: ELEMENT_BACKGROUND,
    border: ELEMENT_BORDER,
    shadow: ELEMENT_SHADOW
  };
  const scale = scales[property];
  if (!scale || !Object.prototype.hasOwnProperty.call(scale, value)) return project;
  const elementStyles = { ...(project.elementStyles || {}) };
  elementStyles[layoutKey] = { ...(elementStyles[layoutKey] || {}), [property]: value };
  return { ...project, elementStyles };
}

/**
 * Déclarations CSS d'un réglage énuméré. Source unique : les styles d'élément ET
 * les états d'élément s'en servent, pour qu'une même intention produise exactement
 * le même CSS dans les deux cas.
 * Renvoie un tableau de déclarations, ou null si le réglage n'existe pas.
 */
export function declarationsFor(property, valueId) {
  const scales = {
    padding: ELEMENT_PADDING,
    radius: ELEMENT_RADIUS,
    opacity: ELEMENT_OPACITY,
    background: ELEMENT_BACKGROUND,
    border: ELEMENT_BORDER,
    shadow: ELEMENT_SHADOW
  };
  const scale = scales[property];
  if (!scale || !Object.prototype.hasOwnProperty.call(scale, valueId)) return null;
  if (property === "padding") return ["padding: " + ELEMENT_PADDING[valueId].value + ";"];
  if (property === "radius") return ["border-radius: " + ELEMENT_RADIUS[valueId].value + ";"];
  if (property === "opacity") return ["opacity: " + ELEMENT_OPACITY[valueId].value + ";"];
  if (property === "border") return ["border: " + ELEMENT_BORDER[valueId].value + ";"];
  if (property === "shadow") return ["box-shadow: " + ELEMENT_SHADOW[valueId].value + ";"];
  const background = ELEMENT_BACKGROUND[valueId];
  return ["background-color: " + background.value + ";"].concat(background.contrast ? [background.contrast] : []);
}

/** Vrai si le réglage énuméré existe pour cette propriété. */
export function isKnownElementValue(property, valueId) {
  return declarationsFor(property, valueId) !== null;
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
    for (const property of Object.keys(ELEMENT_STYLE_DEFAULTS)) {
      if (style[property] === ELEMENT_STYLE_DEFAULTS[property]) continue;
      // Un fond accentué impose un texte lisible : la paire est indissociable.
      for (const declaration of declarationsFor(property, style[property]) || []) declarations.push(declaration);
    }
    if (!declarations.length) continue;
    rules.push('[data-layout-key="' + layoutKey + '"] { ' + declarations.join(" ") + " }");
    if (rules.length >= 400) break;
  }
  return rules.join("\n") + (rules.length ? "\n" : "");
}

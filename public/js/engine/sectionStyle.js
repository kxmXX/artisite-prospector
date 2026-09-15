/**
 * Mise en page d'une section : largeur du contenu, respiration verticale, alignement.
 *
 * Rien n'est appliqué tant que l'auteur n'a pas touché un réglage : le rendu des
 * vitrines existantes reste donc strictement identique (le CSS ne cible que les
 * sections portant data-section-layout).
 *
 * Le CSS vit ici, dans un module partagé, et non dans une feuille : l'éditeur,
 * l'aperçu et le site autonome exporté passent tous par renderWebsiteHTML, qui
 * l'injecte. Une seule source, donc un seul rendu — c'est la règle du projet.
 */

export const SECTION_WIDTHS = {
  full: { label: "Pleine largeur", max: "none" },
  content: { label: "Contenu (80 rem)", max: "80rem" },
  narrow: { label: "Étroite (56 rem)", max: "56rem" }
};

export const SECTION_SPACING = {
  compact: { label: "Compacte", pad: "clamp(1.5rem, 3vw, 2.5rem)" },
  normal: { label: "Normale", pad: "clamp(2rem, 5vw, 4rem)" },
  airy: { label: "Aérée", pad: "clamp(3rem, 7vw, 6rem)" }
};

export const SECTION_ALIGN = {
  left: { label: "À gauche", value: "flex-start", margin: "0" },
  center: { label: "Centré", value: "center", margin: "auto" },
  right: { label: "À droite", value: "flex-end", margin: "0 0 0 auto" }
};

export const SECTION_LAYOUT_DEFAULTS = Object.freeze({ width: "content", spacing: "normal", align: "center" });

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

function pick(scale, value, fallback) {
  return Object.prototype.hasOwnProperty.call(scale, value) ? value : fallback;
}

/** Réglages normalisés d'une section, toujours complets. */
export function getSectionLayout(section) {
  const raw = (section && section.style) || {};
  return {
    width: pick(SECTION_WIDTHS, raw.width, SECTION_LAYOUT_DEFAULTS.width),
    spacing: pick(SECTION_SPACING, raw.spacing, SECTION_LAYOUT_DEFAULTS.spacing),
    align: pick(SECTION_ALIGN, raw.align, SECTION_LAYOUT_DEFAULTS.align)
  };
}

/** Vrai si l'auteur a réellement modifié quelque chose : conditionne tout le rendu. */
export function hasCustomSectionLayout(section) {
  const layout = getSectionLayout(section);
  return Object.keys(SECTION_LAYOUT_DEFAULTS).some((key) => layout[key] !== SECTION_LAYOUT_DEFAULTS[key]);
}

/** Applique un ou plusieurs réglages. Renvoie une nouvelle section, sans muter la source. */
export function setSectionLayout(section, patch = {}) {
  if (!section || typeof section !== "object") return section;
  const current = getSectionLayout(section);
  const next = { ...current };
  if (patch.width !== undefined) next.width = pick(SECTION_WIDTHS, patch.width, current.width);
  if (patch.spacing !== undefined) next.spacing = pick(SECTION_SPACING, patch.spacing, current.spacing);
  if (patch.align !== undefined) next.align = pick(SECTION_ALIGN, patch.align, current.align);
  return { ...section, style: next };
}

/** Variables CSS et attribut à poser sur l'élément <section>. Vide si rien n'est modifié. */
export function sectionLayoutAttributes(section) {
  if (!hasCustomSectionLayout(section)) return { attributes: "", style: "" };
  const layout = getSectionLayout(section);
  const width = SECTION_WIDTHS[layout.width];
  const spacing = SECTION_SPACING[layout.spacing];
  const align = SECTION_ALIGN[layout.align];
  const style = [
    "--section-max: " + width.max,
    "--section-pad: " + spacing.pad,
    "--section-align: " + align.value,
    "--section-margin: " + align.margin
  ].join("; ");
  return { attributes: ' data-section-layout="custom"', style: style + "; " };
}

/** Identifiant de section valide, utilisé par les commandes d'édition. */
export function isValidSectionId(value) {
  return typeof value === "string" && SAFE_ID.test(value);
}

/**
 * CSS partagé, injecté par le renderer pour les trois surfaces.
 * Il ne cible que les sections explicitement personnalisées.
 */
export const SECTION_LAYOUT_CSS = [
  ".artisite-root .site-section[data-section-layout=\"custom\"] {",
  "  padding-top: var(--section-pad);",
  "  padding-bottom: var(--section-pad);",
  "}",
  ".artisite-root .site-section[data-section-layout=\"custom\"] > :not(.hero-background):not(.hero-darkening-overlay):not(.site-scroll-progress) {",
  "  max-width: var(--section-max);",
  "  margin-left: var(--section-margin);",
  "  margin-right: var(--section-margin);",
  "  width: 100%;",
  "}",
  ".artisite-root .site-section[data-section-layout=\"custom\"] > .hero-fullscreen {",
  "  max-width: none;",
  "  margin-left: 0;",
  "  margin-right: 0;",
  "}",
  "@media (prefers-reduced-motion: reduce) {",
  "  .artisite-root .site-section[data-section-layout=\"custom\"] { transition: none; }",
  "}"
].join("\n");

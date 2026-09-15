/**
 * Catalogue unique des animations.
 *
 * L'audit relevait six surfaces d'animation avec six catalogues différents (10, 7, 5,
 * 6, 6 et 6 entrées), les mêmes effets portant des noms distincts selon l'endroit.
 * Ce module est la source unique : les surfaces doivent s'y référer, pas redéclarer
 * leur propre liste.
 *
 * Chaque entrée décrit ce que l'auteur comprend — un nom en français, ce que l'effet
 * fait, et à quoi il sert — plutôt qu'un identifiant technique.
 */

/**
 * kind :
 *  - "entrance" : l'élément apparaît (déclenché au chargement ou à l'apparition)
 *  - "attention" : l'élément attire l'œil une fois en place
 *  - "loop" : mouvement continu, à réserver aux éléments décoratifs
 */
export const MOTION_PRESETS = Object.freeze([
  { id: "none", label: "Aucune", kind: "none", description: "L'élément reste immobile.", durationMs: 0, easing: "linear" },
  { id: "fade-in", label: "Apparition en fondu", kind: "entrance", description: "L'élément devient progressivement visible.", durationMs: 650, easing: "ease-out" },
  { id: "slide-up", label: "Montée douce", kind: "entrance", description: "L'élément monte depuis le bas en apparaissant.", durationMs: 700, easing: "cubic-bezier(.16, 1, .3, 1)", direction: "up" },
  { id: "slide-in", label: "Entrée latérale", kind: "entrance", description: "L'élément entre depuis le côté.", durationMs: 700, easing: "cubic-bezier(.16, 1, .3, 1)", direction: "left" },
  { id: "zoom-in", label: "Zoom avant", kind: "entrance", description: "L'élément grandit légèrement pour se poser.", durationMs: 700, easing: "cubic-bezier(.16, 1, .3, 1)" },
  { id: "spring", label: "Rebond", kind: "entrance", description: "L'élément arrive avec un léger dépassement.", durationMs: 750, easing: "cubic-bezier(.34, 1.56, .64, 1)" },
  { id: "reveal", label: "Rideau", kind: "entrance", description: "L'élément se dévoile de gauche à droite.", durationMs: 750, easing: "ease-out" },
  { id: "stagger", label: "Cascade", kind: "entrance", description: "Les éléments d'un même groupe apparaissent l'un après l'autre.", durationMs: 750, easing: "ease-out" },
  { id: "magnetic", label: "Magnétique", kind: "attention", description: "L'élément se rapproche légèrement du curseur.", durationMs: 800, easing: "ease-out" },
  { id: "pulse", label: "Pulsation", kind: "attention", description: "L'élément bat doucement pour attirer l'œil.", durationMs: 1600, easing: "ease-in-out" },
  { id: "shimmer", label: "Reflet", kind: "attention", description: "Un reflet traverse l'élément.", durationMs: 2000, easing: "linear" },
  // « Rebond d'appel » et « Halo » existent pour les boutons (btn-motion-*), pas pour
  // les sections : les inclure ici aurait promis des effets que le rendu ne joue pas.
  { id: "progress-fill", label: "Barre qui se remplit", kind: "attention", description: "Une barre de progression se remplit.", durationMs: 1400, easing: "ease-out" }
]);

/** Rappel explicite : une animation se joue une fois, plusieurs fois, ou en continu. */
export const MOTION_REPEAT = Object.freeze([
  { id: "once", label: "Une fois", iterations: 1, description: "Joue au premier affichage, puis s'arrête." },
  { id: "twice", label: "Deux fois", iterations: 2, description: "Joue deux fois, puis s'arrête." },
  { id: "thrice", label: "Trois fois", iterations: 3, description: "Joue trois fois, puis s'arrête." },
  { id: "loop", label: "En continu", iterations: "infinite", description: "Ne s'arrête jamais. À réserver aux éléments décoratifs." }
]);

/** Déclencheur : quand l'animation part. */
export const MOTION_TRIGGERS = Object.freeze([
  { id: "apparition", label: "À l'apparition", description: "Quand l'élément entre dans l'écran." },
  { id: "chargement", label: "Au chargement", description: "Dès que la page s'ouvre." },
  { id: "survol", label: "Au survol", description: "Quand le curseur passe dessus." },
  { id: "clic", label: "Au clic", description: "Quand on clique sur l'élément." }
]);

const BY_ID = new Map(MOTION_PRESETS.map((preset) => [preset.id, preset]));
const REPEAT_BY_ID = new Map(MOTION_REPEAT.map((mode) => [mode.id, mode]));

export function getMotionPreset(id) {
  return BY_ID.get(String(id || "")) || BY_ID.get("none");
}

export function motionPresetIds() {
  return MOTION_PRESETS.map((preset) => preset.id);
}

/** Nom lisible, avec repli sûr sur l'identifiant pour un projet ancien. */
export function motionLabel(id) {
  const preset = BY_ID.get(String(id || ""));
  return preset ? preset.label : String(id || "");
}

export function isMotionPreset(id) {
  return BY_ID.has(String(id || ""));
}

export function getMotionRepeat(id) {
  return REPEAT_BY_ID.get(String(id || "")) || REPEAT_BY_ID.get("once");
}

/** Itérations CSS d'une répétition : un nombre, ou "infinite". */
export function motionIterations(id) {
  return getMotionRepeat(id).iterations;
}

/** Vitesse relative : multiplie la durée propre à chaque animation. */
export const MOTION_SPEEDS = Object.freeze([
  { id: "normal", label: "Normale", factor: 1, description: "La durée prévue pour cette animation." },
  { id: "lente", label: "Lente", factor: 1.6, description: "Plus posée, presque deux fois plus longue." },
  { id: "rapide", label: "Rapide", factor: 0.65, description: "Plus vive, pour enchaîner sans faire attendre." }
]);

/** Décalage avant le départ de l'animation. */
export const MOTION_DELAYS = Object.freeze([
  { id: "aucun", label: "Aucun", ms: 0, description: "L'animation part dès qu'elle est déclenchée." },
  { id: "leger", label: "Léger", ms: 150, description: "Un court silence avant de partir." },
  { id: "net", label: "Net", ms: 350, description: "Un temps d'arrêt visible, pour faire arriver les éléments l'un après l'autre." }
]);

const SPEED_BY_ID = new Map(MOTION_SPEEDS.map((speed) => [speed.id, speed]));
const DELAY_BY_ID = new Map(MOTION_DELAYS.map((delay) => [delay.id, delay]));

/** Repli sûr : une valeur inconnue retombe sur le réglage neutre. */
export function getMotionSpeed(id) {
  return SPEED_BY_ID.get(String(id || "")) || SPEED_BY_ID.get("normal");
}

export function getMotionDelay(id) {
  return DELAY_BY_ID.get(String(id || "")) || DELAY_BY_ID.get("aucun");
}

export function motionSpeedIds() {
  return MOTION_SPEEDS.map((speed) => speed.id);
}

export function motionDelayIds() {
  return MOTION_DELAYS.map((delay) => delay.id);
}

/** Durée réellement jouée : la durée du catalogue, ajustée par la vitesse choisie. */
export function motionDurationMs(presetId, speedId) {
  const preset = getMotionPreset(presetId);
  if (preset.id === "none") return 0;
  return Math.round(preset.durationMs * getMotionSpeed(speedId).factor);
}

/**
 * CSS unique de la durée et du délai, dérivé du catalogue.
 *
 * Le rendu l'injecte pour l'éditeur, l'aperçu et l'export : une seule source,
 * donc les trois surfaces se comportent pareil. Le sélecteur d'attribut est
 * répété pour l'emporter sur l'ancien réglage global encore présent dans
 * app.css et exporter.js (« 0.85s pour toutes les animations »), qui ignorait
 * la durée propre de chaque animation.
 */
export function motionTimingCSS() {
  const lines = ["/* Durée propre à chaque animation : le catalogue en est la source. */"];
  for (const preset of MOTION_PRESETS) {
    if (preset.id === "none") continue;
    lines.push('[data-motion="' + preset.id + '"] { --motion-base: ' + preset.durationMs + 'ms; }');
  }
  lines.push("[data-motion][data-motion] {");
  lines.push("  animation-duration: calc(var(--motion-base, 700ms) * var(--motion-speed, 1) * var(--anim-duration-multiplier, 1)) !important;");
  lines.push("  animation-delay: var(--motion-delay, 0ms);");
  lines.push("}");
  for (const speed of MOTION_SPEEDS) {
    if (speed.id === "normal") continue;
    lines.push('[data-motion-speed="' + speed.id + '"] { --motion-speed: ' + speed.factor + "; }");
  }
  for (const delay of MOTION_DELAYS) {
    if (delay.ms === 0) continue;
    lines.push('[data-motion-delay="' + delay.id + '"] { --motion-delay: ' + delay.ms + "ms; }");
  }
  for (const easing of MOTION_EASINGS) {
    lines.push('[data-motion-easing="' + easing.id + '"] { --motion-ease-override: ' + easing.value + '; }');
  }
  lines.push("[data-motion-easing] { animation-timing-function: var(--motion-ease-override) !important; }");
  lines.push("@media (prefers-reduced-motion: reduce) {");
  lines.push("  [data-motion] { animation-delay: 0ms !important; }");
  lines.push("}");
  return lines.join("\n");
}

/** Courbe de l'animation : la facon dont le mouvement ralentit. */
export const MOTION_EASINGS = Object.freeze([
  { id: "douce", label: "Douce", value: "cubic-bezier(.16, 1, .3, 1)", description: "Depart vif, arrivee posee." },
  { id: "rebond", label: "Rebond", value: "cubic-bezier(.34, 1.56, .64, 1)", description: "Petit depassement avant de se poser." },
  { id: "lineaire", label: "Régulière", value: "linear", description: "Vitesse constante, sans acceleration." }
]);

const EASING_BY_ID = new Map(MOTION_EASINGS.map((easing) => [easing.id, easing]));

export function getMotionEasing(id) {
  return EASING_BY_ID.get(String(id || "")) || EASING_BY_ID.get("douce");
}

export function motionEasingIds() {
  return MOTION_EASINGS.map((easing) => easing.id);
}
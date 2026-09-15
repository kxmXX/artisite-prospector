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
  { id: "bounce", label: "Rebond d'appel", kind: "attention", description: "L'élément rebondit pour signaler une action.", durationMs: 1200, easing: "ease-in-out" },
  { id: "glow", label: "Halo", kind: "attention", description: "L'élément s'éclaire brièvement.", durationMs: 1800, easing: "ease-in-out" },
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

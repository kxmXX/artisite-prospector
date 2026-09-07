// Reusable interaction and layout patterns distilled from the referenced
// inspiration directories. These are implementation recipes, not copied site
// content, so the editor can expose them as editable primitives.
export const INSPIRATION_PATTERNS = [
  { id: "reveal", label: "Reveal au scroll", source: "Landing Love · 60fps", tags: ["scroll", "fade"], description: "Entrée progressive d'un bloc avec focus sur le contenu." },
  { id: "stagger", label: "Stagger éditorial", source: "60fps", tags: ["stagger", "cards"], description: "Les éléments d'une grille apparaissent en cascade." },
  { id: "spring", label: "Spring physique", source: "60fps", tags: ["spring", "button"], description: "Retour élastique court sur un composant interactif." },
  { id: "progress", label: "Progression", source: "60fps", tags: ["progress", "loading"], description: "Remplissage visuel pour étapes, devis ou chargement." },
  { id: "bento", label: "Bento modulaire", source: "SaaSpo", tags: ["bento", "saas"], description: "Cartes hiérarchisées pour présenter plusieurs bénéfices." },
  { id: "spotlight", label: "Spotlight doux", source: "Curations Supply", tags: ["glow", "focus"], description: "Halo discret qui guide l'œil vers l'action principale." },
  { id: "glass", label: "Glass surface", source: "Sleek Design", tags: ["glass", "surface"], description: "Surface translucide avec bord et profondeur mesurés." },
  { id: "brutalist", label: "Keycap tactile", source: "Sleek Design", tags: ["button", "tactile"], description: "Bouton à relief inspiré d'une touche de clavier." }
];

export function getInspirationPattern(id) {
  return INSPIRATION_PATTERNS.find(pattern => pattern.id === id) || null;
}

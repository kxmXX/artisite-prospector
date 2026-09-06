export const FONT_CATALOG = [
  { name: "Inter", category: "Sans", description: "Neutre et ultra lisible" },
  { name: "DM Sans", category: "Sans", description: "Géométrique et chaleureux" },
  { name: "Manrope", category: "Sans", description: "Compact et contemporain" },
  { name: "Plus Jakarta Sans", category: "Sans", description: "Moderne et percutant" },
  { name: "Space Grotesk", category: "Sans", description: "Technique et éditorial" },
  { name: "Sora", category: "Sans", description: "Rond et digital" },
  { name: "Outfit", category: "Sans", description: "Doux et accessible" },
  { name: "Syne", category: "Display", description: "Expressif et identitaire" },
  { name: "Urbanist", category: "Sans", description: "Élégant et flexible" },
  { name: "Bricolage Grotesque", category: "Display", description: "Singulier et expérimental" },
  { name: "Instrument Sans", category: "Sans", description: "Sobre et premium" },
  { name: "Instrument Serif", category: "Serif", description: "Contraste éditorial" },
  { name: "Playfair Display", category: "Serif", description: "Luxe et classique" },
  { name: "Fraunces", category: "Serif", description: "Organique et expressif" },
  { name: "Cormorant Garamond", category: "Serif", description: "Éditorial et raffiné" },
  { name: "Libre Baskerville", category: "Serif", description: "Confiance et tradition" },
  { name: "IBM Plex Sans", category: "Sans", description: "Technique et institutionnel" },
  { name: "IBM Plex Mono", category: "Mono", description: "Données et interfaces" },
  { name: "JetBrains Mono", category: "Mono", description: "Précis et développeur" },
  { name: "Figtree", category: "Sans", description: "Clair et polyvalent" }
];

let fontCatalogPromise = null;

export function ensureFontCatalog() {
  if (typeof document === "undefined") return Promise.resolve();
  if (document.getElementById("artisite-font-catalog")) return Promise.resolve();
  if (fontCatalogPromise) return fontCatalogPromise;

  fontCatalogPromise = new Promise((resolve) => {
    const query = new URLSearchParams();
    FONT_CATALOG.forEach(({ name }) => {
      query.append("family", `${name}:wght@400;500;600;700`);
    });
    query.set("display", "swap");

    const link = document.createElement("link");
    link.id = "artisite-font-catalog";
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${query.toString()}`;
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });

  return fontCatalogPromise;
}

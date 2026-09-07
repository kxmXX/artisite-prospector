export const FONT_CATALOG = [
  { name: "Satoshi", category: "Sans", description: "Géométrique suisse & moderne (Uncut)", source: "fontshare" },
  { name: "General Sans", category: "Sans", description: "Grotesk percutant & élégant", source: "fontshare" },
  { name: "Clash Display", category: "Display", description: "Audacieux pour BTP & artisans", source: "fontshare" },
  { name: "Cabinet Grotesk", category: "Display", description: "Singulier et architectural", source: "fontshare" },
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
    // 1. Fontshare (Uncut.wtf contemporary fonts)
    if (!document.getElementById("artisite-fontshare-catalog")) {
      const fsLink = document.createElement("link");
      fsLink.id = "artisite-fontshare-catalog";
      fsLink.rel = "stylesheet";
      fsLink.href = "https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&f[]=general-sans@500,600,700&f[]=clash-display@500,600,700&f[]=cabinet-grotesk@500,700,800&display=swap";
      document.head.appendChild(fsLink);
    }

    // 2. Google Fonts API v2 (Unencoded colons and semicolons required by Google)
    const googleFonts = FONT_CATALOG.filter(f => f.source !== "fontshare");
    const query = googleFonts.map(f => `family=${f.name.replace(/ /g, "+")}:wght@400;500;600;700`).join("&") + "&display=swap";

    const link = document.createElement("link");
    link.id = "artisite-font-catalog";
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${query}`;
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });

  return fontCatalogPromise;
}

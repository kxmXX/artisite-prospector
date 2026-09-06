/**
 * High-definition, standalone vector SVG fallbacks for every trade and section type.
 * Ensures that images NEVER fail, 403, or render as blank boxes.
 */

export const TRADE_PALETTES = {
  paysagiste: {
    title: "Espaces Verts & Paysage",
    sub: "Création, Aménagement & Entretien de Jardins",
    gradStart: "#064e3b",
    gradMid: "#047857",
    gradEnd: "#022c22",
    accent: "#34d399",
    icon: `<path d="M12 2L9 9l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z" fill="none" stroke="#34d399" stroke-width="2"/>
           <path d="M12 22v-9m0 0c2-3 6-3 8 0m-8 0c-2-3-6-3-8 0" stroke="#a7f3d0" stroke-width="2.5" stroke-linecap="round"/>`
  },
  plombier: {
    title: "Plomberie & Chauffage",
    sub: "Dépannage Rapide, Chauffe-Eau & Salle de Bain",
    gradStart: "#0c4a6e",
    gradMid: "#0284c7",
    gradEnd: "#082f49",
    accent: "#38bdf8",
    icon: `<path d="M12 3v18m-6-9h12M6 8a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2H6V8z" fill="none" stroke="#38bdf8" stroke-width="2.5"/>
           <circle cx="12" cy="17" r="3" fill="#bae6fd"/>`
  },
  electricien: {
    title: "Électricité Générale",
    sub: "Mise aux Normes, Tableaux & Dépannage 24/7",
    gradStart: "#78350f",
    gradMid: "#d97706",
    gradEnd: "#451a03",
    accent: "#fbbf24",
    icon: `<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#fbbf24" stroke="#fef3c7" stroke-width="2"/>`
  },
  couvreur: {
    title: "Couverture & Toiture",
    sub: "Zinguerie, Rénovation, Étanchéité & Démoussage",
    gradStart: "#7c2d12",
    gradMid: "#ea580c",
    gradEnd: "#431407",
    accent: "#fdba74",
    icon: `<path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="none" stroke="#fdba74" stroke-width="2.5"/>
           <path d="M9 22V12h6v10" stroke="#ffedd5" stroke-width="2.5"/>`
  },
  peintre: {
    title: "Peinture & Rénovation",
    sub: "Peinture Intérieure, Extérieure & Ravalement",
    gradStart: "#581c87",
    gradMid: "#9333ea",
    gradEnd: "#3b0764",
    accent: "#c084fc",
    icon: `<path d="M18.37 2.63L14 7l3 3 4.37-4.37a2.12 2.12 0 1 0-3-3z" fill="#c084fc"/>
           <path d="M9 12l-5 5v4h4l5-5" stroke="#f3e8ff" stroke-width="2.5" fill="none"/>`
  },
  macon: {
    title: "Maçonnerie & Gros Œuvre",
    sub: "Fondations, Murs Porteurs & Agrandissements",
    gradStart: "#3f3f46",
    gradMid: "#52525b",
    gradEnd: "#18181b",
    accent: "#e4e4e7",
    icon: `<rect x="3" y="4" width="18" height="6" rx="1" fill="none" stroke="#e4e4e7" stroke-width="2.5"/>
           <rect x="6" y="10" width="12" height="6" rx="1" fill="none" stroke="#a1a1aa" stroke-width="2"/>
           <rect x="3" y="16" width="18" height="6" rx="1" fill="none" stroke="#e4e4e7" stroke-width="2.5"/>`
  },
  menuisier: {
    title: "Menuiserie & Agencement",
    sub: "Fenêtres, Portes, Escaliers & Mobilier Bois",
    gradStart: "#78350f",
    gradMid: "#92400e",
    gradEnd: "#451a03",
    accent: "#fde68a",
    icon: `<rect x="4" y="3" width="16" height="18" rx="2" fill="none" stroke="#fde68a" stroke-width="2.5"/>
           <line x1="12" y1="3" x2="12" y2="21" stroke="#fde68a" stroke-width="2"/>
           <line x1="4" y1="12" x2="20" y2="12" stroke="#fde68a" stroke-width="2"/>`
  },
  serrurier: {
    title: "Serrurerie & Sécurité",
    sub: "Ouverture de Porte, Blindage & Serrures A2P",
    gradStart: "#1e293b",
    gradMid: "#334155",
    gradEnd: "#0f172a",
    accent: "#94a3b8",
    icon: `<rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="#94a3b8" stroke-width="2.5"/>
           <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#e2e8f0" stroke-width="2.5"/>`
  },
  climatisation: {
    title: "Pompe à Chaleur & Climatisation",
    sub: "Installation, Entretien & Économies d'Énergie",
    gradStart: "#134e4a",
    gradMid: "#0d9488",
    gradEnd: "#042f2e",
    accent: "#5eead4",
    icon: `<path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" stroke="#5eead4" stroke-width="2" stroke-linecap="round"/>`
  },
  restaurant: {
    title: "Gastronomie & Cuisine Maison",
    sub: "Produits Frais du Terroir, Carte de Saison",
    gradStart: "#4c0519",
    gradMid: "#9f1239",
    gradEnd: "#2e020d",
    accent: "#fda4af",
    icon: `<path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" fill="none" stroke="#fda4af" stroke-width="2.5"/>
           <line x1="6" y1="1" x2="6" y2="4" stroke="#ffe4e6" stroke-width="2"/>
           <line x1="10" y1="1" x2="10" y2="4" stroke="#ffe4e6" stroke-width="2"/>`
  },
  coiffeur: {
    title: "Coiffure & Salon de Beauté",
    sub: "Coupe Tendance, Coloration & Soins Végétaux",
    gradStart: "#831843",
    gradMid: "#db2777",
    gradEnd: "#500724",
    accent: "#f472b6",
    icon: `<circle cx="6" cy="6" r="3" fill="none" stroke="#f472b6" stroke-width="2"/>
           <circle cx="6" cy="18" r="3" fill="none" stroke="#f472b6" stroke-width="2"/>
           <line x1="20" y1="4" x2="8.12" y2="15.88" stroke="#fbcfe8" stroke-width="2.5"/>
           <line x1="14.47" y1="14.48" x2="20" y2="20" stroke="#fbcfe8" stroke-width="2.5"/>
           <line x1="8.12" y1="8.12" x2="12" y2="12" stroke="#fbcfe8" stroke-width="2.5"/>`
  },
  boulanger: {
    title: "Boulangerie & Pâtisserie Fine",
    sub: "Pains Traditionnels au Levain & Douceurs Maison",
    gradStart: "#713f12",
    gradMid: "#b45309",
    gradEnd: "#422006",
    accent: "#fde047",
    icon: `<path d="M2 17c1.5-4.5 4.5-7 10-7s8.5 2.5 10 7H2z" fill="none" stroke="#fde047" stroke-width="2.5"/>
           <path d="M7 10c0-3 2-6 5-6s5 3 5 6" fill="none" stroke="#fef08a" stroke-width="2"/>
           <line x1="2" y1="17" x2="22" y2="17" stroke="#fde047" stroke-width="2.5"/>`
  },
  avocat: {
    title: "Cabinet d'Avocat & Conseil",
    sub: "Défense Juridique, Droit des Affaires & Contentieux",
    gradStart: "#0f172a",
    gradMid: "#1e293b",
    gradEnd: "#020617",
    accent: "#94a3b8",
    icon: `<line x1="12" y1="3" x2="12" y2="21" stroke="#cbd5e1" stroke-width="2.5"/>
           <path d="M5 6h14M5 6l-3 7h6L5 6zm14 0l-3 7h6l-3-7z" fill="none" stroke="#94a3b8" stroke-width="2"/>
           <line x1="3" y1="21" x2="21" y2="21" stroke="#cbd5e1" stroke-width="2.5"/>`
  }
};

export function getTradeFallbackDataUrl(tradeId = "paysagiste", type = "hero", customTitle = "") {
  const t = TRADE_PALETTES[tradeId] || TRADE_PALETTES.paysagiste;
  const title = customTitle || t.title;
  const subtitle = t.sub;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${t.gradStart}"/>
      <stop offset="50%" stop-color="${t.gradMid}"/>
      <stop offset="100%" stop-color="${t.gradEnd}"/>
    </linearGradient>
    <radialGradient id="radialLight" cx="70%" cy="20%" r="70%">
      <stop offset="0%" stop-color="${t.accent}" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="${t.gradStart}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.16)"/>
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.04)"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="24" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="100%" height="100%" fill="url(#bgGrad)"/>
  <rect width="100%" height="100%" fill="url(#radialLight)"/>

  <!-- Geometric Architectural Lines -->
  <g opacity="0.1" stroke="#ffffff" stroke-width="1.5">
    <line x1="0" y1="200" x2="1200" y2="200"/>
    <line x1="0" y1="400" x2="1200" y2="400"/>
    <line x1="0" y1="600" x2="1200" y2="600"/>
    <line x1="300" y1="0" x2="300" y2="800"/>
    <line x1="600" y1="0" x2="600" y2="800"/>
    <line x1="900" y1="0" x2="900" y2="800"/>
    <circle cx="950" cy="350" r="280" fill="none"/>
    <circle cx="950" cy="350" r="180" fill="none"/>
  </g>

  <!-- Central Visual Showcase Card -->
  <rect x="100" y="120" width="1000" height="560" rx="28" fill="url(#cardGrad)" stroke="rgba(255, 255, 255, 0.22)" stroke-width="2" filter="url(#shadow)"/>

  <!-- Icon Badge Container -->
  <g transform="translate(160, 190)">
    <rect width="96" height="96" rx="24" fill="rgba(255, 255, 255, 0.15)" stroke="rgba(255, 255, 255, 0.3)" stroke-width="2"/>
    <g transform="translate(36, 36) scale(1.5)">
      ${t.icon}
    </g>
  </g>

  <!-- Text Hierarchy -->
  <g transform="translate(160, 340)">
    <!-- Category Pill -->
    <rect width="210" height="34" rx="17" fill="rgba(0,0,0,0.3)" stroke="${t.accent}" stroke-width="1.5"/>
    <text x="24" y="22" fill="${t.accent}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" letter-spacing="1.5">RÉALISATION PRO 4K</text>
    
    <!-- Main Headline -->
    <text x="0" y="90" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="800" letter-spacing="-0.5">${escapeXml(title)}</text>
    
    <!-- Subtitle -->
    <text x="0" y="140" fill="rgba(255, 255, 255, 0.85)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="500">${escapeXml(subtitle)}</text>
  </g>

  <!-- Bottom Quality Seal -->
  <g transform="translate(160, 560)">
    <circle cx="16" cy="16" r="16" fill="${t.accent}"/>
    <path d="M10 16l4 4 8-8" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="44" y="21" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600">Savoir-faire artisanal vérifié • Garantie d'intervention de proximité</text>
  </g>

  <!-- Accent glow orb -->
  <circle cx="1020" cy="200" r="12" fill="${t.accent}" opacity="0.8"/>
  <circle cx="1020" cy="200" r="28" fill="${t.accent}" opacity="0.2"/>
</svg>
  `.trim();

  // These URLs are also embedded in single-quoted inline event attributes by
  // the renderer. Encode apostrophes explicitly so a font name such as
  // “Segoe UI” cannot terminate the handler and produce a browser syntax error.
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg).replace(/'/g, "%27")}`;
}

function escapeXml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe || '';
  return unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

import { getIcon } from "./icons.js";

/**
 * Section Catalog and Variant presets according to Cahier des Charges (Point 29 & 42).
 */
export const SECTION_DEFINITIONS = [
  {
    type: "hero",
    title: "Hero Section (En-tête principal)",
    description: "Première impression visuelle avec accroche forte, badge et boutons d'appel direct.",
    icon: "sparkles",
    variants: [
      { id: "split-image", label: "Split Image (Texte à gauche + Photo à droite)", desc: "Idéal pour équilibrer accroche commerciale et visuel chantier." },
      { id: "fullscreen-image", label: "Plein Écran Immersif (Arrière-plan photo)", desc: "Impact visuel maximal avec texte contrasté et boutons lumineux." },
      { id: "minimal", label: "Éditorial Épuré (Sobre & Typographique)", desc: "Design minimaliste haute confiance avec typographie raffinée." },
      { id: "dark", label: "Luxe & Sombre (Fond nuit contrasté)", desc: "Atmosphère nocturne élégante avec boutons d'appel mis en valeur." }
    ]
  },
  {
    type: "services",
    title: "Grille de Services / Prestations",
    description: "Présente précisément les savoir-faire, photos et tarifs indicatifs de l'artisan.",
    icon: "layers",
    variants: [
      { id: "cards-grid", label: "Grille 3 Colonnes", desc: "Cartes soignées avec photo 16:10, tag de catégorie et bouton devis." },
      { id: "2-columns", label: "Grand Format 2 Colonnes", desc: "Grandes cartes aérées avec descriptif étendu pour prestations complexes." },
      { id: "editorial", label: "Rangées Éditoriales Alternées", desc: "Alternance image/texte très élégante digne d'un magazine d'architecture." },
      { id: "minimal-list", label: "Liste Structurée Compacte", desc: "Format condensé et moderne avec icônes et étiquettes prix." }
    ]
  },
  {
    type: "about",
    title: "Présentation / Histoire Locale",
    description: "Humanise l'entreprise et rassure le prospect avec le parcours de l'artisan.",
    icon: "checkCircle",
    variants: [
      { id: "editorial-split", label: "Portrait & Récit Artisanal", desc: "Portrait avec badge vérifié à gauche et histoire passionnée à droite." },
      { id: "centered-badge", label: "Centré & Engagements Qualité", desc: "Mise en avant des 4 engagements clés et valeurs de l'entreprise." },
      { id: "quote-card", label: "Manifeste & Parole d'Artisan", desc: "Citation grand format mettant l'accent sur la confiance et la proximité." }
    ]
  },
  {
    type: "beforeAfter",
    title: "Comparateur Avant / Après",
    description: "Curseur interactif glissant démontrant l'efficacité spectaculaire des chantiers.",
    icon: "sliders",
    variants: [
      { id: "interactive-slider", label: "Curseur Interactif Glissant", desc: "Composant interactif manipulable à la souris et au toucher tactile." }
    ]
  },
  {
    type: "gallery",
    title: "Galerie Photos & Portfolio",
    description: "Photos 4K du métier avec agrandissement instantané en mode lightbox.",
    icon: "eye",
    variants: [
      { id: "masonry-grid", label: "Mosaïque Visuelle 3 Colonnes", desc: "Grille équilibrée avec tags de spécialités et lightbox plein écran." },
      { id: "editorial-grid", label: "Grille Éditoriale avec Photo Vedette", desc: "Une grande photo principale à gauche complétée par 4 vignettes." }
    ]
  },
  {
    type: "realisations",
    title: "Chantiers & Réalisations Récentes",
    description: "Exemples concrets de travaux réalisés dans la ville et le secteur du prospect.",
    icon: "badgeCheck",
    variants: [
      { id: "cards-3", label: "Cartes Chantiers avec Localisation", desc: "Visuel, type de chantier, ville et court résumé technique." }
    ]
  },
  {
    type: "reviews",
    title: "Avis Clients & Preuve Sociale",
    description: "Témoignages locaux avec note globale 4.9/5 et macarons de confiance.",
    icon: "star",
    variants: [
      { id: "google-cards", label: "Format Google Reviews 4.9/5", desc: "Badge de note certifiée avec cartes d'avis individuels détaillés." },
      { id: "quote-carousel", label: "Citations Grand Format", desc: "Cartes témoignages épurées mettant en avant la rapidité et la propreté." }
    ]
  },
  {
    type: "stats",
    title: "Chiffres Clés & Métriques Réelles",
    description: "Indicateurs rassurants (délai devis 24h, garantie décennale, déplacement gratuit).",
    icon: "clock",
    variants: [
      { id: "ribbon", label: "Bandeau Signature Pleine Largeur", desc: "4 compteurs percutants sur la couleur primaire de la marque." }
    ]
  },
  {
    type: "quoteSimulator",
    title: "Simulateur de Devis en Ligne",
    description: "Formulaire interactif court permettant au client final d'estimer son besoin en 3 clics.",
    icon: "dollarSign",
    variants: [
      { id: "interactive-calculator", label: "Simulateur 3 Étapes Interactif", desc: "Sélecteurs de type de travaux, surface et coordonnées pour rappel sous 24h." }
    ]
  },
  {
    type: "hours",
    title: "Horaires & Disponibilités",
    description: "Horaires d'ouverture précis, badge statut en direct et ligne d'urgence 7j/7.",
    icon: "calendar",
    variants: [
      { id: "table-card", label: "Tableau Moderne d'Ouverture", desc: "Grille claire jour par jour avec mise en évidence des créneaux." }
    ]
  },
  {
    type: "location",
    title: "Zone d'Intervention & Carte",
    description: "Rayon de déplacement, communes desservies et calcul d'itinéraire direct.",
    icon: "mapPin",
    variants: [
      { id: "zone-card", label: "Radar d'Intervention & Communes", desc: "Carte stylisée, rayon kilométrique sans frais et liste des communes." }
    ]
  },
  {
    type: "faq",
    title: "Foire Aux Questions (FAQ)",
    description: "Accordéon interactif répondant aux interrogations habituelles des clients.",
    icon: "helpCircle",
    variants: [
      { id: "accordion", label: "Accordéon Fluide Interactif", desc: "Questions cliquables avec déploiement animé de la réponse." }
    ]
  },
  {
    type: "cta",
    title: "Bannière d'Appel à l'Action Finale",
    description: "Section commerciale percutante incitant au contact avant le bas de page.",
    icon: "send",
    variants: [
      { id: "banner-action", label: "Bannière Contraste Haute Conversion", desc: "Titre mobilisateur, rappel du devis gratuit et bouton d'appel direct." }
    ]
  }
];

export function renderAddSectionModal(project) {
  return `
    <div id="add-section-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        <!-- Header -->
        <div class="px-8 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50">
          <div>
            <div class="text-[10px] font-bold uppercase tracking-wider text-orange-600">Bibliothèque de Composants v4</div>
            <h2 class="font-heading text-xl font-black text-slate-900 mt-0.5">Ajouter une Section au Site</h2>
          </div>
          <button type="button" onclick="window.app.closeAddSectionModal()" class="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors">
            ${getIcon("x", "w-5 h-5")}
          </button>
        </div>

        <!-- Section List & Variant Picker -->
        <div class="p-6 overflow-y-auto space-y-4 flex-1">
          <p class="text-xs text-slate-500 mb-2">
            Sélectionnez le type de section et son style de disposition. La section sera générée avec des contenus adaptés au métier <strong>${project?.business?.tradeLabel || 'de votre prospect'}</strong>.
          </p>

          <div class="grid md:grid-cols-2 gap-4">
            ${SECTION_DEFINITIONS.map(secDef => {
              return `
                <div class="bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-orange-300 rounded-2xl p-4.5 transition-all space-y-3 flex flex-col justify-between shadow-sm hover:shadow-md">
                  <div>
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-xl bg-orange-100/80 text-orange-600 flex items-center justify-center flex-shrink-0">
                        ${getIcon(secDef.icon, "w-4 h-4")}
                      </div>
                      <div class="truncate">
                        <h4 class="font-heading font-bold text-xs text-slate-900 truncate">${secDef.title}</h4>
                        <div class="text-[10px] text-slate-400 truncate">${secDef.description}</div>
                      </div>
                    </div>

                    <!-- Variant Selection Dropdown -->
                    <div class="mt-3">
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Variante visuelle :</label>
                      <select id="variant-select-${secDef.type}" class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-orange-500">
                        ${secDef.variants.map(v => `
                          <option value="${v.id}">${v.label}</option>
                        `).join('')}
                      </select>
                    </div>
                  </div>

                  <button type="button" onclick="window.app.handleAddSection('${secDef.type}', document.getElementById('variant-select-${secDef.type}').value)" class="w-full py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-orange-600 transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                    ${getIcon("plus", "w-3.5 h-3.5")}
                    <span>Insérer cette section</span>
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Footer -->
        <div class="px-8 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0 text-xs text-slate-500">
          <span>Toutes les sections restent modifiables, déplaçables et masquables à tout moment.</span>
          <button type="button" onclick="window.app.closeAddSectionModal()" class="px-4 py-1.5 rounded-lg border border-slate-200 font-semibold hover:bg-slate-100">
            Fermer
          </button>
        </div>

      </div>
    </div>
  `;
}

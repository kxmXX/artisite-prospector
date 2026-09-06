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
  const sections = project?.sections || [];

  return `
    <div id="add-section-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-2xl shadow-2xl max-w-4xl lg:max-w-5xl w-full border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-zinc-200 flex items-center justify-between flex-shrink-0 bg-white">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center text-white font-bold text-sm">
              ⊞
            </div>
            <div>
              <div class="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">Catalogue & Bibliothèque</div>
              <h2 class="font-bold text-base sm:text-lg text-zinc-950 mt-0.5">Sections Disponibles pour ${project?.business?.name || 'le Site'}</h2>
            </div>
          </div>
          <button type="button" onclick="window.app.closeAddSectionModal()" class="p-2 text-zinc-400 hover:text-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors">
            ${getIcon("x", "w-5 h-5")}
          </button>
        </div>

        <!-- Section List & Variant Picker with PC Grid Proportions -->
        <div class="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-zinc-100 text-zinc-500">
            <span>Cliquez sur <strong>« Aller à la section »</strong> pour naviguer directement dessus, ou ajoutez de nouvelles sections calibrées pour <strong>${project?.business?.tradeLabel || 'votre artisan'}</strong>.</span>
            <span class="font-semibold text-zinc-800 flex-shrink-0">${sections.length} sections actives</span>
          </div>

          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            ${SECTION_DEFINITIONS.map(secDef => {
              const existingSec = sections.find(s => s.type === secDef.type);

              return `
                <div class="bg-zinc-50/80 hover:bg-white border ${existingSec ? 'border-zinc-300 shadow-2xs' : 'border-zinc-200'} hover:border-zinc-400 rounded-2xl p-4 transition-all space-y-3.5 flex flex-col justify-between group">
                  <div>
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-xl bg-white border border-zinc-200 text-zinc-800 flex items-center justify-center flex-shrink-0 shadow-2xs">
                        ${getIcon(secDef.icon, "w-4 h-4 text-zinc-700")}
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1.5">
                          <h4 class="font-bold text-xs sm:text-sm text-zinc-900 truncate">${secDef.title}</h4>
                        </div>
                        <p class="text-[11px] text-zinc-500 line-clamp-2 mt-0.5 leading-relaxed">${secDef.description}</p>
                      </div>
                    </div>

                    <!-- Variant Selection Dropdown -->
                    <div class="mt-3 pt-2.5 border-t border-zinc-200/60">
                      <label class="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Variante :</label>
                      <select id="variant-select-${secDef.type}" class="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 font-medium focus:border-zinc-900 focus:outline-none">
                        ${secDef.variants.map(v => `
                          <option value="${v.id}">${v.label}</option>
                        `).join('')}
                      </select>
                    </div>
                  </div>

                  <div class="pt-1">
                    ${existingSec ? `
                      <div class="flex items-center gap-2">
                        <button type="button" onclick="window.app.closeAddSectionModal(); window.app.scrollToSection('${existingSec.id}');" class="btn-keycap btn-keycap-light flex-1 py-2 rounded-lg text-xs font-semibold text-zinc-800 border border-zinc-200 flex items-center justify-center gap-1.5 shadow-xs" title="Défiler jusqu'à cette section sur la page">
                          ${getIcon("eye", "w-3.5 h-3.5 text-zinc-600")}
                          <span>Aller à la section</span>
                        </button>
                        <button type="button" onclick="window.app.handleAddSection('${secDef.type}', document.getElementById('variant-select-${secDef.type}').value)" class="btn-keycap btn-keycap-dark px-3 py-2 rounded-lg text-xs font-semibold text-white shadow-xs" title="Ajouter une section supplémentaire">
                          ${getIcon("plus", "w-3.5 h-3.5")}
                        </button>
                      </div>
                    ` : `
                      <button type="button" onclick="window.app.handleAddSection('${secDef.type}', document.getElementById('variant-select-${secDef.type}').value)" class="w-full btn-keycap btn-keycap-dark py-2 rounded-lg text-xs font-semibold text-white shadow-xs flex items-center justify-center gap-1.5">
                        ${getIcon("plus", "w-3.5 h-3.5")}
                        <span>Insérer cette section</span>
                      </button>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between flex-shrink-0 text-xs text-zinc-500">
          <span>Sections réorganisables par simple glisser-déposer sur la gauche.</span>
          <button type="button" onclick="window.app.closeAddSectionModal()" class="btn-keycap btn-keycap-light px-4 py-1.5 rounded-lg font-semibold text-zinc-700 hover:bg-zinc-100">
            Fermer
          </button>
        </div>

      </div>
    </div>
  `;
}

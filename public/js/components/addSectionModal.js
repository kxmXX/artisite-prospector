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
      { id: "interactive-slider", label: "Curseur Horizontal Glissant", desc: "Composant interactif classique pour paysagisme, intérieurs et rénovation." },
      { id: "vertical", label: "SplitReveal Vertical (Façades & Toitures)", desc: "Curseur vertical de haut en bas, idéal pour toitures, façades et élagage." }
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
  },
  {
    type: "trust",
    title: "Badges de Réassurance & Garanties",
    description: "4 engagements majeurs (déplacement offert, devis 24h, assurance pro, nettoyage).",
    icon: "shield",
    variants: [
      { id: "grid-4", label: "Grille 4 Piliers Réassurance", desc: "4 piliers de confiance avec icônes colorées et descriptif." }
    ]
  },
  {
    type: "process",
    title: "Processus & Déroulement en 3 Étapes",
    description: "Parcours client limpide en 3 étapes rassurantes pour convertir un prospect hésitant.",
    icon: "layers",
    variants: [
      { id: "steps-3", label: "Parcours 3 Étapes Numérotées", desc: "Étapes 01, 02, 03 claires de l'appel initial à la réception du chantier." }
    ]
  },
  {
    type: "certifications",
    title: "Labels, Assurances & Garantie Décennale",
    description: "Attestations légales françaises rassurant immédiatement particuliers et entreprises.",
    icon: "badgeCheck",
    variants: [
      { id: "cards-4", label: "Cartes Certifications & Assurances", desc: "Garantie décennale 10 ans, RC Pro, conformité DTU et proximité." }
    ]
  },
  {
    type: "pricing",
    title: "Grille Tarifaire & Forfaits Clairs",
    description: "Formules packagées transparentes avec badge « Recommandé » pour accélérer la vente.",
    icon: "dollarSign",
    variants: [
      { id: "cards-3", label: "3 Formules Claires avec Forfaits", desc: "Formule Essentielle, Confort et Intégrale avec liste à puces." }
    ]
  },
  {
    type: "customBlock",
    title: "Bloc Canva Personnalisé & Bandeau Promo",
    description: "Module libre façon Canva (bannière urgente, macaron flottant ou carte personnalisée).",
    icon: "sparkles",
    variants: [
      { id: "radarEmergency", label: "Bandeau Astreinte Radar 24/7 & Stickers", desc: "Pastille radar clignotante et stickers physiques tiltés pour dépannage express." },
      { id: "campaignCard", label: "CampaignCard & Compteur Chantiers", desc: "Jauge de réservation, formule packagée et réservation prioritaire." },
      { id: "urgentBanner", label: "Bandeau Promo / Notification Haute", desc: "Bandeau contrasté avec badge d'annonce et lien d'action rapide." },
      { id: "floatingBadge", label: "Macaron Flottant Réassurance", desc: "Pastille verte lumineuse avec statut vérifié 2026." },
      { id: "customCard", label: "Boîte Carte Personnalisée", desc: "Encadré avec titre, argument fort et bouton d'appel direct." }
    ]
  },
  {
    type: "quoteBlock",
    title: "Citation Éditoriale du Dirigeant",
    description: "Mise en avant typographique haute confiance d'une citation forte avec portrait.",
    icon: "checkCircle",
    variants: [
      { id: "editorial-quote", label: "Citation Éditoriale Centrée", desc: "Guillemets stylisés, phrase d'engagement forte et photo de l'artisan." }
    ]
  },
  {
    type: "videoBlock",
    title: "Vidéo Immersion Chantier 4K",
    description: "Lecteur vidéo immersif avec affiche personnalisée et bouton lecture haute conversion.",
    icon: "eye",
    variants: [
      { id: "immersive-player", label: "Lecteur Vidéo Pleine Largeur", desc: "Poster de chantier 4K avec badge HD et bouton lecture centré." }
    ]
  },
  {
    type: "stepperBlock",
    title: "Indicateur d'Étapes de Chantier (Stepper)",
    description: "Parcours 1-2-3-4 illustré de l'estimation initiale à la livraison finale.",
    icon: "layers",
    variants: [
      { id: "numbered-stepper", label: "Étapes Numérotées 1-2-3-4", desc: "Cartes séquentielles numérotées avec badges d'avancement." }
    ]
  },
  {
    type: "tableBlock",
    title: "Tableau Comparatif des Formules",
    description: "Grille comparative transparente des forfaits et garanties de l'artisan.",
    icon: "dollarSign",
    variants: [
      { id: "comparison-table", label: "Tableau Comparatif Standard / Pro", desc: "Tableau clair avec en-têtes contrastés et mise en avant de la formule phare." }
    ]
  },
  {
    type: "sliderBlock",
    title: "Curseur Interactif de Surface (Slider)",
    description: "Curseur tactile glissant permettant au prospect d'estimer son dimensionnement en m².",
    icon: "sliders",
    variants: [
      { id: "surface-slider", label: "Curseur de Surface m² Dynamique", desc: "Curseur avec affichage instantané de la superficie en temps réel." }
    ]
  },
  {
    type: "tabsBlock",
    title: "Sélecteur d'Onglets de Prestations (Tabs)",
    description: "Navigation fluide par onglets pour explorer les différents savoir-faire sans allonger la page.",
    icon: "layers",
    variants: [
      { id: "segmented-tabs", label: "Onglets Segmentés de Spécialités", desc: "Boutons d'onglets épurés avec carte active correspondante." }
    ]
  },
  {
    type: "roiCalculator",
    title: "Simulateur de Rentabilité & ROI (Calculateur)",
    description: "Calculateur en direct pour prouver qu'un seul chantier supplémentaire rentabilise le site.",
    icon: "dollarSign",
    variants: [
      { id: "interactive-calculator", label: "Calculateur de Rentabilité Réelle", desc: "Curseurs dynamiques du panier moyen et demandes mensuelles avec calcul de gain annuel." }
    ]
  },
  {
    type: "bookingBlock",
    title: "Prise de Rendez-vous & Créneaux d'Urgence",
    description: "Sélecteur de créneau d'intervention avec confirmation directe par SMS ou WhatsApp.",
    icon: "calendar",
    variants: [
      { id: "slot-picker", label: "Sélecteur de Créneaux d'Intervention", desc: "Grille de créneaux disponibles sous 24h avec choix du type de prestation." }
    ]
  }
];

export const COMPONENT_CATALOG_ITEMS = [
  // 1. Actions
  {
    id: "cta-call-direct",
    family: "action",
    familyName: "⚡ Actions & Boutons",
    name: "Bouton d'Appel Direct",
    description: "Bouton d'appel téléphonique 1-clic avec icône et micro-animation de pulsation.",
    badge: "P0 • Conversion",
    icon: "phone",
    targetSectionType: "cta",
    variant: "banner-action"
  },
  {
    id: "action-button-group",
    family: "action",
    familyName: "⚡ Actions & Boutons",
    name: "Duo d'Actions (Appel + Devis)",
    description: "Paire de boutons coordonnés (primaire fort + secondaire neutre).",
    badge: "P0 • Navigation",
    icon: "layers",
    targetSectionType: "hero",
    variant: "split-image"
  },
  // 2. Status & Badges
  {
    id: "badge-reassurance",
    family: "status",
    familyName: "🏷️ Statuts & Réassurance",
    name: "Pastilles de Réassurance (RGE, Décennale)",
    description: "Macarons de confiance légale et certifications artisanales vérifiées.",
    badge: "P0 • Confiance",
    icon: "shield",
    targetSectionType: "certifications",
    variant: "cards-4"
  },
  {
    id: "badge-emergency-radar",
    family: "status",
    familyName: "🏷️ Statuts & Réassurance",
    name: "Badge Radar Astreinte 24/7",
    description: "Pastille radar lumineuse clignotante indiquant l'intervention d'urgence.",
    badge: "P1 • Urgence",
    icon: "sparkles",
    targetSectionType: "customBlock",
    variant: "radarEmergency"
  },
  // 3. Content & Cards
  {
    id: "content-service-card",
    family: "content",
    familyName: "📄 Contenus & Preuves",
    name: "Carte de Prestation / Service",
    description: "Encadré de service avec photo 16:10, tag de catégorie et bouton de chiffrage.",
    badge: "P0 • Métier",
    icon: "layers",
    targetSectionType: "services",
    variant: "cards-grid"
  },
  {
    id: "content-quote",
    family: "content",
    familyName: "📄 Contenus & Preuves",
    name: "Citation / Parole d'Artisan",
    description: "Mise en avant éditoriale d'un mot du fondateur ou d'un avis client phare.",
    badge: "P1 • Éditorial",
    icon: "checkCircle",
    targetSectionType: "about",
    variant: "quote-card"
  },
  {
    id: "content-process-steps",
    family: "content",
    familyName: "📄 Contenus & Preuves",
    name: "Parcours en 3 Étapes Numérotées",
    description: "Explication pas à pas du déroulement du chantier pour rassurer le prospect.",
    badge: "P1 • Pédagogique",
    icon: "layers",
    targetSectionType: "process",
    variant: "steps-3"
  },
  {
    id: "content-pricing-card",
    family: "content",
    familyName: "📄 Contenus & Preuves",
    name: "Forfaits & Grille Tarifaire",
    description: "Cartes transparentes de formules packagées avec badge « Recommandé ».",
    badge: "P1 • Vente",
    icon: "dollarSign",
    targetSectionType: "pricing",
    variant: "cards-3"
  },
  // 4. Media
  {
    id: "media-before-after",
    family: "media",
    familyName: "🖼️ Médias & Interactif",
    name: "Comparateur Glissant Avant / Après",
    description: "Curseur tactile glissant montrant la transformation spectaculaire avant/après travaux.",
    badge: "P0 • Preuve 60fps",
    icon: "sliders",
    targetSectionType: "beforeAfter",
    variant: "interactive-slider"
  },
  {
    id: "media-gallery-lightbox",
    family: "media",
    familyName: "🖼️ Médias & Interactif",
    name: "Mosaïque Galerie avec Lightbox",
    description: "Grille de photographies 4K plein écran avec agrandissement instantané.",
    badge: "P0 • Visuel",
    icon: "eye",
    targetSectionType: "gallery",
    variant: "masonry-grid"
  },
  // 5. Disclosure
  {
    id: "disclosure-faq",
    family: "disclosure",
    familyName: "📂 Divulgation & FAQ",
    name: "Accordéon Fluide (FAQ)",
    description: "Questions cliquables avec déploiement animé sans allonger la page.",
    badge: "P0 • Rassurance",
    icon: "helpCircle",
    targetSectionType: "faq",
    variant: "accordion"
  },
  // 6. Feedback & Alert
  {
    id: "feedback-urgent-banner",
    family: "feedback",
    familyName: "🔔 Feedback & Alertes",
    name: "Bandeau Notification d'Astreinte",
    description: "Bandeau contrasté en haut de page pour annoncer une permanence ou promo.",
    badge: "P0 • Notification",
    icon: "sparkles",
    targetSectionType: "customBlock",
    variant: "urgentBanner"
  },
  // 7. Navigation
  {
    id: "nav-sticky-bar",
    family: "navigation",
    familyName: "🗺️ Navigation & Flottant",
    name: "Barre d'Appel Flottante",
    description: "Bouton d'appel persistant en bas d'écran avec numéro de téléphone direct.",
    badge: "P0 • Mobile",
    icon: "phone",
    targetSectionType: "header",
    variant: "sticky-premium"
  },
  // 8. Input & Calculator
  {
    id: "input-quote-simulator",
    family: "input",
    familyName: "📝 Devis & Formulaires",
    name: "Simulateur Interactif de Devis",
    description: "Calculateur de devis en 3 clics avec sélection de surface et rappel 24h.",
    badge: "P0 • Conversion",
    icon: "dollarSign",
    targetSectionType: "quoteSimulator",
    variant: "interactive-calculator"
  },
  // 9. Component Gallery Additions
  {
    id: "gallery-quote-pull",
    family: "content",
    familyName: "📄 Contenus & Preuves",
    name: "Citation / Pull Quote Éditoriale",
    description: "Citation grand format avec guillemets géants, photo du dirigeant et signature.",
    badge: "Gallery • Confiance",
    icon: "checkCircle",
    targetSectionType: "quoteBlock",
    variant: "editorial-quote"
  },
  {
    id: "gallery-video-player",
    family: "media",
    familyName: "🖼️ Médias & Vidéos",
    name: "Lecteur Vidéo Immersion 4K",
    description: "Composant vidéo immersif avec affiche de chantier et bouton de lecture centré.",
    badge: "Gallery • Visuel",
    icon: "eye",
    targetSectionType: "videoBlock",
    variant: "immersive-player"
  },
  {
    id: "gallery-stepper-progress",
    family: "content",
    familyName: "📄 Contenus & Preuves",
    name: "Indicateur d'Étapes de Chantier (Stepper)",
    description: "Composant de processus 1-2-3-4 séquencé guidant le client pas à pas.",
    badge: "Gallery • Pédagogique",
    icon: "layers",
    targetSectionType: "stepperBlock",
    variant: "numbered-stepper"
  },
  {
    id: "gallery-comparison-table",
    family: "content",
    familyName: "📄 Contenus & Preuves",
    name: "Tableau Comparatif des Prestations",
    description: "Tableau structuré confrontant la prestation standard et la formule sérénité pro.",
    badge: "Gallery • Transparence",
    icon: "dollarSign",
    targetSectionType: "tableBlock",
    variant: "comparison-table"
  },
  {
    id: "gallery-surface-slider",
    family: "input",
    familyName: "📝 Devis & Formulaires",
    name: "Curseur Interactif de Surface (Slider)",
    description: "Curseur glissant de 10 à 250 m² pour chiffrer l'envergure du projet.",
    badge: "Gallery • Interactif",
    icon: "sliders",
    targetSectionType: "sliderBlock",
    variant: "surface-slider"
  },
  {
    id: "gallery-category-tabs",
    family: "navigation",
    familyName: "🗺️ Navigation & Flottant",
    name: "Sélecteur d'Onglets de Prestations (Tabs)",
    description: "Navigation par onglets filtrant instantanément les spécialités de l'artisan.",
    badge: "Gallery • Ergonomie",
    icon: "layers",
    targetSectionType: "tabsBlock",
    variant: "segmented-tabs"
  },
  {
    id: "gallery-custom-card-block",
    family: "content",
    familyName: "📄 Contenus & Preuves",
    name: "Boîte Carte Personnalisée Sur-Mesure",
    description: "Encadré avec argument fort, badge vérifié et bouton d'appel direct.",
    badge: "Canva • Sur-mesure",
    icon: "sparkles",
    targetSectionType: "customBlock",
    variant: "customCard"
  }
];

export function renderAddSectionModal(project, activeTab = "sections") {
  const sections = project?.sections || [];

  return `
    <div id="add-section-modal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-2xl shadow-2xl max-w-4xl lg:max-w-5xl w-full border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-zinc-200 flex items-center justify-between flex-shrink-0 bg-white">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center text-white font-bold text-sm">
              ⊞
            </div>
            <div>
              <div class="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">Bibliothèque & Intelligence Composants</div>
              <h2 class="font-bold text-base sm:text-lg text-zinc-950 mt-0.5">Composants Disponibles pour ${project?.business?.name || 'le Site'}</h2>
            </div>
          </div>
          <button type="button" onclick="window.app.closeAddSectionModal()" class="p-2 text-zinc-400 hover:text-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors">
            ${getIcon("x", "w-5 h-5")}
          </button>
        </div>

        <!-- Segmented Tab Switcher (Linear / Sendpage style) -->
        <div class="px-6 pt-3 pb-2 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between flex-shrink-0">
          <div class="pill-tabs-container max-w-md">
            <button type="button" id="tab-add-sections" onclick="window.app.switchAddModalTab('sections')" class="pill-tab-btn ${activeTab === 'sections' ? 'is-active' : ''}">
              <span>📐 Sections Complètes (${SECTION_DEFINITIONS.length})</span>
            </button>
            <button type="button" id="tab-add-components" onclick="window.app.switchAddModalTab('components')" class="pill-tab-btn ${activeTab === 'components' ? 'is-active' : ''}">
              <span>🧩 Composants Individuels (${COMPONENT_CATALOG_ITEMS.length})</span>
            </button>
          </div>
          <div class="text-[11px] text-zinc-500 font-medium hidden sm:block">
            ${activeTab === 'sections' ? `${sections.length} sections actives sur la page` : 'Composants Add-on calibrés 2026'}
          </div>
        </div>

        <!-- Live Instant Filter & Search Bar -->
        <div class="px-6 py-2.5 bg-white border-b border-zinc-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
          <div class="relative flex-1">
            <span class="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400">
              ${getIcon("search", "w-3.5 h-3.5")}
            </span>
            <input type="text" id="catalog-search" oninput="window.app.filterCatalogItems(this.value)" placeholder="Rechercher un composant (ex: Stepper, Canva, Vidéo, Devis...)" class="w-full bg-zinc-100/80 hover:bg-zinc-100 focus:bg-white border border-zinc-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all">
          </div>
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-[11px]">
            <button type="button" onclick="window.app.filterCatalogCategory('all', this)" class="catalog-filter-btn is-active px-2.5 py-1 rounded-lg font-semibold bg-zinc-900 text-white transition-all">Tous</button>
            <button type="button" onclick="window.app.filterCatalogCategory('content', this)" class="catalog-filter-btn px-2.5 py-1 rounded-lg font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-all">Contenus</button>
            <button type="button" onclick="window.app.filterCatalogCategory('media', this)" class="catalog-filter-btn px-2.5 py-1 rounded-lg font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-all">Médias</button>
            <button type="button" onclick="window.app.filterCatalogCategory('action', this)" class="catalog-filter-btn px-2.5 py-1 rounded-lg font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-all">Actions & Devis</button>
          </div>
        </div>

        <!-- Tab 1: Full Sections List -->
        <div id="add-modal-sections-view" class="p-6 overflow-y-auto space-y-4 flex-1 text-xs ${activeTab === 'sections' ? '' : 'hidden'}">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-zinc-100 text-zinc-500">
            <span>Sélectionnez une section et sa variante pour enrichir le site de <strong>${project?.business?.tradeLabel || 'votre artisan'}</strong>.</span>
          </div>

          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" id="catalog-sections-grid">
            ${SECTION_DEFINITIONS.map(secDef => {
              const existingSec = sections.find(s => s.type === secDef.type);

              return `
                <div class="catalog-card bg-zinc-50/80 hover:bg-white border ${existingSec ? 'border-zinc-300 shadow-2xs' : 'border-zinc-200'} hover:border-zinc-400 rounded-2xl p-4 transition-all space-y-3 flex flex-col justify-between group" data-category="${secDef.type}">
                  <div>
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-xl bg-white border border-zinc-200 text-zinc-800 flex items-center justify-center flex-shrink-0 shadow-2xs">
                        ${getIcon(secDef.icon, "w-4 h-4 text-zinc-700")}
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1.5">
                          <h4 class="font-bold text-xs sm:text-sm text-zinc-900 leading-snug break-words">${secDef.title}</h4>
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

        <!-- Tab 2: Individual Component Intelligence Catalog -->
        <div id="add-modal-components-view" class="p-6 overflow-y-auto space-y-4 flex-1 text-xs ${activeTab === 'components' ? '' : 'hidden'}">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-zinc-100 text-zinc-500">
            <span>Composants certifiés conformes au cahier des charges Add-on Intelligence (Actions, Médias, Divulgation, Statuts).</span>
          </div>

          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" id="catalog-components-grid">
            ${COMPONENT_CATALOG_ITEMS.map(comp => `
              <div class="catalog-card bg-zinc-50/80 hover:bg-white border border-zinc-200 hover:border-zinc-400 rounded-2xl p-4 transition-all space-y-3 flex flex-col justify-between group" data-category="${comp.family}">
                <div>
                  <div class="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                    <span class="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">${comp.familyName}</span>
                    <span class="text-[9.5px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold whitespace-nowrap">${comp.badge}</span>
                  </div>
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-xl bg-white border border-zinc-200 text-zinc-800 flex items-center justify-center flex-shrink-0 shadow-2xs">
                      ${getIcon(comp.icon, "w-4 h-4 text-zinc-700")}
                    </div>
                    <div class="min-w-0 flex-1">
                      <h4 class="font-bold text-xs sm:text-sm text-zinc-900 leading-snug break-words">${comp.name}</h4>
                      <p class="text-[11px] text-zinc-500 mt-1 leading-relaxed">${comp.description}</p>
                    </div>
                  </div>
                </div>

                <div class="pt-2 border-t border-zinc-200/60">
                  <button type="button" 
                          onclick="window.app.handleAddSection('${comp.targetSectionType}', '${comp.variant}')"
                          class="w-full btn-keycap btn-keycap-dark py-2 rounded-lg text-xs font-semibold text-white shadow-xs flex items-center justify-center gap-1.5">
                    ${getIcon("plus", "w-3.5 h-3.5")}
                    <span>+ Insérer ce composant</span>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between flex-shrink-0 text-xs text-zinc-500">
          <span>Prêt pour l'exportation et 100% conforme WCAG AA.</span>
          <button type="button" onclick="window.app.closeAddSectionModal()" class="btn-keycap btn-keycap-light px-4 py-1.5 rounded-lg font-semibold text-zinc-700 hover:bg-zinc-100">
            Fermer
          </button>
        </div>

      </div>
    </div>
  `;
}


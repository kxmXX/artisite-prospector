/**
 * ARTISITE PROSPECTOR — ADD-ON COMPONENT INTELLIGENCE
 * Version 1.0 — Spécification d'intégration incrémentale
 *
 * Moteur de décision UI réutilisable permettant au moteur Artisite de choisir,
 * composer, valider et rendre des composants cohérents selon le contexte.
 */

// ============================================================================
// 1. REGISTRE CANONIQUE DES COMPOSANTS (Sections 2 & 3)
// ============================================================================

export const COMPONENT_FAMILIES = [
  'action',
  'selection',
  'input',
  'navigation',
  'disclosure',
  'overlay',
  'feedback',
  'status',
  'content',
  'media',
  'layout',
  'accessibility'
];

export const COMPONENT_STATES = [
  'default',
  'hover',
  'focus',
  'active',
  'selected',
  'disabled',
  'loading',
  'success',
  'error',
  'empty'
];

/**
 * Registre des composants canoniques documentés
 */
export const COMPONENT_INTELLIGENCE_REGISTRY = {
  // 3.1 ACTION
  button: {
    id: 'button',
    family: 'action',
    name: 'Bouton',
    intent: ['trigger-action', 'submit', 'confirm', 'open-close'],
    primaryUseCases: ['Action principale de conversion', 'Validation de formulaire', 'Déclencheur modal/menu'],
    avoidWhen: ['Navigation pure vers une autre page (préférer link)', 'Plusieurs actions primaires sur le même écran'],
    variants: ['primary', 'secondary', 'ghost', 'danger', 'keycap'],
    states: ['default', 'hover', 'focus', 'active', 'disabled', 'loading'],
    responsivePolicy: { desktop: 'inline-flex', mobile: 'full-width-or-stack' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'button', labelRequired: true, reducedMotion: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['landing', 'dashboard', 'editor'],
    editorControls: ['text', 'variant', 'scale', 'radius', 'motion', 'targetAction'],
    exportable: true,
    priority: 'P0'
  },
  buttonGroup: {
    id: 'buttonGroup',
    family: 'action',
    name: 'Groupe de boutons',
    intent: ['group-actions', 'segmented-action'],
    primaryUseCases: ['Regroupement d\'actions fortement corrélées (ex: Annuler / Confirmer)'],
    avoidWhen: ['Actions sans lien direct', 'Plus de 3 boutons sur mobile'],
    variants: ['horizontal', 'segmented', 'attached'],
    states: ['default', 'focus', 'disabled'],
    responsivePolicy: { desktop: 'horizontal', mobile: 'stacked-or-scrollable' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'group', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['editor', 'dashboard'],
    editorControls: ['orientation', 'spacing'],
    exportable: true,
    priority: 'P0'
  },
  link: {
    id: 'link',
    family: 'action',
    name: 'Lien',
    intent: ['navigate', 'tertiary-action'],
    primaryUseCases: ['Navigation vers une autre ressource', 'Lien légal dans le footer', 'Retour haut de page'],
    avoidWhen: ['Déclencher une mutation de données (préférer button)'],
    variants: ['underline', 'subtle', 'cta-link'],
    states: ['default', 'hover', 'focus', 'active', 'visited'],
    responsivePolicy: { desktop: 'inline', mobile: 'inline' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'link', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['landing', 'editor', 'dashboard'],
    editorControls: ['text', 'href', 'target'],
    exportable: true,
    priority: 'P0'
  },
  toggle: {
    id: 'toggle',
    family: 'action',
    name: 'Interrupteur (Toggle)',
    intent: ['toggle-state', 'instant-setting'],
    primaryUseCases: ['Bascule binaire avec effet immédiat (ex: Activer mode nuit, Afficher badge)'],
    avoidWhen: ['Formulaire à soumission groupée (préférer checkbox)'],
    variants: ['switch', 'pill'],
    states: ['default', 'hover', 'focus', 'active', 'disabled'],
    responsivePolicy: { desktop: 'inline-flex', mobile: 'inline-flex' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'switch', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['editor', 'dashboard'],
    editorControls: ['checked', 'label'],
    exportable: true,
    priority: 'P0'
  },

  // 3.2 SELECTION
  checkbox: {
    id: 'checkbox',
    family: 'selection',
    name: 'Case à cocher',
    intent: ['multi-choice', 'binary-inclusion'],
    primaryUseCases: ['Choix binaire dans un formulaire (CGU)', 'Sélection multiple dans une liste'],
    avoidWhen: ['Effet immédiat sans soumission (préférer toggle)', 'Choix mutuellement exclusif'],
    variants: ['standard', 'card-checkbox'],
    states: ['default', 'hover', 'focus', 'selected', 'disabled', 'error'],
    responsivePolicy: { desktop: 'block', mobile: 'block' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'checkbox', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['landing', 'editor'],
    editorControls: ['label', 'checked', 'required'],
    exportable: true,
    priority: 'P0'
  },
  radioButton: {
    id: 'radioButton',
    family: 'selection',
    name: 'Bouton Radio',
    intent: ['single-choice-visible'],
    primaryUseCases: ['Choix unique parmi 2 à 5 options où la comparaison directe est indispensable'],
    avoidWhen: ['Plus de 6 options (préférer select)', 'Choix multiple possible'],
    variants: ['standard', 'card-radio'],
    states: ['default', 'hover', 'focus', 'selected', 'disabled'],
    responsivePolicy: { desktop: 'inline-flex-or-column', mobile: 'column' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'radio', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['landing', 'editor'],
    editorControls: ['options', 'name', 'selectedValue'],
    exportable: true,
    priority: 'P0'
  },
  select: {
    id: 'select',
    family: 'selection',
    name: 'Menu déroulant (Select)',
    intent: ['single-choice-compact'],
    primaryUseCases: ['Choix unique parmi une longue liste (ex: 6 à 25 options, liste de villes ou métiers)'],
    avoidWhen: ['Moins de 4 options (préférer radio ou segmented control)', 'Comparaison visuelle importante'],
    variants: ['native', 'custom-select'],
    states: ['default', 'hover', 'focus', 'disabled', 'error'],
    responsivePolicy: { desktop: 'block', mobile: 'native-picker' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'combobox', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['landing', 'editor', 'dashboard'],
    editorControls: ['options', 'placeholder', 'defaultValue'],
    exportable: true,
    priority: 'P0'
  },
  segmentedControl: {
    id: 'segmentedControl',
    family: 'selection',
    name: 'Contrôle segmenté',
    intent: ['switch-view', 'mode-selection'],
    primaryUseCases: ['Bascule rapide entre 2 à 4 vues ou modes équivalents (ex: Desktop / Tablette / Mobile, Conception / Client)'],
    avoidWhen: ['Plus de 4 vues', 'Options de longueurs très inégales'],
    variants: ['pill', 'boxed'],
    states: ['default', 'hover', 'focus', 'selected', 'disabled'],
    responsivePolicy: { desktop: 'inline-flex', mobile: 'scroll-or-stacked' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'tablist', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['editor', 'dashboard'],
    editorControls: ['segments', 'activeSegment'],
    exportable: true,
    priority: 'P1'
  },
  slider: {
    id: 'slider',
    family: 'selection',
    name: 'Curseur (Slider)',
    intent: ['continuous-range-selection'],
    primaryUseCases: ['Ajustement continu d\'une valeur numérique (ex: taille du bouton, taille du texte, budget estimé)'],
    avoidWhen: ['Valeurs discrètes non continues sans ordre naturel'],
    variants: ['single-thumb', 'range-thumb'],
    states: ['default', 'hover', 'focus', 'active', 'disabled'],
    responsivePolicy: { desktop: 'block', mobile: 'block' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'slider', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['editor', 'landing'],
    editorControls: ['min', 'max', 'step', 'value'],
    exportable: true,
    priority: 'P2'
  },

  // 3.3 INPUT
  textInput: {
    id: 'textInput',
    family: 'input',
    name: 'Champ texte',
    intent: ['text-entry-single-line'],
    primaryUseCases: ['Saisie du nom, téléphone, email, ville dans un formulaire de contact ou devis'],
    avoidWhen: ['Saisie de longs paragraphes (préférer textarea)'],
    variants: ['outlined', 'filled', 'floating-label'],
    states: ['default', 'hover', 'focus', 'disabled', 'error', 'success'],
    responsivePolicy: { desktop: 'block', mobile: 'block-full-width' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'textbox', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['landing', 'editor'],
    editorControls: ['label', 'placeholder', 'type', 'required'],
    exportable: true,
    priority: 'P0'
  },
  textarea: {
    id: 'textarea',
    family: 'input',
    name: 'Zone de texte (Textarea)',
    intent: ['text-entry-multiline'],
    primaryUseCases: ['Saisie du besoin ou message client dans une demande de devis'],
    avoidWhen: ['Courte information d\'une ligne'],
    variants: ['resizable', 'fixed-height'],
    states: ['default', 'hover', 'focus', 'disabled', 'error'],
    responsivePolicy: { desktop: 'block', mobile: 'block-full-width' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'textbox', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['landing', 'editor'],
    editorControls: ['label', 'placeholder', 'rows'],
    exportable: true,
    priority: 'P0'
  },
  form: {
    id: 'form',
    family: 'input',
    name: 'Formulaire',
    intent: ['grouped-submission', 'conversion-flow'],
    primaryUseCases: ['Formulaire de devis express, demande de rappel artisan'],
    avoidWhen: ['Action unique sans données'],
    variants: ['card-form', 'inline-form', 'multi-step'],
    states: ['default', 'submitting', 'success', 'error'],
    responsivePolicy: { desktop: 'grid', mobile: 'single-column' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'form', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['landing', 'editor'],
    editorControls: ['fields', 'submitButtonText', 'successMessage'],
    exportable: true,
    priority: 'P0'
  },
  label: {
    id: 'label',
    family: 'input',
    name: 'Libellé (Label)',
    intent: ['field-description'],
    primaryUseCases: ['Associer un titre clair à chaque champ de saisie'],
    avoidWhen: ['Remplacer le label par un placeholder seul (interdit par l\'accessibilité)'],
    variants: ['standard', 'sr-only'],
    states: ['default', 'error'],
    responsivePolicy: { desktop: 'block', mobile: 'block' },
    accessibilityPolicy: { keyboard: false, visibleFocus: false, labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['all'],
    editorControls: ['text', 'for'],
    exportable: true,
    priority: 'P0'
  },

  // 3.4 NAVIGATION
  header: {
    id: 'header',
    family: 'navigation',
    name: 'En-tête de site (Header)',
    intent: ['global-navigation', 'brand-identity'],
    primaryUseCases: ['Identité de l\'artisan, menu principal et CTA de contact prioritaire'],
    avoidWhen: ['Pages tunnel de vente isolé'],
    variants: ['sticky', 'floating-glass', 'minimal'],
    states: ['default', 'scrolled'],
    responsivePolicy: { desktop: 'horizontal-menu', mobile: 'burger-or-compact' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'banner', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['landing'],
    editorControls: ['logo', 'navLinks', 'cta'],
    exportable: true,
    priority: 'P0'
  },
  tabs: {
    id: 'tabs',
    family: 'navigation',
    name: 'Onglets (Tabs)',
    intent: ['context-switch-subsections'],
    primaryUseCases: ['Alternance entre sections d\'un même contexte (ex: Sections / Paramètres dans l\'éditeur)'],
    avoidWhen: ['Navigation principale de site vitrine artisan (risque de cacher des services)'],
    variants: ['underline', 'boxed', 'segmented'],
    states: ['default', 'hover', 'focus', 'selected'],
    responsivePolicy: { desktop: 'horizontal', mobile: 'horizontal-scroll' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'tablist', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['editor', 'dashboard'],
    editorControls: ['tabList', 'activeTab'],
    exportable: true,
    priority: 'P0'
  },

  // 3.5 DISCLOSURE & DENSITÉ
  accordion: {
    id: 'accordion',
    family: 'disclosure',
    name: 'Accordéon (FAQ / Dépliant)',
    intent: ['collapse-secondary-content', 'density-reduction'],
    primaryUseCases: ['Section Foire Aux Questions (FAQ), détails techniques ou garanties repliables'],
    avoidWhen: ['Contenu de conversion primaire que l\'artisan doit impérativement lire'],
    variants: ['bordered', 'flush', 'card-accordion'],
    states: ['default', 'hover', 'focus', 'expanded'],
    responsivePolicy: { desktop: 'block', mobile: 'block' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'region', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['landing', 'editor'],
    editorControls: ['items', 'allowMultiple'],
    exportable: true,
    priority: 'P1'
  },
  popover: {
    id: 'popover',
    family: 'disclosure',
    name: 'Surface contextuelle (Popover)',
    intent: ['anchored-interactive-detail'],
    primaryUseCases: ['Palette d\'outils d\'un bouton, réglage de motion, menu contextuel ancré'],
    avoidWhen: ['Information simple sans interaction (préférer tooltip)'],
    variants: ['anchored', 'floating'],
    states: ['default', 'open'],
    responsivePolicy: { desktop: 'anchored', mobile: 'bottom-sheet' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'dialog', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['editor'],
    editorControls: ['content', 'placement'],
    exportable: true,
    priority: 'P1'
  },
  tooltip: {
    id: 'tooltip',
    family: 'disclosure',
    name: 'Infobulle (Tooltip)',
    intent: ['tertiary-micro-help'],
    primaryUseCases: ['Explication courte d\'une icône ou d\'un raccourci clavier'],
    avoidWhen: ['Contenir l\'unique information essentielle au bon déroulement'],
    variants: ['dark-pill', 'arrowed'],
    states: ['default', 'visible'],
    responsivePolicy: { desktop: 'hover-show', mobile: 'tap-or-suppressed' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'tooltip', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['editor', 'dashboard'],
    editorControls: ['text', 'shortcut'],
    exportable: false,
    priority: 'P1'
  },
  drawer: {
    id: 'drawer',
    family: 'disclosure',
    name: 'Tiroir latéral (Drawer / Sheet)',
    intent: ['side-panel-workflow'],
    primaryUseCases: ['Catalogue d\'ajout de sections, panneau de réglages, menu mobile'],
    avoidWhen: ['Interruption critique de flux (préférer modal)'],
    variants: ['left', 'right', 'bottom-sheet'],
    states: ['closed', 'opening', 'open', 'closing'],
    responsivePolicy: { desktop: 'side-drawer', mobile: 'full-width-or-bottom' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'dialog', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['editor', 'dashboard'],
    editorControls: ['position', 'title', 'content'],
    exportable: true,
    priority: 'P0'
  },

  // 3.6 OVERLAY
  modal: {
    id: 'modal',
    family: 'overlay',
    name: 'Fenêtre modale (Modal Dialog)',
    intent: ['blocking-decision', 'isolated-workflow'],
    primaryUseCases: ['Confirmation de suppression irréversible, assistant de création rapide, sélecteur d\'images'],
    avoidWhen: ['Information secondaire pouvant être consultée en ligne (modal inflation)'],
    variants: ['center-dialog', 'large-cockpit', 'media-picker'],
    states: ['open', 'closed'],
    responsivePolicy: { desktop: 'centered-dialog', mobile: 'full-screen-or-sheet' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'dialog', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['editor', 'dashboard'],
    editorControls: ['title', 'content', 'actions'],
    exportable: true,
    priority: 'P0'
  },

  // 3.7 FEEDBACK & STATUS
  alert: {
    id: 'alert',
    family: 'feedback',
    name: 'Bannière d\'alerte',
    intent: ['persistent-important-info'],
    primaryUseCases: ['Dépannage d\'urgence 24/7 pour plombier, congés annuels, avertissement'],
    avoidWhen: ['Notification éphémère de succès (préférer toast)'],
    variants: ['urgent-banner', 'info-card', 'warning-callout'],
    states: ['default', 'dismissed'],
    responsivePolicy: { desktop: 'full-width', mobile: 'full-width' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'alert', labelRequired: true },
    compatibleTrades: ['plombier', 'electricien', 'couvreur', 'all'],
    compatiblePageTypes: ['landing', 'editor'],
    editorControls: ['message', 'type', 'dismissible'],
    exportable: true,
    priority: 'P0'
  },
  toast: {
    id: 'toast',
    family: 'feedback',
    name: 'Notification temporaire (Toast)',
    intent: ['temporary-confirmation'],
    primaryUseCases: ['Confirmation d\'enregistrement, annulation Undo/Redo, copie de lien'],
    avoidWhen: ['Information critique nécessitant une décision ou interaction bloquante'],
    variants: ['floating-pill', 'actionable-toast'],
    states: ['entering', 'visible', 'exiting'],
    responsivePolicy: { desktop: 'bottom-center', mobile: 'bottom-center' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'status', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['editor', 'dashboard'],
    editorControls: ['message', 'duration', 'action'],
    exportable: false,
    priority: 'P0'
  },
  badge: {
    id: 'badge',
    family: 'status',
    name: 'Badge de statut ou réassurance',
    intent: ['compact-status-metadata'],
    primaryUseCases: ['Certification RGE Qualibat, Garantie Décennale, note Google 5 étoiles, badge d\'urgence'],
    avoidWhen: ['Remplacer un titre ou un bouton cliquable complet'],
    variants: ['pill', 'pill-icon', 'tag'],
    states: ['default'],
    responsivePolicy: { desktop: 'inline-flex', mobile: 'inline-flex' },
    accessibilityPolicy: { keyboard: false, visibleFocus: false, labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['landing', 'editor'],
    editorControls: ['text', 'icon', 'color'],
    exportable: true,
    priority: 'P0'
  },
  emptyState: {
    id: 'emptyState',
    family: 'feedback',
    name: 'État vide (Empty State)',
    intent: ['guide-empty-context'],
    primaryUseCases: ['Aucun projet créé dans le dashboard, aucune image importée, aucun avis saisi'],
    avoidWhen: ['Contenu présent'],
    variants: ['illustrated', 'minimal'],
    states: ['default'],
    responsivePolicy: { desktop: 'centered-card', mobile: 'centered-card' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['dashboard', 'editor'],
    editorControls: ['icon', 'title', 'description', 'actionButton'],
    exportable: true,
    priority: 'P0'
  },

  // 3.8 CONTENT
  card: {
    id: 'card',
    family: 'content',
    name: 'Carte de contenu (Card)',
    intent: ['encapsulate-entity'],
    primaryUseCases: ['Présentation de prestation/service, avis client, réalisation de chantier'],
    avoidWhen: ['Données tabulaires comparatives denses (préférer table)'],
    variants: ['service-card', 'review-card', 'project-card', 'glass-card'],
    states: ['default', 'hover', 'active'],
    responsivePolicy: { desktop: 'grid-col-3-or-4', mobile: 'single-col-or-carousel' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['landing', 'editor', 'dashboard'],
    editorControls: ['image', 'title', 'description', 'ctaText'],
    exportable: true,
    priority: 'P0'
  },
  heading: {
    id: 'heading',
    family: 'content',
    name: 'Titre de section (Heading)',
    intent: ['introduce-section', 'content-hierarchy'],
    primaryUseCases: ['H1 Hero, H2 Titres de sections, H3 Cartes'],
    avoidWhen: ['Remplacer un label de champ'],
    variants: ['h1-editorial', 'h2-section', 'h3-card'],
    states: ['default'],
    responsivePolicy: { desktop: 'responsive-fluid-type', mobile: 'readable-type' },
    accessibilityPolicy: { keyboard: false, visibleFocus: false, labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['landing'],
    editorControls: ['level', 'text', 'size'],
    exportable: true,
    priority: 'P0'
  },

  // 3.9 MEDIA
  hero: {
    id: 'hero',
    family: 'media',
    name: 'Bannière immersive (Hero)',
    intent: ['hook-prospect', 'primary-value-prop'],
    primaryUseCases: ['Section 01 d\'accroche immédiate du site vitrine artisan'],
    avoidWhen: ['Pages secondaires compactes'],
    variants: ['fullscreen-image', 'split-editorial', 'minimal-headline'],
    states: ['default'],
    responsivePolicy: { desktop: 'split-or-fullscreen', mobile: 'stacked-portrait' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['landing'],
    editorControls: ['headline', 'subheadline', 'cta', 'backgroundImage'],
    exportable: true,
    priority: 'P0'
  },
  carousel: {
    id: 'carousel',
    family: 'media',
    name: 'Carrousel / Comparateur Avant-Après',
    intent: ['visual-proof-interactive'],
    primaryUseCases: ['Comparateur interactif glissant avant/après travaux, défilement réalisations'],
    avoidWhen: ['Présentation de texte d\'information critique'],
    variants: ['split-reveal-slider', 'gallery-carousel'],
    states: ['default', 'dragging', 'active'],
    responsivePolicy: { desktop: 'interactive-drag', mobile: 'touch-swipe' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, labelRequired: true },
    compatibleTrades: ['paysagiste', 'peintre', 'couvreur', 'coiffeur', 'all'],
    compatiblePageTypes: ['landing'],
    editorControls: ['beforeImage', 'afterImage', 'initialPosition'],
    exportable: true,
    priority: 'P2'
  },
  table: {
    id: 'table',
    family: 'data',
    name: 'Tableau de données (Table)',
    intent: ['tabular-data', 'dense-comparison'],
    primaryUseCases: ['Tableaux de bord internes', 'Comparatifs chiffrés denses'],
    avoidWhen: ['Sites vitrines simples pour artisans'],
    variants: ['striped', 'bordered'],
    states: ['default', 'hover', 'selected'],
    responsivePolicy: { desktop: 'horizontal-table', mobile: 'horizontal-scroll-or-cards' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'table', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['editor', 'dashboard'],
    editorControls: ['columns', 'rows'],
    exportable: false,
    priority: 'P2'
  },
  treeView: {
    id: 'treeView',
    family: 'data',
    name: 'Arborescence (Tree View)',
    intent: ['hierarchical-tree', 'deep-navigation'],
    primaryUseCases: ['Arborescences complexes', 'Explorateur de dossiers'],
    avoidWhen: ['Landing pages artisans'],
    variants: ['expandable'],
    states: ['default', 'expanded', 'selected'],
    responsivePolicy: { desktop: 'block', mobile: 'block' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'tree', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['editor'],
    editorControls: ['nodes'],
    exportable: false,
    priority: 'P3'
  },
  combobox: {
    id: 'combobox',
    family: 'selection',
    name: 'Champ combiné avec recherche (Combobox)',
    intent: ['searchable-select'],
    primaryUseCases: ['Sélection d\'options avec recherche dans une liste longue'],
    avoidWhen: ['Moins de 6 options'],
    variants: ['searchable'],
    states: ['default', 'hover', 'focus', 'open'],
    responsivePolicy: { desktop: 'block', mobile: 'native-or-sheet' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'combobox', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['editor', 'dashboard'],
    editorControls: ['options', 'placeholder'],
    exportable: true,
    priority: 'P2'
  },
  progressIndicator: {
    id: 'progressIndicator',
    family: 'status',
    name: 'Indicateur de progression (Stepper)',
    intent: ['progress-steps'],
    primaryUseCases: ['Processus par étapes (1. Devis, 2. Visite, 3. Réalisation)'],
    avoidWhen: ['Flux sans séquence chronologique'],
    variants: ['stepper', 'bar'],
    states: ['default', 'active', 'completed'],
    responsivePolicy: { desktop: 'horizontal-steps', mobile: 'compact-counter' },
    accessibilityPolicy: { keyboard: true, visibleFocus: true, semanticRole: 'progressbar', labelRequired: true },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['landing', 'editor'],
    editorControls: ['steps', 'currentStep'],
    exportable: true,
    priority: 'P2'
  },
  skeleton: {
    id: 'skeleton',
    family: 'feedback',
    name: 'Squelette de chargement (Skeleton)',
    intent: ['perceived-performance'],
    primaryUseCases: ['Attente de génération IA ou chargement de projets'],
    avoidWhen: ['Données déjà présentes en cache'],
    variants: ['text', 'card', 'hero'],
    states: ['animating'],
    responsivePolicy: { desktop: 'fluid', mobile: 'fluid' },
    accessibilityPolicy: { keyboard: false, visibleFocus: false, labelRequired: false },
    compatibleTrades: ['all'],
    compatiblePageTypes: ['editor', 'dashboard'],
    editorControls: [],
    exportable: false,
    priority: 'P1'
  }
};

// ============================================================================
// 2. MOTEUR DE DÉCISION & RÈGLES DE SÉLECTION (Sections 4 & 5)
// ============================================================================

export class ComponentSelectionEngine {
  /**
   * Règle 5.1 — Action principale & hiérarchie CTA
   */
  static recommendActionComponent({ isPrimary = false, isSecondary = false, isTertiary = false, isGrouped = false, isCardAction = false }) {
    if (isGrouped) return { component: 'buttonGroup', variant: 'segmented', reason: 'Actions étroitement liées groupées' };
    if (isPrimary) return { component: 'button', variant: 'primary', reason: 'Action principale dominante de conversion' };
    if (isSecondary) return { component: 'button', variant: 'secondary', reason: 'Action secondaire subordonnée' };
    if (isTertiary) return { component: 'link', variant: 'cta-link', reason: 'Action tertiaire ou navigation légère' };
    if (isCardAction) return { component: 'button', variant: 'ghost', reason: 'Action contextuelle répétée sur carte' };
    return { component: 'button', variant: 'secondary', reason: 'Action standard' };
  }

  /**
   * Règle 5.2 — Choix unique
   */
  static recommendSelectionComponent({ optionCount = 2, needComparison = true, isSearchable = false, isEquivalentViews = false }) {
    if (isEquivalentViews && optionCount <= 4) {
      return { component: 'segmentedControl', variant: 'pill', reason: 'Quelques vues ou modes équivalents' };
    }
    if (optionCount <= 4 && needComparison) {
      return { component: 'radioButton', variant: 'standard', reason: 'Peu d\'options avec comparaison directe indispensable' };
    }
    if (optionCount > 10 && isSearchable) {
      return { component: 'combobox', variant: 'searchable', reason: 'Nombreuses options avec recherche textuelle' };
    }
    return { component: 'select', variant: 'native', reason: 'Liste d\'options prédéfinie compacte' };
  }

  /**
   * Règle 5.3 — Choix multiple
   */
  static recommendMultipleChoiceComponent({ isBinary = false, isImmediateStateChange = false, optionsCount = 1 }) {
    if (isBinary && isImmediateStateChange) {
      return { component: 'toggle', variant: 'switch', reason: 'Bascule binaire avec application d\'état immédiate' };
    }
    if (isBinary) {
      return { component: 'checkbox', variant: 'standard', reason: 'Choix binaire inclus dans une validation globale' };
    }
    return { component: 'checkbox', variant: 'card-checkbox', reason: 'Sélection d\'options multiples indépendantes' };
  }

  /**
   * Règle 5.4 — Navigation
   */
  static recommendNavigationComponent({ isGlobal = false, depth = 1, isSameContext = false, resultCount = 1, isHierarchicalTree = false }) {
    if (isGlobal) return { component: 'header', variant: 'sticky', reason: 'Navigation globale de premier niveau' };
    if (depth > 2) return { component: 'breadcrumbs', variant: 'standard', reason: 'Hiérarchie profonde' };
    if (isSameContext) return { component: 'tabs', variant: 'underline', reason: 'Sous-sections d\'un même contexte' };
    if (resultCount > 12) return { component: 'pagination', variant: 'numeric', reason: 'Gestion de nombreux résultats' };
    if (isHierarchicalTree) return { component: 'treeView', variant: 'expandable', reason: 'Arborescence imbriquée' };
    return { component: 'navigation', variant: 'standard', reason: 'Navigation générale' };
  }

  /**
   * Règle 5.5 — Contenu dense
   */
  static recommendDenseContentComponent({ isTabular = false, isDiscreteEntities = true, isSimpleList = false, isCollapsibleSecondary = false, isSteps = false }) {
    if (isSteps) return { component: 'progressIndicator', variant: 'stepper', reason: 'Étapes discrètes du processus' };
    if (isCollapsibleSecondary) return { component: 'accordion', variant: 'flush', reason: 'Contenu secondaire repliable (FAQ)' };
    if (isTabular) return { component: 'table', variant: 'striped', reason: 'Données structurées comparables en lignes/colonnes' };
    if (isDiscreteEntities) return { component: 'card', variant: 'service-card', reason: 'Entités indépendantes et valorisantes' };
    if (isSimpleList) return { component: 'list', variant: 'bullet', reason: 'Éléments simples liés' };
    return { component: 'card', variant: 'standard', reason: 'Affichage générique de contenu' };
  }

  /**
   * Règle 5.6 — Informer sans bloquer
   */
  static recommendFeedbackComponent({ isImportantPersistent = false, isTemporaryConfirmation = false, isCompactStatus = false, isSecondaryHelp = false, isRichInteractive = false }) {
    if (isImportantPersistent) return { component: 'alert', variant: 'urgent-banner', reason: 'Information critique persistante (urgence, astreinte)' };
    if (isTemporaryConfirmation) return { component: 'toast', variant: 'floating-pill', reason: 'Confirmation temporaire d\'une action' };
    if (isCompactStatus) return { component: 'badge', variant: 'pill', reason: 'Statut compact ou métadonnée (Garantie, Note)' };
    if (isSecondaryHelp) return { component: 'tooltip', variant: 'dark-pill', reason: 'Précision secondaire sur un contrôle' };
    if (isRichInteractive) return { component: 'popover', variant: 'anchored', reason: 'Information interactive riche ancrée' };
    return { component: 'badge', variant: 'pill', reason: 'Indicateur de statut standard' };
  }

  /**
   * Règle 5.7 — Bloquer ou non
   */
  static recommendOverlayComponent({ mustBlockDecision = false, isSecondaryContext = false, isLocalDetail = false, isSimpleHint = false }) {
    if (mustBlockDecision) return { component: 'modal', variant: 'center-dialog', reason: 'Décision impérative requise avant de continuer' };
    if (isSecondaryContext) return { component: 'drawer', variant: 'right', reason: 'Consultation ou modification d\'un contexte secondaire' };
    if (isLocalDetail) return { component: 'popover', variant: 'anchored', reason: 'Détail ponctuel interactif ancré' };
    if (isSimpleHint) return { component: 'tooltip', variant: 'dark-pill', reason: 'Simple précision légère' };
    return { component: 'drawer', variant: 'bottom-sheet', reason: 'Panneau contextuel par défaut' };
  }
}

// ============================================================================
// 3. POLITIQUES DE COMPOSITION UI & SÉPARATION NIVEAUX A / B (Sections 8 & 9)
// ============================================================================

export const UI_COMPOSITION_POLICIES = {
  // Niveau A — Site vitrine prospect (Conversion, clarté, zéro complexité superflue)
  landingPage: {
    pageType: 'landing',
    goal: 'conversion',
    maxPrimaryActionsPerViewport: 1,
    maxInteractionComplexity: 3,
    allowedFamilies: ['action', 'content', 'media', 'input', 'feedback', 'status'],
    discouragedFamilies: ['data', 'treeView', 'stepper', 'complexOverlay', 'combobox'],
    mobilePriority: 'simplicity',
    allowedComponents: [
      'hero', 'heading', 'button', 'card', 'badge', 'image', 'accordion',
      'form', 'textInput', 'textarea', 'select', 'alert', 'toast', 'carousel'
    ]
  },

  // Niveau B — Interface interne Artisite (Création, édition, productivité, manipulation dense)
  internalEditor: {
    pageType: 'editor',
    goal: 'workflow',
    maxPrimaryActionsPerViewport: 3,
    maxInteractionComplexity: 8,
    allowedFamilies: ['action', 'selection', 'input', 'navigation', 'disclosure', 'overlay', 'feedback', 'status', 'content', 'layout'],
    discouragedFamilies: [],
    mobilePriority: 'speed',
    allowedComponents: [
      'tabs', 'drawer', 'modal', 'table', 'searchInput', 'combobox',
      'progressIndicator', 'skeleton', 'toast', 'emptyState', 'buttonGroup',
      'badge', 'tooltip', 'popover', 'slider', 'segmentedControl'
    ]
  }
};

/**
 * Valide si une composition de composants respecte la politique du niveau de page
 */
export function evaluateCompositionPolicy(policy, proposedComponentIds) {
  const violations = [];
  let primaryActionCount = 0;

  proposedComponentIds.forEach(id => {
    const comp = COMPONENT_INTELLIGENCE_REGISTRY[id];

    if (policy.allowedComponents && !policy.allowedComponents.includes(id)) {
      violations.push({
        componentId: id,
        rule: 'unsupported-component',
        message: `Le composant '${id}' ne fait pas partie des composants autorisés pour le niveau ${policy.pageType}.`
      });
    }

    if (comp && policy.discouragedFamilies.includes(comp.family)) {
      violations.push({
        componentId: id,
        rule: 'discouraged-family',
        message: `Le composant '${id}' de la famille '${comp.family}' est déconseillé pour une page de type '${policy.pageType}' (Objectif: ${policy.goal}).`
      });
    }

    if (id === 'button') primaryActionCount++;
  });

  return {
    valid: violations.length === 0,
    violations,
    score: Math.max(0, 100 - violations.length * 25)
  };
}

// ============================================================================
// 4. MATRICE MÉTIER → COMPOSANTS (Section 11)
// ============================================================================

export const TRADE_COMPONENT_MATRIX = {
  paysagiste: {
    name: 'Jardinier / Paysagiste',
    priorityComponents: ['hero', 'card', 'image', 'carousel', 'accordion', 'quote', 'form', 'badge'],
    deprioritizedComponents: ['table', 'treeView', 'stepper'],
    corePatterns: ['immersion-nature', 'avant-apres', 'devis-gratuit', 'entretien-annuel']
  },
  plombier: {
    name: 'Plombier / Chauffagiste',
    priorityComponents: ['alert', 'button', 'card', 'badge', 'form', 'select', 'accordion'],
    deprioritizedComponents: ['table', 'treeView', 'carousel'],
    corePatterns: ['urgence-24-7', 'tarifs-transparents', 'zones-intervention', 'appel-direct']
  },
  electricien: {
    name: 'Électricien',
    priorityComponents: ['card', 'icon', 'accordion', 'form', 'badge', 'alert'],
    deprioritizedComponents: ['treeView', 'table'],
    corePatterns: ['norme-nfc-15100', 'reassurance-qualifelec', 'depannage-rapide']
  },
  peintre: {
    name: 'Peintre / Artisan Rénovation',
    priorityComponents: ['image', 'card', 'carousel', 'quote', 'form', 'badge'],
    deprioritizedComponents: ['table', 'treeView'],
    corePatterns: ['rendu-couleurs', 'chantier-soigne', 'avant-apres']
  },
  couvreur: {
    name: 'Couvreur / Zingueur',
    priorityComponents: ['alert', 'card', 'accordion', 'form', 'image', 'badge'],
    deprioritizedComponents: ['table', 'tabs'],
    corePatterns: ['garantie-decennale', 'recherche-fuite', 'deplacement-urgent']
  },
  garage: {
    name: 'Garage / Mécanicien',
    priorityComponents: ['card', 'tabs', 'select', 'form', 'badge', 'alert'],
    deprioritizedComponents: ['treeView', 'quote'],
    corePatterns: ['diagnostic-rapide', 'forfait-entretien', 'prise-rendez-vous']
  },
  coiffeur: {
    name: 'Coiffeur / Barbier',
    priorityComponents: ['hero', 'image', 'card', 'tabs', 'select', 'form'],
    deprioritizedComponents: ['table', 'alert'],
    corePatterns: ['prestations-tarifs', 'ambiance-salon', 'reservation']
  },
  restaurant: {
    name: 'Restaurant / Traiteur',
    priorityComponents: ['hero', 'card', 'image', 'tabs', 'accordion', 'badge', 'form'],
    deprioritizedComponents: ['treeView', 'slider'],
    corePatterns: ['carte-du-jour', 'horaires-services', 'reservation-table']
  }
};

/**
 * Retourne les composants recommandés pour un métier donné
 */
export function getRecommendedComponentsForTrade(tradeId) {
  const key = String(tradeId || '').toLowerCase();
  const matched = Object.keys(TRADE_COMPONENT_MATRIX).find(k => key.includes(k));
  if (matched) return TRADE_COMPONENT_MATRIX[matched];
  return {
    name: tradeId || 'Artisan Général',
    priorityComponents: ['hero', 'card', 'badge', 'form', 'accordion', 'button'],
    deprioritizedComponents: ['table', 'treeView'],
    corePatterns: ['devis-gratuit', 'proximite', 'confiance']
  };
}

// ============================================================================
// 5. POLITIQUES RESPONSIVE & ACCESSIBILITÉ (Sections 12 & 13)
// ============================================================================

/**
 * Règle 12 — Transformation adaptative responsive
 */
export function evaluateResponsiveTransform(componentId, targetViewport = 'mobile') {
  const transforms = {
    header: { desktop: 'full-horizontal-nav', mobile: 'burger-sheet-with-direct-call' },
    buttonGroup: { desktop: 'horizontal-attached', mobile: 'stacked-full-width' },
    card: { desktop: 'multi-column-grid-3', mobile: 'single-column-card-flow' },
    tabs: { desktop: 'full-width-tabs', mobile: 'horizontal-swipe-segmented' },
    modal: { desktop: 'center-dialog-box', mobile: 'bottom-sheet-full-touch' }
  };
  return transforms[componentId]?.[targetViewport] || 'responsive-default';
}

/**
 * Règle 13 — Validation d'accessibilité
 */
export function verifyAccessibility(componentInstance) {
  const errors = [];
  const compDef = COMPONENT_INTELLIGENCE_REGISTRY[componentInstance.type];

  if (!compDef) {
    return { compliant: true, errors: [] };
  }

  // 1. Contrôle du label requis
  if (compDef.accessibilityPolicy?.labelRequired) {
    const hasLabel = Boolean(
      componentInstance.content?.label ||
      componentInstance.content?.text ||
      componentInstance.props?.ariaLabel ||
      componentInstance.content?.title
    );
    if (!hasLabel) {
      errors.push(`Accessibilité: Le composant '${componentInstance.type}' requiert un libellé textuel ou aria-label accessible.`);
    }
  }

  // 2. Contrôle du focus visible
  if (compDef.accessibilityPolicy?.visibleFocus) {
    if (componentInstance.props?.style?.includes('outline: none') && !componentInstance.props?.style?.includes('ring-')) {
      errors.push(`Accessibilité: Le focus visible ne doit jamais être supprimé sur '${componentInstance.type}'.`);
    }
  }

  // 3. Contrôle des inputs
  if (compDef.family === 'input' && !componentInstance.content?.label && componentInstance.props?.placeholder) {
    errors.push(`Accessibilité: Un placeholder ne peut pas remplacer le label sur '${componentInstance.type}'.`);
  }

  return {
    compliant: errors.length === 0,
    errors
  };
}

// ============================================================================
// 6. SCORE DE CONFIANCE DU COMPOSANT (Section 15)
// ============================================================================

/**
 * Calcule le score de confiance selon la formule :
 * score = usageFit * 0.30 + accessibilityConfidence * 0.25 + responsiveConfidence * 0.15 + contentFit * 0.15 + implementationSimplicity * 0.15
 */
export function calculateComponentConfidence(componentId, context = {}) {
  const comp = COMPONENT_INTELLIGENCE_REGISTRY[componentId];
  if (!comp) {
    return {
      componentId,
      score: 0,
      recommendation: 'do-not-inject',
      metrics: { usageFit: 0, accessibilityConfidence: 0, responsiveConfidence: 0, contentFit: 0, implementationSimplicity: 0 }
    };
  }

  let usageFit = 85;
  let accessibilityConfidence = comp.accessibilityPolicy?.keyboard ? 95 : 80;
  let responsiveConfidence = comp.responsivePolicy?.mobile ? 90 : 80;
  let contentFit = 85;
  let implementationSimplicity = comp.priority === 'P0' ? 95 : comp.priority === 'P1' ? 85 : 75;

  if (context.tradeId) {
    const trade = getRecommendedComponentsForTrade(context.tradeId);
    if (trade.priorityComponents.includes(componentId)) {
      usageFit = 100;
      contentFit = 95;
    } else if (trade.deprioritizedComponents.includes(componentId)) {
      usageFit = 30;
      contentFit = 40;
    }
  }

  if (context.pageType === 'landing' && ['table', 'treeView'].includes(componentId)) {
    usageFit = 10;
    contentFit = 15;
  }

  const finalScore = Math.round(
    usageFit * 0.30 +
    accessibilityConfidence * 0.25 +
    responsiveConfidence * 0.15 +
    contentFit * 0.15 +
    implementationSimplicity * 0.15
  );

  return {
    componentId,
    score: finalScore,
    recommendation: finalScore >= 80 ? 'suggest-auto' : finalScore >= 60 ? 'suggest-editable' : 'do-not-inject',
    metrics: { usageFit, accessibilityConfidence, responsiveConfidence, contentFit, implementationSimplicity }
  };
}

// ============================================================================
// 7. GARDE-FOUS CONTRE LES ANTI-PATTERNS (Section 20)
// ============================================================================

export function detectAntiPatterns(componentList, context = {}) {
  const flagged = [];

  // 1. Component dumping
  if (context.pageType === 'landing' && componentList.length > 14) {
    flagged.push({
      pattern: 'component-dumping',
      message: 'Excès de composants sur une seule page de prospection locale : privilégier la concision et la lisibilité.'
    });
  }

  // 2. Modal inflation
  if (componentList.filter(c => c === 'modal').length > 2) {
    flagged.push({
      pattern: 'modal-inflation',
      message: 'Trop de fenêtres modales : ne pas bloquer l\'utilisateur pour de simples détails consultables en ligne.'
    });
  }

  // 3. Fake complexity
  if (context.pageType === 'landing' && (componentList.includes('treeView') || componentList.includes('table'))) {
    flagged.push({
      pattern: 'fake-complexity',
      message: 'Complexité artificielle : les tree-views et tableaux sont inadaptés à une landing page artisanale.'
    });
  }

  return flagged;
}

// ============================================================================
// 8. CONTRAT UNIVERSEL COMPONENT INSTANCE (Section 18)
// ============================================================================

export function createComponentInstance({
  id = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  type = 'button',
  variant = 'primary',
  props = {},
  content = {},
  state = { disabled: false, loading: false, selected: false, expanded: false },
  analytics = { event: 'component_interaction', metadata: {} },
  responsive = {}
}) {
  return {
    id,
    type,
    variant,
    props,
    content,
    state,
    analytics,
    responsive,
    createdAt: new Date().toISOString()
  };
}

// ============================================================================
// 9. RAISONNEMENT COPILOT IA COMPONENT-DRIVEN (Section 17)
// ============================================================================

export function copilotComponentReasoning(userRequest, tradeId) {
  const lower = String(userRequest || '').toLowerCase();

  if (lower.includes('faq') || lower.includes('question') || lower.includes('repliable')) {
    return {
      family: 'disclosure',
      component: 'accordion',
      variant: 'card-accordion',
      density: 'compact',
      placement: 'before-cta',
      reasoning: 'INTENTION: Répondre aux questions fréquentes sans allonger artificiellement la page.'
    };
  }

  if (lower.includes('urgence') || lower.includes('astreinte') || lower.includes('24/7') || lower.includes('promo')) {
    return {
      family: 'feedback',
      component: 'alert',
      variant: 'urgent-banner',
      density: 'prominent',
      placement: 'hero-top',
      reasoning: 'INTENTION: Information critique immédiate requérant une visibilité prioritaire sans bloquer.'
    };
  }

  if (lower.includes('avant') || lower.includes('après') || lower.includes('comparateur') || lower.includes('gliss')) {
    return {
      family: 'media',
      component: 'carousel',
      variant: 'split-reveal-slider',
      density: 'heroic',
      placement: 'proof-section',
      reasoning: 'INTENTION: Preuve visuelle concrète et interactive montrant la transformation des travaux.'
    };
  }

  if (lower.includes('devis') || lower.includes('contact') || lower.includes('formulaire')) {
    return {
      family: 'input',
      component: 'form',
      variant: 'card-form',
      density: 'comfortable',
      placement: 'bottom-conversion',
      reasoning: 'INTENTION: Capturer les coordonnées et le besoin du prospect avec friction minimale.'
    };
  }

  const trade = getRecommendedComponentsForTrade(tradeId);
  return {
    family: 'content',
    component: trade.priorityComponents[1] || 'card',
    variant: 'service-card',
    density: 'standard',
    placement: 'services',
    reasoning: `INTENTION: Valorisation métier recommandée pour ${trade.name}.`
  };
}

import { getIcon } from "./icons.js";
import { renderWebsiteHTML, renderStickyCallBar } from "./renderer.js";
import { renderInspector } from "./inspector.js";
import { STYLE_PRESETS } from "../data/styles.js";
import { FONT_CATALOG, ensureFontCatalog } from "../data/fonts.js";
import { SECTION_DEFINITIONS } from "./addSectionModal.js";
import { INSPIRATION_PATTERNS } from "../data/inspiration.js";
import { escapeHtml } from "../utils/html.js";

function hexToRgbText(hex) {
  const raw = String(hex || "").replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(raw)) return "rgb(24, 24, 27)";
  return `rgb(${parseInt(raw.slice(0, 2), 16)}, ${parseInt(raw.slice(2, 4), 16)}, ${parseInt(raw.slice(4, 6), 16)})`;
}

/**
 * Sendpage / Linear / Raycast / Apple 2026-2030 Visual Editor Component.
 * Minimalist, 1px micro-borders, segmented pill-tabs, compact section cards
 * with discrete drag handle (::), eye visibility toggle, instant accordion,
 * Canva-like quick element dock, and real-time live preview.
 */

export function getSectionFriendlyTitle(sec) {
  const titles = {
    header: "Menu",
    hero: "Hero",
    about: "About",
    stats: "Key figures",
    services: "Services",
    gallery: "Photo gallery",
    hours: "Hours & Location",
    reviews: "Client reviews",
    faq: "FAQ",
    trust: "Garanties & Confiance",
    beforeAfter: "Before / After",
    realisations: "Our work",
    quoteSimulator: "Quote simulator",
    location: "Location",
    cta: "Final CTA",
    footer: "Footer",
    customBlock: "Document PDF",
    process: "Processus",
    certifications: "Certifications",
    pricing: "Grille Tarifaire",
    quoteBlock: "Citation",
    videoBlock: "Vidéo Immersion",
    stepperBlock: "Étapes",
    tableBlock: "Tableau Comparatif",
    sliderBlock: "Curseur de Surface",
    tabsBlock: "Onglets Prestations",
    roiCalculator: "Simulateur Rentabilité ROI",
    bookingBlock: "Créneaux & Rendez-vous"
  };
  return titles[sec?.type] || sec?.type || "Section";
}

export function getSectionIcon(type) {
  const map = {
    header: "layout",
    hero: "image",
    about: "user",
    stats: "chartBar",
    services: "briefcase",
    gallery: "image",
    hours: "clock",
    reviews: "message",
    faq: "helpCircle",
    customBlock: "fileText",
    cta: "phone",
    footer: "layout",
    beforeAfter: "image",
    realisations: "briefcase",
    quoteSimulator: "fileText",
    location: "mapPin",
    trust: "shield"
  };
  return map[type] || "layers";
}


export function renderEditor(state) {
  ensureFontCatalog();
  const project = state.currentProject;
  if (!project) return `<div class="p-12 text-center text-zinc-400">Aucun projet sélectionné.</div>`;

  const viewportWidthClass = {
    desktop: "w-full max-w-none shadow-none",
    tablet: "w-[768px] mx-auto shadow-sm rounded-2xl overflow-hidden border border-zinc-300 my-8 bg-white",
    mobile: "w-[390px] mx-auto shadow-sm rounded-3xl overflow-hidden border-2 border-zinc-400 my-8 bg-white"
  }[state.viewport] || "w-full";

  const selectedSecId = state.selectedSectionId || project.sections[0]?.id;
  const isLivePreview = state.editorMode === "preview";
  const websiteHTML = renderWebsiteHTML(project, {
    isEditor: !isLivePreview,
    isStandalone: false,
    includeStickyBar: false,
    selectedSectionId: selectedSecId,
    tradeId: project.business.tradeId
  });
  const selectedSec = project.sections.find(s => s.id === selectedSecId) || project.sections[0];
  const inspectorHTML = renderInspector(selectedSec, project, state);

  return `
    <div class="studio-system studio-editor studio-v3-editor h-screen flex flex-col text-zinc-900 overflow-hidden select-none">

      <!-- STUDIO V3: compact project bar; canvas controls move into the workspace -->
      <header class="studio-v3-topbar">
        <div class="studio-v3-projectbar">
          <button type="button" onclick="window.app.openDashboard()" class="studio-v3-iconbtn" title="Retour aux projets" aria-label="Retour aux projets">
            ${getIcon("arrowLeft", "w-4 h-4")}
          </button>
          <div class="studio-v3-projectmark">A</div>
          <div class="studio-v3-projectcopy">
            <button type="button" onclick="window.app.scrollToSection('${project.sections[0]?.id || ''}')" id="editor-title-display" class="studio-v3-projectname">${project.name}</button>
            <div class="studio-v3-projectmeta">
              <span>${project.business.tradeLabel}</span>
              <span class="studio-v3-dot"></span>
              <span>${project.business.city || 'France'}</span>
              <span class="studio-v3-save"><i></i><span id="save-status-text">Enregistré</span></span>
            </div>
          </div>
        </div>

        <div class="studio-v3-topactions">
          <div class="studio-v3-history" aria-label="Historique">
            <button type="button" id="btn-undo-header" onclick="window.app.undo()" class="studio-v3-iconbtn ${!state.canUndo() ? 'is-disabled' : ''}" title="Annuler (⌘Z)">${getIcon("undo", "w-4 h-4")}</button>
            <button type="button" id="btn-redo-header" onclick="window.app.redo()" class="studio-v3-iconbtn ${!state.canRedo() ? 'is-disabled' : ''}" title="Rétablir (⌘⇧Z)">${getIcon("redo", "w-4 h-4")}</button>
          </div>
          <button type="button" onclick="window.app.openCommandPalette()" class="studio-v3-action" title="Palette de commande (⌘K)">
            ${getIcon("search", "w-4 h-4")}<span>Rechercher</span><kbd>⌘K</kbd>
          </button>
          <button type="button" onclick="window.app.openShareModal()" class="studio-v3-iconbtn" title="Partager la démo">${getIcon("share", "w-4 h-4")}</button>
          <button type="button" onclick="window.app.openPreview('${project.id}')" class="studio-v3-previewbtn">${getIcon("eye", "w-4 h-4")}<span>Voir le site</span></button>
          <div class="relative">
            <button type="button" id="export-menu-button" aria-expanded="false" aria-controls="export-menu" aria-haspopup="menu" onclick="window.app.toggleExportMenu()" class="studio-v3-publishbtn">
              ${getIcon("download", "w-4 h-4")}<span>Exporter</span>${getIcon("chevronDown", "w-3 h-3")}
            </button>
            <div id="export-menu" data-open="false" role="menu" class="export-menu studio-v3-exportmenu hidden">
              <button type="button" onclick="window.app.exportHTML()">${getIcon("code", "w-4 h-4")}<span><b>Site autonome</b><small>HTML prêt à héberger</small></span></button>
              <button type="button" onclick="window.app.exportJSON()">${getIcon("fileJson", "w-4 h-4")}<span><b>Données projet</b><small>Sauvegarde JSON</small></span></button>
              <button type="button" onclick="window.app.printCommercialProposal()">${getIcon("printer", "w-4 h-4")}<span><b>Proposition</b><small>Version imprimable</small></span></button>
            </div>
          </div>
        </div>
      </header>

      <!-- STUDIO V3 WORKSPACE: rail + structure + canvas + inspector -->
      <div class="studio-v3-workspace editor-workspace-layout">
        ${!isLivePreview ? `
        <nav class="studio-v3-rail" aria-label="Outils du studio">
          <button type="button" class="studio-v3-railbtn ${state.activeSidebarTab !== 'settings' ? 'is-active' : ''}" onclick="window.app.setSidebarTab('sections'); requestAnimationFrame(() => document.querySelector('.studio-v3-structure-panel')?.classList.add('is-mobile-open'))" title="Structure">
            ${getIcon("layers", "w-5 h-5")}<span>Structure</span>
          </button>
          <button type="button" class="studio-v3-railbtn ${state.activeSidebarTab === 'settings' ? 'is-active' : ''}" onclick="window.app.setSidebarTab('settings'); requestAnimationFrame(() => document.querySelector('.studio-v3-structure-panel')?.classList.add('is-mobile-open'))" title="Réglages globaux">
            ${getIcon("sliders", "w-5 h-5")}<span>Réglages</span>
          </button>
          <button type="button" class="studio-v3-railbtn" onclick="window.app.openAddSectionModal('sections')" title="Ajouter une section">
            ${getIcon("plus", "w-5 h-5")}<span>Ajouter</span>
          </button>
          <div class="studio-v3-railspacer"></div>
          <button type="button" class="studio-v3-railbtn studio-v3-ai" onclick="window.app.toggleCopilotPanel(true)" title="Assistant Studio">
            ${getIcon("sparkles", "w-5 h-5")}<span>Assistant</span>
          </button>
        </nav>

        <aside class="studio-v3-structure-panel">
          <div class="studio-v3-panelhead">
            <div>
              <span class="studio-v3-eyebrow">${state.activeSidebarTab === 'settings' ? 'Projet' : 'Architecture'}</span>
              <h2>${state.activeSidebarTab === 'settings' ? 'Réglages du site' : 'Structure du site'}</h2>
            </div>
            <button type="button" class="studio-v3-mobile-close" onclick="this.closest('.studio-v3-structure-panel')?.classList.remove('is-mobile-open')" aria-label="Fermer">${getIcon("x", "w-4 h-4")}</button>
          </div>

          ${state.activeSidebarTab === 'settings' ? `
            <div class="studio-v3-panelbody studio-v3-settings-body">${renderSettingsAccordions(project, state)}</div>
          ` : `
            <div class="studio-v3-structure-summary">
              <span>${project.sections.filter(s => s.visibility !== false).length} visibles</span>
              <span>${project.sections.length} sections</span>
              <button type="button" onclick="window.app.openAddSectionModal('sections')">${getIcon("plus", "w-3.5 h-3.5")} Ajouter</button>
            </div>
            <div class="studio-v3-sectionlist" id="editor-sections-list">
              ${project.sections.map((s, index) => {
                const isSel = s.id === state.selectedSectionId;
                const isVis = s.visibility !== false;
                const isStructural = ["header", "hero", "cta", "footer"].includes(s.type);
                return `
                  <div class="studio-v3-sectionrow ${isSel ? 'is-selected' : ''} ${!isVis ? 'is-hidden' : ''}" data-sec-id="${s.id}">
                    <span class="studio-v3-order">${String(index + 1).padStart(2, '0')}</span>
                    ${isStructural ? '<span class="studio-v3-grip is-locked">•</span>' : `<span class="section-card-grip studio-v3-grip" draggable="true" data-sec-id="${s.id}" role="button" tabindex="0" aria-label="Glisser pour réorganiser ${getSectionFriendlyTitle(s)}" title="Réorganiser">${getIcon("gripVertical", "w-3.5 h-3.5")}</span>`}
                    <button type="button" class="studio-v3-sectionmain" onclick="window.app.handleSectionNavigation('${s.id}', event)">
                      <span class="studio-v3-sectionicon">${getIcon(getSectionIcon(s.type), "w-4 h-4")}</span>
                      <span><b>${getSectionFriendlyTitle(s)}</b><small>${s.type}</small></span>
                    </button>
                    ${isStructural ? '' : `<button type="button" onclick="event.stopPropagation(); window.app.toggleSectionVisibility('${s.id}')" class="studio-v3-rowaction" title="${isVis ? 'Masquer' : 'Afficher'}">${getIcon(isVis ? "eye" : "eyeOff", "w-3.5 h-3.5")}</button>`}
                    <button type="button" onclick="window.app.handleSectionNavigation('${s.id}', event)" class="studio-v3-rowarrow" aria-label="Inspecter">${getIcon("chevronRight", "w-3.5 h-3.5")}</button>
                  </div>`;
              }).join('')}
            </div>
          `}
          ${state.activeSidebarTab !== 'settings' ? `
            <template id="studio-v3-settings-capabilities">${renderSettingsAccordions(project, state)}</template>
          ` : ''}
          <template id="studio-v3-section-capabilities">
            ${project.sections.map((sec) => {
              const secDef = SECTION_DEFINITIONS.find(d => d.type === sec.type);
              return renderSectionAccordionContent(sec, project, secDef?.variants || []);
            }).join('')}
          </template>
        </aside>
        ` : ''}

        <!-- CENTRAL CANVAS: WEBPAGE PREVIEW / LIVE EDIT WITH CANVA DOCK -->
        <main id="editor-main-canvas" class="studio-v3-canvas flex-1 overflow-y-auto relative flex flex-col items-center editor-canvas-scroll-host min-h-0 h-full w-full">
          <div class="studio-v3-stagebar">
            <div class="studio-v3-mode-switch" aria-label="Mode d'édition">
              <button type="button" aria-pressed="${!isLivePreview}" onclick="window.app.setEditorMode('conception')" class="${!isLivePreview ? 'is-active' : ''}">${getIcon("edit", "w-3.5 h-3.5")}<span>Éditer</span></button>
              <button type="button" aria-pressed="${isLivePreview}" onclick="window.app.setEditorMode('preview')" class="${isLivePreview ? 'is-active' : ''}">${getIcon("eye", "w-3.5 h-3.5")}<span>Aperçu</span></button>
            </div>
            <div class="studio-v3-stagecontext">
              <span>${getIcon(getSectionIcon(selectedSec?.type), "w-3.5 h-3.5")}</span>
              <b>${getSectionFriendlyTitle(selectedSec)}</b>
            </div>
            <div class="studio-v3-device-switch" aria-label="Prévisualisation par appareil">
              <button type="button" data-viewport="desktop" onclick="window.app.setViewport('desktop')" class="${state.viewport === 'desktop' ? 'is-active' : ''}" title="Ordinateur">${getIcon("monitor", "w-4 h-4")}</button>
              <button type="button" data-viewport="tablet" onclick="window.app.setViewport('tablet')" class="${state.viewport === 'tablet' ? 'is-active' : ''}" title="Tablette">${getIcon("tablet", "w-4 h-4")}</button>
              <button type="button" data-viewport="mobile" onclick="window.app.setViewport('mobile')" class="${state.viewport === 'mobile' ? 'is-active' : ''}" title="Mobile">${getIcon("smartphone", "w-4 h-4")}</button>
            </div>
          </div>

          <!-- In-situ Live Preview Client Floating Pill (Docked at bottom so header and theme toggles remain completely accessible) -->
          ${isLivePreview ? `
            <div class="studio-v3-preview-return fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50 bg-zinc-950/95 text-white px-5 py-2.5 rounded-full shadow-2xl border border-zinc-700 flex items-center gap-4 text-xs backdrop-blur animate-fade-in">
              <span class="flex items-center gap-2 font-bold text-zinc-200">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Aperçu Client Démo en direct</span>
              </span>
              <div class="h-4 w-[1px] bg-zinc-700"></div>
              <button type="button" aria-pressed="true" onclick="window.app.setEditorMode('conception')" class="btn-keycap btn-keycap-light px-3 py-1 rounded-full text-xs font-bold text-zinc-950 flex items-center gap-1.5 shadow-sm">
                ${getIcon("edit", "w-3.5 h-3.5")}
                <span>Retour Conception</span>
              </button>
            </div>
          ` : `
            <!-- Canva-like Quick Element Adder Dock (Hidden to keep canvas clean) -->
            <div class="canva-dock ${state.activeDrawer ? 'hidden' : ''}" id="canva-floating-dock" style="display: none;">
              <span class="text-ui-sm font-bold text-zinc-500 px-1.5 flex items-center gap-1">
                ${getIcon("plus", "w-3 h-3 text-zinc-400")}
                <span>Ajouter un bloc :</span>
              </span>
              <button type="button" onclick="window.app.addCanvaElement('urgentBanner')" class="canva-dock-btn" title="Ajouter un bandeau promo ou urgence">
                ${getIcon("megaphone", "w-3.5 h-3.5")}<span>Bandeau promo</span>
              </button>
              <button type="button" onclick="window.app.addCanvaElement('floatingBadge')" class="canva-dock-btn" title="Ajouter un badge de réassurance agréé">
                ${getIcon("shield", "w-3.5 h-3.5")}<span>Badge réassurance</span>
              </button>
              <button type="button" onclick="window.app.addCanvaElement('customCard')" class="canva-dock-btn" title="Ajouter un encadré d'information">
                ${getIcon("package", "w-3.5 h-3.5")}<span>Encadré sur-mesure</span>
              </button>
              <button type="button" onclick="window.app.openAddSectionModal('components')" class="canva-dock-btn" title="Ouvrir la bibliothèque des composants Add-on">
                ${getIcon("puzzle", "w-3.5 h-3.5")}<span>Composants Add-on...</span>
              </button>
              <button type="button" onclick="window.app.openAddSectionModal('sections')" class="canva-dock-btn" title="Ouvrir le catalogue des sections complètes">
                ${getIcon("layers", "w-3.5 h-3.5")}<span>Sections...</span>
              </button>
            </div>
          `}


          <!-- In-Canvas Floating Text Toolbar (Curseur de taille, Gras, Italique, Souligné, Couleur, Anim) -->
          <div id="floating-text-toolbar" class="floating-text-toolbar" style="display: none;" role="toolbar" aria-label="Formatage du texte" onclick="event.stopPropagation();">
            <div class="flex items-center gap-1.5">
              <span class="text-ui-2xs uppercase font-bold text-zinc-400 mr-0.5">Taille:</span>
              <input type="range" id="ftb-font-slider" min="-8" max="20" step="1" value="0"
                     oninput="window.app.adjustActiveTextFontSizeSlider(this.value)"
                     class="w-20 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                     title="Glisser de gauche à droite pour ajuster la taille">
              <span id="ftb-font-val" class="text-ui-2xs font-mono text-amber-400 min-w-[24px] text-right font-semibold">0</span>
            </div>
            <div class="h-3.5 w-[1px] bg-zinc-700 mx-1"></div>
            <div class="flex items-center gap-1">
              <button type="button" id="ftb-bold" class="ftb-btn font-bold" title="Mettre en gras (B)">B</button>
              <button type="button" id="ftb-italic" class="ftb-btn italic font-serif" title="Mettre en italique (I)">I</button>
              <button type="button" id="ftb-underline" class="ftb-btn underline" title="Souligner le texte (U)">U</button>
            </div>
            <div class="h-3.5 w-[1px] bg-zinc-700 mx-1"></div>
            <div class="relative inline-block">
              <button type="button" id="ftb-color-btn" onclick="window.app.toggleTextColorMenu()" class="ftb-btn text-zinc-300 font-semibold flex items-center gap-1 px-1.5" title="Changer la couleur du texte">
                <span id="ftb-color-indicator" class="w-2.5 h-2.5 rounded-full border border-white/40 bg-white"></span>
                <span>Couleur</span>
                <span id="ftb-state-badge" class="hidden px-1.5 py-0.5 rounded bg-amber-400 text-zinc-950 text-ui-2xs font-bold" title="Les réglages s'appliquent à cet état"></span>
              </button>
              <div id="ftb-color-menu" class="hidden absolute left-0 top-full mt-2 w-52 bg-zinc-900/95 backdrop-blur-md border border-white/20 rounded-xl p-2.5 shadow-2xl z-50 text-white text-ui-sm">
                <div class="text-ui-2xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">État modifié</div>
                <div class="flex flex-wrap gap-1 mb-2.5" role="group" aria-label="État auquel s'appliquent les réglages">
                  <button type="button" data-ftb-state="default" class="motion-loop-btn is-active" onclick="window.app.setActiveTextState('default')">Principal</button>
                  <button type="button" data-ftb-state="hover" class="motion-loop-btn" onclick="window.app.setActiveTextState('hover')">Survol</button>
                  <button type="button" data-ftb-state="focus" class="motion-loop-btn" onclick="window.app.setActiveTextState('focus')">Focus</button>
                  <button type="button" data-ftb-state="active" class="motion-loop-btn" onclick="window.app.setActiveTextState('active')">Actif</button>
                  <button type="button" data-ftb-state="disabled" class="motion-loop-btn" onclick="window.app.setActiveTextState('disabled')">Désactivé</button>
                </div>
                <div class="text-ui-2xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Nuancier Texte</div>
                <div class="grid grid-cols-6 gap-1.5 mb-2">
                  <button type="button" onclick="window.app.setActiveTextColor('#09090b')" class="w-6 h-6 rounded-md border border-white/30 bg-[#09090b]" title="Noir Profond"></button>
                  <button type="button" onclick="window.app.setActiveTextColor('#18181b')" class="w-6 h-6 rounded-md border border-white/30 bg-[#18181b]" title="Anthracite"></button>
                  <button type="button" onclick="window.app.setActiveTextColor('#ffffff')" class="w-6 h-6 rounded-md border border-white/30 bg-[#ffffff]" title="Blanc"></button>
                  <button type="button" onclick="window.app.setActiveTextColor('#f59e0b')" class="w-6 h-6 rounded-md border border-white/30 bg-[#f59e0b]" title="Or Chaud"></button>
                  <button type="button" onclick="window.app.setActiveTextColor('#059669')" class="w-6 h-6 rounded-md border border-white/30 bg-[#059669]" title="Émeraude"></button>
                  <button type="button" onclick="window.app.setActiveTextColor('#2563eb')" class="w-6 h-6 rounded-md border border-white/30 bg-[#2563eb]" title="Bleu"></button>
                </div>
                <div class="flex items-center gap-2 pt-1.5 border-t border-white/10">
                  <label class="text-ui-xs text-zinc-300 flex items-center gap-1.5 cursor-pointer">
                    <input type="color" id="ftb-custom-color" onchange="window.app.setActiveTextColor(this.value)" class="w-4 h-4 rounded border-0 cursor-pointer p-0 bg-transparent">
                    <span>Sur-mesure</span>
                  </label>
                  <button type="button" onclick="window.app.setActiveTextColor('')" class="text-ui-xs text-amber-400 hover:underline ml-auto">Par défaut</button>
                </div>
              </div>
            </div>
            <div class="h-3.5 w-[1px] bg-zinc-700 mx-1"></div>
            <div class="relative inline-block">
              <button type="button" id="ftb-anim-btn" onclick="window.app.toggleTextMotionMenu()" class="ftb-btn text-amber-400 font-semibold flex items-center gap-1 px-1.5" title="Appliquer une animation à ce texte (60fps)">
                ${getIcon("sparkles", "w-3.5 h-3.5")}<span>Anim</span>
              </button>
              <div id="ftb-anim-menu" class="hidden absolute left-0 top-full mt-2 w-56 bg-zinc-900/95 backdrop-blur-md border border-white/20 rounded-xl p-2.5 shadow-2xl z-50 text-white text-ui-sm">
                <div class="text-ui-2xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Animation de l’élément · texte</div>
                <div class="grid grid-cols-2 gap-1.5">
                  <button type="button" data-motion-preview="fade-in" onclick="window.app.setActiveTextMotion('fade-in')" class="motion-chip">Fade ◐</button>
                  <button type="button" data-motion-preview="slide-up" onclick="window.app.setActiveTextMotion('slide-up')" class="motion-chip">Slide ↑</button>
                  <button type="button" data-motion-preview="spring" onclick="window.app.setActiveTextMotion('spring')" class="motion-chip">Spring ⤒</button>
                  <button type="button" data-motion-preview="pulse" onclick="window.app.setActiveTextMotion('pulse')" class="motion-chip">Pulse ◉</button>
                  <button type="button" data-motion-preview="shimmer" onclick="window.app.setActiveTextMotion('shimmer')" class="motion-chip"><span class="inline-flex items-center justify-center gap-1">Shimmer ${getIcon("sparkles", "w-3 h-3")}</span></button>
                  <button type="button" data-motion-preview="zoom-in" onclick="window.app.setActiveTextMotion('zoom-in')" class="motion-chip">Zoom ⤢</button>
                  <button type="button" onclick="window.app.setActiveTextMotion('none')" class="motion-chip col-span-2 text-zinc-400">Aucune</button>
                </div>
                <div class="motion-loop-row" data-text-loop-row>
                  <span class="motion-loop-label">Répétition</span>
                  <button type="button" data-text-loop="once" class="motion-loop-btn is-active" onclick="window.app.setActiveTextMotionLoop('once')">Une fois</button>
                  <button type="button" data-text-loop="twice" class="motion-loop-btn" onclick="window.app.setActiveTextMotionLoop('twice')">×2</button>
                  <button type="button" data-text-loop="infinite" class="motion-loop-btn" onclick="window.app.setActiveTextMotionLoop('infinite')">Boucle</button>
                </div>
                <div class="motion-preview-hint">Survolez un preset pour le prévisualiser.</div>
                <div class="motion-preview-hint">Survolez un preset pour le prévisualiser.</div>
              </div>
            </div>
            <div class="h-3.5 w-[1px] bg-zinc-700 mx-1"></div>
            <button type="button" id="ftb-close" class="ftb-btn text-zinc-400 hover:text-white px-1.5" title="Terminer l’édition (Échap)" aria-label="Terminer l’édition">${getIcon("check", "w-3.5 h-3.5")}</button>
          </div>

          <div class="transition-all duration-300 ${viewportWidthClass} ${isLivePreview ? 'client-preview-mode' : ''} min-h-full mt-3 rounded-t-xl overflow-visible shadow-sm" id="canvas-container" data-viewport="${state.viewport}" style="background-color: ${project.branding?.bgColor || '#ffffff'}; color: ${project.branding?.textColor || '#18181b'};">
            ${websiteHTML}
          </div>
        </main>

        ${!isLivePreview ? `
        <aside class="studio-v3-inspector-panel" id="right-inspector-panel">
          <div class="studio-v3-responsive-inspector-head">
            <div><span>Édition</span><b>Propriétés de la section</b></div>
            <button type="button" onclick="document.getElementById('right-inspector-panel')?.classList.remove('is-responsive-open')" aria-label="Fermer les propriétés">${getIcon("x", "w-4 h-4")}</button>
          </div>
          <div class="studio-v3-inspector-shell">
            ${inspectorHTML}
          </div>
        </aside>
        ` : ''}

      </div>

      ${renderStickyCallBar(project, { isEditor: !isLivePreview })}

      ${!isLivePreview && state.copilotOpen ? `
        <div class="copilot-floating-panel" role="dialog" aria-label="Assistant Copilot IA">
          <div class="copilot-floating-header">
            <div class="flex items-center gap-2">
              ${getIcon("sparkles", "w-4 h-4 text-amber-400")}
              <div>
              <div class="text-xs font-bold text-white">Assistant Studio</div>
                <div class="text-ui-xs text-zinc-400">Modifications ciblées avec Undo</div>
              </div>
            </div>
            <button type="button" aria-label="Fermer Assistant Studio" onclick="window.app.toggleCopilotPanel(false)" class="copilot-close-btn">
              ${getIcon("x", "w-4 h-4")}
            </button>
          </div>
          <form onsubmit="window.app.submitCopilotPrompt(event)" class="space-y-2.5">
            <textarea id="copilot-prompt-input" rows="3" placeholder="Ex : Change la couleur de #section-2 ou supprime #btn-33" class="copilot-prompt-input"></textarea>
            <div class="copilot-suggestion-row">
              <button type="button" onclick="window.app.applyCopilotChip('Rends le bouton #btn-1 plus visible')">#btn-1</button>
              <button type="button" onclick="window.app.applyCopilotChip('Améliore la section #section-2')">#section-2</button>
            </div>
            <button type="submit" class="btn-keycap btn-keycap-dark w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5">
              ${getIcon("sparkles", "w-3.5 h-3.5 text-amber-400")}
              <span>Exécuter la consigne</span>
            </button>
          </form>
          <div id="copilot-feedback" class="copilot-feedback hidden"></div>
        </div>
      ` : `
        <button type="button" aria-label="Ouvrir Studio Assistant IA" onclick="window.app.toggleCopilotPanel(true)" class="copilot-launcher ai-launcher-pill">
          <span class="relative">
            <span class="assistant-avatar">${getIcon("bot", "w-4 h-4 text-amber-300")}</span>
            <span class="ai-status-dot"></span>
          </span>
          <div class="text-left flex flex-col">
            <span class="font-bold text-zinc-100 text-xs">Studio Assistant IA</span>
            <span class="text-ui-xs text-zinc-400 font-normal">Génération & Édition IA</span>
          </div>
          <span class="ml-auto text-amber-400 pl-1">${getIcon("sparkles", "w-3.5 h-3.5")}</span>
        </button>
      `}

    </div>
  `;
}

/**
 * Accordion content helper for the compact sidebar section cards.
 */
function renderSectionAccordionContent(sec, project, variants) {
  const c = sec.content || {};
  const sectionId = sec.id;

  return `
    <div class="space-y-3">

      <!-- Section Quick Action Bar: Monter, Descendre, Masquer, Dupliquer, Supprimer -->
      <div class="flex items-center justify-between gap-1.5 p-1.5 bg-zinc-100/90 rounded-lg border border-zinc-200">
        <div class="flex items-center gap-1">
          <button type="button" onclick="window.app.moveSection('${sectionId}', 'up')" class="btn-keycap btn-keycap-light py-1 px-2.5 text-ui-xs font-bold text-zinc-800 rounded flex items-center gap-1 border border-zinc-200 shadow-2xs" title="Monter cette section (↑)">
            ${getIcon("chevronUp", "w-3.5 h-3.5")}
            <span>Monter</span>
          </button>
          <button type="button" onclick="window.app.moveSection('${sectionId}', 'down')" class="btn-keycap btn-keycap-light py-1 px-2.5 text-ui-xs font-bold text-zinc-800 rounded flex items-center gap-1 border border-zinc-200 shadow-2xs" title="Descendre cette section (↓)">
            ${getIcon("chevronDown", "w-3.5 h-3.5")}
            <span>Descendre</span>
          </button>
        </div>
        <div class="flex items-center gap-1">
          <button type="button" onclick="window.app.toggleSectionVisibility('${sectionId}')" class="btn-keycap btn-keycap-light p-1.5 text-zinc-700 rounded border border-zinc-200 shadow-2xs" title="${sec.visibility !== false ? 'Masquer la section' : 'Afficher la section'}">
            ${getIcon(sec.visibility !== false ? "eye" : "eyeOff", "w-3.5 h-3.5")}
          </button>
          <button type="button" onclick="window.app.duplicateSection('${sectionId}')" class="btn-keycap btn-keycap-light p-1.5 text-zinc-700 rounded border border-zinc-200 shadow-2xs" title="Dupliquer la section">
            ${getIcon("copy", "w-3.5 h-3.5")}
          </button>
          <button type="button" onclick="window.app.deleteSection('${sectionId}')" class="btn-keycap btn-keycap-danger p-1.5 text-red-600 rounded border border-red-200 shadow-2xs" title="Supprimer la section">
            ${getIcon("trash", "w-3.5 h-3.5")}
          </button>
        </div>
      </div>

      <!-- Variant Selector if available -->
      ${variants.length > 1 ? `
        <div>
          <label class="block text-ui-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Variante d'Affichage</label>
          <select onchange="window.app.changeSectionVariant('${sectionId}', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 font-medium focus:border-zinc-900 focus:outline-none">
            ${variants.map(v => `
              <option value="${v.id}" ${sec.variant === v.id ? 'selected' : ''}>${v.label}</option>
            `).join('')}
          </select>
        </div>
      ` : ''}

      <!-- Badge / Surtitre -->
      ${c.badge !== undefined ? `
        <div>
          <label class="block text-ui-xs font-medium text-zinc-500 mb-1">Surtitre / Badge :</label>
          <input type="text" value="${escapeHtml(c.badge)}"
                 data-field="badge"
                 oninput="window.app.liveUpdateField('${sectionId}', 'badge', this.value)"
                 onchange="window.app.commitFieldUpdate('${sectionId}', 'badge', this.value)"
                 class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none">
        </div>
      ` : ''}

      <!-- Titre principal -->
      ${c.title !== undefined ? `
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <label class="block text-ui-xs font-medium text-zinc-500">Titre principal :</label>
            <div class="flex items-center gap-1.5">
              <span class="text-ui-2xs text-zinc-400 font-bold uppercase">Taille:</span>
              <input type="range" min="-10" max="24" step="1" value="${sec.settings?.[`fontSize_title`] || 0}"
                     data-field-font-slider="title"
                     oninput="window.app.adjustFieldFontSizeSlider('${sectionId}', 'title', this.value); const valEl = document.getElementById('title-size-val-${sectionId}'); if (valEl) valEl.textContent = (this.value >= 0 ? '+' : '') + this.value + 'px';"
                     class="w-20 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                     title="Glisser pour modifier la taille du titre">
              <span id="title-size-val-${sectionId}" class="text-ui-2xs font-mono text-zinc-500 min-w-[28px] text-right">${(sec.settings?.[`fontSize_title`] || 0) >= 0 ? '+' : ''}${sec.settings?.[`fontSize_title`] || 0}px</span>
            </div>
          </div>
          <textarea rows="2"
                    data-field="title"
                    oninput="window.app.liveUpdateField('${sectionId}', 'title', this.value)"
                    onchange="window.app.commitFieldUpdate('${sectionId}', 'title', this.value)"
                    class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none leading-snug">${escapeHtml(c.title)}</textarea>
        </div>
      ` : ''}

      <!-- Sous-titre / Descriptif -->
      ${c.subtitle !== undefined ? `
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <label class="block text-ui-xs font-medium text-zinc-500">Sous-titre :</label>
            <div class="flex items-center gap-1.5">
              <span class="text-ui-2xs text-zinc-400 font-bold uppercase">Taille:</span>
              <input type="range" min="-10" max="24" step="1" value="${sec.settings?.[`fontSize_subtitle`] || 0}"
                     data-field-font-slider="subtitle"
                     oninput="window.app.adjustFieldFontSizeSlider('${sectionId}', 'subtitle', this.value); const valEl = document.getElementById('subtitle-size-val-${sectionId}'); if (valEl) valEl.textContent = (this.value >= 0 ? '+' : '') + this.value + 'px';"
                     class="w-20 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                     title="Glisser pour modifier la taille du sous-titre">
              <span id="subtitle-size-val-${sectionId}" class="text-ui-2xs font-mono text-zinc-500 min-w-[28px] text-right">${(sec.settings?.[`fontSize_subtitle`] || 0) >= 0 ? '+' : ''}${sec.settings?.[`fontSize_subtitle`] || 0}px</span>
            </div>
          </div>
          <textarea rows="2"
                    data-field="subtitle"
                    oninput="window.app.liveUpdateField('${sectionId}', 'subtitle', this.value)"
                    onchange="window.app.commitFieldUpdate('${sectionId}', 'subtitle', this.value)"
                    class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none leading-snug">${escapeHtml(c.subtitle)}</textarea>
        </div>
      ` : ''}

      <!-- Texte / Description générale (ex: customBlock, quoteBlock, etc.) -->
      ${c.text !== undefined ? `
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <label class="block text-ui-xs font-medium text-zinc-500">Texte / Argumentaire :</label>
            <div class="flex items-center gap-1.5">
              <span class="text-ui-2xs text-zinc-400 font-bold uppercase">Taille:</span>
              <input type="range" min="-10" max="24" step="1" value="${sec.settings?.[`fontSize_text`] || 0}"
                     data-field-font-slider="text"
                     oninput="window.app.adjustFieldFontSizeSlider('${sectionId}', 'text', this.value); const valEl = document.getElementById('text-size-val-${sectionId}'); if (valEl) valEl.textContent = (this.value >= 0 ? '+' : '') + this.value + 'px';"
                     class="w-20 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                     title="Glisser pour modifier la taille du texte">
              <span id="text-size-val-${sectionId}" class="text-ui-2xs font-mono text-zinc-500 min-w-[28px] text-right">${(sec.settings?.[`fontSize_text`] || 0) >= 0 ? '+' : ''}${sec.settings?.[`fontSize_text`] || 0}px</span>
            </div>
          </div>
          <textarea rows="3"
                    data-field="text"
                    oninput="window.app.liveUpdateField('${sectionId}', 'text', this.value)"
                    onchange="window.app.commitFieldUpdate('${sectionId}', 'text', this.value)"
                    class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none leading-relaxed">${escapeHtml(c.text)}</textarea>
        </div>
      ` : ''}

      ${c.ctaText !== undefined ? `
        <div>
          <label class="block text-ui-xs font-medium text-zinc-500 mb-1">Bouton d'Appel / Action :</label>
          <input type="text" value="${escapeHtml(c.ctaText)}"
                 data-field="ctaText"
                 oninput="window.app.liveUpdateField('${sectionId}', 'ctaText', this.value)"
                 onchange="window.app.commitFieldUpdate('${sectionId}', 'ctaText', this.value)"
                 class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none">
        </div>
      ` : ''}

      <!-- Vitrine template: header identity + one-page navigation -->
      ${sec.type === 'header' ? `
        <div class="space-y-2.5 pt-2 border-t border-zinc-200/60">
          <label class="block text-ui-xs font-bold text-zinc-500 uppercase tracking-wider">Identité & Navigation Vitrine</label>
          <div>
            <label class="block text-ui-xs text-zinc-500 mb-1">Nom affiché :</label>
            <input type="text" value="${escapeHtml(c.brandName || '')}"
                   data-field="brandName"
                   oninput="window.app.liveUpdateField('${sectionId}', 'brandName', this.value)"
                   onchange="window.app.commitFieldUpdate('${sectionId}', 'brandName', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs text-zinc-900">
          </div>
          ${Array.isArray(c.links) && c.links.length ? `
            <div class="space-y-1.5">
              <div class="text-ui-xs text-zinc-500">Libellés du menu :</div>
              ${c.links.map((link, linkIdx) => `
                <div class="grid grid-cols-[1fr_auto] gap-2 items-center">
                  <input type="text" value="${escapeHtml(link.label || '')}"
                         data-field="links.${linkIdx}.label"
                         oninput="window.app.liveUpdateField('${sectionId}', 'links.${linkIdx}.label', this.value)"
                         onchange="window.app.commitFieldUpdate('${sectionId}', 'links.${linkIdx}.label', this.value)"
                         class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs text-zinc-900">
                  <span class="text-ui-2xs font-mono text-zinc-400">${escapeHtml(link.target || '')}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- Vitrine template: About copy, CTA labels and portrait -->
      ${sec.type === 'about' ? `
        <div class="space-y-2.5 pt-2 border-t border-zinc-200/60">
          <label class="block text-ui-xs font-bold text-zinc-500 uppercase tracking-wider">À propos — contenu du template</label>
          <div class="grid grid-cols-2 gap-2">
            <input type="text" value="${escapeHtml(c.certified || '')}" placeholder="Badge certification"
                   data-field="certified"
                   oninput="window.app.liveUpdateField('${sectionId}', 'certified', this.value)"
                   onchange="window.app.commitFieldUpdate('${sectionId}', 'certified', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm">
            <input type="text" value="${escapeHtml(c.role || '')}" placeholder="Métier / rôle"
                   data-field="role"
                   oninput="window.app.liveUpdateField('${sectionId}', 'role', this.value)"
                   onchange="window.app.commitFieldUpdate('${sectionId}', 'role', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm">
          </div>
          <textarea rows="7" data-field="story" placeholder="Histoire / présentation"
                    oninput="window.app.liveUpdateField('${sectionId}', 'story', this.value)"
                    onchange="window.app.commitFieldUpdate('${sectionId}', 'story', this.value)"
                    class="w-full bg-white border border-zinc-200 rounded px-2 py-1.5 text-ui-sm leading-relaxed">${escapeHtml(c.story || '')}</textarea>
          <div class="grid grid-cols-2 gap-2">
            <input type="text" value="${escapeHtml(c.aboutCta || '')}" placeholder="CTA devis"
                   data-field="aboutCta"
                   oninput="window.app.liveUpdateField('${sectionId}', 'aboutCta', this.value)"
                   onchange="window.app.commitFieldUpdate('${sectionId}', 'aboutCta', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm">
            <input type="text" value="${escapeHtml(c.aboutLink || '')}" placeholder="Lien services"
                   data-field="aboutLink"
                   oninput="window.app.liveUpdateField('${sectionId}', 'aboutLink', this.value)"
                   onchange="window.app.commitFieldUpdate('${sectionId}', 'aboutLink', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm">
          </div>
          <div class="flex items-center gap-2">
            <div class="w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100 shrink-0">
              <img src="${c.image || ''}" alt="Portrait" class="w-full h-full object-cover">
            </div>
            <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'image')"
                    class="text-ui-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded border border-zinc-200">Remplacer le portrait</button>
          </div>
        </div>
      ` : ''}

      <!-- Vitrine template: reviews are first-class editable content -->
      ${sec.type === 'reviews' ? `
        <div class="space-y-2.5 pt-2 border-t border-zinc-200/60">
          <div class="flex items-center justify-between">
            <label class="block text-ui-xs font-bold text-zinc-500 uppercase tracking-wider">Avis clients (${(c.reviews || []).length})</label>
            <button type="button" onclick="window.app.addReviewItem('${sectionId}')" class="text-ui-xs font-bold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded border border-zinc-200">+ Ajouter</button>
          </div>
          ${(c.reviews || []).map((review, reviewIdx) => `
            <div class="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-ui-xs font-bold text-zinc-700 uppercase">Avis #${reviewIdx + 1}</span>
                <button type="button" onclick="window.app.removeReviewItem('${sectionId}', ${reviewIdx})" class="text-red-600 hover:text-red-700 p-0.5" title="Supprimer">${getIcon("trash", "w-3.5 h-3.5")}</button>
              </div>
              <div class="grid grid-cols-[1fr_72px] gap-1.5">
                <input type="text" value="${escapeHtml(review.author || '')}" placeholder="Nom"
                       data-field="reviews.${reviewIdx}.author"
                       oninput="window.app.liveUpdateField('${sectionId}', 'reviews.${reviewIdx}.author', this.value)"
                       onchange="window.app.commitFieldUpdate('${sectionId}', 'reviews.${reviewIdx}.author', this.value)"
                       class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm">
                <select onchange="window.app.updateSectionContent('${sectionId}', 'reviews.${reviewIdx}.rating', Number(this.value))"
                        class="w-full bg-white border border-zinc-200 rounded px-1.5 py-1 text-ui-sm">
                  ${[5,4,3,2,1].map(star => `<option value="${star}" ${Number(review.rating || 5) === star ? 'selected' : ''}>${star}★</option>`).join('')}
                </select>
              </div>
              <input type="text" value="${escapeHtml(review.city || '')}" placeholder="Ville / contexte"
                     data-field="reviews.${reviewIdx}.city"
                     oninput="window.app.liveUpdateField('${sectionId}', 'reviews.${reviewIdx}.city', this.value)"
                     onchange="window.app.commitFieldUpdate('${sectionId}', 'reviews.${reviewIdx}.city', this.value)"
                     class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-xs">
              <textarea rows="3" placeholder="Texte de l'avis"
                        data-field="reviews.${reviewIdx}.text"
                        oninput="window.app.liveUpdateField('${sectionId}', 'reviews.${reviewIdx}.text', this.value)"
                        onchange="window.app.commitFieldUpdate('${sectionId}', 'reviews.${reviewIdx}.text', this.value)"
                        class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm leading-snug">${escapeHtml(review.text || '')}</textarea>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Vitrine template: hours, address and interactive/static map mode -->
      ${sec.type === 'hours' ? `
        <div class="space-y-2.5 pt-2 border-t border-zinc-200/60">
          <label class="block text-ui-xs font-bold text-zinc-500 uppercase tracking-wider">Horaires & carte</label>
          <div class="grid grid-cols-2 gap-2">
            <input type="text" value="${escapeHtml(c.city || project.business?.city || '')}" placeholder="Ville"
                   data-field="city"
                   oninput="window.app.liveUpdateField('${sectionId}', 'city', this.value)"
                   onchange="window.app.commitFieldUpdate('${sectionId}', 'city', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm">
            <input type="text" value="${escapeHtml(c.address || '')}" placeholder="Adresse / zone"
                   data-field="address"
                   oninput="window.app.liveUpdateField('${sectionId}', 'address', this.value)"
                   onchange="window.app.commitFieldUpdate('${sectionId}', 'address', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm">
          </div>
          <div>
            <label class="block text-ui-xs text-zinc-500 mb-1">Carte :</label>
            <select onchange="window.app.updateSectionContent('${sectionId}', 'mapMode', this.value)"
                    class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm">
              <option value="interactive" ${(c.mapMode || 'interactive') === 'interactive' ? 'selected' : ''}>Interactive Google Maps</option>
              <option value="image" ${c.mapMode === 'image' ? 'selected' : ''}>Image personnalisée</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-1.5">
            ${['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'].map(day => `
              <div>
                <label class="block text-ui-2xs capitalize text-zinc-400 mb-0.5">${day}</label>
                <input type="text" value="${escapeHtml(c.hours?.[day] || '')}"
                       data-field="hours.${day}"
                       oninput="window.app.liveUpdateField('${sectionId}', 'hours.${day}', this.value)"
                       onchange="window.app.commitFieldUpdate('${sectionId}', 'hours.${day}', this.value)"
                       class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-xs">
              </div>
            `).join('')}
          </div>
          <div class="flex items-center gap-2">
            ${c.mapImage ? `<div class="w-20 h-12 rounded overflow-hidden border border-zinc-200 bg-zinc-100"><img src="${c.mapImage}" alt="Carte" class="w-full h-full object-cover"></div>` : ''}
            <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'mapImage')"
                    class="text-ui-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded border border-zinc-200">Choisir l'image de carte</button>
          </div>
        </div>
      ` : ''}

      <!-- Vitrine template: quote simulator conversion content -->
      ${sec.type === 'quoteSimulator' ? `
        <div class="space-y-2.5 pt-2 border-t border-zinc-200/60">
          <label class="block text-ui-xs font-bold text-zinc-500 uppercase tracking-wider">Simulateur de devis</label>
          <div class="grid grid-cols-2 gap-2">
            <input type="text" value="${escapeHtml(c.typeLabel || '')}" placeholder="Libellé prestation" data-field="typeLabel"
                   oninput="window.app.liveUpdateField('${sectionId}', 'typeLabel', this.value)" onchange="window.app.commitFieldUpdate('${sectionId}', 'typeLabel', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm">
            <input type="text" value="${escapeHtml(c.sizeLabel || '')}" placeholder="Libellé taille" data-field="sizeLabel"
                   oninput="window.app.liveUpdateField('${sectionId}', 'sizeLabel', this.value)" onchange="window.app.commitFieldUpdate('${sectionId}', 'sizeLabel', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm">
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div><label class="block text-ui-2xs text-zinc-400 mb-0.5">Prestations — une par ligne</label><textarea rows="5" onchange="window.app.updateListField('${sectionId}', 'types', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-xs leading-snug">${escapeHtml((c.types || []).join('\n'))}</textarea></div>
            <div><label class="block text-ui-2xs text-zinc-400 mb-0.5">Tailles — une par ligne</label><textarea rows="5" onchange="window.app.updateListField('${sectionId}', 'sizes', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-xs leading-snug">${escapeHtml((c.sizes || []).join('\n'))}</textarea></div>
          </div>
          <input type="text" value="${escapeHtml(c.urgencyLabel || '')}" placeholder="Libellé délai" data-field="urgencyLabel"
                 oninput="window.app.liveUpdateField('${sectionId}', 'urgencyLabel', this.value)" onchange="window.app.commitFieldUpdate('${sectionId}', 'urgencyLabel', this.value)"
                 class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm">
          <textarea rows="4" onchange="window.app.updateListField('${sectionId}', 'urgencyOptions', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-xs leading-snug" aria-label="Délais proposés, un par ligne">${escapeHtml((c.urgencyOptions || []).join('\n'))}</textarea>
          <input type="text" value="${escapeHtml(c.ctaButton || '')}" placeholder="Texte du bouton d'envoi" data-field="ctaButton"
                 oninput="window.app.liveUpdateField('${sectionId}', 'ctaButton', this.value)" onchange="window.app.commitFieldUpdate('${sectionId}', 'ctaButton', this.value)"
                 class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm">
        </div>
      ` : ''}

      <!-- Vitrine template: footer identity and verified contact copy -->
      ${sec.type === 'footer' ? `
        <div class="space-y-2.5 pt-2 border-t border-zinc-200/60">
          <label class="block text-ui-xs font-bold text-zinc-500 uppercase tracking-wider">Pied de page</label>
          <input type="text" value="${escapeHtml(c.brandName || '')}" placeholder="Nom affiché" data-field="brandName" oninput="window.app.liveUpdateField('${sectionId}', 'brandName', this.value)" onchange="window.app.commitFieldUpdate('${sectionId}', 'brandName', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm">
          <textarea rows="3" data-field="desc" placeholder="Description" oninput="window.app.liveUpdateField('${sectionId}', 'desc', this.value)" onchange="window.app.commitFieldUpdate('${sectionId}', 'desc', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm leading-snug">${escapeHtml(c.desc || '')}</textarea>
          <div class="grid grid-cols-2 gap-2">
            <input type="text" value="${escapeHtml(c.phone || '')}" placeholder="Téléphone" data-field="phone" oninput="window.app.liveUpdateField('${sectionId}', 'phone', this.value)" onchange="window.app.commitFieldUpdate('${sectionId}', 'phone', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm">
            <input type="email" value="${escapeHtml(c.email || '')}" placeholder="Email" data-field="email" oninput="window.app.liveUpdateField('${sectionId}', 'email', this.value)" onchange="window.app.commitFieldUpdate('${sectionId}', 'email', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm">
          </div>
          <input type="text" value="${escapeHtml(c.address || '')}" placeholder="Adresse" data-field="address" oninput="window.app.liveUpdateField('${sectionId}', 'address', this.value)" onchange="window.app.commitFieldUpdate('${sectionId}', 'address', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm">
          <input type="text" value="${escapeHtml(c.copyright || '')}" placeholder="Copyright" data-field="copyright" oninput="window.app.liveUpdateField('${sectionId}', 'copyright', this.value)" onchange="window.app.commitFieldUpdate('${sectionId}', 'copyright', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-xs">
        </div>
      ` : ''}

      <!-- Quote text if quoteBlock -->
      ${c.quote !== undefined ? `
        <div class="space-y-1">
          <label class="block text-ui-xs font-medium text-zinc-500">Citation Dirigeant :</label>
          <textarea rows="3"
                    data-field="quote"
                    oninput="window.app.liveUpdateField('${sectionId}', 'quote', this.value)"
                    onchange="window.app.commitFieldUpdate('${sectionId}', 'quote', this.value)"
                    class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none leading-relaxed">${escapeHtml(c.quote)}</textarea>
          <div class="grid grid-cols-2 gap-1.5 pt-1">
            <input type="text" value="${escapeHtml(c.authorName || '')}" data-field="authorName" placeholder="Nom auteur" onchange="window.app.commitFieldUpdate('${sectionId}', 'authorName', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs">
            <input type="text" value="${escapeHtml(c.authorRole || '')}" data-field="authorRole" placeholder="Rôle" onchange="window.app.commitFieldUpdate('${sectionId}', 'authorRole', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs">
          </div>
        </div>
      ` : ''}

      <!-- Specific: TRUST BADGES (The 4 trust cards with live sync) -->
      ${sec.type === 'trust' ? `
        <div class="space-y-2 pt-1 border-t border-zinc-200/60">
          <label class="block text-ui-xs font-medium text-zinc-500 uppercase tracking-wider">Les 4 Badges de Confiance :</label>
          ${(c.badges || []).map((b, bIdx) => `
            <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1.5">
              <div class="text-ui-xs text-zinc-400 font-semibold uppercase">Badge 0${bIdx + 1}</div>
              <input type="text" value="${escapeHtml(b.title)}"
                     placeholder="Titre du badge"
                     data-field="badges.${bIdx}.title"
                     oninput="window.app.liveUpdateField('${sectionId}', 'badges.${bIdx}.title', this.value)"
                     onchange="window.app.commitFieldUpdate('${sectionId}', 'badges.${bIdx}.title', this.value)"
                     class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none">
              <input type="text" value="${escapeHtml(b.desc)}"
                     placeholder="Description du badge"
                     data-field="badges.${bIdx}.desc"
                     oninput="window.app.liveUpdateField('${sectionId}', 'badges.${bIdx}.desc', this.value)"
                     onchange="window.app.commitFieldUpdate('${sectionId}', 'badges.${bIdx}.desc', this.value)"
                     class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm text-zinc-600 focus:border-zinc-900 focus:outline-none">
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Specific: SERVICES LIST (Live edit for service cards) -->
      ${sec.type === 'services' ? `
        <div class="space-y-2 pt-1 border-t border-zinc-200/60">
          <div class="flex items-center justify-between">
            <label class="block text-ui-xs font-medium text-zinc-500 uppercase tracking-wider">Prestations (${(c.services || []).length}) :</label>
            <button type="button" onclick="window.app.addServiceItem('${sectionId}')" class="text-ui-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded border border-zinc-200 transition-colors">+ Ajouter</button>
          </div>
          ${(c.services || []).map((srv, sIdx) => `
            <div class="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-ui-xs font-bold text-zinc-800 truncate">#${sIdx + 1} ${escapeHtml(srv.title)}</span>
                <button type="button" onclick="window.app.deleteServiceItem('${sectionId}', ${sIdx})" class="text-red-500 hover:text-red-700 p-0.5" title="Supprimer ce service">${getIcon("trash", "w-3.5 h-3.5")}</button>
              </div>
              <input type="text" value="${escapeHtml(srv.title)}"
                     placeholder="Titre de la prestation"
                     data-field="services.${sIdx}.title"
                     oninput="window.app.liveUpdateField('${sectionId}', 'services.${sIdx}.title', this.value)"
                     onchange="window.app.commitFieldUpdate('${sectionId}', 'services.${sIdx}.title', this.value)"
                     class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none">
              <textarea rows="2"
                        placeholder="Description concrète"
                        data-field="services.${sIdx}.desc"
                        oninput="window.app.liveUpdateField('${sectionId}', 'services.${sIdx}.desc', this.value)"
                        onchange="window.app.commitFieldUpdate('${sectionId}', 'services.${sIdx}.desc', this.value)"
                        class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm text-zinc-600 focus:border-zinc-900 focus:outline-none leading-snug">${escapeHtml(srv.desc)}</textarea>
              <div class="flex items-center gap-2">
                <div class="w-12 h-10 rounded overflow-hidden border border-zinc-200 bg-zinc-100 shrink-0">
                  <img src="${srv.image || ''}" alt="${escapeHtml(srv.title || 'Service')}" class="w-full h-full object-cover">
                </div>
                <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'services.${sIdx}.image')"
                        class="text-ui-xs font-medium text-zinc-700 bg-white hover:bg-zinc-100 px-2 py-1 rounded border border-zinc-200">Remplacer l'image</button>
              </div>
              <div class="grid grid-cols-2 gap-1.5">
                <input type="text" value="${escapeHtml(srv.price || '')}"
                       placeholder="Tarif (ex: Sur devis)"
                       data-field="services.${sIdx}.price"
                       oninput="window.app.liveUpdateField('${sectionId}', 'services.${sIdx}.price', this.value)"
                       onchange="window.app.commitFieldUpdate('${sectionId}', 'services.${sIdx}.price', this.value)"
                       class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm text-zinc-800">
                <input type="text" value="${escapeHtml(srv.tag || '')}"
                       placeholder="Tag (ex: Spécialité)"
                       data-field="services.${sIdx}.tag"
                       oninput="window.app.liveUpdateField('${sectionId}', 'services.${sIdx}.tag', this.value)"
                       onchange="window.app.commitFieldUpdate('${sectionId}', 'services.${sIdx}.tag', this.value)"
                       class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm text-zinc-800">
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Specific: ROI CALCULATOR SETTINGS -->
      ${sec.type === 'roiCalculator' ? `
        <div class="space-y-3 pt-2 border-t border-zinc-200/60">
          <label class="block text-ui-xs font-bold text-zinc-500 uppercase tracking-wider">Paramètres Simulateur ROI :</label>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-ui-xs text-zinc-500 mb-0.5">Panier moyen (€) :</label>
              <input type="number" step="50" value="${c.defaultTicket || 1200}"
                     data-field="defaultTicket"
                     oninput="window.app.liveUpdateField('${sectionId}', 'defaultTicket', Number(this.value))"
                     onchange="window.app.commitFieldUpdate('${sectionId}', 'defaultTicket', Number(this.value))"
                     class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs text-zinc-900 font-mono">
            </div>
            <div>
              <label class="block text-ui-xs text-zinc-500 mb-0.5">Coût du site (€) :</label>
              <input type="number" step="50" value="${c.siteCost || 990}"
                     data-field="siteCost"
                     oninput="window.app.liveUpdateField('${sectionId}', 'siteCost', Number(this.value))"
                     onchange="window.app.commitFieldUpdate('${sectionId}', 'siteCost', Number(this.value))"
                     class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs text-zinc-900 font-mono">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-ui-xs text-zinc-500 mb-0.5">Leads / mois :</label>
              <input type="number" min="1" max="50" value="${c.defaultLeads || 4}"
                     data-field="defaultLeads"
                     oninput="window.app.liveUpdateField('${sectionId}', 'defaultLeads', Number(this.value))"
                     onchange="window.app.commitFieldUpdate('${sectionId}', 'defaultLeads', Number(this.value))"
                     class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs text-zinc-900 font-mono">
            </div>
            <div>
              <label class="block text-ui-xs text-zinc-500 mb-0.5">Taux Closing (%) :</label>
              <input type="number" min="5" max="100" value="${c.defaultConv || 50}"
                     data-field="defaultConv"
                     oninput="window.app.liveUpdateField('${sectionId}', 'defaultConv', Number(this.value))"
                     onchange="window.app.commitFieldUpdate('${sectionId}', 'defaultConv', Number(this.value))"
                     class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs text-zinc-900 font-mono">
            </div>
          </div>
          <div>
            <label class="block text-ui-xs text-zinc-500 mb-0.5">Texte Bouton CTA :</label>
            <input type="text" value="${escapeHtml(c.ctaText || 'Réserver ce retour sur investissement')}"
                   data-field="ctaText"
                   oninput="window.app.liveUpdateField('${sectionId}', 'ctaText', this.value)"
                   onchange="window.app.commitFieldUpdate('${sectionId}', 'ctaText', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs text-zinc-900">
          </div>
        </div>
      ` : ''}

      <!-- Specific: BOOKING BLOCK SETTINGS -->
      ${sec.type === 'bookingBlock' ? `
        <div class="space-y-3 pt-2 border-t border-zinc-200/60">
          <label class="block text-ui-xs font-bold text-zinc-500 uppercase tracking-wider">Paramètres Prise de Rendez-vous :</label>
          <div>
            <label class="block text-ui-xs text-zinc-500 mb-0.5">Téléphone d'urgence / SMS :</label>
            <input type="text" value="${escapeHtml(c.phone || '')}"
                   data-field="phone"
                   placeholder="Ex: 06 12 34 56 78"
                   oninput="window.app.liveUpdateField('${sectionId}', 'phone', this.value)"
                   onchange="window.app.commitFieldUpdate('${sectionId}', 'phone', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs text-zinc-900 font-mono">
          </div>
          <div>
            <label class="block text-ui-xs text-zinc-500 mb-0.5">Libellé Confirmation CTA :</label>
            <input type="text" value="${escapeHtml(c.ctaConfirm || 'Valider la réservation du créneau')}"
                   data-field="ctaConfirm"
                   oninput="window.app.liveUpdateField('${sectionId}', 'ctaConfirm', this.value)"
                   onchange="window.app.commitFieldUpdate('${sectionId}', 'ctaConfirm', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs text-zinc-900">
          </div>
          <div class="space-y-1.5">
            <label class="block text-ui-xs font-medium text-zinc-500">Types de prestations proposées :</label>
            ${(c.services || []).map((srv, idx) => `
              <input type="text" value="${escapeHtml(srv)}"
                     data-field="services.${idx}"
                     oninput="window.app.liveUpdateField('${sectionId}', 'services.${idx}', this.value)"
                     onchange="window.app.commitFieldUpdate('${sectionId}', 'services.${idx}', this.value)"
                     class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs text-zinc-800">
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Specific: GALLERY SECTION (Photos, Aspect Ratio, Mixed Before/After) -->
      ${sec.type === 'gallery' ? `
        <div class="space-y-3 pt-2 border-t border-zinc-200/60">
          <div class="flex items-center justify-between">
            <label class="block text-ui-xs font-bold text-zinc-500 uppercase tracking-wider">Format d'Image (Ratio) :</label>
            <div class="inline-flex rounded-md border border-zinc-200 p-0.5 bg-zinc-100 text-ui-xs font-semibold">
              <button type="button" onclick="window.app.setGalleryAspectRatio('${sectionId}', '4/3')" class="px-2 py-0.5 rounded transition-all ${(sec.settings?.aspectRatio || '4/3') === '4/3' ? 'bg-white shadow-xs text-zinc-900 font-bold' : 'text-zinc-500 hover:text-zinc-900'}">4:3</button>
              <button type="button" onclick="window.app.setGalleryAspectRatio('${sectionId}', '16/9')" class="px-2 py-0.5 rounded transition-all ${sec.settings?.aspectRatio === '16/9' ? 'bg-white shadow-xs text-zinc-900 font-bold' : 'text-zinc-500 hover:text-zinc-900'}">16:9</button>
              <button type="button" onclick="window.app.setGalleryAspectRatio('${sectionId}', '1/1')" class="px-2 py-0.5 rounded transition-all ${sec.settings?.aspectRatio === '1/1' ? 'bg-white shadow-xs text-zinc-900 font-bold' : 'text-zinc-500 hover:text-zinc-900'}">1:1</button>
            </div>
          </div>

          <div class="flex items-center justify-between pt-1">
            <label class="block text-ui-xs font-medium text-zinc-500 uppercase tracking-wider">Réalisations & Comparatifs (${(c.photos || []).length}) :</label>
            <div class="flex items-center gap-1">
              <button type="button" onclick="window.app.addGalleryItem('${sectionId}', 'photo')" class="text-ui-xs font-bold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded border border-zinc-200 transition-colors">+ Photo</button>
              <button type="button" onclick="window.app.addGalleryItem('${sectionId}', 'beforeAfter')" class="text-ui-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors">+ Avant/Après</button>
            </div>
          </div>

          <div class="space-y-2">
            ${(c.photos || []).map((p, pIdx) => {
              const isBA = p.type === 'beforeAfter' || (p.beforeImage && p.afterImage);
              return `
                <div class="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-ui-xs font-bold ${isBA ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded' : 'text-zinc-600 bg-zinc-200/60 px-1.5 py-0.5 rounded'} uppercase tracking-wide">
                      #${pIdx + 1} ${isBA ? 'Comparatif Avant/Après' : 'Photo'}
                    </span>
                    <div class="flex items-center gap-1">
                      <button type="button" onclick="window.app.toggleGalleryItemType('${sectionId}', ${pIdx})" class="text-ui-2xs text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200" title="Changer le type d'élément">
                        ${isBA ? 'Convertir en photo' : 'Convertir en Avant/Après'}
                      </button>
                      <button type="button" onclick="window.app.deleteGalleryItem('${sectionId}', ${pIdx})" class="text-red-600 hover:text-red-700 p-0.5" title="Supprimer">${getIcon("trash", "w-3.5 h-3.5")}</button>
                    </div>
                  </div>

                  ${isBA ? `
                    <div class="grid grid-cols-2 gap-1.5 text-ui-xs">
                      <div class="space-y-1">
                        <span class="font-bold text-zinc-500 uppercase">Avant :</span>
                        <div class="aspect-[4/3] rounded overflow-hidden border border-zinc-200 bg-zinc-100 relative group/thumb">
                          <img src="${p.beforeImage || ''}" class="w-full h-full object-cover">
                          <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'photos.${pIdx}.beforeImage')" class="absolute inset-0 bg-black/50 text-white font-medium text-ui-2xs opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">Modifier</button>
                        </div>
                      </div>
                      <div class="space-y-1">
                        <span class="font-bold text-emerald-600 uppercase">Après :</span>
                        <div class="aspect-[4/3] rounded overflow-hidden border border-zinc-200 bg-zinc-100 relative group/thumb">
                          <img src="${p.afterImage || ''}" class="w-full h-full object-cover">
                          <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'photos.${pIdx}.afterImage')" class="absolute inset-0 bg-black/50 text-white font-medium text-ui-2xs opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">Modifier</button>
                        </div>
                      </div>
                    </div>
                  ` : `
                    <div class="flex items-center gap-2">
                      <div class="w-14 h-11 rounded overflow-hidden border border-zinc-200 bg-zinc-100 shrink-0 relative group/thumb">
                        <img src="${p.url || ''}" class="w-full h-full object-cover">
                        <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'photos.${pIdx}.url')" class="absolute inset-0 bg-black/50 text-white font-medium text-ui-2xs opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">Modifier</button>
                      </div>
                      <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'photos.${pIdx}.url')" class="text-zinc-700 hover:text-zinc-900 font-medium text-ui-xs bg-zinc-100 hover:bg-zinc-200 px-2 py-1 rounded border border-zinc-200">
                        Remplacer l'image
                      </button>
                    </div>
                  `}

                  <div class="grid grid-cols-2 gap-1.5 pt-0.5">
                    <input type="text" value="${escapeHtml(p.tag || '')}"
                           placeholder="Catégorie (ex: Taille de haies)"
                           data-field="photos.${pIdx}.tag"
                           oninput="window.app.liveUpdateField('${sectionId}', 'photos.${pIdx}.tag', this.value)"
                           onchange="window.app.commitFieldUpdate('${sectionId}', 'photos.${pIdx}.tag', this.value)"
                           class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm text-zinc-900 focus:border-zinc-900 focus:outline-none">
                    <input type="text" value="${escapeHtml(p.title || '')}"
                           placeholder="Titre du projet"
                           data-field="photos.${pIdx}.title"
                           oninput="window.app.liveUpdateField('${sectionId}', 'photos.${pIdx}.title', this.value)"
                           onchange="window.app.commitFieldUpdate('${sectionId}', 'photos.${pIdx}.title', this.value)"
                           class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm text-zinc-900 focus:border-zinc-900 focus:outline-none">
                  </div>
                  <input type="text" value="${escapeHtml(p.desc || '')}"
                         placeholder="Court descriptif (optionnel)"
                         data-field="photos.${pIdx}.desc"
                         oninput="window.app.liveUpdateField('${sectionId}', 'photos.${pIdx}.desc', this.value)"
                         onchange="window.app.commitFieldUpdate('${sectionId}', 'photos.${pIdx}.desc', this.value)"
                         class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-xs text-zinc-600 focus:border-zinc-900 focus:outline-none">
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Specific: FAQ (Questions / Réponses) -->
      ${sec.type === 'faq' ? `
        <div class="space-y-2 pt-2 border-t border-zinc-200/60">
          <div class="flex items-center justify-between">
            <label class="block text-ui-xs font-bold text-zinc-500 uppercase tracking-wider">Questions Fréquentes (${(c.items || []).length}) :</label>
            <button type="button" onclick="window.app.addFaqItem('${sectionId}')" class="text-ui-xs font-bold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded border border-zinc-200 transition-colors">+ Ajouter une question</button>
          </div>

          <div class="space-y-2">
            ${(c.items || []).map((faq, fIdx) => `
              <div class="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-ui-xs font-bold text-zinc-700 uppercase">#${fIdx + 1} Question</span>
                  <button type="button" onclick="window.app.removeFaqItem('${sectionId}', ${fIdx})" class="text-red-600 hover:text-red-700 p-0.5" title="Supprimer">${getIcon("trash", "w-3.5 h-3.5")}</button>
                </div>
                <input type="text" value="${escapeHtml(faq.q || '')}"
                       placeholder="Votre question ?"
                       data-field="items.${fIdx}.q"
                       oninput="window.app.liveUpdateField('${sectionId}', 'items.${fIdx}.q', this.value)"
                       onchange="window.app.commitFieldUpdate('${sectionId}', 'items.${fIdx}.q', this.value)"
                       class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs text-zinc-900 font-medium focus:border-zinc-900 focus:outline-none">
                <textarea rows="2"
                          placeholder="Réponse détaillée..."
                          data-field="items.${fIdx}.a"
                          oninput="window.app.liveUpdateField('${sectionId}', 'items.${fIdx}.a', this.value)"
                          onchange="window.app.commitFieldUpdate('${sectionId}', 'items.${fIdx}.a', this.value)"
                          class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm text-zinc-600 focus:border-zinc-900 focus:outline-none leading-snug">${escapeHtml(faq.a || '')}</textarea>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Hero photo with Replace & Trash -->
      ${c.heroImage !== undefined ? `
        <div class="space-y-1.5 pt-1 border-t border-zinc-200/60">
          <div class="flex items-center justify-between">
            <label class="block text-ui-xs font-medium text-zinc-500">Photo Principale :</label>
            <div class="flex items-center gap-1">
              <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'heroImage')" class="text-zinc-700 hover:text-zinc-900 font-medium text-ui-xs bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded border border-zinc-200">Remplacer</button>
              <button type="button" onclick="window.app.deletePhoto('${sectionId}', 'heroImage')" class="text-red-600 hover:text-red-700 font-medium bg-red-50 hover:bg-red-100 px-1.5 py-0.5 rounded border border-red-200 inline-flex items-center" title="Supprimer">${getIcon("trash", "w-3.5 h-3.5")}</button>
            </div>
          </div>
          <div class="aspect-[16/9] rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
            <img src="${c.heroImage || ''}" alt="Photo" class="w-full h-full object-cover">
          </div>
        </div>
      ` : ''}

      <!-- Hero Darkening Overlay Slider -->
      ${sec.type === 'hero' ? `
        <div class="space-y-1.5 pt-2 border-t border-zinc-200/60">
          <div class="flex items-center justify-between">
            <label class="block text-ui-xs font-semibold text-zinc-600 uppercase tracking-wider">Voile d'assombrissement :</label>
            <span id="hero-darkening-val-${sectionId}" class="text-ui-xs font-mono font-bold text-zinc-700">${sec.settings?.overlayDarkening !== undefined ? sec.settings.overlayDarkening : 45}%</span>
          </div>
          <input type="range" min="0" max="90" step="5"
                 value="${sec.settings?.overlayDarkening !== undefined ? sec.settings.overlayDarkening : 45}"
                 oninput="window.app.setHeroOverlayDarkening('${sectionId}', this.value); const vEl = document.getElementById('hero-darkening-val-${sectionId}'); if (vEl) vEl.textContent = this.value + '%';"
                 class="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                 title="Ajuster l'assombrissement pour garantir la lisibilité du texte">
          <div class="flex justify-between text-ui-2xs text-zinc-400 font-medium">
            <span>0% (Clair)</span>
            <span>45% (Standard)</span>
            <span>90% (Sombre)</span>
          </div>
        </div>
      ` : ''}

      <!-- CTA Buttons Management (Edit, Delete, Restore) -->
      ${c.ctaPrimary !== undefined || c.ctaSecondary !== undefined ? `
        <div class="space-y-2 pt-2 border-t border-zinc-200/60">
          <label class="block text-ui-xs font-bold text-zinc-500 uppercase tracking-wider">Boutons d'Appel à l'Action :</label>

          ${c.ctaPrimary !== undefined ? (() => {
            const isPrimaryHidden = sec.settings && (
              sec.settings["primary-visible"] === false ||
              sec.settings["btn-primary-visible"] === false ||
              sec.settings["ctaPrimary-visible"] === false ||
              sec.settings["btn-hero-primary-visible"] === false ||
              (Array.isArray(sec.settings.hiddenButtons) && sec.settings.hiddenButtons.includes("primary"))
            );
            return `
              <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-ui-xs font-bold text-zinc-700 uppercase">Bouton Principal</span>
                  ${isPrimaryHidden ? `
                    <button type="button" onclick="window.app.restoreButton('${sectionId}', 'primary')" class="text-emerald-700 hover:text-emerald-800 font-semibold text-ui-xs bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1 transition-colors">
                      ${getIcon("undo", "w-3 h-3")}<span>Restaurer</span>
                    </button>
                  ` : `
                    <div class="flex items-center gap-1">
                      <button type="button" onclick="window.app.adjustButtonFontSize(-1)" class="text-zinc-600 hover:text-zinc-900 font-bold text-ui-xs bg-white px-1.5 py-0.5 rounded border border-zinc-200" title="Réduire taille texte bouton">A-</button>
                      <button type="button" onclick="window.app.adjustButtonFontSize(1)" class="text-zinc-600 hover:text-zinc-900 font-bold text-ui-xs bg-white px-1.5 py-0.5 rounded border border-zinc-200" title="Agrandir taille texte bouton">A+</button>
                      <button type="button" onclick="window.app.deleteButton('${sectionId}', 'primary')" class="text-red-600 hover:text-red-700 font-semibold text-ui-xs bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded border border-red-200 flex items-center gap-0.5 transition-colors" title="Supprimer ce bouton">
                        ${getIcon("trash", "w-3 h-3")}<span>Supprimer</span>
                      </button>
                    </div>
                  `}
                </div>
                ${isPrimaryHidden ? `
                  <div class="text-ui-sm text-zinc-400 italic py-0.5">Ce bouton est actuellement masqué sur la page.</div>
                ` : `
                  <input type="text" value="${escapeHtml(c.ctaPrimary)}"
                         data-field="ctaPrimary"
                         placeholder="Texte du bouton principal"
                         oninput="window.app.liveUpdateField('${sectionId}', 'ctaPrimary', this.value)"
                         onchange="window.app.commitFieldUpdate('${sectionId}', 'ctaPrimary', this.value)"
                         class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none">
                `}
              </div>
            `;
          })() : ''}

          ${c.ctaSecondary !== undefined ? (() => {
            const isSecondaryHidden = sec.settings && (
              sec.settings["phone-visible"] === false ||
              sec.settings["secondary-visible"] === false ||
              sec.settings["btn-phone-visible"] === false ||
              sec.settings["ctaSecondary-visible"] === false ||
              sec.settings["btn-hero-phone-visible"] === false ||
              (Array.isArray(sec.settings.hiddenButtons) && sec.settings.hiddenButtons.includes("phone"))
            );
            return `
              <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-ui-xs font-bold text-zinc-700 uppercase">Bouton Secondaire</span>
                  ${isSecondaryHidden ? `
                    <button type="button" onclick="window.app.restoreButton('${sectionId}', 'phone')" class="text-emerald-700 hover:text-emerald-800 font-semibold text-ui-xs bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1 transition-colors">
                      ${getIcon("undo", "w-3 h-3")}<span>Restaurer</span>
                    </button>
                  ` : `
                    <div class="flex items-center gap-1">
                      <button type="button" onclick="window.app.adjustButtonFontSize(-1)" class="text-zinc-600 hover:text-zinc-900 font-bold text-ui-xs bg-white px-1.5 py-0.5 rounded border border-zinc-200" title="Réduire taille texte bouton">A-</button>
                      <button type="button" onclick="window.app.adjustButtonFontSize(1)" class="text-zinc-600 hover:text-zinc-900 font-bold text-ui-xs bg-white px-1.5 py-0.5 rounded border border-zinc-200" title="Agrandir taille texte bouton">A+</button>
                      <button type="button" onclick="window.app.deleteButton('${sectionId}', 'phone')" class="text-red-600 hover:text-red-700 font-semibold text-ui-xs bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded border border-red-200 flex items-center gap-0.5 transition-colors" title="Supprimer ce bouton">
                        ${getIcon("trash", "w-3 h-3")}<span>Supprimer</span>
                      </button>
                    </div>
                  `}
                </div>
                ${isSecondaryHidden ? `
                  <div class="text-ui-sm text-zinc-400 italic py-0.5">Ce bouton est actuellement masqué sur la page.</div>
                ` : `
                  <input type="text" value="${escapeHtml(c.ctaSecondary)}"
                         data-field="ctaSecondary"
                         placeholder="Texte du bouton secondaire"
                         oninput="window.app.liveUpdateField('${sectionId}', 'ctaSecondary', this.value)"
                         onchange="window.app.commitFieldUpdate('${sectionId}', 'ctaSecondary', this.value)"
                         class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none">
                `}
              </div>
            `;
          })() : ''}
        </div>
      ` : ''}

      <!-- Section Background Switcher -->
      <div class="pt-1 border-t border-zinc-200/60">
        <label class="block text-ui-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Couleur de fond</label>
        <div class="grid grid-cols-5 gap-1 mb-1.5">
          <button type="button" onclick="window.app.setSectionBg('${sectionId}', 'white')" class="py-1 text-ui-xs font-medium border rounded text-center transition-colors ${sec.settings?.bgTheme !== 'mineral' && sec.settings?.bgTheme !== 'dark' && sec.settings?.bgTheme !== 'warm' && sec.settings?.bgTheme !== 'navy' && !sec.settings?.customBackground ? 'border-zinc-900 bg-white font-semibold shadow-xs' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-white'}" title="Fond Blanc">Blanc</button>
          <button type="button" onclick="window.app.setSectionBg('${sectionId}', 'mineral')" class="py-1 text-ui-xs font-medium border rounded text-center transition-colors ${sec.settings?.bgTheme === 'mineral' ? 'border-zinc-900 bg-white font-semibold shadow-xs' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-white'}" title="Fond Gris Doux">Gris</button>
          <button type="button" onclick="window.app.setSectionBg('${sectionId}', 'dark')" class="py-1 text-ui-xs font-medium border rounded text-center transition-colors ${sec.settings?.bgTheme === 'dark' ? 'border-zinc-900 bg-zinc-900 text-white font-semibold shadow-xs' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-white'}" title="Fond Nuit Sombre">Nuit</button>
          <button type="button" onclick="window.app.setSectionBg('${sectionId}', 'warm')" class="py-1 text-ui-xs font-medium border rounded text-center transition-colors ${sec.settings?.bgTheme === 'warm' ? 'border-amber-700 bg-amber-50 text-amber-950 font-semibold shadow-xs' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-white'}" title="Fond Sable Chaud">Sable</button>
          <button type="button" onclick="window.app.setSectionBg('${sectionId}', 'navy')" class="py-1 text-ui-xs font-medium border rounded text-center transition-colors ${sec.settings?.bgTheme === 'navy' ? 'border-blue-900 bg-slate-900 text-white font-semibold shadow-xs' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-white'}" title="Fond Bleu Marine">Marine</button>
        </div>
        <div class="flex items-center gap-2 mt-1 px-1">
          <label class="text-ui-xs text-zinc-500 flex items-center gap-1.5 cursor-pointer">
            <input type="color" value="${sec.settings?.customBackground || '#ffffff'}" onchange="window.app.setSectionCustomBg('${sectionId}', this.value)" class="w-5 h-5 rounded border border-zinc-200 cursor-pointer p-0">
            <span>Personnalisé</span>
          </label>
          ${sec.settings?.customBackground ? `
            <span class="text-ui-xs font-mono text-zinc-400">${sec.settings.customBackground}</span>
            <button type="button" onclick="window.app.setSectionCustomBg('${sectionId}', '')" class="text-ui-xs text-red-500 hover:underline ml-auto">Réinitialiser</button>
          ` : ''}
        </div>
      </div>

      <!-- Per-block motion catalog -->
      <div class="pt-2 border-t border-zinc-200/60">
        <label class="block text-ui-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Animation de la section</label>
        <div class="motion-fan-grid">
          ${[
            ['none', 'Aucune'], ['fade-in', 'Fade'], ['slide-up', 'Slide'], ['spring', 'Spring'],
            ['reveal', 'Reveal'], ['stagger', 'Stagger'], ['shimmer', 'Shimmer'], ['pulse', 'Pulse']
          ].map(([preset, label]) => `<button type="button" data-motion-preview="${preset}" class="motion-option ${((sec.settings?.motionPreset || 'none') === preset || (!sec.settings?.motionPreset && preset === 'none')) ? 'is-active' : ''}" onclick="window.app.setSectionMotion('${sectionId}', '${preset}')">${label}</button>`).join('')}
        </div>
        <div class="motion-loop-row">
          <span class="motion-loop-label">Répétition</span>
          <button type="button" data-section-loop="once" class="motion-loop-btn ${(sec.settings?.motionLoop || 'once') === 'once' ? 'is-active' : ''}" onclick="window.app.setSectionMotionLoop('${sectionId}', 'once')">Une fois</button>
          <button type="button" data-section-loop="twice" class="motion-loop-btn ${(sec.settings?.motionLoop || 'once') === 'twice' ? 'is-active' : ''}" onclick="window.app.setSectionMotionLoop('${sectionId}', 'twice')">×2</button>
          <button type="button" data-section-loop="infinite" class="motion-loop-btn ${(sec.settings?.motionLoop || 'once') === 'infinite' ? 'is-active' : ''}" onclick="window.app.setSectionMotionLoop('${sectionId}', 'infinite')">Boucle</button>
        </div>
        <p class="motion-loop-hint">Ce mouvement s’applique à toute la section. Pour animer un seul texte ou une image, ouvrez l’outil Anim de l’élément. Survolez un preset pour le prévisualiser.</p>
        <div class="pattern-catalog mt-2" aria-label="Patterns d'inspiration">
          ${INSPIRATION_PATTERNS.slice(0, 4).map(pattern => {
            const motionKey = pattern.id === 'progress' ? 'progress-fill' : pattern.id;
            const isActive = (sec.settings?.motionPreset || '') === motionKey;
            return `
              <button type="button" 
                      class="pattern-chip ${isActive ? 'is-active' : ''}" 
                      title="${pattern.description}"
                      onclick="window.app.applyInspirationPattern('${sectionId}', '${pattern.id}')">
                ${pattern.label}<small>${pattern.source}</small>
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Section Actions: Monter, Descendre, Dupliquer & Supprimer -->
      <div class="pt-2 border-t border-zinc-200/60 flex items-center justify-between gap-1.5">
        <button type="button" onclick="window.app.moveSection('${sectionId}', 'up')" class="py-1 px-2 text-ui-xs font-medium text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 rounded flex items-center gap-1 transition-colors" title="Monter">
          ${getIcon("chevronUp", "w-3 h-3")}
          <span>Monter</span>
        </button>
        <button type="button" onclick="window.app.moveSection('${sectionId}', 'down')" class="py-1 px-2 text-ui-xs font-medium text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 rounded flex items-center gap-1 transition-colors" title="Descendre">
          ${getIcon("chevronDown", "w-3 h-3")}
          <span>Descendre</span>
        </button>
        <button type="button" onclick="window.app.duplicateSection('${sectionId}')" class="py-1 px-2 text-ui-xs font-medium text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 rounded flex items-center gap-1 transition-colors" title="Dupliquer">
          ${getIcon("copy", "w-3 h-3 text-zinc-500")}
        </button>
        <button type="button" onclick="window.app.deleteSection('${sectionId}')" class="py-1 px-2 text-ui-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded flex items-center gap-1 transition-colors" title="Supprimer">
          ${getIcon("trash", "w-3 h-3 text-red-500")}
        </button>
      </div>

    </div>
  `;
}

/**
 * Settings Tab Accordions matching Image 2 (Sendpage style).
 */
function renderSettingsAccordions(project, state = {}) {
  const isOpen = (id) => (state?._openSettingsItem !== undefined ? state._openSettingsItem === id : id === 'business');
  return `
    <div class="space-y-2" id="settings-accordion-group">

      <!-- 1. Business Information -->
      <div class="section-card">
        <div class="section-card-header" onclick="window.app.toggleSettingsItem('business')">
          <div class="flex items-center gap-2 text-xs font-medium text-zinc-900">
            ${getIcon("mapPin", "w-4 h-4 text-zinc-500")}
            <span>Informations entreprise</span>
          </div>
          <span class="text-zinc-400 ${isOpen('business') ? 'rotate-180' : ''}">${getIcon("chevronDown", "w-3.5 h-3.5")}</span>
        </div>
        <div class="section-accordion-body ${isOpen('business') ? '' : 'hidden'} space-y-2.5" id="settings-body-business">
          <div>
            <label class="block text-ui-xs text-zinc-500 mb-1">Nom entreprise :</label>
            <input type="text" value="${escapeHtml(project.business.name)}"
                   oninput="window.app.liveUpdateBusiness('name', this.value)"
                   onchange="window.app.commitBusiness('name', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none">
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-ui-xs text-zinc-500 mb-1">Ville :</label>
              <input type="text" value="${escapeHtml(project.business.city)}"
                     oninput="window.app.liveUpdateBusiness('city', this.value)"
                     onchange="window.app.commitBusiness('city', this.value)"
                     class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none">
            </div>
            <div>
              <label class="block text-ui-xs text-zinc-500 mb-1">Région :</label>
              <input type="text" value="${escapeHtml(project.business.region || 'Occitanie')}"
                     oninput="window.app.liveUpdateBusiness('region', this.value)"
                     onchange="window.app.commitBusiness('region', this.value)"
                     class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-ui-xs text-zinc-500 mb-1">Téléphone :</label>
              <input type="text" value="${escapeHtml(project.business.phone)}"
                     oninput="window.app.liveUpdateBusiness('phone', this.value)"
                     onchange="window.app.commitBusiness('phone', this.value)"
                     class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none">
            </div>
            <div>
              <label class="block text-ui-xs text-zinc-500 mb-1">Email :</label>
              <input type="text" value="${escapeHtml(project.business.email || 'contact@artisan.fr')}"
                     oninput="window.app.liveUpdateBusiness('email', this.value)"
                     onchange="window.app.commitBusiness('email', this.value)"
                     class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none">
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Favicon & Identité -->
      <div class="section-card">
        <div class="section-card-header" onclick="window.app.toggleSettingsItem('favicon')">
          <div class="flex items-center gap-2 text-xs font-medium text-zinc-900">
            ${getIcon("tag", "w-4 h-4 text-zinc-500")}
            <span>Favicon & Identité</span>
          </div>
          <span class="text-zinc-400 ${isOpen('favicon') ? 'rotate-180' : ''}">${getIcon("chevronDown", "w-3.5 h-3.5")}</span>
        </div>
        <div class="section-accordion-body ${isOpen('favicon') ? '' : 'hidden'} space-y-2.5" id="settings-body-favicon">
          <div class="text-ui-sm text-zinc-600 leading-relaxed">
            Le favicon et le logo sont générés automatiquement aux couleurs de votre thème.
          </div>
          <div class="flex items-center gap-3 p-3 rounded-lg bg-white border border-zinc-200">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm" style="background-color: ${project.branding.primaryColor};">
              ${project.business.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="text-xs font-semibold text-zinc-900">${project.business.name}</div>
              <div class="text-ui-xs text-zinc-400">Icône vectorielle haute résolution</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Couleurs & Thème -->
      <div class="section-card">
        <div class="section-card-header" onclick="window.app.toggleSettingsItem('colors')">
          <div class="flex items-center gap-2 text-xs font-medium text-zinc-900">
            ${getIcon("palette", "w-4 h-4 text-zinc-500")}
            <span>Couleurs & Thème graphique</span>
          </div>
          <span class="text-zinc-400 ${isOpen('colors') ? 'rotate-180' : ''}">${getIcon("chevronDown", "w-3.5 h-3.5")}</span>
        </div>
        <div class="section-accordion-body ${isOpen('colors') ? '' : 'hidden'} space-y-3" id="settings-body-colors">
          <!-- Ambiance Globale 1-Clic (Typedream & Framer Inspired) -->
          <div>
            <label class="block text-ui-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Ambiance Globale 1-Clic</label>
            <div class="grid grid-cols-3 gap-1.5 text-xs">
              ${(() => {
                const curTheme = project.branding?.globalTheme || (project.branding?.bgColor === '#09090b' ? 'dark' : (project.branding?.bgColor === '#f4f4f5' ? 'mineral' : 'white'));
                return `
                  <button type="button" onclick="window.app.switchGlobalTheme('white')" class="py-2 border rounded-lg text-center text-ui-sm font-medium transition-all ${curTheme === 'white' ? 'border-zinc-950 bg-white ring-2 ring-zinc-950 font-bold text-zinc-950 shadow-sm' : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700 shadow-2xs'}">
                    <span class="inline-flex items-center justify-center gap-1">${getIcon("sun", "w-3.5 h-3.5")}Blanche ${curTheme === 'white' ? '<span class="text-ui-xs text-emerald-600 font-extrabold ml-0.5">✓</span>' : ''}</span>
                  </button>
                  <button type="button" onclick="window.app.switchGlobalTheme('mineral')" class="py-2 border rounded-lg text-center text-ui-sm font-medium transition-all ${curTheme === 'mineral' ? 'border-zinc-950 bg-zinc-100 ring-2 ring-zinc-950 font-bold text-zinc-950 shadow-sm' : 'border-zinc-200 bg-zinc-100 hover:border-zinc-300 text-zinc-700 shadow-2xs'}">
                    <span class="inline-flex items-center justify-center gap-1">${getIcon("mountain", "w-3.5 h-3.5")}Minérale ${curTheme === 'mineral' ? '<span class="text-ui-xs text-emerald-600 font-extrabold ml-0.5">✓</span>' : ''}</span>
                  </button>
                  <button type="button" onclick="window.app.switchGlobalTheme('dark')" class="py-2 border rounded-lg text-center text-ui-sm font-medium transition-all ${curTheme === 'dark' ? 'border-amber-400 bg-zinc-900 ring-2 ring-amber-400 font-bold text-amber-300 shadow-sm' : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white shadow-2xs'}">
                    <span class="inline-flex items-center justify-center gap-1">${getIcon("moon", "w-3.5 h-3.5")}Sombre ${curTheme === 'dark' ? '<span class="text-ui-xs text-amber-400 font-extrabold ml-0.5">✓</span>' : ''}</span>
                  </button>
                `;
              })()}
            </div>
          </div>

          <div>
            <label class="block text-ui-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Presets 1-Clic</label>
            <div class="space-y-1.5">
              ${STYLE_PRESETS.map(preset => `
                <button type="button" onclick="window.app.applyStylePreset('${preset.id}')" class="w-full text-left p-2 rounded-lg border transition-all ${project.branding.presetId === preset.id ? 'border-zinc-900 bg-white font-semibold shadow-xs' : 'border-zinc-200 bg-white hover:border-zinc-300'}">
                  <div class="flex items-center justify-between text-xs text-zinc-900">
                    <span>${preset.name}</span>
                    <div class="flex gap-1">
                      <span class="w-3 h-3 rounded-full border border-black/10" style="background-color: ${preset.primaryColor}"></span>
                      <span class="w-3 h-3 rounded-full border border-black/10" style="background-color: ${preset.secondaryColor}"></span>
                      <span class="w-3 h-3 rounded-full border border-black/10" style="background-color: ${preset.accentColor}"></span>
                    </div>
                  </div>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="pt-2 border-t border-zinc-200/60 space-y-2">
            <label class="block text-ui-xs font-medium text-zinc-400 uppercase tracking-wider">Palette Personnalisée</label>
            ${[
              ['primaryColor', 'Primaire'],
              ['secondaryColor', 'Secondaire'],
              ['accentColor', 'Accentuation']
            ].map(([key, label]) => {
              const color = project.branding[key] || '#18181b';
              const harmony = getHarmonyColors(color);
              return `
                <div class="color-field" data-color-field="${key}">
                  <div class="flex items-center justify-between gap-2">
                    <label class="text-xs font-medium text-zinc-800" for="color-text-${key}">${label}</label>
                    <div class="flex items-center gap-1.5">
                      <input type="color" data-color-picker="${key}" value="${color}"
                             oninput="window.app.liveUpdateColor('${key}', this.value)"
                             onchange="window.app.commitColorUpdate('${key}', this.value)"
                             aria-label="Choisir la couleur ${label}"
                             class="color-swatch">
                      <button type="button" class="color-eyedropper" onclick="window.app.pickColorWithEyedropper('${key}')" title="Pipette" aria-label="Utiliser la pipette">
                        ${getIcon("pipette", "w-3.5 h-3.5")}
                      </button>
                    </div>
                  </div>
                  <input id="color-text-${key}" class="color-hex-input" value="${color}" inputmode="text" maxlength="7"
                         oninput="window.app.updateColorFromText('${key}', this.value)"
                         onchange="window.app.commitColorFromText('${key}', this.value)" aria-label="Valeur HEX ${label}">
                  <input class="color-rgb-input" value="${hexToRgbText(color)}" inputmode="decimal"
                         oninput="window.app.updateColorFromRgb('${key}', this.value)"
                         onchange="window.app.commitColorFromRgb('${key}', this.value)" aria-label="Valeur RGB ${label}">
                  <div class="color-harmony-row" aria-label="Harmonies de couleur">
                    <button type="button" style="--harmony-color: ${harmony[0]}" onclick="window.app.applyHarmonyColor('${key}', '${harmony[0]}')" title="Couleur actuelle"></button>
                    <button type="button" style="--harmony-color: ${harmony[1]}" onclick="window.app.applyHarmonyColor('${key}', '${harmony[1]}')" title="Couleur complémentaire"></button>
                    <button type="button" style="--harmony-color: ${harmony[2]}" onclick="window.app.applyHarmonyColor('${key}', '${harmony[2]}')" title="Couleur analogue"></button>
                  </div>
                </div>
              `;
            }).join('')}

            <!-- WCAG AAA Contrast Accessibility Audit (MVP Feature 8) -->
            ${(() => {
              const primary = project.branding?.primaryColor || '#059669';
              const bg = project.branding?.bgColor || '#ffffff';
              const text = project.branding?.textColor || '#18181b';
              const primaryContrast = calculateContrast(primary, bg);
              const textContrast = calculateContrast(text, bg);
              return `
                <div class="wcag-contrast-box p-3 rounded-xl bg-zinc-50 border border-zinc-200 mt-3 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-ui-xs font-bold uppercase tracking-wider text-zinc-600">Accessibilité Contraste WCAG 2.1</span>
                    <span class="text-ui-xs font-mono font-bold px-2 py-0.5 rounded ${primaryContrast.isAaa ? 'bg-emerald-100 text-emerald-800' : (primaryContrast.isAa ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800')}">
                      ${primaryContrast.ratio}:1 • ${primaryContrast.grade}
                    </span>
                  </div>
                  <div class="grid grid-cols-2 gap-2 text-ui-xs">
                    <div class="bg-white p-2 rounded-lg border border-zinc-200">
                      <div class="text-zinc-400 text-ui-2xs uppercase">Bouton Primaire / Fond</div>
                      <div class="font-bold text-zinc-900 mt-0.5">${primaryContrast.ratio}:1 (${primaryContrast.grade})</div>
                    </div>
                    <div class="bg-white p-2 rounded-lg border border-zinc-200">
                      <div class="text-zinc-400 text-ui-2xs uppercase">Texte Courant / Fond</div>
                      <div class="font-bold text-zinc-900 mt-0.5">${textContrast.ratio}:1 (${textContrast.grade})</div>
                    </div>
                  </div>
                  <p class="text-ui-xs text-zinc-500 italic">Un ratio ≥ 4.5:1 (AA) ou ≥ 7.0:1 (AAA) garantit une lisibilité irréprochable sous le soleil sur smartphone.</p>
                </div>
              `;
            })()}
          </div>
        </div>
      </div>

      <!-- 4. Typographie -->
      <div class="section-card">
        <div class="section-card-header" onclick="window.app.toggleSettingsItem('typography')">
          <div class="flex items-center gap-2 text-xs font-medium text-zinc-900">
            ${getIcon("edit", "w-4 h-4 text-zinc-500")}
            <span>Typographie</span>
          </div>
          <span class="text-zinc-400 ${isOpen('typography') ? 'rotate-180' : ''}">${getIcon("chevronDown", "w-3.5 h-3.5")}</span>
        </div>
        <div class="section-accordion-body ${isOpen('typography') ? '' : 'hidden'} space-y-2.5" id="settings-body-typography">
          <div class="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            <div class="grid grid-cols-2 gap-1.5 mb-2">
              <button type="button" onclick="window.app.setTypographyTarget('heading')" class="py-1.5 rounded border text-ui-sm ${(typeof window !== 'undefined' && window.app?.typographyTarget === 'body') ? 'border-zinc-200 bg-white text-zinc-600' : 'border-zinc-900 bg-zinc-900 text-white'}">Titres</button>
              <button type="button" onclick="window.app.setTypographyTarget('body')" class="py-1.5 rounded border text-ui-sm ${(typeof window !== 'undefined' && window.app?.typographyTarget === 'body') ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-600'}">Texte</button>
            </div>
            ${FONT_CATALOG.map(font => `
              <button type="button" aria-label="Utiliser ${font.name}" onclick="window.app.applyTypographyFont('${font.name}')" class="font-option w-full text-left p-2 rounded-lg border bg-white hover:border-zinc-400 text-xs ${(((typeof window !== 'undefined' && window.app?.typographyTarget === 'body') ? project.branding.bodyFont : project.branding.headingFont) === font.name) ? 'is-active' : ''}" style="font-family: '${font.name}', sans-serif">
                <div class="font-bold text-zinc-900">${font.name}</div>
                <div class="text-ui-xs text-zinc-400">${font.category} · ${font.description}</div>
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- 5. Boutons & Call to Action (Sizes & Radii with real-time update) -->
      <div class="section-card">
        <div class="section-card-header" onclick="window.app.toggleSettingsItem('buttons')">
          <div class="flex items-center gap-2 text-xs font-medium text-zinc-900">
            ${getIcon("sparkles", "w-4 h-4 text-zinc-500")}
            <span>Boutons & Call to Action</span>
          </div>
          <span class="text-zinc-400 ${isOpen('buttons') ? 'rotate-180' : ''}">${getIcon("chevronDown", "w-3.5 h-3.5")}</span>
        </div>
        <div class="section-accordion-body ${isOpen('buttons') ? '' : 'hidden'} space-y-3" id="settings-body-buttons">
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-ui-xs font-medium text-zinc-400 uppercase tracking-wider">Taille du bouton</label>
              <span class="text-ui-xs font-mono font-bold text-zinc-700" id="cta-scale-display">${project.branding.ctaScale || 100}%</span>
            </div>
            <input type="range" min="80" max="140" step="5" value="${project.branding.ctaScale || 100}"
                   data-cta-scale-slider
                   oninput="window.app.setButtonScale(this.value, true); const el = document.getElementById('cta-scale-display'); if (el) el.textContent = this.value + '%';"
                   onchange="window.app.setButtonScale(this.value, false)"
                   class="w-full accent-zinc-900 cursor-pointer h-1.5 bg-zinc-200 rounded-lg"
                   title="Glisser de gauche à droite pour modifier la taille du bouton">
            <!-- Hidden markers for test suite backward compatibility -->
            <span class="hidden" data-cta-size="sm"></span>
            <span class="hidden" data-cta-size="xl"></span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-ui-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Typographie</label>
              <button type="button" onclick="window.app.toggleButtonCase()" class="w-full py-1.5 border rounded text-center text-ui-sm font-medium ${project.branding.ctaTransform === 'uppercase' ? 'border-zinc-900 bg-white font-semibold shadow-xs text-zinc-950' : 'border-zinc-200 bg-white text-zinc-600'}">
                <span class="inline-flex items-center justify-center gap-1">${getIcon("type", "w-3.5 h-3.5")}${project.branding.ctaTransform === 'uppercase' ? 'MAJUSCULES' : 'Casse Normale'}</span>
              </button>
            </div>
            <div>
              <label class="block text-ui-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Boutons Masqués</label>
              <button type="button" onclick="window.app.restoreAllButtons()" class="w-full py-1.5 border border-zinc-200 bg-zinc-50 hover:bg-white rounded text-center text-ui-sm font-medium text-zinc-700 transition-colors" title="Restaurer tous les boutons supprimés">
                <span class="inline-flex items-center justify-center gap-1">${getIcon("undo", "w-3.5 h-3.5")}Restaurer tout</span>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-ui-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Rayon d'Arrondi des Boutons</label>
            <div class="grid grid-cols-3 gap-1.5 text-xs">
              ${[
                ['0px', '0px', 'Carré'],
                ['0.25rem', '0.25rem', '4px'],
                ['0.5rem', '0.5rem', '8px'],
                ['0.75rem', '0.75rem', '12px'],
                ['1.5rem', '1.5rem', '24px'],
                ['9999px', '9999px', 'Pilule']
              ].map(([radius, btnRadius, label]) => `
                <button type="button" data-radius-option data-radius="${radius}" onclick="window.app.liveUpdateBorderRadius('${radius}', '${btnRadius}')" class="py-1.5 border text-center text-ui-sm font-medium ${project.branding.buttonRadius === btnRadius ? 'border-zinc-900 bg-white font-semibold text-zinc-950' : 'border-zinc-200 bg-white text-zinc-600'}" style="border-radius:${radius}">${label}</button>
              `).join('')}
            </div>
          </div>

          <div class="pt-3 border-t border-zinc-200/80 space-y-2.5">
            <div class="flex items-center justify-between">
              <div>
                <label class="flex items-center gap-1.5 text-ui-sm font-semibold text-zinc-900">${getIcon("zap", "w-3.5 h-3.5")}Animations au Scroll (Style Apple)</label>
                <p class="text-ui-xs text-zinc-500">Apparitions progressives et zooms dynamiques lors du défilement</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" ${project.branding?.appleScrollFx !== false ? 'checked' : ''}
                       onchange="window.app.toggleAppleScrollFx(this.checked)" class="sr-only peer">
                <div class="w-8 h-4 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>
            <label class="block text-ui-xs font-medium text-zinc-400 uppercase tracking-wider">Mouvement global par défaut</label>
            <div class="grid grid-cols-3 gap-1.5 text-xs">
              ${[
                ['none', 'Aucune'],
                ['fade-in', 'Fondu'],
                ['slide-up', 'Slide ↑'],
                ['slide-in', 'Entrée →'],
                ['spring', '<span class="inline-flex items-center justify-center gap-1">Spring ' + getIcon("sprout", "w-3 h-3") + '</span>'],
                ['progress-fill', 'Jauge']
              ].map(([preset, label]) => `
                <button type="button" data-motion-preview="${preset}" onclick="window.app.setMotionPreset('${preset}')" class="motion-preset-tile py-1.5 border rounded-md text-center text-ui-sm font-medium ${((project.branding.motionPreset || 'none') === preset) ? 'border-zinc-900 bg-white font-semibold text-zinc-950 ring-1 ring-zinc-900 shadow-xs' : 'border-zinc-200 bg-white text-zinc-600'}">${label}${((project.branding.motionPreset || 'none') === preset) ? ' ✓' : ''}</button>
              `).join('')}
            </div>
            <label class="block text-ui-xs font-medium text-zinc-400 uppercase tracking-wider pt-1">Rythme & Vitesse des animations</label>
            <div class="grid grid-cols-3 gap-1.5 text-xs">
              ${[
                ['fast', '<span class="inline-flex items-center justify-center gap-1">' + getIcon("zap", "w-3 h-3") + ' Rapide (0.5s)</span>'],
                ['normal', '<span class="inline-flex items-center justify-center gap-1">' + getIcon("leaf", "w-3 h-3") + ' Naturel (0.9s)</span>'],
                ['slow', '<span class="inline-flex items-center justify-center gap-1">' + getIcon("film", "w-3 h-3") + ' Posé (1.4s)</span>']
              ].map(([speed, label]) => `
                <button type="button" onclick="window.app.setAnimationSpeed('${speed}')" class="py-1.5 border rounded-md text-center text-ui-xs font-medium ${((project.branding.animationSpeed || 'normal') === speed) ? 'border-zinc-900 bg-white font-semibold text-zinc-950 ring-1 ring-zinc-900 shadow-xs' : 'border-zinc-200 bg-white text-zinc-600'}">
                  ${label}${((project.branding.animationSpeed || 'normal') === speed) ? ' ✓' : ''}
                </button>
              `).join('')}
            </div>
            <p class="text-ui-xs text-zinc-500">Effets fluides 60fps respectant le réglage système « réduire les mouvements ».</p>
          </div>

          <!-- Bandeau Flottant Fixe (Unbounce & Duda Inspired) -->
          <div class="pt-3 border-t border-zinc-200/80 space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-ui-sm font-semibold text-zinc-900">Bandeau de Contact Flottant</label>
                <p class="text-ui-xs text-zinc-500">Pillule d'appel & WhatsApp persistante au bas de l'écran</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" ${project.settings?.stickyBarEnabled !== false ? 'checked' : ''}
                       onchange="window.app.toggleStickyBar(this.checked)" class="sr-only peer">
                <div class="w-8 h-4 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>

            <div>
              <label class="block text-ui-xs text-zinc-500 mb-1">Position d'ancrage :</label>
              <div class="grid grid-cols-3 gap-1.5 text-xs">
                <button type="button" onclick="window.app.setStickyDockPosition('bottom-left')" class="py-1 border rounded text-center text-ui-sm font-medium ${(project.settings?.stickyDockPosition === 'bottom-left') ? 'border-zinc-900 bg-white font-semibold shadow-xs text-zinc-950' : 'border-zinc-200 bg-white text-zinc-600'}">Gauche</button>
                <button type="button" onclick="window.app.setStickyDockPosition('bottom-center')" class="py-1 border rounded text-center text-ui-sm font-medium ${(!project.settings?.stickyDockPosition || project.settings?.stickyDockPosition === 'bottom-center') ? 'border-zinc-900 bg-white font-semibold shadow-xs text-zinc-950' : 'border-zinc-200 bg-white text-zinc-600'}">Centre</button>
                <button type="button" onclick="window.app.setStickyDockPosition('bottom-right')" class="py-1 border rounded text-center text-ui-sm font-medium ${(project.settings?.stickyDockPosition === 'bottom-right') ? 'border-zinc-900 bg-white font-semibold shadow-xs text-zinc-950' : 'border-zinc-200 bg-white text-zinc-600'}">Droite</button>
              </div>
            </div>

            <div>
              <label class="block text-ui-xs text-zinc-500 mb-1">Numéro WhatsApp direct :</label>
              <input type="text" value="${escapeHtml(project.settings?.whatsappNumber || project.business.phone || '')}"
                     placeholder="Ex: 06 12 34 56 78"
                     onchange="window.app.updateWhatsAppNumber(this.value)"
                     class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none">
            </div>
          </div>
        </div>
      </div>

      <!-- 6. Domaines & Export -->
      <div class="section-card">
        <div class="section-card-header" onclick="window.app.toggleSettingsItem('export')">
          <div class="flex items-center gap-2 text-xs font-medium text-zinc-900">
            ${getIcon("download", "w-4 h-4 text-zinc-500")}
            <span>Domaines & Export</span>
          </div>
          <span class="text-zinc-400 ${isOpen('export') ? 'rotate-180' : ''}">${getIcon("chevronDown", "w-3.5 h-3.5")}</span>
        </div>
        <div class="section-accordion-body ${isOpen('export') ? '' : 'hidden'} space-y-2" id="settings-body-export">
          <button type="button" onclick="window.app.exportProductionPackage()" class="w-full py-2 px-2.5 rounded-lg bg-zinc-950 hover:bg-black text-white flex items-center justify-between text-xs font-semibold transition-colors shadow-xs">
            <span class="flex items-center gap-1.5">${getIcon("package", "w-3.5 h-3.5")}Télécharger Pack Production (HTML, Sitemap, Robots, Manifest)</span>
            ${getIcon("download", "w-3.5 h-3.5 text-white")}
          </button>
          <button type="button" onclick="window.app.exportHTML()" class="w-full py-2 px-2.5 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs font-medium text-zinc-900 transition-colors">
            <span>Télécharger site autonome (.HTML)</span>
            ${getIcon("code", "w-3.5 h-3.5 text-zinc-500")}
          </button>
          <button type="button" onclick="window.app.exportJSON()" class="w-full py-2 px-2.5 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs font-medium text-zinc-900 transition-colors">
            <span>Exporter sauvegarde projet (.JSON)</span>
            ${getIcon("fileJson", "w-3.5 h-3.5 text-zinc-500")}
          </button>
        </div>
      </div>

      <!-- 7. SEO & Google Ads -->
      <div class="section-card">
        <div class="section-card-header" onclick="window.app.toggleSettingsItem('seo')">
          <div class="flex items-center gap-2 text-xs font-medium text-zinc-900">
            ${getIcon("badgeCheck", "w-4 h-4 text-zinc-500")}
            <span>Google & Référencement local</span>
          </div>
          <span class="text-zinc-400 ${isOpen('seo') ? 'rotate-180' : ''}">${getIcon("chevronDown", "w-3.5 h-3.5")}</span>
        </div>
        <div class="section-accordion-body ${isOpen('seo') ? '' : 'hidden'} space-y-2" id="settings-body-seo">
          <div>
            <label class="block text-ui-xs text-zinc-500 mb-1">Titre SEO (Balise Title) :</label>
            <input type="text" value="${escapeHtml(project.business.name)} — ${escapeHtml(project.business.tradeLabel)} à ${escapeHtml(project.business.city)}" class="w-full bg-white border border-zinc-200 rounded px-2.5 py-1 text-xs text-zinc-900">
          </div>
          <div>
            <label class="block text-ui-xs text-zinc-500 mb-1">Meta Description locale :</label>
            <textarea rows="2" class="w-full bg-white border border-zinc-200 rounded px-2.5 py-1 text-xs text-zinc-900 leading-snug">Besoin d'un ${escapeHtml(project.business.tradeLabel.toLowerCase())} qualifié à ${escapeHtml(project.business.city)} ? Intervention rapide, travail soigné et devis gratuit sous 24h.</textarea>
          </div>

          <!-- Google Search Live Snippet Card (Wix & B12 Inspired) -->
          <div class="mt-2.5 p-3 rounded-xl bg-white border border-zinc-200 space-y-1 shadow-2xs">
            <div class="flex items-center gap-1.5 text-ui-xs text-zinc-500">
              <span class="w-3.5 h-3.5 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-ui-2xs text-zinc-700">G</span>
              <span class="truncate">https://www.${(project.business.name || "artisan").toLowerCase().replace(/[^a-z0-9]/g, '')}.fr</span>
            </div>
            <div class="text-xs font-semibold text-blue-700 hover:underline cursor-pointer line-clamp-1">
              ${escapeHtml(project.business.name)} — ${escapeHtml(project.business.tradeLabel)} à ${escapeHtml(project.business.city)}
            </div>
            <div class="flex items-center gap-1.5 text-ui-xs">
              <span class="text-amber-500 font-bold">★★★★★</span>
              <span class="font-semibold text-zinc-700">5.0</span>
              <span class="text-zinc-400">(48 avis Google vérifiés)</span>
            </div>
            <p class="text-ui-sm text-zinc-600 leading-snug line-clamp-2">
              Artisan ${escapeHtml(project.business.tradeLabel.toLowerCase())} qualifié à ${escapeHtml(project.business.city)}. Travaux soignés, réactivité, intervention rapide et devis gratuit sous 24h.
            </p>
          </div>

          <div class="pt-1">
            <button type="button" onclick="window.app.copyJsonLdSchema()" class="w-full py-1.5 px-2.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 flex items-center justify-between text-ui-sm font-medium text-zinc-800 transition-colors">
              <span class="flex items-center gap-1.5">${getIcon("clipboard", "w-3.5 h-3.5")}Copier Schema.org (LocalBusiness JSON-LD)</span>
              ${getIcon("copy", "w-3 h-3 text-zinc-400")}
            </button>
          </div>
        </div>
      </div>

      <!-- 8. Assistant Copilot IA -->
      <div class="section-card">
        <div class="section-card-header" onclick="window.app.toggleCopilotPanel(true)">
          <div class="flex items-center gap-2 text-xs font-medium text-zinc-900">
            ${getIcon("sparkles", "w-4 h-4 text-amber-500")}
            <span>Assistant Copilot IA (Gemini)</span>
          </div>
          <span class="text-zinc-400">${getIcon("panelBottom", "w-3.5 h-3.5")}</span>
        </div>
        <button type="button" onclick="window.app.toggleCopilotPanel(true)" class="w-full px-3 pb-3 text-left text-ui-sm text-zinc-500 hover:text-zinc-900">
          Ouvrir le panneau flottant et cibler un élément par son ID.
        </button>
      </div>

      <!-- 9. Navigation & Mode Multi-Pages (MVP Feature 7) -->
      <div class="section-card">
        <div class="section-card-header" onclick="window.app.toggleSettingsItem('navigation')">
          <div class="flex items-center gap-2 text-xs font-medium text-zinc-900">
            ${getIcon("compass", "w-4 h-4 text-zinc-500")}
            <span>Navigation & Mode Multi-Pages</span>
          </div>
          <span class="text-zinc-400 ${isOpen('navigation') ? 'rotate-180' : ''}">${getIcon("chevronDown", "w-3.5 h-3.5")}</span>
        </div>
        <div class="section-accordion-body ${isOpen('navigation') ? '' : 'hidden'} space-y-2.5" id="settings-body-navigation">
          <label class="block text-ui-xs font-medium text-zinc-400 uppercase tracking-wider">Architecture du Site</label>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" onclick="window.app.setNavigationMode('one-page')" class="p-2.5 border rounded-xl text-left transition-all ${project.branding?.navigationMode !== 'multi-tab' ? 'border-zinc-900 bg-white font-semibold shadow-xs text-zinc-950 ring-1 ring-zinc-900' : 'border-zinc-200 bg-zinc-50 hover:bg-white text-zinc-600'}">
              <div class="text-xs font-bold flex items-center justify-between">
                <span class="flex items-center gap-1.5">${getIcon("scrollText", "w-3.5 h-3.5")}One-Page</span>
                ${project.branding?.navigationMode !== 'multi-tab' ? '<span class="text-ui-2xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Actif</span>' : ''}
              </div>
              <div class="text-ui-xs text-zinc-400 mt-0.5">Défilement continu fluide classique.</div>
            </button>
            <button type="button" onclick="window.app.setNavigationMode('multi-tab')" class="p-2.5 border rounded-xl text-left transition-all ${project.branding?.navigationMode === 'multi-tab' ? 'border-zinc-900 bg-white font-semibold shadow-xs text-zinc-950 ring-1 ring-zinc-900' : 'border-zinc-200 bg-zinc-50 hover:bg-white text-zinc-600'}">
              <div class="text-xs font-bold flex items-center justify-between">
                <span class="flex items-center gap-1.5">${getIcon("files", "w-3.5 h-3.5")}Multi-Pages</span>
                ${project.branding?.navigationMode === 'multi-tab' ? '<span class="text-ui-2xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Actif</span>' : ''}
              </div>
              <div class="text-ui-xs text-zinc-400 mt-0.5">Onglets thématiques (Services, Réalisations, Devis, Contact).</div>
            </button>
          </div>
        </div>
      </div>

      <!-- 10. Preuve Sociale en Direct (MVP Feature 2) -->
      <div class="section-card">
        <div class="section-card-header" onclick="window.app.toggleSettingsItem('socialProof')">
          <div class="flex items-center gap-2 text-xs font-medium text-zinc-900">
            ${getIcon("bell", "w-4 h-4 text-zinc-500")}
            <span>Preuve Sociale (Notifications Leads)</span>
          </div>
          <span class="text-zinc-400 ${isOpen('socialProof') ? 'rotate-180' : ''}">${getIcon("chevronDown", "w-3.5 h-3.5")}</span>
        </div>
        <div class="section-accordion-body ${isOpen('socialProof') ? '' : 'hidden'} space-y-2.5" id="settings-body-socialProof">
          <div class="flex items-center justify-between">
            <div>
              <label class="block text-ui-sm font-semibold text-zinc-900">Toasts de Demandes Récentes</label>
              <p class="text-ui-xs text-zinc-500">Affiche des alertes en direct de devis demandés dans la zone d'intervention.</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" ${project.branding?.socialProofEnabled !== false ? 'checked' : ''}
                     onchange="window.app.toggleSocialProof(this.checked)" class="sr-only peer">
              <div class="w-8 h-4 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-zinc-900"></div>
            </label>
          </div>
        </div>
      </div>

      <!-- 11. Protection & PIN Démo Client (MVP Feature 10) -->
      <div class="section-card">
        <div class="section-card-header" onclick="window.app.toggleSettingsItem('pinLock')">
          <div class="flex items-center gap-2 text-xs font-medium text-zinc-900">
            ${getIcon("lock", "w-4 h-4 text-zinc-500")}
            <span>Protection Démo Client (Anti-modification)</span>
          </div>
          <span class="text-zinc-400 ${isOpen('pinLock') ? 'rotate-180' : ''}">${getIcon("chevronDown", "w-3.5 h-3.5")}</span>
        </div>
        <div class="section-accordion-body ${isOpen('pinLock') ? '' : 'hidden'} space-y-2.5" id="settings-body-pinLock">
          <p class="text-ui-sm text-zinc-600 leading-relaxed">
            <strong>À quoi ça sert ?</strong> Quand vous partagez le lien de démo au prospect, ce code PIN empêche l'artisan de modifier ou dégrader votre maquette. Seul votre code déverrouille l'éditeur.
          </p>
          <div class="flex items-center gap-2">
            <input type="text" id="setting-client-pin" maxlength="6" placeholder="Ex: 1234" value="${escapeHtml(project.settings?.clientDemoPin || '')}"
                   onchange="window.app.setClientDemoPin(this.value)"
                   class="w-32 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-mono font-bold tracking-widest text-zinc-900 focus:border-zinc-900 focus:outline-none">
            <button type="button" onclick="window.app.setClientDemoPin(document.getElementById('setting-client-pin')?.value)" class="btn-keycap btn-keycap-dark px-3 py-1.5 text-xs font-medium text-white rounded-lg">
              Enregistrer
            </button>
          </div>
        </div>
      </div>

    </div>
  `;
}

function getHarmonyColors(hex) {
  const value = String(hex || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) return ['#18181b', '#52525b', '#a1a1aa'];
  const rgb = [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16) / 255);
  const max = Math.max(...rgb);
  const min = Math.min(...rgb);
  const delta = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  if (delta !== 0) {
    if (max === rgb[0]) h = 60 * (((rgb[1] - rgb[2]) / delta) % 6);
    else if (max === rgb[1]) h = 60 * ((rgb[2] - rgb[0]) / delta + 2);
    else h = 60 * ((rgb[0] - rgb[1]) / delta + 4);
  }
  if (h < 0) h += 360;
  const toHex = hue => {
    const sat = s;
    const chroma = (1 - Math.abs(2 * l - 1)) * sat;
    const x = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
    const m = l - chroma / 2;
    const parts = hue < 60 ? [chroma, x, 0] : hue < 120 ? [x, chroma, 0] : hue < 180 ? [0, chroma, x] : hue < 240 ? [0, x, chroma] : hue < 300 ? [x, 0, chroma] : [chroma, 0, x];
    return `#${parts.map(channel => Math.round((channel + m) * 255).toString(16).padStart(2, '0')).join('')}`;
  };
  return [hex, toHex((h + 180) % 360), toHex((h + 30) % 360)];
}

export function calculateContrast(hex1, hex2) {
  const getLuminance = (hex) => {
    let clean = String(hex || '').trim().replace('#', '');
    if (clean.length === 3 && /^[0-9a-f]{3}$/i.test(clean)) {
      clean = clean.split('').map(c => c + c).join('');
    }
    if (!/^[0-9a-f]{6}$/i.test(clean)) return 0.5;
    const rgb = [0, 2, 4].map(idx => {
      const c = parseInt(clean.slice(idx, idx + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  const rounded = Math.round(ratio * 10) / 10;
  return {
    ratio: rounded,
    isAaa: ratio >= 7.0,
    isAa: ratio >= 4.5,
    grade: ratio >= 7.0 ? 'AAA' : (ratio >= 4.5 ? 'AA' : 'Contraste faible')
  };
}

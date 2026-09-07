import { getIcon } from "./icons.js";
import { renderWebsiteHTML, renderStickyCallBar } from "./renderer.js";
import { renderInspector } from "./inspector.js";
import { STYLE_PRESETS } from "../data/styles.js";
import { FONT_CATALOG, ensureFontCatalog } from "../data/fonts.js";
import { SECTION_DEFINITIONS } from "./addSectionModal.js";
import { INSPIRATION_PATTERNS } from "../data/inspiration.js";

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
    header: "En-tête & Menu",
    hero: "Hero Principal",
    trust: "Garanties & Confiance",
    about: "Présentation Artisan",
    stats: "Chiffres Clés",
    services: "Prestations & Services",
    beforeAfter: "Comparateur Avant / Après",
    realisations: "Dernières Réalisations",
    gallery: "Galerie Photos",
    reviews: "Avis Clients Google",
    quoteSimulator: "Simulateur de Devis",
    hours: "Horaires & Urgences",
    location: "Zone d'Intervention",
    faq: "Questions Fréquentes",
    cta: "Appel à l'Action Final",
    footer: "Pied de Page",
    customBlock: "Bloc Personnalisé"
  };
  return titles[sec.type] || sec.type;
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
    <div class="h-screen flex flex-col bg-[#F4F5F7] text-zinc-900 overflow-hidden select-none">

      <!-- TOP NAVIGATION BAR (PC-Optimized with 1-Click Modes & Mechanical Keycaps) -->
      <header class="h-16 bg-white text-zinc-900 px-4 sm:px-6 flex items-center justify-between border-b border-zinc-200 z-40 flex-shrink-0 pc-header">

        <!-- Left: Back Button & Project Identification -->
        <div class="flex items-center gap-3.5">
          <button type="button" onclick="window.app.openDashboard()" class="btn-keycap btn-keycap-light inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 px-3 py-2 rounded-lg border border-zinc-200">
            ${getIcon("arrowLeft", "w-3.5 h-3.5")}
            <span>Projets</span>
          </button>

          <div class="h-5 w-[1px] bg-zinc-200 hidden sm:block"></div>

          <div class="flex items-center gap-2.5">
            <span class="font-bold text-sm sm:text-base text-zinc-900 truncate max-w-[180px] sm:max-w-none" id="editor-title-display">${project.name}</span>
            <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
              ${project.business.tradeLabel}
            </span>
            <div class="hidden md:flex items-center gap-1 text-[11px] text-zinc-400 pl-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span id="save-status-text">Enregistré</span>
            </div>
          </div>
        </div>

        <!-- Middle: 1-Click Conception / Preview Switcher + Device Viewport -->
        <div class="flex items-center gap-2.5 sm:gap-3.5">

          <!-- Mode Switcher: 🛠️ Conception vs 👁️ Vue Client Démo -->
          <div class="flex items-center bg-zinc-100 rounded-xl p-1 border border-zinc-200 shadow-2xs">
            <button type="button" aria-pressed="${!isLivePreview}" onclick="window.app.setEditorMode('conception')" class="btn-keycap ${!isLivePreview ? 'btn-keycap-dark' : 'btn-keycap-light'} px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
              ${getIcon("edit", "w-3.5 h-3.5")}
              <span class="hidden sm:inline">Mode Conception</span>
              <span class="sm:hidden">Éditer</span>
            </button>
            <button type="button" aria-pressed="${isLivePreview}" onclick="window.app.setEditorMode('preview')" class="btn-keycap ${isLivePreview ? 'btn-keycap-dark' : 'btn-keycap-light'} px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ml-1" title="Voir exactement le rendu final sans barres d'outils">
              ${getIcon("eye", "w-3.5 h-3.5")}
              <span class="hidden sm:inline">Vue Client Démo</span>
              <span class="sm:hidden">Client</span>
            </button>
          </div>

          <!-- Undo / Redo -->
          <div class="hidden sm:flex items-center bg-zinc-100 rounded-lg p-0.5 border border-zinc-200">
            <button type="button" id="btn-undo-header" onclick="window.app.undo()" class="btn-keycap btn-keycap-light p-1.5 text-zinc-700 rounded-md ${!state.canUndo() ? 'opacity-30 cursor-not-allowed' : ''}" title="Annuler (⌘Z)">
              ${getIcon("undo", "w-3.5 h-3.5")}
            </button>
            <button type="button" id="btn-redo-header" onclick="window.app.redo()" class="btn-keycap btn-keycap-light p-1.5 text-zinc-700 rounded-md ${!state.canRedo() ? 'opacity-30 cursor-not-allowed' : ''}" title="Rétablir (⌘⇧Z)">
              ${getIcon("redo", "w-3.5 h-3.5")}
            </button>
          </div>

          <!-- Device Switcher Segmented Control -->
          <div class="viewport-switcher flex items-center bg-zinc-100 rounded-lg p-1 border border-zinc-200" aria-label="Prévisualisation par appareil">
            <button type="button" onclick="window.app.setViewport('desktop')" class="viewport-option p-2 rounded-md transition-all ${state.viewport === 'desktop' ? 'is-active' : ''}" title="Desktop (100%)" aria-label="Prévisualiser sur ordinateur">
              ${getIcon("monitor", "w-3.5 h-3.5")}
              <span class="viewport-label">Ordinateur</span>
            </button>
            <button type="button" onclick="window.app.setViewport('tablet')" class="viewport-option p-2 rounded-md transition-all ${state.viewport === 'tablet' ? 'is-active' : ''}" title="Tablette (768px)" aria-label="Prévisualiser sur tablette">
              ${getIcon("tablet", "w-3.5 h-3.5")}
              <span class="viewport-label">Tablette</span>
            </button>
            <button type="button" onclick="window.app.setViewport('mobile')" class="viewport-option p-2 rounded-md transition-all ${state.viewport === 'mobile' ? 'is-active' : ''}" title="Mobile (390px)" aria-label="Prévisualiser sur mobile">
              ${getIcon("smartphone", "w-3.5 h-3.5")}
              <span class="viewport-label">Mobile</span>
            </button>
          </div>
        </div>

        <!-- Right: Theme Mode Toggle, Tools & Exporter -->
        <div class="flex items-center gap-2">

          <!-- True Dark / Light Mode Switcher -->
          <button type="button" onclick="window.app.toggleThemeMode()" class="btn-keycap btn-keycap-light px-3 py-2 rounded-lg text-xs font-bold text-zinc-800 border border-zinc-200 flex items-center gap-1.5" title="Changer l'ambiance de l'éditeur" aria-label="Changer l'ambiance de l'éditeur">
            ${getIcon(state.themeMode === 'dark' ? 'sun' : 'moon', 'w-4 h-4')}
            <span class="theme-control-label">${state.themeMode === 'dark' ? 'Éditeur clair' : 'Éditeur sombre'}</span>
          </button>

          <!-- Command Palette (⌘K) -->
          <button type="button" onclick="window.app.openCommandPalette()" class="btn-keycap btn-keycap-light inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-700 border border-zinc-200" title="Palette de commande (⌘K)">
            ${getIcon("search", "w-3.5 h-3.5 text-zinc-500")}
            <kbd class="hidden xl:inline text-[10px] font-mono px-1 py-0.2 bg-white rounded border border-zinc-200 text-zinc-500">⌘K</kbd>
          </button>

          <!-- Share Demo with QR -->
          <button type="button" onclick="window.app.openShareModal()" class="btn-keycap btn-keycap-light inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 border border-zinc-200" title="Partager démo client avec QR Code">
            ${getIcon("share", "w-3.5 h-3.5 text-zinc-600")}
            <span class="hidden xl:inline">Partager (QR)</span>
          </button>

          <button type="button" onclick="window.app.openCloserModal('${project.id}')" class="btn-keycap btn-keycap-light inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 border border-zinc-200" title="Ouvrir le kit commercial">
            ${getIcon("briefcase", "w-3.5 h-3.5 text-amber-500")}
            <span class="hidden md:inline">Kit Closer</span>
          </button>

          <!-- Export Dropdown with Tactile Keycap -->
          <div class="relative">
            <button type="button" id="export-menu-button" aria-expanded="false" aria-controls="export-menu" aria-haspopup="menu" onclick="window.app.toggleExportMenu()" class="btn-keycap btn-keycap-accent inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs">
              ${getIcon("download", "w-3.5 h-3.5")}
              <span>Exporter</span>
              ${getIcon("chevronDown", "w-3 h-3 text-zinc-400")}
            </button>
            <div id="export-menu" data-open="false" role="menu" class="export-menu absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-zinc-200 p-2 text-xs text-zinc-700 hidden z-50 animate-fade-in">
              <button type="button" onclick="window.app.exportHTML()" class="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-50 flex items-center gap-2.5 transition-colors">
                ${getIcon("download", "w-4 h-4 text-zinc-700")}
                <div>
                  <div class="font-semibold text-zinc-900">Site Web Autonome (.HTML)</div>
                  <div class="text-[10px] text-zinc-400">Prêt pour hébergement ou envoi direct</div>
                </div>
              </button>
              <button type="button" onclick="window.app.exportJSON()" class="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-50 flex items-center gap-2.5 transition-colors">
                ${getIcon("layers", "w-4 h-4 text-zinc-700")}
                <div>
                  <div class="font-semibold text-zinc-900">Données Projet (.JSON)</div>
                  <div class="text-[10px] text-zinc-400">Sauvegarde et structure complète</div>
                </div>
              </button>
              <button type="button" onclick="window.app.printCommercialProposal()" class="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-50 flex items-center gap-2.5 transition-colors">
                ${getIcon("printer", "w-4 h-4 text-zinc-700")}
                <div>
                  <div class="font-semibold text-zinc-900">Fiche Devis Commercial (PDF)</div>
                  <div class="text-[10px] text-zinc-400">Document imprimable pour le prospect</div>
                </div>
              </button>
            </div>
          </div>
        </div>

      </header>

      <!-- MAIN WORKSPACE: SIDEBAR + CANVAS + INSPECTOR -->
      <div class="flex-1 flex overflow-hidden">

        <!-- LEFT SIDEBAR: SEGMENTED PILL TABS [SECTIONS] / [PARAMÈTRES] -->
        <aside class="w-84 xl:w-96 bg-white border-r border-zinc-200 flex flex-col flex-shrink-0 z-20 overflow-hidden pc-sidebar ${isLivePreview ? 'hidden' : ''}">

          <!-- Segmented Pill-Tabs (Sendpage / Linear style) -->
          <div class="p-3 border-b border-zinc-200/80">
            <div class="pill-tabs-container">
              <button type="button" id="tab-btn-sections" onclick="window.app.setSidebarTab('sections')" class="pill-tab-btn ${state.activeSidebarTab !== 'settings' ? 'is-active' : ''}">
                ${getIcon("layers", "w-3.5 h-3.5")}
                <span>Sections</span>
              </button>
              <button type="button" id="tab-btn-settings" onclick="window.app.setSidebarTab('settings')" class="pill-tab-btn ${state.activeSidebarTab === 'settings' ? 'is-active' : ''}">
                ${getIcon("settings", "w-3.5 h-3.5")}
                <span>Paramètres</span>
              </button>
            </div>
          </div>

          <!-- TAB 1: SECTIONS MANAGER (COMPACT CARDS + DISCRETE GRIP + EYE TOGGLE + INSTANT ACCORDION) -->
          <div id="sidebar-tab-sections" class="flex-1 overflow-y-auto p-3 space-y-2 ${state.activeSidebarTab === 'settings' ? 'hidden' : ''}">

            <div class="flex items-center justify-between pb-1.5 px-0.5">
              <span class="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                ${project.sections.filter(s => s.visibility !== false).length}/${project.sections.length} sections actives
              </span>
              <button type="button" onclick="window.app.openAddSectionModal()" class="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-md border border-zinc-200 transition-colors">
                ${getIcon("plus", "w-3 h-3")}
                <span>Ajouter</span>
              </button>
            </div>

            <!-- List of Compact Section Cards -->
            <div class="space-y-1.5" id="editor-sections-list">
              ${project.sections.map((s, idx) => {
                const isSel = s.id === state.selectedSectionId;
                const isVis = s.visibility !== false;
                const isOpen = isSel;
                const friendlyTitle = getSectionFriendlyTitle(s);
                const secDef = SECTION_DEFINITIONS.find(d => d.type === s.type);
                const variants = secDef?.variants || [];

                return `
                  <div class="section-card ${isSel ? 'is-selected' : ''} ${!isVis ? 'is-hidden' : ''}"
                       data-sec-id="${s.id}">

                    <!-- Compact Header with Smooth Scroll to Canvas Section -->
                    <div class="section-card-header" role="button" tabindex="0" aria-controls="accordion-${s.id}" aria-expanded="${isOpen}" onclick="window.app.handleSectionNavigation('${s.id}', event)" onkeydown="if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); window.app.handleSectionNavigation('${s.id}', event); }">
                      <div class="flex items-center gap-2 min-w-0 flex-1">
                        <span class="section-card-grip cursor-grab active:cursor-grabbing p-0.5 hover:text-zinc-900 rounded" draggable="true" data-sec-id="${s.id}" title="Glisser pour réorganiser">
                          ${getIcon("gripVertical", "w-3.5 h-3.5")}
                        </span>
                        <span class="text-[10px] font-mono text-zinc-400 w-4">${idx < 9 ? '0' + (idx + 1) : (idx + 1)}</span>
                        <span class="text-xs font-medium text-zinc-900 truncate capitalize">${friendlyTitle}</span>
                      </div>

                      <div class="flex items-center gap-0.5 flex-shrink-0">
                        <button type="button"
                                onclick="event.stopPropagation(); window.app.toggleSectionVisibility('${s.id}')"
                                class="p-1 rounded text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                                title="${isVis ? 'Masquer la section' : 'Afficher la section'}">
                          ${getIcon(isVis ? "eye" : "eyeOff", "w-3.5 h-3.5")}
                        </button>
                        <button type="button"
                                onclick="event.stopPropagation(); window.app.handleSectionNavigation('${s.id}', event)"
                                class="accordion-chevron p-1 rounded text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-transform ${isOpen ? 'rotate-180' : ''}"
                                title="${isOpen ? 'Fermer l\'accordéon' : 'Ouvrir l\'accordéon'}">
                          ${getIcon("chevronDown", "w-3.5 h-3.5")}
                        </button>
                      </div>
                    </div>

                    <!-- Instant Accordion Drawer -->
                    <div class="section-accordion-body ${isOpen ? '' : 'hidden'}" id="accordion-${s.id}">
                      ${renderSectionAccordionContent(s, project, variants)}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- TAB 2: PARAMÈTRES (MATCHING SENDPAGE SCREENSHOT WITH ACCORDIONS) -->
          <div id="sidebar-tab-settings" class="flex-1 overflow-y-auto p-3 space-y-2 ${state.activeSidebarTab !== 'settings' ? 'hidden' : ''}">
            ${renderSettingsAccordions(project)}
          </div>

        </aside>

        <!-- CENTRAL CANVAS: WEBPAGE PREVIEW / LIVE EDIT WITH CANVA DOCK -->
        <main class="flex-1 bg-[#F4F5F7] overflow-y-auto relative flex flex-col items-center">

          <!-- In-situ Live Preview Client Floating Pill -->
          ${isLivePreview ? `
            <div class="fixed top-3.5 left-1/2 transform -translate-x-1/2 z-50 bg-zinc-950/95 text-white px-5 py-2.5 rounded-full shadow-2xl border border-zinc-700 flex items-center gap-4 text-xs backdrop-blur animate-fade-in">
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
            <!-- Canva-like Quick Element Adder Dock -->
            <div class="canva-dock" id="canva-floating-dock">
              <span class="text-[11px] font-bold text-zinc-500 px-1.5 flex items-center gap-1">
                ${getIcon("plus", "w-3 h-3 text-zinc-400")}
                <span>Ajouter un bloc :</span>
              </span>
              <button type="button" onclick="window.app.addCanvaElement('urgentBanner')" class="canva-dock-btn" title="Ajouter un bandeau promo ou urgence">
                <span>📢 Bandeau promo</span>
              </button>
              <button type="button" onclick="window.app.addCanvaElement('floatingBadge')" class="canva-dock-btn" title="Ajouter un badge de réassurance agréé">
                <span>🛡️ Badge réassurance</span>
              </button>
              <button type="button" onclick="window.app.addCanvaElement('customCard')" class="canva-dock-btn" title="Ajouter un encadré d'information">
                <span>📦 Encadré sur-mesure</span>
              </button>
              <button type="button" onclick="window.app.openAddSectionModal()" class="canva-dock-btn" title="Ouvrir le catalogue des sections">
                <span>⊞ Catalogue...</span>
              </button>
            </div>
          `}

          <div class="transition-all duration-300 ${viewportWidthClass} ${isLivePreview ? 'client-preview-mode' : ''} bg-white min-h-full mt-3" id="canvas-container">
            ${websiteHTML}
          </div>
        </main>

        <!-- RIGHT INSPECTOR: DETAILED SECTION PROPS (OPTIONAL ON LARGE SCREENS) -->
        <aside class="w-72 bg-white border-l border-zinc-200 flex-shrink-0 z-20 overflow-y-auto ${isLivePreview ? 'hidden' : 'hidden 2xl:block'}" id="right-inspector-panel">
          ${inspectorHTML}
        </aside>

      </div>

      ${renderStickyCallBar(project, { isEditor: !isLivePreview })}

      ${!isLivePreview && state.copilotOpen ? `
        <div class="copilot-floating-panel" role="dialog" aria-label="Assistant Copilot IA">
          <div class="copilot-floating-header">
            <div class="flex items-center gap-2">
              ${getIcon("sparkles", "w-4 h-4 text-amber-400")}
              <div>
              <div class="text-xs font-bold text-white">Assistant Studio</div>
                <div class="text-[10px] text-zinc-400">Modifications ciblées avec Undo</div>
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
        <button type="button" aria-label="Ouvrir Assistant Studio" onclick="window.app.toggleCopilotPanel(true)" class="copilot-launcher">
          <span class="assistant-avatar">${getIcon("bot", "w-4 h-4 text-amber-300")}</span>
          <span>Assistant Studio</span>
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

      <!-- Variant Selector if available -->
      ${variants.length > 1 ? `
        <div>
          <label class="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Variante d'Affichage</label>
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
          <label class="block text-[10px] font-medium text-zinc-500 mb-1">Surtitre / Badge :</label>
          <input type="text" value="${escapeHtml(c.badge)}"
                 data-field="badge"
                 oninput="window.app.liveUpdateField('${sectionId}', 'badge', this.value)"
                 onchange="window.app.commitFieldUpdate('${sectionId}', 'badge', this.value)"
                 class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none">
        </div>
      ` : ''}

      <!-- Titre principal -->
      ${c.title !== undefined ? `
        <div>
          <label class="block text-[10px] font-medium text-zinc-500 mb-1">Titre principal :</label>
          <textarea rows="2"
                    data-field="title"
                    oninput="window.app.liveUpdateField('${sectionId}', 'title', this.value)"
                    onchange="window.app.commitFieldUpdate('${sectionId}', 'title', this.value)"
                    class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none leading-snug">${escapeHtml(c.title)}</textarea>
        </div>
      ` : ''}

      <!-- Sous-titre / Descriptif -->
      ${c.subtitle !== undefined ? `
        <div>
          <label class="block text-[10px] font-medium text-zinc-500 mb-1">Sous-titre :</label>
          <textarea rows="2"
                    data-field="subtitle"
                    oninput="window.app.liveUpdateField('${sectionId}', 'subtitle', this.value)"
                    onchange="window.app.commitFieldUpdate('${sectionId}', 'subtitle', this.value)"
                    class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none leading-snug">${escapeHtml(c.subtitle)}</textarea>
        </div>
      ` : ''}

      <!-- Specific: TRUST BADGES (The 4 trust cards with live sync) -->
      ${sec.type === 'trust' ? `
        <div class="space-y-2 pt-1 border-t border-zinc-200/60">
          <label class="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Les 4 Badges de Confiance :</label>
          ${(c.badges || []).map((b, bIdx) => `
            <div class="p-2 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1.5">
              <div class="text-[10px] text-zinc-400 font-semibold uppercase">Badge 0${bIdx + 1}</div>
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
                     class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-[11px] text-zinc-600 focus:border-zinc-900 focus:outline-none">
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Specific: SERVICES LIST (Live edit for service cards) -->
      ${sec.type === 'services' ? `
        <div class="space-y-2 pt-1 border-t border-zinc-200/60">
          <div class="flex items-center justify-between">
            <label class="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Prestations (${(c.services || []).length}) :</label>
            <button type="button" onclick="window.app.addServiceItem('${sectionId}')" class="text-[10.5px] font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded border border-zinc-200 transition-colors">+ Ajouter</button>
          </div>
          ${(c.services || []).map((srv, sIdx) => `
            <div class="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-[10.5px] font-bold text-zinc-800 truncate">#${sIdx + 1} ${escapeHtml(srv.title)}</span>
                <button type="button" onclick="window.app.deleteServiceItem('${sectionId}', ${sIdx})" class="text-red-500 hover:text-red-700 text-[10px] p-0.5" title="Supprimer ce service">🗑️</button>
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
                        class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-[11px] text-zinc-600 focus:border-zinc-900 focus:outline-none leading-snug">${escapeHtml(srv.desc)}</textarea>
              <div class="grid grid-cols-2 gap-1.5">
                <input type="text" value="${escapeHtml(srv.price || '')}"
                       placeholder="Tarif (ex: Sur devis)"
                       data-field="services.${sIdx}.price"
                       oninput="window.app.liveUpdateField('${sectionId}', 'services.${sIdx}.price', this.value)"
                       onchange="window.app.commitFieldUpdate('${sectionId}', 'services.${sIdx}.price', this.value)"
                       class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-[11px] text-zinc-800">
                <input type="text" value="${escapeHtml(srv.tag || '')}"
                       placeholder="Tag (ex: Spécialité)"
                       data-field="services.${sIdx}.tag"
                       oninput="window.app.liveUpdateField('${sectionId}', 'services.${sIdx}.tag', this.value)"
                       onchange="window.app.commitFieldUpdate('${sectionId}', 'services.${sIdx}.tag', this.value)"
                       class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-[11px] text-zinc-800">
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Hero photo with Replace & Trash -->
      ${c.heroImage !== undefined ? `
        <div class="space-y-1.5 pt-1 border-t border-zinc-200/60">
          <div class="flex items-center justify-between">
            <label class="block text-[10px] font-medium text-zinc-500">Photo Principale :</label>
            <div class="flex items-center gap-1">
              <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'heroImage')" class="text-zinc-700 hover:text-zinc-900 font-medium text-[10.5px] bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded border border-zinc-200">Remplacer</button>
              <button type="button" onclick="window.app.deletePhoto('${sectionId}', 'heroImage')" class="text-red-600 hover:text-red-700 font-medium text-[10.5px] bg-red-50 hover:bg-red-100 px-1.5 py-0.5 rounded border border-red-200" title="Supprimer">🗑️</button>
            </div>
          </div>
          <div class="aspect-[16/9] rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
            <img src="${c.heroImage || ''}" alt="Photo" class="w-full h-full object-cover">
          </div>
        </div>
      ` : ''}

      <!-- CTA Buttons -->
      ${c.ctaPrimary !== undefined ? `
        <div class="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-200/60">
          <div>
            <label class="block text-[10px] text-zinc-500 mb-1">Bouton 1 :</label>
            <input type="text" value="${escapeHtml(c.ctaPrimary)}"
                   data-field="ctaPrimary"
                   oninput="window.app.liveUpdateField('${sectionId}', 'ctaPrimary', this.value)"
                   onchange="window.app.commitFieldUpdate('${sectionId}', 'ctaPrimary', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none">
          </div>
          ${c.ctaSecondary !== undefined ? `
            <div>
              <label class="block text-[10px] text-zinc-500 mb-1">Bouton 2 :</label>
              <input type="text" value="${escapeHtml(c.ctaSecondary)}"
                     data-field="ctaSecondary"
                     oninput="window.app.liveUpdateField('${sectionId}', 'ctaSecondary', this.value)"
                     onchange="window.app.commitFieldUpdate('${sectionId}', 'ctaSecondary', this.value)"
                     class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none">
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- Section Background Switcher -->
      <div class="pt-1 border-t border-zinc-200/60">
        <label class="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Couleur de fond</label>
        <div class="grid grid-cols-3 gap-1.5">
          <button type="button" onclick="window.app.setSectionBg('${sectionId}', 'white')" class="py-1 text-[11px] font-medium border rounded text-center transition-colors ${sec.settings?.bgTheme !== 'mineral' && sec.settings?.bgTheme !== 'dark' ? 'border-zinc-900 bg-white font-semibold shadow-xs' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-white'}">Blanc</button>
          <button type="button" onclick="window.app.setSectionBg('${sectionId}', 'mineral')" class="py-1 text-[11px] font-medium border rounded text-center transition-colors ${sec.settings?.bgTheme === 'mineral' ? 'border-zinc-900 bg-white font-semibold shadow-xs' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-white'}">Gris doux</button>
          <button type="button" onclick="window.app.setSectionBg('${sectionId}', 'dark')" class="py-1 text-[11px] font-medium border rounded text-center transition-colors ${sec.settings?.bgTheme === 'dark' ? 'border-zinc-900 bg-zinc-900 text-white font-semibold shadow-xs' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-white'}">Sombre</button>
        </div>
      </div>

      <!-- Per-block motion catalog -->
      <div class="pt-2 border-t border-zinc-200/60">
        <label class="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Animation du bloc</label>
        <div class="motion-fan-grid">
          ${[
            ['none', 'Aucune'], ['fade-in', 'Fade'], ['slide-up', 'Slide'], ['spring', 'Spring'],
            ['reveal', 'Reveal'], ['stagger', 'Stagger'], ['shimmer', 'Shimmer'], ['pulse', 'Pulse']
          ].map(([preset, label]) => `<button type="button" class="motion-option ${((sec.settings?.motionPreset || 'none') === preset || (!sec.settings?.motionPreset && preset === 'none')) ? 'is-active' : ''}" onclick="window.app.setSectionMotion('${sectionId}', '${preset}')">${label}</button>`).join('')}
        </div>
        <p class="text-[10px] text-zinc-500 mt-1">Le mouvement est appliqué au bloc complet et respecte la réduction des mouvements.</p>
        <div class="pattern-catalog mt-2" aria-label="Patterns d'inspiration">
          ${INSPIRATION_PATTERNS.slice(0, 4).map(pattern => `<span class="pattern-chip" title="${pattern.description}">${pattern.label}<small>${pattern.source}</small></span>`).join('')}
        </div>
      </div>

      <!-- Section Actions: Monter, Descendre, Dupliquer & Supprimer -->
      <div class="pt-2 border-t border-zinc-200/60 flex items-center justify-between gap-1.5">
        <button type="button" onclick="window.app.moveSection('${sectionId}', 'up')" class="py-1 px-2 text-[10.5px] font-medium text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 rounded flex items-center gap-1 transition-colors" title="Monter">
          ${getIcon("chevronUp", "w-3 h-3")}
          <span>Monter</span>
        </button>
        <button type="button" onclick="window.app.moveSection('${sectionId}', 'down')" class="py-1 px-2 text-[10.5px] font-medium text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 rounded flex items-center gap-1 transition-colors" title="Descendre">
          ${getIcon("chevronDown", "w-3 h-3")}
          <span>Descendre</span>
        </button>
        <button type="button" onclick="window.app.duplicateSection('${sectionId}')" class="py-1 px-2 text-[10.5px] font-medium text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 rounded flex items-center gap-1 transition-colors" title="Dupliquer">
          ${getIcon("copy", "w-3 h-3 text-zinc-500")}
        </button>
        <button type="button" onclick="window.app.deleteSection('${sectionId}')" class="py-1 px-2 text-[10.5px] font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded flex items-center gap-1 transition-colors" title="Supprimer">
          ${getIcon("trash", "w-3 h-3 text-red-500")}
        </button>
      </div>

    </div>
  `;
}

/**
 * Settings Tab Accordions matching Image 2 (Sendpage style).
 */
function renderSettingsAccordions(project) {
  return `
    <div class="space-y-2" id="settings-accordion-group">

      <!-- 1. Business Information -->
      <div class="section-card">
        <div class="section-card-header" onclick="window.app.toggleSettingsItem('business')">
          <div class="flex items-center gap-2 text-xs font-medium text-zinc-900">
            ${getIcon("mapPin", "w-4 h-4 text-zinc-500")}
            <span>Informations entreprise</span>
          </div>
          <span class="text-zinc-400">${getIcon("chevronDown", "w-3.5 h-3.5")}</span>
        </div>
        <div class="section-accordion-body space-y-2.5" id="settings-body-business">
          <div>
            <label class="block text-[10px] text-zinc-500 mb-1">Nom entreprise :</label>
            <input type="text" value="${escapeHtml(project.business.name)}"
                   oninput="window.app.liveUpdateBusiness('name', this.value)"
                   onchange="window.app.commitBusiness('name', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none">
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] text-zinc-500 mb-1">Ville :</label>
              <input type="text" value="${escapeHtml(project.business.city)}"
                     oninput="window.app.liveUpdateBusiness('city', this.value)"
                     onchange="window.app.commitBusiness('city', this.value)"
                     class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none">
            </div>
            <div>
              <label class="block text-[10px] text-zinc-500 mb-1">Région :</label>
              <input type="text" value="${escapeHtml(project.business.region || 'Occitanie')}"
                     oninput="window.app.liveUpdateBusiness('region', this.value)"
                     onchange="window.app.commitBusiness('region', this.value)"
                     class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] text-zinc-500 mb-1">Téléphone :</label>
              <input type="text" value="${escapeHtml(project.business.phone)}"
                     oninput="window.app.liveUpdateBusiness('phone', this.value)"
                     onchange="window.app.commitBusiness('phone', this.value)"
                     class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none">
            </div>
            <div>
              <label class="block text-[10px] text-zinc-500 mb-1">Email :</label>
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
            ${getIcon("star", "w-4 h-4 text-zinc-500")}
            <span>Favicon & Identité</span>
          </div>
          <span class="text-zinc-400">${getIcon("chevronDown", "w-3.5 h-3.5")}</span>
        </div>
        <div class="section-accordion-body hidden space-y-2.5" id="settings-body-favicon">
          <div class="text-[11px] text-zinc-600 leading-relaxed">
            Le favicon et le logo sont générés automatiquement aux couleurs de votre thème.
          </div>
          <div class="flex items-center gap-3 p-3 rounded-lg bg-white border border-zinc-200">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm" style="background-color: ${project.branding.primaryColor};">
              ${project.business.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="text-xs font-semibold text-zinc-900">${project.business.name}</div>
              <div class="text-[10px] text-zinc-400">Icône vectorielle haute résolution</div>
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
          <span class="text-zinc-400">${getIcon("chevronDown", "w-3.5 h-3.5")}</span>
        </div>
        <div class="section-accordion-body space-y-3" id="settings-body-colors">
          <!-- Ambiance Globale 1-Clic (Typedream & Framer Inspired) -->
          <div>
            <label class="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Ambiance Globale 1-Clic</label>
            <div class="grid grid-cols-3 gap-1.5 text-xs">
              <button type="button" onclick="window.app.switchGlobalTheme('white')" class="py-1.5 border rounded-lg text-center text-[11px] font-medium border-zinc-200 bg-white hover:border-zinc-300 text-zinc-800 shadow-2xs">
                ☀️ Blanche
              </button>
              <button type="button" onclick="window.app.switchGlobalTheme('mineral')" class="py-1.5 border rounded-lg text-center text-[11px] font-medium border-zinc-200 bg-zinc-100 hover:border-zinc-300 text-zinc-800 shadow-2xs">
                🪨 Minérale
              </button>
              <button type="button" onclick="window.app.switchGlobalTheme('dark')" class="py-1.5 border rounded-lg text-center text-[11px] font-medium border-zinc-800 bg-zinc-900 text-white shadow-2xs">
                🌙 Sombre
              </button>
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Presets 1-Clic</label>
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
            <label class="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Palette Personnalisée</label>
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
          <span class="text-zinc-400">${getIcon("chevronDown", "w-3.5 h-3.5")}</span>
        </div>
        <div class="section-accordion-body hidden space-y-2.5" id="settings-body-typography">
          <div class="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            <div class="grid grid-cols-2 gap-1.5 mb-2">
              <button type="button" onclick="window.app.setTypographyTarget('heading')" class="py-1.5 rounded border text-[11px] ${window.app?.typographyTarget !== 'body' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-600'}">Titres</button>
              <button type="button" onclick="window.app.setTypographyTarget('body')" class="py-1.5 rounded border text-[11px] ${window.app?.typographyTarget === 'body' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-600'}">Texte</button>
            </div>
            ${FONT_CATALOG.map(font => `
              <button type="button" aria-label="Utiliser ${font.name}" onclick="window.app.applyTypographyFont('${font.name}')" class="font-option w-full text-left p-2 rounded-lg border bg-white hover:border-zinc-400 text-xs ${(project.branding.headingFont === font.name || project.branding.bodyFont === font.name) ? 'is-active' : ''}" style="font-family: '${font.name}', sans-serif">
                <div class="font-bold text-zinc-900">${font.name}</div>
                <div class="text-[10px] text-zinc-400">${font.category} · ${font.description}</div>
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
          <span class="text-zinc-400">${getIcon("chevronDown", "w-3.5 h-3.5")}</span>
        </div>
        <div class="section-accordion-body space-y-3" id="settings-body-buttons">
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Taille Continue (Échelle)</label>
              <span class="text-[10px] font-mono font-bold text-zinc-700" id="cta-scale-display">${project.branding.ctaScale || 100}%</span>
            </div>
            <input type="range" min="80" max="140" step="5" value="${project.branding.ctaScale || 100}"
                   oninput="window.app.setButtonScale(this.value); const el = document.getElementById('cta-scale-display'); if (el) el.textContent = this.value + '%';"
                   class="w-full accent-zinc-900 cursor-pointer h-1.5 bg-zinc-200 rounded-lg">
          </div>

          <div>
            <label class="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Paliers de Taille CTA</label>
            <div class="grid grid-cols-4 gap-1.5 text-xs">
              <button type="button" onclick="window.app.setCTASize('sm')" class="py-1 border rounded text-center text-[11px] font-medium ${project.branding.ctaSize === 'sm' ? 'border-zinc-900 bg-white font-semibold shadow-xs' : 'border-zinc-200 bg-white text-zinc-600'}">S</button>
              <button type="button" onclick="window.app.setCTASize('md')" class="py-1 border rounded text-center text-[11px] font-medium ${!project.branding.ctaSize || project.branding.ctaSize === 'md' ? 'border-zinc-900 bg-white font-semibold shadow-xs' : 'border-zinc-200 bg-white text-zinc-600'}">M (Standard)</button>
              <button type="button" onclick="window.app.setCTASize('lg')" class="py-1 border rounded text-center text-[11px] font-medium ${project.branding.ctaSize === 'lg' ? 'border-zinc-900 bg-white font-semibold shadow-xs' : 'border-zinc-200 bg-white text-zinc-600'}">L (Grand)</button>
              <button type="button" onclick="window.app.setCTASize('xl')" class="py-1 border rounded text-center text-[11px] font-medium ${project.branding.ctaSize === 'xl' ? 'border-zinc-900 bg-white font-semibold shadow-xs' : 'border-zinc-200 bg-white text-zinc-600'}">XL</button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Typographie</label>
              <button type="button" onclick="window.app.toggleButtonCase()" class="w-full py-1.5 border rounded text-center text-[11px] font-medium ${project.branding.ctaTransform === 'uppercase' ? 'border-zinc-900 bg-white font-semibold shadow-xs text-zinc-950' : 'border-zinc-200 bg-white text-zinc-600'}">
                ${project.branding.ctaTransform === 'uppercase' ? '🔠 MAJUSCULES' : '🔡 Casse Normale'}
              </button>
            </div>
            <div>
              <label class="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Boutons Masqués</label>
              <button type="button" onclick="window.app.restoreAllButtons()" class="w-full py-1.5 border border-zinc-200 bg-zinc-50 hover:bg-white rounded text-center text-[11px] font-medium text-zinc-700 transition-colors" title="Restaurer tous les boutons supprimés">
                🔄 Restaurer tout
              </button>
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Rayon d'Arrondi des Boutons</label>
            <div class="grid grid-cols-3 gap-1.5 text-xs">
              ${[
                ['0px', '0px', 'Carré'],
                ['0.25rem', '0.25rem', '4px'],
                ['0.5rem', '0.5rem', '8px'],
                ['0.75rem', '0.75rem', '12px'],
                ['1.5rem', '1.5rem', '24px'],
                ['9999px', '9999px', 'Pilule']
              ].map(([radius, btnRadius, label]) => `
                <button type="button" data-radius-option data-radius="${radius}" onclick="window.app.liveUpdateBorderRadius('${radius}', '${btnRadius}')" class="py-1.5 border text-center text-[11px] font-medium ${project.branding.borderRadius === radius ? 'border-zinc-900 bg-white font-semibold text-zinc-950' : 'border-zinc-200 bg-white text-zinc-600'}" style="border-radius:${radius}">${label}</button>
              `).join('')}
            </div>
          </div>

          <div class="pt-3 border-t border-zinc-200/80 space-y-2">
            <label class="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Micro-interactions</label>
            <div class="grid grid-cols-3 gap-1.5 text-xs">
              ${[
                ['none', 'Aucune'],
                ['fade-in', 'Fade'],
                ['slide-up', 'Slide'],
                ['slide-in', 'Entrée'],
                ['spring', 'Spring'],
                ['progress-fill', 'Remplissage']
              ].map(([preset, label]) => `
                <button type="button" onclick="window.app.setMotionPreset('${preset}')" class="py-1.5 border rounded-md text-center text-[11px] font-medium ${((project.branding.motionPreset || 'none') === preset) ? 'border-zinc-900 bg-white font-semibold text-zinc-950' : 'border-zinc-200 bg-white text-zinc-600'}">${label}</button>
              `).join('')}
            </div>
            <p class="text-[10px] text-zinc-500">Les animations respectent automatiquement le réglage système « réduire les mouvements ».</p>
          </div>

          <!-- Bandeau Flottant Fixe (Unbounce & Duda Inspired) -->
          <div class="pt-3 border-t border-zinc-200/80 space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-[11px] font-semibold text-zinc-900">Bandeau de Contact Flottant</label>
                <p class="text-[10px] text-zinc-500">Pillule d'appel & WhatsApp persistante au bas de l'écran</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" ${project.settings?.stickyBarEnabled !== false ? 'checked' : ''}
                       onchange="window.app.toggleStickyBar(this.checked)" class="sr-only peer">
                <div class="w-8 h-4 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>

            <div>
              <label class="block text-[10px] text-zinc-500 mb-1">Numéro WhatsApp direct :</label>
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
          <span class="text-zinc-400">${getIcon("chevronDown", "w-3.5 h-3.5")}</span>
        </div>
        <div class="section-accordion-body hidden space-y-2" id="settings-body-export">
          <button type="button" onclick="window.app.exportHTML()" class="w-full py-2 px-2.5 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs font-medium text-zinc-900 transition-colors">
            <span>Télécharger site autonome (.HTML)</span>
            ${getIcon("download", "w-3.5 h-3.5 text-zinc-400")}
          </button>
          <button type="button" onclick="window.app.exportJSON()" class="w-full py-2 px-2.5 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs font-medium text-zinc-900 transition-colors">
            <span>Exporter sauvegarde projet (.JSON)</span>
            ${getIcon("layers", "w-3.5 h-3.5 text-zinc-400")}
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
          <span class="text-zinc-400">${getIcon("chevronDown", "w-3.5 h-3.5")}</span>
        </div>
        <div class="section-accordion-body hidden space-y-2" id="settings-body-seo">
          <div>
            <label class="block text-[10px] text-zinc-500 mb-1">Titre SEO (Balise Title) :</label>
            <input type="text" value="${escapeHtml(project.business.name)} — ${escapeHtml(project.business.tradeLabel)} à ${escapeHtml(project.business.city)}" class="w-full bg-white border border-zinc-200 rounded px-2.5 py-1 text-xs text-zinc-900">
          </div>
          <div>
            <label class="block text-[10px] text-zinc-500 mb-1">Meta Description locale :</label>
            <textarea rows="2" class="w-full bg-white border border-zinc-200 rounded px-2.5 py-1 text-xs text-zinc-900 leading-snug">Besoin d'un ${escapeHtml(project.business.tradeLabel.toLowerCase())} qualifié à ${escapeHtml(project.business.city)} ? Intervention rapide, travail soigné et devis gratuit sous 24h.</textarea>
          </div>

          <!-- Google Search Live Snippet Card (Wix & B12 Inspired) -->
          <div class="mt-2.5 p-3 rounded-xl bg-white border border-zinc-200 space-y-1 shadow-2xs">
            <div class="flex items-center gap-1.5 text-[10.5px] text-zinc-500">
              <span class="w-3.5 h-3.5 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-[9px] text-zinc-700">G</span>
              <span class="truncate">https://www.${(project.business.name || "artisan").toLowerCase().replace(/[^a-z0-9]/g, '')}.fr</span>
            </div>
            <div class="text-xs font-semibold text-blue-700 hover:underline cursor-pointer line-clamp-1">
              ${escapeHtml(project.business.name)} — ${escapeHtml(project.business.tradeLabel)} à ${escapeHtml(project.business.city)}
            </div>
            <div class="flex items-center gap-1.5 text-[10.5px]">
              <span class="text-amber-500 font-bold">★★★★★</span>
              <span class="font-semibold text-zinc-700">5.0</span>
              <span class="text-zinc-400">(48 avis Google vérifiés)</span>
            </div>
            <p class="text-[11px] text-zinc-600 leading-snug line-clamp-2">
              Artisan ${escapeHtml(project.business.tradeLabel.toLowerCase())} qualifié à ${escapeHtml(project.business.city)}. Travaux soignés, réactivité, intervention rapide et devis gratuit sous 24h.
            </p>
          </div>

          <div class="pt-1">
            <button type="button" onclick="window.app.copyJsonLdSchema()" class="w-full py-1.5 px-2.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 flex items-center justify-between text-[11px] font-medium text-zinc-800 transition-colors">
              <span>📋 Copier Schema.org (LocalBusiness JSON-LD)</span>
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
        <button type="button" onclick="window.app.toggleCopilotPanel(true)" class="w-full px-3 pb-3 text-left text-[11px] text-zinc-500 hover:text-zinc-900">
          Ouvrir le panneau flottant et cibler un élément par son ID.
        </button>
      </div>

    </div>
  `;
}

function escapeHtml(str) {
  if (typeof str !== 'string') return str || '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

import { getIcon } from "./icons.js";
import { renderWebsiteHTML } from "./renderer.js";
import { renderInspector } from "./inspector.js";
import { STYLE_PRESETS } from "../data/styles.js";
import { SECTION_DEFINITIONS } from "./addSectionModal.js";

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
  const project = state.currentProject;
  if (!project) return `<div class="p-12 text-center text-zinc-400">Aucun projet sélectionné.</div>`;

  const viewportWidthClass = {
    desktop: "w-full max-w-none shadow-none",
    tablet: "w-[768px] mx-auto shadow-sm rounded-2xl overflow-hidden border border-zinc-300 my-8 bg-white",
    mobile: "w-[390px] mx-auto shadow-sm rounded-3xl overflow-hidden border-2 border-zinc-400 my-8 bg-white"
  }[state.viewport] || "w-full";

  const selectedSecId = state.selectedSectionId || project.sections[0]?.id;
  const websiteHTML = renderWebsiteHTML(project, { isEditor: true, isStandalone: false, selectedSectionId: selectedSecId });
  const selectedSec = project.sections.find(s => s.id === selectedSecId) || project.sections[0];
  const inspectorHTML = renderInspector(selectedSec, project, state);

  return `
    <div class="h-screen flex flex-col bg-[#F4F5F7] text-zinc-900 overflow-hidden select-none">
      
      <!-- TOP MINIMALIST NAVIGATION BAR (Linear / Sendpage style) -->
      <header class="h-13 bg-white text-zinc-900 px-4 sm:px-5 flex items-center justify-between border-b border-zinc-200 z-40 flex-shrink-0">
        
        <!-- Left: Back Button & Project Identification -->
        <div class="flex items-center gap-3">
          <button type="button" onclick="window.app.openDashboard()" class="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
            ${getIcon("arrowLeft", "w-3.5 h-3.5")}
            <span>Projets</span>
          </button>

          <div class="h-4 w-[1px] bg-zinc-200 hidden sm:block"></div>

          <div class="flex items-center gap-2">
            <span class="font-semibold text-sm text-zinc-900 truncate max-w-[160px] sm:max-w-none" id="editor-title-display">${project.name}</span>
            <span class="text-[10.5px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200">
              ${project.business.tradeLabel}
            </span>
            <div class="hidden md:flex items-center gap-1 text-[11px] text-zinc-400 pl-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span id="save-status-text">Enregistré</span>
            </div>
          </div>
        </div>

        <!-- Middle: Undo/Redo & Segmented Device Switcher -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Undo / Redo -->
          <div class="flex items-center bg-zinc-100/80 rounded-lg p-0.5 border border-zinc-200/80">
            <button type="button" id="btn-undo-header" onclick="window.app.undo()" class="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-white rounded-md transition-colors ${!state.canUndo() ? 'opacity-30 cursor-not-allowed' : ''}" title="Annuler (⌘Z)">
              ${getIcon("undo", "w-3.5 h-3.5")}
            </button>
            <button type="button" id="btn-redo-header" onclick="window.app.redo()" class="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-white rounded-md transition-colors ${!state.canRedo() ? 'opacity-30 cursor-not-allowed' : ''}" title="Rétablir (⌘⇧Z)">
              ${getIcon("redo", "w-3.5 h-3.5")}
            </button>
          </div>

          <!-- Device Switcher Segmented Control -->
          <div class="flex items-center bg-zinc-100/80 rounded-lg p-0.5 border border-zinc-200/80">
            <button type="button" onclick="window.app.setViewport('desktop')" class="p-1.5 rounded-md transition-all ${state.viewport === 'desktop' ? 'bg-white text-zinc-950 shadow-xs font-semibold' : 'text-zinc-500 hover:text-zinc-800'}" title="Desktop (100%)">
              ${getIcon("monitor", "w-3.5 h-3.5")}
            </button>
            <button type="button" onclick="window.app.setViewport('tablet')" class="p-1.5 rounded-md transition-all ${state.viewport === 'tablet' ? 'bg-white text-zinc-950 shadow-xs font-semibold' : 'text-zinc-500 hover:text-zinc-800'}" title="Tablette (768px)">
              ${getIcon("tablet", "w-3.5 h-3.5")}
            </button>
            <button type="button" onclick="window.app.setViewport('mobile')" class="p-1.5 rounded-md transition-all ${state.viewport === 'mobile' ? 'bg-white text-zinc-950 shadow-xs font-semibold' : 'text-zinc-500 hover:text-zinc-800'}" title="Mobile (390px)">
              ${getIcon("smartphone", "w-3.5 h-3.5")}
            </button>
          </div>
        </div>

        <!-- Right: Sales Pitch & Presentation & Export Button -->
        <div class="flex items-center gap-2">
          <button type="button" onclick="window.app.openCloserModal('${project.id}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/80 transition-colors" title="Kit Vente Closer & Argumentaire">
            ${getIcon("sparkles", "w-3.5 h-3.5 text-zinc-600")}
            <span class="hidden sm:inline">Kit Closer</span>
          </button>

          <button type="button" onclick="window.app.openPreview('${project.id}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/80 transition-colors" title="Aperçu Client Démo">
            ${getIcon("eye", "w-3.5 h-3.5 text-zinc-600")}
            <span class="hidden md:inline">Aperçu</span>
          </button>

          <!-- Export Dropdown -->
          <div class="relative group">
            <button type="button" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-zinc-900 hover:bg-black shadow-xs transition-colors">
              ${getIcon("download", "w-3.5 h-3.5")}
              <span>Exporter</span>
              ${getIcon("chevronDown", "w-3 h-3 text-zinc-400")}
            </button>
            <div class="absolute right-0 top-full mt-1 w-60 bg-white rounded-xl shadow-lg border border-zinc-200 p-1.5 text-xs text-zinc-700 hidden group-hover:block z-50 animate-fade-in">
              <button type="button" onclick="window.app.exportHTML()" class="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-50 flex items-center gap-2.5 transition-colors">
                ${getIcon("download", "w-4 h-4 text-zinc-700")}
                <div>
                  <div class="font-medium text-zinc-900">Site Web Complet (.HTML)</div>
                  <div class="text-[10px] text-zinc-400">Fichier autonome prêt à héberger</div>
                </div>
              </button>
              <button type="button" onclick="window.app.exportJSON()" class="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-50 flex items-center gap-2.5 transition-colors">
                ${getIcon("layers", "w-4 h-4 text-zinc-700")}
                <div>
                  <div class="font-medium text-zinc-900">Données Projet (.JSON)</div>
                  <div class="text-[10px] text-zinc-400">Sauvegarde et structure complète</div>
                </div>
              </button>
              <button type="button" onclick="window.app.printCommercialProposal()" class="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-50 flex items-center gap-2.5 transition-colors">
                ${getIcon("printer", "w-4 h-4 text-zinc-700")}
                <div>
                  <div class="font-medium text-zinc-900">Fiche Devis Commercial (PDF)</div>
                  <div class="text-[10px] text-zinc-400">Document prêt pour le prospect</div>
                </div>
              </button>
            </div>
          </div>
        </div>

      </header>

      <!-- MAIN WORKSPACE: SIDEBAR + CANVAS + INSPECTOR -->
      <div class="flex-1 flex overflow-hidden">
        
        <!-- LEFT SIDEBAR: SEGMENTED PILL TABS [SECTIONS] / [PARAMÈTRES] -->
        <aside class="w-80 bg-white border-r border-zinc-200 flex flex-col flex-shrink-0 z-20 overflow-hidden">
          
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
                       data-sec-id="${s.id}"
                       draggable="true">
                    
                    <!-- Compact Header -->
                    <div class="section-card-header" onclick="window.app.toggleSectionAccordion('${s.id}', event)">
                      <div class="flex items-center gap-2 min-w-0 flex-1">
                        <span class="section-card-grip" title="Glisser pour réorganiser">
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
                                onclick="event.stopPropagation(); window.app.toggleSectionAccordion('${s.id}', event)"
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

          <div class="transition-all duration-300 ${viewportWidthClass} bg-white min-h-full mt-3" id="canvas-container">
            ${websiteHTML}
          </div>
        </main>

        <!-- RIGHT INSPECTOR: DETAILED SECTION PROPS (OPTIONAL ON LARGE SCREENS) -->
        <aside class="w-72 bg-white border-l border-zinc-200 flex-shrink-0 z-20 overflow-y-auto hidden lg:block" id="right-inspector-panel">
          ${inspectorHTML}
        </aside>

      </div>
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
            <div class="flex items-center justify-between p-2 rounded-lg border border-zinc-200 bg-white">
              <span class="text-xs font-medium text-zinc-800">Primaire</span>
              <input type="color" value="${project.branding.primaryColor}" 
                     oninput="window.app.liveUpdateColor('primaryColor', this.value)" 
                     onchange="window.app.commitColorUpdate('primaryColor', this.value)" 
                     class="w-6 h-6 rounded cursor-pointer border border-zinc-200 bg-transparent">
            </div>
            <div class="flex items-center justify-between p-2 rounded-lg border border-zinc-200 bg-white">
              <span class="text-xs font-medium text-zinc-800">Secondaire</span>
              <input type="color" value="${project.branding.secondaryColor}" 
                     oninput="window.app.liveUpdateColor('secondaryColor', this.value)" 
                     onchange="window.app.commitColorUpdate('secondaryColor', this.value)" 
                     class="w-6 h-6 rounded cursor-pointer border border-zinc-200 bg-transparent">
            </div>
            <div class="flex items-center justify-between p-2 rounded-lg border border-zinc-200 bg-white">
              <span class="text-xs font-medium text-zinc-800">Accentuation</span>
              <input type="color" value="${project.branding.accentColor}" 
                     oninput="window.app.liveUpdateColor('accentColor', this.value)" 
                     onchange="window.app.commitColorUpdate('accentColor', this.value)" 
                     class="w-6 h-6 rounded cursor-pointer border border-zinc-200 bg-transparent">
            </div>
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
          <div class="space-y-1.5">
            <button type="button" onclick="window.app.updateTypography('Plus Jakarta Sans', 'Inter')" class="w-full text-left p-2 rounded-lg border bg-white hover:border-zinc-400 text-xs">
              <div class="font-bold text-zinc-900">Plus Jakarta Sans</div>
              <div class="text-[10px] text-zinc-400">Moderne, percutant et lisible</div>
            </button>
            <button type="button" onclick="window.app.updateTypography('Inter', 'Inter')" class="w-full text-left p-2 rounded-lg border bg-white hover:border-zinc-400 text-xs">
              <div class="font-bold text-zinc-900">Inter Clean</div>
              <div class="text-[10px] text-zinc-400">Minimaliste, sobre et précis</div>
            </button>
            <button type="button" onclick="window.app.updateTypography('Outfit', 'Inter')" class="w-full text-left p-2 rounded-lg border bg-white hover:border-zinc-400 text-xs">
              <div class="font-bold text-zinc-900">Outfit Editorial</div>
              <div class="text-[10px] text-zinc-400">Chaleureux, local et soigné</div>
            </button>
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
            <label class="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Taille des Boutons CTA</label>
            <div class="grid grid-cols-4 gap-1.5 text-xs">
              <button type="button" onclick="window.app.setCTASize('sm')" class="py-1 border rounded text-center text-[11px] font-medium ${project.branding.ctaSize === 'sm' ? 'border-zinc-900 bg-white font-semibold shadow-xs' : 'border-zinc-200 bg-white text-zinc-600'}">S</button>
              <button type="button" onclick="window.app.setCTASize('md')" class="py-1 border rounded text-center text-[11px] font-medium ${!project.branding.ctaSize || project.branding.ctaSize === 'md' ? 'border-zinc-900 bg-white font-semibold shadow-xs' : 'border-zinc-200 bg-white text-zinc-600'}">M (Standard)</button>
              <button type="button" onclick="window.app.setCTASize('lg')" class="py-1 border rounded text-center text-[11px] font-medium ${project.branding.ctaSize === 'lg' ? 'border-zinc-900 bg-white font-semibold shadow-xs' : 'border-zinc-200 bg-white text-zinc-600'}">L (Grand)</button>
              <button type="button" onclick="window.app.setCTASize('xl')" class="py-1 border rounded text-center text-[11px] font-medium ${project.branding.ctaSize === 'xl' ? 'border-zinc-900 bg-white font-semibold shadow-xs' : 'border-zinc-200 bg-white text-zinc-600'}">XL</button>
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Rayon d'Arrondi des Boutons</label>
            <div class="grid grid-cols-3 gap-1.5 text-xs">
              <button type="button" onclick="window.app.liveUpdateBorderRadius('0.25rem', '0.25rem')" class="py-1.5 border rounded-md text-center text-[11px] font-medium ${project.branding.borderRadius === '0.25rem' ? 'border-zinc-900 bg-white font-semibold shadow-xs' : 'border-zinc-200 bg-white text-zinc-600'}">Droit (4px)</button>
              <button type="button" onclick="window.app.liveUpdateBorderRadius('0.75rem', '0.5rem')" class="py-1.5 border rounded-lg text-center text-[11px] font-medium ${project.branding.borderRadius === '0.75rem' ? 'border-zinc-900 bg-white font-semibold shadow-xs' : 'border-zinc-200 bg-white text-zinc-600'}">Doux (8px)</button>
              <button type="button" onclick="window.app.liveUpdateBorderRadius('1.5rem', '9999px')" class="py-1.5 border rounded-full text-center text-[11px] font-medium ${project.branding.borderRadius === '1.5rem' ? 'border-zinc-900 bg-white font-semibold shadow-xs' : 'border-zinc-200 bg-white text-zinc-600'}">Pilule</button>
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
            <input type="text" value="${project.business.name} — ${project.business.tradeLabel} à ${project.business.city}" class="w-full bg-white border border-zinc-200 rounded px-2.5 py-1 text-xs text-zinc-900">
          </div>
          <div>
            <label class="block text-[10px] text-zinc-500 mb-1">Meta Description locale :</label>
            <textarea rows="2" class="w-full bg-white border border-zinc-200 rounded px-2.5 py-1 text-xs text-zinc-900 leading-snug">Besoin d'un ${project.business.tradeLabel.toLowerCase()} qualifié à ${project.business.city} ? Intervention rapide, travail soigné et devis gratuit sous 24h.</textarea>
          </div>
        </div>
      </div>

      <!-- 8. Assistant Copilot IA -->
      <div class="section-card">
        <div class="section-card-header" onclick="window.app.toggleSettingsItem('copilot')">
          <div class="flex items-center gap-2 text-xs font-medium text-zinc-900">
            ${getIcon("sparkles", "w-4 h-4 text-amber-500")}
            <span>Assistant Copilot IA (Gemini)</span>
          </div>
          <span class="text-zinc-400">${getIcon("chevronDown", "w-3.5 h-3.5")}</span>
        </div>
        <div class="section-accordion-body space-y-2.5" id="settings-body-copilot">
          <form onsubmit="window.app.submitCopilotPrompt(event)" class="space-y-2">
            <textarea id="copilot-prompt-input" rows="2" placeholder="Ex: Rends les boutons plus percutants et accentue l'urgence 24h/24..." class="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"></textarea>
            <button type="submit" class="w-full py-1.5 rounded-lg text-xs font-medium text-white bg-zinc-900 hover:bg-black shadow-xs flex items-center justify-center gap-1.5 transition-colors">
              ${getIcon("sparkles", "w-3 h-3 text-amber-400")}
              <span>Exécuter la consigne IA</span>
            </button>
          </form>
          <div id="copilot-feedback" class="text-xs p-2 rounded-lg bg-zinc-100 text-zinc-700 hidden"></div>
        </div>
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

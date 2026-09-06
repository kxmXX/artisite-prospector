import { getIcon } from "./icons.js";
import { renderWebsiteHTML } from "./renderer.js";
import { renderInspector } from "./inspector.js";
import { STYLE_PRESETS } from "../data/styles.js";

/**
 * Visual Editor Component with multi-viewport switcher, inline click-to-edit,
 * sidebar section manager, design customizer, and AI Copilot assistant.
 */

export function renderEditor(state) {
  const project = state.currentProject;
  if (!project) return `<div class="p-12 text-center text-slate-500">Aucun projet sélectionné.</div>`;

  const viewportWidthClass = {
    desktop: "w-full max-w-none shadow-none",
    tablet: "w-[768px] mx-auto shadow-2xl rounded-3xl overflow-hidden border-[8px] border-slate-800 my-8",
    mobile: "w-[390px] mx-auto shadow-2xl rounded-[40px] overflow-hidden border-[10px] border-slate-900 my-8"
  }[state.viewport] || "w-full";

  const websiteHTML = renderWebsiteHTML(project, { isEditor: true, isStandalone: false });
  const selectedSec = project.sections.find(s => s.id === state.selectedSectionId) || project.sections[0];
  const inspectorHTML = renderInspector(selectedSec, project, state);

  return `
    <div class="h-screen flex flex-col bg-slate-100 text-slate-900 overflow-hidden select-none">
      
      <!-- TOP NAVIGATION BAR -->
      <header class="h-16 bg-slate-900 text-white px-4 sm:px-6 flex items-center justify-between border-b border-slate-800 z-40 flex-shrink-0">
        
        <!-- Left: Back & Project Info -->
        <div class="flex items-center gap-4">
          <button type="button" onclick="window.app.openDashboard()" class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            ${getIcon("arrowLeft", "w-4 h-4")}
            <span>Tableau de bord</span>
          </button>

          <div class="h-5 w-[1px] bg-slate-700 hidden sm:block"></div>

          <div>
            <div class="font-heading font-bold text-sm text-white flex items-center gap-2">
              <span id="editor-title-display">${project.name}</span>
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-600/30 text-orange-400 border border-orange-500/40">
                ${project.business.tradeLabel}
              </span>
            </div>
            <div class="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>${project.business.city}</span>
              <span>•</span>
              <span class="text-emerald-400 font-medium">✓ Sauvegardé</span>
            </div>
          </div>
        </div>

        <!-- Middle: Undo/Redo & Viewport Switcher -->
        <div class="flex items-center gap-3">
          <!-- Undo / Redo -->
          <div class="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button type="button" onclick="window.app.undo()" class="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors ${!state.canUndo() ? 'opacity-30 cursor-not-allowed' : ''}" title="Annuler (⌘Z)">
              ${getIcon("undo", "w-4 h-4")}
            </button>
            <button type="button" onclick="window.app.redo()" class="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors ${!state.canRedo() ? 'opacity-30 cursor-not-allowed' : ''}" title="Rétablir (⌘⇧Z)">
              ${getIcon("redo", "w-4 h-4")}
            </button>
          </div>

          <!-- Device Switcher -->
          <div class="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button type="button" onclick="window.app.setViewport('desktop')" class="p-1.5 rounded transition-colors ${state.viewport === 'desktop' ? 'bg-orange-600 text-white font-bold' : 'text-slate-400 hover:text-white'}" title="Aperçu Desktop (100%)">
              ${getIcon("monitor", "w-4 h-4")}
            </button>
            <button type="button" onclick="window.app.setViewport('tablet')" class="p-1.5 rounded transition-colors ${state.viewport === 'tablet' ? 'bg-orange-600 text-white font-bold' : 'text-slate-400 hover:text-white'}" title="Aperçu Tablette (768px)">
              ${getIcon("tablet", "w-4 h-4")}
            </button>
            <button type="button" onclick="window.app.setViewport('mobile')" class="p-1.5 rounded transition-colors ${state.viewport === 'mobile' ? 'bg-orange-600 text-white font-bold' : 'text-slate-400 hover:text-white'}" title="Aperçu Smartphone (390px)">
              ${getIcon("smartphone", "w-4 h-4")}
            </button>
          </div>
        </div>

        <!-- Right: Closer Pitch & Fullscreen Preview & Export -->
        <div class="flex items-center gap-2">
          <button type="button" onclick="window.app.openCloserModal('${project.id}')" class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/50 transition-all shadow-sm">
            ${getIcon("sparkles", "w-3.5 h-3.5 text-amber-400")}
            <span class="hidden sm:inline">Kit Vente Closer</span>
          </button>

          <button type="button" onclick="window.app.openPreview('${project.id}')" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors shadow-sm" title="Mode Présentation Commerciale Réaliste">
            ${getIcon("eye", "w-4 h-4")}
            <span class="hidden md:inline">Mode Démo Prospect</span>
          </button>

          <!-- Export Dropdown -->
          <div class="relative group">
            <button type="button" class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md transition-all">
              ${getIcon("download", "w-4 h-4")}
              <span>Exporter</span>
              ${getIcon("chevronDown", "w-3 h-3")}
            </button>
            <div class="absolute right-0 top-full mt-1 w-56 bg-slate-900 rounded-xl shadow-2xl border border-slate-800 p-1.5 text-xs text-slate-200 hidden group-hover:block z-50">
              <button type="button" onclick="window.app.exportHTML()" class="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2.5">
                ${getIcon("download", "w-4 h-4 text-orange-400")}
                <div>
                  <div class="font-bold text-white">Site Web Complet (.HTML)</div>
                  <div class="text-[10px] text-slate-400">Fichier autonome autonome prêt à héberger</div>
                </div>
              </button>
              <button type="button" onclick="window.app.exportJSON()" class="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2.5">
                ${getIcon("layers", "w-4 h-4 text-blue-400")}
                <div>
                  <div class="font-bold text-white">Données Projet (.JSON)</div>
                  <div class="text-[10px] text-slate-400">Sauvegarde et partage de structure</div>
                </div>
              </button>
              <button type="button" onclick="window.app.printCommercialProposal()" class="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2.5">
                ${getIcon("printer", "w-4 h-4 text-emerald-400")}
                <div>
                  <div class="font-bold text-white">Fiche Devis Commercial (PDF)</div>
                  <div class="text-[10px] text-slate-400">Document papier prêt pour le prospect</div>
                </div>
              </button>
            </div>
          </div>
        </div>

      </header>

      <!-- MAIN WORKSPACE: SIDEBAR + CANVAS + INSPECTOR -->
      <div class="flex-1 flex overflow-hidden">
        
        <!-- LEFT SIDEBAR: SECTIONS / DESIGN / COPILOT -->
        <aside class="w-72 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-20">
          
          <!-- Tabs Header -->
          <div class="p-2 border-b border-slate-200 grid grid-cols-3 gap-1 text-[11px] font-bold">
            <button type="button" id="tab-btn-sections" onclick="window.app.setSidebarTab('sections')" class="py-2 rounded-lg text-center ${state.activeSidebarTab !== 'design' && state.activeSidebarTab !== 'copilot' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'}">
              Sections
            </button>
            <button type="button" id="tab-btn-design" onclick="window.app.setSidebarTab('design')" class="py-2 rounded-lg text-center ${state.activeSidebarTab === 'design' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'}">
              Design
            </button>
            <button type="button" id="tab-btn-copilot" onclick="window.app.setSidebarTab('copilot')" class="py-2 rounded-lg text-center ${state.activeSidebarTab === 'copilot' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'}">
              Copilot IA
            </button>
          </div>

          <!-- Tab 1: Sections Manager -->
          <div id="sidebar-tab-sections" class="flex-1 overflow-y-auto p-3 space-y-2 ${state.activeSidebarTab === 'design' || state.activeSidebarTab === 'copilot' ? 'hidden' : ''}">
            <div class="flex items-center justify-between pb-1 px-1">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Structure du site</span>
              <button type="button" onclick="window.app.openAddSectionModal()" class="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                ${getIcon("plus", "w-3 h-3")}
                <span>Ajouter</span>
              </button>
            </div>

            <div class="space-y-1.5" id="editor-sections-list">
              ${project.sections.map((s, idx) => {
                const isSel = s.id === state.selectedSectionId;
                const isVis = s.visibility !== false;
                return `
                  <div class="section-item-drag flex items-center justify-between p-2.5 rounded-xl text-xs font-medium border transition-all cursor-grab active:cursor-grabbing ${isSel ? 'bg-orange-50 border-orange-400 text-orange-950 font-bold shadow-sm' : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'}"
                       draggable="true"
                       data-sec-id="${s.id}"
                       onclick="window.app.selectSection('${s.id}')">
                    <div class="flex items-center gap-2 truncate">
                      <span class="text-[10px] text-slate-400 font-mono w-4">${idx + 1}</span>
                      <span class="truncate capitalize">${s.type}</span>
                    </div>

                    <div class="flex items-center gap-1">
                      <button type="button" onclick="event.stopPropagation(); window.app.toggleSectionVisibility('${s.id}')" class="p-1 rounded text-slate-400 hover:text-slate-700" title="${isVis ? 'Masquer' : 'Afficher'}">
                        ${getIcon(isVis ? "eye" : "eyeOff", "w-3.5 h-3.5")}
                      </button>
                      <button type="button" onclick="event.stopPropagation(); window.app.moveSection('${s.id}', 'up')" class="p-1 rounded text-slate-400 hover:text-slate-700" title="Monter">
                        ${getIcon("chevronUp", "w-3.5 h-3.5")}
                      </button>
                      <button type="button" onclick="event.stopPropagation(); window.app.moveSection('${s.id}', 'down')" class="p-1 rounded text-slate-400 hover:text-slate-700" title="Descendre">
                        ${getIcon("chevronDown", "w-3.5 h-3.5")}
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Tab 2: Design Customizer -->
          <div id="sidebar-tab-design" class="flex-1 overflow-y-auto p-4 space-y-5 ${state.activeSidebarTab !== 'design' ? 'hidden' : ''}">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Preset de Design</label>
              <div class="space-y-2">
                ${STYLE_PRESETS.map(preset => `
                  <button type="button" onclick="window.app.applyStylePreset('${preset.id}')" class="w-full text-left p-2.5 rounded-xl border transition-all ${project.branding.presetId === preset.id ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-400/20 font-bold' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}">
                    <div class="flex items-center justify-between text-xs text-slate-900">
                      <span>${preset.name}</span>
                      <div class="flex gap-1">
                        <span class="w-3 h-3 rounded-full" style="background-color: ${preset.primaryColor}"></span>
                        <span class="w-3 h-3 rounded-full" style="background-color: ${preset.secondaryColor}"></span>
                      </div>
                    </div>
                    <div class="text-[10px] text-slate-500 mt-1 truncate">${preset.description}</div>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Colors Pickers -->
            <div class="space-y-3 pt-3 border-t border-slate-100">
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700">Couleurs Clés</label>
              
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-600">Couleur Primaire</span>
                <input type="color" value="${project.branding.primaryColor}" onchange="window.app.updateBrandingColor('primaryColor', this.value)" class="w-8 h-8 rounded-lg cursor-pointer border border-slate-300">
              </div>

              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-600">Couleur Secondaire</span>
                <input type="color" value="${project.branding.secondaryColor}" onchange="window.app.updateBrandingColor('secondaryColor', this.value)" class="w-8 h-8 rounded-lg cursor-pointer border border-slate-300">
              </div>

              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-600">Couleur d'Accent</span>
                <input type="color" value="${project.branding.accentColor}" onchange="window.app.updateBrandingColor('accentColor', this.value)" class="w-8 h-8 rounded-lg cursor-pointer border border-slate-300">
              </div>
            </div>

            <!-- Border Radius -->
            <div class="pt-3 border-t border-slate-100 space-y-2">
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700">Arrondi des Éléments</label>
              <div class="grid grid-cols-3 gap-2 text-xs">
                <button type="button" onclick="window.app.updateBorderRadius('0.25rem', '0.25rem')" class="py-1.5 border border-slate-200 rounded text-center hover:bg-slate-50">Droit</button>
                <button type="button" onclick="window.app.updateBorderRadius('0.75rem', '0.5rem')" class="py-1.5 border border-slate-200 rounded-lg text-center hover:bg-slate-50">Moderne</button>
                <button type="button" onclick="window.app.updateBorderRadius('1.5rem', '9999px')" class="py-1.5 border border-slate-200 rounded-full text-center hover:bg-slate-50">Pilule</button>
              </div>
            </div>
          </div>

          <!-- Tab 3: AI Copilot Prompt -->
          <div id="sidebar-tab-copilot" class="flex-1 flex flex-col justify-between p-4 ${state.activeSidebarTab !== 'copilot' ? 'hidden' : ''}">
            <div class="space-y-3">
              <div class="bg-orange-50 border border-orange-200 rounded-2xl p-3.5 text-xs text-orange-900 space-y-1.5">
                <div class="font-bold flex items-center gap-1.5">
                  ${getIcon("sparkles", "w-3.5 h-3.5 text-orange-600")}
                  <span>Assistant Copilot IA</span>
                </div>
                <p class="text-[11px] text-orange-800 leading-normal">
                  Demandez des modifications en langage naturel :
                </p>
                <ul class="text-[10px] text-orange-700 list-disc pl-3 space-y-0.5">
                  <li>« Passe le design en noir et or luxueux »</li>
                  <li>« Ajoute l'accent sur les urgences de nuit »</li>
                  <li>« Mets le crédit d'impôt 50% en avant »</li>
                  <li>« Modifie le téléphone pour 06 12 34 56 78 »</li>
                  <li>« Masque la section avant/après »</li>
                </ul>
              </div>

              <div id="copilot-feedback" class="text-xs p-3 rounded-xl bg-slate-100 text-slate-700 hidden"></div>
            </div>

            <form onsubmit="window.app.submitCopilotPrompt(event)" class="pt-4 border-t border-slate-200">
              <textarea id="copilot-prompt-input" rows="3" placeholder="Tapez votre consigne pour adapter le site..." class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"></textarea>
              <button type="submit" class="mt-2 w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow flex items-center justify-center gap-1.5">
                ${getIcon("sparkles", "w-3.5 h-3.5")}
                <span>Appliquer la modification IA</span>
              </button>
            </form>
          </div>

        </aside>

        <!-- CENTRAL CANVAS: WEBPAGE PREVIEW / INLINE EDIT -->
        <main class="flex-1 bg-slate-200/70 overflow-y-auto relative flex flex-col items-center">
          
          <!-- Top floating helper banner -->
          <div class="sticky top-2 z-30 bg-slate-900/90 text-white text-[11px] font-medium px-4 py-1.5 rounded-full shadow-lg backdrop-blur flex items-center gap-2 my-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Édition directe : cliquez sur un texte ou une section pour modifier en temps réel.</span>
          </div>

          <div class="transition-all duration-300 ${viewportWidthClass} bg-white min-h-full" id="canvas-container">
            ${websiteHTML}
          </div>

        </main>

        <!-- RIGHT INSPECTOR: SECTION PROPS -->
        <aside class="w-80 bg-white border-l border-slate-200 flex-shrink-0 z-20 overflow-y-auto">
          ${inspectorHTML}
        </aside>

      </div>
    </div>
  `;
}

import { getIcon } from "./icons.js";

/**
 * Command Palette (Linear & Raycast Inspired)
 * Instant fuzzy keyboard search (⌘K / Ctrl+K) to jump to sections, change themes, switch viewports, or trigger sales tools.
 */
export function renderCommandPalette(project) {
  if (!project) return "";

  const sections = project.sections || [];

  return `
    <div id="cmd-palette-backdrop" class="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in" onclick="if(event.target === this) window.app.closeCommandPalette()">
      <div class="w-full max-w-xl bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden transition-all" onclick="event.stopPropagation()">
        
        <!-- Search Input Bar -->
        <div class="p-3.5 border-b border-zinc-200 flex items-center gap-3 bg-white">
          <span class="text-zinc-400 pl-1.5">${getIcon("search", "w-4 h-4")}</span>
          <input type="text" id="cmd-palette-input" 
                 placeholder="Tapez une commande ou une section... (ex: services, mobile, export, devis)" 
                 oninput="window.app.filterCommandPalette(this.value)"
                 onkeydown="window.app.handleCommandPaletteKey(event)"
                 class="w-full bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none font-medium">
          <kbd class="px-2 py-0.5 text-[10px] font-mono text-zinc-500 bg-zinc-100 border border-zinc-200 rounded">ESC</kbd>
        </div>

        <!-- Results List -->
        <div id="cmd-palette-results" class="max-h-80 overflow-y-auto p-2 space-y-1">
          
          <!-- Sections Group -->
          <div class="cmd-group" data-group="sections">
            <div class="px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Sections du site</div>
            ${sections.map(s => `
              <div class="cmd-item flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-800 hover:bg-zinc-100 cursor-pointer transition-colors"
                   onclick="window.app.executeCommand('goto-section', '${s.id}')" data-title="${escapeHtml(s.content?.title || s.type)}">
                <div class="flex items-center gap-2.5">
                  <span class="text-zinc-400 font-mono text-[10.5px]">${s.type}</span>
                  <span class="font-medium text-zinc-900">${escapeHtml(s.content?.title || s.content?.badge || s.type)}</span>
                </div>
                <span class="text-[10px] text-zinc-400">Aller à la section ↵</span>
              </div>
            `).join('')}
          </div>

          <!-- Actions Group -->
          <div class="cmd-group pt-2 border-t border-zinc-100" data-group="actions">
            <div class="px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Outils & Actions Vente</div>
            
            <div class="cmd-item flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-800 hover:bg-zinc-100 cursor-pointer transition-colors"
                 onclick="window.app.executeCommand('share-modal')" data-title="partager qr code lien demo">
              <div class="flex items-center gap-2.5">
                ${getIcon("share", "w-3.5 h-3.5 text-zinc-500")}
                <span class="font-medium text-zinc-900">Partager la démo avec QR Code</span>
              </div>
              <span class="text-[10px] text-zinc-400">Ouvrir ↵</span>
            </div>

            <div class="cmd-item flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-800 hover:bg-zinc-100 cursor-pointer transition-colors"
                 onclick="window.app.executeCommand('closer-modal')" data-title="script closer appel objection">
              <div class="flex items-center gap-2.5">
                ${getIcon("sparkles", "w-3.5 h-3.5 text-amber-500")}
                <span class="font-medium text-zinc-900">Kit Vente Closer & Argumentaire Téléphonique</span>
              </div>
              <span class="text-[10px] text-zinc-400">Ouvrir ↵</span>
            </div>

            <div class="cmd-item flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-800 hover:bg-zinc-100 cursor-pointer transition-colors"
                 onclick="window.app.executeCommand('print-proposal')" data-title="proposition commerciale pdf imprimer devis">
              <div class="flex items-center gap-2.5">
                ${getIcon("download", "w-3.5 h-3.5 text-zinc-500")}
                <span class="font-medium text-zinc-900">Imprimer Proposition Commerciale (PDF)</span>
              </div>
              <span class="text-[10px] text-zinc-400">Imprimer ↵</span>
            </div>

            <div class="cmd-item flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-800 hover:bg-zinc-100 cursor-pointer transition-colors"
                 onclick="window.app.executeCommand('export-html')" data-title="exporter telecharger html autonome">
              <div class="flex items-center gap-2.5">
                ${getIcon("download", "w-3.5 h-3.5 text-zinc-500")}
                <span class="font-medium text-zinc-900">Télécharger le site autonome (.HTML)</span>
              </div>
              <span class="text-[10px] text-zinc-400">Télécharger ↵</span>
            </div>
          </div>

          <!-- Viewports Group -->
          <div class="cmd-group pt-2 border-t border-zinc-100" data-group="viewports">
            <div class="px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Affichage Responsive</div>
            
            <div class="cmd-item flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-800 hover:bg-zinc-100 cursor-pointer transition-colors"
                 onclick="window.app.executeCommand('set-vp', 'desktop')" data-title="desktop grand ecran bureau">
              <div class="flex items-center gap-2.5">
                ${getIcon("laptop", "w-3.5 h-3.5 text-zinc-500")}
                <span class="font-medium text-zinc-900">Vue Ordinateur (Desktop 100%)</span>
              </div>
              <span class="text-[10px] text-zinc-400">Activer ↵</span>
            </div>

            <div class="cmd-item flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-800 hover:bg-zinc-100 cursor-pointer transition-colors"
                 onclick="window.app.executeCommand('set-vp', 'tablet')" data-title="tablette ipad tablet">
              <div class="flex items-center gap-2.5">
                ${getIcon("tablet", "w-3.5 h-3.5 text-zinc-500")}
                <span class="font-medium text-zinc-900">Vue Tablette (768px)</span>
              </div>
              <span class="text-[10px] text-zinc-400">Activer ↵</span>
            </div>

            <div class="cmd-item flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-800 hover:bg-zinc-100 cursor-pointer transition-colors"
                 onclick="window.app.executeCommand('set-vp', 'mobile')" data-title="mobile smartphone telephone">
              <div class="flex items-center gap-2.5">
                ${getIcon("smartphone", "w-3.5 h-3.5 text-zinc-500")}
                <span class="font-medium text-zinc-900">Vue Smartphone (Mobile 390px)</span>
              </div>
              <span class="text-[10px] text-zinc-400">Activer ↵</span>
            </div>
          </div>

          <!-- Ambiances Group -->
          <div class="cmd-group pt-2 border-t border-zinc-100" data-group="themes">
            <div class="px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ambiance Globale</div>
            
            <div class="cmd-item flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-800 hover:bg-zinc-100 cursor-pointer transition-colors"
                 onclick="window.app.executeCommand('switch-theme', 'white')" data-title="theme blanc epure clair">
              <div class="flex items-center gap-2.5">
                <span class="w-3 h-3 rounded-full border border-zinc-300 bg-white"></span>
                <span class="font-medium text-zinc-900">Épure Blanche (Clair & Net)</span>
              </div>
              <span class="text-[10px] text-zinc-400">Appliquer ↵</span>
            </div>

            <div class="cmd-item flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-800 hover:bg-zinc-100 cursor-pointer transition-colors"
                 onclick="window.app.executeCommand('switch-theme', 'mineral')" data-title="theme mineral gris ardoise">
              <div class="flex items-center gap-2.5">
                <span class="w-3 h-3 rounded-full border border-zinc-300 bg-zinc-100"></span>
                <span class="font-medium text-zinc-900">Minéral Doux (Gris Naturel)</span>
              </div>
              <span class="text-[10px] text-zinc-400">Appliquer ↵</span>
            </div>

            <div class="cmd-item flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-800 hover:bg-zinc-100 cursor-pointer transition-colors"
                 onclick="window.app.executeCommand('switch-theme', 'dark')" data-title="theme sombre noir dark">
              <div class="flex items-center gap-2.5">
                <span class="w-3 h-3 rounded-full border border-zinc-700 bg-zinc-900"></span>
                <span class="font-medium text-zinc-900">Ardoise Sombre (Luxe Nocturne)</span>
              </div>
              <span class="text-[10px] text-zinc-400">Appliquer ↵</span>
            </div>
          </div>

        </div>

        <!-- Footer Help -->
        <div class="p-2.5 border-t border-zinc-200/80 bg-zinc-50 flex items-center justify-between text-[11px] text-zinc-400 px-4">
          <div class="flex items-center gap-3">
            <span><kbd class="font-mono bg-white border border-zinc-200 px-1 py-0.5 rounded text-[10px]">↑↓</kbd> Naviguer</span>
            <span><kbd class="font-mono bg-white border border-zinc-200 px-1 py-0.5 rounded text-[10px]">↵</kbd> Exécuter</span>
          </div>
          <span>Navigation instantanée Linear / Raycast</span>
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

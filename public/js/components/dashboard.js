import { getIcon } from "./icons.js";
import { getTradeFallbackDataUrl } from "../data/imageFallbacks.js";
import { APP_VERSION } from "../version.js";

/**
 * 2026 Flagship SaaS Cockpit & Prospector CRM for Michel.
 * Linear / Raycast / Supabase aesthetic: crisp micro-borders, deep obsidian & quartz palette,
 * instant 1-click prompt suggestion chips, live generation bar, real-time KPI metrics,
 * and high-fidelity project cards with tactile keycaps.
 */
export function renderDashboard(state) {
  const projects = state.projects || [];
  
  // Pipeline metrics
  const total = projects.length;
  const contacted = projects.filter(p => p.pipelineStatus === "contacted" || p.pipelineStatus === "demo_sent").length;
  const won = projects.filter(p => p.pipelineStatus === "won").length;
  const conversionRate = total ? Math.round(won / total * 100) : 0;
  const valuedProjects = projects.filter(p => Number.isFinite(p.estimatedValue) && p.estimatedValue >= 0);
  const potentialRevenue = valuedProjects.reduce((sum, p) => sum + p.estimatedValue, 0);

  const projectCardsHTML = projects.map(p => {
    const bus = p.business || {};
    const tradeId = bus.tradeId || "paysagiste";
    const statusMap = {
      prospect: { label: "À Contacter", color: "bg-zinc-100 text-zinc-700 border-zinc-200" },
      generated: { label: "Site Prêt", color: "bg-blue-50 text-blue-700 border-blue-200" },
      contacted: { label: "En Prospection", color: "bg-amber-50 text-amber-800 border-amber-200" },
      demo_sent: { label: "Démo Partagée", color: "bg-purple-50 text-purple-700 border-purple-200" },
      won: { label: "Client Signé ✓", color: "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold" }
    };
    const st = statusMap[p.pipelineStatus] || statusMap.generated;
    const fallbackImage = getTradeFallbackDataUrl(tradeId, "hero", p.name);
    const heroImage = p.sections?.find(s => s.type === "hero")?.content?.heroImage || fallbackImage;
    const activeSecCount = p.sections?.filter(s => s.visibility !== false).length || 0;
    const totalSecCount = p.sections?.length || 0;

    return `
      <div class="bg-white rounded-2xl border border-zinc-200/90 hover:border-zinc-400/80 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group relative" data-project-id="${p.id}" data-pipeline-status="${p.pipelineStatus || 'generated'}">
        <!-- Thumbnail Preview Header with PC Proportions -->
        <div class="h-44 sm:h-48 relative overflow-hidden bg-zinc-950 cursor-pointer" onclick="window.app.openEditor('${p.id}')">
          <img src="${heroImage}" data-fallback-src="${fallbackImage}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" onerror="if(!this.dataset.fallbackApplied){this.dataset.fallbackApplied='true';this.src=this.dataset.fallbackSrc;}">
          <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
          
          <div class="absolute top-3.5 left-3.5 flex items-center gap-2">
            <span class="text-[11px] font-semibold px-2.5 py-1 rounded-md border ${st.color} backdrop-blur-md bg-white/95 shadow-xs">
              ${st.label}
            </span>
            ${p.aiGenerated ? `
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-900/90 text-amber-300 border border-amber-400/30 backdrop-blur-md flex items-center gap-1">
                ${getIcon("sparkles", "w-3 h-3 text-amber-400")}
                <span>IA</span>
              </span>
            ` : ''}
          </div>

          <div class="absolute bottom-3.5 left-3.5 right-3.5 text-white">
            <h3 class="font-bold text-base sm:text-lg truncate tracking-tight">${p.name}</h3>
            <div class="flex items-center gap-2 text-xs text-zinc-300 mt-1 font-medium">
              <span class="text-zinc-200 font-semibold">${bus.tradeLabel || 'Artisan'}</span>
              <span>•</span>
              <span class="flex items-center gap-1">${getIcon("mapPin", "w-3.5 h-3.5 text-zinc-300")} ${bus.city || 'France'}</span>
            </div>
          </div>
        </div>

        <!-- Project Details Body -->
        <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div class="space-y-2 text-xs text-zinc-600">
            <div class="flex items-center justify-between">
              <span class="text-zinc-400 font-medium">Téléphone :</span>
              <span class="font-semibold text-zinc-800 font-mono">${bus.phone || 'Non renseigné'}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-zinc-400 font-medium">Sections actives :</span>
              <span class="font-semibold text-zinc-800">${activeSecCount} / ${totalSecCount} sections</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-zinc-400 font-medium">Style :</span>
              <span class="font-medium text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">${p.branding?.presetName || 'Standard'}</span>
            </div>
          </div>

          <!-- Action Buttons with Tactile Keycap Aesthetics -->
          <div class="pt-3.5 border-t border-zinc-100 flex items-center justify-between gap-2">
            ${p.id === 'proj-esprit-nature' ? `
              <button type="button" onclick="window.app.openPreview('${p.id}')" class="flex-1 btn-keycap bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all" title="Ouvrir la Vitrine Sendpage">
                ${getIcon("eye", "w-3.5 h-3.5")}
                <span>Voir Vitrine</span>
              </button>
              <button type="button" onclick="window.app.openEditor('${p.id}')" class="btn-keycap btn-keycap-dark inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white shadow-xs" title="Éditeur">
                ${getIcon("edit", "w-3.5 h-3.5")}
                <span>Éditer</span>
              </button>
              <button type="button" onclick="window.app.resetDemoProject()" class="btn-keycap btn-keycap-light p-2 rounded-xl text-amber-600 hover:text-amber-800 border border-zinc-200" title="Réinitialiser Démo Sendpage">
                ⚡
              </button>
            ` : `
              <button type="button" onclick="window.app.openEditor('${p.id}')" class="flex-1 btn-keycap btn-keycap-dark inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:bg-zinc-900 transition-colors">
                ${getIcon("edit", "w-3.5 h-3.5")}
                <span>Éditeur</span>
              </button>
              <button type="button" onclick="window.app.openPreview('${p.id}')" class="btn-keycap btn-keycap-light p-2 rounded-xl text-zinc-600 hover:text-zinc-900 border border-zinc-200" title="Aperçu Client Démo">
                ${getIcon("eye", "w-4 h-4")}
              </button>
            `}

            <button type="button" onclick="window.app.openCloserModal('${p.id}')" class="btn-keycap btn-keycap-light inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-800 border border-zinc-200 hover:bg-zinc-100" title="Kit de Vente & Script Appel">
              ${getIcon("sparkles", "w-3.5 h-3.5 text-amber-500")}
              <span>Pitch</span>
            </button>

            <button type="button" onclick="window.app.duplicateProject('${p.id}')" class="btn-keycap btn-keycap-light p-2 rounded-xl text-zinc-600 hover:text-zinc-900 border border-zinc-200" title="Dupliquer">
              ${getIcon("copy", "w-4 h-4")}
            </button>

            <button type="button" onclick="window.app.deleteProject('${p.id}')" class="btn-keycap btn-keycap-danger p-2 rounded-xl text-white" title="Supprimer">
              ${getIcon("trash", "w-4 h-4")}
            </button>
          </div>

        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="artist-dashboard min-h-screen bg-[#F8F9FA] text-zinc-900 selection:bg-zinc-900 selection:text-white">
      
      <!-- Top Global Bar (Linear / Raycast 2026 Tier) -->
      <nav class="bg-white/85 backdrop-blur-md border-b border-zinc-200/80 sticky top-0 z-30 transition-all">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          <div class="flex items-center gap-3.5">
            <div class="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-white font-bold text-lg shadow-sm ring-1 ring-black/5">
              ⚡
            </div>
            <div>
              <div class="font-extrabold text-sm sm:text-base text-zinc-950 tracking-tight flex items-center gap-2">
                <span>ARTISITE PROSPECTOR</span>
                <span class="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 tracking-wider px-2 py-0.5 rounded-full">v${APP_VERSION}</span>
              </div>
              <div class="text-[11.5px] text-zinc-500 hidden sm:block font-medium">Studio de prospection commerciale ultra-rapide pour artisans</div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="relative hidden sm:block">
              <input type="text" id="project-search" oninput="window.app.filterProjects(this.value)" placeholder="Filtrer un artisan, ville..." class="w-64 bg-zinc-100/80 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all">
            </div>

            <button type="button" id="theme-mode-toggle-btn" aria-pressed="${state.themeMode === 'dark'}" onclick="window.app.toggleThemeMode()" class="btn-keycap btn-keycap-light inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 cursor-pointer border border-zinc-200" title="Basculer le mode sombre de l'interface" aria-label="Basculer le mode sombre de l'interface">
              ${state.themeMode === 'dark' ? getIcon("sun", "w-4 h-4 text-amber-400") : getIcon("moon", "w-4 h-4 text-zinc-600")}
              <span class="hidden sm:inline">${state.themeMode === 'dark' ? 'Mode Jour' : 'Mode Nuit'}</span>
            </button>

            <button type="button" onclick="window.app.openVitrineDemo()" class="btn-keycap bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all" title="Ouvrir directement la vitrine Sendpage sans aucun éditeur">
              ${getIcon('eye', 'w-4 h-4')}
              <span class="hidden md:inline">Voir la vitrine d’exemple</span>
              <span class="md:hidden">Vitrine Démo</span>
            </button>

            <button type="button" onclick="window.app.openWizard()" class="btn-keycap btn-keycap-accent inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-xs">
              ${getIcon("plus", "w-4 h-4")}
              <span>Nouveau prospect</span>
            </button>

          </div>

        </div>
      </nav>

      <!-- Main Dashboard Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <!-- Welcome Cockpit Hero with Instant Generator Bar -->
        <div class="bg-gradient-to-b from-white to-zinc-50/70 rounded-3xl p-6 sm:p-9 border border-zinc-200/90 shadow-xs relative overflow-hidden">
          <div class="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-100/40 via-amber-100/20 to-transparent -mr-20 -mt-20 rounded-full pointer-events-none"></div>

          <div class="max-w-3xl space-y-3 relative z-10">
            
            <h1 class="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 leading-tight">
              Créez un site à l’image de votre artisan.
            </h1>
            
            <p class="text-zinc-600 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
              Renseignez son nom, son métier et sa ville. Vous obtenez une première version à personnaliser : textes, photos, couleurs et sections. Vérifiez les informations avant de la partager.
            </p>
          </div>

          <!-- Instant Inline Quick Generator Form (Immunized against flex squash) -->
          <div class="mt-6 pt-6 border-t border-zinc-200/70 relative z-10">
            <form id="quick-gen-form" onsubmit="event.preventDefault(); window.app.handleQuickGenerate(event);" class="quick-gen-bar flex flex-col md:flex-row items-stretch md:items-center gap-2 p-2 bg-white rounded-2xl border border-zinc-200/90 shadow-sm">
              <div class="quick-gen-field-name flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-50/90 hover:bg-zinc-100/80 focus-within:bg-white border border-zinc-200/80 focus-within:border-zinc-900 transition-all flex-1 min-w-[240px]">
                <span class="text-zinc-400 select-none flex-shrink-0">${getIcon("edit", "w-4 h-4 text-zinc-400")}</span>
                <input type="text" id="quick-gen-name" aria-label="Nom de l’entreprise" maxlength="120" required placeholder="Nom de l’entreprise" class="w-full min-w-0 bg-transparent border-0 py-1.5 text-xs sm:text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 placeholder:font-normal focus:outline-none">
              </div>
              
              <div class="quick-gen-field-trade flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-50/90 hover:bg-zinc-100/80 focus-within:bg-white border border-zinc-200/80 focus-within:border-zinc-900 transition-all w-full md:w-64 min-w-[210px]">
                <select id="quick-gen-trade" aria-label="Métier" class="w-full min-w-0 bg-transparent border-0 py-1.5 text-xs sm:text-sm font-semibold text-zinc-800 focus:outline-none cursor-pointer">
                  <option value="paysagiste">🌿 Paysagiste / Jardinier</option>
                  <option value="peintre" selected>🎨 Peintre en Bâtiment</option>
                  <option value="plombier">🔧 Plombier Chauffagiste</option>
                  <option value="menuisier">🪚 Menuisier / Ébéniste</option>
                  <option value="electricien">⚡ Électricien</option>
                  <option value="couvreur">🏠 Couvreur / Zingueur</option>
                  <option value="macon">🧱 Maçon / Rénovation</option>
                  <option value="restaurateur">🍽️ Restaurant / Bistro</option>
                  <option value="coiffeur">✂️ Salon de Coiffure</option>
                </select>
              </div>

              <div class="quick-gen-field-city flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-50/90 hover:bg-zinc-100/80 focus-within:bg-white border border-zinc-200/80 focus-within:border-zinc-900 transition-all w-full md:w-44 min-w-[140px]">
                <span class="text-zinc-400 select-none flex-shrink-0">${getIcon("mapPin", "w-4 h-4 text-zinc-400")}</span>
                <input type="text" id="quick-gen-city" aria-label="Ville" maxlength="120" required placeholder="Ville" value="Paris" class="w-full min-w-0 bg-transparent border-0 py-1.5 text-xs sm:text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none">
              </div>

              <div class="quick-gen-field-btn flex-shrink-0">
                <button type="submit" class="btn-keycap btn-keycap-dark px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white whitespace-nowrap flex items-center justify-center gap-2 shadow-sm hover:bg-black transition-colors w-full md:w-auto cursor-pointer">
                  <span>Créer le site</span>
                </button>
              </div>
            </form>

            <!-- 1-Click Suggestion Chips (Linear/Raycast style) -->
            <div class="mt-3.5 flex items-center gap-2 flex-wrap">
              <span class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Suggestions en 1 clic :</span>
              <button type="button" onclick="window.app.fillQuickGen('Atelier Peinture Parisienne', 'peintre', 'Paris')" class="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 text-[11px] font-medium text-zinc-800 transition-colors border border-zinc-200/80">
                🎨 Atelier Peinture (Peintre • Paris)
              </button>
              <button type="button" onclick="window.app.fillQuickGen('Esprit Nature', 'paysagiste', 'Montauban')" class="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 text-[11px] font-medium text-zinc-700 transition-colors border border-zinc-200/80">
                🌿 Esprit Nature (Paysagiste • Montauban)
              </button>
              <button type="button" onclick="window.app.fillQuickGen('AquaPro Dépannage', 'plombier', 'Toulouse')" class="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 text-[11px] font-medium text-zinc-700 transition-colors border border-zinc-200/80">
                🔧 AquaPro (Plombier • Toulouse)
              </button>
              <button type="button" onclick="window.app.fillQuickGen('Atelier Dubreuil', 'menuisier', 'Bordeaux')" class="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 text-[11px] font-medium text-zinc-700 transition-colors border border-zinc-200/80">
                🪚 Atelier Dubreuil (Menuisier • Bordeaux)
              </button>
              <button type="button" onclick="window.app.fillQuickGen('VoltService 24/7', 'electricien', 'Lyon')" class="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 text-[11px] font-medium text-zinc-700 transition-colors border border-zinc-200/80">
                ⚡ VoltService (Électricien • Lyon)
              </button>
            </div>
          </div>

          <!-- Calm KPI Micro-Cards Bar -->
          <div class="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div class="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-2xs">
              <div class="flex items-center justify-between">
                <div class="text-2xl font-extrabold text-zinc-950 tracking-tight">${total}</div>
                <span class="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Actifs</span>
              </div>
              <div class="text-[11px] font-medium text-zinc-500 mt-1">Sites créés</div>
            </div>
            <div class="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-2xs">
              <div class="flex items-center justify-between">
                <div class="text-2xl font-extrabold text-zinc-950 tracking-tight">${contacted}</div>
                <span class="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">En cours</span>
              </div>
              <div class="text-[11px] font-medium text-zinc-500 mt-1">En prospection</div>
            </div>
            <div class="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/70 shadow-2xs">
              <div class="flex items-center justify-between">
                <div class="text-2xl font-extrabold text-emerald-800 tracking-tight">${won}</div>
                <span title="Projets marqués signés / ensemble des projets" class="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">Taux ${conversionRate}%</span>
              </div>
              <div class="text-[11px] font-bold text-emerald-700 mt-1">Clients signés ✓</div>
            </div>
            <div class="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-2xs">
              <div class="flex items-center justify-between">
                <div class="text-2xl font-extrabold text-zinc-950 tracking-tight">${valuedProjects.length ? `${potentialRevenue.toLocaleString('fr-FR')} €` : 'Non renseigné'}</div>
                <span class="text-[10px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full">${valuedProjects.length}/${total} renseignés</span>
              </div>
              <div class="text-[11px] font-medium text-zinc-500 mt-1">Pipeline de vente</div>
            </div>
          </div>

        </div>

        <!-- Section Projects Header -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
          <div>
            <h2 class="text-lg font-bold text-zinc-950 tracking-tight flex items-center gap-2">
              <span>Vos Projets Artisans</span>
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-200/80 text-zinc-700">${total}</span>
            </h2>
            <p class="text-xs text-zinc-500">Sélectionnez une carte pour ouvrir l'éditeur visuel instantané ou partager la démo commerciale.</p>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" onclick="window.app.openCloserModal()" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200/80 shadow-2xs transition-colors">
              ${getIcon("phone", "w-3.5 h-3.5 text-emerald-600")}
              <span>Script de Closing & Vente</span>
            </button>
          </div>
        </div>

        <!-- Projects Grid -->
        <div id="projects-grid" class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          ${projectCardsHTML || `
            <div class="col-span-full bg-white rounded-3xl p-12 text-center border border-zinc-200/90 shadow-2xs space-y-4">
              <div class="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-500 flex items-center justify-center mx-auto text-xl font-bold">
                📁
              </div>
              <div class="space-y-1">
                <div class="font-bold text-zinc-900 text-base">Aucun projet pour le moment</div>
                <div class="text-xs text-zinc-500 max-w-sm mx-auto">Utilisez le générateur rapide ci-dessus pour créer votre première proposition de site artisan en quelques secondes.</div>
              </div>
            </div>
          `}
        </div>

      </main>
    </div>
  `;
}

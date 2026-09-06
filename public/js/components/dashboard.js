import { getIcon } from "./icons.js";

/**
 * Dashboard & Mini-CRM for Michel to manage all local business prospects.
 */
export function renderDashboard(state) {
  const projects = state.projects || [];
  
  // Pipeline metrics
  const total = projects.length;
  const contacted = projects.filter(p => p.pipelineStatus === "contacted" || p.pipelineStatus === "demo_sent").length;
  const won = projects.filter(p => p.pipelineStatus === "won").length;
  const potentialRevenue = won * 1500 + contacted * 800;

  const projectCardsHTML = projects.map(p => {
    const bus = p.business;
    const statusMap = {
      prospect: { label: "À Contacter", color: "bg-gray-100 text-gray-700" },
      generated: { label: "Site Prêt", color: "bg-blue-100 text-blue-700" },
      contacted: { label: "Appel Passé", color: "bg-amber-100 text-amber-700" },
      demo_sent: { label: "Démo Envoyée", color: "bg-purple-100 text-purple-700" },
      won: { label: "Client Signé ✓", color: "bg-emerald-100 text-emerald-700 font-bold" }
    };
    const st = statusMap[p.pipelineStatus] || statusMap.generated;
    const heroImage = p.sections.find(s => s.type === "hero")?.content?.heroImage || "https://images.unsplash.com/photo-1558904541-efa8c4a08931";

    return `
      <div class="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group">
        <!-- Thumbnail Preview Header -->
        <div class="h-44 relative overflow-hidden bg-slate-900 cursor-pointer" onclick="window.app.openEditor('${p.id}')">
          <img src="${heroImage}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90">
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          
          <div class="absolute top-3 left-3 flex items-center gap-2">
            <span class="text-[11px] font-bold px-2.5 py-1 rounded-full ${st.color} shadow-sm backdrop-blur">
              ${st.label}
            </span>
          </div>

          <div class="absolute bottom-3 left-3 right-3 text-white">
            <h3 class="font-heading text-lg font-bold truncate">${p.name}</h3>
            <div class="flex items-center gap-2 text-xs text-gray-300 mt-0.5">
              <span>${bus.tradeLabel}</span>
              <span>•</span>
              <span class="flex items-center gap-1">${getIcon("mapPin", "w-3 h-3 text-emerald-400")} ${bus.city}</span>
            </div>
          </div>
        </div>

        <!-- Project Details Body -->
        <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div class="space-y-2 text-xs text-gray-600">
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Téléphone :</span>
              <span class="font-semibold text-gray-800">${bus.phone}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Sections actives :</span>
              <span class="font-semibold text-gray-800">${p.sections.filter(s => s.visibility !== false).length} / ${p.sections.length}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Preset Design :</span>
              <span class="font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">${p.branding.presetName || 'Standard'}</span>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
            <button type="button" onclick="window.app.openEditor('${p.id}')" class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm">
              ${getIcon("edit", "w-3.5 h-3.5")}
              <span>Éditeur</span>
            </button>

            <button type="button" onclick="window.app.openCloserModal('${p.id}')" class="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors" title="Kit de Vente & Script Appel">
              ${getIcon("sparkles", "w-3.5 h-3.5 text-amber-600")}
              <span>Pitch</span>
            </button>

            <button type="button" onclick="window.app.openPreview('${p.id}')" class="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors" title="Aperçu Client Immédiat">
              ${getIcon("eye", "w-4 h-4")}
            </button>

            <button type="button" onclick="window.app.duplicateProject('${p.id}')" class="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors" title="Dupliquer">
              ${getIcon("copy", "w-4 h-4")}
            </button>

            <button type="button" onclick="window.app.deleteProject('${p.id}')" class="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Supprimer">
              ${getIcon("trash", "w-4 h-4")}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="min-h-screen bg-slate-50 text-slate-900">
      
      <!-- Top Global Bar -->
      <nav class="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-xl shadow-md">
              ⚡
            </div>
            <div>
              <div class="font-heading text-lg font-black text-slate-900 tracking-tight leading-none">ARTISITE PROSPECTOR <span class="text-xs text-orange-600 font-bold ml-1 px-1.5 py-0.5 rounded bg-orange-50 border border-orange-200">v4.0</span></div>
              <div class="text-xs text-slate-500 font-medium">SAS Commercial & Générateur de sites vitrines de proximité</div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button type="button" onclick="window.app.openWizard()" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg hover:shadow-orange-500/25 transition-all transform hover:-translate-y-0.5">
              ${getIcon("plus", "w-4 h-4")}
              <span>Générer un site pour un prospect</span>
            </button>
          </div>

        </div>
      </nav>

      <!-- Main Dashboard Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <!-- Welcome & Closer Cockpit Banner -->
        <div class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div class="absolute -right-10 -bottom-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div class="grid lg:grid-cols-12 gap-8 items-center relative z-10">
            <div class="lg:col-span-8 space-y-4">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30">
                <span>Espace de Prospection Rapide • Michel</span>
              </div>
              <h1 class="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Générez des sites vitrines prêts à vendre en 3 secondes chrono.
              </h1>
              <p class="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                Repérez un artisan local, entrez son nom et sa ville. Le moteur génère un site moderne 2026 complet avec Avant/Après interactif, avis vérifiés, simulateur de devis et un argumentaire téléphonique taillé pour closer.
              </p>
              <div class="pt-2 flex flex-wrap gap-4">
                <button type="button" onclick="window.app.openWizard()" class="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-xl transition-all">
                  ${getIcon("sparkles", "w-4 h-4 text-orange-600")}
                  <span>Nouveau Prospect Express</span>
                </button>
                <button type="button" onclick="window.app.openCloserModal()" class="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors">
                  ${getIcon("phone", "w-4 h-4 text-emerald-400")}
                  <span>Voir le Script Cold Call Global</span>
                </button>
              </div>
            </div>

            <!-- Pipeline Metrics Counters -->
            <div class="lg:col-span-4 grid grid-cols-2 gap-4">
              <div class="bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/10">
                <div class="text-2xl font-bold font-heading text-white">${total}</div>
                <div class="text-xs text-slate-400 mt-1">Sites créés</div>
              </div>
              <div class="bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/10">
                <div class="text-2xl font-bold font-heading text-amber-400">${contacted}</div>
                <div class="text-xs text-slate-400 mt-1">En prospection</div>
              </div>
              <div class="bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/10">
                <div class="text-2xl font-bold font-heading text-emerald-400">${won}</div>
                <div class="text-xs text-slate-400 mt-1">Clients signés</div>
              </div>
              <div class="bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/10">
                <div class="text-2xl font-bold font-heading text-orange-400">${potentialRevenue} €</div>
                <div class="text-xs text-slate-400 mt-1">Pipeline estimé</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section Projects Header with Filters -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
          <div>
            <h2 class="font-heading text-2xl font-bold text-slate-900">Mes Prospects & Sites Générés</h2>
            <p class="text-xs text-slate-500 mt-0.5">Cliquez sur un site pour ouvrir l'éditeur visuel en direct ou lancer la prévisualisation client.</p>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto">
            <input type="text" id="project-search" oninput="window.app.filterProjects(this.value)" placeholder="Rechercher artisan, ville..." class="w-full sm:w-64 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>
        </div>

        <!-- Projects Grid -->
        <div id="projects-grid" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          ${projectCardsHTML}
        </div>

      </main>
    </div>
  `;
}

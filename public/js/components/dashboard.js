import { getIcon } from "./icons.js";

/**
 * Sendpage / Linear / Raycast Dashboard & Mini-CRM for Michel.
 * Clean 1px micro-borders, neutral palette, calm KPI metrics, and instant access to editor and sales pitch.
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
      prospect: { label: "À Contacter", color: "bg-zinc-100 text-zinc-700 border-zinc-200" },
      generated: { label: "Site Prêt", color: "bg-blue-50 text-blue-700 border-blue-200" },
      contacted: { label: "Appel Passé", color: "bg-amber-50 text-amber-800 border-amber-200" },
      demo_sent: { label: "Démo Envoyée", color: "bg-purple-50 text-purple-700 border-purple-200" },
      won: { label: "Client Signé ✓", color: "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold" }
    };
    const st = statusMap[p.pipelineStatus] || statusMap.generated;
    const heroImage = p.sections.find(s => s.type === "hero")?.content?.heroImage || "https://images.unsplash.com/photo-1558904541-efa8c4a08931";

    return `
      <div class="bg-white rounded-xl border border-zinc-200 hover:border-zinc-300 shadow-xs hover:shadow-sm transition-all duration-200 overflow-hidden flex flex-col group">
        <!-- Thumbnail Preview Header -->
        <div class="h-40 relative overflow-hidden bg-zinc-900 cursor-pointer" onclick="window.app.openEditor('${p.id}')">
          <img src="${heroImage}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90">
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          
          <div class="absolute top-3 left-3 flex items-center gap-2">
            <span class="text-[10.5px] font-medium px-2 py-0.5 rounded-md border ${st.color} backdrop-blur-sm bg-white/90">
              ${st.label}
            </span>
          </div>

          <div class="absolute bottom-3 left-3 right-3 text-white">
            <h3 class="font-semibold text-base truncate">${p.name}</h3>
            <div class="flex items-center gap-2 text-xs text-zinc-300 mt-0.5">
              <span>${bus.tradeLabel}</span>
              <span>•</span>
              <span class="flex items-center gap-1">${getIcon("mapPin", "w-3 h-3 text-zinc-300")} ${bus.city}</span>
            </div>
          </div>
        </div>

        <!-- Project Details Body -->
        <div class="p-4 flex-1 flex flex-col justify-between space-y-4">
          <div class="space-y-1.5 text-xs text-zinc-600">
            <div class="flex items-center justify-between">
              <span class="text-zinc-400">Téléphone :</span>
              <span class="font-medium text-zinc-800">${bus.phone}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-zinc-400">Sections actives :</span>
              <span class="font-medium text-zinc-800">${p.sections.filter(s => s.visibility !== false).length} / ${p.sections.length}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-zinc-400">Preset Design :</span>
              <span class="font-medium text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200/60">${p.branding.presetName || 'Standard'}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="pt-3 border-t border-zinc-100 flex items-center justify-between gap-1.5">
            <button type="button" onclick="window.app.openEditor('${p.id}')" class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-zinc-900 hover:bg-black transition-colors shadow-xs">
              ${getIcon("edit", "w-3 h-3")}
              <span>Éditeur</span>
            </button>

            <button type="button" onclick="window.app.openCloserModal('${p.id}')" class="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 transition-colors" title="Kit de Vente & Script Appel">
              ${getIcon("sparkles", "w-3 h-3 text-zinc-600")}
              <span>Pitch</span>
            </button>

            <button type="button" onclick="window.app.openPreview('${p.id}')" class="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors" title="Aperçu Client Démo">
              ${getIcon("eye", "w-3.5 h-3.5")}
            </button>

            <button type="button" onclick="window.app.duplicateProject('${p.id}')" class="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors" title="Dupliquer">
              ${getIcon("copy", "w-3.5 h-3.5")}
            </button>

            <button type="button" onclick="window.app.deleteProject('${p.id}')" class="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Supprimer">
              ${getIcon("trash", "w-3.5 h-3.5")}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="min-h-screen bg-[#F4F5F7] text-zinc-900">
      
      <!-- Top Global Bar (Linear / Sendpage style) -->
      <nav class="bg-white border-b border-zinc-200 sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              ⚡
            </div>
            <div>
              <div class="font-semibold text-sm text-zinc-900 tracking-tight flex items-center gap-1.5">
                <span>ARTISITE PROSPECTOR</span>
                <span class="text-[10px] text-zinc-600 font-medium px-1.5 py-0.2 rounded bg-zinc-100 border border-zinc-200">v4.0</span>
              </div>
              <div class="text-[11px] text-zinc-500 hidden sm:block">Générateur de sites vitrines & prospection locale</div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="relative hidden sm:block">
              <input type="text" id="project-search" oninput="window.app.filterProjects(this.value)" placeholder="Rechercher prospect, ville..." class="w-56 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-800 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900 focus:outline-none transition-colors">
            </div>

            <button type="button" onclick="window.app.openWizard()" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-zinc-900 hover:bg-black shadow-xs transition-colors">
              ${getIcon("plus", "w-3.5 h-3.5")}
              <span>Générer un prospect</span>
            </button>
          </div>

        </div>
      </nav>

      <!-- Main Dashboard Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        <!-- Welcome Cockpit Card (Sobriété Radicale Sendpage / Linear) -->
        <div class="bg-white rounded-2xl p-6 border border-zinc-200 shadow-xs">
          <div class="grid lg:grid-cols-12 gap-6 items-center">
            
            <div class="lg:col-span-7 space-y-3">
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                ${getIcon("sparkles", "w-3 h-3 text-zinc-500")}
                <span>Espace de Prospection Commerciale • Michel</span>
              </div>
              
              <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                Générez des sites vitrines prêts à vendre en 3 secondes.
              </h1>
              
              <p class="text-zinc-500 text-xs sm:text-sm leading-relaxed max-w-xl">
                Repérez un artisan local, entrez son nom et sa ville. Le moteur génère un site moderne sobre avec Avant/Après interactif, avis vérifiés, simulateur de devis et un kit de closing complet pour décrocher le contrat.
              </p>
              
              <div class="pt-1 flex flex-wrap gap-2.5">
                <button type="button" onclick="window.app.openWizard()" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white bg-zinc-900 hover:bg-black shadow-xs transition-colors">
                  ${getIcon("plus", "w-3.5 h-3.5")}
                  <span>Nouveau Prospect Express</span>
                </button>
                <button type="button" onclick="window.app.openCloserModal()" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 transition-colors">
                  ${getIcon("phone", "w-3.5 h-3.5 text-zinc-500")}
                  <span>Script Cold Call Global</span>
                </button>
              </div>
            </div>

            <!-- Pipeline Metrics Counters (Clean 1px border cards) -->
            <div class="lg:col-span-5 grid grid-cols-2 gap-3">
              <div class="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
                <div class="text-xl font-bold text-zinc-900">${total}</div>
                <div class="text-[11px] text-zinc-500 mt-0.5">Sites créés</div>
              </div>
              <div class="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
                <div class="text-xl font-bold text-zinc-900">${contacted}</div>
                <div class="text-[11px] text-zinc-500 mt-0.5">En prospection</div>
              </div>
              <div class="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
                <div class="text-xl font-bold text-emerald-600">${won}</div>
                <div class="text-[11px] text-zinc-500 mt-0.5">Clients signés</div>
              </div>
              <div class="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
                <div class="text-xl font-bold text-zinc-900">${potentialRevenue} €</div>
                <div class="text-[11px] text-zinc-500 mt-0.5">Pipeline estimé</div>
              </div>
            </div>

          </div>
        </div>

        <!-- Section Projects Header -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
          <div>
            <h2 class="text-base font-semibold text-zinc-900">Mes Prospects & Sites Générés</h2>
            <p class="text-xs text-zinc-500">Cliquez sur un projet pour ouvrir l'éditeur visuel en direct ou lancer l'aperçu client.</p>
          </div>
        </div>

        <!-- Projects Grid -->
        <div id="projects-grid" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          ${projectCardsHTML}
        </div>

      </main>
    </div>
  `;
}


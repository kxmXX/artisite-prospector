import { TRADES } from "../data/trades.js";
import { STYLE_PRESETS } from "../data/styles.js";
import { getIcon } from "./icons.js";

/**
 * Intelligent Creation Wizard with Mode Rapide & Mode Avancé + AI Generation Terminal.
 */

export function renderWizardModal() {
  const tradeOptions = TRADES.map(t => `<option value="${t.id}">${t.label} (${t.category})</option>`).join('');
  const presetOptions = STYLE_PRESETS.map(p => `<option value="${p.id}">${p.name} — ${p.description}</option>`).join('');

  return `
    <div id="wizard-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden relative">
        
        <!-- Header -->
        <div class="px-8 pt-8 pb-4 flex items-center justify-between border-b border-slate-100">
          <div>
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-200">
              ${getIcon("sparkles", "w-3 h-3")}
              <span>Moteur de Génération IA v4</span>
            </div>
            <h2 class="font-heading text-2xl font-black text-slate-900 mt-1">Générer un Site Prospect</h2>
          </div>
          <button type="button" onclick="window.app.closeWizard()" class="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
            ${getIcon("x", "w-5 h-5")}
          </button>
        </div>

        <!-- Mode Switcher Tabs -->
        <div class="px-8 pt-4 flex gap-4 border-b border-slate-100 text-xs font-bold">
          <button type="button" id="tab-mode-fast" onclick="window.app.switchWizardMode('fast')" class="pb-3 border-b-2 border-orange-600 text-orange-600 flex items-center gap-1.5">
            ⚡ Mode Express (Recommandé)
          </button>
          <button type="button" id="tab-mode-adv" onclick="window.app.switchWizardMode('advanced')" class="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 flex items-center gap-1.5">
            🛠 Mode Personnalisé Avancé
          </button>
        </div>

        <!-- Form Body -->
        <form id="wizard-form" onsubmit="window.app.handleWizardSubmit(event)" class="p-8 space-y-5">
          
          <!-- Enterprise Name -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Nom de l'entreprise locale <span class="text-orange-600">*</span>
            </label>
            <input type="text" id="wiz-name" required placeholder="Ex: Esprit Nature, Dupont Plomberie..." value="Esprit Nature" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>

          <!-- Trade Selection -->
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Métier / Activité <span class="text-orange-600">*</span>
              </label>
              <select id="wiz-trade" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                ${tradeOptions}
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Ville principale <span class="text-orange-600">*</span>
              </label>
              <input type="text" id="wiz-city" required placeholder="Ex: Montauban, Albi, Toulouse..." value="Montauban" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
          </div>

          <!-- Phone & Zone (Always useful for cold calling) -->
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Téléphone de l'artisan
              </label>
              <input type="tel" id="wiz-phone" placeholder="07 XX XX XX XX" value="07 82 14 39 50" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Zone / Département
              </label>
              <input type="text" id="wiz-region" placeholder="Ex: Occitanie, Tarn-et-Garonne..." value="Occitanie" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
          </div>

          <!-- Advanced Fields (Hidden by default in Mode Rapide) -->
          <div id="wiz-advanced-fields" class="space-y-4 pt-2 border-t border-slate-100" style="display: none;">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Preset de Style Graphique
              </label>
              <select id="wiz-preset" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                ${presetOptions}
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email commercial (optionnel)
              </label>
              <input type="email" id="wiz-email" placeholder="contact@artisan.fr" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
          </div>

          <!-- Submit Action -->
          <div class="pt-4">
            <button type="submit" id="btn-submit-generate" class="w-full py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-xl hover:shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
              ${getIcon("sparkles", "w-5 h-5")}
              <span>Générer le site vitrine complet (3 sec)</span>
            </button>
            <p class="text-center text-[11px] text-slate-400 mt-2.5">
              ✓ Inférence automatique des prestations, avant/après, avis et charte graphique adaptée au métier.
            </p>
          </div>
        </form>

        <!-- Dynamic Generation Animation Terminal (Overlay during generation) -->
        <div id="wizard-terminal" class="absolute inset-0 bg-slate-950 text-emerald-400 p-8 flex flex-col justify-center space-y-4 font-mono text-sm z-50" style="display:none;">
          <div class="flex items-center gap-3 text-white text-base font-bold pb-2 border-b border-slate-800">
            <div class="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Création en cours pour <span id="term-name" class="text-orange-400">...</span></span>
          </div>

          <div id="term-steps" class="space-y-2.5 text-xs text-slate-300">
            <div id="step-1" class="flex items-center gap-2 opacity-40 transition-opacity">
              <span class="step-icon">○</span>
              <span>Analyse de l'activité locale et des mots-clés...</span>
            </div>
            <div id="step-2" class="flex items-center gap-2 opacity-40 transition-opacity">
              <span class="step-icon">○</span>
              <span>Création de la structure & sélection des 15 sections...</span>
            </div>
            <div id="step-3" class="flex items-center gap-2 opacity-40 transition-opacity">
              <span class="step-icon">○</span>
              <span>Adaptation du design system, palette & typographies...</span>
            </div>
            <div id="step-4" class="flex items-center gap-2 opacity-40 transition-opacity">
              <span class="step-icon">○</span>
              <span>Génération des contenus haute conversion & avis...</span>
            </div>
            <div id="step-5" class="flex items-center gap-2 opacity-40 transition-opacity">
              <span class="step-icon">○</span>
              <span>Curations photographiques 4K & comparateur avant/après...</span>
            </div>
            <div id="step-6" class="flex items-center gap-2 opacity-40 transition-opacity font-bold text-orange-400">
              <span class="step-icon">○</span>
              <span>Finalisation et ouverture immédiate de l'éditeur...</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}

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
    <div id="wizard-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-zinc-200 overflow-hidden relative">
        
        <!-- Header -->
        <div class="px-6 py-4 flex items-center justify-between border-b border-zinc-200">
          <div>
            <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
              ${getIcon("sparkles", "w-3 h-3 text-zinc-500")}
              <span>Génération IA Instantanée</span>
            </div>
            <h2 class="font-semibold text-base text-zinc-900 mt-1">Nouveau Site Prospect</h2>
          </div>
          <button type="button" onclick="window.app.closeWizard()" class="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors">
            ${getIcon("x", "w-4 h-4")}
          </button>
        </div>

        <!-- Mode Switcher Pill Tabs -->
        <div class="px-6 pt-3 pb-2 border-b border-zinc-100 bg-zinc-50/50">
          <div class="pill-tabs-container">
            <button type="button" id="tab-mode-fast" onclick="window.app.switchWizardMode('fast')" class="pill-tab-btn is-active">
              <span>⚡ Mode Express</span>
            </button>
            <button type="button" id="tab-mode-adv" onclick="window.app.switchWizardMode('advanced')" class="pill-tab-btn">
              <span>🛠 Paramètres Avancés</span>
            </button>
          </div>
        </div>

        <!-- Form Body -->
        <form id="wizard-form" onsubmit="window.app.handleWizardSubmit(event)" class="p-6 space-y-4 text-xs">
          
          <!-- Enterprise Name -->
          <div>
            <label class="block text-[11px] font-medium text-zinc-600 mb-1">
              Nom de l'entreprise artisanale <span class="text-zinc-400">*</span>
            </label>
            <input type="text" id="wiz-name" required placeholder="Ex: Esprit Nature, Dupont Plomberie..." value="Esprit Nature" class="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 font-medium focus:bg-white focus:border-zinc-900 focus:outline-none">
          </div>

          <!-- Trade Selection -->
          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-medium text-zinc-600 mb-1">
                Métier / Activité <span class="text-zinc-400">*</span>
              </label>
              <select id="wiz-trade" class="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 font-medium focus:bg-white focus:border-zinc-900 focus:outline-none">
                ${tradeOptions}
              </select>
            </div>

            <div>
              <label class="block text-[11px] font-medium text-zinc-600 mb-1">
                Ville d'intervention <span class="text-zinc-400">*</span>
              </label>
              <input type="text" id="wiz-city" required placeholder="Ex: Montauban, Albi, Toulouse..." value="Montauban" class="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 font-medium focus:bg-white focus:border-zinc-900 focus:outline-none">
            </div>
          </div>

          <!-- Phone & Zone (Always useful for cold calling) -->
          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-medium text-zinc-600 mb-1">
                Téléphone de contact
              </label>
              <input type="tel" id="wiz-phone" placeholder="07 XX XX XX XX" value="07 82 14 39 50" class="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 font-medium focus:bg-white focus:border-zinc-900 focus:outline-none">
            </div>

            <div>
              <label class="block text-[11px] font-medium text-zinc-600 mb-1">
                Région / Secteur
              </label>
              <input type="text" id="wiz-region" placeholder="Ex: Occitanie, Tarn-et-Garonne..." value="Occitanie" class="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 font-medium focus:bg-white focus:border-zinc-900 focus:outline-none">
            </div>
          </div>

          <!-- Advanced Fields (Hidden by default in Mode Rapide) -->
          <div id="wiz-advanced-fields" class="space-y-3 pt-2 border-t border-zinc-100" style="display: none;">
            <div class="grid sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-medium text-zinc-600 mb-1">
                  Preset de Style Graphique
                </label>
                <select id="wiz-preset" class="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 font-medium focus:bg-white focus:border-zinc-900 focus:outline-none">
                  ${presetOptions}
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-medium text-zinc-600 mb-1">
                  Ambiance Globale 1-Clic
                </label>
                <select id="wiz-ambiance" class="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 font-medium focus:bg-white focus:border-zinc-900 focus:outline-none">
                  <option value="mineral" selected>🪨 Minérale (Épurée & Moderne)</option>
                  <option value="white">☀️ Blanche (Lumineuse & Minimale)</option>
                  <option value="dark">🌙 Sombre (Obsidienne & Contraste Fort)</option>
                </select>
              </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-medium text-zinc-600 mb-1">
                  Tonalité Rédactionnelle IA
                </label>
                <select id="wiz-tone" class="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 font-medium focus:bg-white focus:border-zinc-900 focus:outline-none">
                  <option value="artisan" selected>Authentique & Chaleureux (Recommandé)</option>
                  <option value="expert">Expert & Précis / Technique</option>
                  <option value="luxe">Haut de Gamme & Prestigieux</option>
                  <option value="direct">Direct & Orienté Devis Rapide</option>
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-medium text-zinc-600 mb-1">
                  Couleur Primaire (Optionnel)
                </label>
                <div class="flex items-center gap-2">
                  <input type="color" id="wiz-color-picker" value="#f06b3d" oninput="document.getElementById('wiz-color').value = this.value" class="w-8 h-8 rounded-lg border border-zinc-200 cursor-pointer p-0.5 bg-white">
                  <input type="text" id="wiz-color" placeholder="#f06b3d" value="" oninput="if(/^#[0-9a-f]{6}$/i.test(this.value)) document.getElementById('wiz-color-picker').value = this.value" class="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 font-mono focus:bg-white focus:border-zinc-900 focus:outline-none">
                </div>
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-medium text-zinc-600 mb-1">
                Email commercial (optionnel)
              </label>
              <input type="email" id="wiz-email" placeholder="contact@artisan.fr" class="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 font-medium focus:bg-white focus:border-zinc-900 focus:outline-none">
            </div>
          </div>

          <!-- Submit Action -->
          <div class="pt-2">
            <button type="submit" id="btn-submit-generate" class="w-full py-2.5 rounded-lg text-xs font-medium text-white bg-zinc-900 hover:bg-black shadow-xs transition-colors flex items-center justify-center gap-2">
              ${getIcon("sparkles", "w-4 h-4")}
              <span>Générer le site vitrine complet</span>
            </button>
            <p class="text-center text-[10.5px] text-zinc-400 mt-2">
              Structure 16 sections, photos métier 4K et argumentaires calibrés automatiquement.
            </p>
          </div>
        </form>

        <!-- Dynamic Generation Animation Terminal (Overlay during generation) -->
        <div id="wizard-terminal" class="absolute inset-0 bg-zinc-950 text-zinc-300 p-6 flex flex-col justify-center space-y-3 font-mono text-xs z-50" style="display:none;">
          <div class="flex items-center gap-3 text-white text-sm font-semibold pb-2 border-b border-zinc-800">
            <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Génération en cours : <span id="term-name" class="text-zinc-300 font-normal">...</span></span>
          </div>

          <div id="term-steps" class="space-y-2 text-xs text-zinc-400">
            <div id="step-1" class="flex items-center gap-2 opacity-40 transition-opacity">
              <span class="step-icon">○</span>
              <span>Analyse de l'activité locale et des mots-clés...</span>
            </div>
            <div id="step-2" class="flex items-center gap-2 opacity-40 transition-opacity">
              <span class="step-icon">○</span>
              <span>Création de la structure & sélection des 16 sections...</span>
            </div>
            <div id="step-3" class="flex items-center gap-2 opacity-40 transition-opacity">
              <span class="step-icon">○</span>
              <span>Adaptation du design system, palette & typographies...</span>
            </div>
            <div id="step-4" class="flex items-center gap-2 opacity-40 transition-opacity">
              <span class="step-icon">○</span>
              <span>Génération des contenus & avis clients...</span>
            </div>
            <div id="step-5" class="flex items-center gap-2 opacity-40 transition-opacity">
              <span class="step-icon">○</span>
              <span>Curations photographiques & module avant/après...</span>
            </div>
            <div id="step-6" class="flex items-center gap-2 opacity-40 transition-opacity font-medium text-white">
              <span class="step-icon">○</span>
              <span>Finalisation et ouverture immédiate de l'éditeur...</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}

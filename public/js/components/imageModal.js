import { getIcon } from "./icons.js";
import { TRADES, getTradeById } from "../data/trades.js";
import { getTradeFallbackDataUrl } from "../data/imageFallbacks.js";

/**
 * Image Manager Modal: Curated trade library, URL paste, Drag & Drop upload, and AI Generative Image Synthesizer.
 */
export function renderImageModal(state) {
  const meta = state.activeImageMeta || {};
  const currentUrl = meta.currentUrl || "";
  const sectionType = meta.sectionType || "hero";
  const project = state.currentProject;
  const tradeId = project?.business?.tradeId || "paysagiste";
  const trade = getTradeById(tradeId) || TRADES[0];
  const fallbackCurrent = getTradeFallbackDataUrl(tradeId, sectionType, project?.name || "Artisan");

  // Gather curated photos for this trade with fallback
  const curatedImages = [];
  if (trade.heroImage) curatedImages.push({ url: trade.heroImage, label: "Hero principal", fallback: getTradeFallbackDataUrl(tradeId, "hero", "Hero principal") });
  if (trade.aboutImage) curatedImages.push({ url: trade.aboutImage, label: "Présentation / Équipe", fallback: getTradeFallbackDataUrl(tradeId, "about", "Présentation") });
  if (trade.beforeAfter?.afterImage) curatedImages.push({ url: trade.beforeAfter.afterImage, label: "Chantier terminé", fallback: getTradeFallbackDataUrl(tradeId, "beforeAfter", "Chantier Terminé") });
  if (trade.beforeAfter?.beforeImage) curatedImages.push({ url: trade.beforeAfter.beforeImage, label: "Chantier avant", fallback: getTradeFallbackDataUrl(tradeId, "beforeAfter", "Avant Travaux") });
  (trade.defaultServices || []).forEach((s, idx) => {
    if (s.image) curatedImages.push({ url: s.image, label: `Service : ${s.title}`, fallback: getTradeFallbackDataUrl(tradeId, "service", s.title) });
  });

  const defaultPromptSuggestions = {
    paysagiste: "Superbe aménagement paysager avec terrasse en bois, dalles minérales, pelouse fraîche et éclairage extérieur chaleureux 4K",
    plombier: "Rénovation de salle de bain contemporaine avec robinetterie moderne, chauffe-eau performant et carrelage sobre 4K",
    couvreur: "Chantier de couverture de toiture impeccable avec tuiles en terre cuite et zinguerie brillante sous ciel dégagé 4K",
    electricien: "Tableau électrique aux normes avec disjoncteurs modernes et éclairage domotique design 4K",
    peintre: "Finition de peinture murale mate impeccable dans un salon lumineux aux teintes modernes 4K",
    restaurant: "Assiette gastronomique dressée avec soin, produits frais du terroir et ambiance chaleureuse 4K"
  };
  const suggestedPrompt = defaultPromptSuggestions[tradeId] || `Photo professionnelle haute définition pour artisan ${trade.label} intervenant à ${project?.business?.city || 'proximité'}`;

  return `
    <div id="image-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">

        <!-- Header -->
        <div class="px-6 py-4 bg-white border-b border-zinc-200 flex items-center justify-between flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800">
              ${getIcon("eye", "w-4 h-4")}
            </div>
            <div>
              <h3 class="font-bold text-sm text-zinc-900">Médiathèque & Visuels Pro</h3>
              <p class="text-[11px] text-zinc-500">Section ciblée : <span class="capitalize text-zinc-800 font-semibold">${sectionType}</span> • Métier : <span class="text-zinc-800 font-semibold">${trade.label}</span></p>
            </div>
          </div>
          <button type="button" onclick="window.app.closeImageModal()" class="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors">
            ${getIcon("x", "w-4 h-4")}
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="px-6 pt-3 pb-2.5 bg-zinc-50/80 border-b border-zinc-200 flex flex-wrap gap-2 text-xs flex-shrink-0">
          <button type="button" onclick="window.app.switchImageTab('library')" id="tab-img-library" class="px-3 py-1.5 rounded-lg font-semibold text-zinc-900 bg-white shadow-xs border border-zinc-200">
            📚 Bibliothèque Métier
          </button>
          <button type="button" onclick="window.app.switchImageTab('ai')" id="tab-img-ai" class="px-3 py-1.5 rounded-lg font-medium text-zinc-600 hover:text-zinc-900 border border-transparent flex items-center gap-1">
            <span>⚡ Générer avec l'IA</span>
          </button>
          <button type="button" onclick="window.app.switchImageTab('url')" id="tab-img-url" class="px-3 py-1.5 rounded-lg font-medium text-zinc-600 hover:text-zinc-900 border border-transparent">
            🔗 Coller une URL
          </button>
          <button type="button" onclick="window.app.switchImageTab('upload')" id="tab-img-upload" class="px-3 py-1.5 rounded-lg font-medium text-zinc-600 hover:text-zinc-900 border border-transparent">
            📁 Fichier Local
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 overflow-y-auto space-y-4 flex-1 text-xs">

          <!-- Current Image Preview with Keycaps -->
          <div class="bg-zinc-50 rounded-xl p-3 border border-zinc-200 flex items-center gap-4 overflow-hidden">
            <div class="w-16 h-16 sm:w-20 sm:h-20 max-w-[5rem] max-h-[5rem] rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0 border border-zinc-200 relative shadow-2xs">
              <img id="image-modal-preview"
                   src="${currentUrl || fallbackCurrent}"
                   alt="Aperçu actuel"
                   class="w-full h-full object-cover max-w-full max-h-full block"
                   onerror="if(!this.dataset.fallbackApplied){this.dataset.fallbackApplied='true';this.src='${fallbackCurrent}';}">
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-xs font-bold text-zinc-900">Visuel sélectionné actuellement</div>
              <div class="text-[11px] text-zinc-500 truncate mt-0.5">${currentUrl ? currentUrl : 'Illustration vectorielle haute résolution'}</div>
              <div class="flex items-center gap-2 mt-2">
                <button type="button" onclick="window.app.deletePhotoFromModal()" class="btn-keycap btn-keycap-danger inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-white shadow-xs" title="Supprimer définitivement l'image">
                  ${getIcon("trash", "w-3 h-3")}
                  <span>Réinitialiser</span>
                </button>
              </div>
            </div>
          </div>

          <!-- TAB 1: CURATED TRADE LIBRARY -->
          <div id="image-panel-library" class="space-y-3">
            <div class="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Photos & Visuels calibrés pour ${trade.label}</div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              ${curatedImages.map(img => `
                <div onclick="window.app.selectPhotoFromLibrary('${img.url}')" class="group relative rounded-xl overflow-hidden border cursor-pointer transition-all hover:border-zinc-900 hover:shadow-md aspect-[4/3] bg-zinc-100 ${img.url === currentUrl ? 'border-zinc-900 ring-2 ring-zinc-900' : 'border-zinc-200'}">
                  <img src="${img.url}" alt="${img.label}" class="w-full h-full max-h-28 object-cover group-hover:scale-105 transition-transform duration-300 block" onerror="if(!this.dataset.fallbackApplied){this.dataset.fallbackApplied='true';this.src='${img.fallback}';}">
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <span class="text-[10px] text-white font-medium truncate">${img.label}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- TAB 2: AI GENERATION -->
          <div id="image-panel-ai" class="space-y-3" style="display:none;">
            <div class="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5">
              <span class="text-amber-600 font-bold text-sm mt-0.5">⚡</span>
              <div>
                <div class="font-semibold text-xs text-amber-900">Générateur de visuels par Intelligence Artificielle</div>
                <div class="text-[11px] text-amber-700 leading-snug mt-0.5">Décrivez la scène souhaitée ou utilisez le prompt recommandé pour votre corps de métier.</div>
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-zinc-700 mb-1">
                Consigne visuelle (Prompt IA) :
              </label>
              <textarea id="ai-image-prompt-input" rows="3" class="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-xs text-zinc-900 font-medium focus:bg-white focus:border-zinc-900 focus:outline-none leading-relaxed">${suggestedPrompt}</textarea>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-[10.5px] font-semibold text-zinc-500 uppercase">Style :</span>
              <button type="button" onclick="window.app.setAIImageStyle('4k')" class="cta-context-btn is-selected" id="ai-style-4k">Photo Réaliste 4K</button>
              <button type="button" onclick="window.app.setAIImageStyle('archi')" class="cta-context-btn" id="ai-style-archi">Design Moderne</button>
              <button type="button" onclick="window.app.setAIImageStyle('vector')" class="cta-context-btn" id="ai-style-vector">Épure Végétale / 3D</button>
            </div>

            <button type="button" onclick="window.app.generateAIPhoto()" id="btn-generate-ai-photo" class="w-full btn-keycap btn-keycap-dark py-2.5 rounded-xl text-xs font-semibold text-white shadow-md flex items-center justify-center gap-2">
              ${getIcon("sparkles", "w-4 h-4 text-amber-400")}
              <span>Générer le visuel avec l'IA</span>
            </button>

            <div id="ai-image-output-container" class="hidden pt-2 space-y-2 border-t border-zinc-200">
              <div class="text-[11px] font-semibold text-zinc-700">Aperçu du visuel généré :</div>
              <div class="aspect-[16/9] max-h-56 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-950">
                <img id="ai-generated-preview-img" src="" alt="Visuel IA" class="w-full h-full object-cover max-w-full">
              </div>
              <button type="button" onclick="window.app.applyGeneratedAIPhoto()" class="w-full btn-keycap btn-keycap-success py-2 rounded-xl text-xs font-semibold text-white shadow-sm flex items-center justify-center gap-1.5">
                ${getIcon("checkCircle", "w-4 h-4")}
                <span>Insérer cette image dans la section</span>
              </button>
            </div>
          </div>

          <!-- TAB 3: URL INPUT -->
          <div id="image-panel-url" class="space-y-3" style="display:none;">
            <div>
              <label class="block text-[11px] font-semibold text-zinc-600 mb-1">
                Adresse URL de l'image (HTTPS)
              </label>
              <input type="url" id="image-modal-url-input" value="${currentUrl}" placeholder="https://images.unsplash.com/photo-..." class="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 font-medium focus:bg-white focus:border-zinc-900 focus:outline-none">
            </div>
            <button type="button" onclick="window.app.applyPhotoFromUrl()" class="w-full btn-keycap btn-keycap-dark py-2.5 rounded-xl text-xs font-semibold text-white shadow-xs">
              Valider cette image
            </button>
          </div>

          <!-- TAB 4: FILE DRAG & DROP / LOCAL UPLOAD -->
          <div id="image-panel-upload" class="space-y-3" style="display:none;">
            <div id="image-dropzone" ondragover="event.preventDefault(); this.classList.add('border-zinc-900', 'bg-zinc-100');" ondragleave="this.classList.remove('border-zinc-900', 'bg-zinc-100');" ondrop="window.app.handleImageFileDrop(event)" class="border-2 border-dashed border-zinc-300 rounded-2xl p-7 text-center bg-zinc-50 transition-colors cursor-pointer hover:bg-zinc-100">
              <div class="w-11 h-11 rounded-2xl bg-zinc-200/80 text-zinc-700 flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
                ${getIcon("upload", "w-5 h-5")}
              </div>
              <div class="text-xs font-bold text-zinc-900">Glissez-déposez votre photo ici</div>
              <div class="text-[11px] text-zinc-500 mt-0.5">PNG, JPG, WebP jusqu'à 5 Mo</div>
              <label class="mt-3.5 inline-block btn-keycap btn-keycap-light px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-800 border border-zinc-200 cursor-pointer shadow-xs">
                <span>Parcourir mes fichiers</span>
                <input type="file" accept="image/*" class="hidden" onchange="window.app.handleImageFileInput(event)">
              </label>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="px-6 py-3.5 bg-zinc-50 border-t border-zinc-200 flex justify-end gap-2 flex-shrink-0">
          <button type="button" onclick="window.app.closeImageModal()" class="btn-keycap btn-keycap-light px-4 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-zinc-100">
            Fermer
          </button>
        </div>

      </div>
    </div>
  `;
}

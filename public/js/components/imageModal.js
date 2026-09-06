import { getIcon } from "./icons.js";
import { TRADES, getTradeById } from "../data/trades.js";

/**
 * Image Manager Modal: URL paste, Trade stock photo picker, File upload / Drag-and-drop, and Trash.
 */
export function renderImageModal(state) {
  const meta = state.activeImageMeta || {};
  const currentUrl = meta.currentUrl || "";
  const sectionType = meta.sectionType || "hero";
  const project = state.currentProject;
  const tradeId = project?.business?.tradeId || "paysagiste";
  const trade = getTradeById(tradeId) || TRADES[0];

  // Gather curated photos for this trade
  const curatedImages = [];
  if (trade.heroImage) curatedImages.push({ url: trade.heroImage, label: "Hero principal" });
  if (trade.aboutImage) curatedImages.push({ url: trade.aboutImage, label: "Présentation / Équipe" });
  if (trade.beforeAfter?.afterImage) curatedImages.push({ url: trade.beforeAfter.afterImage, label: "Chantier terminé" });
  if (trade.beforeAfter?.beforeImage) curatedImages.push({ url: trade.beforeAfter.beforeImage, label: "Chantier avant" });
  (trade.defaultServices || []).forEach((s, idx) => {
    if (s.image) curatedImages.push({ url: s.image, label: `Service : ${s.title}` });
  });

  return `
    <div id="image-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        <!-- Header -->
        <div class="px-6 py-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-orange-600/30 border border-orange-500/40 flex items-center justify-center text-orange-400">
              ${getIcon("eye", "w-4 h-4")}
            </div>
            <div>
              <h3 class="font-heading font-bold text-sm">Gestion & Remplacement Photo</h3>
              <p class="text-[11px] text-slate-400">Section : <span class="capitalize text-orange-400 font-semibold">${sectionType}</span></p>
            </div>
          </div>
          <button type="button" onclick="window.app.closeImageModal()" class="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800">
            ${getIcon("x", "w-5 h-5")}
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex gap-4 text-xs font-bold flex-shrink-0">
          <button type="button" onclick="window.app.switchImageTab('library')" id="tab-img-library" class="pb-2.5 border-b-2 border-orange-600 text-orange-600">
            🖼️ Bibliothèque Métier
          </button>
          <button type="button" onclick="window.app.switchImageTab('url')" id="tab-img-url" class="pb-2.5 border-b-2 border-transparent text-slate-500 hover:text-slate-900">
            🔗 Coller une URL
          </button>
          <button type="button" onclick="window.app.switchImageTab('upload')" id="tab-img-upload" class="pb-2.5 border-b-2 border-transparent text-slate-500 hover:text-slate-900">
            📁 Fichier Local / Glisser
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 overflow-y-auto space-y-5 flex-1">
          
          <!-- Current Image Preview with Trash button -->
          <div class="bg-slate-100 rounded-2xl p-3 border border-slate-200 flex items-center gap-4">
            <div class="w-20 h-20 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-300">
              ${currentUrl ? `
                <img id="image-modal-preview" src="${currentUrl}" alt="Aperçu actuel" class="w-full h-full object-cover">
              ` : `
                <div class="w-full h-full flex items-center justify-center text-slate-400 text-xs italic">Sans photo</div>
              `}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-xs font-bold text-slate-800">Photo actuelle</div>
              <div class="text-[11px] text-slate-500 truncate mt-0.5">${currentUrl || 'Aucune image définie'}</div>
              <div class="flex items-center gap-2 mt-2">
                <button type="button" onclick="window.app.deletePhotoFromModal()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors" title="Supprimer définitivement l'image">
                  ${getIcon("trash", "w-3.5 h-3.5")}
                  <span>Poubelle / Supprimer</span>
                </button>
              </div>
            </div>
          </div>

          <!-- TAB 1: CURATED TRADE LIBRARY -->
          <div id="image-panel-library" class="space-y-3">
            <div class="text-xs font-bold text-slate-700 uppercase tracking-wider">Photos haute définition recommandées pour ${trade.label}</div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              ${curatedImages.map(img => `
                <div onclick="window.app.selectPhotoFromLibrary('${img.url}')" class="group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:border-orange-500 hover:shadow-md ${img.url === currentUrl ? 'border-orange-600 ring-2 ring-orange-400' : 'border-slate-200'}">
                  <img src="${img.url}" alt="${img.label}" class="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300">
                  <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                    <span class="text-[10px] text-white font-medium truncate">${img.label}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- TAB 2: URL INPUT -->
          <div id="image-panel-url" class="space-y-4" style="display:none;">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Adresse URL de l'image (HTTPS)
              </label>
              <input type="url" id="image-modal-url-input" value="${currentUrl}" placeholder="https://images.unsplash.com/photo-..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
            <button type="button" onclick="window.app.applyPhotoFromUrl()" class="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-sm transition-colors">
              Valider cette image
            </button>
          </div>

          <!-- TAB 3: FILE DRAG & DROP / LOCAL UPLOAD -->
          <div id="image-panel-upload" class="space-y-4" style="display:none;">
            <div id="image-dropzone" ondragover="event.preventDefault(); this.classList.add('border-orange-500', 'bg-orange-50');" ondragleave="this.classList.remove('border-orange-500', 'bg-orange-50');" ondrop="window.app.handleImageFileDrop(event)" class="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 transition-colors cursor-pointer hover:bg-slate-100">
              <div class="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3">
                ${getIcon("upload", "w-6 h-6")}
              </div>
              <div class="text-xs font-bold text-slate-800">Glissez-déposez votre image ici</div>
              <div class="text-[11px] text-slate-500 mt-1">PNG, JPG, WebP jusqu'à 5 Mo</div>
              <label class="mt-4 inline-block px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 cursor-pointer shadow-sm">
                <span>Parcourir mes fichiers</span>
                <input type="file" accept="image/*" class="hidden" onchange="window.app.handleImageFileInput(event)">
              </label>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end gap-2 flex-shrink-0">
          <button type="button" onclick="window.app.closeImageModal()" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors">
            Fermer
          </button>
        </div>

      </div>
    </div>
  `;
}

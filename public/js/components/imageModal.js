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
    <div id="image-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        <!-- Header -->
        <div class="px-6 py-4 bg-white border-b border-zinc-200 flex items-center justify-between flex-shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
              ${getIcon("eye", "w-3.5 h-3.5")}
            </div>
            <div>
              <h3 class="font-semibold text-sm text-zinc-900">Médiathèque & Photo</h3>
              <p class="text-[11px] text-zinc-500">Section : <span class="capitalize text-zinc-800 font-medium">${sectionType}</span></p>
            </div>
          </div>
          <button type="button" onclick="window.app.closeImageModal()" class="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors">
            ${getIcon("x", "w-4 h-4")}
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="px-6 pt-2.5 pb-2 bg-zinc-50/60 border-b border-zinc-200 flex gap-2 text-xs flex-shrink-0">
          <button type="button" onclick="window.app.switchImageTab('library')" id="tab-img-library" class="px-3 py-1.5 rounded-md font-medium text-zinc-900 bg-white shadow-xs border border-zinc-200">
            Bibliothèque Métier
          </button>
          <button type="button" onclick="window.app.switchImageTab('url')" id="tab-img-url" class="px-3 py-1.5 rounded-md font-medium text-zinc-600 hover:text-zinc-900 border border-transparent">
            Coller une URL
          </button>
          <button type="button" onclick="window.app.switchImageTab('upload')" id="tab-img-upload" class="px-3 py-1.5 rounded-md font-medium text-zinc-600 hover:text-zinc-900 border border-transparent">
            Fichier Local
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          <!-- Current Image Preview with Trash button -->
          <div class="bg-zinc-50 rounded-xl p-3 border border-zinc-200 flex items-center gap-3.5">
            <div class="w-16 h-16 rounded-lg overflow-hidden bg-zinc-900 flex-shrink-0 border border-zinc-200">
              ${currentUrl ? `
                <img id="image-modal-preview" src="${currentUrl}" alt="Aperçu actuel" class="w-full h-full object-cover">
              ` : `
                <div class="w-full h-full flex items-center justify-center text-zinc-400 text-[10px] italic">Sans photo</div>
              `}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-xs font-semibold text-zinc-900">Photo actuelle</div>
              <div class="text-[11px] text-zinc-500 truncate mt-0.5">${currentUrl || 'Aucune image définie'}</div>
              <div class="flex items-center gap-2 mt-1.5">
                <button type="button" onclick="window.app.deletePhotoFromModal()" class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors" title="Supprimer définitivement l'image">
                  ${getIcon("trash", "w-3 h-3")}
                  <span>Mettre à la poubelle</span>
                </button>
              </div>
            </div>
          </div>

          <!-- TAB 1: CURATED TRADE LIBRARY -->
          <div id="image-panel-library" class="space-y-2.5">
            <div class="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Photos HD pour ${trade.label}</div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              ${curatedImages.map(img => `
                <div onclick="window.app.selectPhotoFromLibrary('${img.url}')" class="group relative rounded-lg overflow-hidden border cursor-pointer transition-all hover:border-zinc-900 hover:shadow-xs ${img.url === currentUrl ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200'}">
                  <img src="${img.url}" alt="${img.label}" class="w-full h-20 object-cover group-hover:scale-105 transition-transform duration-300">
                  <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                    <span class="text-[9.5px] text-white font-medium truncate">${img.label}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- TAB 2: URL INPUT -->
          <div id="image-panel-url" class="space-y-3" style="display:none;">
            <div>
              <label class="block text-[11px] font-medium text-zinc-600 mb-1">
                Adresse URL de l'image (HTTPS)
              </label>
              <input type="url" id="image-modal-url-input" value="${currentUrl}" placeholder="https://images.unsplash.com/photo-..." class="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 font-medium focus:bg-white focus:border-zinc-900 focus:outline-none">
            </div>
            <button type="button" onclick="window.app.applyPhotoFromUrl()" class="w-full py-2 rounded-lg text-xs font-medium text-white bg-zinc-900 hover:bg-black shadow-xs transition-colors">
              Valider cette image
            </button>
          </div>

          <!-- TAB 3: FILE DRAG & DROP / LOCAL UPLOAD -->
          <div id="image-panel-upload" class="space-y-3" style="display:none;">
            <div id="image-dropzone" ondragover="event.preventDefault(); this.classList.add('border-zinc-900', 'bg-zinc-100');" ondragleave="this.classList.remove('border-zinc-900', 'bg-zinc-100');" ondrop="window.app.handleImageFileDrop(event)" class="border-2 border-dashed border-zinc-300 rounded-xl p-6 text-center bg-zinc-50 transition-colors cursor-pointer hover:bg-zinc-100">
              <div class="w-10 h-10 rounded-xl bg-zinc-200/80 text-zinc-700 flex items-center justify-center mx-auto mb-2">
                ${getIcon("upload", "w-5 h-5")}
              </div>
              <div class="text-xs font-semibold text-zinc-800">Glissez-déposez votre image ici</div>
              <div class="text-[10.5px] text-zinc-500 mt-0.5">PNG, JPG, WebP jusqu'à 5 Mo</div>
              <label class="mt-3 inline-block px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 cursor-pointer shadow-xs">
                <span>Parcourir mes fichiers</span>
                <input type="file" accept="image/*" class="hidden" onchange="window.app.handleImageFileInput(event)">
              </label>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="px-6 py-3 bg-zinc-50 border-t border-zinc-200 flex justify-end gap-2 flex-shrink-0">
          <button type="button" onclick="window.app.closeImageModal()" class="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-200 transition-colors">
            Fermer
          </button>
        </div>

      </div>
    </div>
  `;
}

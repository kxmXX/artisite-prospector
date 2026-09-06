import { getIcon } from "./icons.js";
import { SECTION_DEFINITIONS } from "./addSectionModal.js";

/**
 * Enhanced Inspector Panel for the selected section.
 * Allows Michel to quickly adjust texts, images, section variants,
 * and individual list items (Services, FAQ, Stats, Reviews, etc.).
 * Includes direct Trash and Replace controls for photos.
 */

export function renderInspector(section, project, state) {
  if (!section) {
    return `
      <div class="p-8 text-center text-slate-400 space-y-2">
        <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          ${getIcon("sliders", "w-6 h-6")}
        </div>
        <div class="text-xs font-bold text-slate-600">Aucune section sélectionnée</div>
        <div class="text-[11px] text-slate-400">Cliquez sur une section dans le site ou le menu pour ajuster son contenu.</div>
      </div>
    `;
  }

  const c = section.content || {};
  const sectionId = section.id;
  const isHidden = section.visibility === false;

  // Find section definition for variants
  const secDef = SECTION_DEFINITIONS.find(d => d.type === section.type);
  const variants = secDef?.variants || [];

  return `
    <div class="p-5 space-y-6">
      
      <!-- Section Header Info -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <div class="text-[10px] font-bold uppercase tracking-wider text-orange-600">Éditeur de Section</div>
          <h3 class="font-heading text-base font-bold text-slate-900 capitalize">${secDef?.title || section.type}</h3>
        </div>

        <div class="flex items-center gap-1">
          <button type="button" onclick="window.app.toggleSectionVisibility('${sectionId}')" class="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100" title="${isHidden ? 'Afficher' : 'Masquer'}">
            ${getIcon(isHidden ? "eyeOff" : "eye", "w-4 h-4")}
          </button>
          <button type="button" onclick="window.app.duplicateSection('${sectionId}')" class="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100" title="Dupliquer">
            ${getIcon("copy", "w-4 h-4")}
          </button>
          <button type="button" onclick="window.app.deleteSection('${sectionId}')" class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50" title="Supprimer">
            ${getIcon("trash", "w-4 h-4")}
          </button>
        </div>
      </div>

      <!-- Section Variant Switcher -->
      ${variants.length > 1 ? `
        <div class="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-3.5 space-y-1.5">
          <label class="block text-[10px] font-bold text-orange-900 uppercase tracking-wider">Variante d'Affichage</label>
          <select onchange="window.app.changeSectionVariant('${sectionId}', this.value)" class="w-full bg-white border border-orange-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500">
            ${variants.map(v => `
              <option value="${v.id}" ${section.variant === v.id ? 'selected' : ''}>${v.label}</option>
            `).join('')}
          </select>
          <div class="text-[10px] text-orange-800/80">
            ${variants.find(v => v.id === section.variant)?.desc || ''}
          </div>
        </div>
      ` : ''}

      <!-- Quick Fields Form -->
      <form onsubmit="event.preventDefault();" class="space-y-4 text-xs">
        
        ${c.badge !== undefined ? `
          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">Badge / Surtitre</label>
            <input type="text" value="${escapeHtml(c.badge)}" onchange="window.app.updateSectionContent('${sectionId}', 'badge', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>
        ` : ''}

        ${c.title !== undefined ? `
          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">Titre principal</label>
            <textarea rows="2" onchange="window.app.updateSectionContent('${sectionId}', 'title', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">${escapeHtml(c.title)}</textarea>
          </div>
        ` : ''}

        ${c.subtitle !== undefined ? `
          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">Sous-titre / Descriptif</label>
            <textarea rows="3" onchange="window.app.updateSectionContent('${sectionId}', 'subtitle', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">${escapeHtml(c.subtitle)}</textarea>
          </div>
        ` : ''}

        <!-- Hero image with quick trash & replace -->
        ${c.heroImage !== undefined ? `
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">Photo Principale</label>
              <div class="flex items-center gap-1">
                <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'heroImage')" class="text-orange-600 hover:text-orange-700 font-bold text-[11px] bg-orange-50 px-2 py-0.5 rounded border border-orange-200 flex items-center gap-1">
                  ${getIcon("eye", "w-3 h-3")}
                  <span>Remplacer</span>
                </button>
                <button type="button" onclick="window.app.deletePhoto('${sectionId}', 'heroImage')" class="text-red-600 hover:text-red-700 font-bold text-[11px] bg-red-50 px-2 py-0.5 rounded border border-red-200 flex items-center gap-1" title="Supprimer (Poubelle)">
                  ${getIcon("trash", "w-3 h-3")}
                  <span>Poubelle</span>
                </button>
              </div>
            </div>
            <div class="aspect-[16/9] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative group">
              <img src="${c.heroImage || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80'}" alt="Visuel Hero" class="w-full h-full object-cover">
            </div>
          </div>
        ` : ''}

        ${c.ctaPrimary !== undefined ? `
          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">Bouton Principal</label>
            <input type="text" value="${escapeHtml(c.ctaPrimary)}" onchange="window.app.updateSectionContent('${sectionId}', 'ctaPrimary', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>
        ` : ''}

        ${c.ctaSecondary !== undefined ? `
          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">Bouton Secondaire</label>
            <input type="text" value="${escapeHtml(c.ctaSecondary)}" onchange="window.app.updateSectionContent('${sectionId}', 'ctaSecondary', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>
        ` : ''}

        ${c.phone !== undefined ? `
          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">Téléphone Direct</label>
            <input type="text" value="${escapeHtml(c.phone)}" onchange="window.app.updateSectionContent('${sectionId}', 'phone', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>
        ` : ''}

        <!-- Before / After specific fields with photo management -->
        ${section.type === 'beforeAfter' ? `
          <div class="space-y-3 pt-2 border-t border-slate-100">
            <div class="font-bold text-slate-800 text-xs">Photos Comparatives</div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="block text-[10px] text-slate-500">Photo Avant :</label>
                <div class="flex items-center gap-1">
                  <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'beforeImage')" class="text-orange-600 font-bold text-[10px]">Remplacer</button>
                  <button type="button" onclick="window.app.deletePhoto('${sectionId}', 'beforeImage')" class="text-red-600 font-bold text-[10px]" title="Supprimer">Poubelle</button>
                </div>
              </div>
              <div class="h-20 rounded-lg overflow-hidden border border-slate-200">
                <img src="${c.beforeImage || ''}" alt="Avant" class="w-full h-full object-cover">
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="block text-[10px] text-slate-500">Photo Après :</label>
                <div class="flex items-center gap-1">
                  <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'afterImage')" class="text-orange-600 font-bold text-[10px]">Remplacer</button>
                  <button type="button" onclick="window.app.deletePhoto('${sectionId}', 'afterImage')" class="text-red-600 font-bold text-[10px]" title="Supprimer">Poubelle</button>
                </div>
              </div>
              <div class="h-20 rounded-lg overflow-hidden border border-slate-200">
                <img src="${c.afterImage || ''}" alt="Après" class="w-full h-full object-cover">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] text-slate-500 mb-1">Label Avant :</label>
                <input type="text" value="${escapeHtml(c.beforeLabel || '')}" onchange="window.app.updateSectionContent('${sectionId}', 'beforeLabel', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs">
              </div>
              <div>
                <label class="block text-[10px] text-slate-500 mb-1">Label Après :</label>
                <input type="text" value="${escapeHtml(c.afterLabel || '')}" onchange="window.app.updateSectionContent('${sectionId}', 'afterLabel', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs">
              </div>
            </div>
          </div>
        ` : ''}

        <!-- About specific fields with portrait photo management -->
        ${section.type === 'about' ? `
          <div class="space-y-3 pt-2 border-t border-slate-100">
            <div class="font-bold text-slate-800 text-xs">Informations Fondateur</div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] text-slate-500 mb-1">Nom / Équipe :</label>
                <input type="text" value="${escapeHtml(c.owner || '')}" onchange="window.app.updateSectionContent('${sectionId}', 'owner', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
              </div>
              <div>
                <label class="block text-[10px] text-slate-500 mb-1">Titre / Rôle :</label>
                <input type="text" value="${escapeHtml(c.role || '')}" onchange="window.app.updateSectionContent('${sectionId}', 'role', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
              </div>
            </div>
            <div>
              <label class="block text-[10px] text-slate-500 mb-1">Histoire de l'entreprise :</label>
              <textarea rows="4" onchange="window.app.updateSectionContent('${sectionId}', 'story', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs leading-relaxed">${escapeHtml(c.story || '')}</textarea>
            </div>
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="block text-[10px] text-slate-500">Photo Portrait / Métier :</label>
                <div class="flex items-center gap-1">
                  <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'image')" class="text-orange-600 font-bold text-[10px]">Remplacer</button>
                  <button type="button" onclick="window.app.deletePhoto('${sectionId}', 'image')" class="text-red-600 font-bold text-[10px]" title="Supprimer">Poubelle</button>
                </div>
              </div>
              <div class="h-24 rounded-lg overflow-hidden border border-slate-200">
                <img src="${c.image || ''}" alt="Portrait" class="w-full h-full object-cover">
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Services list editor with service photo management -->
        ${section.type === 'services' && Array.isArray(c.services) ? `
          <div class="space-y-3 pt-2 border-t border-slate-100">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-800 text-xs">Prestations (${c.services.length})</span>
              <button type="button" onclick="window.app.addServiceItem('${sectionId}')" class="text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 flex items-center gap-1">
                ${getIcon("plus", "w-3 h-3")}
                <span>Ajouter</span>
              </button>
            </div>

            <div class="space-y-3">
              ${c.services.map((srv, idx) => `
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 relative group">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="font-bold text-slate-700">Prestation #${idx + 1}</span>
                    <button type="button" onclick="window.app.removeServiceItem('${sectionId}', ${idx})" class="text-slate-400 hover:text-red-600" title="Supprimer">
                      ${getIcon("trash", "w-3.5 h-3.5")}
                    </button>
                  </div>
                  <input type="text" placeholder="Titre prestation" value="${escapeHtml(srv.title)}" onchange="window.app.updateSectionContent('${sectionId}', 'services.${idx}.title', this.value)" class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold">
                  
                  <!-- Service image preview & replace -->
                  <div class="flex items-center gap-2">
                    <div class="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-200 flex-shrink-0">
                      <img src="${srv.image || ''}" alt="${srv.title}" class="w-full h-full object-cover">
                    </div>
                    <div class="flex gap-1 text-[10px]">
                      <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'services.${idx}.image', ${idx})" class="text-orange-600 bg-orange-50 px-2 py-1 rounded font-bold hover:bg-orange-100">Photo 🔄</button>
                      <button type="button" onclick="window.app.deletePhoto('${sectionId}', 'services.${idx}.image', ${idx})" class="text-red-600 bg-red-50 px-2 py-1 rounded font-bold hover:bg-red-100" title="Poubelle">🗑️</button>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Badge tag" value="${escapeHtml(srv.tag || '')}" onchange="window.app.updateSectionContent('${sectionId}', 'services.${idx}.tag', this.value)" class="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px]">
                    <input type="text" placeholder="Prix / Tarif" value="${escapeHtml(srv.price || '')}" onchange="window.app.updateSectionContent('${sectionId}', 'services.${idx}.price', this.value)" class="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px]">
                  </div>
                  <textarea rows="2" placeholder="Description courte..." onchange="window.app.updateSectionContent('${sectionId}', 'services.${idx}.desc', this.value)" class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] leading-tight">${escapeHtml(srv.desc || '')}</textarea>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Gallery list editor with photo replacement and trash -->
        ${section.type === 'gallery' && Array.isArray(c.photos) ? `
          <div class="space-y-3 pt-2 border-t border-slate-100">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-800 text-xs">Photos Galerie (${c.photos.length})</span>
              <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'photos', ${c.photos.length})" class="text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 flex items-center gap-1">
                ${getIcon("plus", "w-3 h-3")}
                <span>Ajouter photo</span>
              </button>
            </div>

            <div class="grid grid-cols-3 gap-2">
              ${c.photos.map((photo, idx) => `
                <div class="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-900 h-16">
                  <img src="${photo.url || ''}" alt="${photo.title || 'Photo'}" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'photos.${idx}.url', ${idx})" class="p-1 bg-white text-slate-900 rounded text-[10px]" title="Remplacer">🔄</button>
                    <button type="button" onclick="window.app.deletePhoto('${sectionId}', 'photos.${idx}.url', ${idx})" class="p-1 bg-red-600 text-white rounded text-[10px]" title="Poubelle">🗑️</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- FAQ list editor -->
        ${section.type === 'faq' && Array.isArray(c.items) ? `
          <div class="space-y-3 pt-2 border-t border-slate-100">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-800 text-xs">Questions FAQ (${c.items.length})</span>
              <button type="button" onclick="window.app.addFaqItem('${sectionId}')" class="text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 flex items-center gap-1">
                ${getIcon("plus", "w-3 h-3")}
                <span>Ajouter</span>
              </button>
            </div>

            <div class="space-y-3">
              ${c.items.map((item, idx) => `
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="font-bold text-slate-700">Question #${idx + 1}</span>
                    <button type="button" onclick="window.app.removeFaqItem('${sectionId}', ${idx})" class="text-slate-400 hover:text-red-600" title="Supprimer">
                      ${getIcon("trash", "w-3.5 h-3.5")}
                    </button>
                  </div>
                  <input type="text" value="${escapeHtml(item.q)}" onchange="window.app.updateSectionContent('${sectionId}', 'items.${idx}.q', this.value)" class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold" placeholder="Question...">
                  <textarea rows="2" onchange="window.app.updateSectionContent('${sectionId}', 'items.${idx}.a', this.value)" class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] leading-tight" placeholder="Réponse...">${escapeHtml(item.a)}</textarea>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Reviews specific fields -->
        ${section.type === 'reviews' ? `
          <div class="space-y-3 pt-2 border-t border-slate-100">
            <div class="font-bold text-slate-800 text-xs">Note & Avis</div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] text-slate-500 mb-1">Note globale :</label>
                <input type="text" value="${escapeHtml(c.overallRating || '4.9')}" onchange="window.app.updateSectionContent('${sectionId}', 'overallRating', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold">
              </div>
              <div>
                <label class="block text-[10px] text-slate-500 mb-1">Volume d'avis :</label>
                <input type="text" value="${escapeHtml(c.totalReviews || '48 avis Google')}" onchange="window.app.updateSectionContent('${sectionId}', 'totalReviews', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Location specific fields -->
        ${section.type === 'location' ? `
          <div class="space-y-3 pt-2 border-t border-slate-100">
            <div class="font-bold text-slate-800 text-xs">Localisation & Rayon</div>
            <div>
              <label class="block text-[10px] text-slate-500 mb-1">Adresse ou Zone :</label>
              <input type="text" value="${escapeHtml(c.address || '')}" onchange="window.app.updateSectionContent('${sectionId}', 'address', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            </div>
            <div>
              <label class="block text-[10px] text-slate-500 mb-1">Rayon d'intervention :</label>
              <input type="text" value="${escapeHtml(c.radius || '')}" onchange="window.app.updateSectionContent('${sectionId}', 'radius', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            </div>
          </div>
        ` : ''}

      </form>

      <!-- Section Actions -->
      <div class="pt-4 border-t border-slate-100 space-y-2">
        <button type="button" onclick="window.app.moveSection('${sectionId}', 'up')" class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
          ${getIcon("chevronUp", "w-4 h-4")}
          <span>Remonter d'un cran</span>
        </button>
        <button type="button" onclick="window.app.moveSection('${sectionId}', 'down')" class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
          ${getIcon("chevronDown", "w-4 h-4")}
          <span>Descendre d'un cran</span>
        </button>
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

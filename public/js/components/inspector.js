import { getIcon } from "./icons.js";
import { SECTION_DEFINITIONS } from "./addSectionModal.js";
import { getSectionFriendlyTitle } from "./editor.js";
import {
  COMPONENT_INTELLIGENCE_REGISTRY,
  calculateComponentConfidence,
  verifyAccessibility,
  detectAntiPatterns
} from "../engine/componentIntelligence.js";
import { escapeHtml } from "../utils/html.js";

/**
 * Sendpage / Linear Minimalist Inspector Panel.
 * Clean 1px micro-borders, refined typography, and real-time live typing.
 */

export function renderInspector(section, project, state) {
  if (!section) {
    return `
      <div class="p-8 text-center text-zinc-400 space-y-2">
        <div class="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400 border border-zinc-200">
          ${getIcon("sliders", "w-5 h-5")}
        </div>
        <div class="text-xs font-medium text-zinc-600">Aucune section sélectionnée</div>
        <div class="text-ui-sm text-zinc-400">Cliquez sur une section pour ajuster son contenu en direct.</div>
      </div>
    `;
  }

  const c = section.content || {};
  const sectionId = section.id;
  const isHidden = section.visibility === false;

  const secDef = SECTION_DEFINITIONS.find(d => d.type === section.type);
  const variants = secDef?.variants || [];
  const friendlyTitle = getSectionFriendlyTitle(section);

  return `
    <div class="p-4 space-y-5" id="inspector-panel-content">
      
      <!-- Section Header Info -->
      <div class="flex items-center justify-between pb-3 border-b border-zinc-200">
        <div>
          <div class="text-ui-xs font-medium uppercase tracking-wider text-zinc-400">Inspecteur de Section</div>
          <h3 class="font-semibold text-sm text-zinc-900 capitalize">${friendlyTitle}</h3>
        </div>

        <div class="flex items-center gap-1">
          <button type="button" onclick="window.app.toggleSectionVisibility('${sectionId}')" class="p-1 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors" title="${isHidden ? 'Afficher' : 'Masquer'}">
            ${getIcon(isHidden ? "eyeOff" : "eye", "w-3.5 h-3.5")}
          </button>
          <button type="button" onclick="window.app.duplicateSection('${sectionId}')" class="p-1 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors" title="Dupliquer">
            ${getIcon("copy", "w-3.5 h-3.5")}
          </button>
          <button type="button" onclick="window.app.deleteSection('${sectionId}')" class="p-1 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Supprimer">
            ${getIcon("trash", "w-3.5 h-3.5")}
          </button>
        </div>
      </div>

      <!-- Section Variant Switcher -->
      ${variants.length > 1 ? `
        <div class="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
          <label class="block text-ui-xs font-medium text-zinc-500 uppercase tracking-wider">Variante d'Affichage</label>
          <select onchange="window.app.changeSectionVariant('${sectionId}', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-900 focus:border-zinc-900 focus:outline-none">
            ${variants.map(v => `
              <option value="${v.id}" ${section.variant === v.id ? 'selected' : ''}>${v.label}</option>
            `).join('')}
          </select>
          <div class="text-ui-xs text-zinc-400">
            ${variants.find(v => v.id === section.variant)?.desc || ''}
          </div>
        </div>
      ` : ''}

      <!-- Animation Suite 60fps -->
      <div class="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class="text-amber-500 font-bold">✨</span>
            <label class="text-ui-xs font-bold uppercase tracking-wider text-zinc-700">Animation du Bloc (60fps)</label>
          </div>
          <span class="text-ui-2xs font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
            ${section.settings?.motionPreset || section.motionPreset || 'aucune'}
          </span>
        </div>

        <div class="grid grid-cols-4 gap-1">
          ${[
            ['none', 'Aucune'],
            ['fade-in', 'Fade'],
            ['slide-up', 'Slide'],
            ['spring', 'Spring'],
            ['reveal', 'Reveal'],
            ['stagger', 'Stagger'],
            ['shimmer', 'Shimmer'],
            ['pulse', 'Pulse'],
            ['magnetic', 'Magnetic'],
            ['zoom-in', 'Zoom']
          ].map(([preset, label]) => `
            <button type="button"
                    onmouseenter="window.app.previewSectionMotion('${sectionId}', '${preset}')"
                    onclick="window.app.setSectionMotion('${sectionId}', '${preset}')"
                    class="py-1 px-1 border rounded text-ui-xs font-medium text-center transition-all ${((section.settings?.motionPreset || section.motionPreset || 'none') === preset || (!section.settings?.motionPreset && !section.motionPreset && preset === 'none')) ? 'border-zinc-900 bg-zinc-900 text-white font-semibold shadow-2xs' : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'}">
              ${label}
            </button>
          `).join('')}
        </div>

        <button type="button"
                onclick="window.app.previewSectionMotion('${sectionId}', '${section.settings?.motionPreset || section.motionPreset || 'fade-in'}')"
                class="w-full py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 rounded-lg text-xs font-semibold border border-zinc-200 flex items-center justify-center gap-1.5 shadow-2xs transition-colors">
          <span>▶ Tester l'animation en direct</span>
        </button>
      </div>

      <!-- Quick Component Inserter -->
      <div class="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-ui-xs font-bold uppercase tracking-wider text-zinc-700">+ Ajouter un élément</label>
          <button type="button" onclick="window.app.openAddSectionModal('components')" class="text-ui-xs font-semibold text-zinc-900 hover:underline">Catalogue complet →</button>
        </div>
        <div class="grid grid-cols-2 gap-1 text-ui-sm">
          <button type="button" onclick="window.app.insertQuickComponent('${sectionId}', 'button')" class="py-1.5 px-2 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-700 font-medium flex items-center gap-1.5 transition-colors">
            <span>🔘 Bouton CTA</span>
          </button>
          <button type="button" onclick="window.app.insertQuickComponent('${sectionId}', 'badge')" class="py-1.5 px-2 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-700 font-medium flex items-center gap-1.5 transition-colors">
            <span>🏷️ Badge Confiance</span>
          </button>
          <button type="button" onclick="window.app.insertQuickComponent('${sectionId}', 'quote')" class="py-1.5 px-2 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-700 font-medium flex items-center gap-1.5 transition-colors">
            <span>💬 Citation Avis</span>
          </button>
          <button type="button" onclick="window.app.insertQuickComponent('${sectionId}', 'separator')" class="py-1.5 px-2 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-700 font-medium flex items-center gap-1.5 transition-colors">
            <span>➖ Séparateur</span>
          </button>
        </div>
      </div>

      <!-- Quick Fields Form with Live OnInput -->
      <form id="inspector-form" onsubmit="event.preventDefault();" class="space-y-3.5 text-xs">
        
        ${c.badge !== undefined ? `
          <div>
            <label class="block text-ui-xs font-medium text-zinc-500 mb-1">Badge / Surtitre :</label>
            <input type="text" value="${escapeHtml(c.badge)}" 
                   data-field="badge"
                   oninput="window.app.liveUpdateText('${sectionId}', 'badge', this.value)"
                   onchange="window.app.commitTextUpdate('${sectionId}', 'badge', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-zinc-900 focus:border-zinc-900 focus:outline-none transition-colors">
          </div>
        ` : ''}

        ${c.title !== undefined ? `
          <div>
            <label class="block text-ui-xs font-medium text-zinc-500 mb-1">Titre principal :</label>
            <textarea rows="2" 
                      data-field="title"
                      oninput="window.app.liveUpdateText('${sectionId}', 'title', this.value)"
                      onchange="window.app.commitTextUpdate('${sectionId}', 'title', this.value)"
                      class="w-full bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-zinc-900 focus:border-zinc-900 focus:outline-none transition-colors leading-snug">${escapeHtml(c.title)}</textarea>
          </div>
        ` : ''}

        ${c.subtitle !== undefined ? `
          <div>
            <label class="block text-ui-xs font-medium text-zinc-500 mb-1">Sous-titre / Descriptif :</label>
            <textarea rows="3" 
                      data-field="subtitle"
                      oninput="window.app.liveUpdateText('${sectionId}', 'subtitle', this.value)"
                      onchange="window.app.commitTextUpdate('${sectionId}', 'subtitle', this.value)"
                      class="w-full bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-zinc-900 focus:border-zinc-900 focus:outline-none transition-colors leading-relaxed">${escapeHtml(c.subtitle)}</textarea>
          </div>
        ` : ''}

        <!-- Hero photo with quick trash & replace -->
        ${c.heroImage !== undefined ? `
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="block text-ui-xs font-medium text-zinc-500">Photo Principale :</label>
              <div class="flex items-center gap-1">
                <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'heroImage')" class="text-zinc-700 hover:text-zinc-900 font-medium text-ui-xs bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded border border-zinc-200 transition-colors">
                  <span>Remplacer</span>
                </button>
                <button type="button" onclick="window.app.deletePhoto('${sectionId}', 'heroImage')" class="text-red-600 hover:text-red-700 font-medium text-ui-xs bg-red-50 hover:bg-red-100 px-1.5 py-0.5 rounded border border-red-200 transition-colors" title="Supprimer (Poubelle)">
                  <span>🗑️</span>
                </button>
              </div>
            </div>
            <div class="aspect-[16/9] rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100 relative group">
              <img src="${c.heroImage || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80'}" alt="Visuel Hero" class="w-full h-full object-cover">
            </div>
          </div>
        ` : ''}

        ${c.ctaPrimary !== undefined ? `
          <div>
            <label class="block text-ui-xs font-medium text-zinc-500 mb-1">Bouton Principal :</label>
            <input type="text" value="${escapeHtml(c.ctaPrimary)}" 
                   data-field="ctaPrimary"
                   oninput="window.app.liveUpdateText('${sectionId}', 'ctaPrimary', this.value)"
                   onchange="window.app.commitTextUpdate('${sectionId}', 'ctaPrimary', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-zinc-900 focus:border-zinc-900 focus:outline-none">
          </div>
        ` : ''}

        ${c.ctaSecondary !== undefined ? `
          <div>
            <label class="block text-ui-xs font-medium text-zinc-500 mb-1">Bouton Secondaire :</label>
            <input type="text" value="${escapeHtml(c.ctaSecondary)}" 
                   data-field="ctaSecondary"
                   oninput="window.app.liveUpdateText('${sectionId}', 'ctaSecondary', this.value)"
                   onchange="window.app.commitTextUpdate('${sectionId}', 'ctaSecondary', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-zinc-900 focus:border-zinc-900 focus:outline-none">
          </div>
        ` : ''}

        ${c.text !== undefined ? `
          <div>
            <label class="block text-ui-xs font-medium text-zinc-500 mb-1">Texte / Argumentaire :</label>
            <textarea rows="3" 
                      data-field="text"
                      oninput="window.app.liveUpdateText('${sectionId}', 'text', this.value)"
                      onchange="window.app.commitTextUpdate('${sectionId}', 'text', this.value)"
                      class="w-full bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-zinc-900 focus:border-zinc-900 focus:outline-none transition-colors leading-relaxed">${escapeHtml(c.text)}</textarea>
          </div>
        ` : ''}

        ${c.ctaText !== undefined ? `
          <div>
            <label class="block text-ui-xs font-medium text-zinc-500 mb-1">Bouton d'Appel / Action :</label>
            <input type="text" value="${escapeHtml(c.ctaText)}" 
                   data-field="ctaText"
                   oninput="window.app.liveUpdateText('${sectionId}', 'ctaText', this.value)"
                   onchange="window.app.commitTextUpdate('${sectionId}', 'ctaText', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-zinc-900 focus:border-zinc-900 focus:outline-none">
          </div>
        ` : ''}

        ${c.phone !== undefined ? `
          <div>
            <label class="block text-ui-xs font-medium text-zinc-500 mb-1">Téléphone Direct :</label>
            <input type="text" value="${escapeHtml(c.phone)}" 
                   data-field="phone"
                   oninput="window.app.liveUpdateText('${sectionId}', 'phone', this.value)"
                   onchange="window.app.commitTextUpdate('${sectionId}', 'phone', this.value)"
                   class="w-full bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-zinc-900 focus:border-zinc-900 focus:outline-none">
          </div>
        ` : ''}

        <!-- Before / After specific fields -->
        ${section.type === 'beforeAfter' ? `
          <div class="space-y-2.5 pt-2 border-t border-zinc-100">
            <div class="font-medium text-zinc-700 text-xs">Photos Comparatives</div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="block text-ui-xs text-zinc-500">Photo Avant :</label>
                <div class="flex items-center gap-1">
                  <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'beforeImage')" class="text-zinc-700 hover:underline text-ui-xs font-medium">Changer</button>
                  <button type="button" onclick="window.app.deletePhoto('${sectionId}', 'beforeImage')" class="text-red-600 text-ui-xs" title="Supprimer">🗑️</button>
                </div>
              </div>
              <div class="h-20 rounded-md overflow-hidden border border-zinc-200">
                <img src="${c.beforeImage || ''}" alt="Avant" class="w-full h-full object-cover">
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="block text-ui-xs text-zinc-500">Photo Après :</label>
                <div class="flex items-center gap-1">
                  <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'afterImage')" class="text-zinc-700 hover:underline text-ui-xs font-medium">Changer</button>
                  <button type="button" onclick="window.app.deletePhoto('${sectionId}', 'afterImage')" class="text-red-600 text-ui-xs" title="Supprimer">🗑️</button>
                </div>
              </div>
              <div class="h-20 rounded-md overflow-hidden border border-zinc-200">
                <img src="${c.afterImage || ''}" alt="Après" class="w-full h-full object-cover">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-ui-xs text-zinc-500 mb-1">Label Avant :</label>
                <input type="text" value="${escapeHtml(c.beforeLabel || '')}" 
                       data-field="beforeLabel"
                       oninput="window.app.liveUpdateText('${sectionId}', 'beforeLabel', this.value)"
                       onchange="window.app.commitTextUpdate('${sectionId}', 'beforeLabel', this.value)" 
                       class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs">
              </div>
              <div>
                <label class="block text-ui-xs text-zinc-500 mb-1">Label Après :</label>
                <input type="text" value="${escapeHtml(c.afterLabel || '')}" 
                       data-field="afterLabel"
                       oninput="window.app.liveUpdateText('${sectionId}', 'afterLabel', this.value)"
                       onchange="window.app.commitTextUpdate('${sectionId}', 'afterLabel', this.value)" 
                       class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs">
              </div>
            </div>
          </div>
        ` : ''}

        <!-- About specific fields with portrait photo management -->
        ${section.type === 'about' ? `
          <div class="space-y-2.5 pt-2 border-t border-zinc-100">
            <div class="font-medium text-zinc-700 text-xs">Informations Fondateur</div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-ui-xs text-zinc-500 mb-1">Nom / Équipe :</label>
                <input type="text" value="${escapeHtml(c.owner || '')}" 
                       data-field="owner"
                       oninput="window.app.liveUpdateText('${sectionId}', 'owner', this.value)"
                       onchange="window.app.commitTextUpdate('${sectionId}', 'owner', this.value)" 
                       class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs">
              </div>
              <div>
                <label class="block text-ui-xs text-zinc-500 mb-1">Titre / Rôle :</label>
                <input type="text" value="${escapeHtml(c.role || '')}" 
                       data-field="role"
                       oninput="window.app.liveUpdateText('${sectionId}', 'role', this.value)"
                       onchange="window.app.commitTextUpdate('${sectionId}', 'role', this.value)" 
                       class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs">
              </div>
            </div>
            <div>
              <label class="block text-ui-xs text-zinc-500 mb-1">Histoire de l'entreprise :</label>
              <textarea rows="3" 
                        data-field="story"
                        oninput="window.app.liveUpdateText('${sectionId}', 'story', this.value)"
                        onchange="window.app.commitTextUpdate('${sectionId}', 'story', this.value)" 
                        class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1.5 text-xs leading-relaxed">${escapeHtml(c.story || '')}</textarea>
            </div>
            ${Array.isArray(c.points) && c.points.length > 0 ? `
              <div>
                <label class="block text-ui-xs text-zinc-500 mb-1">Points forts & Savoir-faire :</label>
                <div class="space-y-1.5">
                  ${c.points.map((pt, pIdx) => `
                    <div class="flex items-center gap-1.5">
                      <span class="text-ui-xs text-zinc-400 font-mono w-4">${pIdx + 1}.</span>
                      <input type="text" value="${escapeHtml(pt || '')}"
                             data-field="points.${pIdx}"
                             oninput="window.app.liveUpdateText('${sectionId}', 'points.${pIdx}', this.value)"
                             onchange="window.app.commitTextUpdate('${sectionId}', 'points.${pIdx}', this.value)"
                             class="flex-1 bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs">
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="block text-ui-xs text-zinc-500">Photo Portrait :</label>
                <div class="flex items-center gap-1">
                  <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'image')" class="text-zinc-700 hover:underline text-ui-xs font-medium">Changer</button>
                  <button type="button" onclick="window.app.deletePhoto('${sectionId}', 'image')" class="text-red-600 text-ui-xs" title="Supprimer">🗑️</button>
                </div>
              </div>
              <div class="h-20 rounded-md overflow-hidden border border-zinc-200">
                <img src="${c.image || ''}" alt="Portrait" class="w-full h-full object-cover">
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Services list editor with service photo management -->
        ${section.type === 'services' && Array.isArray(c.services) ? `
          <div class="space-y-2.5 pt-2 border-t border-zinc-100">
            <div class="flex items-center justify-between">
              <span class="font-medium text-zinc-700 text-xs">Prestations (${c.services.length})</span>
              <button type="button" onclick="window.app.addServiceItem('${sectionId}')" class="text-ui-xs font-medium text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded border border-zinc-200 flex items-center gap-1">
                ${getIcon("plus", "w-3 h-3")}
                <span>Ajouter</span>
              </button>
            </div>

            <div class="space-y-2">
              ${c.services.map((srv, idx) => `
                <div class="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200 space-y-2">
                  <div class="flex items-center justify-between text-ui-sm">
                    <span class="font-medium text-zinc-700">Prestation #${idx + 1}</span>
                    <button type="button" onclick="window.app.removeServiceItem('${sectionId}', ${idx})" class="text-zinc-400 hover:text-red-600" title="Supprimer">
                      ${getIcon("trash", "w-3.5 h-3.5")}
                    </button>
                  </div>
                  <input type="text" placeholder="Titre prestation" value="${escapeHtml(srv.title)}" onchange="window.app.updateSectionContent('${sectionId}', 'services.${idx}.title', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs font-medium">
                  
                  <div class="flex items-center gap-2">
                    <div class="w-10 h-10 rounded-md overflow-hidden border border-zinc-200 bg-zinc-100 flex-shrink-0">
                      <img src="${srv.image || ''}" alt="${srv.title}" class="w-full h-full object-cover">
                    </div>
                    <div class="flex gap-1 text-ui-xs">
                      <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'services.${idx}.image', ${idx})" class="text-zinc-700 bg-white border border-zinc-200 px-2 py-0.5 rounded font-medium hover:bg-zinc-50">Photo 🔄</button>
                      <button type="button" onclick="window.app.deletePhoto('${sectionId}', 'services.${idx}.image', ${idx})" class="text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-medium hover:bg-red-100" title="Poubelle">🗑️</button>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Badge tag" value="${escapeHtml(srv.tag || '')}" onchange="window.app.updateSectionContent('${sectionId}', 'services.${idx}.tag', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-ui-sm">
                    <input type="text" placeholder="Prix" value="${escapeHtml(srv.price || '')}" onchange="window.app.updateSectionContent('${sectionId}', 'services.${idx}.price', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-ui-sm">
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Gallery list editor with photo replacement and trash -->
        ${section.type === 'gallery' && Array.isArray(c.photos) ? `
          <div class="space-y-2.5 pt-2 border-t border-zinc-100">
            <div class="flex items-center justify-between">
              <span class="font-medium text-zinc-700 text-xs">Photos Galerie (${c.photos.length})</span>
              <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'photos', ${c.photos.length})" class="text-ui-xs font-medium text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded border border-zinc-200 flex items-center gap-1">
                ${getIcon("plus", "w-3 h-3")}
                <span>Ajouter</span>
              </button>
            </div>

            <div class="grid grid-cols-3 gap-1.5">
              ${c.photos.map((photo, idx) => `
                <div class="relative group rounded-md overflow-hidden border border-zinc-200 bg-zinc-900 h-14">
                  <img src="${photo.url || ''}" alt="${photo.title || 'Photo'}" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button type="button" onclick="window.app.openImagePicker('${sectionId}', 'photos.${idx}.url', ${idx})" class="p-1 bg-white text-zinc-900 rounded text-ui-xs" title="Remplacer">🔄</button>
                    <button type="button" onclick="window.app.deletePhoto('${sectionId}', 'photos.${idx}.url', ${idx})" class="p-1 bg-red-600 text-white rounded text-ui-xs" title="Poubelle">🗑️</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- FAQ list editor -->
        ${section.type === 'faq' && Array.isArray(c.items) ? `
          <div class="space-y-2.5 pt-2 border-t border-zinc-100">
            <div class="flex items-center justify-between">
              <span class="font-medium text-zinc-700 text-xs">Questions FAQ (${c.items.length})</span>
              <button type="button" onclick="window.app.addFaqItem('${sectionId}')" class="text-ui-xs font-medium text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded border border-zinc-200 flex items-center gap-1">
                ${getIcon("plus", "w-3 h-3")}
                <span>Ajouter</span>
              </button>
            </div>

            <div class="space-y-2">
              ${c.items.map((item, idx) => `
                <div class="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1.5">
                  <div class="flex items-center justify-between text-ui-sm">
                    <span class="font-medium text-zinc-700">Q#${idx + 1}</span>
                    <button type="button" onclick="window.app.removeFaqItem('${sectionId}', ${idx})" class="text-zinc-400 hover:text-red-600" title="Supprimer">
                      ${getIcon("trash", "w-3.5 h-3.5")}
                    </button>
                  </div>
                  <input type="text" value="${escapeHtml(item.q)}" onchange="window.app.updateSectionContent('${sectionId}', 'items.${idx}.q', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs font-medium" placeholder="Question...">
                  <textarea rows="2" onchange="window.app.updateSectionContent('${sectionId}', 'items.${idx}.a', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2 py-1 text-ui-sm leading-snug" placeholder="Réponse...">${escapeHtml(item.a)}</textarea>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Location specific fields -->
        ${section.type === 'location' ? `
          <div class="space-y-2 pt-2 border-t border-zinc-100">
            <div class="font-medium text-zinc-700 text-xs">Localisation & Rayon</div>
            <div>
              <label class="block text-ui-xs text-zinc-500 mb-1">Adresse ou Zone :</label>
              <input type="text" value="${escapeHtml(c.address || '')}" 
                     data-field="address"
                     oninput="window.app.liveUpdateText('${sectionId}', 'address', this.value)"
                     onchange="window.app.commitTextUpdate('${sectionId}', 'address', this.value)" 
                     class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs">
            </div>
            <div>
              <label class="block text-ui-xs text-zinc-500 mb-1">Rayon d'intervention :</label>
              <input type="text" value="${escapeHtml(c.radius || '')}" 
                     data-field="radius"
                     oninput="window.app.liveUpdateText('${sectionId}', 'radius', this.value)"
                     onchange="window.app.commitTextUpdate('${sectionId}', 'radius', this.value)" 
                     class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs">
            </div>
          </div>
        ` : ''}

        <!-- Quote Block specific fields -->
        ${section.type === 'quoteBlock' ? `
          <div class="space-y-2 pt-2 border-t border-zinc-100">
            <div class="font-medium text-zinc-700 text-xs">Citation & Dirigeant</div>
            <div>
              <label class="block text-ui-xs text-zinc-500 mb-1">Texte de la citation :</label>
              <textarea rows="3" data-field="quote" oninput="window.app.liveUpdateText('${sectionId}', 'quote', this.value)" onchange="window.app.commitTextUpdate('${sectionId}', 'quote', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1.5 text-xs">${escapeHtml(c.quote || '')}</textarea>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-ui-xs text-zinc-500 mb-1">Nom Auteur :</label>
                <input type="text" value="${escapeHtml(c.authorName || '')}" data-field="authorName" oninput="window.app.liveUpdateText('${sectionId}', 'authorName', this.value)" onchange="window.app.commitTextUpdate('${sectionId}', 'authorName', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs">
              </div>
              <div>
                <label class="block text-ui-xs text-zinc-500 mb-1">Rôle / Titre :</label>
                <input type="text" value="${escapeHtml(c.authorRole || '')}" data-field="authorRole" oninput="window.app.liveUpdateText('${sectionId}', 'authorRole', this.value)" onchange="window.app.commitTextUpdate('${sectionId}', 'authorRole', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs">
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Video Block specific fields -->
        ${section.type === 'videoBlock' ? `
          <div class="space-y-2 pt-2 border-t border-zinc-100">
            <div class="font-medium text-zinc-700 text-xs">Lecteur Vidéo Immersif</div>
            <div>
              <label class="block text-ui-xs text-zinc-500 mb-1">Image de couverture (Poster) :</label>
              <input type="text" value="${escapeHtml(c.poster || '')}" data-field="poster" oninput="window.app.liveUpdateText('${sectionId}', 'poster', this.value)" onchange="window.app.commitTextUpdate('${sectionId}', 'poster', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs">
            </div>
          </div>
        ` : ''}

        <!-- Stepper Block specific fields -->
        ${section.type === 'stepperBlock' && Array.isArray(c.steps) ? `
          <div class="space-y-2.5 pt-2 border-t border-zinc-100">
            <div class="font-medium text-zinc-700 text-xs">Étapes de Chantier (4 étapes)</div>
            ${c.steps.map((st, sIdx) => `
              <div class="p-2 bg-zinc-50 rounded-md border border-zinc-200 space-y-1">
                <span class="text-ui-2xs font-bold text-zinc-500 uppercase">Étape 0${sIdx + 1}</span>
                <input type="text" value="${escapeHtml(st.title || '')}" placeholder="Titre de l'étape" onchange="window.app.updateSectionContent('${sectionId}', 'steps.${sIdx}.title', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs font-semibold">
                <textarea rows="2" placeholder="Description de l'étape" onchange="window.app.updateSectionContent('${sectionId}', 'steps.${sIdx}.desc', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm leading-snug">${escapeHtml(st.desc || '')}</textarea>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Table Block specific fields -->
        ${section.type === 'tableBlock' && Array.isArray(c.rows) ? `
          <div class="space-y-2.5 pt-2 border-t border-zinc-100">
            <div class="font-medium text-zinc-700 text-xs">Tableau Comparatif</div>
            ${c.rows.map((row, rIdx) => `
              <div class="p-2 bg-zinc-50 rounded-md border border-zinc-200 space-y-1">
                <input type="text" value="${escapeHtml(row.label || '')}" placeholder="Critère" onchange="window.app.updateSectionContent('${sectionId}', 'rows.${rIdx}.label', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs font-semibold">
                <div class="grid grid-cols-2 gap-1.5">
                  <input type="text" value="${escapeHtml(row.standard || '')}" placeholder="Standard" onchange="window.app.updateSectionContent('${sectionId}', 'rows.${rIdx}.standard', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm">
                  <input type="text" value="${escapeHtml(row.premium || '')}" placeholder="Formule Pro" onchange="window.app.updateSectionContent('${sectionId}', 'rows.${rIdx}.premium', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm font-bold text-emerald-700">
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Slider Block specific fields -->
        ${section.type === 'sliderBlock' ? `
          <div class="space-y-2 pt-2 border-t border-zinc-100">
            <div class="font-medium text-zinc-700 text-xs">Curseur de Surface m²</div>
            <div>
              <label class="block text-ui-xs text-zinc-500 mb-1">Chiffrage / Argument d'accompagnement :</label>
              <input type="text" value="${escapeHtml(c.text || 'Devis ferme sous 24h • Déplacement offert')}" data-field="text" oninput="window.app.liveUpdateText('${sectionId}', 'text', this.value)" onchange="window.app.commitTextUpdate('${sectionId}', 'text', this.value)" class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs">
            </div>
          </div>
        ` : ''}

        <!-- Tabs Block specific fields -->
        ${section.type === 'tabsBlock' && Array.isArray(c.tabs) ? `
          <div class="space-y-2.5 pt-2 border-t border-zinc-100">
            <div class="font-medium text-zinc-700 text-xs">Onglets Prestations (${c.tabs.length})</div>
            ${c.tabs.map((tb, tIdx) => `
              <div class="p-2 bg-zinc-50 rounded-md border border-zinc-200 space-y-1">
                <input type="text" value="${escapeHtml(tb.title || '')}" placeholder="Nom de l'onglet" onchange="window.app.updateSectionContent('${sectionId}', 'tabs.${tIdx}.title', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs font-semibold">
                <input type="text" value="${escapeHtml(tb.tag || '')}" placeholder="Tag (ex: Formule Abonnement)" onchange="window.app.updateSectionContent('${sectionId}', 'tabs.${tIdx}.tag', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm">
                <textarea rows="2" placeholder="Description de la prestation" onchange="window.app.updateSectionContent('${sectionId}', 'tabs.${tIdx}.text', this.value)" class="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-ui-sm leading-snug">${escapeHtml(tb.text || '')}</textarea>
              </div>
            `).join('')}
          </div>
        ` : ''}

      </form>

      <!-- Component Intelligence & Audit Qualité (Section 16) -->
      ${(() => {
        const typeMap = {
          hero: 'hero',
          trust: 'badge',
          services: 'card',
          about: 'card',
          gallery: 'carousel',
          beforeAfter: 'carousel',
          reviews: 'card',
          location: 'card',
          hours: 'card',
          faq: 'accordion',
          cta: 'button',
          process: 'card',
          certifications: 'badge',
          pricing: 'card',
          customBlock: 'card',
          quoteBlock: 'card',
          videoBlock: 'carousel',
          stepperBlock: 'card',
          tableBlock: 'card',
          sliderBlock: 'card',
          tabsBlock: 'tabs'
        };
        const compId = typeMap[section.type] || 'card';
        const compDef = COMPONENT_INTELLIGENCE_REGISTRY[compId] || COMPONENT_INTELLIGENCE_REGISTRY.card;
        const tradeId = project?.business?.trade || project?.business?.category || 'paysagiste';
        const confidence = calculateComponentConfidence(compId, { tradeId, pageType: 'landing' });
        const a11y = verifyAccessibility({
          type: compId,
          content: { label: section.content?.title || section.content?.badge || section.type },
          props: { ariaLabel: friendlyTitle }
        });
        const projectSectionTypes = (project?.sections || []).map(s => typeMap[s.type] || s.type);
        const antiPatterns = detectAntiPatterns(projectSectionTypes, { pageType: 'landing' });

        return `
          <div class="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2.5 text-xs">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span class="text-ui-xs font-semibold uppercase tracking-wider text-zinc-500">Intelligence Composant</span>
                <span class="px-1.5 py-0.5 rounded text-ui-2xs font-medium bg-zinc-200 text-zinc-700">${compDef.family}</span>
              </div>
              <span class="px-2 py-0.5 rounded-full text-ui-xs font-semibold ${confidence.score >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                Score: ${confidence.score}%
              </span>
            </div>

            <div class="text-ui-sm text-zinc-600 leading-snug">
              <span class="font-medium text-zinc-800">${compDef.name} :</span> ${compDef.primaryUseCases?.[0] || compDef.intent?.[0]}
            </div>

            <div class="grid grid-cols-2 gap-1.5 pt-1 text-ui-xs">
              <div class="bg-white p-1.5 rounded border border-zinc-200">
                <span class="text-zinc-400 block text-ui-2xs">Rôle sémantique</span>
                <span class="font-mono text-zinc-700">&lt;${compDef.accessibilityPolicy?.semanticRole || 'section'}&gt;</span>
              </div>
              <div class="bg-white p-1.5 rounded border border-zinc-200">
                <span class="text-zinc-400 block text-ui-2xs">Accessibilité</span>
                <span class="text-emerald-600 font-medium">${a11y.compliant ? '✓ WCAG Conforme' : '⚠️ Vérifier labels'}</span>
              </div>
            </div>

            <div class="text-ui-2xs text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-200">
              <span>Tag Analytics:</span>
              <span class="font-mono text-zinc-500">track-${section.type}</span>
            </div>

            ${antiPatterns.length > 0 ? `
              <div class="p-1.5 bg-amber-50 border border-amber-200 rounded text-ui-xs text-amber-800 space-y-0.5">
                <span class="font-semibold block">⚠️ Alerte Anti-Pattern :</span>
                ${antiPatterns.map(ap => `<div>• ${escapeHtml(ap.message)}</div>`).join('')}
              </div>
            ` : ''}
          </div>
        `;
      })()}

      <!-- Section Actions -->
      <div class="pt-3 border-t border-zinc-100 space-y-1.5">
        <button type="button" onclick="window.app.moveSection('${sectionId}', 'up')" class="w-full py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border border-zinc-200 transition-colors">
          ${getIcon("chevronUp", "w-3.5 h-3.5")}
          <span>Remonter d'un cran</span>
        </button>
        <button type="button" onclick="window.app.moveSection('${sectionId}', 'down')" class="w-full py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border border-zinc-200 transition-colors">
          ${getIcon("chevronDown", "w-3.5 h-3.5")}
          <span>Descendre d'un cran</span>
        </button>
      </div>

    </div>
  `;
}

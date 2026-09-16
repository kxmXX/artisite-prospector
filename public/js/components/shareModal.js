import { getIcon } from "./icons.js";
import { generateQRCodeSVG } from "./qrcode.js";
import { escapeHtml } from "../utils/html.js";

/**
 * Share Modal (Sendpage & Duda Inspired)
 * Generates 5 dedicated tabs:
 * 1. Démo Client (Mobile QR, link, SMS, WhatsApp & PIN Lock)
 * 2. Lien Éditeur Collaboratif (Team & Closer link)
 * 3. Prévisualisation Plein Écran (Google Meet / Zoom mode)
 * 4. Domaine & DNS (Custom domain setup)
 * 5. Export ZIP Vanilla Pro (Offline production package)
 */
export function renderShareModal(project, activeTab = "demo") {
  if (!project) return "";

  const b = project.business || {};
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://artisite-prospector.vercel.app";
  const demoUrl = `${baseUrl}/?demo=${project.id}`;
  const editorUrl = `${baseUrl}/#project=${project.id}`;
  const previewUrl = `${baseUrl}/?preview=true&demo=${project.id}`;

  const qrSvg = generateQRCodeSVG(demoUrl, 160, "#09090b", "#ffffff");

  const cleanPhone = (b.phone || "").replace(/[^0-9+]/g, '');
  const smsText = `Bonjour, suite à notre échange téléphonique, j'ai préparé une démonstration concrète de ce que pourrait être le nouveau site de ${b.name} : ${demoUrl}`;
  const whatsappUrl = `https://wa.me/${cleanPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(smsText)}`;

  const tab = activeTab || "demo";

  return `
    <div class="studio-system-modal fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onclick="if(event.target === this) window.app.closeShareModal()">
      <div class="studio-v3-modal studio-v3-modal-frame studio-v3-share w-full max-w-xl overflow-hidden transition-all flex flex-col max-h-[90vh]" onclick="event.stopPropagation()">
        
        <!-- Header -->
        <div class="p-4 sm:p-5 border-b border-zinc-200/80 flex items-center justify-between bg-zinc-50/80">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              ${getIcon("share", "w-4 h-4 text-white")}
            </div>
            <div>
              <h3 class="text-sm font-bold text-zinc-900">Partager la Démonstration Client</h3>
              <p class="text-ui-sm text-zinc-500">Lien interactif, QR Code et outils de prospection pour ${escapeHtml(b.name || 'Artisan')}</p>
            </div>
          </div>
          <button type="button" onclick="window.app.closeShareModal()" class="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded-lg transition-colors">
            ${getIcon("x", "w-4 h-4")}
          </button>
        </div>

        <!-- 5 Tabs Navigation Bar -->
        <div class="px-4 sm:px-5 pt-2 pb-0 border-b border-zinc-200/80 bg-zinc-50/40 flex gap-1 overflow-x-auto no-scrollbar">
          <button type="button" onclick="window.app.setShareModalTab('demo')" class="px-3 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${tab === 'demo' ? 'border-zinc-900 text-zinc-950 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-800'}">
            ${getIcon("smartphone", "w-3.5 h-3.5")}
            <span>Démo Client</span>
          </button>
          <button type="button" onclick="window.app.setShareModalTab('editor')" class="px-3 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${tab === 'editor' ? 'border-zinc-900 text-zinc-950 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-800'}">
            ${getIcon("edit", "w-3.5 h-3.5")}
            <span>Éditeur</span>
          </button>
          <button type="button" onclick="window.app.setShareModalTab('preview')" class="px-3 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${tab === 'preview' ? 'border-zinc-900 text-zinc-950 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-800'}">
            ${getIcon("monitor", "w-3.5 h-3.5")}
            <span>Plein Écran</span>
          </button>
          <button type="button" onclick="window.app.setShareModalTab('domain')" class="px-3 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${tab === 'domain' ? 'border-zinc-900 text-zinc-950 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-800'}">
            ${getIcon("globe", "w-3.5 h-3.5")}
            <span>Domaine</span>
          </button>
          <button type="button" onclick="window.app.setShareModalTab('export')" class="px-3 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${tab === 'export' ? 'border-zinc-900 text-zinc-950 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-800'}">
            ${getIcon("package", "w-3.5 h-3.5")}
            <span>Export ZIP</span>
          </button>
        </div>

        <!-- Tab Body Content -->
        <div class="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          <!-- TAB 1: DEMO CLIENT -->
          ${tab === "demo" ? `
            <!-- QR Code & Quick Scan -->
            <div class="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-zinc-50 border border-zinc-200/80">
              <div class="shrink-0 p-2 bg-white rounded-xl shadow-xs border border-zinc-200/60 flex items-center justify-center">
                ${qrSvg}
              </div>
              <div class="space-y-2 text-center sm:text-left">
                <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-ui-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Démo Mobile Immédiate</span>
                </div>
                <h4 class="text-xs font-bold text-zinc-900">Faites scanner sur smartphone</h4>
                <p class="text-ui-sm text-zinc-600 leading-relaxed">
                  Pendant votre échange avec l'artisan, invitez-le à scanner ce QR code avec son appareil photo pour tester le site sur son propre téléphone.
                </p>
                <div class="pt-1">
                  <a href="${demoUrl}" target="_blank" class="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:underline">
                    <span>Tester dans un nouvel onglet</span>
                    ${getIcon("externalLink", "w-3 h-3 text-zinc-500")}
                  </a>
                </div>
              </div>
            </div>

            <!-- Share Link & Copy -->
            <div class="space-y-1.5">
              <label class="block text-ui-sm font-semibold text-zinc-700 uppercase tracking-wider">Lien direct de présentation</label>
              <div class="flex items-center gap-2">
                <input type="text" readonly id="share-modal-url-input" value="${demoUrl}" class="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-mono text-zinc-800 focus:outline-none select-all">
                <button type="button" onclick="window.app.copyShareUrl('share-modal-url-input', 'btn-copy-share-label')" class="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-zinc-900 hover:bg-black transition-colors flex items-center gap-1.5 shadow-xs shrink-0">
                  ${getIcon("copy", "w-3.5 h-3.5 text-zinc-300")}
                  <span id="btn-copy-share-label">Copier</span>
                </button>
              </div>
            </div>

            <!-- PIN Code Protection Toggle -->
            <div class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-zinc-500">${getIcon("lock", "w-4 h-4")}</span>
                  <div>
                    <span class="text-xs font-bold text-zinc-900 block">Verrouillage par Code PIN Client</span>
                    <span class="text-ui-xs text-zinc-500">Exiger un code de 4 à 6 chiffres avant la démo interne</span>
                  </div>
                </div>
                <button type="button" onclick="if (state.currentProject?.settings?.clientDemoPin) { window.app.setClientDemoPin(null); window.app.renderModals(); } else { document.getElementById('client-demo-pin-setting')?.focus(); }" class="px-2.5 py-1 rounded-md text-ui-sm font-bold transition-colors ${project.settings?.clientDemoPin ? 'bg-emerald-600 text-white shadow-xs' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}">
                  ${project.settings?.clientDemoPin ? 'Actif — désactiver' : 'Configurer'}
                </button>
              </div>
              <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-200/60">
                <label for="client-demo-pin-setting" class="text-ui-sm text-zinc-600 font-medium">${project.settings?.clientDemoPin ? 'Remplacer le code' : 'Nouveau code'} :</label>
                <input type="password" id="client-demo-pin-setting" maxlength="6" inputmode="numeric" autocomplete="new-password" placeholder="••••"
                       class="w-24 bg-white border border-zinc-300 rounded px-2 py-1 text-xs font-mono font-bold text-center text-zinc-900 focus:outline-none focus:border-zinc-600">
                <button type="button" onclick="const input = document.getElementById('client-demo-pin-setting'); if (window.app.setClientDemoPin(input?.value)) window.app.renderModals();" class="px-2.5 py-1 rounded-md text-ui-sm font-bold bg-zinc-900 text-white hover:bg-black">Enregistrer</button>
              </div>
              <p class="text-ui-xs leading-relaxed text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
                Ce code protège uniquement la présentation ouverte via Artist. Un export HTML ou ZIP reste un site public et ne peut pas être protégé par ce réglage.
              </p>
            </div>

            <!-- Direct Dispatch Actions (SMS & WhatsApp) -->
            <div class="grid grid-cols-2 gap-2.5 pt-1">
              <a href="sms:${cleanPhone}?&body=${encodeURIComponent(smsText)}" class="p-2.5 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 flex items-center justify-center gap-2 text-xs font-medium text-zinc-800 transition-colors shadow-2xs no-underline">
                ${getIcon("smartphone", "w-4 h-4")}
                <span>Envoyer par SMS</span>
              </a>
              <a href="${whatsappUrl}" target="_blank" class="p-2.5 rounded-xl border border-emerald-200 hover:border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 flex items-center justify-center gap-2 text-xs font-medium text-emerald-900 transition-colors shadow-2xs no-underline">
                ${getIcon("message", "w-4 h-4")}
                <span>Ouvrir WhatsApp</span>
              </a>
            </div>
          ` : ''}

          <!-- TAB 2: EDITOR SHARE -->
          ${tab === "editor" ? `
            <div class="space-y-4">
              <div class="p-4 rounded-xl bg-blue-50/60 border border-blue-200/60 flex items-start gap-3">
                <span class="text-blue-700">${getIcon("edit", "w-5 h-5")}</span>
                <div class="space-y-1">
                  <h4 class="text-xs font-bold text-blue-950">Accès Collaborateur / Agence</h4>
                  <p class="text-ui-sm text-blue-800 leading-relaxed">
                    Ce lien donne un accès complet à l'interface d'édition, aux sections, aux couleurs et aux contenus. Idéal pour déléguer les retouches à un collègue closer ou graphiste.
                  </p>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="block text-ui-sm font-semibold text-zinc-700 uppercase tracking-wider">Lien de l'éditeur de travail</label>
                <div class="flex items-center gap-2">
                  <input type="text" readonly id="share-modal-editor-url" value="${editorUrl}" class="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-mono text-zinc-800 focus:outline-none select-all">
                  <button type="button" onclick="window.app.copyShareUrl('share-modal-editor-url', 'btn-copy-editor-label')" class="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-zinc-900 hover:bg-black transition-colors flex items-center gap-1.5 shadow-xs shrink-0">
                    ${getIcon("copy", "w-3.5 h-3.5 text-zinc-300")}
                    <span id="btn-copy-editor-label">Copier</span>
                  </button>
                </div>
              </div>

              <div class="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-600 space-y-1.5">
                <div class="font-bold text-zinc-800">Conseil pour l'équipe :</div>
                <p class="text-ui-sm text-zinc-500 leading-relaxed">
                  Toutes les modifications apportées via cet éditeur sont automatiquement sauvegardées en temps réel dans le stockage local du navigateur.
                </p>
              </div>
            </div>
          ` : ''}

          <!-- TAB 3: FULLSCREEN PREVIEW -->
          ${tab === "preview" ? `
            <div class="space-y-4">
              <div class="p-4 rounded-xl bg-purple-50/60 border border-purple-200/60 flex items-start gap-3">
                <span class="text-purple-700">${getIcon("monitor", "w-5 h-5")}</span>
                <div class="space-y-1">
                  <h4 class="text-xs font-bold text-purple-950">Idéal pour partage d'écran (Google Meet, Zoom)</h4>
                  <p class="text-ui-sm text-purple-800 leading-relaxed">
                    Le mode Plein Écran masque 100% de l'interface technique (barres d'outils, contours, boutons d'édition). L'artisan a la sensation d'être sur son site déjà en ligne !
                  </p>
                </div>
              </div>

              <div class="flex flex-col gap-2.5 pt-2">
                <button type="button" onclick="window.app.enterCommercialDemoMode()" class="w-full py-3.5 px-4 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all">
                  ${getIcon("zap", "w-4 h-4")}
                  <span>Lancer la Démonstration Plein Écran Immédiate</span>
                </button>
                <a href="${previewUrl}" target="_blank" class="w-full py-3 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors no-underline">
                  <span>Ouvrir dans un nouvel onglet sans éditeur</span>
                  ${getIcon("externalLink", "w-3.5 h-3.5 text-zinc-500")}
                </a>
              </div>
            </div>
          ` : ''}

          <!-- TAB 4: DOMAIN & DNS -->
          ${tab === "domain" ? `
            <div class="space-y-4">
              <div class="p-4 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-start gap-3">
                <span class="text-amber-700">${getIcon("globe", "w-5 h-5")}</span>
                <div class="space-y-1">
                  <h4 class="text-xs font-bold text-amber-950">Liez le propre domaine de l'artisan</h4>
                  <p class="text-ui-sm text-amber-900 leading-relaxed">
                    Configurez le nom de domaine personnalisé acheté pour l'artisan (ex: chez OVH, Gandi, Hostinger).
                  </p>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="block text-ui-sm font-semibold text-zinc-700 uppercase tracking-wider">Nom de domaine personnalisé</label>
                <input type="text" placeholder="ex: www.${slugify(b.name || 'artisan')}.fr" value="${project.settings?.customDomain || ''}"
                       onchange="if(state.currentProject){state.currentProject.settings = state.currentProject.settings || {}; state.currentProject.settings.customDomain = this.value; state.save(); window.app.showToast('Domaine configuré !', 'success');}"
                       class="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-mono text-zinc-800 focus:border-zinc-900 focus:outline-none">
              </div>

              <div class="border border-zinc-200 rounded-xl overflow-hidden text-xs">
                <div class="bg-zinc-100 p-2.5 font-bold text-zinc-700 text-ui-sm uppercase tracking-wider">Configuration DNS requise :</div>
                <div class="p-3 space-y-2 bg-white font-mono text-ui-sm">
                  <div class="flex justify-between border-b border-zinc-100 pb-1.5">
                    <span class="text-zinc-500 font-bold">Type A :</span>
                    <span class="text-zinc-800">@  ➔  76.76.21.21</span>
                  </div>
                  <div class="flex justify-between pt-0.5">
                    <span class="text-zinc-500 font-bold">Type CNAME :</span>
                    <span class="text-zinc-800">www  ➔  cname.vercel-dns.com</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                ${getIcon("lock", "w-4 h-4")}
                <span class="font-medium">Certificat SSL Let's Encrypt & HTTPS automatique après propagation.</span>
              </div>
            </div>
          ` : ''}

          <!-- TAB 5: EXPORT ZIP -->
          ${tab === "export" ? `
            <div class="space-y-4">
              <div class="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/60 flex items-start gap-3">
                <span class="text-emerald-700">${getIcon("package", "w-5 h-5")}</span>
                <div class="space-y-1">
                  <h4 class="text-xs font-bold text-emerald-950">Pack de Déploiement Autonome Pure Vanilla</h4>
                  <p class="text-ui-sm text-emerald-900 leading-relaxed">
                    Téléchargez une archive ZIP complète sans dépendances (zéro build step, zéro npm). Déployable en 5 secondes sur n'importe quel hébergement web (Vercel, Netlify, Apache, cPanel).
                  </p>
                </div>
              </div>

              <div class="border border-zinc-200 rounded-xl p-3 bg-zinc-50 space-y-2 text-xs">
                <div class="font-bold text-zinc-800 uppercase tracking-wider text-ui-xs">Contenu de l'archive :</div>
                <ul class="space-y-1 text-zinc-600 font-mono text-ui-sm">
                  <li class="flex items-center gap-1.5">${getIcon("fileText", "w-3.5 h-3.5")} <strong>index.html</strong> — Site vitrine complet et interactif</li>
                  <li class="flex items-center gap-1.5">${getIcon("map", "w-3.5 h-3.5")} <strong>sitemap.xml</strong> — Indexation Google & SEO local</li>
                  <li class="flex items-center gap-1.5">${getIcon("bot", "w-3.5 h-3.5")} <strong>robots.txt</strong> — Autorisation d'exploration des moteurs</li>
                  <li class="flex items-center gap-1.5">${getIcon("smartphone", "w-3.5 h-3.5")} <strong>site.webmanifest</strong> — Prêt pour installation PWA mobile</li>
                </ul>
              </div>

              <div class="space-y-2 pt-1">
                <button type="button" onclick="window.app.exportProductionPackage()" class="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors">
                  ${getIcon("download", "w-4 h-4")}
                  <span>Télécharger le Pack Production (.ZIP)</span>
                </button>
                <button type="button" onclick="window.app.downloadStandaloneHTML()" class="w-full py-2.5 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors">
                  <span>Télécharger uniquement index.html</span>
                </button>
              </div>
            </div>
          ` : ''}

        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-zinc-200/80 bg-zinc-50/60 flex items-center justify-between text-xs">
          <span class="text-ui-sm text-zinc-500">Mode démo commerciale • Prêt pour appel prospect</span>
          <button type="button" onclick="window.app.closeShareModal()" class="px-3.5 py-1.5 rounded-lg border border-zinc-200 font-medium text-zinc-700 hover:bg-zinc-100 transition-colors">
            Fermer
          </button>
        </div>

      </div>
    </div>
  `;
}

function slugify(text) {
  return (text || "projet")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

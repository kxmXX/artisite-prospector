import { getIcon } from "./icons.js";
import { generateQRCodeSVG } from "./qrcode.js";

/**
 * Share Modal (Sendpage & Duda Inspired)
 * Generates live shareable demo links, instant vector SVG QR code, and sales outreach templates for Michel.
 */
export function renderShareModal(project) {
  if (!project) return "";

  const b = project.business;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://artisite-prospector.vercel.app";
  const demoUrl = `${baseUrl}/?demo=${project.id}`;

  const qrSvg = generateQRCodeSVG(demoUrl, 170, "#09090b", "#ffffff");

  const cleanPhone = (b.phone || "").replace(/[^0-9+]/g, '');
  const smsText = `Bonjour, suite à notre échange téléphonique, j'ai préparé une démonstration concrète de ce que pourrait être le nouveau site de ${b.name} : ${demoUrl}`;
  const whatsappUrl = `https://wa.me/${cleanPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(smsText)}`;

  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in" onclick="if(event.target === this) window.app.closeShareModal()">
      <div class="w-full max-w-lg bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden transition-all" onclick="event.stopPropagation()">
        
        <!-- Header -->
        <div class="p-5 border-b border-zinc-200/80 flex items-center justify-between bg-zinc-50/70">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              ${getIcon("share", "w-4 h-4 text-white")}
            </div>
            <div>
              <h3 class="text-sm font-bold text-zinc-900">Partager la Démonstration Client</h3>
              <p class="text-[11px] text-zinc-500">Lien interactif et QR Code pour ${escapeHtml(b.name)}</p>
            </div>
          </div>
          <button type="button" onclick="window.app.closeShareModal()" class="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded-lg transition-colors">
            ${getIcon("x", "w-4 h-4")}
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          
          <!-- QR Code & Quick Scan -->
          <div class="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <div class="shrink-0 p-2 bg-white rounded-xl shadow-xs border border-zinc-200/60 flex items-center justify-center">
              ${qrSvg}
            </div>
            <div class="space-y-2 text-center sm:text-left">
              <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Démo Mobile Immédiate</span>
              </div>
              <h4 class="text-xs font-bold text-zinc-900">Faites scanner sur smartphone</h4>
              <p class="text-[11.5px] text-zinc-600 leading-relaxed">
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
            <label class="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider">Lien direct de présentation</label>
            <div class="flex items-center gap-2">
              <input type="text" readonly id="share-modal-url-input" value="${demoUrl}" class="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-mono text-zinc-800 focus:outline-none select-all">
              <button type="button" onclick="window.app.copyShareUrl()" class="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-zinc-900 hover:bg-black transition-colors flex items-center gap-1.5 shadow-xs shrink-0">
                ${getIcon("copy", "w-3.5 h-3.5 text-zinc-300")}
                <span id="btn-copy-share-label">Copier</span>
              </button>
            </div>
          </div>

          <!-- Direct Dispatch Actions -->
          <div class="grid grid-cols-2 gap-2.5 pt-1">
            <a href="sms:${cleanPhone}?&body=${encodeURIComponent(smsText)}" class="p-2.5 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 flex items-center justify-center gap-2 text-xs font-medium text-zinc-800 transition-colors shadow-2xs">
              <span>💬</span>
              <span>Envoyer par SMS</span>
            </a>
            <a href="${whatsappUrl}" target="_blank" class="p-2.5 rounded-xl border border-emerald-200 hover:border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 flex items-center justify-center gap-2 text-xs font-medium text-emerald-900 transition-colors shadow-2xs">
              <span>🟢</span>
              <span>Ouvrir WhatsApp</span>
            </a>
          </div>

        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-zinc-200/80 bg-zinc-50/50 flex items-center justify-between text-xs">
          <span class="text-[11px] text-zinc-500">Mode démo commerciale • Aucun compte requis pour le prospect</span>
          <button type="button" onclick="window.app.closeShareModal()" class="px-3 py-1.5 rounded-lg border border-zinc-200 font-medium text-zinc-700 hover:bg-zinc-100 transition-colors">
            Fermer
          </button>
        </div>

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

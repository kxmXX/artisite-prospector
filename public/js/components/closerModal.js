import { getIcon } from "./icons.js";
import { generateColdCallScript, generateWhatsappPitch, generateEmailPitch, calculateROI } from "../engine/closer.js";

/**
 * Michel's Closer Cockpit Drawer / Modal.
 * Contains cold-call scripts, objection handlers, copyable messages, and ROI justification.
 */

export function renderCloserModal(project) {
  if (!project) return '';

  const script = generateColdCallScript(project);
  const whatsappText = generateWhatsappPitch(project);
  const emailData = generateEmailPitch(project);
  const roi = calculateROI(850, 1200);

  return `
    <div id="closer-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        <!-- Header -->
        <div class="px-8 py-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl">
              🎯
            </div>
            <div>
              <h2 class="font-heading text-lg font-black tracking-tight">Kit Closer & Pitch Commercial</h2>
              <p class="text-xs text-amber-100 font-medium">Pour convaincre et closer <strong>${project.business.name}</strong> (${project.business.city})</p>
            </div>
          </div>
          <button type="button" onclick="window.app.closeCloserModal()" class="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10">
            ${getIcon("x", "w-5 h-5")}
          </button>
        </div>

        <!-- Cockpit Navigation Tabs -->
        <div class="px-8 pt-3 bg-slate-50 border-b border-slate-200 flex gap-4 text-xs font-bold flex-shrink-0">
          <button type="button" onclick="window.app.switchCloserTab('script')" id="tab-closer-script" class="pb-3 border-b-2 border-orange-600 text-orange-600">
            📞 Script Téléphonique
          </button>
          <button type="button" onclick="window.app.switchCloserTab('whatsapp')" id="tab-closer-whatsapp" class="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900">
            💬 WhatsApp / SMS
          </button>
          <button type="button" onclick="window.app.switchCloserTab('email')" id="tab-closer-email" class="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900">
            ✉️ Email B2B
          </button>
          <button type="button" onclick="window.app.switchCloserTab('roi')" id="tab-closer-roi" class="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900">
            💶 Simulateur ROI
          </button>
        </div>

        <!-- Cockpit Body -->
        <div class="p-8 overflow-y-auto space-y-6 flex-1 text-slate-800 text-sm">
          
          <!-- TAB 1: COLD CALL SCRIPT -->
          <div id="closer-panel-script" class="space-y-6">
            
            <!-- Step 1: Accroche -->
            <div class="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-amber-900">
                <span>${script.intro.step}</span>
                <span class="text-[10px] bg-amber-200/70 px-2 py-0.5 rounded text-amber-900">Objectif : 15 sec</span>
              </div>
              <p class="text-sm font-medium text-slate-900 leading-relaxed italic bg-white p-3 rounded-xl border border-amber-100">
                ${script.intro.speech}
              </p>
            </div>

            <!-- Step 2: La Démo -->
            <div class="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-blue-900">
                <span>${script.pitch.step}</span>
                <span class="text-[10px] bg-blue-200/70 px-2 py-0.5 rounded text-blue-900">Moment Clé</span>
              </div>
              <p class="text-sm font-medium text-slate-900 leading-relaxed italic bg-white p-3 rounded-xl border border-blue-100">
                ${script.pitch.speech}
              </p>
            </div>

            <!-- Step 3: Traitement des Objections -->
            <div class="space-y-3 pt-2">
              <h4 class="font-bold text-xs uppercase tracking-wider text-slate-500">Parades aux Objections Fréquentes</h4>
              <div class="space-y-2.5">
                ${script.objections.map(obj => `
                  <div class="border border-slate-200 rounded-xl p-3.5 bg-slate-50 hover:bg-white transition-colors space-y-1.5">
                    <div class="font-bold text-xs text-orange-700">${obj.objection}</div>
                    <div class="text-xs text-slate-700 leading-relaxed pl-2 border-l-2 border-orange-300">
                      ${obj.response}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Step 4: Closing -->
            <div class="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-2">
              <div class="text-xs font-bold text-emerald-900">${script.closing.step}</div>
              <p class="text-sm font-medium text-slate-900 italic bg-white p-3 rounded-xl border border-emerald-100">
                ${script.closing.speech}
              </p>
            </div>

          </div>

          <!-- TAB 2: WHATSAPP / SMS -->
          <div id="closer-panel-whatsapp" class="space-y-4 hidden">
            <p class="text-xs text-slate-500">Copiez ce message prêt à l'emploi et envoyez-le directement sur le téléphone du prospect avec le lien de la démo :</p>
            <div class="relative">
              <textarea id="whatsapp-content" rows="8" readonly class="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-xs text-slate-800 leading-relaxed">${whatsappText}</textarea>
              <button type="button" onclick="window.app.copyText('whatsapp-content')" class="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 shadow">
                ${getIcon("copy", "w-3.5 h-3.5")}
                <span>Copier</span>
              </button>
            </div>
          </div>

          <!-- TAB 3: EMAIL B2B -->
          <div id="closer-panel-email" class="space-y-4 hidden">
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1">Objet du mail :</label>
              <input type="text" id="email-subject" readonly value="${emailData.subject}" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900">
            </div>
            <div class="relative">
              <label class="block text-xs font-bold text-slate-500 mb-1">Corps du mail :</label>
              <textarea id="email-body" rows="10" readonly class="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-xs text-slate-800 leading-relaxed">${emailData.body}</textarea>
              <button type="button" onclick="window.app.copyText('email-body')" class="absolute top-8 right-3 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 shadow">
                ${getIcon("copy", "w-3.5 h-3.5")}
                <span>Copier</span>
              </button>
            </div>
          </div>

          <!-- TAB 4: SIMULATEUR ROI -->
          <div id="closer-panel-roi" class="space-y-6 hidden">
            <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <h4 class="font-bold text-sm text-slate-900">Argument Rentabilité : 1 Seul Chantier Rembourse le Site</h4>
              <p class="text-xs text-slate-600 leading-relaxed">
                Quand l'artisan hésite sur le prix (par exemple 1 200 € ou 99 €/mois), posez-lui cette question :
                <em>« Combien vous rapporte en moyenne un seul chantier complet ? »</em>
              </p>
              
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                <div class="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
                  <div class="text-[10px] uppercase font-bold text-slate-400">Panier Moyen</div>
                  <div class="text-lg font-bold text-slate-900 mt-1">${roi.ticketMoyen} €</div>
                </div>
                <div class="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
                  <div class="text-[10px] uppercase font-bold text-slate-400">Prix du Site</div>
                  <div class="text-lg font-bold text-orange-600 mt-1">${roi.siteCost} €</div>
                </div>
                <div class="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-center col-span-2 sm:col-span-1">
                  <div class="text-[10px] uppercase font-bold text-emerald-700">Rentabilité à</div>
                  <div class="text-lg font-bold text-emerald-700 mt-1">${roi.chantiersToBreakEven} chantier</div>
                </div>
              </div>

              <div class="text-xs font-medium text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                💬 <strong>La Phrase Magique :</strong> <em>« Dès le premier appel signé grâce au site ce mois-ci, votre vitrine est 100% remboursée pour l'année. Les 11 mois suivants, c'est du bénéfice net pur pour votre entreprise. »</em>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="px-8 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0 text-xs">
          <span class="text-slate-500">Pipeline Status : <strong>${project.pipelineStatus}</strong></span>
          <div class="flex items-center gap-2">
            <button type="button" onclick="window.app.updateStatus('${project.id}', 'demo_sent')" class="px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold">
              Marquer 'Démo Envoyée'
            </button>
            <button type="button" onclick="window.app.updateStatus('${project.id}', 'won')" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              Marquer 'Signé ✓'
            </button>
          </div>
        </div>

      </div>
    </div>
  `;
}

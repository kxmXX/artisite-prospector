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
    <div id="closer-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        <!-- Header -->
        <div class="px-6 py-4 bg-white border-b border-zinc-200 text-zinc-900 flex items-center justify-between flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-sm">
              🎯
            </div>
            <div>
              <h2 class="font-semibold text-sm text-zinc-900">Kit Closer & Pitch Commercial</h2>
              <p class="text-xs text-zinc-500 font-normal">Argumentaire pour <strong>${project.business.name}</strong> (${project.business.city})</p>
            </div>
          </div>
          <button type="button" onclick="window.app.closeCloserModal()" class="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors">
            ${getIcon("x", "w-4 h-4")}
          </button>
        </div>

        <!-- Cockpit Navigation Tabs -->
        <div class="px-6 py-2.5 bg-zinc-50 border-b border-zinc-200 flex gap-2 text-xs flex-shrink-0">
          <button type="button" onclick="window.app.switchCloserTab('script')" id="tab-closer-script" class="px-3 py-1.5 rounded-md font-medium text-zinc-900 bg-white shadow-xs border border-zinc-200">
            Script Appel
          </button>
          <button type="button" onclick="window.app.switchCloserTab('whatsapp')" id="tab-closer-whatsapp" class="px-3 py-1.5 rounded-md font-medium text-zinc-600 hover:text-zinc-900 border border-transparent">
            WhatsApp / SMS
          </button>
          <button type="button" onclick="window.app.switchCloserTab('email')" id="tab-closer-email" class="px-3 py-1.5 rounded-md font-medium text-zinc-600 hover:text-zinc-900 border border-transparent">
            Email B2B
          </button>
          <button type="button" onclick="window.app.switchCloserTab('roi')" id="tab-closer-roi" class="px-3 py-1.5 rounded-md font-medium text-zinc-600 hover:text-zinc-900 border border-transparent">
            Simulateur ROI
          </button>
        </div>

        <!-- Cockpit Body -->
        <div class="p-6 overflow-y-auto space-y-5 flex-1 text-zinc-800 text-xs">
          
          <!-- TAB 1: COLD CALL SCRIPT -->
          <div id="closer-panel-script" class="space-y-4">
            
            <!-- Step 1: Accroche -->
            <div class="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-2">
              <div class="flex items-center justify-between font-semibold text-zinc-800">
                <span>${script.intro.step}</span>
                <span class="text-[10px] bg-zinc-200/70 px-2 py-0.5 rounded text-zinc-700">15 secondes</span>
              </div>
              <p class="text-xs text-zinc-900 leading-relaxed bg-white p-3 rounded-lg border border-zinc-200 italic">
                « ${script.intro.speech} »
              </p>
            </div>

            <!-- Step 2: La Démo -->
            <div class="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-2">
              <div class="flex items-center justify-between font-semibold text-zinc-800">
                <span>${script.pitch.step}</span>
                <span class="text-[10px] bg-zinc-200/70 px-2 py-0.5 rounded text-zinc-700">Moment Clé</span>
              </div>
              <p class="text-xs text-zinc-900 leading-relaxed bg-white p-3 rounded-lg border border-zinc-200 italic">
                « ${script.pitch.speech} »
              </p>
            </div>

            <!-- Step 3: Traitement des Objections -->
            <div class="space-y-2 pt-2">
              <div class="font-medium text-[11px] uppercase tracking-wider text-zinc-400">Parades aux Objections Fréquentes</div>
              <div class="space-y-2">
                ${script.objections.map(obj => `
                  <div class="border border-zinc-200 rounded-xl p-3 bg-zinc-50/50 hover:bg-white transition-colors space-y-1">
                    <div class="font-medium text-xs text-zinc-900">${obj.objection}</div>
                    <div class="text-xs text-zinc-600 leading-relaxed pl-2.5 border-l-2 border-zinc-400">
                      ${obj.response}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Step 4: Closing -->
            <div class="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-2">
              <div class="font-semibold text-zinc-800">${script.closing.step}</div>
              <p class="text-xs text-zinc-900 leading-relaxed bg-white p-3 rounded-lg border border-zinc-200 italic">
                « ${script.closing.speech} »
              </p>
            </div>

          </div>

          <!-- TAB 2: WHATSAPP / SMS -->
          <div id="closer-panel-whatsapp" class="space-y-3 hidden">
            <p class="text-xs text-zinc-500">Message prêt à l'emploi à envoyer directement sur le téléphone du prospect :</p>
            <div class="relative">
              <textarea id="whatsapp-content" rows="8" readonly class="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 font-mono text-xs text-zinc-800 leading-relaxed focus:outline-none">${whatsappText}</textarea>
              <button type="button" onclick="window.app.copyText('whatsapp-content')" class="absolute top-2.5 right-2.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-black flex items-center gap-1 shadow-xs transition-colors">
                ${getIcon("copy", "w-3 h-3")}
                <span>Copier</span>
              </button>
            </div>
          </div>

          <!-- TAB 3: EMAIL B2B -->
          <div id="closer-panel-email" class="space-y-3 hidden">
            <div>
              <label class="block text-[11px] font-medium text-zinc-500 mb-1">Objet :</label>
              <input type="text" id="email-subject" readonly value="${emailData.subject}" class="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-900">
            </div>
            <div class="relative">
              <label class="block text-[11px] font-medium text-zinc-500 mb-1">Corps du message :</label>
              <textarea id="email-body" rows="9" readonly class="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 font-mono text-xs text-zinc-800 leading-relaxed focus:outline-none">${emailData.body}</textarea>
              <button type="button" onclick="window.app.copyText('email-body')" class="absolute top-7 right-2.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-black flex items-center gap-1 shadow-xs transition-colors">
                ${getIcon("copy", "w-3 h-3")}
                <span>Copier</span>
              </button>
            </div>
          </div>

          <!-- TAB 4: SIMULATEUR ROI -->
          <div id="closer-panel-roi" class="space-y-4 hidden">
            <div class="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
              <div class="font-semibold text-xs text-zinc-900">Argument Rentabilité : 1 Seul Chantier Rembourse le Site</div>
              <p class="text-xs text-zinc-600 leading-relaxed">
                Quand l'artisan hésite sur le prix, posez-lui cette question :
                <em>« Combien vous rapporte en moyenne un seul chantier complet ? »</em>
              </p>
              
              <div class="grid grid-cols-3 gap-2.5 pt-1">
                <div class="bg-white p-3 rounded-lg border border-zinc-200 text-center">
                  <div class="text-[10px] uppercase font-medium text-zinc-400">Panier Moyen</div>
                  <div class="text-base font-semibold text-zinc-900 mt-0.5">${roi.ticketMoyen} €</div>
                </div>
                <div class="bg-white p-3 rounded-lg border border-zinc-200 text-center">
                  <div class="text-[10px] uppercase font-medium text-zinc-400">Prix du Site</div>
                  <div class="text-base font-semibold text-zinc-900 mt-0.5">${roi.siteCost} €</div>
                </div>
                <div class="bg-white border border-zinc-200 p-3 rounded-lg text-center">
                  <div class="text-[10px] uppercase font-medium text-emerald-600">Rentabilité à</div>
                  <div class="text-base font-semibold text-emerald-600 mt-0.5">${roi.chantiersToBreakEven} chantier</div>
                </div>
              </div>

              <div class="text-xs text-zinc-700 bg-white p-3 rounded-lg border border-zinc-200 leading-relaxed">
                <strong>Phrase clé :</strong> <em>« Dès le premier appel signé grâce au site ce mois-ci, votre vitrine est 100% rentabilisée. Le reste de l'année, c'est du bénéfice net pur pour votre entreprise. »</em>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="px-6 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between flex-shrink-0 text-xs">
          <span class="text-zinc-500">Statut CRM : <strong class="text-zinc-800">${project.pipelineStatus}</strong></span>
          <div class="flex items-center gap-2">
            <button type="button" onclick="window.app.updateStatus('${project.id}', 'demo_sent')" class="px-3 py-1.5 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-medium transition-colors">
              Démo Envoyée
            </button>
            <button type="button" onclick="window.app.updateStatus('${project.id}', 'won')" class="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white font-medium shadow-xs transition-colors">
              Signé ✓
            </button>
          </div>
        </div>

      </div>
    </div>
  `;
}

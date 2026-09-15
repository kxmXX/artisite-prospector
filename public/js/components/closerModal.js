import { getIcon } from "./icons.js";
import {
  generateColdCallScript,
  generateWhatsappPitch,
  generateEmailPitch,
  calculateROI,
  generateCompetitiveAudit,
  generateOrderContract,
  getObjectionBattlecards
} from "../engine/closer.js";

/**
 * Michel's Closer Cockpit Drawer / Modal.
 * Contains cold-call teleprompter, objection battlecards, competitive audit,
 * digital order form with canvas e-signature, copyable messages, and ROI simulator.
 */

export function renderCloserModal(project) {
  if (!project) return '';

  const demoUrl = typeof window !== 'undefined' && window.location
    ? `${window.location.origin}${window.location.pathname}?demo=${project.id}`
    : `https://artisite-prospector.vercel.app?demo=${project.id}`;

  const script = generateColdCallScript(project);
  const whatsappText = generateWhatsappPitch(project, demoUrl);
  const emailData = generateEmailPitch(project, demoUrl);
  const roi = calculateROI(1200, 990);
  const audit = generateCompetitiveAudit(project);
  const contract = generateOrderContract(project);
  const battlecards = getObjectionBattlecards(project);

  return `
    <div id="closer-modal" class="studio-system-modal fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div class="studio-v3-modal studio-v3-closer max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        <!-- Header with Live Call Teleprompter Status -->
        <div class="px-6 py-3.5 bg-zinc-950 text-white flex items-center justify-between flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm">
              🎯
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="font-bold text-xs sm:text-sm text-white tracking-tight">Cockpit de Closing & Vente</h2>
                <span class="text-ui-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Michel Closer Pro</span>
              </div>
              <p class="text-ui-sm text-zinc-400 font-normal">Prospect : <strong>${project.business.name}</strong> (${project.business.tradeLabel} • ${project.business.city})</p>
            </div>
          </div>

          <!-- Active Call Stopwatch Widget -->
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg text-xs font-mono text-zinc-200" id="call-timer-box">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span id="call-timer-display">00:00</span>
              <button type="button" onclick="window.app?.toggleCallTimer?.()" class="ml-1 text-ui-xs text-zinc-400 hover:text-white" title="Démarrer / Mettre en pause le chronomètre d'appel">
                ⏯️
              </button>
            </div>

            <button type="button" onclick="window.app.closeCloserModal()" class="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors">
              ${getIcon("x", "w-4 h-4")}
            </button>
          </div>
        </div>

        <!-- Cockpit Navigation Tabs (7 Power Tabs) -->
        <div class="px-6 py-2 bg-zinc-100/80 border-b border-zinc-200 flex gap-1.5 text-xs overflow-x-auto flex-shrink-0">
          <button type="button" onclick="window.app.switchCloserTab('script')" id="tab-closer-script" class="px-3 py-1.5 rounded-lg font-bold text-zinc-900 bg-white shadow-xs border border-zinc-200 whitespace-nowrap">
            📞 Script Appel
          </button>
          <button type="button" onclick="window.app.switchCloserTab('objections')" id="tab-closer-objections" class="px-3 py-1.5 rounded-lg font-medium text-zinc-600 hover:text-zinc-900 border border-transparent whitespace-nowrap">
            🛡️ Objections
          </button>
          <button type="button" onclick="window.app.switchCloserTab('audit')" id="tab-closer-audit" class="px-3 py-1.5 rounded-lg font-medium text-zinc-600 hover:text-zinc-900 border border-transparent whitespace-nowrap">
            📊 Audit 360°
          </button>
          <button type="button" onclick="window.app.switchCloserTab('contract')" id="tab-closer-contract" class="px-3 py-1.5 rounded-lg font-medium text-zinc-600 hover:text-zinc-900 border border-transparent whitespace-nowrap">
            ✍️ Bon de Commande
          </button>
          <button type="button" onclick="window.app.switchCloserTab('whatsapp')" id="tab-closer-whatsapp" class="px-3 py-1.5 rounded-lg font-medium text-zinc-600 hover:text-zinc-900 border border-transparent whitespace-nowrap">
            💬 WhatsApp
          </button>
          <button type="button" onclick="window.app.switchCloserTab('email')" id="tab-closer-email" class="px-3 py-1.5 rounded-lg font-medium text-zinc-600 hover:text-zinc-900 border border-transparent whitespace-nowrap">
            ✉️ Email B2B
          </button>
          <button type="button" onclick="window.app.switchCloserTab('roi')" id="tab-closer-roi" class="px-3 py-1.5 rounded-lg font-medium text-zinc-600 hover:text-zinc-900 border border-transparent whitespace-nowrap">
            💰 Rentabilité ROI
          </button>
        </div>

        <!-- Cockpit Body -->
        <div class="p-6 overflow-y-auto space-y-5 flex-1 text-zinc-800 text-xs">
          
          <!-- TAB 1: COLD CALL SCRIPT WITH TELEPROMPTER CHECKLIST -->
          <div id="closer-panel-script" class="space-y-4">
            <!-- Step Checklist -->
            <div class="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between gap-2">
              <span class="text-ui-sm font-bold text-zinc-700">Déroulement de l'Appel :</span>
              <div class="flex items-center gap-3 text-ui-sm">
                <label class="inline-flex items-center gap-1 cursor-pointer"><input type="checkbox" onchange="window.app?.updateCallProgress?.(this)" class="rounded text-zinc-900"> <span>1. Accroche</span></label>
                <label class="inline-flex items-center gap-1 cursor-pointer"><input type="checkbox" onchange="window.app?.updateCallProgress?.(this)" class="rounded text-zinc-900"> <span>2. Envoi WhatsApp</span></label>
                <label class="inline-flex items-center gap-1 cursor-pointer"><input type="checkbox" onchange="window.app?.updateCallProgress?.(this)" class="rounded text-zinc-900"> <span>3. Visite du Site</span></label>
                <label class="inline-flex items-center gap-1 cursor-pointer"><input type="checkbox" onchange="window.app?.updateCallProgress?.(this)" class="rounded text-zinc-900"> <span>4. Closing Offre</span></label>
              </div>
            </div>
            
            <!-- Step 1: Accroche -->
            <div class="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-2">
              <div class="flex items-center justify-between font-bold text-zinc-900">
                <span>${script.intro.step}</span>
                <span class="text-ui-xs bg-zinc-200 px-2 py-0.5 rounded-full text-zinc-700 font-mono">15 secondes</span>
              </div>
              <p class="text-xs text-zinc-900 leading-relaxed bg-white p-3.5 rounded-xl border border-zinc-200 italic font-medium">
                « ${script.intro.speech} »
              </p>
            </div>

            <!-- Step 2: La Démo -->
            <div class="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-2">
              <div class="flex items-center justify-between font-bold text-zinc-900">
                <span>${script.pitch.step}</span>
                <span class="text-ui-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Moment Clé</span>
              </div>
              <p class="text-xs text-zinc-900 leading-relaxed bg-white p-3.5 rounded-xl border border-zinc-200 italic font-medium">
                « ${script.pitch.speech} »
              </p>
              <div class="flex items-center gap-2 pt-1">
                <button type="button" onclick="window.app.copyShareUrl()" class="btn-keycap btn-keycap-dark px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-xs">
                  ${getIcon("share", "w-3.5 h-3.5")}
                  <span>Copier le lien démo mobile pour WhatsApp</span>
                </button>
              </div>
            </div>

            <!-- Step 3: Conclusion -->
            <div class="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-2">
              <div class="font-bold text-zinc-900">${script.closing.step}</div>
              <p class="text-xs text-zinc-900 leading-relaxed bg-white p-3.5 rounded-xl border border-zinc-200 italic font-medium">
                « ${script.closing.speech} »
              </p>
            </div>
          </div>

          <!-- TAB 2: OBJECTION BATTLECARDS (MVP Feature 6) -->
          <div id="closer-panel-objections" class="space-y-3 hidden">
            <div class="text-ui-sm font-bold uppercase tracking-wider text-zinc-400">Cartes d'attaque pour neutraliser toute hésitation :</div>
            <div class="grid gap-3">
              ${battlecards.map(b => `
                <div class="border border-zinc-200 rounded-2xl p-4 bg-zinc-50 hover:bg-white transition-all space-y-2 shadow-2xs">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-xs text-zinc-900">${b.title}</span>
                    <span class="text-ui-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Taux de succès ${b.confidence}</span>
                  </div>
                  <div class="text-xs text-zinc-700 bg-white p-3 rounded-xl border border-zinc-200 leading-relaxed font-medium">
                    ${b.counter}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- TAB 3: AUDIT 360° & BENCHMARK LOCAL (MVP Feature 5) -->
          <div id="closer-panel-audit" class="space-y-4 hidden">
            <div class="p-4 rounded-2xl bg-zinc-950 text-white space-y-2">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-xs font-bold text-emerald-400 uppercase tracking-wider">Benchmark Visibilité Locale</div>
                  <h3 class="text-sm sm:text-base font-extrabold text-white">${audit.title}</h3>
                </div>
                <button type="button" id="btn-fetch-live-audit" onclick="window.app?.fetchLiveAudit?.('${project.id}')" class="btn-keycap btn-keycap-light text-ui-sm font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm text-zinc-900 bg-white hover:bg-zinc-100 transition-all">
                  <span>⚡ Actualiser IA Locale</span>
                </button>
              </div>
              <p class="text-ui-sm text-zinc-400">Montrez ces écarts techniques en direct à l'artisan pour démolir ses réticences.</p>
            </div>

            <div id="closer-audit-gaps" class="space-y-1.5 p-3 rounded-2xl bg-zinc-100 border border-zinc-200 text-ui-sm text-zinc-800">
              <div class="text-ui-xs uppercase font-bold text-emerald-700">Gaps Concurrentiels Détectés (${audit.city}) :</div>
              <p>• 82% des artisans ${audit.trade} à ${audit.city} n'ont pas de module Avant / Après interactif</p>
              <p>• Moins de 1 sur 4 propose un devis instantané ou appel direct 1-clic sur smartphone</p>
              <p>• Forte opportunité de positionnement sur Google Maps et requêtes locales urgentes</p>
            </div>

            <div class="space-y-2.5">
              ${audit.pillars.map(p => `
                <div class="border border-zinc-200 rounded-2xl p-3.5 bg-zinc-50 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-xs text-zinc-900">${p.name}</span>
                    <div class="flex items-center gap-2">
                      <span class="text-ui-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">Actuel : ${p.currentScore}/100</span>
                      <span class="text-ui-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Nouveau : ${p.prospectorScore}/100 ⚡</span>
                    </div>
                  </div>
                  <p class="text-ui-sm text-zinc-600 leading-relaxed">${p.impact}</p>
                </div>
              `).join('')}
            </div>

            <div id="closer-audit-hook" class="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl space-y-1.5">
              <div class="text-xs font-bold text-amber-900">Accroche Choc pour Michel :</div>
              ${audit.talkingPoints.map(tp => `<p class="text-xs text-amber-800 italic leading-relaxed font-medium">${tp}</p>`).join('')}
            </div>
          </div>

          <!-- TAB 4: BON DE COMMANDE ET E-SIGNATURE (MVP Feature 4) -->
          <div id="closer-panel-contract" class="space-y-4 hidden">
            <div class="border border-zinc-200 rounded-2xl p-5 bg-zinc-50 space-y-4">
              <div class="flex items-center justify-between border-b border-zinc-200 pb-3">
                <div>
                  <h3 class="font-bold text-xs text-zinc-900 uppercase tracking-wider">Bon de Commande & Cession de Droits</h3>
                  <div class="text-ui-sm text-zinc-500">Réf : <strong class="font-mono text-zinc-800">${contract.contractNumber}</strong> • Date : ${contract.date}</div>
                </div>
                <div class="text-right">
                  <span class="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold">Prêt pour Signature</span>
                </div>
              </div>

              <!-- Parties -->
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div class="bg-white p-3 rounded-xl border border-zinc-200">
                  <div class="text-ui-xs font-bold text-zinc-400 uppercase">Bénéficiaire</div>
                  <div class="font-bold text-zinc-900 mt-0.5">${contract.client.name}</div>
                  <div class="text-ui-sm text-zinc-600">${contract.client.trade} à ${contract.client.city}</div>
                  <div class="text-ui-sm text-zinc-500 font-mono mt-0.5">${contract.client.phone}</div>
                </div>
                <div class="bg-white p-3 rounded-xl border border-zinc-200">
                  <div class="text-ui-xs font-bold text-zinc-400 uppercase">Prestation & Prix</div>
                  <div class="font-bold text-emerald-700 mt-0.5">${contract.service.price}</div>
                  <div class="text-ui-sm text-zinc-600">${contract.service.deliveryTime}</div>
                  <div class="text-ui-xs text-zinc-400 mt-0.5">${contract.guarantee}</div>
                </div>
              </div>

              <!-- Inclusions -->
              <div class="bg-white p-3.5 rounded-xl border border-zinc-200 space-y-1.5">
                <div class="text-ui-xs font-bold text-zinc-400 uppercase tracking-wider">Inclus dans la commande</div>
                <ul class="grid sm:grid-cols-2 gap-1 text-ui-sm text-zinc-700">
                  ${contract.service.inclusions.map(inc => `<li class="flex items-center gap-1.5"><span>✓</span> <span>${inc}</span></li>`).join('')}
                </ul>
              </div>

              <!-- HTML5 Interactive Signature Pad -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold text-zinc-800">Signature électronique du client :</label>
                  <button type="button" onclick="window.app?.clearSignaturePad?.()" class="text-ui-sm text-zinc-500 hover:text-red-600 underline">
                    Effacer la signature
                  </button>
                </div>
                <canvas id="closer-signature-pad" width="560" height="140" class="w-full h-32 border-2 border-dashed border-zinc-300 rounded-xl bg-white cursor-crosshair touch-none shadow-inner"></canvas>
                <div class="text-ui-xs text-zinc-400 text-center">Signez à l'aide de votre souris, pavé tactile ou directement au doigt sur smartphone.</div>
              </div>

              <div class="pt-2 flex gap-2">
                <button type="button" onclick="window.app?.printSignedContract?.()" class="flex-1 btn-keycap btn-keycap-dark py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-sm">
                  ${getIcon("printer", "w-3.5 h-3.5")}
                  <span>Télécharger & Imprimer le Bon de Commande Signé (PDF)</span>
                </button>
              </div>
            </div>
          </div>

          <!-- TAB 5: WHATSAPP / SMS -->
          <div id="closer-panel-whatsapp" class="space-y-3 hidden">
            <p class="text-xs text-zinc-500">Message prêt à l'emploi à envoyer directement sur le smartphone du prospect :</p>
            <div class="relative">
              <textarea id="whatsapp-content" rows="8" readonly class="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 font-mono text-xs text-zinc-800 leading-relaxed focus:outline-none">${whatsappText}</textarea>
              <button type="button" onclick="window.app.copyText('whatsapp-content')" class="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-medium hover:bg-black flex items-center gap-1.5 shadow-xs transition-colors">
                ${getIcon("copy", "w-3.5 h-3.5")}
                <span>Copier</span>
              </button>
            </div>
          </div>

          <!-- TAB 6: EMAIL B2B -->
          <div id="closer-panel-email" class="space-y-3 hidden">
            <div>
              <label class="block text-ui-sm font-medium text-zinc-500 mb-1">Objet :</label>
              <input type="text" id="email-subject" readonly value="${emailData.subject}" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-900">
            </div>
            <div class="relative">
              <label class="block text-ui-sm font-medium text-zinc-500 mb-1">Corps du message :</label>
              <textarea id="email-body" rows="9" readonly class="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 font-mono text-xs text-zinc-800 leading-relaxed focus:outline-none">${emailData.body}</textarea>
              <button type="button" onclick="window.app.copyText('email-body')" class="absolute top-8 right-3 px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-medium hover:bg-black flex items-center gap-1.5 shadow-xs transition-colors">
                ${getIcon("copy", "w-3.5 h-3.5")}
                <span>Copier</span>
              </button>
            </div>
          </div>

          <!-- TAB 7: SIMULATEUR ROI (MVP Feature 1) -->
          <div id="closer-panel-roi" class="space-y-4 hidden">
            <div class="bg-zinc-50 p-5 rounded-2xl border border-zinc-200 space-y-4">
              <div class="flex items-center justify-between">
                <div class="font-bold text-xs text-zinc-900 uppercase tracking-wider">Calculateur de Rentabilité Réelle en Appel</div>
                <span class="text-ui-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Interactif en direct</span>
              </div>
              <p class="text-xs text-zinc-600 leading-relaxed">
                Quand l'artisan hésite sur le prix, ajustez son panier moyen en direct au téléphone :
              </p>
              
              <div class="grid sm:grid-cols-2 gap-3 p-3 bg-white border border-zinc-200 rounded-xl">
                <div>
                  <div class="flex justify-between text-ui-sm font-bold text-zinc-700 mb-1">
                    <span>Panier moyen chantier :</span>
                    <span id="closer-roi-ticket-val" class="font-mono text-zinc-950">${roi.ticketMoyen} €</span>
                  </div>
                  <input type="range" min="300" max="5000" step="100" value="${roi.ticketMoyen}"
                         oninput="(function(el){
                           const t = Number(el.value);
                           const cost = Number(document.getElementById('closer-roi-cost').value);
                           document.getElementById('closer-roi-ticket-val').textContent = t + ' €';
                           document.getElementById('closer-roi-kpi-ticket').textContent = t + ' €';
                           const breakEven = (cost / t).toFixed(1);
                           document.getElementById('closer-roi-kpi-break').textContent = breakEven + ' chantier' + (breakEven > 1 ? 's' : '');
                           const yearly = (t * 12) - cost;
                           document.getElementById('closer-roi-kpi-gain').textContent = '+' + yearly.toLocaleString('fr-FR') + ' € net';
                         })(this)" id="closer-roi-ticket" class="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-600">
                </div>
                <div>
                  <div class="flex justify-between text-ui-sm font-bold text-zinc-700 mb-1">
                    <span>Prix du site vitrine :</span>
                    <span id="closer-roi-cost-val" class="font-mono text-zinc-950">${roi.siteCost} €</span>
                  </div>
                  <input type="range" min="500" max="2500" step="50" value="${roi.siteCost}"
                         oninput="(function(el){
                           const cost = Number(el.value);
                           const t = Number(document.getElementById('closer-roi-ticket').value);
                           document.getElementById('closer-roi-cost-val').textContent = cost + ' €';
                           document.getElementById('closer-roi-kpi-cost').textContent = cost + ' €';
                           const breakEven = (cost / t).toFixed(1);
                           document.getElementById('closer-roi-kpi-break').textContent = breakEven + ' chantier' + (breakEven > 1 ? 's' : '');
                           const yearly = (t * 12) - cost;
                           document.getElementById('closer-roi-kpi-gain').textContent = '+' + yearly.toLocaleString('fr-FR') + ' € net';
                         })(this)" id="closer-roi-cost" class="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-600">
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3 pt-1">
                <div class="bg-white p-3.5 rounded-xl border border-zinc-200 text-center shadow-2xs">
                  <div class="text-ui-xs uppercase font-bold text-zinc-400">Panier Moyen</div>
                  <div class="text-lg font-extrabold text-zinc-900 mt-0.5 font-mono" id="closer-roi-kpi-ticket">${roi.ticketMoyen} €</div>
                </div>
                <div class="bg-white p-3.5 rounded-xl border border-zinc-200 text-center shadow-2xs">
                  <div class="text-ui-xs uppercase font-bold text-zinc-400">Prix du Site</div>
                  <div class="text-lg font-extrabold text-zinc-900 mt-0.5 font-mono" id="closer-roi-kpi-cost">${roi.siteCost} €</div>
                </div>
                <div class="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-center shadow-2xs">
                  <div class="text-ui-xs uppercase font-bold text-emerald-700">Amorti à</div>
                  <div class="text-lg font-extrabold text-emerald-700 mt-0.5 font-mono" id="closer-roi-kpi-break">${roi.chantiersToBreakEven} chantier</div>
                </div>
              </div>

              <div class="text-xs text-zinc-800 bg-white p-4 rounded-xl border border-zinc-200 leading-relaxed">
                <strong>Phrase clé :</strong> <em>« Dès le premier appel signé grâce au site ce mois-ci, votre vitrine est 100% rentabilisée. Ensuite, avec seulement 1 chantier par mois, vous dégagez <span id="closer-roi-kpi-gain" class="font-bold text-emerald-700">+${roi.yearlyGainOnePerMonth.toLocaleString('fr-FR')} € net</span> par an ! »</em>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer with Pipeline CRM Status Update -->
        <div class="px-6 py-3.5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between flex-shrink-0 text-xs">
          <span class="text-zinc-500">Statut CRM : <strong class="text-zinc-900 font-bold">${project.pipelineStatus || 'prospect'}</strong></span>
          <div class="flex items-center gap-2">
            <button type="button" onclick="window.app.updateStatus('${project.id}', 'demo_sent')" class="btn-keycap btn-keycap-light px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 border border-zinc-200 hover:bg-zinc-100 transition-colors">
              Démo Partagée
            </button>
            <button type="button" onclick="window.app.updateStatus('${project.id}', 'won')" class="btn-keycap btn-keycap-dark px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-colors">
              ✓ Client Signé !
            </button>
          </div>
        </div>

      </div>
    </div>
  `;
}

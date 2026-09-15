import { getIcon } from "./icons.js";
import { getTradeFallbackDataUrl } from "../data/imageFallbacks.js";
import { APP_VERSION } from "../version.js";
import { escapeHtml } from "../utils/html.js";

/**
 * Studio V3 dashboard.
 * The dashboard is a prospecting desk first: one dominant generation action,
 * a compact pipeline readout, then a project library instead of a generic card grid.
 */
/**
 * Entrée de compte : sans session, proposer de se connecter ; avec session, montrer
 * l'utilisateur et permettre de fermer la session. Aucun jargon, aucun menu caché.
 */
function accountControlHTML(state) {
  const user = state.sessionUser;
  if (state.authStatus === "unavailable") {
    return '<span class="dashboard-v3-secondary" title="Le stockage de cette version hébergée n\'est pas persistant">' +
      getIcon("laptop", "w-4 h-4") + '<span>Connexion indisponible</span></span>';
  }
  if (user) {
    return '<button type="button" class="dashboard-v3-secondary" onclick="window.app.signOutAccount()" title="Se déconnecter de ' + escapeHtml(user.username) + '">' +
      getIcon("user", "w-4 h-4") + '<span>' + escapeHtml(user.username) + ' · Se déconnecter</span></button>';
  }
  return '<button type="button" class="dashboard-v3-secondary" onclick="window.app.openAuthModal(\'login\')" title="Retrouver mes sites sur un autre appareil">' +
    getIcon("user", "w-4 h-4") + '<span>Se connecter</span></button>';
}

function migrationBannerHTML(state) {
  const plan = state._migrationPlan;
  if (!plan || !plan.toImport || !plan.toImport.length) return "";
  const count = plan.toImport.length;
  return '<div class="dashboard-v3-migration" role="status">' +
    getIcon("upload", "w-4 h-4") +
    '<p><b>' + count + ' site' + (count > 1 ? "s" : "") + '</b> enregistré' + (count > 1 ? "s" : "") + ' sur cet appareil et absent' + (count > 1 ? "s" : "") + ' de votre compte.</p>' +
    '<div class="dashboard-v3-migration-actions">' +
      '<button type="button" onclick="window.app.importLocalLibrary()">Importer dans mon compte</button>' +
      '<button type="button" onclick="window.app.dismissMigration()">Plus tard</button>' +
    '</div>' +
  '</div>';
}

export function renderDashboard(state) {
  const projects = state.projects || [];
  const total = projects.length;
  const contacted = projects.filter(p => p.pipelineStatus === "contacted" || p.pipelineStatus === "demo_sent").length;
  const won = projects.filter(p => p.pipelineStatus === "won").length;
  const ready = projects.filter(p => !p.pipelineStatus || p.pipelineStatus === "generated" || p.pipelineStatus === "prospect").length;
  const conversionRate = total ? Math.round((won / total) * 100) : 0;
  const valuedProjects = projects.filter(p => Number.isFinite(p.estimatedValue) && p.estimatedValue >= 0);
  const potentialRevenue = valuedProjects.reduce((sum, p) => sum + p.estimatedValue, 0);

  const statusMap = {
    prospect: { label: "À contacter", tone: "neutral" },
    generated: { label: "Site prêt", tone: "ready" },
    contacted: { label: "En prospection", tone: "active" },
    demo_sent: { label: "Démo partagée", tone: "shared" },
    won: { label: "Client signé", tone: "won" }
  };

  const projectCardsHTML = projects.map((p, index) => {
    const bus = p.business || {};
    const tradeId = bus.tradeId || "paysagiste";
    const st = statusMap[p.pipelineStatus] || statusMap.generated;
    const fallbackImage = getTradeFallbackDataUrl(tradeId, "hero", p.name);
    const heroImage = p.sections?.find(s => s.type === "hero")?.content?.heroImage || fallbackImage;
    const activeSecCount = p.sections?.filter(s => s.visibility !== false).length || 0;
    const totalSecCount = p.sections?.length || 0;

    return `
      <article class="dashboard-v3-project ${index === 0 ? 'is-featured' : ''}" data-project-id="${p.id}" data-pipeline-status="${p.pipelineStatus || 'generated'}">
        <label class="dashboard-v3-project-select" title="Sélectionner ${p.name}" onclick="event.stopPropagation()">
          <input type="checkbox" data-project-select="${p.id}" aria-label="Sélectionner ${p.name}" onchange="window.app.toggleProjectSelection('${p.id}', this.checked)">
          <span aria-hidden="true"></span>
        </label>
        <button type="button" class="dashboard-v3-project-media" onclick="window.app.openEditor('${p.id}')" aria-label="Ouvrir ${p.name} dans l'éditeur">
          <img src="${heroImage}" data-fallback-src="${fallbackImage}" alt="Aperçu ${p.name}" onerror="if(!this.dataset.fallbackApplied){this.dataset.fallbackApplied='true';this.src=this.dataset.fallbackSrc;}">
          <span class="dashboard-v3-project-index">${String(index + 1).padStart(2, '0')}</span>
          <span class="dashboard-v3-project-status is-${st.tone}">${st.label}</span>
        </button>

        <div class="dashboard-v3-project-copy">
          <div class="dashboard-v3-project-kicker">${bus.tradeLabel || 'Artisan'} · ${bus.city || 'France'}</div>
          <button type="button" onclick="window.app.openEditor('${p.id}')" class="dashboard-v3-project-title">${p.name}</button>
          <div class="dashboard-v3-project-meta">
            <span>${activeSecCount}/${totalSecCount} sections</span>
            <span>${p.branding?.presetName || 'Direction personnalisée'}</span>
            <span>${bus.phone || 'Téléphone non renseigné'}</span>
          </div>
        </div>

        <div class="dashboard-v3-project-actions">
          <button type="button" onclick="window.app.openEditor('${p.id}')" class="is-primary">${getIcon("edit", "w-3.5 h-3.5")}<span>Éditer</span></button>
          <button type="button" onclick="window.app.openPreview('${p.id}')">${getIcon("eye", "w-3.5 h-3.5")}<span>Aperçu</span></button>
          <button type="button" onclick="window.app.openCloserModal('${p.id}')">${getIcon("briefcase", "w-3.5 h-3.5")}<span>Pitch</span></button>
          <button type="button" onclick="window.app.duplicateProject('${p.id}')" class="is-icon" title="Dupliquer" aria-label="Dupliquer ${p.name}">${getIcon("copy", "w-3.5 h-3.5")}</button>
          <button type="button" onclick="window.app.deleteProject('${p.id}')" class="is-icon is-danger" title="Supprimer" aria-label="Supprimer ${p.name}">${getIcon("trash", "w-3.5 h-3.5")}</button>
        </div>
      </article>`;
  }).join('');

  return `
    <div class="dashboard-v3-shell selection:bg-zinc-900 selection:text-white">
      <aside class="dashboard-v3-rail" aria-label="Navigation principale">
        <div class="dashboard-v3-monogram">A</div>
        <button type="button" class="dashboard-v3-rail-item is-active" aria-label="Projets">${getIcon("layers", "w-5 h-5")}<span>Projets</span></button>
        <button type="button" class="dashboard-v3-rail-item" onclick="window.app.openWizard()" aria-label="Nouveau prospect">${getIcon("plus", "w-5 h-5")}<span>Nouveau</span></button>
        <button type="button" class="dashboard-v3-rail-item" onclick="window.app.openVitrineDemo()" aria-label="Voir la vitrine">${getIcon("eye", "w-5 h-5")}<span>Vitrine</span></button>
        <div class="dashboard-v3-rail-space"></div>
        <button type="button" class="dashboard-v3-rail-item" onclick="window.app.toggleThemeMode()" aria-label="Changer l'ambiance">${getIcon(state.themeMode === 'dark' ? 'sun' : 'moon', "w-5 h-5")}<span>Thème</span></button>
      </aside>

      <div class="dashboard-v3-page">
        <header class="dashboard-v3-header">
          <div class="dashboard-v3-brand">
            <span>ARTISITE PROSPECTOR</span>
            <b>v${APP_VERSION}</b>
            <small>Direction studio</small>
          </div>
          <div class="dashboard-v3-header-actions">
            <label class="dashboard-v3-search">
              ${getIcon("search", "w-4 h-4")}
              <input type="text" id="project-search" oninput="window.app.filterProjects(this.value)" placeholder="Rechercher un projet" aria-label="Rechercher un projet">
            </label>
            <button type="button" onclick="window.app.openVitrineDemo()" class="dashboard-v3-secondary">${getIcon("eye", "w-4 h-4")}<span>Voir la vitrine</span></button>
            ${accountControlHTML(state)}
            <button type="button" onclick="window.app.openWizard()" class="dashboard-v3-new">${getIcon("plus", "w-4 h-4")}<span>Nouveau prospect</span></button>
          </div>
        </header>

        <main class="dashboard-v3-main">
          <section class="dashboard-v3-command">
            <div class="dashboard-v3-composer-zone">
              <div class="dashboard-v3-chapter"><span>01</span><i></i><b>Direction commerciale</b></div>
              <h1>Un prospect.<br><em>Une direction.</em><br>Un site prêt à vendre.</h1>
              <p>Passez d’un nom et d’une ville à une direction de site complète. L’outil compose la base ; vous gardez la décision.</p>

              <form id="quick-gen-form" onsubmit="event.preventDefault(); window.app.handleQuickGenerate(event);" class="quick-gen-bar dashboard-v3-composer">
                <label class="dashboard-v3-field">
                  <span>Entreprise</span>
                  <div>${getIcon("edit", "w-4 h-4")}<input type="text" id="quick-gen-name" required aria-label="Raison sociale" placeholder="Atelier Morel"></div>
                </label>
                <label class="dashboard-v3-field">
                  <span>Métier</span>
                  <div>${getIcon("briefcase", "w-4 h-4")}<select id="quick-gen-trade" aria-label="Métier">
                    <option value="paysagiste">Paysagiste / Jardinier</option>
                    <option value="peintre" selected>Peintre en bâtiment</option>
                    <option value="plombier">Plombier Chauffagiste</option>
                    <option value="menuisier">Menuisier / Ébéniste</option>
                    <option value="electricien">Électricien</option>
                    <option value="couvreur">Couvreur / Zingueur</option>
                    <option value="macon">Maçon / Rénovation</option>
                    <option value="restaurateur">Restaurant / Bistro</option>
                    <option value="coiffeur">Salon de Coiffure</option>
                  </select></div>
                </label>
                <label class="dashboard-v3-field">
                  <span>Ville</span>
                  <div>${getIcon("mapPin", "w-4 h-4")}<input type="text" id="quick-gen-city" required aria-label="Ville" placeholder="Paris" value="Paris"></div>
                </label>
                <button type="submit" class="dashboard-v3-generate"><span>Créer la direction</span>${getIcon("arrowRight", "w-4 h-4")}</button>
              </form>

              <div class="dashboard-v3-presets">
                <span>Raccourcis</span>
                <button type="button" onclick="window.app.fillQuickGen('Atelier Peinture Parisienne', 'peintre', 'Paris')">Atelier peinture · Paris</button>
                <button type="button" onclick="window.app.fillQuickGen('Esprit Nature', 'paysagiste', 'Montauban')">Esprit Nature · Montauban</button>
                <button type="button" onclick="window.app.fillQuickGen('AquaPro Dépannage', 'plombier', 'Toulouse')">AquaPro · Toulouse</button>
                <button type="button" onclick="window.app.fillQuickGen('Atelier Dubreuil', 'menuisier', 'Bordeaux')">Dubreuil · Bordeaux</button>
                <button type="button" onclick="window.app.fillQuickGen('VoltService 24/7', 'electricien', 'Lyon')">VoltService · Lyon</button>
              </div>
            </div>

            <aside class="dashboard-v3-pipeline">
              <div class="dashboard-v3-pipeline-head"><span>Pipeline de vente</span><small>${String(total).padStart(2, '0')} projets</small></div>
              <div class="dashboard-v3-conversion" style="--conversion:${conversionRate * 3.6}deg">
                <div><strong>${conversionRate}%</strong><span>conversion</span></div>
              </div>
              <dl>
                <div><dt>En mouvement</dt><dd>${contacted}</dd></div>
                <div><dt>Prêts à contacter</dt><dd>${ready}</dd></div>
                <div><dt>Signés</dt><dd>${won}</dd></div>
                <div><dt>Potentiel</dt><dd>${valuedProjects.length ? `${potentialRevenue.toLocaleString('fr-FR')} €` : 'Non renseigné'}</dd></div>
              </dl>
              <span class="dashboard-v3-pipeline-rate">Taux ${conversionRate}% · ${valuedProjects.length}/${total} renseignés</span>
            </aside>
          </section>

          <section class="dashboard-v3-library">
            <div class="dashboard-v3-library-head">
              <div>
                <div class="dashboard-v3-chapter"><span>02</span><i></i><b>Directions actives</b></div>
                <h2>Vos projets, comme une<br>bibliothèque de directions.</h2>
              </div>
              <div class="dashboard-v3-library-tools">
                <span>${total} direction${total > 1 ? 's' : ''}</span>
                <button type="button" onclick="window.app.openWizard()">${getIcon("plus", "w-4 h-4")} Ajouter</button>
              </div>
            </div>

            <div class="dashboard-v3-bulkbar" aria-label="Actions groupées sur les projets">
              <label class="dashboard-v3-select-all">
                <input type="checkbox" id="project-select-all" onchange="window.app.toggleSelectAllProjects(this.checked)">
                <span>Tout sélectionner</span>
              </label>
              <span class="dashboard-v3-selection-count" data-project-selection-count>0 sélectionné</span>
              <div class="dashboard-v3-bulk-actions">
                <button type="button" data-project-clear-selection onclick="window.app.clearProjectSelection()" disabled>Annuler</button>
                <button type="button" data-project-bulk-delete onclick="window.app.deleteSelectedProjects()" disabled>${getIcon("trash", "w-3.5 h-3.5")} Supprimer</button>
              </div>
            </div>

            ${migrationBannerHTML(state)}
            <div id="projects-grid" class="dashboard-v3-project-list">
              ${projectCardsHTML || `
                <div class="dashboard-v3-empty">
                  <span>01</span><h3>Aucune direction encore.</h3><p>Créez votre premier prospect avec le composeur ci-dessus.</p>
                  <button type="button" onclick="window.app.openWizard()">Créer un prospect</button>
                </div>`}
            </div>
          </section>
        </main>
      </div>
    </div>
  `;
}

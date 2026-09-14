import { getIcon } from "./icons.js";
import { getTradeFallbackDataUrl } from "../data/imageFallbacks.js";
import { APP_VERSION } from "../version.js";

export function renderDashboard(state) {
  const projects = state.projects || [];
  const total = projects.length;
  const contacted = projects.filter(p => p.pipelineStatus === "contacted" || p.pipelineStatus === "demo_sent").length;
  const won = projects.filter(p => p.pipelineStatus === "won").length;
  const conversionRate = total ? Math.round(won / total * 100) : 0;
  const valuedProjects = projects.filter(p => Number.isFinite(p.estimatedValue) && p.estimatedValue >= 0);
  const potentialRevenue = valuedProjects.reduce((sum, p) => sum + p.estimatedValue, 0);

  const statusMap = {
    prospect: { label: "À contacter", tone: "prospect" },
    generated: { label: "Site prêt", tone: "ready" },
    contacted: { label: "En prospection", tone: "contacted" },
    demo_sent: { label: "Démo partagée", tone: "demo" },
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
    const featured = index === 0 ? " project-card--featured" : "";
    return `
      <article class="project-card${featured}" data-project-id="${p.id}" data-pipeline-status="${p.pipelineStatus || 'generated'}">
        <button type="button" class="project-card-media" onclick="window.app.openEditor('${p.id}')" aria-label="Ouvrir ${p.name} dans l’éditeur">
          <img src="${heroImage}" data-fallback-src="${fallbackImage}" alt="Aperçu de ${p.name}" onerror="if(!this.dataset.fallbackApplied){this.dataset.fallbackApplied='true';this.src=this.dataset.fallbackSrc;}">
          <span class="project-card-shade"></span>
          <span class="project-card-index">${String(index + 1).padStart(2, '0')}</span>
          <span class="project-card-status project-card-status--${st.tone}">${st.label}</span>
          <span class="project-card-open">Ouvrir ${getIcon("arrowRight", "w-4 h-4")}</span>
        </button>
        <div class="project-card-copy">
          <div>
            <p class="project-card-kicker">${bus.tradeLabel || 'Artisan'} · ${bus.city || 'France'}</p>
            <h3>${p.name}</h3>
          </div>
          <div class="project-card-meta">
            <span>${activeSecCount}/${totalSecCount} sections</span>
            <span>${p.branding?.presetName || 'Direction libre'}</span>
          </div>
        </div>
        <div class="project-card-actions">
          ${p.id === 'proj-esprit-nature' ? `<button type="button" onclick="window.app.openPreview('${p.id}')" class="project-action project-action--primary">${getIcon("eye", "w-4 h-4")}<span>Voir vitrine</span></button>` : ''}
          <button type="button" onclick="window.app.openEditor('${p.id}')" class="project-action project-action--primary">${getIcon("edit", "w-4 h-4")}<span>Éditer</span></button>
          <button type="button" onclick="window.app.openPreview('${p.id}')" class="project-action" title="Aperçu client">${getIcon("eye", "w-4 h-4")}</button>
          <button type="button" onclick="window.app.openCloserModal('${p.id}')" class="project-action" title="Kit de vente">${getIcon("sparkles", "w-4 h-4")}</button>
          <button type="button" onclick="window.app.duplicateProject('${p.id}')" class="project-action" title="Dupliquer">${getIcon("copy", "w-4 h-4")}</button>
          <button type="button" onclick="window.app.deleteProject('${p.id}')" class="project-action project-action--danger" title="Supprimer">${getIcon("trash", "w-4 h-4")}</button>
        </div>
      </article>`;
  }).join('');

  return `
    <div class="artist-dashboard studio-dashboard">
      <nav class="studio-nav">
        <div class="studio-nav-inner">
          <button type="button" class="studio-brand" onclick="window.scrollTo({top:0,behavior:'smooth'})" aria-label="Retour en haut">
            <span class="studio-brand-mark">A</span>
            <span class="studio-brand-copy"><b>ARTISITE PROSPECTOR</b><small>direction studio · v${APP_VERSION}</small></span>
          </button>
          <div class="studio-nav-tools">
            <label class="studio-search">${getIcon("search", "w-4 h-4")}<input type="text" id="project-search" oninput="window.app.filterProjects(this.value)" placeholder="Rechercher un projet"></label>
            <button type="button" id="theme-mode-toggle-btn" aria-pressed="${state.themeMode === 'dark'}" onclick="window.app.toggleThemeMode()" class="studio-icon-button" aria-label="Basculer le thème">${state.themeMode === 'dark' ? getIcon("sun", "w-4 h-4") : getIcon("moon", "w-4 h-4")}</button>
            <button type="button" onclick="window.app.openVitrineDemo()" class="studio-link-button">Voir la vitrine ${getIcon("externalLink", "w-4 h-4")}</button>
            <button type="button" onclick="window.app.openWizard()" class="studio-primary-button">${getIcon("plus", "w-4 h-4")} Nouveau prospect</button>
          </div>
        </div>
      </nav>

      <main class="studio-main">
        <section class="studio-hero" onpointermove="const r=this.getBoundingClientRect();this.style.setProperty('--mx',event.clientX-r.left+'px');this.style.setProperty('--my',event.clientY-r.top+'px')">
          <div class="studio-hero-atmosphere" aria-hidden="true"><i></i><i></i><i></i></div>
          <div class="studio-hero-grid">
            <div class="studio-hero-copy">
              <p class="studio-eyebrow"><span>01</span> Direction commerciale</p>
              <h1>Un prospect.<br><em>Une direction.</em><br>Un site prêt à vendre.</h1>
              <p class="studio-lede">Passez d’un nom et d’une ville à une direction de site complète. L’outil compose la base ; vous gardez la décision.</p>
            </div>

            <aside class="studio-instrument" aria-label="Vue d’ensemble du pipeline">
              <div class="instrument-head"><span>Pipeline vivant</span><span>${String(total).padStart(2,'0')} projets</span></div>
              <div class="instrument-gauge" style="--conversion:${conversionRate}%"><div><strong>${conversionRate}%</strong><span>conversion</span></div></div>
              <div class="instrument-lines">
                <div><span>En mouvement</span><b>${contacted}</b></div>
                <div><span>Signés</span><b>${won}</b></div>
                <div><span>Pipeline de vente</span><b>${valuedProjects.length ? `${potentialRevenue.toLocaleString('fr-FR')} €` : 'Non renseigné'}</b></div>
              </div>
              <span class="instrument-rate">Taux ${conversionRate}% · ${valuedProjects.length}/${total} renseignés</span>
            </aside>
          </div>

          <div class="studio-composer">
            <div class="composer-label"><span>02</span><div><b>Décrire le prochain prospect</b><small>Nom, métier, ville. Le reste devient une direction.</small></div></div>
            <form id="quick-gen-form" onsubmit="event.preventDefault(); window.app.handleQuickGenerate(event);" class="quick-gen-bar studio-commandbar">
              <label class="studio-field studio-field--name">${getIcon("edit", "w-4 h-4")}<span><small>Entreprise</small><input type="text" id="quick-gen-name" aria-label="Nom de l’entreprise" maxlength="120" required placeholder="Atelier Morel"></span></label>
              <label class="studio-field">${getIcon("briefcase", "w-4 h-4")}<span><small>Métier</small><select id="quick-gen-trade" aria-label="Métier"><option value="paysagiste">Paysagiste / Jardinier</option><option value="peintre" selected>Peintre en bâtiment</option><option value="plombier">Plombier chauffagiste</option><option value="menuisier">Menuisier / Ébéniste</option><option value="electricien">Électricien</option><option value="couvreur">Couvreur / Zingueur</option><option value="macon">Maçon / Rénovation</option><option value="restaurateur">Restaurant / Bistro</option><option value="coiffeur">Salon de coiffure</option></select></span></label>
              <label class="studio-field studio-field--city">${getIcon("mapPin", "w-4 h-4")}<span><small>Ville</small><input type="text" id="quick-gen-city" aria-label="Ville" maxlength="120" required value="Paris" placeholder="Paris"></span></label>
              <div class="quick-gen-field-btn"><button type="submit" class="studio-generate-button"><span>Créer la direction</span>${getIcon("externalLink", "w-4 h-4")}</button></div>
            </form>
            <div class="studio-presets"><span>Raccourcis</span><button type="button" onclick="window.app.fillQuickGen('Atelier Peinture Parisienne','peintre','Paris')">Atelier peinture · Paris</button><button type="button" onclick="window.app.fillQuickGen('Esprit Nature','paysagiste','Montauban')">Esprit Nature · Montauban</button><button type="button" onclick="window.app.fillQuickGen('AquaPro Dépannage','plombier','Toulouse')">AquaPro · Toulouse</button><button type="button" onclick="window.app.fillQuickGen('Atelier Dubreuil','menuisier','Bordeaux')">Dubreuil · Bordeaux</button><button type="button" onclick="window.app.fillQuickGen('VoltService 24/7','electricien','Lyon')">VoltService · Lyon</button></div>
          </div>
        </section>

        <section class="studio-library">
          <header class="studio-library-head">
            <div><p class="studio-eyebrow studio-eyebrow--dark"><span>03</span> Directions actives</p><h2>Vos projets, comme une bibliothèque de mondes.</h2></div>
            <div class="library-side"><p>${total} direction${total === 1 ? '' : 's'} · ${won} signée${won === 1 ? '' : 's'}</p><button type="button" onclick="window.app.openCloserModal()">${getIcon("phone", "w-4 h-4")} Script de closing</button></div>
          </header>

          <div id="projects-grid" class="studio-project-grid">
            ${projectCardsHTML || `<div class="studio-empty"><span>01</span><h3>La bibliothèque est vide.</h3><p>Créez une première direction depuis le générateur ci-dessus.</p><button type="button" onclick="window.app.openWizard()">Nouveau prospect ${getIcon("externalLink", "w-4 h-4")}</button></div>`}
          </div>
        </section>
      </main>
    </div>`;
}

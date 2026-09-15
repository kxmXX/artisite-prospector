import { state, getDeepValue, setDeepValue } from "./state.js";
import { renderDashboard } from "./components/dashboard.js";
import { renderEditor, getSectionFriendlyTitle } from "./components/editor.js";
import { renderWizardModal } from "./components/wizard.js";
import { renderCloserModal } from "./components/closerModal.js";
import { renderShareModal } from "./components/shareModal.js";
import { renderCommandPalette } from "./components/commandPalette.js";
import { renderAuthModal } from "./components/authModal.js";
import { fetchSession, signIn, signUp, signOut, pullProjects, pushProject, importProjects, readLocalProjects, planMigration, backupLocalProjects } from "./session.js";
import { renderAddSectionModal } from "./components/addSectionModal.js";
import { renderImageModal } from "./components/imageModal.js";
import { renderInspector } from "./components/inspector.js";
import { renderWebsiteHTML, generateLocalBusinessSchema } from "./components/renderer.js";
import { generateSite, createSectionData } from "./engine/generator.js";
import { processCopilotPrompt, applyCopilotOperations, resolveProjectUiTarget } from "./engine/copilot.js";
import { adaptFreeformLayoutToViewport, FREEFORM_SNAP_THRESHOLD, marqueeContainsRectCenter, marqueeRectFromPoints, rectAxisLines, resolveEdgeAutoScroll, resolveEqualSpacingSnap, resolveFreeformSnap } from "./engine/freeform.js";
import { downloadHTML, downloadJSON, generateProductionPackage, downloadProductionPackage } from "./engine/exporter.js";
import { getStylePresetById } from "./data/styles.js";
import { getTradeById } from "./data/trades.js";
import { getTradeFallbackDataUrl } from "./data/imageFallbacks.js";
import { ensureFontCatalog } from "./data/fonts.js";
import { getUiCode } from "./data/uiIds.js";
import { ELEMENT_STATES, ELEMENT_STATE_LABELS, setElementState, clearElementState } from "./engine/elementStates.js";
import { setSectionLayout, isValidSectionId } from "./engine/sectionStyle.js";
import { setElementStyle, clearElementStyle } from "./engine/elementStyle.js";
import { getIcon } from "./components/icons.js";
import { parseClientDemoPin, verifyClientDemoPin } from "./utils/clientDemoPin.js";
import { createEspritNatureDemoProject } from "./data/sampleProjects.js";
import { getDefaultTemplateIdForTrade, getSiteTemplate, instantiateSiteTemplate } from "./data/templates.js";
import { escapeHtml } from "./utils/html.js";

export class App {
  // Scope async work to its original project, contents and request. Subscription
  // also detects leaving and returning to the same project/drawer.
  beginAIRequest(channel) {
    this._aiRequests ||= new Map();
    this._aiRequests.get(channel)?.dispose();
    const project = state.currentProject;
    const snapshot = JSON.stringify(project);
    const view = state.currentView;
    const drawer = state.activeDrawer;
    let invalid = false;
    const unsubscribe = state.subscribe((s, event) => {
      if (event === "project_selected" || s.currentProject?.id !== project?.id ||
          s.currentView !== view || JSON.stringify(s.currentProject) !== snapshot ||
          (channel === "wizard" && s.activeDrawer !== drawer)) invalid = true;
    });
    const request = {
      current: () => !invalid && this._aiRequests.get(channel) === request &&
        state.currentProject?.id === project?.id && state.currentView === view &&
        JSON.stringify(state.currentProject) === snapshot &&
        (channel !== "wizard" || state.activeDrawer === drawer),
      dispose: () => { invalid = true; unsubscribe(); }
    };
    this._aiRequests.set(channel, request);
    return request;
  }

  constructor() {
    this.rootEl = document.getElementById("app");
    this.wizardMode = "fast";
    this.activeSidebarTab = "sections";
    this.closerTab = "script";
    this.typographyTarget = "heading";
    this._disposeStickyHeroVisibility = null;

    this.init();
  }

  init() {
    // Expose app on window for inline handlers
    window.app = this;
    ensureFontCatalog();
    this.initAccounts();
    document.body.classList.toggle("dark-theme", state.themeMode === "dark");

    // Subscribe to state changes
    state.subscribe((s, event) => {
      if (event === "live_text_change" || event === "live_color_change" || event === "live_business_change" || event === "sidebar_tab_change") {
        return;
      }
      if (event === "theme_mode_change") {
        document.body.classList.toggle("dark-theme", s.themeMode === "dark");
        const btn = document.getElementById("theme-mode-toggle-btn");
        if (btn) {
          const isDark = s.themeMode === "dark";
          btn.innerHTML = `${getIcon(isDark ? 'sun' : 'moon', 'w-4 h-4')} <span class="theme-control-label">${isDark ? 'Éditeur clair' : 'Éditeur sombre'}</span>`;
        }
        return;
      }
      if (event === "editor_mode_change") {
        document.body.classList.toggle("client-preview-mode", s.editorMode === "preview");
        this.render();
        if (s.currentView === "editor") {
          this.initCanvasInteractivity();
        }
        return;
      }
      if (event === "drawer_change") {
        this.renderModals();
        return;
      }
      if (event === "copilot_visibility_change") {
        this.render();
        return;
      }
      if (event === "history_change") {
        this.updateUndoRedoUI();
        return;
      }
      if (event === "section_selected") {
        this.updateSelectedSectionUI();
        return;
      }
      if (event === "viewport_change") {
        this.updateViewportUI();
        return;
      }
      this.render();
      if (s.currentView === "editor") {
        this.initCanvasInteractivity();
      }
    });

    // Global keyboard shortcuts
    window.addEventListener("keydown", (e) => {
      const isInput = e.target.matches("input, textarea, select") || e.target.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        if (isInput) return;
        e.preventDefault();
        this.undo();
      } else if ((e.metaKey || e.ctrlKey) && (e.shiftKey && e.key.toLowerCase() === "z" || e.key.toLowerCase() === "y")) {
        if (isInput) return;
        e.preventDefault();
        this.redo();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        this.openCommandPalette();
      } else if (e.key === "Escape") {
        // Un seul escalier : édition en ligne, puis modale, puis élément, puis barres.
        if (document.activeElement?.isContentEditable) { this.exitInlineEditing(); return; }
        if (state.activeDrawer) { this.closeModals(); return; }
        if ((this._freeformSelectedKeys || []).length) { this.clearFreeformSelection(); return; }
        this.toggleExportMenu(false);
        this.closeAllButtonPopovers();
        this.closeAllFloatingToolbars();
      }
    });

    // Outside-click dismissal for dropdowns and popovers
    document.addEventListener("click", (e) => {
      const menu = document.getElementById("export-menu");
      const btn = document.getElementById("export-menu-button");
      if (menu && menu.dataset.open === "true" && !menu.contains(e.target) && !btn?.contains(e.target)) {
        this.toggleExportMenu(false);
      }
      if (!e.target.closest("[data-cta-popover-wrapper]")) {
        this.closeAllButtonPopovers();
      }
      document.querySelectorAll(".sec-motion-popover:not(.hidden)").forEach(pop => {
        const secId = pop.dataset.sectionId;
        if (!pop.contains(e.target) && !e.target.closest(`[data-motion-trigger="${secId}"]`)) {
          pop.classList.add("hidden");
        }
      });
      document.querySelectorAll(".sec-bg-popover:not(.hidden)").forEach(pop => {
        const secId = pop.dataset.sectionId;
        if (!pop.contains(e.target) && !e.target.closest(`[data-action="toggle-bg"][data-id="${secId}"]`)) {
          pop.classList.add("hidden");
        }
      });
      document.querySelectorAll("[id^='img-motion-menu-']:not(.hidden)").forEach(m => {
        if (!m.contains(e.target) && !e.target.closest("[onclick*='toggleImageMotionMenu']")) {
          m.classList.add("hidden");
        }
      });
      const ftbAnimMenu = document.getElementById("ftb-anim-menu");
      if (ftbAnimMenu && !ftbAnimMenu.classList.contains("hidden") && !ftbAnimMenu.contains(e.target) && !e.target.closest("#ftb-anim-btn")) {
        ftbAnimMenu.classList.add("hidden");
      }
      const ftbColorMenu = document.getElementById("ftb-color-menu");
      if (ftbColorMenu && !ftbColorMenu.classList.contains("hidden") && !ftbColorMenu.contains(e.target) && !e.target.closest("#ftb-color-btn")) {
        ftbColorMenu.classList.add("hidden");
      }
    });

    this.installNavigationHistory();
    const initialRoute = this.readNavigationRoute();
    this.applyNavigationRoute(initialRoute);
    this.writeNavigationHistory(initialRoute, true);

    this.render();
  }

  render() {
    if (!this.rootEl) return;
    const previousScrollPosition = state.currentView === "editor"
      ? (() => {
          const host = document.getElementById("editor-main-canvas") || document.querySelector("main");
          return host ? { top: host.scrollTop, left: host.scrollLeft } : null;
        })()
      : null;

    if (state.currentView === "dashboard") {
      this.rootEl.innerHTML = renderDashboard(state);
      this.syncProjectSelectionUI();
    } else if (state.currentView === "editor") {
      this.rootEl.innerHTML = renderEditor(state);
      this.initInlineEditing();
    } else if (state.currentView === "preview") {
      this.renderFullscreenPreview();
    }

    // Modals & Drawers overlays
    this.renderModals();
    this.syncSiteThemeToggle();
    this.hydrateImageFallbacks();
    this.initScrollObserver();
    if (previousScrollPosition) {
      requestAnimationFrame(() => {
        const host = document.getElementById("editor-main-canvas") || document.querySelector("main");
        host?.scrollTo?.({ top: previousScrollPosition.top, left: previousScrollPosition.left, behavior: "instant" });
      });
    }
  }

  renderModals() {
    let modalContainer = document.getElementById("modal-container");
    if (!modalContainer) {
      modalContainer = document.createElement("div");
      modalContainer.id = "modal-container";
      document.body.appendChild(modalContainer);
    }

    const drawer = state.activeDrawer || null;
    const previousDrawer = this._lastRenderedDrawer || null;
    if (drawer && !previousDrawer) {
      this._modalReturnFocus = document.activeElement || null;
    }

    if (state.activeDrawer === "new_project") {
      modalContainer.innerHTML = renderWizardModal();
    } else if (state.activeDrawer === "closer") {
      modalContainer.innerHTML = renderCloserModal(state.currentProject);
    } else if (state.activeDrawer === "share_modal") {
      modalContainer.innerHTML = renderShareModal(state.currentProject, this._shareModalTab || 'demo');
    } else if (state.activeDrawer === "auth") {
      modalContainer.innerHTML = renderAuthModal(state);
      setTimeout(() => document.getElementById("auth-username")?.focus(), 0);
    } else if (state.activeDrawer === "command_palette") {
      modalContainer.innerHTML = renderCommandPalette(state.currentProject, state.projects);
      setTimeout(() => {
        document.getElementById("cmd-palette-input")?.focus();
      }, 50);
    } else if (state.activeDrawer === "add_section") {
      modalContainer.innerHTML = renderAddSectionModal(state.currentProject, this._addModalTab || "sections");
    } else if (state.activeDrawer === "image_modal") {
      modalContainer.innerHTML = renderImageModal(state);
    } else {
      modalContainer.innerHTML = "";
    }

    const canvaDock = document.getElementById("canva-floating-dock");
    if (canvaDock) {
      canvaDock.style.display = state.activeDrawer ? "none" : "";
    }
    document.body.classList.toggle("modal-open", Boolean(state.activeDrawer));

    const focusSelectors = {
      new_project: "#wiz-name",
      closer: "#tab-closer-script",
      share_modal: "#share-modal-url-input",
      command_palette: "#cmd-palette-input",
      add_section: "#catalog-search",
      image_modal: "#tab-img-library"
    };
    if (drawer) {
      const focusModal = () => {
        const preferred = document.querySelector(focusSelectors[drawer] || "");
        const fallback = modalContainer.querySelector?.("input:not([type='hidden']), textarea, select, button, [href], [tabindex]:not([tabindex='-1'])");
        const target = preferred || fallback;
        if (target && !target.disabled && typeof target.focus === "function") {
          try { target.focus({ preventScroll: true }); } catch { target.focus(); }
        }
      };
      if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(focusModal);
      } else {
        setTimeout(focusModal, 0);
      }
    } else if (previousDrawer) {
      const returnTarget = this._modalReturnFocus;
      this._modalReturnFocus = null;
      if (returnTarget?.isConnected && typeof returnTarget.focus === "function") {
        try { returnTarget.focus({ preventScroll: true }); } catch { returnTarget.focus(); }
      }
    }
    this._lastRenderedDrawer = drawer;
  }

  // Navigation methods
  installNavigationHistory() {
    if (this._navigationHistoryBound || typeof window === "undefined") return;
    window.addEventListener("popstate", () => {
      this.applyNavigationRoute(this.readNavigationRoute());
    });
    this._navigationHistoryBound = true;
  }

  readNavigationRoute() {
    if (typeof window === "undefined") return { view: "dashboard" };
    const params = new URLSearchParams(window.location.search);
    const demo = params.get("demo");
    if (params.get("vitrine") === "1" || demo === "esprit-nature" || demo === "1") {
      return { view: "preview", canonicalDemo: true };
    }
    if (demo) return { view: "preview", projectId: demo };
    const view = params.get("view");
    if (view === "editor" || view === "preview") {
      return { view, projectId: params.get("project") || undefined };
    }
    return { view: "dashboard" };
  }

  navigationUrl(route = {}) {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    if (route.canonicalDemo) {
      url.searchParams.set("vitrine", "1");
    } else if (route.view === "editor" || route.view === "preview") {
      url.searchParams.set("view", route.view);
      if (route.projectId) url.searchParams.set("project", route.projectId);
    }
    return `${url.pathname}${url.search}${url.hash}`;
  }

  writeNavigationHistory(route, replace = false) {
    if (typeof window === "undefined" || !window.history) return;
    const payload = { artisite: true, view: route.view || "dashboard", projectId: route.projectId || null, canonicalDemo: Boolean(route.canonicalDemo) };
    window.history[replace ? "replaceState" : "pushState"](payload, "", this.navigationUrl(route));
  }

  resolveRouteProject(projectId) {
    if (!projectId) return null;
    return state.projects.find(project => project.id === projectId || project.name?.toLowerCase().includes(String(projectId).toLowerCase())) || null;
  }

  applyNavigationRoute(route = {}) {
    const view = ["editor", "preview"].includes(route.view) ? route.view : "dashboard";
    if (route.canonicalDemo) {
      state.setCurrentProject(createEspritNatureDemoProject());
    } else if (route.projectId) {
      const project = this.resolveRouteProject(route.projectId);
      if (project) state.setCurrentProject(project);
    }
    state.setView(view);
  }

  navigate(route) {
    this.writeNavigationHistory(route, false);
    this.applyNavigationRoute(route);
  }

  openDashboard() {
    this.navigate({ view: "dashboard" });
  }

  openEditor(projectId) {
    const id = projectId || state.currentProject?.id;
    this.navigate({ view: "editor", projectId: id });
  }

  openPreview(projectId) {
    const id = projectId || state.currentProject?.id;
    this.navigate({ view: "preview", projectId: id });
  }

  openVitrineDemo() {
    this.navigate({ view: "preview", canonicalDemo: true });
  }

  resetDemoProject() {
    state.resetDemoProject();
    this.showToast("Démo Esprit Nature réinitialisée au standard Sendpage !", "success");
    this.render();
  }


  openWizard() {
    state.setDrawer("new_project");
  }

  closeWizard() {
    state.closeDrawer();
  }

  syncWizardTemplateStyle(templateId) {
    const template = getSiteTemplate(templateId);
    const preset = document.getElementById("wiz-preset");
    if (preset && template?.presetId) preset.value = template.presetId;
  }

  openCloserModal(projectId) {
    if (projectId) state.setCurrentProject(projectId);
    state.setDrawer("closer");
    setTimeout(() => {
      if (this.closerTab === "contract") {
        this.initSignaturePad();
      }
    }, 50);
  }

  closeCloserModal() {
    if (this._callTimerInterval) {
      clearInterval(this._callTimerInterval);
      this._callTimerInterval = null;
    }
    state.closeDrawer();
  }

  openShareModal() {
    state.setDrawer("share_modal");
  }

  closeShareModal() {
    state.closeDrawer();
  }

  setShareModalTab(tab) {
    this._shareModalTab = tab;
    this.renderModals();
  }

  enterCommercialDemoMode() {
    this.closeShareModal();
    this.openPreview(state.currentProject?.id);
    this.showToast("Mode Démonstration Commerciale Activé (Plein Écran)", "info");
  }

  downloadStandaloneHTML() {
    if (!state.currentProject) return;
    downloadHTML(state.currentProject);
    this.showToast("Fichier HTML autonome téléchargé !", "success");
  }

  copyShareUrl(inputId = "share-modal-url-input", labelId = "btn-copy-share-label") {
    const input = document.getElementById(inputId);
    if (input) {
      input.select();
      navigator.clipboard?.writeText(input.value);
      const label = document.getElementById(labelId);
      if (label) {
        label.textContent = "✓ Copié !";
        setTimeout(() => { label.textContent = "Copier"; }, 2000);
      }
    }
  }

  openCommandPalette() {
    state.setDrawer("command_palette");
  }

  closeCommandPalette() {
    state.closeDrawer();
  }

  filterCommandPalette(query) {
    const q = (query || "").toLowerCase().trim();
    const items = document.querySelectorAll("#cmd-palette-results .cmd-item");
    items.forEach(item => {
      const title = (item.getAttribute("data-title") || item.textContent).toLowerCase();
      const match = !q || title.includes(q);
      item.style.display = match ? "flex" : "none";
    });
  }

  handleCommandPaletteKey(e) {
    if (e.key === "Escape") {
      this.closeCommandPalette();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const visibleItems = Array.from(document.querySelectorAll("#cmd-palette-results .cmd-item")).filter(el => el.style.display !== "none");
      if (!visibleItems.length) return;
      let idx = visibleItems.findIndex(el => el.classList.contains("bg-zinc-100"));
      visibleItems.forEach(el => el.classList.remove("bg-zinc-100"));
      if (e.key === "ArrowDown") {
        idx = (idx + 1) % visibleItems.length;
      } else {
        idx = (idx - 1 + visibleItems.length) % visibleItems.length;
      }
      visibleItems[idx].classList.add("bg-zinc-100");
      visibleItems[idx].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = document.querySelector("#cmd-palette-results .cmd-item.bg-zinc-100") || 
                       Array.from(document.querySelectorAll("#cmd-palette-results .cmd-item")).find(el => el.style.display !== "none");
      if (selected) {
        selected.click();
      }
    }
  }

  executeCommand(type, arg) {
    this.closeCommandPalette();
    if (type === "goto-section") {
      this.scrollToSection(arg);
    } else if (type === "open-project") {
      this.openEditor(arg);
    } else if (type === "new-project") {
      this.openWizard();
    } else if (type === "share-modal") {
      this.openShareModal();
    } else if (type === "closer-modal") {
      this.openCloserModal(state.currentProject?.id);
    } else if (type === "print-proposal") {
      this.printCommercialProposal();
    } else if (type === "export-html") {
      this.exportHTML();
    } else if (type === "set-vp") {
      this.setViewport(arg);
    } else if (type === "switch-theme") {
      this.switchGlobalTheme(arg);
    } else if (type === "reset-sendpage-demo") {
      this.resetSendpageDemo();
    }
  }

  resetSendpageDemo() {
    import("./data/sampleProjects.js").then(({ SAMPLE_PROJECTS }) => {
      const demo = SAMPLE_PROJECTS[0];
      const idx = state.projects.findIndex(p => p.id === "proj-esprit-nature");
      if (idx !== -1) {
        state.projects[idx] = JSON.parse(JSON.stringify(demo));
        state.currentProject = state.projects[idx];
      } else {
        state.projects.unshift(JSON.parse(JSON.stringify(demo)));
        state.currentProject = state.projects[0];
      }
      state.saveToStorage();
      this.showNotification("Modèle Esprit Nature (Sendpage 100%) rechargé avec succès !");
      this.render();
    });
  }

  toggleStickyBar(enabled) {
    if (!state.currentProject) return;
    if (!state.currentProject.settings) state.currentProject.settings = {};
    state.pushHistory(enabled ? "Activation bandeau flottant" : "Désactivation bandeau flottant");
    state.currentProject.settings.stickyBarEnabled = enabled;
    state.saveToStorage();
    this.render();
  }

  updateWhatsAppNumber(number) {
    if (!state.currentProject) return;
    if (!state.currentProject.settings) state.currentProject.settings = {};
    state.pushHistory("Modification WhatsApp");
    state.currentProject.settings.whatsappNumber = number;
    state.saveToStorage();
    this.render();
  }

  switchGlobalTheme(theme) {
    state.pushHistory("Ambiance : " + theme);
    if (!state.currentProject) return;
    const b = state.currentProject.branding;
    if (theme === "white") {
      b.bgColor = "#ffffff";
      b.bgSecondary = "#fafafa";
      b.textColor = "#18181b";
      b.textMuted = "#71717a";
      b.globalTheme = "white";
    } else if (theme === "mineral") {
      b.bgColor = "#f4f4f5";
      b.bgSecondary = "#ffffff";
      b.textColor = "#18181b";
      b.textMuted = "#71717a";
      b.globalTheme = "mineral";
    } else if (theme === "dark") {
      b.bgColor = "#09090b";
      b.bgSecondary = "#18181b";
      b.textColor = "#f4f4f5";
      b.textMuted = "#a1a1aa";
      b.globalTheme = "dark";
    }
    state.currentProject.siteTheme = theme === "dark" ? "dark" : "light";
    state.saveToStorage();
    this.render();
  }

  copyJsonLdSchema() {
    if (!state.currentProject) return;
    const schema = generateLocalBusinessSchema(state.currentProject);
    navigator.clipboard?.writeText(schema);
    alert("✓ Schema.org (LocalBusiness JSON-LD) copié dans le presse-papier !");
  }

  /* ------------------------------------------------------------------ *
   * Comptes et synchronisation
   * ------------------------------------------------------------------ */

  initAccounts() {
    this._cloudSync = { timer: null };
    state.registerSaveHook((projects, project) => this.queueCloudSync(project));
    this.refreshSession();
  }

  async refreshSession() {
    const result = await fetchSession();
    state.setSession(result.user, result.status);
    if (result.status === "authenticated") await this.pullCloudLibrary();
    this.render();
  }

  async pullCloudLibrary() {
    try {
      const remote = await pullProjects();
      if (!remote.length) return;
      const byId = new Map(state.projects.map((project) => [project.id, project]));
      for (const project of remote) {
        const local = byId.get(project.id);
        const localTime = local ? Date.parse(local.updatedAt || 0) || 0 : 0;
        const remoteTime = Date.parse(project.updatedAt || 0) || 0;
        if (!local || remoteTime > localTime) byId.set(project.id, project);
      }
      const previousId = state.currentProject && state.currentProject.id;
      state.projects = [...byId.values()];
      state.currentProject = state.projects.find((project) => project.id === previousId) || state.projects[0] || null;
      state.hasStoredLibrary = true;
      state.saveToStorage();
    } catch (error) {
      this.showToast(error.message || "Bibliothèque distante indisponible", "error");
    }
  }

  queueCloudSync(project) {
    if (state.authStatus !== "authenticated" || !project || !project.id) return;
    clearTimeout(this._cloudSync.timer);
    this._cloudSync.timer = setTimeout(() => {
      pushProject(project).catch((error) => {
        this.showToast("Synchronisation impossible : " + (error.message || ""), "error");
      });
    }, 600);
  }

  openAuthModal(tab = "login") {
    state.authTab = tab === "register" ? "register" : "login";
    state.authError = "";
    state.authNotice = "";
    state.activeDrawer = "auth";
    this.renderModals();
  }

  closeAuthModal() {
    state.activeDrawer = null;
    this.renderModals();
  }

  switchAuthTab(tab) {
    state.authTab = tab === "register" ? "register" : "login";
    state.authError = "";
    this.renderModals();
  }

  async submitAuth() {
    const usernameField = document.getElementById("auth-username");
    const passwordField = document.getElementById("auth-password");
    const username = usernameField ? usernameField.value : "";
    const password = passwordField ? passwordField.value : "";
    state.authError = "";
    state.authNotice = "";
    state.authBusy = true;
    this.renderModals();
    try {
      if (state.authTab === "register") await signUp(username, password);
      else await signIn(username, password);
      const session = await fetchSession();
      state.setSession(session.user, session.status);
      await this.pullCloudLibrary();
      state.authBusy = false;
      state.activeDrawer = null;
      const plan = planMigration(readLocalProjects(), state.projects);
      state._migrationPlan = plan.toImport.length ? plan : null;
      this.render();
      this.showToast("Connecté : " + (session.user ? session.user.username : ""), "success");
    } catch (error) {
      state.authBusy = false;
      state.authError = error.message || "Connexion impossible";
      this.renderModals();
    }
  }

  async importLocalLibrary() {
    const projects = readLocalProjects();
    if (!projects.length) return;
    const backedUp = backupLocalProjects();
    try {
      const result = await importProjects(projects);
      await this.pullCloudLibrary();
      state._migrationPlan = null;
      this.showToast((result && result.imported ? result.imported : projects.length) + " site(s) importés" + (backedUp ? " (copie de secours conservée)" : ""), "success");
      this.render();
    } catch (error) {
      this.showToast("Import impossible : " + (error.message || ""), "error");
    }
  }

  dismissMigration() {
    state._migrationPlan = null;
    this.render();
  }

  async signOutAccount() {
    try { await signOut(); } catch { /* la session locale est fermée quand même */ }
    state.setSession(null, "anonymous");
    state._migrationPlan = null;
    this.showToast("Déconnecté", "info");
    this.render();
  }

  openAddSectionModal(tab = "sections") {
    this._addModalTab = tab;
    state.setDrawer("add_section");
  }

  switchAddModalTab(tab = "sections") {
    this._addModalTab = tab;
    const tabSectionsBtn = document.getElementById("tab-add-sections");
    const tabComponentsBtn = document.getElementById("tab-add-components");
    const viewSections = document.getElementById("add-modal-sections-view");
    const viewComponents = document.getElementById("add-modal-components-view");

    if (tab === "components") {
      tabSectionsBtn?.classList.remove("is-active");
      tabComponentsBtn?.classList.add("is-active");
      viewSections?.classList.add("hidden");
      viewComponents?.classList.remove("hidden");
    } else {
      tabSectionsBtn?.classList.add("is-active");
      tabComponentsBtn?.classList.remove("is-active");
      viewSections?.classList.remove("hidden");
      viewComponents?.classList.add("hidden");
    }
  }

  closeAddSectionModal() {
    state.closeDrawer();
    const canvaDock = document.getElementById("canva-floating-dock");
    if (canvaDock) canvaDock.style.display = "";
    document.body.classList.remove("modal-open");
  }

  closeModals() {
    state.closeDrawer();
    const canvaDock = document.getElementById("canva-floating-dock");
    if (canvaDock) canvaDock.style.display = "";
    document.body.classList.remove("modal-open");
    const lightbox = document.getElementById("lightbox-modal");
    if (lightbox) lightbox.classList.remove("open");
  }

  filterCatalogItems(query) {
    const q = (query || "").trim().toLowerCase();
    const cards = document.querySelectorAll("#modal-container .catalog-card");
    cards.forEach(card => {
      if (!q) {
        card.style.display = "";
        return;
      }
      const text = (card.textContent || "").toLowerCase();
      const match = text.includes(q);
      card.style.display = match ? "" : "none";
    });
  }

  filterCatalogCategory(category, btnEl) {
    if (btnEl) {
      document.querySelectorAll(".catalog-filter-btn").forEach(b => {
        b.classList.remove("is-active", "bg-zinc-900", "text-white");
        b.classList.add("bg-zinc-100", "text-zinc-700");
      });
      btnEl.classList.add("is-active", "bg-zinc-900", "text-white");
      btnEl.classList.remove("bg-zinc-100", "text-zinc-700");
    }

    const cards = document.querySelectorAll("#modal-container .catalog-card");
    cards.forEach(card => {
      if (!category || category === "all") {
        card.style.display = "";
      } else {
        const cat = (card.getAttribute("data-category") || "").toLowerCase();
        let match = false;
        if (category === "content") {
          match = ["hero", "about", "services", "faq", "stats", "process", "content", "customblock", "disclosure"].includes(cat);
        } else if (category === "media") {
          match = ["gallery", "beforeafter", "media"].includes(cat);
        } else if (category === "action") {
          match = ["cta", "contact", "reviews", "pricing", "location", "hours", "certifications", "action", "status", "feedback", "input", "navigation"].includes(cat);
        }
        card.style.display = match ? "" : "none";
      }
    });
  }

  setViewport(vp) {
    state.setViewport(vp);
  }

  updateViewportUI() {
    const vp = state.viewport;
    const canvasContainer = document.getElementById("canvas-container");
    const viewportConfig = {
      desktop: {
        className: "w-full max-w-none shadow-none transition-all duration-300 bg-white min-h-full",
        width: "100%",
        maxWidth: "none"
      },
      tablet: {
        className: "w-[768px] mx-auto shadow-sm rounded-2xl overflow-hidden border border-zinc-300 my-8 bg-white transition-all duration-300 min-h-full",
        width: "768px",
        maxWidth: "none"
      },
      mobile: {
        className: "w-[390px] mx-auto shadow-sm rounded-3xl overflow-hidden border-2 border-zinc-400 my-8 bg-white transition-all duration-300 min-h-full",
        width: "min(390px, 100%)",
        maxWidth: "390px"
      }
    };
    const config = viewportConfig[vp] || viewportConfig.desktop;
    if (canvasContainer) {
      canvasContainer.className = config.className;
      canvasContainer.dataset.viewport = vp;
      canvasContainer.style.width = config.width;
      canvasContainer.style.maxWidth = config.maxWidth;
    }
    document.querySelectorAll(".viewport-option").forEach(button => {
      const label = button.getAttribute("aria-label") || "";
      const active = (vp === "desktop" && label.includes("ordinateur")) ||
        (vp === "tablet" && label.includes("tablette")) ||
        (vp === "mobile" && label.includes("mobile"));
      button.classList.toggle("is-active", active);
    });
    document.querySelectorAll(".studio-v3-device-switch [data-viewport]").forEach(button => {
      button.classList.toggle("is-active", button.dataset.viewport === vp);
    });
    requestAnimationFrame(() => {
      this.applyFreeformReparenting();
      this.updateFreeformOverlay();
    });
    clearTimeout(this._freeformViewportSyncTimer);
    this._freeformViewportSyncTimer = setTimeout(() => {
      this.applyFreeformReparenting();
      this.updateFreeformOverlay();
    }, 340);
  }

  setSidebarTab(tab) {
    this.activeSidebarTab = tab;
    state.activeSidebarTab = tab;

    // V3 renders one sidebar surface at a time. Re-render immediately instead of
    // mutating the legacy tab nodes that no longer exist in this layout.
    if (document.querySelector(".studio-v3-editor")) {
      this.render();
      if (state.currentView === "editor") this.initCanvasInteractivity();
      return;
    }
    
    const tabSections = document.getElementById("sidebar-tab-sections");
    const tabSettings = document.getElementById("sidebar-tab-settings");
    const btnSections = document.getElementById("tab-btn-sections");
    const btnSettings = document.getElementById("tab-btn-settings");
    
    if (tab === "settings") {
      tabSections?.classList.add("hidden");
      tabSettings?.classList.remove("hidden");
      btnSections?.classList.remove("is-active");
      btnSettings?.classList.add("is-active");
    } else {
      tabSections?.classList.remove("hidden");
      tabSettings?.classList.add("hidden");
      btnSections?.classList.add("is-active");
      btnSettings?.classList.remove("is-active");
    }
  }

  switchWizardMode(mode) {
    this.wizardMode = mode;
    const fastTab = document.getElementById("tab-mode-fast");
    const advTab = document.getElementById("tab-mode-adv");
    const advFields = document.getElementById("wiz-advanced-fields");
    
    if (mode === "fast") {
      fastTab?.classList.add("is-active");
      advTab?.classList.remove("is-active");
      if (advFields) advFields.style.display = "none";
    } else {
      advTab?.classList.add("is-active");
      fastTab?.classList.remove("is-active");
      if (advFields) advFields.style.display = "block";
    }
  }

  switchCloserTab(tab) {
    this.closerTab = tab;
    const allTabs = ["script", "objections", "audit", "contract", "whatsapp", "email", "roi"];
    allTabs.forEach(t => {
      const btn = document.getElementById(`tab-closer-${t}`);
      const panel = document.getElementById(`closer-panel-${t}`);
      if (btn && panel) {
        if (t === tab) {
          btn.className = "px-3 py-1.5 rounded-lg font-bold text-zinc-900 bg-white shadow-xs border border-zinc-200 whitespace-nowrap";
          panel.classList.remove("hidden");
        } else {
          btn.className = "px-3 py-1.5 rounded-lg font-medium text-zinc-600 hover:text-zinc-900 border border-transparent whitespace-nowrap";
          panel.classList.add("hidden");
        }
      }
    });
    if (tab === "contract") {
      setTimeout(() => this.initSignaturePad(), 50);
    }
  }

  // 1. Signature Pad Logic (MVP Feature 4)
  initSignaturePad() {
    const canvas = document.getElementById("closer-signature-pad");
    if (!canvas || canvas._signaturePadInitialized) return;
    canvas._signaturePadInitialized = true;
    canvas._hasSigned = false;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#18181b";

    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / (rect.width || 1);
      const scaleY = canvas.height / (rect.height || 1);
      const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    const startDraw = (e) => {
      if (e.cancelable) e.preventDefault();
      drawing = true;
      canvas._hasSigned = true;
      if (e.pointerId && typeof canvas.setPointerCapture === "function") {
        try { canvas.setPointerCapture(e.pointerId); } catch {}
      }
      const pos = getPos(e);
      lastX = pos.x;
      lastY = pos.y;
    };

    const draw = (e) => {
      if (!drawing) return;
      if (e.cancelable) e.preventDefault();
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      const midX = (lastX + pos.x) / 2;
      const midY = (lastY + pos.y) / 2;
      ctx.quadraticCurveTo(lastX, lastY, midX, midY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
    };

    const stopDraw = (e) => {
      drawing = false;
      if (e && e.pointerId && typeof canvas.releasePointerCapture === "function") {
        try { canvas.releasePointerCapture(e.pointerId); } catch {}
      }
    };

    if (typeof window !== "undefined" && window.PointerEvent) {
      canvas.addEventListener("pointerdown", startDraw);
      canvas.addEventListener("pointermove", draw);
      canvas.addEventListener("pointerup", stopDraw);
      canvas.addEventListener("pointercancel", stopDraw);
    } else {
      canvas.addEventListener("mousedown", startDraw);
      canvas.addEventListener("mousemove", draw);
      window.addEventListener("mouseup", stopDraw);
      canvas.addEventListener("touchstart", startDraw, { passive: false });
      canvas.addEventListener("touchmove", draw, { passive: false });
      window.addEventListener("touchend", stopDraw);
    }
  }

  clearSignaturePad() {
    const canvas = document.getElementById("closer-signature-pad");
    if (canvas) {
      canvas._hasSigned = false;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  printSignedContract() {
    const project = state.currentProject;
    if (!project) return;
    const canvas = document.getElementById("closer-signature-pad");
    const hasSigned = Boolean(canvas && canvas._hasSigned);
    const sigDataUrl = hasSigned ? canvas.toDataURL("image/png") : "";
    const b = project.business || {};
    const today = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
    const printWin = typeof window !== "undefined" ? window.open("", "_blank") : null;
    if (!printWin) {
      if (typeof window !== "undefined" && window.print) window.print();
      return;
    }
    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Bon de Commande — ${escapeHtml(b.name || "Client")}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #18181b; max-width: 800px; margin: 0 auto; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #18181b; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 22px; font-weight: 800; text-transform: uppercase; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .card { background: #f4f4f5; padding: 18px; border-radius: 8px; font-size: 13px; }
          .inclusions { margin-bottom: 30px; font-size: 13px; }
          .inclusions ul { margin: 10px 0 0 20px; }
          .sig-box { border: 1px dashed #a1a1aa; border-radius: 8px; padding: 15px; text-align: center; height: 140px; }
          .sig-img { max-height: 110px; max-width: 100%; object-fit: contain; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Bon de Commande & Cession de Droits</div>
            <div style="font-size: 12px; color: #71717a;">Réf: BDC-${(b.name || "ART").slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}</div>
          </div>
          <div style="text-align: right; font-size: 13px;">
            <div>Date: ${today}</div>
            <div style="font-weight: 700; color: #047857;">Offre Découverte Validée</div>
          </div>
        </div>
        <div class="grid">
          <div class="card">
            <strong>Bénéficiaire :</strong><br>
            ${escapeHtml(b.name || "Artisan")}<br>
            ${escapeHtml(b.tradeLabel || "Artisan")} — ${escapeHtml(b.city || "")}<br>
            Tél: ${escapeHtml(b.phone || "Non renseigné")}<br>
            Email: ${escapeHtml(b.email || "Non renseigné")}
          </div>
          <div class="card">
            <strong>Prestation Clé-en-Main :</strong><br>
            Site Vitrine Ultra-Rapide Artisite + Hébergement 1 an<br>
            Montant TTC : <strong>${escapeHtml(project.settings?.packPrice || "990 €")}</strong><br>
            Délai de mise en ligne : <strong>48 heures ouvrées</strong>
          </div>
        </div>
        <div class="inclusions">
          <strong>Prestations incluses et garanties contractuelles :</strong>
          <ul>
            <li>Design mobile-first sur mesure optimisé pour smartphones (92% du trafic local)</li>
            <li>Bandeau d'appel rapide 1-clic et devis WhatsApp direct</li>
            <li>Optimisation Google Référencement Local (Schema.org LocalBusiness)</li>
            <li>Garantie 0 panne et certificat SSL HTTPS inclus</li>
          </ul>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 30px; margin-top: 40px;">
          <div style="flex: 1;">
            <div style="font-size: 12px; font-weight: 700; margin-bottom: 5px;">Pour le Prestataire (Michel / Artisite) :</div>
            <div class="sig-box" style="display:flex;align-items:center;justify-content:center;color:#71717a;font-size:12px;">
              « Bon pour accord et livraison sous 48h »
            </div>
          </div>
          <div style="flex: 1;">
            <div style="font-size: 12px; font-weight: 700; margin-bottom: 5px;">Signature & Accord du Client :</div>
            <div class="sig-box" style="display:flex;align-items:center;justify-content:center;">
              ${sigDataUrl ? `<img src="${sigDataUrl}" class="sig-img" alt="Signature client">` : '<span style="color:#71717a;font-size:12px;font-style:italic;">En attente de signature client lors de la remise</span>'}
            </div>
          </div>
        </div>
        <script>
          window.onload = () => { window.print(); };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  }

  // Live AI Audit fetcher (MVP Feature 5)
  async fetchLiveAudit(projectId) {
    const project = projectId ? (state.projects.find(p => p.id === projectId) || state.currentProject) : state.currentProject;
    if (!project) return;
    const b = project.business || {};
    const btn = document.getElementById("btn-fetch-live-audit");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>⏳ Analyse IA en cours...</span>`;
    }

    try {
      const res = await fetch("/api/ai/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: b.name || "Artisan",
          trade: b.tradeLabel || "artisan",
          city: b.city || "France"
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const audit = data.data;
        const gapsEl = document.getElementById("closer-audit-gaps");
        if (gapsEl && Array.isArray(audit.competitorGaps)) {
          gapsEl.innerHTML = `
            <div class="text-ui-xs uppercase font-bold text-emerald-700">Gaps Concurrentiels Détectés (${escapeHtml(audit.city)}) :</div>
            ${audit.competitorGaps.map(g => `<p>• ${escapeHtml(g)}</p>`).join('')}
          `;
        }
        const hookEl = document.getElementById("closer-audit-hook");
        if (hookEl && audit.closerHook) {
          hookEl.innerHTML = `
            <div class="text-xs font-bold text-amber-900">Accroche IA Choc pour Michel :</div>
            <p class="text-xs text-amber-800 italic leading-relaxed font-medium">« ${escapeHtml(audit.closerHook)} »</p>
          `;
        }
        this.showToast("Audit 360° actualisé avec l'IA locale !", "success");
      }
    } catch {
      this.showToast("Mode hors-ligne : benchmark local prêt à l'emploi conservé", "info");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `${getIcon("zap", "w-3.5 h-3.5")}<span>Actualiser IA Locale</span>`;
      }
    }
  }

  // Rotating Social Proof Notifications (MVP Feature 2)
  initSocialProofRotation() {
    if (this._socialProofInterval) {
      clearInterval(this._socialProofInterval);
      this._socialProofInterval = null;
    }
    const toast = document.getElementById("social-proof-toast");
    if (!toast) return;
    const textEl = toast.querySelector("#sp-toast-text");
    const timeEl = toast.querySelector("#sp-toast-time");
    if (!textEl || !timeEl) return;

    const city = toast.getAttribute("data-city") || state.currentProject?.business?.city || "secteur";
    const trade = toast.getAttribute("data-trade") || state.currentProject?.business?.tradeLabel || "artisan";

    const messages = [
      { text: `Demande de devis reçue à ${city}`, time: "Il y a 6 min" },
      { text: `Nouveau créneau réservé (${trade})`, time: "Il y a 14 min" },
      { text: `Rappel téléphonique confirmé à ${city}`, time: "Il y a 28 min" },
      { text: `Intervention d'urgence validée`, time: "Il y a 42 min" }
    ];

    let currentIdx = 0;
    this._socialProofInterval = setInterval(() => {
      const el = document.getElementById("social-proof-toast");
      if (!el) {
        clearInterval(this._socialProofInterval);
        this._socialProofInterval = null;
        return;
      }
      el.classList.add("opacity-0", "translate-y-2");
      setTimeout(() => {
        currentIdx = (currentIdx + 1) % messages.length;
        textEl.textContent = messages[currentIdx].text;
        timeEl.textContent = messages[currentIdx].time;
        el.classList.remove("opacity-0", "translate-y-2");
      }, 400);
    }, 7000);
  }

  // 2. Call Teleprompter Timer (MVP Feature 6)
  toggleCallTimer() {
    if (this._callTimerInterval) {
      clearInterval(this._callTimerInterval);
      this._callTimerInterval = null;
      return;
    }
    if (typeof this._callSeconds !== "number") {
      this._callSeconds = 0;
    }
    const updateDisplay = () => {
      const min = String(Math.floor(this._callSeconds / 60)).padStart(2, "0");
      const sec = String(this._callSeconds % 60).padStart(2, "0");
      const el = document.getElementById("call-timer-display");
      if (el) el.textContent = `${min}:${sec}`;
    };
    this._callTimerInterval = setInterval(() => {
      this._callSeconds++;
      updateDisplay();
    }, 1000);
    updateDisplay();
  }

  updateCallProgress(checkbox) {
    if (!checkbox) return;
    const label = checkbox.closest("label");
    if (label) {
      if (checkbox.checked) {
        label.classList.add("text-emerald-600", "font-bold");
      } else {
        label.classList.remove("text-emerald-600", "font-bold");
      }
    }
  }

  // 3. Virtual Multi-Page Navigation Mode (MVP Feature 7)
  setVirtualPage(pageId) {
    if (!state.currentProject) return;
    state.currentProject._activeVirtualPage = pageId;
    if (state.currentView === "editor" && state.editorMode !== "preview") {
      const PAGE_SECTIONS_MAP = {
        home: "hero",
        services: "services",
        realisations: "realisations",
        devis: "quoteSimulator",
        contact: "location"
      };
      const targetType = PAGE_SECTIONS_MAP[pageId] || "hero";
      const targetSec = state.currentProject.sections.find(s => s.type === targetType) || state.currentProject.sections[0];
      if (targetSec) {
        this.selectSection(targetSec.id, { scroll: true });
        this.showToast(`Navigation : ${pageId.toUpperCase()}`, "info");
      }
      return;
    }
    this.render();
  }

  /** Applique un réglage de mise en page à une section (annulable). */
  setSectionLayoutValue(sectionId, key, value) {
    if (!state.currentProject || !isValidSectionId(sectionId)) return;
    const updated = JSON.parse(JSON.stringify(state.currentProject));
    const section = updated.sections.find(s => s.id === sectionId);
    if (!section) return;
    const next = setSectionLayout(section, { [key]: value });
    updated.sections[updated.sections.indexOf(section)] = next;
    state.updateProject(updated, true, "Mise en page de la section");
  }

  setNavigationMode(mode) {
    if (!state.currentProject) return;
    if (!state.currentProject.branding) state.currentProject.branding = {};
    state.pushHistory("Mode de navigation : " + mode);
    state.currentProject.branding.navigationMode = mode;
    state.currentProject._activeVirtualPage = "home";
    state._openSettingsItem = "navigation";
    state.save();
    this.render();
    this.showToast(`Mode navigation mis à jour : ${mode === "multi-tab" ? "Multi-Pages" : "One-Page"}`, "success");
  }

  // 4. Live Social Proof Toast Toggle (MVP Feature 2)
  toggleSocialProof(enabled) {
    if (!state.currentProject) return;
    if (!state.currentProject.branding) state.currentProject.branding = {};
    state.pushHistory("Preuve sociale " + (enabled ? "activée" : "désactivée"));
    state.currentProject.branding.socialProofEnabled = Boolean(enabled);
    state._openSettingsItem = "socialProof";
    state.save();
    this.render();
    this.showToast(`Preuve sociale en direct ${enabled ? "activée" : "désactivée"}`, "info");
  }

  // 5. White-Label Client PIN Protection (MVP Feature 10)
  setClientDemoPin(pin) {
    if (!state.currentProject) return false;
    const parsed = parseClientDemoPin(pin);
    if (!parsed.valid) {
      this.showToast("Le code doit contenir 4 à 6 chiffres", "error");
      return false;
    }
    if (!state.currentProject.settings) state.currentProject.settings = {};
    state.pushHistory(parsed.pin ? "Code PIN client défini" : "Code PIN client désactivé");
    state.currentProject.settings.clientDemoPin = parsed.pin;
    this._clientUnlocked = false;
    state._openSettingsItem = "pinLock";
    state.save();
    this.showToast(parsed.pin ? "Code PIN client défini" : "Code PIN désactivé", "info");
    return true;
  }

  unlockClientDemo(enteredPin) {
    const project = state.currentProject;
    const requiredPin = project?.settings?.clientDemoPin;
    if (!requiredPin) {
      this.showToast("Aucun code n’est défini pour cette démo", "error");
      return false;
    }
    if (verifyClientDemoPin(enteredPin, requiredPin)) {
      this._clientUnlocked = true;
      this.showToast("Accès démo déverrouillé !", "success");
      this.render();
      return true;
    } else {
      this.showToast("Code PIN incorrect", "error");
      return false;
    }
  }

  // 6. Production Package Downloader (MVP Feature 9)
  exportProductionPackage() {
    if (!state.currentProject) return;
    downloadProductionPackage(state.currentProject);
    this.showToast("Pack complet de production téléchargé (HTML, Sitemap, Robots, Manifest) !", "success");
  }

  setWizardTerminalStep(stepId, status, message = "") {
    const step = document.getElementById(stepId);
    if (!step) return;
    const normalizedStatus = ["idle", "running", "done", "fallback", "error"].includes(status) ? status : "idle";
    step.dataset.status = normalizedStatus;
    if (normalizedStatus === "running") step.setAttribute("aria-current", "step");
    else step.removeAttribute("aria-current");
    const icon = step.querySelector(".step-icon");
    if (icon) icon.textContent = { idle: "○", running: "…", done: "✓", fallback: "!", error: "×" }[normalizedStatus];
    const label = step.querySelector("[data-terminal-step-label]");
    if (label && message) label.textContent = message;
  }

  resetWizardTerminal() {
    const terminal = document.getElementById("wizard-terminal");
    if (terminal) terminal.dataset.status = "running";
    for (let index = 1; index <= 6; index += 1) {
      this.setWizardTerminalStep(`step-${index}`, "idle");
    }
    const status = document.getElementById("term-status");
    if (status) status.textContent = "Préparation de la génération…";
  }

  // Wizard Generation Submission with Animated Terminal & AI Call
  async handleWizardSubmit(e) {
    e.preventDefault();
    const request = this.beginAIRequest("wizard");
    const name = document.getElementById("wiz-name")?.value || "Artisan";
    const tradeId = document.getElementById("wiz-trade")?.value || "paysagiste";
    const city = document.getElementById("wiz-city")?.value || "Montauban";
    const phone = document.getElementById("wiz-phone")?.value || "07 82 14 39 50";
    const region = document.getElementById("wiz-region")?.value || "Occitanie";
    const templateId = document.querySelector('input[name="wiz-template"]:checked')?.value || getDefaultTemplateIdForTrade(tradeId);
    const presetId = document.getElementById("wiz-preset")?.value || getSiteTemplate(templateId).presetId;
    const ambiance = document.getElementById("wiz-ambiance")?.value || "mineral";
    const tone = document.getElementById("wiz-tone")?.value || "artisan";
    const customColor = document.getElementById("wiz-color")?.value?.trim() || document.getElementById("wiz-color-picker")?.value || null;
    const email = document.getElementById("wiz-email")?.value || null;

    // Show AI Generation Terminal Overlay
    const terminal = document.getElementById("wizard-terminal");
    const nameDisplay = document.getElementById("term-name");
    if (nameDisplay) nameDisplay.textContent = `${name} (${city})`;
    if (terminal) terminal.style.display = "flex";

    this.resetWizardTerminal();
    this.setWizardTerminalStep("step-1", "running");
    this.setWizardTerminalStep("step-1", "done");
    this.setWizardTerminalStep("step-2", "running");

    // The request lifecycle owns the progress state. Timers never mark network
    // work as complete before the response has actually settled.
    const aiPromise = fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, trade: tradeId, city, phone, region, tone, ambiance })
    }).then(async response => ({
      response,
      payload: await response.json().catch(() => null)
    })).catch(error => ({ error }));

    this.setWizardTerminalStep("step-2", "done");
    this.setWizardTerminalStep("step-3", "running");
    const terminalStatus = document.getElementById("term-status");
    if (terminalStatus) terminalStatus.textContent = "Génération des contenus personnalisés en cours…";
    const aiResult = await aiPromise;
    if (!request.current()) { request.dispose(); return; }

    const aiRes = aiResult?.response?.ok && aiResult?.payload?.success ? aiResult.payload : null;
    if (aiRes) {
      this.setWizardTerminalStep("step-3", "done");
      if (terminalStatus) terminalStatus.textContent = "Contenus reçus, assemblage du site…";
    } else {
      const rateLimited = aiResult?.response?.status === 429;
      this.setWizardTerminalStep(
        "step-3",
        "fallback",
        rateLimited ? "Service IA temporairement limité — création locale" : "Service IA indisponible — création locale"
      );
      if (terminalStatus) {
        terminalStatus.textContent = rateLimited
          ? "Quota temporairement atteint. Le modèle local prend le relais."
          : "Connexion IA indisponible. Le modèle local prend le relais.";
      }
    }

    this.setWizardTerminalStep("step-4", "running");
    {
      if (!request.current()) { request.dispose(); return; }
      const validColor = customColor && /^#[0-9a-f]{6}$/i.test(customColor) ? customColor : undefined;
      const newProject = instantiateSiteTemplate(templateId, {
        name,
        tradeId,
        city,
        phone,
        region,
        presetId,
        email,
        primaryColor: validColor
      });
      this.setWizardTerminalStep("step-4", "done");
      this.setWizardTerminalStep("step-5", "running");

      if (ambiance === "white") {
        newProject.branding.bgColor = "#ffffff";
        newProject.branding.bgSecondary = "#fafafa";
        newProject.branding.textColor = "#18181b";
        newProject.branding.textMuted = "#71717a";
        newProject.branding.globalTheme = "white";
        newProject.siteTheme = "light";
      } else if (ambiance === "dark") {
        newProject.branding.bgColor = "#09090b";
        newProject.branding.bgSecondary = "#18181b";
        newProject.branding.textColor = "#f4f4f5";
        newProject.branding.textMuted = "#a1a1aa";
        newProject.branding.globalTheme = "dark";
        newProject.siteTheme = "dark";
      } else {
        newProject.branding.bgColor = "#f4f4f5";
        newProject.branding.bgSecondary = "#ffffff";
        newProject.branding.textColor = "#18181b";
        newProject.branding.textMuted = "#71717a";
        newProject.branding.globalTheme = "mineral";
        newProject.siteTheme = "light";
      }
      if (tone) {
        newProject.tone = tone;
      }

      // Enrich with Gemini AI output if successful
      if (aiRes && aiRes.success && aiRes.data) {
        const d = aiRes.data;
        const hero = newProject.sections.find(s => s.type === "hero");
        if (hero && hero.content) {
          if (d.heroTitle) hero.content.title = d.heroTitle;
          if (d.heroSubtitle) hero.content.subtitle = d.heroSubtitle;
          if (d.ctaPrimary) hero.content.ctaPrimary = d.ctaPrimary;
          if (d.ctaSecondary) hero.content.ctaSecondary = d.ctaSecondary;
        }

        const about = newProject.sections.find(s => s.type === "about");
        if (about && about.content) {
          if (d.aboutTitle) about.content.title = d.aboutTitle;
          if (d.aboutStory) about.content.story = d.aboutStory;
          if (d.aboutOwner) about.content.owner = d.aboutOwner;
          if (d.aboutRole) about.content.role = d.aboutRole;
        }

        const services = newProject.sections.find(s => s.type === "services");
        if (services && services.content && Array.isArray(d.services) && d.services.length > 0) {
          services.content.services = d.services.map((srv, idx) => ({
            id: `srv-ai-${idx}`,
            title: srv.title,
            desc: srv.desc,
            tag: srv.tag || "Spécialité",
            price: srv.price || "Sur devis gratuit",
            image: services.content.services?.[idx]?.image || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"
          }));
        }

        const trust = newProject.sections.find(s => s.type === "trust");
        if (trust && trust.content && Array.isArray(d.trustBadges)) {
          trust.content.badges = d.trustBadges;
        }

        const reviews = newProject.sections.find(s => s.type === "reviews");
        if (reviews && reviews.content && Array.isArray(d.reviews)) {
          reviews.content.reviews = d.reviews;
        }

        const faq = newProject.sections.find(s => s.type === "faq");
        if (faq && faq.content && Array.isArray(d.faq)) {
          faq.content.items = d.faq;
        }

        if (d.closerTips) {
          newProject.closerTips = d.closerTips;
        }

        newProject.aiGenerated = true;
        newProject.aiModel = aiRes.modelUsed || "gemini-flash";
      }

      this.setWizardTerminalStep("step-5", "done");
      this.setWizardTerminalStep("step-6", "running");
      this.setWizardTerminalStep("step-6", "done");
      if (terminal) terminal.dataset.status = aiRes ? "done" : "fallback";
      if (terminalStatus) terminalStatus.textContent = aiRes
        ? "Site prêt — ouverture de l’éditeur."
        : "Site prêt avec le modèle local — ouverture de l’éditeur.";

      setTimeout(() => {
        if (!request.current()) { request.dispose(); return; }
        request.dispose();
        state.closeDrawer();
        state.addProject(newProject, true);
      }, 350);
    }
  }

  handleQuickGenerate(e) {
    e?.preventDefault?.();
    const name = document.getElementById("quick-gen-name")?.value?.trim() || "Nouvel Artisan";
    const tradeId = document.getElementById("quick-gen-trade")?.value || "paysagiste";
    const city = document.getElementById("quick-gen-city")?.value?.trim() || "Lyon";

    const submitBtn = e?.target?.querySelector?.("button[type='submit']") || document.querySelector("#quick-gen-form button[type='submit']");
    const originalText = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.innerHTML = `<span>⏳ Création...</span>`;
      submitBtn.disabled = true;
    }

    this.showToast(`Génération du site pour ${name}...`, "info");

    const templateId = getDefaultTemplateIdForTrade(tradeId);
    const newProject = instantiateSiteTemplate(templateId, {
      name,
      tradeId,
      city,
      phone: "07 82 14 39 50"
    });

    state.addProject(newProject, true);
    this.showToast(`Site prêt pour ${name} !`, "success");

    if (submitBtn) {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  fillQuickGen(name, tradeId, city) {
    const nameInput = document.getElementById("quick-gen-name");
    const tradeSelect = document.getElementById("quick-gen-trade");
    const cityInput = document.getElementById("quick-gen-city");
    if (nameInput) nameInput.value = name;
    if (tradeSelect) tradeSelect.value = tradeId;
    if (cityInput) cityInput.value = city;
    this.handleQuickGenerate();
  }

  // Actions on Sections
  selectSection(sectionId, options = {}) {
    const alreadySelected = state.selectedSectionId === sectionId;
    state.setSelectedSection(sectionId);
    if (alreadySelected) this.updateSelectedSectionUI();
    if (options.scroll) {
      this.scrollToSection(sectionId);
    }
  }

  updateSelectedSectionUI() {
    const sectionId = state.selectedSectionId;
    if (!state.currentProject) return;

    // 1. Highlight in canvas with the sleek 1.5px solid #18181b border from app.css
    document.querySelectorAll(".editor-section-wrapper").forEach(wrap => {
      if (wrap.getAttribute("data-section-id") === sectionId) {
        wrap.classList.add("is-active-section");
      } else {
        wrap.classList.remove("is-active-section");
      }
    });

    // 2. Synchronize sidebar tabs: if we're on settings, switch back to sections
    const tabSections = document.getElementById("sidebar-tab-sections");
    const tabSettings = document.getElementById("sidebar-tab-settings");
    const btnSections = document.getElementById("tab-btn-sections");
    const btnSettings = document.getElementById("tab-btn-settings");
    if (tabSettings && !tabSettings.classList.contains("hidden")) {
      tabSections?.classList.remove("hidden");
      tabSettings?.classList.add("hidden");
      btnSections?.classList.add("is-active");
      btnSettings?.classList.remove("is-active");
      this.activeSidebarTab = "sections";
      state.activeSidebarTab = "sections";
    }

    // 3. Highlight legacy cards and the current V3 structure rows from the same selectedSectionId.
    document.querySelectorAll(".section-card").forEach(card => {
      const cardSecId = card.getAttribute("data-sec-id");
      const acc = document.getElementById(`accordion-${cardSecId}`);
      const chevron = card.querySelector(".accordion-chevron");

      if (cardSecId === sectionId) {
        card.classList.add("is-selected");
        if (acc) acc.classList.remove("hidden");
        if (chevron) chevron.classList.add("rotate-180");
        this.scrollSidebarCardIntoView(card);
      } else {
        card.classList.remove("is-selected");
        if (acc) acc.classList.add("hidden");
        if (chevron) chevron.classList.remove("rotate-180");
      }
    });
    document.querySelectorAll(".studio-v3-sectionrow").forEach(row => {
      row.classList.toggle("is-selected", row.getAttribute("data-sec-id") === sectionId);
    });

    // Le fil de contexte est la source unique du libellé Site > Section > Élément.
    this.updateStageContext();

    // 4. Update inspector content without destroying its responsive shell/header.
    const rightInspector = document.getElementById("right-inspector-panel");
    if (rightInspector) {
      const inspectorShell = rightInspector.querySelector(".studio-v3-inspector-shell") || rightInspector;
      inspectorShell.innerHTML = renderInspector(selectedSec, state.currentProject, state);
      if (typeof window !== "undefined" && window.matchMedia?.("(max-width: 1280px)").matches) {
        document.querySelector(".studio-v3-structure-panel")?.classList.remove("is-mobile-open");
        rightInspector.classList.add("is-responsive-open");
      }
    }
  }

  scrollSidebarCardIntoView(card) {
    const sidebar = document.getElementById("sidebar-tab-sections");
    if (!sidebar || !card) return;

    const cardRect = card.getBoundingClientRect();
    const sidebarRect = sidebar.getBoundingClientRect();
    const isOutside = cardRect.top < sidebarRect.top || cardRect.bottom > sidebarRect.bottom;

    if (isOutside && typeof sidebar.scrollTo === "function") {
      sidebar.scrollTo({
        top: Math.max(
          0,
          sidebar.scrollTop +
            cardRect.top -
            sidebarRect.top -
            sidebar.clientHeight / 2 +
            card.offsetHeight / 2
        ),
        behavior: "smooth"
      });
    }
  }

  scrollToSection(sectionId) {
    const canvas = document.getElementById("canvas-container");
    const canvasSec = canvas?.querySelector(`[data-section-id="${sectionId}"]`) ||
      document.getElementById(`section-${sectionId}`) ||
      document.querySelector(`.editor-section-wrapper[data-section-id="${sectionId}"]`) ||
      document.getElementById(sectionId);

    if (!canvasSec) return false;

    const scrollHost = document.getElementById("editor-main-canvas") || canvas?.closest("main") || canvas?.parentElement || document.querySelector("main");
    if (scrollHost && typeof scrollHost.scrollTo === "function") {
      const hostRect = scrollHost.getBoundingClientRect();
      const targetRect = canvasSec.getBoundingClientRect();
      const targetTop = scrollHost.scrollTop + (targetRect.top - hostRect.top) -
        Math.max(20, (scrollHost.clientHeight - canvasSec.offsetHeight) / 2);

      scrollHost.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth"
      });
    } else {
      canvasSec.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    canvasSec.classList.remove("section-focus-glow");
    void canvasSec.offsetWidth;
    canvasSec.classList.add("section-focus-glow");
    setTimeout(() => canvasSec.classList.remove("section-focus-glow"), 1600);
    return true;
  }

  handleSectionNavigation(sectionId, event) {
    if (this._justDragged) return;
    event?.preventDefault?.();

    const accordion = document.getElementById(`accordion-${sectionId}`);
    const card = document.querySelector(`.section-card[data-sec-id="${sectionId}"]`);
    if (accordion && card) {
      this.toggleSectionAccordion(sectionId, event, { skipScroll: true });
    }

    this.selectSection(sectionId);
    const run = () => this.scrollToSection(sectionId);
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => {
        run();
        setTimeout(run, 120);
      });
    } else {
      setTimeout(run, 50);
    }
  }

  toggleSectionAccordion(sectionId, event, options = {}) {
    const card = document.querySelector(`.section-card[data-sec-id="${sectionId}"]`);
    const accordion = document.getElementById(`accordion-${sectionId}`);
    const chevron = card?.querySelector(".accordion-chevron");
    
    if (!accordion || !card) {
      if (!options.skipScroll) this.scrollToSection(sectionId);
      return;
    }
    
    const isClosed = accordion.classList.contains("hidden");
    
    if (isClosed) {
      // Close other accordions for focused clarity
      document.querySelectorAll(".section-accordion-body").forEach(body => {
        if (body.id !== `accordion-${sectionId}`) {
          body.classList.add("hidden");
        }
      });
      document.querySelectorAll(".section-card").forEach(c => {
        if (c.getAttribute("data-sec-id") !== sectionId) {
          c.classList.remove("is-selected");
          c.querySelector(".accordion-chevron")?.classList.remove("rotate-180");
        }
      });

      // Open this accordion
      accordion.classList.remove("hidden");
      card.classList.add("is-selected");
      chevron?.classList.add("rotate-180");
      this.selectSection(sectionId);
      if (!options.skipScroll) {
        const run = () => this.scrollToSection(sectionId);
        if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
          window.requestAnimationFrame(run);
        } else {
          setTimeout(run, 0);
        }
      }
    } else {
      accordion.classList.add("hidden");
      card.classList.remove("is-selected");
      chevron?.classList.remove("rotate-180");
    }
  }

  liveUpdateField(sectionId, path, value) {
    if (!state.currentProject) return;
    const sec = state.currentProject.sections.find(s => s.id === sectionId);
    if (!sec || !sec.content) return;

    // 1. Capture the pre-edit value before the live preview mutates it.
    this.beginFieldEdit(sectionId, path);
    // 2. Update in-memory state data directly using setDeepValue
    setDeepValue(sec.content, path, value);

    // 2. Direct canvas DOM update: find the matching element with data-editable="path"
    const canvasSec = document.getElementById(`section-${sectionId}`) || document.querySelector(`.editor-section-wrapper[data-section-id="${sectionId}"]`);
    if (canvasSec) {
      const targetEl = canvasSec.querySelector(`[data-editable="${path}"]`);
      if (targetEl && targetEl !== document.activeElement) {
        targetEl.textContent = value;
      }
    }

    // 3. Synchronize any twin input in the sidebar accordion
    const accordionInput = document.querySelector(`#accordion-${sectionId} [data-field="${path}"]`);
    if (accordionInput && document.activeElement !== accordionInput) {
      accordionInput.value = value;
    }

    // 4. Update save status indicator
    const saveStatus = document.getElementById("save-status-text");
    if (saveStatus) {
      saveStatus.textContent = "Modification en cours...";
      saveStatus.className = "text-ui-sm font-medium text-amber-600";
    }
  }

  // A live-preview field edit mutates state on every keystroke, so the undo
  // snapshot must come from the value that existed before the edit began.
  beginFieldEdit(sectionId, path, value) {
    const key = `${sectionId}::${path}`;
    if (this._fieldEditSnapshot?.key === key) return this._fieldEditSnapshot;
    const sec = state.currentProject?.sections.find(s => s.id === sectionId);
    const original = value !== undefined ? value : (sec ? getDeepValue(sec.content, path) : undefined);
    this._fieldEditSnapshot = { key, sectionId, path, value: original };
    return this._fieldEditSnapshot;
  }

  commitInlineFieldUpdate(sectionId, path, initialValue, value) {
    if (!state.currentProject || value === initialValue) return false;
    const sec = state.currentProject.sections.find(s => s.id === sectionId);
    if (!sec?.content) return false;
    this.beginFieldEdit(sectionId, path, initialValue);
    this.commitFieldUpdate(sectionId, path, value);
    return true;
  }

  commitFieldUpdate(sectionId, path, value) {
    if (!state.currentProject) return;
    const sec = state.currentProject.sections.find(s => s.id === sectionId);
    if (!sec || !sec.content) return;

    const edit = this._fieldEditSnapshot;
    const sameEdit = edit?.key === `${sectionId}::${path}`;
    // Rebuild the pre-edit value so pushHistory stores it in Undo and Redo can
    // return to the committed value. Without this, Undo is a silent no-op.
    if (sameEdit) setDeepValue(sec.content, path, edit.value);
    state.pushHistory(`Modification ${path}`);
    setDeepValue(sec.content, path, value);
    if (sameEdit) this._fieldEditSnapshot = null;
    state.saveToStorage();
    this.updateUndoRedoUI();

    const saveStatus = document.getElementById("save-status-text");
    if (saveStatus) {
      saveStatus.textContent = "✓ Enregistré";
      saveStatus.className = "text-ui-sm font-medium text-zinc-500";
    }
  }

  liveUpdateText(sectionId, field, value) {
    this.liveUpdateField(sectionId, field, value);
  }

  commitTextUpdate(sectionId, field, value) {
    this.commitFieldUpdate(sectionId, field, value);
  }

  toggleSettingsItem(itemId) {
    const body = document.getElementById(`settings-body-${itemId}`);
    if (!body) return;
    const isHidden = body.classList.contains("hidden");
    const parentCard = body.closest(".section-card");
    const chevron = parentCard?.querySelector(".section-card-header .text-zinc-400");

    if (isHidden) {
      body.classList.remove("hidden");
      chevron?.classList.add("rotate-180");
      state._openSettingsItem = itemId;
    } else {
      body.classList.add("hidden");
      chevron?.classList.remove("rotate-180");
      if (state._openSettingsItem === itemId) {
        state._openSettingsItem = null;
      }
    }
  }

  toggleSectionBgMenu(secId) {
    const pop = document.getElementById(`sec-bg-popover-${secId}`);
    if (!pop) return;
    const isClosed = pop.classList.contains("hidden");
    document.querySelectorAll(".sec-bg-popover:not(.hidden)").forEach(p => p.classList.add("hidden"));
    if (isClosed) pop.classList.remove("hidden");
  }

  cycleSectionBg(sectionId) {
    if (!state.currentProject) return;
    const sec = state.currentProject.sections.find(s => s.id === sectionId);
    if (!sec) return;
    if (!sec.settings) sec.settings = {};
    const themes = ["white", "mineral", "dark", "warm", "navy"];
    const current = sec.settings.bgTheme || "white";
    const nextIdx = (themes.indexOf(current) + 1) % themes.length;
    this.setSectionBg(sectionId, themes[nextIdx]);
  }

  setSectionBg(sectionId, theme) {
    if (!state.currentProject) return;
    if (!["white", "mineral", "dark", "warm", "navy"].includes(theme)) return;
    const mainEl = document.querySelector("main");
    const savedScrollTop = mainEl ? mainEl.scrollTop : 0;

    const updated = JSON.parse(JSON.stringify(state.currentProject));
    const sec = updated.sections.find(s => s.id === sectionId);
    if (!sec) return;
    sec.settings = { ...(sec.settings || {}), bgTheme: theme, customBackground: "" };
    state.updateProject(updated, true, `Changement fond (${theme})`);

    const pop = document.getElementById(`sec-bg-popover-${sectionId}`);
    if (pop) pop.classList.add("hidden");

    if (mainEl && savedScrollTop > 0) {
      requestAnimationFrame(() => {
        const m = document.querySelector("main");
        if (m) m.scrollTop = savedScrollTop;
      });
    }
  }

  setSectionCustomBg(sectionId, hexColor) {
    if (!state.currentProject) return;
    const mainEl = document.querySelector("main");
    const savedScrollTop = mainEl ? mainEl.scrollTop : 0;

    const updated = JSON.parse(JSON.stringify(state.currentProject));
    const sec = updated.sections.find(s => s.id === sectionId);
    if (!sec) return;
    sec.settings = { ...(sec.settings || {}), customBackground: hexColor || "" };
    if (!hexColor) {
      if (sec.settings.bgTheme === "custom") sec.settings.bgTheme = "white";
    } else {
      sec.settings.bgTheme = "custom";
    }
    state.updateProject(updated, true, hexColor ? `Fond personnalisé : ${hexColor}` : "Réinitialisation fond");

    if (mainEl && savedScrollTop > 0) {
      requestAnimationFrame(() => {
        const m = document.querySelector("main");
        if (m) m.scrollTop = savedScrollTop;
      });
    }
  }

  applyInspirationPattern(sectionId, patternId) {
    const motionKeyMap = {
      reveal: "reveal",
      stagger: "stagger",
      spring: "spring",
      progress: "progress-fill",
      bento: "slide-up",
      spotlight: "pulse",
      glass: "fade-in",
      brutalist: "spring"
    };
    const preset = motionKeyMap[patternId] || patternId;
    this.setSectionMotion(sectionId, preset);

    // Instant visual replay on the canvas element for immediate tactile feedback
    const el = document.getElementById(`section-${sectionId}`) || document.getElementById(sectionId);
    if (el) {
      el.classList.remove("is-revealed");
      el.setAttribute("data-motion", preset);
      void el.offsetHeight; // trigger reflow
      el.classList.add("is-revealed");
    }
    const labelMap = {
      reveal: "Reveal au scroll",
      stagger: "Stagger éditorial",
      spring: "Spring physique",
      progress: "Progression"
    };
    this.showToast(`Pattern appliqué : ${labelMap[patternId] || preset}`);
  }


  setComponentMotion(sectionId, targetId, preset) {
    if (!state.currentProject) return;
    const allowed = new Set(["none", "fade-in", "slide-up", "slide-in", "spring", "stagger", "shimmer", "pulse"]);
    if (!allowed.has(preset)) return;
    const updated = JSON.parse(JSON.stringify(state.currentProject));
    const sec = updated.sections.find(s => s.id === sectionId);
    if (!sec) return;
    sec.settings = { ...(sec.settings || {}), [`${targetId}-motion`]: preset === "none" ? "" : preset };
    state.updateProject(updated, true, `Animation du composant : ${preset}`);
  }

  setCTASize(size) {
    if (!state.currentProject) return;
    state.currentProject.branding.ctaSize = size;

    const ctaPaddingMap = {
      sm: '0.5rem 1rem',
      md: '0.75rem 1.5rem',
      lg: '1rem 2rem',
      xl: '1.25rem 2.5rem'
    };
    const ctaFontMap = {
      sm: '0.875rem',
      md: '0.95rem',
      lg: '1.125rem',
      xl: '1.25rem'
    };

    const root = document.querySelector(".artisite-root");
    if (root) {
      root.style.setProperty("--cta-padding", ctaPaddingMap[size] || "0.75rem 1.5rem");
      root.style.setProperty("--cta-font-size", ctaFontMap[size] || "0.95rem");
    }

    // Update buttons in settings tab
    const tabSettings = document.getElementById("sidebar-tab-settings");
    if (tabSettings) {
      const sizeBtns = tabSettings.querySelectorAll(".grid-cols-4 button");
      const sizes = ['sm', 'md', 'lg', 'xl'];
      sizeBtns.forEach((btn, idx) => {
        const isAct = sizes[idx] === size;
        btn.className = `py-1 border rounded text-center text-ui-sm font-medium ${isAct ? 'border-zinc-900 bg-white font-semibold shadow-xs text-zinc-950' : 'border-zinc-200 bg-white text-zinc-600'}`;
      });
    }

    state.pushHistory(`Taille CTA : ${size}`);
    state.saveToStorage();
    this.updateUndoRedoUI();
  }

  showToast(message, type = "info", action = null) {
    let container = document.getElementById("artisite-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "artisite-toast-container";
      container.className = "artisite-toast-container";
      document.body.appendChild(container);
    }

    // Limit active toasts to 2 to prevent stacking towers
    const existing = container.querySelectorAll(".artisite-toast");
    if (existing.length >= 2) {
      existing[0].remove();
    }

    // If identical message exists, refresh it rather than stacking duplicate toasts
    const duplicate = Array.from(existing).find(t => t.querySelector("span")?.textContent === message);
    if (duplicate) {
      duplicate.classList.remove("animate-pulse");
      void duplicate.offsetWidth;
      duplicate.classList.add("animate-pulse");
      return;
    }

    const toast = document.createElement("div");
    toast.className = "artisite-toast";
    toast.innerHTML = `
      <span>${message}</span>
      ${action ? `<button type="button" class="artisite-toast-btn">${action.label || 'Action'}</button>` : ''}
    `;

    if (action && action.onClick) {
      const btn = toast.querySelector(".artisite-toast-btn");
      if (btn) {
        btn.onclick = () => {
          action.onClick();
          toast.remove();
        };
      }
    }

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = "opacity 0.25s ease, transform 0.25s ease";
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px) scale(0.96)";
      setTimeout(() => toast.remove(), 260);
    }, 2800);
  }

  setButtonScale(scalePercent, isLive = false) {
    state.setButtonScale(scalePercent, isLive);
    const factor = (Number(scalePercent) / 100).toString();
    const root = document.querySelector(".artisite-root");
    if (root) {
      root.style.setProperty("--cta-scale", factor);
    }
    const canvas = document.getElementById("canvas-container") || document.getElementById("site-canvas");
    if (canvas) {
      canvas.style.setProperty("--cta-scale", factor);
    }
    document.documentElement.style.setProperty("--cta-scale", factor);
    const displays = document.querySelectorAll("#cta-scale-display, [data-cta-scale-display]");
    displays.forEach(el => { el.textContent = `${scalePercent}%`; });
    if (!isLive) {
      this.updateUndoRedoUI();
    }
  }

  setButtonMotion(sectionId, buttonType, motionPreset) {
    state.setButtonMotion(sectionId, buttonType, motionPreset);
    this.showToast(`Animation appliquée : ${motionPreset === 'none' ? 'Aucune' : motionPreset}`, "info");
    this.updateUndoRedoUI();
  }

  setButtonRadius(radius) {
    state.setButtonRadius(radius);
    const root = document.querySelector(".artisite-root");
    if (root) {
      root.style.setProperty("--cta-radius", radius);
      root.style.setProperty("--btn-radius", radius);
    }
    this.updateUndoRedoUI();
  }

  toggleButtonCase() {
    state.toggleButtonCase();
    const root = document.querySelector(".artisite-root");
    if (root) {
      root.style.setProperty("--cta-transform", state.currentProject?.branding?.ctaTransform || "none");
    }
    this.updateUndoRedoUI();
  }

  adjustButtonFontSize(delta) {
    state.adjustButtonFontSize(delta);
    const root = document.querySelector(".artisite-root");
    if (root) {
      root.style.setProperty("--cta-font-size", state.currentProject?.branding?.ctaFontSize || "0.95rem");
    }
    this.updateUndoRedoUI();
  }

  deleteButton(sectionId, buttonType) {
    state.deleteButton(sectionId, buttonType);
    this.showToast(`Bouton masqué`, "info", {
      label: "Annuler (⌘Z)",
      onClick: () => this.undo()
    });
    this.updateUndoRedoUI();
  }

  restoreButton(sectionId, buttonType) {
    state.restoreButton(sectionId, buttonType);
    this.showToast(`Bouton restauré`, "info");
    this.updateUndoRedoUI();
  }

  restoreAllButtons(sectionId = null) {
    state.restoreAllButtons(sectionId);
    this.showToast(`Tous les boutons ont été restaurés`, "info");
    this.updateUndoRedoUI();
  }

  toggleButtonPopover(sectionId, buttonType) {
    this.hideFloatingTextToolbar();
    const popover = document.getElementById(`cta-popover-${sectionId}-${buttonType}`);
    const wrapper = popover?.closest("[data-cta-popover-wrapper]");
    if (wrapper) {
      const willOpen = !wrapper.classList.contains("is-active");
      this.closeAllButtonPopovers();
      if (willOpen) {
        wrapper.classList.add("is-active");
        wrapper.setAttribute("aria-expanded", "true");
      }
    }
  }

  closeAllButtonPopovers() {
    document.querySelectorAll("[data-cta-popover-wrapper].is-active").forEach(w => {
      w.classList.remove("is-active");
      w.setAttribute("aria-expanded", "false");
    });
  }

  adjustFieldFontSize(sectionId, field, delta) {
    if (!state.currentProject) return;
    const sec = state.currentProject.sections.find(s => s.id === sectionId);
    if (!sec) return;
    sec.settings = sec.settings || {};
    const key = `fontSize_${field}`;
    const current = parseFloat(sec.settings[key]) || 0;
    const next = Math.max(-10, Math.min(24, current + delta));
    state.pushHistoryCoalesced("Taille de texte " + field);
    sec.settings[key] = next;

    // Apply live to DOM element
    const el = document.querySelector(`#section-${sectionId} [data-editable="${field}"]`);
    if (el) {
      el.style.fontSize = next === 0 ? "" : `calc(1em + ${next}px)`;
    }

    state.saveToStorage();
    this.updateUndoRedoUI();
    this.showToast(`Taille du texte : ${next >= 0 ? '+' : ''}${next}px`, "info");
  }

  adjustFieldFontSizeSlider(sectionId, field, deltaVal) {
    if (!state.currentProject) return;
    const delta = parseFloat(deltaVal) || 0;
    const sec = state.currentProject.sections.find(s => s.id === sectionId);
    if (!sec) return;
    sec.settings = sec.settings || {};
    state.pushHistoryCoalesced("Taille de texte " + field);
    sec.settings[`fontSize_${field}`] = delta;

    const el = document.querySelector(`#section-${sectionId} [data-editable="${field}"]`);
    if (el) {
      el.style.fontSize = delta === 0 ? "" : `calc(1em + ${delta}px)`;
    }
    state.saveToStorage();
  }

  setHeroOverlayDarkening(sectionId, val) {
    if (!state.currentProject) return;
    const sec = state.currentProject.sections.find(s => s.id === sectionId);
    if (!sec) return;
    sec.settings = sec.settings || {};
    const num = Math.max(0, Math.min(90, parseInt(val, 10) || 0));
    state.pushHistoryCoalesced("Assombrissement du hero");
    sec.settings.overlayDarkening = num;

    const overlay = document.querySelector(`#section-${sectionId} .hero-darkening-overlay`);
    if (overlay) {
      overlay.style.backgroundColor = `rgba(0, 0, 0, ${num / 100})`;
    }
    state.saveToStorage();
  }

  adjustActiveTextFontSize(delta) {
    if (!this._activeEditableEl) return;
    const el = this._activeEditableEl;
    const secWrapper = el.closest(".editor-section-wrapper");
    const secId = secWrapper?.getAttribute("data-section-id");
    const field = el.getAttribute("data-editable");
    if (secId && field) {
      this.adjustFieldFontSize(secId, field, delta);
    } else {
      const currentSize = parseFloat(window.getComputedStyle(el).fontSize) || 16;
      const newSize = Math.max(10, Math.min(64, currentSize + delta * 2));
      el.style.fontSize = `${newSize}px`;
    }
  }

  adjustActiveTextFontSizeSlider(deltaVal) {
    const delta = parseFloat(deltaVal) || 0;
    const valEl = document.getElementById("ftb-font-val");
    if (valEl) valEl.textContent = `${delta >= 0 ? '+' : ''}${delta}`;

    if (!this._activeEditableEl) return;
    const el = this._activeEditableEl;
    const secWrapper = el.closest(".editor-section-wrapper");
    const secId = secWrapper?.getAttribute("data-section-id");
    const field = el.getAttribute("data-editable");

    if (secId && field && state.currentProject) {
      const sec = state.currentProject.sections.find(s => s.id === secId);
      if (sec) {
        sec.settings = sec.settings || {};
        state.pushHistoryCoalesced("Taille de texte " + field);
        sec.settings[`fontSize_${field}`] = delta;
      }
      el.style.fontSize = delta === 0 ? "" : `calc(1em + ${delta}px)`;
      state.saveToStorage();
    } else {
      let baseSize = parseFloat(el.getAttribute("data-base-font-size"));
      if (!baseSize) {
        baseSize = parseFloat(window.getComputedStyle(el).fontSize) || 16;
        el.setAttribute("data-base-font-size", String(baseSize));
      }
      el.style.fontSize = `${baseSize + delta}px`;
    }
  }

  toggleActiveTextBold() {
    if (!this._activeEditableEl) return;
    const el = this._activeEditableEl;
    const secWrapper = el.closest(".editor-section-wrapper");
    const secId = secWrapper?.getAttribute("data-section-id");
    const field = el.getAttribute("data-editable");
    if (secId && field && state.currentProject) {
      const sec = state.currentProject.sections.find(s => s.id === secId);
      if (sec) {
        sec.settings = sec.settings || {};
        const key = `bold_${field}`;
        const isCurrentlyBold = sec.settings[key] === true || window.getComputedStyle(el).fontWeight >= 700;
        state.pushHistory("Style gras " + field);
        sec.settings[key] = !isCurrentlyBold;
        el.style.fontWeight = isCurrentlyBold ? "400" : "800";
        state.saveToStorage();
        this.updateUndoRedoUI();
        this.showToast(isCurrentlyBold ? "Texte normal" : "Texte en gras", "info");
      }
    } else {
      const isBold = window.getComputedStyle(el).fontWeight >= 700;
      el.style.fontWeight = isBold ? "400" : "800";
    }
  }

  toggleActiveTextItalic() {
    if (!this._activeEditableEl) return;
    const el = this._activeEditableEl;
    const secWrapper = el.closest(".editor-section-wrapper");
    const secId = secWrapper?.getAttribute("data-section-id");
    const field = el.getAttribute("data-editable");
    if (secId && field && state.currentProject) {
      const sec = state.currentProject.sections.find(s => s.id === secId);
      if (sec) {
        sec.settings = sec.settings || {};
        const key = `italic_${field}`;
        const isCurrentlyItalic = sec.settings[key] === true || window.getComputedStyle(el).fontStyle === "italic";
        state.pushHistory("Style italique " + field);
        sec.settings[key] = !isCurrentlyItalic;
        el.style.fontStyle = isCurrentlyItalic ? "normal" : "italic";
        state.saveToStorage();
        this.updateUndoRedoUI();
        this.showToast(isCurrentlyItalic ? "Texte normal" : "Texte en italique", "info");
      }
    } else {
      const isItalic = window.getComputedStyle(el).fontStyle === "italic";
      el.style.fontStyle = isItalic ? "normal" : "italic";
    }
  }

  toggleActiveTextUnderline() {
    if (!this._activeEditableEl) return;
    const el = this._activeEditableEl;
    const secWrapper = el.closest(".editor-section-wrapper");
    const secId = secWrapper?.getAttribute("data-section-id");
    const field = el.getAttribute("data-editable");
    if (secId && field && state.currentProject) {
      const sec = state.currentProject.sections.find(s => s.id === secId);
      if (sec) {
        sec.settings = sec.settings || {};
        const key = `underline_${field}`;
        const isCurrentlyUnderline = sec.settings[key] === true || window.getComputedStyle(el).textDecorationLine?.includes("underline");
        state.pushHistory("Style souligné " + field);
        sec.settings[key] = !isCurrentlyUnderline;
        el.style.textDecoration = isCurrentlyUnderline ? "none" : "underline";
        state.saveToStorage();
        this.updateUndoRedoUI();
        this.showToast(isCurrentlyUnderline ? "Texte normal" : "Texte souligné", "info");
      }
    } else {
      const isUnderline = window.getComputedStyle(el).textDecorationLine?.includes("underline");
      el.style.textDecoration = isUnderline ? "none" : "underline";
    }
  }

  showFloatingTextToolbar(el, secId) {
    if (!el || el.closest("[data-cta-popover-wrapper]")) {
      this.hideFloatingTextToolbar();
      return;
    }
    this.closeAllFloatingToolbars("text");
    this._activeEditableEl = el;
    const toolbar = document.getElementById("floating-text-toolbar");
    if (!toolbar) return;

    const rect = el.getBoundingClientRect();
    const mainEl = document.querySelector("main");
    const mainRect = mainEl?.getBoundingClientRect() || { top: 0, left: 0 };
    const scrollTop = mainEl ? mainEl.scrollTop : window.scrollY;

    const topPos = Math.max(8, rect.top - mainRect.top + scrollTop - 40);
    const leftPos = Math.max(16, Math.min(window.innerWidth - 380, rect.left - mainRect.left));

    toolbar.style.top = `${topPos}px`;
    toolbar.style.left = `${leftPos}px`;
    toolbar.style.display = "flex";

    const secWrapper = el.closest(".editor-section-wrapper");
    const sid = secId || secWrapper?.getAttribute("data-section-id");
    const field = el.getAttribute("data-editable");
    const sec = state.currentProject?.sections?.find(s => s.id === sid);

    // Sync font size slider
    const existingDelta = sec?.settings?.[`fontSize_${field}`] || 0;
    const fontSlider = document.getElementById("ftb-font-slider");
    const fontVal = document.getElementById("ftb-font-val");
    if (fontSlider) fontSlider.value = existingDelta;
    if (fontVal) fontVal.textContent = `${existingDelta >= 0 ? '+' : ''}${existingDelta}`;

    // Sync color indicator
    const existingColor = sec?.settings?.[`color_${field}`] || el.style.color || "#ffffff";
    const colorIndicator = document.getElementById("ftb-color-indicator");
    if (colorIndicator) colorIndicator.style.backgroundColor = existingColor;

    // Sync B/I/U button states
    const btnBold = document.getElementById("ftb-bold");
    const btnItalic = document.getElementById("ftb-italic");
    const btnUnderline = document.getElementById("ftb-underline");
    const btnClose = document.getElementById("ftb-close");

    if (btnBold) {
      const isBold = sec?.settings?.[`bold_${field}`] === true || window.getComputedStyle(el).fontWeight >= 700;
      btnBold.classList.toggle("is-active", isBold);
      btnBold.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.toggleActiveTextBold(); };
    }
    if (btnItalic) {
      const isItalic = sec?.settings?.[`italic_${field}`] === true || window.getComputedStyle(el).fontStyle === "italic";
      btnItalic.classList.toggle("is-active", isItalic);
      btnItalic.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.toggleActiveTextItalic(); };
    }
    if (btnUnderline) {
      const isUnderline = sec?.settings?.[`underline_${field}`] === true || window.getComputedStyle(el).textDecorationLine?.includes("underline");
      btnUnderline.classList.toggle("is-active", isUnderline);
      btnUnderline.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.toggleActiveTextUnderline(); };
    }
    if (btnClose) {
      btnClose.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.exitInlineEditing(); };
    }

    // Dismiss open submenus
    document.getElementById("ftb-color-menu")?.classList.add("hidden");
    document.getElementById("ftb-anim-menu")?.classList.add("hidden");
  }

  hideFloatingTextToolbar() {
    const toolbar = document.getElementById("floating-text-toolbar");
    if (toolbar) toolbar.style.display = "none";
    if (document.body?.dataset.activeEditorToolbar === "text") {
      delete document.body.dataset.activeEditorToolbar;
    }
  }

  // Leaving inline editing must be explicit: blur commits the cell and removes
  // the caret, instead of leaving the user stuck with a focused editable.
  exitInlineEditing() {
    // Les réglages suivants repartent toujours du style principal.
    this._activeTextState = "default";
    this.syncActiveTextStateButtons();
    const active = document.activeElement;
    if (active?.isContentEditable && typeof active.blur === "function") {
      active.blur();
    } else if (this._activeEditableEl && typeof this._activeEditableEl.blur === "function") {
      this._activeEditableEl.blur();
    }
    this._activeEditableEl = null;
    this.hideFloatingTextToolbar();
  }

  /** Oublie la sélection d'élément sans toucher au reste de l'éditeur. */
  clearElementSelection() {
    this._freeformSelectedKey = null;
    this._freeformSelectedKeys = [];
    this._freeformAdditiveMode = false;
    this._freeformActiveGroup = null;
    state.selectedElementKey = null;
    this.updateStageContext();
  }

  /** Applique un réglage de style à l'élément sélectionné (annulable). */
  setSelectedElementStyle(property, value) {
    const layoutKey = state.selectedElementKey;
    if (!state.currentProject || !layoutKey) return;
    const next = setElementStyle(state.currentProject, layoutKey, property, value);
    if (next === state.currentProject) return;
    state.updateProject(next, true, "Style de l'élément");
  }

  /** Choisit l'état auquel s'appliquent les réglages d'élément de l'inspecteur. */
  setElementStyleState(stateName) {
    state.elementStyleState = ELEMENT_STATES.includes(stateName) ? stateName : "default";
    this.updateSelectedSectionUI();
  }

  /** Applique un réglage d'élément à l'état choisi (annulable). */
  setSelectedElementStateValue(property, value) {
    const layoutKey = state.selectedElementKey;
    const stateName = state.elementStyleState;
    if (!state.currentProject || !layoutKey || !ELEMENT_STATES.includes(stateName)) return;
    const next = setElementState(state.currentProject, layoutKey, stateName, property, value);
    if (next === state.currentProject) return;
    state.updateProject(next, true, "Réglage de l'état " + ELEMENT_STATE_LABELS[stateName]);
  }

  /** Efface l'état choisi sur l'élément sélectionné. */
  clearSelectedElementState() {
    const layoutKey = state.selectedElementKey;
    const stateName = state.elementStyleState;
    if (!state.currentProject || !layoutKey || !ELEMENT_STATES.includes(stateName)) return;
    const next = clearElementState(state.currentProject, layoutKey, stateName);
    state.updateProject(next, true, "Effacement de l'état " + ELEMENT_STATE_LABELS[stateName]);
  }

  /** Retire tous les réglages de l'élément sélectionné. */
  clearSelectedElementStyle() {
    const layoutKey = state.selectedElementKey;
    if (!state.currentProject || !layoutKey) return;
    const next = clearElementStyle(state.currentProject, layoutKey);
    if (next === state.currentProject) return;
    state.updateProject(next, true, "Retour au style du thème");
  }

  /** Libellé humain de la sélection courante, ou chaîne vide. */
  getFreeformSelectionLabel() {
    const keys = this._freeformSelectedKeys || [];
    if (!keys.length) return "";
    if (keys.length > 1) return keys.length + " éléments";
    const element = document.querySelector('[data-layout-key="' + keys[0] + '"]');
    return (element && element.getAttribute("data-layout-label")) || ("#" + keys[0]);
  }

  /** Fil de contexte : Site > Section > Élément, toujours visible dans l'éditeur. */
  updateStageContext() {
    if (!state.currentProject) return;
    const selectedSec = state.currentProject.sections.find(s => s.id === state.selectedSectionId) || state.currentProject.sections[0];
    const stageTitle = document.querySelector(".studio-v3-stagecontext b");
    if (!stageTitle || !selectedSec) return;
    const sectionLabel = getSectionFriendlyTitle(selectedSec);
    const elementLabel = this.getFreeformSelectionLabel();
    const full = elementLabel ? sectionLabel + " ▸ " + elementLabel : sectionLabel;
    stageTitle.textContent = full;
    // Le fil est tronqué visuellement : l'infobulle porte toujours le texte complet.
    stageTitle.setAttribute("title", full);
  }

  closeAllFloatingToolbars(except = "") {
    const activeKind = ["text", "section", "freeform", "cta"].includes(except) ? except : "";
    if (document.body) {
      if (activeKind) document.body.dataset.activeEditorToolbar = activeKind;
      else delete document.body.dataset.activeEditorToolbar;
    }

    if (activeKind !== "text") {
      const textToolbar = document.getElementById("floating-text-toolbar");
      if (textToolbar) textToolbar.style.display = "none";
    }
    if (activeKind !== "section") {
      document.querySelectorAll(".sec-bg-popover, .sec-motion-popover").forEach(popover => popover.classList.add("hidden"));
    }
    if (activeKind !== "freeform") {
      const freeform = document.getElementById("freeform-selection-box");
      freeform?.classList.remove("is-visible");
      freeform?.setAttribute("aria-hidden", "true");
    }
    if (activeKind !== "cta") {
      document.querySelectorAll("[data-cta-popover-wrapper].is-active").forEach(wrapper => {
        wrapper.classList.remove("is-active");
        wrapper.setAttribute("aria-expanded", "false");
      });
    }
  }

  toggleTextColorMenu() {
    const menu = document.getElementById("ftb-color-menu");
    if (menu) menu.classList.toggle("hidden");
  }

  /** Choisit l'état auquel les réglages suivants s'appliquent (principal par défaut). */
  setActiveTextState(stateName) {
    this._activeTextState = ELEMENT_STATES.includes(stateName) ? stateName : "default";
    this.syncActiveTextStateButtons();
    this.showToast(this._activeTextState === "default"
      ? "Réglages appliqués au style principal"
      : "Réglages appliqués à l'état : " + ELEMENT_STATE_LABELS[this._activeTextState], "info");
  }

  /** Efface toutes les déclarations de l'état en cours : retour au style principal. */
  clearActiveTextState() {
    const stateName = this._activeTextState || "default";
    if (stateName === "default") {
      this.showToast("Choisissez d'abord un état à effacer", "info");
      return;
    }
    const el = this._activeEditableEl;
    const secId = el?.closest(".editor-section-wrapper")?.getAttribute("data-section-id");
    const field = el?.getAttribute("data-editable");
    if (!el || !secId || !field || !state.currentProject) {
      this.showToast("Sélectionnez un texte pour effacer son état", "info");
      return;
    }
    const layoutKey = getUiCode(state.currentProject.id, secId, field);
    state.updateProject(clearElementState(state.currentProject, layoutKey, stateName), true);
    this.showToast(ELEMENT_STATE_LABELS[stateName] + " : retour au style principal", "success");
  }

  syncActiveTextStateButtons() {
    const active = this._activeTextState || "default";
    if (typeof document === "undefined" || typeof document.querySelectorAll !== "function") return;
    document.querySelectorAll("[data-ftb-state]").forEach(button => {
      button.classList.toggle("is-active", button.dataset.ftbState === active);
    });
    // Tant qu'un état est choisi, la barre doit le rappeler : sans cela, l'auteur
    // pourrait modifier un survol en croyant régler le style principal.
    const badge = document.getElementById("ftb-state-badge");
    if (badge) {
      const label = active === "default" ? "" : ELEMENT_STATE_LABELS[active];
      badge.textContent = label;
      badge.classList.toggle("hidden", !label);
    }
  }

  setActiveTextColor(color) {
    if (!this._activeEditableEl) return;
    const el = this._activeEditableEl;
    const secWrapper = el.closest(".editor-section-wrapper");
    const secId = secWrapper?.getAttribute("data-section-id");
    const field = el.getAttribute("data-editable");

    // Hors style principal, la couleur alimente l'état choisi : la règle est produite
    // par la primitive partagée du renderer, donc l'aperçu et l'export la verront aussi.
    const textState = this._activeTextState || "default";
    if (textState !== "default" && secId && field && state.currentProject) {
      const layoutKey = getUiCode(state.currentProject.id, secId, field);
      const nextProject = color
        ? setElementState(state.currentProject, layoutKey, textState, "color", color)
        : clearElementState(state.currentProject, layoutKey, textState);
      state.updateProject(nextProject, true);
      const stateMenu = document.getElementById("ftb-color-menu");
      if (stateMenu) stateMenu.classList.add("hidden");
      this.showToast(ELEMENT_STATE_LABELS[textState] + " : " + (color || "retour au style principal"), "info");
      return;
    }

    if (secId && field && state.currentProject) {
      const updated = JSON.parse(JSON.stringify(state.currentProject));
      const sec = updated.sections.find(s => s.id === secId);
      if (sec) {
        sec.settings = sec.settings || {};
        if (color) {
          sec.settings[`color_${field}`] = color;
        } else {
          delete sec.settings[`color_${field}`];
        }
        state.updateProject(updated, true);
      }
    }
    el.style.color = color || "";
    const indicator = document.getElementById("ftb-color-indicator");
    if (indicator) indicator.style.backgroundColor = color || "#ffffff";
    const menu = document.getElementById("ftb-color-menu");
    if (menu) menu.classList.add("hidden");
    this.showToast(color ? `Couleur appliquée : ${color}` : "Couleur par défaut réinitialisée", "info");
  }

  setAnimationSpeed(speed) {
    if (!state.currentProject) return;
    if (!["fast", "normal", "slow"].includes(speed)) return;
    const updated = JSON.parse(JSON.stringify(state.currentProject));
    updated.branding = updated.branding || {};
    updated.branding.animationSpeed = speed;
    state.updateProject(updated, true, `Vitesse animations : ${speed}`);
    const multiplier = speed === "fast" ? "0.6" : (speed === "slow" ? "1.5" : "1.0");
    document.documentElement.style.setProperty("--anim-duration-multiplier", multiplier);
    const root = document.querySelector(".artisite-root");
    if (root) root.style.setProperty("--anim-duration-multiplier", multiplier);
    this.showToast(`Rythme des animations : ${speed === 'fast' ? 'Rapide (0.5s)' : (speed === 'slow' ? 'Posé (1.4s)' : 'Naturel (0.9s)')}`, "info");
  }

  toggleAppleScrollFx(enabled) {
    if (!state.currentProject) return;
    if (!state.currentProject.branding) state.currentProject.branding = {};
    state.currentProject.branding.appleScrollFx = Boolean(enabled);
    state.save();
    const root = document.querySelector(".artisite-root") || document.getElementById("canvas-container");
    if (root) {
      root.classList.toggle("apple-scrollfx-enabled", Boolean(enabled));
    }
    this.render();
    this.showToast(enabled ? "Animations au Scroll Apple activées" : "Animations au scroll désactivées", "info");
  }

  addStepperStep(secId) {
    if (!state.currentProject) return;
    const updated = JSON.parse(JSON.stringify(state.currentProject));
    const sec = updated.sections.find(s => s.id === secId);
    if (!sec) return;
    sec.content = sec.content || {};
    sec.content.steps = Array.isArray(sec.content.steps) ? sec.content.steps : [
      { step: "1", title: "Diagnostic & Devis Gratuit", desc: "Visite technique offerte à domicile sous 24h avec chiffrage sans engagement." },
      { step: "2", title: "Planification & Préparation", desc: "Validation des matériaux, calendrier d'intervention et protection des lieux." },
      { step: "3", title: "Exécution des Travaux", desc: "Réalisation rigoureuse dans les règles de l'art par nos artisans qualifiés." },
      { step: "4", title: "Réception & Nettoyage", desc: "Contrôle qualité contradictoire, remise de garantie et chantier rendu impeccable." }
    ];
    const newIdx = sec.content.steps.length + 1;
    sec.content.steps.push({
      step: String(newIdx),
      title: `Étape 0${newIdx} : Suivi Personnalisé`,
      desc: "Accompagnement continu et validation à chaque étape de votre projet."
    });
    state.updateProject(updated, true, `Ajout étape stepper (${newIdx})`);
    this.showToast(`Étape 0${newIdx} ajoutée`, "success");
  }

  removeStepperStep(secId, stepIdx) {
    if (!state.currentProject) return;
    const updated = JSON.parse(JSON.stringify(state.currentProject));
    const sec = updated.sections.find(s => s.id === secId);
    if (!sec || !Array.isArray(sec.content?.steps) || sec.content.steps.length <= 2) return;
    sec.content.steps.splice(stepIdx, 1);
    sec.content.steps.forEach((st, idx) => {
      st.step = String(idx + 1);
    });
    state.updateProject(updated, true, `Suppression étape stepper (${stepIdx + 1})`);
    this.showToast("Étape supprimée", "info");
  }

  addCanvaElement(blockType) {
    if (!state.currentProject) return;
    const project = state.currentProject;

    let content = {};
    if (blockType === "urgentBanner") {
      content = {
        blockType: "urgentBanner",
        badge: "⚡ INTERVENTION PRIORITAIRE",
        title: "Disponibilité immédiate 7j/7 sur votre secteur",
        text: "Contactez notre standard d'intervention pour un déplacement rapide et un diagnostic clair sans frais cachés.",
        ctaText: "Appeler maintenant",
        ctaLink: `tel:${project.business.phone || '0600000000'}`
      };
    } else if (blockType === "floatingBadge") {
      content = {
        blockType: "floatingBadge",
        badge: "🛡️ CHARTE DE CONFIANCE LOCALE",
        title: "Professionnel Agréé & Artisans Référencés",
        text: "Toutes nos interventions sont couvertes par notre garantie décennale et assurance responsabilité civile professionnelle.",
        ctaText: "Consulter nos garanties",
        ctaLink: "#contact"
      };
    } else {
      content = {
        blockType: "customCard",
        badge: "✨ SERVICE SUR-MESURE",
        title: "Un projet spécifique ou un besoin particulier ?",
        text: "Nos spécialistes étudient votre demande et vous accompagnent de la conception jusqu'aux finitions.",
        ctaText: "Demander une étude",
        ctaLink: "#contact"
      };
    }

    const newSection = {
      id: `sec-custom-${Date.now()}`,
      type: "customBlock",
      variant: blockType,
      visibility: true,
      content,
      settings: { bgTheme: "mineral" }
    };

    // Insert after hero section (index 1) or at end
    const heroIdx = project.sections.findIndex(s => s.type === "hero");
    const insertIdx = heroIdx !== -1 ? heroIdx + 1 : project.sections.length;
    project.sections.splice(insertIdx, 0, newSection);

    state.pushHistory(`Ajout élément Canva (${blockType})`);
    state.setSelectedSection(newSection.id);
    state.saveToStorage();
    this.render();
    setTimeout(() => {
      this.selectSection(newSection.id, { scroll: true });
      this.updateSelectedSectionUI();
    }, 50);
  }

  moveSection(sectionId, direction) {
    state.moveSection(sectionId, direction);
  }

  toggleSectionVisibility(sectionId) {
    state.toggleSectionVisibility(sectionId);
  }

  duplicateSection(sectionId) {
    state.duplicateSection(sectionId);
  }

  deleteSection(sectionId) {
    if (confirm("Supprimer cette section ?")) {
      state.deleteSection(sectionId);
    }
  }

  updateSectionContent(sectionId, field, value) {
    state.updateSectionContent(sectionId, field, value);
  }

  updateListField(sectionId, field, rawValue) {
    const values = String(rawValue || "")
      .split(/\r?\n/)
      .map(value => value.trim())
      .filter(Boolean);
    state.updateSectionContent(sectionId, field, values);
  }

  handleAddSection(type, variant) {
    const project = state.currentProject;
    if (!project) return;
    const trade = getTradeById(project.business.tradeId);
    const secData = createSectionData(type, variant, trade, project.business);
    state.addSection(secData);
    state.closeDrawer();
    setTimeout(() => {
      const newSecId = state.selectedSectionId;
      if (newSecId) {
        this.scrollToSection(newSecId);
      }
    }, 120);
  }

  changeSectionVariant(sectionId, variant) {
    state.updateSectionVariant(sectionId, variant);
  }

  addServiceItem(sectionId) {
    if (!state.currentProject) return;
    const sec = state.currentProject.sections.find(s => s.id === sectionId);
    if (!sec || !sec.content) return;
    const services = Array.isArray(sec.content.services) ? [...sec.content.services] : [];
    const count = services.length + 1;
    services.push({
      id: `srv-${Date.now()}`,
      title: `Nouvelle Prestation ${count}`,
      desc: "Description détaillée de la prestation et du savoir-faire.",
      tag: "Sur-mesure",
      price: "Sur devis gratuit",
      image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"
    });
    state.updateSectionContent(sectionId, "services", services);
  }

  removeServiceItem(sectionId, idx) {
    if (!state.currentProject) return;
    const sec = state.currentProject.sections.find(s => s.id === sectionId);
    if (!sec || !sec.content || !Array.isArray(sec.content.services)) return;
    const services = sec.content.services.filter((_, i) => i !== idx);
    state.updateSectionContent(sectionId, "services", services);
  }

  deleteServiceItem(sectionId, idx) {
    this.removeServiceItem(sectionId, idx);
  }

  setGalleryAspectRatio(sectionId, ratio) {
    if (!state.currentProject) return;
    const sec = state.currentProject.sections.find(s => s.id === sectionId);
    if (!sec) return;
    sec.settings = sec.settings || {};
    sec.settings.aspectRatio = ratio;
    state.saveToStorage();
    this.renderEditor();
  }

  addGalleryItem(sectionId, type = 'photo') {
    if (!state.currentProject) return;
    const sec = state.currentProject.sections.find(s => s.id === sectionId);
    if (!sec || !sec.content) return;
    const photos = Array.isArray(sec.content.photos) ? [...sec.content.photos] : [];
    const count = photos.length + 1;

    if (type === 'beforeAfter') {
      photos.push({
        id: `gal-ba-${Date.now()}`,
        type: "beforeAfter",
        title: `Projet Comparatif #${count}`,
        tag: "Avant / Après",
        desc: "Rénovation et transformation complète des extérieurs.",
        beforeImage: "https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=800&q=80",
        afterImage: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80"
      });
    } else {
      photos.push({
        id: `gal-${Date.now()}`,
        title: `Réalisation #${count}`,
        tag: "Chantier",
        desc: "Intervention soignée et finitions haut de gamme.",
        url: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80"
      });
    }
    state.updateSectionContent(sectionId, "photos", photos);
  }

  deleteGalleryItem(sectionId, idx) {
    if (!state.currentProject) return;
    const sec = state.currentProject.sections.find(s => s.id === sectionId);
    if (!sec || !sec.content || !Array.isArray(sec.content.photos)) return;
    const photos = sec.content.photos.filter((_, i) => i !== idx);
    state.updateSectionContent(sectionId, "photos", photos);
  }

  toggleGalleryItemType(sectionId, idx) {
    if (!state.currentProject) return;
    const sec = state.currentProject.sections.find(s => s.id === sectionId);
    if (!sec || !sec.content || !Array.isArray(sec.content.photos)) return;
    const photos = [...sec.content.photos];
    const item = photos[idx];
    if (!item) return;

    const isBA = item.type === 'beforeAfter' || (item.beforeImage && item.afterImage);
    if (isBA) {
      photos[idx] = {
        id: item.id || `gal-${Date.now()}`,
        url: item.afterImage || item.beforeImage || "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80",
        title: item.title || "Chantier Réalisé",
        tag: item.tag === "Avant / Après" ? "Réalisation" : (item.tag || "Réalisation"),
        desc: item.desc || ""
      };
    } else {
      photos[idx] = {
        id: item.id || `gal-ba-${Date.now()}`,
        type: "beforeAfter",
        beforeImage: "https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=800&q=80",
        afterImage: item.url || "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80",
        title: item.title || "Transformation Avant / Après",
        tag: "Avant / Après",
        desc: item.desc || "Glissez le curseur pour visualiser la métamorphose."
      };
    }
    state.updateSectionContent(sectionId, "photos", photos);
  }

  addReviewItem(sectionId) {
    if (!state.currentProject) return;
    const sec = state.currentProject.sections.find(s => s.id === sectionId);
    if (!sec || !sec.content) return;
    const reviews = Array.isArray(sec.content.reviews) ? [...sec.content.reviews] : [];
    reviews.push({
      id: `rev-${Date.now()}`,
      author: "Nouveau client",
      city: state.currentProject.business?.city || "",
      rating: 5,
      date: "",
      text: "Ajoutez ici le témoignage du client."
    });
    state.updateSectionContent(sectionId, "reviews", reviews);
  }

  removeReviewItem(sectionId, idx) {
    if (!state.currentProject) return;
    const sec = state.currentProject.sections.find(s => s.id === sectionId);
    if (!sec || !sec.content || !Array.isArray(sec.content.reviews)) return;
    const reviews = sec.content.reviews.filter((_, i) => i !== idx);
    state.updateSectionContent(sectionId, "reviews", reviews);
  }

  addFaqItem(sectionId) {
    if (!state.currentProject) return;
    const sec = state.currentProject.sections.find(s => s.id === sectionId);
    if (!sec || !sec.content) return;
    const items = Array.isArray(sec.content.items) ? [...sec.content.items] : [];
    items.push({
      q: "Nouvelle question fréquente ?",
      a: "Explication claire et rassurante apportée au client."
    });
    state.updateSectionContent(sectionId, "items", items);
  }

  removeFaqItem(sectionId, idx) {
    if (!state.currentProject) return;
    const sec = state.currentProject.sections.find(s => s.id === sectionId);
    if (!sec || !sec.content || !Array.isArray(sec.content.items)) return;
    const items = sec.content.items.filter((_, i) => i !== idx);
    state.updateSectionContent(sectionId, "items", items);
  }

  // Image Management & Trash System
  openImagePicker(sectionId, fieldPath, itemIndex = null) {
    if (!state.currentProject) return;
    this.lastGeneratedAIPhotoUrl = "";
    this.lastGeneratedAIPhotoMeta = null;
    this._aiRequests?.get("image-photo")?.dispose();
    const sec = state.currentProject.sections.find(s => s.id === sectionId);
    let currentUrl = "";
    if (sec && sec.content) {
      if (itemIndex !== null && itemIndex !== undefined && !fieldPath.includes(".")) {
        if (fieldPath === "photos" && Array.isArray(sec.content.photos)) {
          currentUrl = sec.content.photos[itemIndex]?.url || "";
        } else if (fieldPath === "services" && Array.isArray(sec.content.services)) {
          currentUrl = sec.content.services[itemIndex]?.image || "";
        } else if (fieldPath === "items" && Array.isArray(sec.content.items)) {
          currentUrl = sec.content.items[itemIndex]?.image || "";
        }
      } else if (fieldPath.includes(".")) {
        const parts = fieldPath.split(".");
        let val = sec.content;
        for (const p of parts) {
          if (val && val[p] !== undefined) val = val[p];
          else { val = ""; break; }
        }
        currentUrl = typeof val === "string" ? val : "";
      } else {
        currentUrl = sec.content[fieldPath] || "";
      }
    }

    state.activeImageMeta = {
      sectionId,
      fieldPath,
      itemIndex,
      currentUrl,
      sectionType: sec?.type || "hero"
    };
    state.setDrawer("image_modal");
  }

  closeImageModal() {
    this._aiRequests?.get("image-photo")?.dispose();
    this.lastGeneratedAIPhotoUrl = "";
    this.lastGeneratedAIPhotoMeta = null;
    state.activeImageMeta = null;
    state.closeDrawer();
  }

  switchImageTab(tab) {
    ["library", "ai", "url", "upload"].forEach(t => {
      const btn = document.getElementById(`tab-img-${t}`);
      const panel = document.getElementById(`image-panel-${t}`);
      if (btn && panel) {
        if (t === tab) {
          btn.className = "px-3 py-1.5 rounded-lg font-semibold text-zinc-900 bg-white shadow-xs border border-zinc-200";
          panel.style.display = "block";
        } else {
          btn.className = "px-3 py-1.5 rounded-lg font-medium text-zinc-600 hover:text-zinc-900 border border-transparent";
          panel.style.display = "none";
        }
      }
    });
  }

  setAIImageStyle(style) {
    this.selectedAIStyle = style;
    const styles = ['4k', 'archi', 'vector'];
    styles.forEach(s => {
      const btn = document.getElementById(`ai-style-${s}`);
      if (btn) {
        if (s === style) {
          btn.classList.add('is-selected');
        } else {
          btn.classList.remove('is-selected');
        }
      }
    });
  }

  async generateAIPhoto() {
    const activeMeta = state.activeImageMeta;
    if (!state.currentProject || !activeMeta) return;

    const targetMeta = {
      projectId: state.currentProject.id,
      sectionId: activeMeta.sectionId,
      fieldPath: activeMeta.fieldPath,
      itemIndex: activeMeta.itemIndex ?? null,
      sectionType: activeMeta.sectionType || "hero"
    };
    const request = this.beginAIRequest("image-photo");
    const sameTarget = () => {
      const current = state.activeImageMeta;
      return request.current() && state.activeDrawer === "image_modal" &&
        state.currentProject?.id === targetMeta.projectId &&
        current?.sectionId === targetMeta.sectionId &&
        current?.fieldPath === targetMeta.fieldPath &&
        (current?.itemIndex ?? null) === targetMeta.itemIndex;
    };

    const promptInput = document.getElementById("ai-image-prompt-input");
    const prompt = promptInput?.value?.trim() || "Photo artisanale pro";
    const btn = document.getElementById("btn-generate-ai-photo");
    const outputContainer = document.getElementById("ai-image-output-container");
    const previewImg = document.getElementById("ai-generated-preview-img");

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `${getIcon("zap", "w-3.5 h-3.5 animate-spin mr-1.5")}<span>Génération du visuel par l'IA en cours...</span>`;
    }

    try {
      const tradeId = state.currentProject?.business?.tradeId || "paysagiste";
      const sectionType = targetMeta.sectionType;

      let imageUrl = "";
      try {
        const res = await fetch("/api/ai/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, tradeId, sectionType, style: this.selectedAIStyle || "4k" })
        });
        if (!sameTarget()) return;
        if (res.ok) {
          const data = await res.json();
          if (!sameTarget()) return;
          if (data.imageUrl) imageUrl = data.imageUrl;
        }
      } catch (err) {
        if (!sameTarget()) return;
        // Fallback to vector engine when the remote image endpoint is unavailable.
      }

      if (!sameTarget()) return;
      if (!imageUrl) {
        const { getTradeFallbackDataUrl } = await import("./data/imageFallbacks.js");
        if (!sameTarget()) return;
        imageUrl = getTradeFallbackDataUrl(tradeId, sectionType, prompt);
      }

      if (!sameTarget()) return;
      this.lastGeneratedAIPhotoUrl = imageUrl;
      this.lastGeneratedAIPhotoMeta = targetMeta;
      if (previewImg) previewImg.src = imageUrl;
      if (outputContainer) outputContainer.classList.remove("hidden");
    } finally {
      if (this._aiRequests?.get("image-photo") === request && btn) {
        btn.disabled = false;
        btn.innerHTML = `${getIcon("zap", "w-3.5 h-3.5")}<span>Regénérer une autre variante</span>`;
      }
      request.dispose();
    }
  }

  applyGeneratedAIPhoto() {
    if (!this.lastGeneratedAIPhotoUrl || !this.lastGeneratedAIPhotoMeta || !state.activeImageMeta || !state.currentProject) return;
    const generated = this.lastGeneratedAIPhotoMeta;
    const active = state.activeImageMeta;
    const targetMatches = generated.projectId === state.currentProject.id &&
      generated.sectionId === active.sectionId && generated.fieldPath === active.fieldPath &&
      (generated.itemIndex ?? null) === (active.itemIndex ?? null);
    if (!targetMatches) {
      this.lastGeneratedAIPhotoUrl = "";
      this.lastGeneratedAIPhotoMeta = null;
      this.showToast("Ce visuel appartient à une autre cible. Relancez la génération.", "info");
      return;
    }
    this.applyImageUpdate(active.sectionId, active.fieldPath, this.lastGeneratedAIPhotoUrl, active.itemIndex);
    this.closeImageModal();
  }

  setEditorMode(mode) {
    state.setEditorMode(mode === "preview" ? "preview" : "conception");
  }

  toggleExportMenu(force) {
    const menu = document.getElementById("export-menu");
    const button = document.getElementById("export-menu-button");
    if (!menu) return;
    const open = typeof force === "boolean" ? force : menu.dataset.open !== "true";
    menu.dataset.open = String(open);
    menu.classList.toggle("hidden", !open);
    button?.setAttribute("aria-expanded", String(open));
  }

  toggleCopilotPanel(force) {
    state.setCopilotOpen(typeof force === "boolean" ? force : !state.copilotOpen);
  }

  setThemeMode(mode) {
    state.setThemeMode(mode);
  }

  toggleThemeMode() {
    state.toggleThemeMode();
  }

  toggleSiteTheme() {
    const root = document.querySelector(".artisite-root");
    if (!root || !state.currentProject) return;
    const next = root.dataset.siteTheme === "dark" ? "light" : "dark";
    root.dataset.siteTheme = next;
    state.currentProject.siteTheme = next;
    state.saveToStorage();
    this.syncSiteThemeToggle(root);
  }

  updateReviewRating(sectionId, reviewIndex, rating) {
    if (!state.currentProject) return;
    const section = state.currentProject.sections.find(item => item.id === sectionId);
    if (!section?.content) return;
    const updated = JSON.parse(JSON.stringify(state.currentProject));
    const targetSection = updated.sections.find(item => item.id === sectionId);
    if (!targetSection?.content) return;

    if (reviewIndex === -1) {
      targetSection.content.overallRating = (Number(rating) || 5).toFixed(1);
    } else {
      const review = targetSection.content.reviews?.[reviewIndex];
      if (!review) return;
      review.rating = Math.max(0, Math.min(5, Number(rating) || 0));
    }
    state.updateProject(updated, true, "Modification note Google");
  }

  previewRatingHover(starBtn, starValue) {
    const container = starBtn?.closest(".interactive-rating-container");
    if (!container) return;
    const buttons = container.querySelectorAll(".rating-star-btn");
    buttons.forEach((btn, idx) => {
      const shouldFill = idx < starValue;
      btn.classList.toggle("is-hover-fill", shouldFill);
      btn.classList.toggle("text-amber-400", shouldFill);
      btn.classList.toggle("text-gray-300", !shouldFill);
    });
  }

  resetRatingHover(starBtn) {
    const container = starBtn?.closest(".interactive-rating-container");
    if (!container) return;
    const buttons = container.querySelectorAll(".rating-star-btn");
    buttons.forEach((btn) => {
      btn.classList.remove("is-hover-fill");
      const isFilled = btn.classList.contains("is-filled");
      btn.classList.toggle("text-amber-400", isFilled);
      btn.classList.toggle("text-gray-300", !isFilled);
    });
  }

  setStickyDockPosition(position) {
    if (!state.currentProject) return;
    const updated = JSON.parse(JSON.stringify(state.currentProject));
    updated.settings = { ...(updated.settings || {}), stickyDockPosition: position, stickyBarPosition: {} };
    state.updateProject(updated, true, `Position bandeau (${position})`);

    const stickyBar = document.querySelector("[data-sticky-call-bar]");
    if (stickyBar) {
      stickyBar.dataset.dockPosition = position;
      stickyBar.classList.remove("is-custom-dragged");
      stickyBar.style.removeProperty("--sticky-left");
      stickyBar.style.removeProperty("--sticky-top");
      stickyBar.style.removeProperty("bottom");
    }
  }

  toggleSectionMotionMenu(secId) {
    const pop = document.getElementById(`sec-motion-popover-${secId}`);
    if (!pop) return;
    const isClosed = pop.classList.contains("hidden");
    document.querySelectorAll(".sec-motion-popover:not(.hidden)").forEach(p => p.classList.add("hidden"));
    if (isClosed) {
      pop.classList.remove("hidden");
    }
  }

  previewSectionMotion(secId, preset) {
    const secEl = document.getElementById(`section-${secId}`) || document.querySelector(`.editor-section-wrapper[data-section-id="${secId}"]`);
    if (!secEl) return;
    const motion = preset === "none" ? "" : preset;
    secEl.setAttribute("data-motion", motion);
    secEl.classList.remove("is-revealed");
    // `motion-preview` opts the block out of the editor opacity guard, so the
    // fade-based presets are actually visible while previewing.
    secEl.classList.add("motion-preview");
    if (preset === "pulse") secEl.classList.add("btn-pulse-active");
    else secEl.classList.remove("btn-pulse-active");
    void secEl.offsetWidth; // trigger DOM reflow to restart CSS animation
    secEl.classList.add("is-revealed");
    if (this._sectionMotionPreviewTimer) clearTimeout(this._sectionMotionPreviewTimer);
    if (preset !== "pulse") {
      this._sectionMotionPreviewTimer = setTimeout(() => {
        secEl.classList.remove("motion-preview");
        secEl.classList.add("is-revealed");
      }, 1200);
    }
  }

  setSectionMotion(secId, preset) {
    if (!state.currentProject) return;
    const updated = JSON.parse(JSON.stringify(state.currentProject));
    const sec = updated.sections.find(s => s.id === secId);
    if (!sec) return;
    sec.motionPreset = preset;
    sec.settings = sec.settings || {};
    sec.settings.motionPreset = preset === "none" ? "" : preset;
    state.updateProject(updated, true, `Animation section (${preset})`);

    const pop = document.getElementById(`sec-motion-popover-${secId}`);
    if (pop) pop.classList.add("hidden");

    // Immediate live replay on canvas element
    setTimeout(() => {
      this.previewSectionMotion(secId, preset);
    }, 30);
    this.showToast(`Animation : ${preset === 'none' ? 'Aucune' : preset}`, "info");
  }

  getFieldMotionLoop(el) {
    const field = el?.getAttribute?.("data-editable");
    const secId = el?.closest?.(".editor-section-wrapper")?.getAttribute("data-section-id");
    const sec = state.currentProject?.sections.find(s => s.id === secId);
    return sec?.settings?.elementMotionLoops?.[field] || "";
  }

  getImageMotionLoop(secId, fieldPath, itemIndex) {
    const idx = (itemIndex !== null && itemIndex !== undefined && itemIndex !== "null") ? itemIndex : 0;
    const key = fieldPath + "_" + idx;
    return state.currentProject?.sections.find(s => s.id === secId)?.settings?.imageMotionLoops?.[key] || "";
  }

  syncMotionLoopButtons(scopeSelector, dataAttr, mode) {
    document.querySelectorAll(scopeSelector).forEach(node => {
      node.querySelectorAll("[" + dataAttr + "]").forEach(btn => btn.classList.toggle("is-active", btn.getAttribute(dataAttr) === (mode || "once")));
    });
  }

  setSectionMotionLoop(sectionId, mode) {
    if (!state.currentProject) return;
    const nextMode = ["twice", "infinite"].includes(mode) ? mode : "";
    const updated = JSON.parse(JSON.stringify(state.currentProject));
    const sec = updated.sections.find(s => s.id === sectionId);
    if (!sec) return;
    sec.settings = sec.settings || {};
    if (nextMode) sec.settings.motionLoop = nextMode;
    else delete sec.settings.motionLoop;
    state.updateProject(updated, true);
    const secEl = document.getElementById("section-" + sectionId) || document.querySelector(".editor-section-wrapper[data-section-id=\"" + sectionId + "\"]");
    if (secEl) {
      if (nextMode) secEl.setAttribute("data-motion-loop", nextMode);
      else secEl.removeAttribute("data-motion-loop");
    }
    this.syncMotionLoopButtons("#sec-motion-popover-" + sectionId, "data-section-loop", nextMode);
    this.showToast(nextMode === "infinite" ? "Animation de section en boucle continue" : (nextMode === "twice" ? "Animation de section répétée deux fois" : "Animation de section jouée une fois"), "info");
  }

  setSectionMotionSpeed(sectionId, speedId) {
    this.setSectionMotionTiming(sectionId, "motionSpeed", "normal", speedId, "Vitesse de l'animation");
  }

  setSectionMotionDelay(sectionId, delayId) {
    this.setSectionMotionTiming(sectionId, "motionDelay", "aucun", delayId, "Délai de l'animation");
  }

  /** Rythme de la section : une seule écriture et un seul historique pour la vitesse et le délai. */
  setSectionMotionTiming(sectionId, key, defaultId, valueId, label) {
    if (!state.currentProject) return;
    const updated = JSON.parse(JSON.stringify(state.currentProject));
    const sec = updated.sections.find(s => s.id === sectionId);
    if (!sec) return;
    sec.settings = sec.settings || {};
    if (valueId && valueId !== defaultId) sec.settings[key] = valueId;
    else delete sec.settings[key];
    state.updateProject(updated, true);
    const attr = key === "motionSpeed" ? "data-motion-speed" : "data-motion-delay";
    const secEl = document.getElementById("section-" + sectionId) || document.querySelector(".editor-section-wrapper[data-section-id=\"" + sectionId + "\"]");
    if (secEl) {
      if (valueId && valueId !== defaultId) secEl.setAttribute(attr, valueId);
      else secEl.removeAttribute(attr);
    }
    const preset = sec.settings?.motionPreset || sec.motionPreset;
    if (preset && preset !== "none") this.previewSectionMotion(sectionId, preset);
    this.showToast(label + " enregistré", "info");
  }

  setActiveTextMotionLoop(mode) {
    const el = this._activeEditableEl;
    if (!el) return;
    const nextMode = ["twice", "infinite"].includes(mode) ? mode : "";
    const field = el.getAttribute("data-editable") || "text";
    const secWrapper = el.closest(".editor-section-wrapper");
    const secId = secWrapper?.getAttribute("data-section-id");
    if (secId && state.currentProject) {
      const updated = JSON.parse(JSON.stringify(state.currentProject));
      const sec = updated.sections.find(s => s.id === secId);
      if (sec) {
        sec.settings = sec.settings || {};
        sec.settings.elementMotionLoops = sec.settings.elementMotionLoops || {};
        if (nextMode) sec.settings.elementMotionLoops[field] = nextMode;
        else delete sec.settings.elementMotionLoops[field];
        state.updateProject(updated, true);
      }
    }
    const motion = state.currentProject?.sections.find(s => s.id === secId)?.settings?.elementMotions?.[field] || "";
    this.previewElementMotion(el, motion, nextMode);
    this.syncMotionLoopButtons("#ftb-anim-menu", "data-text-loop", nextMode);
    this.showToast(nextMode ? "Animation d’élément en boucle" : "Animation d’élément jouée une fois", "info");
  }

  setImageMotionLoop(secId, fieldPath, itemIndex, mode) {
    const idx = (itemIndex !== null && itemIndex !== undefined && itemIndex !== "null") ? itemIndex : 0;
    const nextMode = ["twice", "infinite"].includes(mode) ? mode : "";
    if (!state.currentProject) return;
    const updated = JSON.parse(JSON.stringify(state.currentProject));
    const sec = updated.sections.find(s => s.id === secId);
    if (!sec) return;
    sec.settings = sec.settings || {};
    sec.settings.imageMotionLoops = sec.settings.imageMotionLoops || {};
    const imgKey = fieldPath + "_" + idx;
    if (nextMode) sec.settings.imageMotionLoops[imgKey] = nextMode;
    else delete sec.settings.imageMotionLoops[imgKey];
    state.updateProject(updated, true);
    const secEl = document.getElementById("section-" + secId) || document.querySelector(".editor-section-wrapper[data-section-id=\"" + secId + "\"]");
    const imgEl = secEl?.querySelector("[data-image-field=\"" + fieldPath + "\"][data-image-index=\"" + idx + "\"]") || secEl?.querySelector("img");
    if (imgEl) {
      if (nextMode) imgEl.setAttribute("data-motion-loop", nextMode);
      else imgEl.removeAttribute("data-motion-loop");
    }
    this.syncMotionLoopButtons("#img-motion-menu-" + secId + "-" + String(fieldPath || "").replace(/\./g, "-") + "-" + idx, "data-image-loop", nextMode);
    this.showToast(nextMode ? "Animation d’image en boucle" : "Animation d’image jouée une fois", "info");
  }

  toggleImageMotionMenu(secId, fieldPath, itemIndex) {
    const idx = (itemIndex !== null && itemIndex !== undefined && itemIndex !== "null") ? itemIndex : 0;
    const sanitizedField = String(fieldPath || "").replace(/\./g, "-");
    const menuId = `img-motion-menu-${secId}-${sanitizedField}-${idx}`;
    const menu = document.getElementById(menuId);
    if (!menu) return;
    const isClosed = menu.classList.contains("hidden");
    document.querySelectorAll("[id^='img-motion-menu-']:not(.hidden)").forEach(m => m.classList.add("hidden"));
    if (isClosed) menu.classList.remove("hidden");
  }

  setImageMotion(secId, fieldPath, itemIndex, preset) {
    const idx = (itemIndex !== null && itemIndex !== undefined && itemIndex !== "null") ? itemIndex : 0;
    const sanitizedField = String(fieldPath || "").replace(/\./g, "-");
    const menuId = `img-motion-menu-${secId}-${sanitizedField}-${idx}`;
    const menu = document.getElementById(menuId);
    if (menu) menu.classList.add("hidden");

    if (!state.currentProject) return;
    const updated = JSON.parse(JSON.stringify(state.currentProject));
    const sec = updated.sections.find(s => s.id === secId);
    if (!sec) return;

    sec.settings = sec.settings || {};
    sec.settings.imageMotions = sec.settings.imageMotions || {};
    const imgKey = `${fieldPath}_${idx}`;
    sec.settings.imageMotions[imgKey] = preset === "none" ? "" : preset;
    state.updateProject(updated, true);

    setTimeout(() => {
      const secEl = document.getElementById(`section-${secId}`) || document.querySelector(`.editor-section-wrapper[data-section-id="${secId}"]`);
      const imgEl = secEl?.querySelector(`[data-image-field="${fieldPath}"][data-image-index="${idx}"]`) || secEl?.querySelector("img");
      if (imgEl) {
        this.previewElementMotion(imgEl, preset);
      }
    }, 30);
    this.showToast(`Animation image : ${preset === 'none' ? 'Aucune' : preset}`, "info");
  }

  /** Rythme d'un texte : une seule écriture, un seul instantané d'historique. */
  setActiveTextMotionSpeed(speedId) {
    this.setActiveTextTiming("elementMotionSpeeds", "normal", speedId, "Vitesse");
  }

  setActiveTextMotionDelay(delayId) {
    this.setActiveTextTiming("elementMotionDelays", "aucun", delayId, "Délai");
  }

  setActiveTextTiming(key, defaultId, valueId, label) {
    const el = this._activeEditableEl;
    if (!el) return;
    const field = el.getAttribute("data-editable") || "text";
    const secWrapper = el.closest(".editor-section-wrapper");
    const secId = secWrapper?.getAttribute("data-section-id");
    if (secId && state.currentProject) {
      const updated = JSON.parse(JSON.stringify(state.currentProject));
      const sec = updated.sections.find(s => s.id === secId);
      if (sec) {
        sec.settings = sec.settings || {};
        sec.settings[key] = sec.settings[key] || {};
        if (valueId && valueId !== defaultId) sec.settings[key][field] = valueId;
        else delete sec.settings[key][field];
        state.updateProject(updated, true);
      }
    }
    const attr = key === "elementMotionSpeeds" ? "data-motion-speed" : "data-motion-delay";
    const live = document.querySelector(".editor-section-wrapper[data-section-id=\"" + secId + "\"] [data-editable=\"" + field + "\"]") || el;
    if (live) {
      if (valueId && valueId !== defaultId) live.setAttribute(attr, valueId);
      else live.removeAttribute(attr);
    }
    this.syncMotionLoopButtons("#ftb-anim-menu", key === "elementMotionSpeeds" ? "data-text-speed" : "data-text-delay", valueId);
    const motion = state.currentProject?.sections.find(s => s.id === secId)?.settings?.elementMotions?.[field] || "";
    if (live && motion && motion !== "none") this.previewElementMotion(live, motion);
    this.showToast(label + " de l'animation mise à jour", "info");
  }

  /** Rythme d'une image : une seule écriture, un seul instantané d'historique. */
  setImageMotionSpeed(secId, fieldPath, itemIndex, speedId) {
    this.setImageMotionTiming(secId, fieldPath, itemIndex, "imageMotionSpeeds", "normal", speedId, "Vitesse");
  }

  setImageMotionDelay(secId, fieldPath, itemIndex, delayId) {
    this.setImageMotionTiming(secId, fieldPath, itemIndex, "imageMotionDelays", "aucun", delayId, "Délai");
  }

  setImageMotionTiming(secId, fieldPath, itemIndex, key, defaultId, valueId, label) {
    const idx = (itemIndex !== null && itemIndex !== undefined && itemIndex !== "null") ? itemIndex : 0;
    if (!state.currentProject) return;
    const updated = JSON.parse(JSON.stringify(state.currentProject));
    const sec = updated.sections.find(s => s.id === secId);
    if (!sec) return;
    sec.settings = sec.settings || {};
    sec.settings[key] = sec.settings[key] || {};
    const imgKey = fieldPath + "_" + idx;
    if (valueId && valueId !== defaultId) sec.settings[key][imgKey] = valueId;
    else delete sec.settings[key][imgKey];
    state.updateProject(updated, true);
    const secEl = document.getElementById("section-" + secId) || document.querySelector(".editor-section-wrapper[data-section-id=\"" + secId + "\"]");
    const imgEl = secEl?.querySelector("[data-image-field=\"" + fieldPath + "\"][data-image-index=\"" + idx + "\"]") || secEl?.querySelector("img");
    const attr = key === "imageMotionSpeeds" ? "data-motion-speed" : "data-motion-delay";
    if (imgEl) {
      if (valueId && valueId !== defaultId) imgEl.setAttribute(attr, valueId);
      else imgEl.removeAttribute(attr);
    }
    const menu = "#img-motion-menu-" + secId + "-" + String(fieldPath || "").replace(/\./g, "-") + "-" + idx;
    this.syncMotionLoopButtons(menu, key === "imageMotionSpeeds" ? "data-image-speed" : "data-image-delay", valueId);
    const motion = sec.settings.imageMotions?.[imgKey];
    if (imgEl && motion && motion !== "none") this.previewElementMotion(imgEl, motion);
    this.showToast(label + " de l'animation mise à jour", "info");
  }

  toggleTextMotionMenu() {
    const menu = document.getElementById("ftb-anim-menu");
    const loop = this._activeEditableEl ? this.getFieldMotionLoop(this._activeEditableEl) : "";
    this.syncMotionLoopButtons("#ftb-anim-menu", "data-text-loop", loop);
    const field = this._activeEditableEl?.getAttribute("data-editable") || "text";
    const secId = this._activeEditableEl?.closest(".editor-section-wrapper")?.getAttribute("data-section-id");
    const settings = state.currentProject?.sections.find(s => s.id === secId)?.settings || {};
    this.syncMotionLoopButtons("#ftb-anim-menu", "data-text-speed", settings.elementMotionSpeeds?.[field] || "normal");
    this.syncMotionLoopButtons("#ftb-anim-menu", "data-text-delay", settings.elementMotionDelays?.[field] || "aucun");
    if (menu) menu.classList.toggle("hidden");
  }

  setActiveTextMotion(preset) {
    const el = this._activeEditableEl;
    const menu = document.getElementById("ftb-anim-menu");
    if (menu) menu.classList.add("hidden");
    if (!el) return;

    const motion = preset === "none" ? "" : preset;
    const field = el.getAttribute("data-editable");
    const secWrapper = el.closest(".editor-section-wrapper");
    const secId = secWrapper?.getAttribute("data-section-id");

    if (secId && state.currentProject) {
      const updated = JSON.parse(JSON.stringify(state.currentProject));
      const sec = updated.sections.find(s => s.id === secId);
      if (sec) {
        sec.settings = sec.settings || {};
        sec.settings.elementMotions = sec.settings.elementMotions || {};
        sec.settings.elementMotions[field || "text"] = motion;
        state.updateProject(updated, true);
      }
    }

    setTimeout(() => {
      const freshEl = (secId && field)
        ? document.querySelector(`.editor-section-wrapper[data-section-id="${secId}"] [data-editable="${field}"]`)
        : el;
      if (freshEl) {
        this._activeEditableEl = freshEl;
        this.previewElementMotion(freshEl, preset);
      }
    }, 30);
    this.showToast(`Animation texte : ${preset === 'none' ? 'Aucune' : preset}`, "info");
  }

  previewElementMotion(el, preset, loop) {
    if (!el) return;
    const motion = preset === "none" ? "" : preset;
    if (motion) el.setAttribute("data-motion", motion);
    else el.removeAttribute("data-motion");
    if (loop !== undefined) {
      if (loop) el.setAttribute("data-motion-loop", loop);
      else el.removeAttribute("data-motion-loop");
    }

    el.classList.remove("is-revealed");
    el.classList.add("motion-preview");
    if (preset === "pulse") {
      el.classList.add("btn-pulse-active");
    } else {
      el.classList.remove("btn-pulse-active");
    }
    void el.offsetWidth;
    el.classList.add("is-revealed");
    if (preset !== "pulse") {
      setTimeout(() => {
        el.classList.remove("motion-preview");
        el.classList.add("is-revealed");
      }, 1100);
    }
  }

  insertQuickComponent(secId, compType) {
    if (!state.currentProject) return;
    const updated = JSON.parse(JSON.stringify(state.currentProject));
    const sec = updated.sections.find(s => s.id === secId);
    if (!sec) return;

    sec.content = sec.content || {};

    if (compType === "button") {
      sec.content.secondaryButtonText = "En savoir plus";
      sec.content.secondaryButtonLink = "#contact";
      this.showToast("Bouton d'action ajouté avec succès !");
    } else if (compType === "badge") {
      const defaultBadge = "🛡️ Artisan Recommandé & Certifié";
      if (!sec.content.badge) {
        sec.content.badge = defaultBadge;
      } else {
        sec.content.badges = Array.isArray(sec.content.badges) ? sec.content.badges : [sec.content.badge];
        sec.content.badges.push("✓ Assurance décennale valide");
      }
      this.showToast("Badge de confiance inséré !");
    } else if (compType === "quote") {
      sec.content.quote = {
        author: "Client vérifié",
        text: "Intervention rapide, travail soigné et prix très honnête. Je recommande à 100% !",
        stars: 5
      };
      this.showToast("Citation avis client insérée !");
    } else if (compType === "separator") {
      sec.content.hasSeparator = true;
      this.showToast("Séparateur visuel ajouté !");
    }

    state.updateProject(updated, true, `Ajout composant rapide (${compType})`);
    this.selectSection(secId, { scroll: false });
  }

  setSectionSplitDirection(secId, direction) {
    if (!state.currentProject) return;
    const updated = JSON.parse(JSON.stringify(state.currentProject));
    const sec = updated.sections.find(s => s.id === secId);
    if (!sec) return;
    sec.variant = direction === "vertical" ? "vertical" : "interactive-slider";
    sec.content = sec.content || {};
    sec.content.direction = direction;
    sec.settings = sec.settings || {};
    sec.settings.direction = direction;
    state.updateProject(updated, true, `Direction SplitReveal (${direction})`);
    this.showToast(`Orientation SplitReveal : ${direction === 'vertical' ? 'Verticale' : 'Horizontale'}`);
  }

  syncSiteThemeToggle(root = document.querySelector(".artisite-root")) {
    if (!root) return;
    const dark = root.dataset.siteTheme === "dark";
    document.querySelectorAll("[data-site-theme-toggle]").forEach(button => {
      button.setAttribute("aria-label", dark ? "Activer le mode jour du site" : "Activer le mode nuit du site");
      const label = button.querySelector(".site-theme-label");
      if (label) label.textContent = dark ? "Mode jour" : "Mode nuit";
      button.querySelector(".site-theme-icon-light")?.classList.toggle("hidden", dark);
      button.querySelector(".site-theme-icon-dark")?.classList.toggle("hidden", !dark);
    });
  }

  hydrateImageFallbacks() {
    window.setTimeout(() => {
      document.querySelectorAll("img[data-fallback-src]").forEach(img => {
        if (!img.complete || img.naturalWidth > 0) return;
        const fallback = img.dataset.fallbackSrc;
        if (!fallback || img.dataset.fallbackApplied === "true") return;
        img.dataset.fallbackApplied = "true";
        img.src = fallback;
      });
    }, 700);
  }

  toggleCTAPulse() {
    if (state.currentProject?.branding) {
      state.currentProject.branding.ctaPulse = !state.currentProject.branding.ctaPulse;
      state.saveToStorage();
    }
    const btns = document.querySelectorAll(".btn-cta");
    btns.forEach(b => b.classList.toggle("btn-cta-pulse"));
  }

  selectPhotoFromLibrary(url) {
    if (!state.activeImageMeta) return;
    const { sectionId, fieldPath, itemIndex } = state.activeImageMeta;
    this.applyImageUpdate(sectionId, fieldPath, url, itemIndex);
    this.closeImageModal();
  }

  applyPhotoFromUrl() {
    if (!state.activeImageMeta) return;
    const input = document.getElementById("image-modal-url-input");
    const url = input?.value?.trim();
    if (!url) return;
    const { sectionId, fieldPath, itemIndex } = state.activeImageMeta;
    this.applyImageUpdate(sectionId, fieldPath, url, itemIndex);
    this.closeImageModal();
  }

  handleImageFileInput(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    this.readAndApplyImageFile(file);
  }

  handleImageFileDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    this.readAndApplyImageFile(file);
  }

  readAndApplyImageFile(file) {
    if (!state.activeImageMeta) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const { sectionId, fieldPath, itemIndex } = state.activeImageMeta;
      this.applyImageUpdate(sectionId, fieldPath, dataUrl, itemIndex);
      this.closeImageModal();
    };
    reader.readAsDataURL(file);
  }

  handleImageElementDrop(event, sectionId, fieldPath, itemIndex) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      this.applyImageUpdate(sectionId, fieldPath, dataUrl, itemIndex);
    };
    reader.readAsDataURL(file);
  }

  deletePhoto(sectionId, fieldPath, itemIndex = null) {
    if (confirm("Mettre cette photo à la poubelle ?")) {
      const tradeId = state.currentProject?.business?.tradeId || "paysagiste";
      const placeholder = getTradeFallbackDataUrl(tradeId, fieldPath, "Visuel à personnaliser");
      this.applyImageUpdate(sectionId, fieldPath, placeholder, itemIndex);
    }
  }

  deletePhotoFromModal() {
    if (!state.activeImageMeta) return;
    const { sectionId, fieldPath, itemIndex } = state.activeImageMeta;
    this.deletePhoto(sectionId, fieldPath, itemIndex);
    this.closeImageModal();
  }

  applyImageUpdate(sectionId, fieldPath, newUrl, itemIndex) {
    if (!state.currentProject) return;
    const sec = state.currentProject.sections.find(s => s.id === sectionId);
    if (!sec || !sec.content) return;

    if (itemIndex !== null && itemIndex !== undefined && !fieldPath.includes(".")) {
      if (fieldPath === "photos") {
        const photos = Array.isArray(sec.content.photos) ? [...sec.content.photos] : [];
        if (photos[itemIndex]) {
          photos[itemIndex] = { ...photos[itemIndex], url: newUrl };
        } else {
          photos.push({ id: `photo-${Date.now()}`, url: newUrl, title: "Nouvelle photo", tag: "Réalisation" });
        }
        state.updateSectionContent(sectionId, "photos", photos);
        return;
      }
      if (fieldPath === "services") {
        const services = Array.isArray(sec.content.services) ? [...sec.content.services] : [];
        if (services[itemIndex]) {
          services[itemIndex] = { ...services[itemIndex], image: newUrl };
          state.updateSectionContent(sectionId, "services", services);
        }
        return;
      }
      if (fieldPath === "items") {
        const items = Array.isArray(sec.content.items) ? [...sec.content.items] : [];
        if (items[itemIndex]) {
          items[itemIndex] = { ...items[itemIndex], image: newUrl };
          state.updateSectionContent(sectionId, "items", items);
        }
        return;
      }
    }

    state.updateSectionContent(sectionId, fieldPath, newUrl);
  }

  applyStylePreset(presetId) {
    const preset = getStylePresetById(presetId);
    const proj = JSON.parse(JSON.stringify(state.currentProject));
    proj.branding.presetId = preset.id;
    proj.branding.presetName = preset.name;
    proj.branding.primaryColor = preset.primaryColor;
    proj.branding.secondaryColor = preset.secondaryColor;
    proj.branding.accentColor = preset.accentColor;
    proj.branding.bgColor = preset.bgColor;
    proj.branding.bgSecondary = preset.bgSecondary;
    proj.branding.textColor = preset.textColor;
    proj.branding.textMuted = preset.textMuted;
    proj.branding.headingFont = preset.headingFont;
    proj.branding.bodyFont = preset.bodyFont;
    proj.branding.borderRadius = preset.borderRadius;
    proj.branding.buttonRadius = preset.buttonRadius;
    proj.branding.cardStyle = preset.cardStyle;
    state.updateProject(proj, true, `Application du preset ${preset.name}`);
  }

  liveUpdateColor(colorKey, value) {
    if (!state.currentProject) return;
    state.currentProject.branding[colorKey] = value;

    // Direct CSS custom property update on canvas root (60 FPS smooth)
    const root = document.querySelector(".artisite-root");
    if (root) {
      const map = {
        primaryColor: "--primary",
        secondaryColor: "--secondary",
        accentColor: "--accent",
        bgColor: "--bg",
        textColor: "--text"
      };
      if (map[colorKey]) {
        root.style.setProperty(map[colorKey], value);
      }
    }

    const hexMap = {
      primaryColor: "hex-primary",
      secondaryColor: "hex-secondary",
      accentColor: "hex-accent"
    };
    const hexEl = document.getElementById(hexMap[colorKey]);
    if (hexEl) hexEl.textContent = value;
    const textInput = document.getElementById(`color-text-${colorKey}`);
    if (textInput && document.activeElement !== textInput) textInput.value = value;
    const rgbInput = document.querySelector(`[data-color-field="${colorKey}"] .color-rgb-input`);
    if (rgbInput && document.activeElement !== rgbInput) {
      const hex = String(value || "").replace("#", "");
      if (/^[0-9a-f]{6}$/i.test(hex)) {
        rgbInput.value = `rgb(${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)})`;
      }
    }
  }

  commitColorUpdate(colorKey, value) {
    if (!state.currentProject) return;
    state.pushHistory(`Modification couleur ${colorKey}`);
    state.currentProject.branding[colorKey] = value;
    state.saveToStorage();
    this.updateUndoRedoUI();
  }

  updateBrandingColor(colorKey, value) {
    this.liveUpdateColor(colorKey, value);
    this.commitColorUpdate(colorKey, value);
  }

  updateColorFromText(colorKey, value) {
    const normalized = String(value || "").trim();
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)) return;
    this.liveUpdateColor(colorKey, normalized);
    const picker = document.querySelector(`[data-color-picker="${colorKey}"]`);
    if (picker) picker.value = normalized;
  }

  commitColorFromText(colorKey, value) {
    const normalized = String(value || "").trim();
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)) return;
    this.updateBrandingColor(colorKey, normalized);
  }

  rgbToHex(value) {
    const match = String(value || "").match(/rgba?\s*\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/i) || String(value || "").match(/^\s*(\d{1,3})\s*[,; ]\s*(\d{1,3})\s*[,; ]\s*(\d{1,3})\s*$/);
    if (!match) return null;
    const channels = match.slice(1, 4).map(Number);
    if (channels.some(channel => channel < 0 || channel > 255)) return null;
    return `#${channels.map(channel => channel.toString(16).padStart(2, "0")).join("")}`;
  }

  updateColorFromRgb(colorKey, value) {
    const hex = this.rgbToHex(value);
    if (!hex) return;
    this.liveUpdateColor(colorKey, hex);
    const input = document.querySelector(`[data-color-field="${colorKey}"] .color-rgb-input`);
    if (input && document.activeElement !== input) input.value = value;
  }

  commitColorFromRgb(colorKey, value) {
    const hex = this.rgbToHex(value);
    if (hex) this.updateBrandingColor(colorKey, hex);
  }

  async pickColorWithEyedropper(colorKey) {
    if (typeof window === "undefined" || !window.EyeDropper) return;
    try {
      const result = await new window.EyeDropper().open();
      if (result?.sRGBHex) this.updateBrandingColor(colorKey, result.sRGBHex);
    } catch (error) {
      if (error?.name !== "AbortError") console.warn("EyeDropper unavailable", error);
    }
  }

  applyHarmonyColor(colorKey, value) {
    this.updateBrandingColor(colorKey, value);
  }

  liveUpdateBorderRadius(radius, btnRadius) {
    if (!state.currentProject) return;
    const nextButtonRadius = btnRadius || radius;
    const updated = JSON.parse(JSON.stringify(state.currentProject));
    updated.branding = updated.branding || {};
    updated.branding.buttonRadius = nextButtonRadius;
    state.updateProject(updated, true, `Rayon boutons : ${nextButtonRadius}`);

    const root = document.querySelector(".artisite-root");
    if (root) {
      root.style.setProperty("--btn-radius", nextButtonRadius);
      root.style.setProperty("--cta-radius", nextButtonRadius);
    }
    this.updateUndoRedoUI();

    // Update border radius button active states in sidebar settings
    const tabSettings = document.getElementById("sidebar-tab-settings");
    if (tabSettings) {
      const btns = tabSettings.querySelectorAll("[data-radius-option]");
      btns.forEach((btn, idx) => {
        const isAct = btn.dataset.radius === radius;
        btn.classList.toggle('border-zinc-900', isAct);
        btn.classList.toggle('bg-white', isAct);
        btn.classList.toggle('font-semibold', isAct);
        btn.classList.toggle('text-zinc-950', isAct);
        btn.classList.toggle('border-zinc-200', !isAct);
        btn.classList.toggle('text-zinc-600', !isAct);
      });
    }
  }

  updateBorderRadius(radius, btnRadius) {
    this.liveUpdateBorderRadius(radius, btnRadius);
  }

  setMotionPreset(preset) {
    if (!state.currentProject) return;
    const allowed = new Set(['none', 'fade-in', 'slide-up', 'slide-in', 'spring', 'progress-fill', 'reveal', 'stagger', 'shimmer', 'pulse']);
    if (!allowed.has(preset)) return;
    const updated = JSON.parse(JSON.stringify(state.currentProject));
    updated.branding.motionPreset = preset;
    state.updateProject(updated, true, `Animation : ${preset}`);

    // Immediate visual preview feedback on visible sections in canvas
    const motionTargets = document.querySelectorAll("#canvas-container [data-motion], .site-section[data-motion], .editor-section-wrapper[data-motion]");
    motionTargets.forEach(el => {
      el.setAttribute("data-motion", preset);
      el.classList.remove("is-revealed");
      void el.offsetHeight; // trigger reflow
      el.classList.add("is-revealed");
    });
    this.showToast(`Animation : ${preset}`);
  }

  initScrollObserver() {
    const motionElements = document.querySelectorAll("[data-motion]:not([data-motion='none']), [data-scroll-fx]");
    if (!motionElements.length) return;

    if (this._scrollObserver) {
      this._scrollObserver.disconnect();
    }

    const scrollContainer = document.getElementById("editor-main-canvas") || document.querySelector("main.overflow-y-auto") || document.querySelector("main") || null;

    if (typeof IntersectionObserver === "undefined") {
      motionElements.forEach(el => {
        el.classList.add("is-revealed");
        el.classList.add("fx-active");
      });
      return;
    }

    this._scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          entry.target.classList.add("fx-active");
        }
      });
    }, {
      root: scrollContainer,
      threshold: 0.05,
      rootMargin: "0px 0px -20px 0px"
    });

    motionElements.forEach(el => {
      this._scrollObserver.observe(el);
      if (scrollContainer) {
        const cRect = scrollContainer.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        if (r.top < cRect.bottom + 80 && r.bottom > cRect.top - 80) {
          el.classList.add("is-revealed");
          el.classList.add("fx-active");
        }
      } else {
        const r = el.getBoundingClientRect();
        if (r.top < (window.innerHeight || 800) + 80 && r.bottom > -80) {
          el.classList.add("is-revealed");
          el.classList.add("fx-active");
        }
      }
    });

    if (scrollContainer && !this._mainScrollBound) {
      scrollContainer.addEventListener("scroll", () => {
        const containerRect = scrollContainer.getBoundingClientRect();
        document.querySelectorAll("[data-motion]:not([data-motion='none']):not(.is-revealed), [data-scroll-fx]:not(.fx-active)").forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.top < containerRect.bottom + 80 && r.bottom > containerRect.top - 80) {
            el.classList.add("is-revealed");
            el.classList.add("fx-active");
          }
        });
      }, { passive: true });
      this._mainScrollBound = true;
    }
  }

  updateTypography(headingFont, bodyFont) {
    if (!state.currentProject) return;
    const updated = JSON.parse(JSON.stringify(state.currentProject));
    updated.branding = updated.branding || {};
    updated.branding.headingFont = headingFont;
    updated.branding.bodyFont = bodyFont;

    // State owns the committed mutation so Undo captures the previous typography,
    // while CSS variables keep the canvas response immediate.
    state.updateProject(updated, true, `Typographie : ${this.typographyTarget === "body" ? bodyFont : headingFont}`);
    const root = document.querySelector(".artisite-root");
    if (root) {
      root.style.setProperty("--font-heading", `'${headingFont}', -apple-system, BlinkMacSystemFont, sans-serif`);
      root.style.setProperty("--font-body", `'${bodyFont}', -apple-system, BlinkMacSystemFont, sans-serif`);
    }
    this.updateUndoRedoUI();
  }

  setTypographyTarget(target) {
    this.typographyTarget = target === "body" ? "body" : "heading";
    this.render();
  }

  applyTypographyFont(font) {
    if (!state.currentProject) return;
    const heading = state.currentProject.branding.headingFont || "Inter";
    const body = state.currentProject.branding.bodyFont || "Inter";
    this.updateTypography(this.typographyTarget === "body" ? heading : font, this.typographyTarget === "body" ? font : body);
  }

  liveUpdateBusiness(field, value) {
    if (!state.currentProject) return;
    state.currentProject.business[field] = value;
    if (field === "name") {
      state.currentProject.name = value;
      const titleDisplay = document.getElementById("editor-title-display");
      if (titleDisplay) titleDisplay.textContent = value;
      document.querySelectorAll('[data-editable="brandName"]').forEach(el => el.textContent = value);
    }
    if (field === "phone") {
      document.querySelectorAll('[data-editable="phone"]').forEach(el => el.textContent = value);
    }
  }

  commitBusiness(field, value) {
    if (!state.currentProject) return;
    state.pushHistory(`Modification coordonnées prospect (${field})`);
    state.saveToStorage();
    this.updateUndoRedoUI();
  }

  updateUndoRedoUI() {
    const btnUndo = document.getElementById("btn-undo-header");
    const btnRedo = document.getElementById("btn-redo-header");
    if (btnUndo) {
      if (state.canUndo()) {
        btnUndo.classList.remove("opacity-30", "cursor-not-allowed");
      } else {
        btnUndo.classList.add("opacity-30", "cursor-not-allowed");
      }
    }
    if (btnRedo) {
      if (state.canRedo()) {
        btnRedo.classList.remove("opacity-30", "cursor-not-allowed");
      } else {
        btnRedo.classList.add("opacity-30", "cursor-not-allowed");
      }
    }
  }

  applyCopilotChip(prompt) {
    const input = document.getElementById("copilot-prompt-input");
    if (input) {
      input.value = prompt;
      const fakeEvent = { preventDefault: () => {} };
      this.submitCopilotPrompt(fakeEvent);
    }
  }

  // Copilot AI Submit with API call & local fallback
  async submitCopilotPrompt(e) {
    e.preventDefault();
    const input = document.getElementById("copilot-prompt-input");
    const promptText = input ? input.value : "";
    if (!promptText.trim()) return;
    if (!state.currentProject) return;
    const request = this.beginAIRequest("copilot");
    const canApply = () => {
      if (request.current()) return true;
      request.dispose();
      this.showToast("Proposition périmée : le projet a changé. Relancez votre demande.", "info");
      return false;
    };

    const targetRef = promptText.match(/#((?:E[A-Z0-9]{5})|(?:[a-z][a-z0-9-]*))/i)?.[1] || null;
    const resolvedTarget = targetRef ? resolveProjectUiTarget(state.currentProject, targetRef) : null;
    const targetId = resolvedTarget?.targetId || targetRef;
    const targetNode = targetId
      ? (document.querySelector(`[data-ui-id="${targetId}"]`) || (targetRef ? document.querySelector(`[data-ui-code="${targetRef.toUpperCase()}"]`) : null))
      : null;

    const feedback = document.getElementById("copilot-feedback");
    if (feedback) {
      feedback.innerHTML = `
        <div class="ai-state-indicator flex items-center gap-2 p-2 bg-amber-50 rounded-lg text-amber-900 border border-amber-200">
          <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span class="text-xs font-semibold">Analyse & Raisonnement en cours...</span>
        </div>
      `;
      feedback.classList.remove("hidden");
    }

    const renderApprovalCard = (summary, onApply) => {
      if (!canApply()) return;
      if (!feedback) {
        request.dispose();
        onApply();
        return;
      }
      feedback.innerHTML = `
        <div class="ai-approval-card border border-zinc-200 bg-white p-3.5 rounded-xl shadow-md space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              ${getIcon("sparkles", "w-3.5 h-3.5")} Proposition Studio IA
            </span>
            <span class="text-ui-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Confiance 96%
            </span>
          </div>
          <div class="ai-confidence-bar h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div class="ai-confidence-fill h-full rounded-full" style="width: 96%;"></div>
          </div>
          <p class="text-xs text-zinc-600 font-medium">${summary}</p>
          <div class="ai-approval-actions flex gap-2 pt-1">
            <button type="button" id="btn-approve-ai" class="btn-keycap btn-keycap-dark flex-1 py-1.5 text-xs font-bold text-white bg-zinc-900 rounded-lg shadow-xs inline-flex items-center justify-center gap-1.5">
              ${getIcon("check", "w-3.5 h-3.5")} Appliquer
            </button>
            <button type="button" id="btn-reject-ai" class="btn-keycap btn-keycap-light px-3 py-1.5 text-xs text-zinc-600 rounded-lg inline-flex items-center justify-center gap-1.5">
              ${getIcon("x", "w-3.5 h-3.5")} Ignorer
            </button>
          </div>
        </div>
      `;
      const btnApprove = document.getElementById("btn-approve-ai");
      const btnReject = document.getElementById("btn-reject-ai");
      if (btnApprove) {
        btnApprove.onclick = () => {
          if (!canApply()) return;
          request.dispose();
          onApply();
          feedback.innerHTML = `<div class="text-xs font-semibold text-emerald-700 p-2 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-1.5">${getIcon("checkCircle", "w-3.5 h-3.5")} Modification appliquée avec succès (Annulation ⌘Z possible)</div>`;
          if (input) input.value = "";
        };
      }
      if (btnReject) {
        btnReject.onclick = () => {
          request.dispose();
          feedback.classList.add("hidden");
          feedback.innerHTML = "";
        };
      }
    };

    try {
      const apiRes = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: promptText,
          project: state.currentProject,
          targetId,
          selectionContext: targetNode ? {
            sectionId: targetNode.closest("[data-section-id]")?.dataset.sectionId || null,
            componentType: targetNode.dataset.uiType || null
          } : null
        })
      });
      if (apiRes.ok) {
        const json = await apiRes.json();
        if (!canApply()) return;
        if (json.success && json.data) {
          const d = json.data;
          const updated = JSON.parse(JSON.stringify(state.currentProject));
          if (Array.isArray(d.operations) && d.operations.length > 0) {
            const targeted = applyCopilotOperations(updated, d.operations);
            if (targeted.applied.length > 0) {
              renderApprovalCard(d.summary || "Modification ciblée prête à être appliquée.", () => {
                state.updateProject(targeted.project, true, `Copilot ciblé: ${promptText}`);
              });
              return;
            }
          }
          let hasDirectChanges = false;
          if (d.suggestedPreset) {
            const p = getStylePresetById(d.suggestedPreset);
            if (p) {
              updated.branding.presetId = p.id;
              updated.branding.primaryColor = p.primaryColor;
              updated.branding.secondaryColor = p.secondaryColor;
              updated.branding.bgColor = p.bgColor;
              updated.branding.textColor = p.textColor;
              hasDirectChanges = true;
            }
          }
          if (d.borderRadius) { updated.branding.borderRadius = d.borderRadius; hasDirectChanges = true; }
          if (d.buttonRadius) { updated.branding.buttonRadius = d.buttonRadius; hasDirectChanges = true; }
          const hero = updated.sections.find(s => s.type === "hero");
          if (hero && hero.content) {
            if (d.updatedTitle) { hero.content.title = d.updatedTitle; hasDirectChanges = true; }
            if (d.updatedSubtitle) { hero.content.subtitle = d.updatedSubtitle; hasDirectChanges = true; }
            if (d.updatedBadge) { hero.content.badge = d.updatedBadge; hasDirectChanges = true; }
          }
          if (hasDirectChanges) {
            renderApprovalCard(d.summary || "Modifications prêtes à être appliquées par Gemini !", () => {
              state.updateProject(updated, true, `Copilot AI: ${promptText}`);
            });
            return;
          }
        }
      }
    } catch (err) {
      console.warn("API Copilot failed, using local engine:", err);
    }

    // Local fallback
    if (!canApply()) return;
    const res = processCopilotPrompt(state.currentProject, promptText);
    renderApprovalCard(res.message, () => {
      state.updateProject(res.project, true, `Copilot: ${promptText}`);
    });
  }

  // Project Level Actions
  duplicateProject(id) {
    state.duplicateProject(id);
  }

  deleteProject(id) {
    if (confirm("Supprimer ce projet ?")) {
      this._selectedProjectIds?.delete(id);
      state.deleteProject(id);
    }
  }

  toggleProjectSelection(projectId, selected) {
    this._selectedProjectIds ||= new Set();
    if (selected) this._selectedProjectIds.add(projectId);
    else this._selectedProjectIds.delete(projectId);
    this.syncProjectSelectionUI();
  }

  toggleSelectAllProjects(selected) {
    this._selectedProjectIds ||= new Set();
    const cards = [...document.querySelectorAll("#projects-grid .dashboard-v3-project")].filter(card => card.style.display !== "none");
    cards.forEach(card => {
      const id = card.dataset.projectId;
      if (!id) return;
      if (selected) this._selectedProjectIds.add(id);
      else this._selectedProjectIds.delete(id);
    });
    this.syncProjectSelectionUI();
  }

  clearProjectSelection() {
    this._selectedProjectIds = new Set();
    this.syncProjectSelectionUI();
  }

  syncProjectSelectionUI() {
    this._selectedProjectIds ||= new Set();
    const existingIds = new Set(state.projects.map(project => project.id));
    this._selectedProjectIds = new Set([...this._selectedProjectIds].filter(id => existingIds.has(id)));
    const cards = [...document.querySelectorAll("#projects-grid .dashboard-v3-project")];
    cards.forEach(card => {
      const selected = this._selectedProjectIds.has(card.dataset.projectId);
      card.classList.toggle("is-selected", selected);
      const input = card.querySelector("[data-project-select]");
      if (input) input.checked = selected;
    });
    const visibleCards = cards.filter(card => card.style.display !== "none");
    const visibleSelected = visibleCards.filter(card => this._selectedProjectIds.has(card.dataset.projectId)).length;
    const allInput = document.getElementById("project-select-all");
    if (allInput) {
      allInput.checked = visibleCards.length > 0 && visibleSelected === visibleCards.length;
      allInput.indeterminate = visibleSelected > 0 && visibleSelected < visibleCards.length;
    }
    const count = this._selectedProjectIds.size;
    const countLabel = document.querySelector("[data-project-selection-count]");
    if (countLabel) countLabel.textContent = `${count} sélectionné${count > 1 ? "s" : ""}`;
    document.querySelectorAll("[data-project-clear-selection], [data-project-bulk-delete]").forEach(button => { button.disabled = count === 0; });
  }

  deleteSelectedProjects() {
    const ids = [...(this._selectedProjectIds || [])].filter(id => state.projects.some(project => project.id === id));
    if (!ids.length) return;
    if (!confirm(`Supprimer ${ids.length} projet${ids.length > 1 ? "s" : ""} ?`)) return;
    this._selectedProjectIds = new Set();
    state.deleteProjects(ids);
  }

  updateStatus(projectId, newStatus) {
    const p = state.projects.find(x => x.id === projectId);
    if (p) {
      p.pipelineStatus = newStatus;
      state.saveToStorage();
      state.notify("status_updated");
    }
  }

  undo() {
    state.undo();
  }

  redo() {
    state.redo();
  }

  // Copy helper
  copyText(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      el.select();
      navigator.clipboard?.writeText(el.value);
      alert("✓ Copié dans le presse-papier !");
    }
  }

  // Filter projects in dashboard
  filterProjects(query) {
    const grid = document.getElementById("projects-grid");
    if (!grid) return;
    const q = (query || "").toLowerCase();
    const cards = grid.children;
    for (let card of cards) {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? "" : "none";
    }
    this.syncProjectSelectionUI();
  }

  // Standalone Exports
  exportHTML() {
    this.toggleExportMenu(false);
    if (state.currentProject) {
      downloadHTML(state.currentProject);
    }
  }

  exportJSON() {
    this.toggleExportMenu(false);
    if (state.currentProject) {
      downloadJSON(state.currentProject);
    }
  }

  printCommercialProposal() {
    const p = state.currentProject;
    if (!p) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Veuillez autoriser l'ouverture de fenêtres pop-up pour imprimer la proposition.");
      return;
    }

    const b = p.business;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Proposition Commerciale — ${b.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #18181b; background: #ffffff; }
          .header { border-bottom: 1.5px solid #18181b; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
          h1 { margin: 0; font-size: 22px; font-weight: 700; color: #09090b; }
          .sub { color: #52525b; font-weight: 500; font-size: 13px; margin-top: 5px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
          .card { border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px; background: #fafafa; }
          .card h3 { margin-top: 0; font-size: 14px; font-weight: 600; color: #18181b; border-bottom: 1px solid #e4e4e7; padding-bottom: 8px; }
          ul { padding-left: 18px; font-size: 13px; line-height: 1.8; color: #3f3f46; }
          .pricing { background: #fafafa; border: 1.5px solid #18181b; border-radius: 8px; padding: 24px; margin-top: 24px; }
          .price-val { font-size: 28px; font-weight: 800; color: #18181b; }
          .footer { margin-top: 40px; text-align: center; font-size: 11.5px; color: #a1a1aa; border-top: 1px solid #e4e4e7; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Proposition de Site Vitrine Professionnel</h1>
            <div class="sub">Destinée à : ${b.name} (${b.city})</div>
          </div>
          <div style="text-align: right; font-size: 13px; color: #71717a;">
            Date : ${new Date().toLocaleDateString('fr-FR')}<br>
            Conseiller : Michel
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <h3>Spécifications Incluses</h3>
            <ul>
              <li>Design responsive moderne optimisé smartphones</li>
              <li>Module interactif Avant / Après chantiers</li>
              <li>Simulateur de devis express en ligne</li>
              <li>Mise en avant des certifications & assurances décennales</li>
              <li>Avis clients Google intégrés</li>
              <li>Bouton d'appel direct & horaires d'urgence</li>
            </ul>
          </div>

          <div class="card">
            <h3>Informations Entreprise</h3>
            <ul>
              <li><strong>Raison sociale :</strong> ${b.name}</li>
              <li><strong>Activité :</strong> ${b.tradeLabel}</li>
              <li><strong>Zone :</strong> ${b.city} et alentours</li>
              <li><strong>Contact :</strong> ${b.phone}</li>
            </ul>
          </div>
        </div>

        <div class="pricing">
          <h3 style="margin-top:0; font-size: 15px; font-weight: 600;">Offre Spéciale Clé en Main</h3>
          <div class="price-val">990 € H.T. <span style="font-size:15px; color:#71717a; font-weight:normal;">(ou 89 € / mois hébergement & nom de domaine inclus)</span></div>
          <p style="font-size:13.5px; margin-top:8px; color:#52525b; line-height: 1.6;">
            Site déjà développé, configuré et prêt à être branché sur votre nom de domaine officiel sous 48 heures.
          </p>
        </div>

        <div class="footer">
          Document commercial non contractuel • Artisite Prospector v4.2.0
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  }

  // Fullscreen Presentation Mode (for cold calling / screen sharing)
  renderFullscreenPreview() {
    const project = state.currentProject;
    const isClientDemo = typeof window !== "undefined" && window.location && window.location.search.includes("demo=");

    // White-Label Client PIN Gate (MVP Feature 10)
    if (isClientDemo && project?.settings?.clientDemoPin && !this._clientUnlocked) {
      const bus = project.business || {};
      const trade = bus.tradeLabel || "Artisan";
      this.rootEl.innerHTML = `
        <div class="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans text-zinc-100">
          <div class="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center animate-fade-in">
            <div class="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mx-auto text-2xl text-emerald-400">
              ${getIcon("lock", "w-6 h-6")}
            </div>
            <div class="space-y-2">
              <span class="px-3 py-1 rounded-full text-ui-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Présentation Privée</span>
              <h1 class="text-xl font-bold text-white tracking-tight">${escapeHtml(bus.name || "Espace Client")}</h1>
              <p class="text-xs text-zinc-400 leading-relaxed">
                Cette démonstration interactive pour vos prestations de <strong>${escapeHtml(trade)}</strong> est protégée par un code confidentiel remis par votre conseiller.
              </p>
            </div>

            <form onsubmit="event.preventDefault(); const pin = this.querySelector('#client-pin-input').value; window.app.unlockClientDemo(pin);" class="space-y-4">
              <div class="space-y-1">
                <input type="password" id="client-pin-input" maxlength="6" inputmode="numeric" autofocus placeholder="• • • •" class="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-2xl py-3.5 text-center text-2xl tracking-[0.4em] font-mono text-white focus:outline-none transition-colors">
              </div>
              <button type="submit" class="w-full btn-cta bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider shadow-lg transition-all">
                Déverrouiller l'accès démo
              </button>
            </form>

            <div class="text-ui-sm text-zinc-500 pt-2 border-t border-zinc-800/60">
              Besoin d'assistance ? Contactez directement votre conseiller Michel.
            </div>
          </div>
        </div>
      `;
      return;
    }

    const siteHTML = renderWebsiteHTML(project, { isEditor: false, isStandalone: false });

    this.rootEl.innerHTML = `
      <div class="relative min-h-screen bg-zinc-950">
        
        <!-- The Clean Site Canvas without any editor chrome -->
        <div>
          ${siteHTML}
        </div>

      </div>
    `;

    this.initCanvasInteractivity();
    this.syncSiteThemeToggle();
    this.hydrateImageFallbacks();
    this.initSocialProofRotation();
  }

  // Interactive hooks for the canvas
  initCanvasInteractivity() {
    this.applyFreeformReparenting();
    document.querySelectorAll("[data-site-theme-toggle]").forEach(button => {
      button.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.toggleSiteTheme();
      };
    });

    this.initScrollObserver();

    // 1. Before / After SplitReveal slider (Multi-instances, Horizontal & Vertical, Keyboard Accessible)
    document.querySelectorAll(".ba-container, .split-reveal-container").forEach(container => {
      if (container.dataset.srReady) return;
      container.dataset.srReady = "true";

      const beforeWrapper = container.querySelector(".ba-img-before-wrapper, .sr-clipper");
      const beforeImg = container.querySelector(".ba-img-before, .sr-img-before");
      const handle = container.querySelector(".ba-handle, .sr-handle");
      const badge = container.querySelector(".sr-percent-badge");
      const isVertical = container.dataset.splitDirection === "vertical";

      if (beforeWrapper && handle) {
        const updateSlider = (coord) => {
          const rect = container.getBoundingClientRect();
          let percentage = 50;
          if (isVertical) {
            let posY = coord - rect.top;
            if (posY < 0) posY = 0;
            if (posY > rect.height) posY = rect.height;
            percentage = Math.round((posY / rect.height) * 100);
            beforeWrapper.style.clipPath = `polygon(0 0, 100% 0, 100% ${percentage}%, 0 ${percentage}%)`;
            beforeWrapper.style.width = "100%";
            handle.style.top = percentage + "%";
          } else {
            let posX = coord - rect.left;
            if (posX < 0) posX = 0;
            if (posX > rect.width) posX = rect.width;
            percentage = Math.round((posX / rect.width) * 100);
            beforeWrapper.style.width = percentage + "%";
            beforeWrapper.style.clipPath = "none";
            handle.style.left = percentage + "%";
            if (beforeImg) beforeImg.style.width = rect.width + "px";
          }
          container.dataset.splitPos = percentage;
          container.setAttribute("aria-valuenow", percentage);
          if (badge) badge.textContent = `${percentage}%`;
        };

        if (!container.dataset.resizeAttached) {
          container.dataset.resizeAttached = "true";
          window.addEventListener("resize", () => {
            if (!isVertical && beforeImg) {
              const rect = container.getBoundingClientRect();
              beforeImg.style.width = rect.width + "px";
            }
          });
        }

        handle.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          handle.setPointerCapture(e.pointerId);
          const onMove = (ev) => {
            updateSlider(isVertical ? ev.clientY : ev.clientX);
          };
          const onUp = (ev) => {
            try { handle.releasePointerCapture(ev.pointerId); } catch (err) {}
            handle.removeEventListener("pointermove", onMove);
            handle.removeEventListener("pointerup", onUp);
            handle.removeEventListener("pointercancel", onUp);
          };
          handle.addEventListener("pointermove", onMove);
          handle.addEventListener("pointerup", onUp);
          handle.addEventListener("pointercancel", onUp);
        });

        container.addEventListener("click", (e) => {
          if (e.target.closest("button") || e.target.closest(".sr-handle")) return;
          updateSlider(isVertical ? e.clientY : e.clientX);
        });

        // Keyboard WCAG support
        container.addEventListener("keydown", (e) => {
          let cur = Number(container.dataset.splitPos) || 50;
          const step = e.shiftKey ? 10 : 2;
          if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            const next = Math.max(0, cur - step);
            const rect = container.getBoundingClientRect();
            updateSlider(isVertical ? rect.top + (next / 100) * rect.height : rect.left + (next / 100) * rect.width);
          } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            const next = Math.min(100, cur + step);
            const rect = container.getBoundingClientRect();
            updateSlider(isVertical ? rect.top + (next / 100) * rect.height : rect.left + (next / 100) * rect.width);
          } else if (e.key === "Home") {
            e.preventDefault();
            const rect = container.getBoundingClientRect();
            updateSlider(isVertical ? rect.top : rect.left);
          } else if (e.key === "End") {
            e.preventDefault();
            const rect = container.getBoundingClientRect();
            updateSlider(isVertical ? rect.bottom : rect.right);
          }
        });

        setTimeout(() => {
          if (!isVertical && beforeImg) {
            const rect = container.getBoundingClientRect();
            beforeImg.style.width = rect.width + "px";
          }
        }, 100);
      }
    });

    // 2. FAQ accordions
    document.querySelectorAll(".faq-header").forEach(header => {
      header.onclick = () => {
        const item = header.closest(".faq-item");
        if (!item) return;
        const isOpen = item.classList.contains("active");
        document.querySelectorAll(".faq-item").forEach(el => {
          el.classList.remove("active");
          el.querySelector(".faq-header")?.setAttribute("aria-expanded", "false");
          const answer = el.querySelector(".faq-content");
          if (answer) answer.hidden = true;
        });
        if (!isOpen) {
          item.classList.add("active");
          header.setAttribute("aria-expanded", "true");
          const answer = item.querySelector(".faq-content");
          if (answer) answer.hidden = false;
        }
      };
    });

    // 3. Gallery Lightbox
    const lightboxModal = document.getElementById("lightbox-modal");
    const lightboxImg = document.getElementById("lightbox-target");
    if (lightboxModal && lightboxImg) {
      document.querySelectorAll("[data-lightbox]").forEach(el => {
        el.onclick = (e) => {
          e.preventDefault();
          const src = el.getAttribute("data-lightbox");
          lightboxImg.src = src;
          lightboxModal.style.display = "flex";
        };
      });

      lightboxModal.onclick = (e) => {
        if (e.target === lightboxModal || e.target.classList.contains("lightbox-close")) {
          lightboxModal.style.display = "none";
        }
      };
    }

    // 4. Quote Simulator Form
    const quoteForm = document.getElementById("quote-calc-form");
    if (quoteForm) {
      quoteForm.onsubmit = (e) => {
        e.preventDefault();
        const success = document.getElementById("quote-calc-success");
        if (success) {
          success.style.display = "block";
          quoteForm.style.display = "none";
        }
      };
    }

    // Draggable contact/WhatsApp bar. Position is persisted without rerendering
    // so dragging never interrupts the canvas or steals scroll ownership.
    const stickyBar = document.querySelector("[data-sticky-call-bar]");
    this._disposeStickyHeroVisibility?.();
    this._disposeStickyHeroVisibility = null;
    if (stickyBar && (state.currentView === "preview" || state.editorMode === "preview")) {
      const hero = document.querySelector(".hero-fullscreen");
      const updateStickyVisibility = () => {
        const heroBottom = hero?.getBoundingClientRect().bottom ?? 0;
        const obscured = heroBottom > window.innerHeight * 0.55;
        stickyBar.classList.toggle("is-hero-obscured", obscured);
        stickyBar.setAttribute("aria-hidden", String(obscured));
      };
      window.addEventListener("scroll", updateStickyVisibility, { passive: true });
      window.addEventListener("resize", updateStickyVisibility, { passive: true });
      updateStickyVisibility();
      this._disposeStickyHeroVisibility = () => {
        window.removeEventListener("scroll", updateStickyVisibility);
        window.removeEventListener("resize", updateStickyVisibility);
      };
    }
    const stickyHandle = stickyBar?.querySelector(".sticky-drag-handle");
    if (stickyBar && stickyHandle && !stickyHandle.dataset.bound) {
      stickyHandle.dataset.bound = "true";
      let dragging = false;
      let startX = 0;
      let startY = 0;
      let startLeft = 50;
      let startTop = null;
      const onMove = (event) => {
        if (!dragging) return;
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        const parentWidth = window.innerWidth || 1;
        const nextLeft = Math.max(8, Math.min(92, startLeft + (dx / parentWidth) * 100));
        const nextTop = Math.max(8, Math.min((window.innerHeight || 800) - stickyBar.offsetHeight - 8, (startTop ?? (window.innerHeight - stickyBar.offsetHeight - 16)) + dy));
        stickyBar.style.setProperty("--sticky-left", `${nextLeft}%`);
        stickyBar.style.setProperty("--sticky-top", `${nextTop}px`);
        stickyBar.style.bottom = "auto";
      };
      const onUp = () => {
        if (!dragging) return;
        dragging = false;
        stickyHandle.classList.remove("is-dragging");
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        const left = parseFloat(stickyBar.style.getPropertyValue("--sticky-left"));
        const top = parseFloat(stickyBar.style.getPropertyValue("--sticky-top"));
        if (state.currentProject && Number.isFinite(left) && Number.isFinite(top)) {
          state.currentProject.settings = { ...(state.currentProject.settings || {}), stickyBarPosition: { left, top } };
          state.saveToStorage();
        }
      };
      stickyHandle.onpointerdown = (event) => {
        event.preventDefault();
        dragging = true;
        startX = event.clientX;
        startY = event.clientY;
        const rect = stickyBar.getBoundingClientRect();
        startLeft = parseFloat(stickyBar.style.getPropertyValue("--sticky-left")) || ((rect.left + rect.width / 2) / (window.innerWidth || 1)) * 100;
        startTop = rect.top;
        stickyHandle.classList.add("is-dragging");
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp, { once: true });
      };
    }

    // Accessible CTA popovers & Direct Buttons
    document.querySelectorAll("[data-cta-popover-wrapper]").forEach(wrapper => {
      // The same CTA markup is used by the public site. Public links must keep
      // their native navigation; only the editor has contextual controls.
      if (wrapper.dataset.uiTarget !== "true") return;
      if (wrapper.dataset.ctaEditorBound === "true") return;
      wrapper.dataset.ctaEditorBound = "true";
      const setOpen = (open) => wrapper.setAttribute("aria-expanded", String(open));
      const togglePopover = () => {
        this.closeAllFloatingToolbars("cta");
        document.querySelectorAll("[data-cta-popover-wrapper].is-active").forEach(w => {
          if (w !== wrapper) {
            w.classList.remove("is-active");
            w.setAttribute("aria-expanded", "false");
          }
        });
        const open = wrapper.classList.toggle("is-active");
        setOpen(open);
      };
      let touchStart = null;
      wrapper.addEventListener("pointerdown", event => {
        if (event.pointerType !== "touch") return;
        touchStart = { x: event.clientX, y: event.clientY, editable: Boolean(event.target.closest("[data-editable]")) };
      });
      wrapper.addEventListener("pointerup", event => {
        if (event.pointerType !== "touch" || !touchStart) return;
        const distance = Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y);
        const editable = touchStart.editable || Boolean(event.target.closest("[data-editable]"));
        touchStart = null;
        if (distance >= 8 || editable || event.target.closest(".cta-context-popover, .cta-direct-badge")) return;
        event.preventDefault();
        event.stopPropagation();
        this._ctaTouchHandledAt = Date.now();
        togglePopover();
      });
      wrapper.addEventListener("mouseenter", () => setOpen(true));
      wrapper.addEventListener("mouseleave", () => {
        if (!wrapper.matches(":focus-within") && !wrapper.classList.contains("is-active")) {
          setOpen(false);
        }
      });
      wrapper.addEventListener("focusin", () => setOpen(true));
      wrapper.addEventListener("focusout", () => {
        requestAnimationFrame(() => {
          if (!wrapper.matches(":focus-within") && !wrapper.classList.contains("is-active")) setOpen(false);
        });
      });
      wrapper.addEventListener("click", event => {
        if (Date.now() - (this._ctaTouchHandledAt || 0) < 400) return;
        if (event.target.closest(".cta-context-popover") || event.target.closest(".cta-direct-badge")) return;
        event.preventDefault();

        // If clicking on the editable label inside the button, focus it for inline typing
        const editableSpan = event.target.closest("[data-editable]");
        if (editableSpan) {
          editableSpan.focus();
          return;
        }
        togglePopover();
      });
    });

    // Intercept clicks on links inside editor to prevent accidental page jumps or tel: popups
    document.querySelectorAll(".editor-section-wrapper a").forEach(link => {
      link.addEventListener("click", (e) => {
        if (!e.target.closest("[data-editable]")) {
          e.preventDefault();
        }
      });
    });

    if (!this._popoverEscapeBound) {
      document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;
        document.querySelectorAll("[data-cta-popover-wrapper].is-active").forEach(wrapper => {
          wrapper.classList.remove("is-active");
          wrapper.setAttribute("aria-expanded", "false");
        });
        this.hideFloatingTextToolbar();
      });
      this._popoverEscapeBound = true;
    }

    if (!this._ctaTouchClickGuardBound) {
      document.addEventListener("click", event => {
        if (Date.now() - (this._ctaTouchHandledAt || 0) >= 400) return;
        event.preventDefault();
        event.stopImmediatePropagation();
      }, true);
      this._ctaTouchClickGuardBound = true;
    }

    if (!this._popoverOutsideClickBound) {
      document.addEventListener("click", (e) => {
        if (Date.now() - (this._ctaTouchHandledAt || 0) < 400) return;
        if (!e.target.closest("[data-cta-popover-wrapper]")) {
          document.querySelectorAll("[data-cta-popover-wrapper].is-active").forEach(w => {
            w.classList.remove("is-active");
            w.setAttribute("aria-expanded", "false");
          });
        }
      });
      this._popoverOutsideClickBound = true;
    }

    if (!this._floatingTextDocClickBound) {
      document.addEventListener("click", (e) => {
        if (!e.target.closest("[data-editable]") && !e.target.closest("#floating-text-toolbar") && !e.target.closest(".cta-direct-badge")) {
          this.hideFloatingTextToolbar();
        }
      });
      this._floatingTextDocClickBound = true;
    }
  }

  ensureFreeformOverlay() {
    let overlay = document.getElementById("freeform-selection-box");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "freeform-selection-box";
      overlay.className = "freeform-selection-box";
      overlay.setAttribute("aria-hidden", "true");
      overlay.innerHTML = `
        <div class="freeform-selection-label">
          <span data-freeform-label>Élément</span>
          <button type="button" data-freeform-additive title="Ajouter/retirer des éléments à la sélection" aria-label="Mode multi-sélection" aria-pressed="false">Multi +</button>
          <button type="button" data-freeform-group title="Grouper la sélection">Grouper</button>
          <button type="button" data-freeform-ungroup title="Dégrouper la sélection">Dégrouper</button>
          <button type="button" data-freeform-reset title="Réinitialiser position et taille">Reset</button>
        </div>
        <button type="button" class="freeform-move-handle" data-freeform-action="move" aria-label="Déplacer la sélection">${getIcon("move", "w-3.5 h-3.5")}</button>
        ${["nw","n","ne","e","se","s","sw","w"].map(handle => `<button type="button" class="freeform-resize-handle freeform-resize-${handle}" data-freeform-action="resize" data-freeform-handle="${handle}" aria-label="Redimensionner ${handle}"></button>`).join("")}
        <button type="button" class="freeform-rotate-handle" data-freeform-rotate aria-label="Faire pivoter la sélection" title="Faire pivoter · Shift = pas de 15°">↻</button>
        <div class="freeform-layerbar" role="toolbar" aria-label="Ordre et verrouillage du calque">
          <button type="button" data-freeform-layer="back" title="Envoyer à l’arrière-plan" aria-label="Envoyer à l’arrière-plan">⇤</button>
          <button type="button" data-freeform-layer="backward" title="Reculer d’un plan" aria-label="Reculer d’un plan">−</button>
          <button type="button" data-freeform-layer="forward" title="Avancer d’un plan" aria-label="Avancer d’un plan">+</button>
          <button type="button" data-freeform-layer="front" title="Mettre au premier plan" aria-label="Mettre au premier plan">⇥</button>
          <span></span>
          <button type="button" data-freeform-cross-section title="Autoriser le déplacement entre sections" aria-label="Déplacement entre sections" aria-pressed="false">Entre sections</button>
          <button type="button" data-freeform-responsive-toggle title="Ouvrir les outils responsive" aria-label="Ouvrir les outils responsive" aria-expanded="false">Responsive</button>
          <button type="button" data-freeform-ratio title="Verrouiller le ratio largeur/hauteur" aria-label="Verrouiller le ratio largeur/hauteur">Proportions libres</button>
          <button type="button" data-freeform-lock title="Verrouiller la sélection" aria-label="Verrouiller la sélection">Verrouiller</button>
        </div>
        <div class="freeform-responsivebar" role="toolbar" aria-label="Adapter la sélection aux breakpoints">
          <span data-freeform-responsive-label>Responsive</span>
          <button type="button" data-freeform-copy="desktop" title="Adapter vers ordinateur">Adapter au bureau</button>
          <button type="button" data-freeform-copy="tablet" title="Adapter vers tablette">Adapter à la tablette</button>
          <button type="button" data-freeform-copy="mobile" title="Adapter vers mobile">Adapter au mobile</button>
          <button type="button" data-freeform-inherit-desktop title="Adapter Desktop vers le breakpoint actuel">Reprendre la version bureau</button>
          <button type="button" data-freeform-breakpoint-reset title="Réinitialiser la sélection sur ce breakpoint">Réinitialiser ici</button>
        </div>
        <div class="freeform-alignbar" role="toolbar" aria-label="Aligner et distribuer la sélection">
          <button type="button" data-freeform-align="left" title="Aligner à gauche" aria-label="Aligner à gauche">L</button>
          <button type="button" data-freeform-align="center" title="Centrer horizontalement" aria-label="Centrer horizontalement">C</button>
          <button type="button" data-freeform-align="right" title="Aligner à droite" aria-label="Aligner à droite">R</button>
          <span></span>
          <button type="button" data-freeform-align="top" title="Aligner en haut" aria-label="Aligner en haut">T</button>
          <button type="button" data-freeform-align="middle" title="Centrer verticalement" aria-label="Centrer verticalement">M</button>
          <button type="button" data-freeform-align="bottom" title="Aligner en bas" aria-label="Aligner en bas">B</button>
          <span></span>
          <button type="button" data-freeform-distribute="horizontal" title="Distribuer horizontalement" aria-label="Distribuer horizontalement">H↔</button>
          <button type="button" data-freeform-distribute="vertical" title="Distribuer verticalement" aria-label="Distribuer verticalement">V↕</button>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelectorAll("[data-freeform-action]").forEach(handle => {
        handle.addEventListener("pointerdown", event => this.startFreeformInteraction(event, handle.dataset.freeformAction, handle.dataset.freeformHandle || ""));
      });
      overlay.querySelector("[data-freeform-rotate]")?.addEventListener("pointerdown", event => this.startFreeformRotation(event));
      overlay.querySelector("[data-freeform-additive]")?.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        this._freeformAdditiveMode = !this._freeformAdditiveMode;
        this.updateFreeformOverlay();
      });
      overlay.querySelector("[data-freeform-reset]")?.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        this.resetFreeformSelection();
      });
      overlay.querySelector("[data-freeform-group]")?.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        this.groupFreeformSelection();
      });
      overlay.querySelector("[data-freeform-ungroup]")?.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        this.ungroupFreeformSelection();
      });
      overlay.querySelector("[data-freeform-cross-section]")?.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        this._freeformCrossSectionMode = !this._freeformCrossSectionMode;
        this.updateFreeformOverlay();
      });
      overlay.querySelector("[data-freeform-responsive-toggle]")?.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        const bar = overlay.querySelector(".freeform-responsivebar");
        const open = !bar?.classList.contains("is-open");
        bar?.classList.toggle("is-open", open);
        event.currentTarget.setAttribute("aria-expanded", open ? "true" : "false");
        this.updateFreeformOverlay();
      });
      overlay.querySelectorAll("[data-freeform-copy]").forEach(button => {
        button.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          this.copyFreeformSelectionToViewport(button.dataset.freeformCopy);
        });
      });
      overlay.querySelector("[data-freeform-inherit-desktop]")?.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        this.copyFreeformSelectionToViewport(state.viewport, "desktop");
      });
      overlay.querySelector("[data-freeform-breakpoint-reset]")?.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        this.resetFreeformSelection();
      });
      overlay.querySelectorAll("[data-freeform-align]").forEach(button => {
        button.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          this.alignFreeformSelection(button.dataset.freeformAlign);
        });
      });
      overlay.querySelectorAll("[data-freeform-distribute]").forEach(button => {
        button.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          this.distributeFreeformSelection(button.dataset.freeformDistribute);
        });
      });
      overlay.querySelectorAll("[data-freeform-layer]").forEach(button => {
        button.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          this.changeFreeformLayerOrder(button.dataset.freeformLayer);
        });
      });
      overlay.querySelector("[data-freeform-ratio]")?.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        this.toggleFreeformAspectLock();
      });
      overlay.querySelector("[data-freeform-lock]")?.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        this.toggleFreeformSelectionLock();
      });
    }
    this._freeformOverlay = overlay;
    return overlay;
  }

  getFreeformSelectedKeys() {
    const keys = Array.isArray(this._freeformSelectedKeys) ? this._freeformSelectedKeys.filter(Boolean) : [];
    if (keys.length) return [...new Set(keys)];
    return this._freeformSelectedKey ? [this._freeformSelectedKey] : [];
  }

  isFreeformLocked(layoutKey) {
    return Boolean(layoutKey && state.currentProject?.freeformLocked?.[layoutKey]);
  }

  isFreeformSelectionLocked(layoutKeys = this.getFreeformSelectedKeys()) {
    return layoutKeys.some(key => this.isFreeformLocked(key));
  }

  getFreeformGroupForKey(layoutKey) {
    if (!layoutKey) return null;
    const groups = state.currentProject?.freeformGroups || {};
    const matches = Object.values(groups).filter(group => Array.isArray(group?.members) && group.members.includes(layoutKey));
    if (!matches.length) return null;
    return matches.find(group => !group.parentId || !groups[group.parentId]) || matches[0];
  }

  getExactFreeformGroup(layoutKeys = this.getFreeformSelectedKeys()) {
    const keys = [...new Set(layoutKeys.filter(Boolean))].sort();
    if (keys.length < 2) return null;
    const groups = state.currentProject?.freeformGroups || {};
    const matches = Object.values(groups).filter(group => {
      const members = Array.isArray(group?.members) ? [...new Set(group.members)].sort() : [];
      return members.length === keys.length && members.every((key, index) => key === keys[index]);
    });
    return matches.find(group => !group.parentId || !groups[group.parentId]) || matches[0] || null;
  }

  selectFreeformKeys(layoutKeys = [], primaryKey = null) {
    const canvas = document.getElementById("canvas-container");
    if (!canvas) return;
    const keys = [...new Set(layoutKeys.filter(Boolean))].filter(key => canvas.querySelector(`[data-layout-key="${key}"]`));
    if (!keys.length) {
      this.clearFreeformSelection();
      return;
    }
    this.closeAllFloatingToolbars("freeform");
    this._freeformSelectedKeys = keys;
    this._freeformSelectedKey = primaryKey && keys.includes(primaryKey) ? primaryKey : keys[0];
    // L'inspecteur a besoin de la clé de l'élément pour proposer ses réglages.
    state.selectedElementKey = this._freeformSelectedKey;
    this.updateStageContext();
    this.updateSelectedSectionUI();
    this._freeformSelectedElement = canvas.querySelector(`[data-layout-key="${this._freeformSelectedKey}"]`);
    const responsiveBar = this._freeformOverlay?.querySelector?.(".freeform-responsivebar");
    responsiveBar?.classList.remove("is-open");
    this._freeformOverlay?.querySelector?.("[data-freeform-responsive-toggle]")?.setAttribute("aria-expanded", "false");
    document.querySelectorAll("#canvas-container [data-layout-key].is-freeform-selected").forEach(el => el.classList.remove("is-freeform-selected"));
    keys.forEach(key => canvas.querySelector(`[data-layout-key="${key}"]`)?.classList.add("is-freeform-selected"));
    const overlay = this.ensureFreeformOverlay();
    overlay.classList.add("is-visible");
    overlay.setAttribute("aria-hidden", "false");
    this.updateFreeformOverlay();
  }

  resolveFreeformPointerTarget(rawTarget, canvas, { parentStep = false } = {}) {
    let target = rawTarget?.closest?.("[data-layout-key]") || null;
    if (!target || !canvas?.contains(target)) return null;
    if (!parentStep) return target;
    const selected = this._freeformSelectedElement;
    const basis = selected?.isConnected && selected.contains(rawTarget) ? selected : target;
    return basis.parentElement?.closest?.("[data-layout-key]") || target;
  }

  editButtonLayout(sectionId, buttonType) {
    const canvas = document.getElementById("canvas-container");
    const target = [...(canvas?.querySelectorAll?.("[data-cta-popover-wrapper]") || [])]
      .find(element => element.dataset.sectionId === String(sectionId)
        && element.dataset.buttonType === String(buttonType));
    if (!target) {
      this.showToast?.("Bouton introuvable dans le canevas", "error");
      return false;
    }
    this.closeAllFloatingToolbars("freeform");
    this.selectFreeformTarget(target, { ignoreGroup: true });
    return true;
  }

  selectFreeformTarget(target, options = {}) {
    if (!target || !target.dataset?.layoutKey) return;
    const key = target.dataset.layoutKey;
    if (options.additive) {
      const current = this.getFreeformSelectedKeys();
      const group = options.ignoreGroup ? null : this.getFreeformGroupForKey(key);
      const unitKeys = group?.members?.length ? group.members : [key];
      const unitSelected = unitKeys.every(item => current.includes(item));
      const next = unitSelected
        ? current.filter(item => !unitKeys.includes(item))
        : [...new Set([...current, ...unitKeys])];
      this.selectFreeformKeys(next, key);
      return;
    }
    const group = options.ignoreGroup ? null : this.getFreeformGroupForKey(key);
    this.selectFreeformKeys(group?.members?.length ? group.members : [key], key);
  }

  clearFreeformSelection() {
    document.querySelectorAll("#canvas-container [data-layout-key].is-freeform-selected").forEach(el => el.classList.remove("is-freeform-selected"));
    this._freeformSelectedElements = [];
    this._freeformSelectedKeys = [];
    this._freeformSelectedElement = null;
    this._freeformSelectedKey = null;
    this._freeformAdditiveMode = false;
    this._freeformCrossSectionMode = false;
    this.clearFreeformReparentTarget();
    if (this._freeformOverlay) {
      this._freeformOverlay.classList.remove("is-visible", "is-multi", "is-group", "is-locked");
      this._freeformOverlay.setAttribute("aria-hidden", "true");
    }
    if (document.body?.dataset.activeEditorToolbar === "freeform") {
      delete document.body.dataset.activeEditorToolbar;
    }
    this.hideFreeformGuides();
    this.hideFreeformSpacingGuides();
  }

  updateFreeformOverlay() {
    const overlay = this._freeformOverlay;
    const canvas = document.getElementById("canvas-container");
    const keys = this.getFreeformSelectedKeys();
    if (!overlay || !canvas || !keys.length || state.editorMode === "preview") {
      overlay?.classList.remove("is-visible");
      return;
    }
    const elements = keys.map(key => canvas.querySelector(`[data-layout-key="${key}"]`)).filter(el => el?.isConnected);
    if (!elements.length) {
      overlay.classList.remove("is-visible");
      return;
    }
    this._freeformSelectedElements = elements;
    this._freeformSelectedElement = canvas.querySelector(`[data-layout-key="${this._freeformSelectedKey}"]`) || elements[0];
    const rects = elements.map(el => el.getBoundingClientRect()).filter(rect => rect.width > 0 && rect.height > 0);
    if (!rects.length) {
      overlay.classList.remove("is-visible");
      return;
    }
    const left = Math.min(...rects.map(rect => rect.left));
    const top = Math.min(...rects.map(rect => rect.top));
    const right = Math.max(...rects.map(rect => rect.right));
    const bottom = Math.max(...rects.map(rect => rect.bottom));
    overlay.style.left = `${left}px`;
    overlay.style.top = `${top}px`;
    overlay.style.width = `${right - left}px`;
    overlay.style.height = `${bottom - top}px`;
    overlay.classList.add("is-visible");
    overlay.classList.toggle("is-multi", keys.length > 1);
    overlay.classList.toggle("is-cta", elements.length === 1 && elements[0].matches?.("[data-cta-popover-wrapper]"));
    const exactGroup = this.getExactFreeformGroup(keys);
    const selectionLocked = this.isFreeformSelectionLocked(keys);
    overlay.classList.toggle("is-group", Boolean(exactGroup));
    overlay.classList.toggle("is-locked", selectionLocked);
    const label = overlay.querySelector("[data-freeform-label]");
    const labelBar = overlay.querySelector(".freeform-selection-label");
    const moveHandle = overlay.querySelector(".freeform-move-handle");
    const rotateHandle = overlay.querySelector(".freeform-rotate-handle");
    const alignBar = overlay.querySelector(".freeform-alignbar");
    const layerBar = overlay.querySelector(".freeform-layerbar");
    const responsiveBar = overlay.querySelector(".freeform-responsivebar");
    const controlsInside = top < 40;
    const controlsTop = controlsInside ? Math.max(bottom - top + 8, 8) : -34;
    if (labelBar) labelBar.style.top = `${controlsTop}px`;
    if (moveHandle) {
      moveHandle.style.left = "18px";
      moveHandle.style.top = "18px";
    }
    if (rotateHandle) {
      rotateHandle.style.top = "2px";
      rotateHandle.style.right = "2px";
    }
    const toolbarStack = [
      keys.length > 1 && !selectionLocked ? alignBar : null,
      layerBar,
      responsiveBar?.classList.contains("is-open") ? responsiveBar : null
    ].filter(Boolean);
    const toolbarGap = 6;
    const toolbarMetrics = toolbarStack.map(bar => {
      bar.style.maxWidth = `${Math.max(240, window.innerWidth - 16)}px`;
      return { bar, width: Math.min(bar.offsetWidth || 280, window.innerWidth - 16), height: bar.offsetHeight || 38 };
    });
    const stackHeight = toolbarMetrics.reduce((sum, item) => sum + item.height, 0) + Math.max(0, toolbarMetrics.length - 1) * toolbarGap;
    const belowTop = bottom + 10 + (controlsInside ? 44 : 0);
    const aboveTop = top - stackHeight - 10;
    const stackTop = belowTop + stackHeight <= window.innerHeight - 8
      ? belowTop
      : Math.max(8, aboveTop);
    let toolbarTop = stackTop;
    toolbarMetrics.forEach(({ bar, width, height }) => {
      const desiredLeft = Math.max(8, Math.min(window.innerWidth - width - 8, (left + right - width) / 2));
      bar.style.left = `${desiredLeft - left}px`;
      bar.style.top = `${toolbarTop - top}px`;
      bar.style.translate = "0 0";
      toolbarTop += height + toolbarGap;
    });
    if (responsiveBar) {
      responsiveBar.classList.toggle("is-disabled", selectionLocked);
      responsiveBar.querySelectorAll("[data-freeform-copy]").forEach(button => { button.hidden = button.dataset.freeformCopy === state.viewport; });
      const inheritButton = responsiveBar.querySelector("[data-freeform-inherit-desktop]");
      if (inheritButton) inheritButton.hidden = state.viewport === "desktop";
      const viewportLabel = responsiveBar.querySelector("[data-freeform-responsive-label]");
      if (viewportLabel) viewportLabel.textContent = state.viewport === "desktop" ? "Desktop" : state.viewport === "tablet" ? "Tablette" : "Mobile";
    }
    if (label) {
      const primaryLabel = this._freeformSelectedElement?.dataset?.layoutLabel || `#${keys[0]}`;
      const primaryRotation = Number(this.getFreeformLayout(this._freeformSelectedKey, state.viewport)?.rotation) || 0;
      const rotationText = Math.abs(primaryRotation) > 0.01 ? ` · ${Math.round(primaryRotation)}°` : "";
      label.textContent = keys.length > 1
        ? `${keys.length} éléments · ${Math.round(right - left)}×${Math.round(bottom - top)}${rotationText}`
        : `${primaryLabel} · ${Math.round(right - left)}×${Math.round(bottom - top)}${rotationText}`;
    }
    const crossSectionButton = overlay.querySelector("[data-freeform-cross-section]");
    if (crossSectionButton) {
      const active = Boolean(this._freeformCrossSectionMode);
      crossSectionButton.classList.toggle("is-active", active);
      crossSectionButton.setAttribute("aria-pressed", active ? "true" : "false");
      crossSectionButton.textContent = active ? "Entre sections ✓" : "Entre sections";
    }
    const additiveButton = overlay.querySelector("[data-freeform-additive]");
    if (additiveButton) {
      const active = Boolean(this._freeformAdditiveMode);
      additiveButton.classList.toggle("is-active", active);
      additiveButton.setAttribute("aria-pressed", active ? "true" : "false");
      additiveButton.textContent = active ? "Multi ✓" : "Multi +";
    }
    const groupButton = overlay.querySelector("[data-freeform-group]");
    const ungroupButton = overlay.querySelector("[data-freeform-ungroup]");
    const resetButton = overlay.querySelector("[data-freeform-reset]");
    const ratioButton = overlay.querySelector("[data-freeform-ratio]");
    const lockButton = overlay.querySelector("[data-freeform-lock]");
    if (groupButton) groupButton.hidden = selectionLocked || keys.length < 2 || Boolean(exactGroup);
    if (ungroupButton) ungroupButton.hidden = selectionLocked || !exactGroup;
    if (resetButton) resetButton.hidden = selectionLocked;
    if (ratioButton) {
      const aspectLocked = keys.length === 1 && this.getFreeformLayout(keys[0], state.viewport)?.aspectLocked === true;
      ratioButton.hidden = selectionLocked || keys.length !== 1;
      ratioButton.textContent = aspectLocked ? "Proportions bloquées" : "Proportions libres";
      ratioButton.setAttribute("aria-pressed", aspectLocked ? "true" : "false");
      ratioButton.title = aspectLocked ? "Libérer le ratio largeur/hauteur" : "Verrouiller le ratio largeur/hauteur";
    }
    if (lockButton) {
      lockButton.textContent = selectionLocked ? "Déverrouiller" : "Verrouiller";
      lockButton.setAttribute("aria-label", selectionLocked ? "Déverrouiller la sélection" : "Verrouiller la sélection");
      lockButton.title = selectionLocked ? "Déverrouiller la sélection" : "Verrouiller la sélection";
    }
  }

  getFreeformRuntimeViewport(root = document.querySelector(".artisite-root")) {
    const canvas = document.getElementById("canvas-container");
    if (canvas && root && canvas.contains(root) && ["desktop", "tablet", "mobile"].includes(canvas.dataset.viewport)) return canvas.dataset.viewport;
    const width = root?.getBoundingClientRect?.().width || window.innerWidth;
    return width < 640 ? "mobile" : (width < 1024 ? "tablet" : "desktop");
  }

  ensureFreeformReparentLayer(section) {
    if (!section) return null;
    const sectionId = section.dataset.sectionId || "section";
    let layer = [...section.children].find(child => child?.dataset?.freeformReparentLayer === sectionId);
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "freeform-reparent-layer";
      layer.dataset.freeformReparentLayer = sectionId;
      Object.assign(layer.style, { position: "absolute", inset: "0", pointerEvents: "none", overflow: "visible" });
      if (getComputedStyle(section).position === "static") section.style.position = "relative";
      section.appendChild(layer);
    }
    return layer;
  }

  applyFreeformReparenting(root = document.querySelector(".artisite-root")) {
    if (!root) return;
    const viewport = this.getFreeformRuntimeViewport(root);
    const attr = `data-freeform-parent-${viewport}`;
    const sections = [...root.querySelectorAll(".editor-section-wrapper[data-section-id], .site-section[data-section-id]")];
    root.querySelectorAll("[data-layout-key]").forEach(element => {
      const key = element.dataset.layoutKey;
      if (!key) return;
      const parentSectionId = element.getAttribute(attr) || "";
      const placeholder = root.querySelector(`[data-freeform-placeholder="${key}"]`);
      if (!parentSectionId) {
        if (placeholder) placeholder.replaceWith(element);
        return;
      }
      const section = sections.find(candidate => candidate.dataset.sectionId === parentSectionId);
      if (!section) return;
      if (!placeholder && !element.closest(".freeform-reparent-layer")) {
        const marker = document.createElement("span");
        marker.hidden = true;
        marker.dataset.freeformPlaceholder = key;
        element.before(marker);
      }
      const layer = this.ensureFreeformReparentLayer(section);
      if (layer && element.parentElement !== layer) layer.appendChild(element);
      element.style.pointerEvents = "auto";
    });
  }

  clearFreeformReparentTarget() {
    document.querySelectorAll(".editor-section-wrapper.is-freeform-reparent-target").forEach(section => section.classList.remove("is-freeform-reparent-target"));
    this._freeformReparentTarget = null;
  }

  findFreeformReparentTarget(rect) {
    if (!rect) return null;
    const cx = (rect.left + rect.right) / 2;
    const cy = (rect.top + rect.bottom) / 2;
    return [...document.querySelectorAll(".editor-section-wrapper[data-section-id]")].find(section => {
      const candidate = section.getBoundingClientRect();
      return cx >= candidate.left && cx <= candidate.right && cy >= candidate.top && cy <= candidate.bottom;
    }) || null;
  }

  setFreeformReparentTarget(section) {
    if (this._freeformReparentTarget === section) return;
    this.clearFreeformReparentTarget();
    if (section) {
      section.classList.add("is-freeform-reparent-target");
      this._freeformReparentTarget = section;
    }
  }

  fitFreeformVisualBox(element, layout, desiredRect) {
    const fitted = { ...layout, x: 0, y: 0, width: Math.max(1, desiredRect.width), height: Math.max(1, desiredRect.height) };
    for (let pass = 0; pass < 4; pass += 1) {
      this.applyFreeformLiveStyle(element, fitted, false);
      const painted = element.getBoundingClientRect();
      if (!(painted.width > 0 && painted.height > 0)) break;
      const widthRatio = desiredRect.width / painted.width;
      const heightRatio = desiredRect.height / painted.height;
      if (Math.abs(widthRatio - 1) < 0.002 && Math.abs(heightRatio - 1) < 0.002) break;
      fitted.width = Math.max(1, fitted.width * widthRatio);
      fitted.height = Math.max(1, fitted.height * heightRatio);
    }
    this.applyFreeformLiveStyle(element, fitted, false);
    return fitted;
  }

  commitFreeformReparent(entries, liveUpdates, targetSection) {
    const targetSectionId = targetSection?.dataset?.sectionId;
    if (!targetSectionId || !entries?.length) return false;
    const currentSections = new Set(entries.map(entry => entry.target.closest(".editor-section-wrapper")?.dataset?.sectionId).filter(Boolean));
    if (currentSections.size === 1 && currentSections.has(targetSectionId)) return false;
    const layer = this.ensureFreeformReparentLayer(targetSection);
    if (!layer) return false;
    const updates = {};
    entries.forEach(entry => {
      const element = entry.target;
      const key = entry.key;
      const desiredRect = element.getBoundingClientRect();
      const live = { ...(liveUpdates[key] || entry.base || {}) };
      const placeholder = document.querySelector(`[data-freeform-placeholder="${key}"]`);

      if (!placeholder && !element.closest(".freeform-reparent-layer")) {
        const marker = document.createElement("span");
        marker.hidden = true;
        marker.dataset.freeformPlaceholder = key;
        element.before(marker);
      }
      layer.appendChild(element);
      const detached = this.fitFreeformVisualBox(element, { ...live, parentSectionId: targetSectionId }, desiredRect);
      const zeroRect = element.getBoundingClientRect();
      detached.x = desiredRect.left - zeroRect.left;
      detached.y = desiredRect.top - zeroRect.top;
      updates[key] = detached;
      this.applyFreeformLiveStyle(element, detached, false);
    });
    state.setFreeformLayouts(updates, state.viewport, entries.length > 1 ? "Déplacer la sélection vers une section" : "Déplacer vers une section");
    return true;
  }

  getFreeformLayout(layoutKey = this._freeformSelectedKey, viewport = state.viewport) {
    return state.currentProject?.freeformLayout?.[viewport]?.[layoutKey] || { x: 0, y: 0 };
  }

  applyFreeformLiveStyle(target, layout, updateOverlay = true) {
    if (!target || !layout) return;
    const reparented = typeof layout.parentSectionId === "string" && layout.parentSectionId.trim();
    target.style.setProperty("position", reparented ? "absolute" : "relative", "important");
    if (reparented) {
      target.style.setProperty("left", `${Number(layout.x) || 0}px`, "important");
      target.style.setProperty("top", `${Number(layout.y) || 0}px`, "important");
      target.style.setProperty("translate", "0 0", "important");
    } else {
      target.style.removeProperty("left");
      target.style.removeProperty("top");
      target.style.setProperty("translate", `${Number(layout.x) || 0}px ${Number(layout.y) || 0}px`, "important");
    }
    if (Number.isFinite(Number(layout.width)) && Number(layout.width) > 0) {
      target.style.setProperty("width", `${layout.width}px`, "important");
      target.style.setProperty("min-width", "0", "important");
      target.style.setProperty("max-width", "none", "important");
    }
    if (Number.isFinite(Number(layout.height)) && Number(layout.height) > 0) {
      target.style.setProperty("height", `${layout.height}px`, "important");
      target.style.setProperty("min-height", "0", "important");
      target.style.setProperty("max-height", "none", "important");
    }
    const scaleX = Number(layout.scaleX);
    const scaleY = Number(layout.scaleY);
    if ((Number.isFinite(scaleX) && scaleX > 0.02) || (Number.isFinite(scaleY) && scaleY > 0.02)) {
      target.style.setProperty("scale", `${Number.isFinite(scaleX) && scaleX > 0.02 ? scaleX : 1} ${Number.isFinite(scaleY) && scaleY > 0.02 ? scaleY : 1}`, "important");
      target.style.setProperty("transform-origin", "50% 50%", "important");
    }
    const rotation = Number(layout.rotation);
    if (Number.isFinite(rotation)) target.style.setProperty("rotate", `${rotation}deg`, "important");
    const hasScale = (Number.isFinite(scaleX) && scaleX > 0.02) || (Number.isFinite(scaleY) && scaleY > 0.02);
    const hasRotation = Number.isFinite(rotation) && Math.abs(rotation) > 0.001;
    if (hasRotation && !hasScale) target.style.setProperty("transform-origin", "50% 50%", "important");
    if (!hasRotation && !hasScale) target.style.removeProperty("transform-origin");
    if (updateOverlay) this.updateFreeformOverlay();
  }

  getFreeformSelectionBoundary(elements = []) {
    const canvasRect = document.getElementById("canvas-container")?.getBoundingClientRect();
    if (elements.length === 1) {
      const parentBoundary = elements[0].parentElement?.closest?.("[data-layout-key]");
      if (parentBoundary && parentBoundary !== elements[0]) {
        return parentBoundary.getBoundingClientRect();
      }
    }
    const sections = [...new Set(elements.map(el => el.closest(".editor-section-wrapper")).filter(Boolean))];
    return sections.length === 1 ? sections[0].getBoundingClientRect() : canvasRect;
  }

  ensureFreeformGuides() {
    const ensure = axis => {
      let guide = document.getElementById(`freeform-snap-guide-${axis}`);
      if (!guide) {
        guide = document.createElement("div");
        guide.id = `freeform-snap-guide-${axis}`;
        guide.className = `freeform-snap-guide freeform-snap-guide-${axis}`;
        guide.setAttribute("aria-hidden", "true");
        document.body.appendChild(guide);
      }
      return guide;
    };
    this._freeformGuideX = ensure("x");
    this._freeformGuideY = ensure("y");
    return { x: this._freeformGuideX, y: this._freeformGuideY };
  }

  hideFreeformGuides() {
    [this._freeformGuideX, this._freeformGuideY].forEach(guide => guide?.classList.remove("is-visible"));
  }

  ensureFreeformSpacingGuides() {
    const ensure = id => {
      let node = document.getElementById(id);
      if (!node) {
        node = document.createElement("div");
        node.id = id;
        node.className = id.includes("label") ? "freeform-spacing-label" : "freeform-spacing-guide";
        node.setAttribute("aria-hidden", "true");
        document.body.appendChild(node);
      }
      return node;
    };
    this._freeformSpacingXBefore = ensure("freeform-spacing-x-before");
    this._freeformSpacingXAfter = ensure("freeform-spacing-x-after");
    this._freeformSpacingXLabel = ensure("freeform-spacing-x-label");
    this._freeformSpacingYBefore = ensure("freeform-spacing-y-before");
    this._freeformSpacingYAfter = ensure("freeform-spacing-y-after");
    this._freeformSpacingYLabel = ensure("freeform-spacing-y-label");
  }

  hideFreeformSpacingGuides() {
    [this._freeformSpacingXBefore, this._freeformSpacingXAfter, this._freeformSpacingXLabel, this._freeformSpacingYBefore, this._freeformSpacingYAfter, this._freeformSpacingYLabel]
      .forEach(node => node?.classList.remove("is-visible"));
  }

  showFreeformSpacingGuides(spacingX, spacingY, selectionRect) {
    this.ensureFreeformSpacingGuides();
    this.hideFreeformSpacingGuides();
    if (spacingX) {
      const gap = Math.max(0, spacingX.gap);
      const y = Math.max(8, Math.min(window.innerHeight - 8, selectionRect.top + (selectionRect.bottom - selectionRect.top) / 2));
      const beforeWidth = Math.max(0, selectionRect.left - spacingX.before.right);
      const afterWidth = Math.max(0, spacingX.after.left - selectionRect.right);
      Object.assign(this._freeformSpacingXBefore.style, { left: `${spacingX.before.right}px`, top: `${y}px`, width: `${beforeWidth}px` });
      Object.assign(this._freeformSpacingXAfter.style, { left: `${selectionRect.right}px`, top: `${y}px`, width: `${afterWidth}px` });
      Object.assign(this._freeformSpacingXLabel.style, { left: `${spacingX.before.right + beforeWidth / 2}px`, top: `${y - 15}px` });
      this._freeformSpacingXLabel.textContent = `${Math.round(gap)} px`;
      [this._freeformSpacingXBefore, this._freeformSpacingXAfter, this._freeformSpacingXLabel].forEach(node => node.classList.add("is-visible"));
    }
    if (spacingY) {
      const gap = Math.max(0, spacingY.gap);
      const x = Math.max(8, Math.min(window.innerWidth - 8, selectionRect.left + (selectionRect.right - selectionRect.left) / 2));
      const beforeHeight = Math.max(0, selectionRect.top - spacingY.before.bottom);
      const afterHeight = Math.max(0, spacingY.after.top - selectionRect.bottom);
      Object.assign(this._freeformSpacingYBefore.style, { left: `${x}px`, top: `${spacingY.before.bottom}px`, height: `${beforeHeight}px` });
      Object.assign(this._freeformSpacingYAfter.style, { left: `${x}px`, top: `${selectionRect.bottom}px`, height: `${afterHeight}px` });
      Object.assign(this._freeformSpacingYLabel.style, { left: `${x + 7}px`, top: `${spacingY.before.bottom + beforeHeight / 2}px` });
      this._freeformSpacingYLabel.textContent = `${Math.round(gap)} px`;
      [this._freeformSpacingYBefore, this._freeformSpacingYAfter, this._freeformSpacingYLabel].forEach(node => node.classList.add("is-visible"));
    }
  }

  showFreeformGuides(snapX, snapY, boundary) {
    const guides = this.ensureFreeformGuides();
    const top = Math.max(0, Number(boundary?.top) || 0);
    const bottom = Math.min(window.innerHeight, Number(boundary?.bottom) || window.innerHeight);
    const left = Math.max(0, Number(boundary?.left) || 0);
    const right = Math.min(window.innerWidth, Number(boundary?.right) || window.innerWidth);
    if (snapX) {
      guides.x.style.left = `${snapX.line}px`;
      guides.x.style.top = `${top}px`;
      guides.x.style.height = `${Math.max(0, bottom - top)}px`;
      guides.x.classList.add("is-visible");
    } else guides.x.classList.remove("is-visible");
    if (snapY) {
      guides.y.style.left = `${left}px`;
      guides.y.style.top = `${snapY.line}px`;
      guides.y.style.width = `${Math.max(0, right - left)}px`;
      guides.y.classList.add("is-visible");
    } else guides.y.classList.remove("is-visible");
  }

  buildFreeformSnapContext(entries = [], boundary = null) {
    const selected = new Set(entries.map(entry => entry.target));
    const sections = [...new Set(entries.map(entry => entry.target?.closest(".editor-section-wrapper")).filter(Boolean))];
    const scope = sections.length === 1 ? sections[0] : document.getElementById("canvas-container");
    const xLines = rectAxisLines(boundary, "x", { source: "section" });
    const yLines = rectAxisLines(boundary, "y", { source: "section" });
    const rects = [];
    if (!scope) return { xLines, yLines, rects };
    scope.querySelectorAll("[data-layout-key]").forEach(element => {
      if (selected.has(element)) return;
      if (entries.some(entry => entry.target?.contains(element) || element.contains(entry.target))) return;
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") return;
      const rect = element.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const meta = { source: "element", key: element.dataset.layoutKey || "" };
      rects.push({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height, key: meta.key });
      xLines.push(...rectAxisLines(rect, "x", meta));
      yLines.push(...rectAxisLines(rect, "y", meta));
    });
    return { xLines, yLines, rects };
  }

  startFreeformRotation(event) {
    const keys = this.getFreeformSelectedKeys();
    const canvas = document.getElementById("canvas-container");
    if (!canvas || !keys.length || this.isFreeformSelectionLocked(keys)) return;
    const entries = keys.map(key => {
      const target = canvas.querySelector(`[data-layout-key="${key}"]`);
      return target?.isConnected ? { key, target, base: { ...this.getFreeformLayout(key, state.viewport) }, rect: target.getBoundingClientRect() } : null;
    }).filter(Boolean);
    if (!entries.length) return;
    event.preventDefault();
    event.stopPropagation();
    const pointerId = event.pointerId;
    const left = Math.min(...entries.map(entry => entry.rect.left));
    const top = Math.min(...entries.map(entry => entry.rect.top));
    const right = Math.max(...entries.map(entry => entry.rect.right));
    const bottom = Math.max(...entries.map(entry => entry.rect.bottom));
    const center = { x: (left + right) / 2, y: (top + bottom) / 2 };
    const startAngle = Math.atan2(event.clientY - center.y, event.clientX - center.x);
    let liveUpdates = Object.fromEntries(entries.map(entry => [entry.key, { ...entry.base }]));
    this._freeformOverlay?.classList.add("is-transforming");
    document.body.classList.add("freeform-transforming", "freeform-rotating");

    const onMove = moveEvent => {
      if (pointerId != null && moveEvent.pointerId != null && moveEvent.pointerId !== pointerId) return;
      const currentAngle = Math.atan2(moveEvent.clientY - center.y, moveEvent.clientX - center.x);
      let delta = (currentAngle - startAngle) * 180 / Math.PI;
      delta = ((delta + 540) % 360) - 180;
      if (moveEvent.shiftKey) delta = Math.round(delta / 15) * 15;
      const radians = delta * Math.PI / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);
      liveUpdates = {};
      entries.forEach(entry => {
        const baseRotation = Number(entry.base.rotation) || 0;
        let x = Number(entry.base.x) || 0;
        let y = Number(entry.base.y) || 0;
        if (entries.length > 1) {
          const entryCenter = { x: entry.rect.left + entry.rect.width / 2, y: entry.rect.top + entry.rect.height / 2 };
          const vx = entryCenter.x - center.x;
          const vy = entryCenter.y - center.y;
          const desiredCenter = { x: center.x + vx * cos - vy * sin, y: center.y + vx * sin + vy * cos };
          x += desiredCenter.x - entryCenter.x;
          y += desiredCenter.y - entryCenter.y;
        }
        const layout = { ...entry.base, x, y, rotation: baseRotation + delta };
        liveUpdates[entry.key] = layout;
        this.applyFreeformLiveStyle(entry.target, layout, false);
      });
      this.updateFreeformOverlay();
    };
    const onUp = upEvent => {
      if (pointerId != null && upEvent?.pointerId != null && upEvent.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      this._freeformOverlay?.classList.remove("is-transforming");
      document.body.classList.remove("freeform-transforming", "freeform-rotating");
      state.setFreeformLayouts(liveUpdates, state.viewport, keys.length > 1 ? "Rotation sélection libre" : "Rotation élément libre");
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  startFreeformInteraction(event, action = "move", handle = "", options = {}) {
    const keys = this.getFreeformSelectedKeys();
    const canvas = document.getElementById("canvas-container");
    const elements = keys.map(key => canvas?.querySelector(`[data-layout-key="${key}"]`)).filter(el => el?.isConnected);
    if (!elements.length || !keys.length || this.isFreeformSelectionLocked(keys)) return;
    const exactGroup = this.getExactFreeformGroup(keys);
    if (action === "resize" && keys.length > 1 && !exactGroup) return;
    event.preventDefault();
    event.stopPropagation();
    const entries = keys.map((key, index) => {
      const target = elements[index];
      return { key, target, base: { ...this.getFreeformLayout(key, state.viewport) }, rect: target.getBoundingClientRect() };
    }).filter(entry => entry.target);
    const start = options.startPoint || { x: event.clientX, y: event.clientY };
    const pointerId = options.pointerId ?? event.pointerId;
    const selectionRect = {
      left: Math.min(...entries.map(entry => entry.rect.left)),
      top: Math.min(...entries.map(entry => entry.rect.top)),
      right: Math.max(...entries.map(entry => entry.rect.right)),
      bottom: Math.max(...entries.map(entry => entry.rect.bottom))
    };
    const crossSectionMove = action === "move" && Boolean(this._freeformCrossSectionMode);
    const sectionBoundary = this.getFreeformSelectionBoundary(entries.map(entry => entry.target)) || selectionRect;
    const boundary = crossSectionMove ? (canvas.getBoundingClientRect() || sectionBoundary) : sectionBoundary;
    const snapContext = (action === "move" || action === "resize") && !crossSectionMove ? this.buildFreeformSnapContext(entries, boundary) : null;
    let pendingReparentTarget = null;
    let liveUpdates = Object.fromEntries(entries.map(entry => [entry.key, { ...entry.base, x: Number(entry.base.x) || 0, y: Number(entry.base.y) || 0 }]));
    this._freeformOverlay?.classList.add("is-transforming");
    document.body.classList.add("freeform-transforming");
    if (options.direct) document.body.classList.add("freeform-direct-dragging");

    const onMove = moveEvent => {
      if (pointerId != null && moveEvent.pointerId != null && moveEvent.pointerId !== pointerId) return;
      const rawDx = moveEvent.clientX - start.x;
      const rawDy = moveEvent.clientY - start.y;
      if (action === "move") {
        const minDx = boundary.left - selectionRect.left;
        const maxDx = boundary.right - selectionRect.right;
        const minDy = boundary.top - selectionRect.top;
        const maxDy = boundary.bottom - selectionRect.bottom;
        let dx = Math.max(minDx, Math.min(maxDx, rawDx));
        let dy = Math.max(minDy, Math.min(maxDy, rawDy));
        let snapX = null;
        let snapY = null;
        let spacingX = null;
        let spacingY = null;
        if (!moveEvent.altKey && snapContext) {
          snapX = resolveFreeformSnap(selectionRect.left + dx, selectionRect.right - selectionRect.left, snapContext.xLines, FREEFORM_SNAP_THRESHOLD);
          const proposedX = { left: selectionRect.left + dx, right: selectionRect.right + dx, top: selectionRect.top + dy, bottom: selectionRect.bottom + dy };
          spacingX = resolveEqualSpacingSnap(proposedX, snapContext.rects, "x", FREEFORM_SNAP_THRESHOLD);
          if (spacingX && (!snapX || Math.abs(spacingX.offset) <= Math.abs(snapX.offset))) {
            dx = Math.max(minDx, Math.min(maxDx, dx + spacingX.offset));
            snapX = null;
          } else {
            spacingX = null;
            if (snapX) dx = Math.max(minDx, Math.min(maxDx, dx + snapX.offset));
          }

          snapY = resolveFreeformSnap(selectionRect.top + dy, selectionRect.bottom - selectionRect.top, snapContext.yLines, FREEFORM_SNAP_THRESHOLD);
          const proposedY = { left: selectionRect.left + dx, right: selectionRect.right + dx, top: selectionRect.top + dy, bottom: selectionRect.bottom + dy };
          spacingY = resolveEqualSpacingSnap(proposedY, snapContext.rects, "y", FREEFORM_SNAP_THRESHOLD);
          if (spacingY && (!snapY || Math.abs(spacingY.offset) <= Math.abs(snapY.offset))) {
            dy = Math.max(minDy, Math.min(maxDy, dy + spacingY.offset));
            snapY = null;
          } else {
            spacingY = null;
            if (snapY) dy = Math.max(minDy, Math.min(maxDy, dy + snapY.offset));
          }
        }
        const snappedRect = { left: selectionRect.left + dx, right: selectionRect.right + dx, top: selectionRect.top + dy, bottom: selectionRect.bottom + dy };
        if (crossSectionMove) {
          const candidate = this.findFreeformReparentTarget(snappedRect);
          const currentSections = new Set(entries.map(entry => entry.target.closest(".editor-section-wrapper")?.dataset?.sectionId).filter(Boolean));
          pendingReparentTarget = candidate && !(currentSections.size === 1 && currentSections.has(candidate.dataset.sectionId)) ? candidate : null;
          this.setFreeformReparentTarget(pendingReparentTarget);
        }
        this.showFreeformGuides(snapX, snapY, boundary);
        this.showFreeformSpacingGuides(spacingX, spacingY, snappedRect);
        liveUpdates = {};
        entries.forEach(entry => {
          const layout = { ...entry.base, x: (Number(entry.base.x) || 0) + dx, y: (Number(entry.base.y) || 0) + dy };
          liveUpdates[entry.key] = layout;
          this.applyFreeformLiveStyle(entry.target, layout, false);
        });
      } else if (entries.length > 1) {
        const originalWidth = Math.max(1, selectionRect.right - selectionRect.left);
        const originalHeight = Math.max(1, selectionRect.bottom - selectionRect.top);
        let nextLeft = selectionRect.left;
        let nextTop = selectionRect.top;
        let nextRight = selectionRect.right;
        let nextBottom = selectionRect.bottom;
        const minGroupWidth = 48;
        const minGroupHeight = 32;
        if (handle.includes("e")) nextRight = Math.max(nextLeft + minGroupWidth, selectionRect.right + rawDx);
        if (handle.includes("s")) nextBottom = Math.max(nextTop + minGroupHeight, selectionRect.bottom + rawDy);
        if (handle.includes("w")) nextLeft = Math.min(nextRight - minGroupWidth, selectionRect.left + rawDx);
        if (handle.includes("n")) nextTop = Math.min(nextBottom - minGroupHeight, selectionRect.top + rawDy);
        if (handle.includes("e")) nextRight = Math.min(boundary.right, nextRight);
        if (handle.includes("w")) nextLeft = Math.max(boundary.left, nextLeft);
        if (handle.includes("s")) nextBottom = Math.min(boundary.bottom, nextBottom);
        if (handle.includes("n")) nextTop = Math.max(boundary.top, nextTop);
        let snapX = null;
        let snapY = null;
        if (!moveEvent.altKey && snapContext) {
          if (handle.includes("e")) { snapX = resolveFreeformSnap(nextRight, 0, snapContext.xLines, FREEFORM_SNAP_THRESHOLD); if (snapX) nextRight += snapX.offset; }
          else if (handle.includes("w")) { snapX = resolveFreeformSnap(nextLeft, 0, snapContext.xLines, FREEFORM_SNAP_THRESHOLD); if (snapX) nextLeft += snapX.offset; }
          if (handle.includes("s")) { snapY = resolveFreeformSnap(nextBottom, 0, snapContext.yLines, FREEFORM_SNAP_THRESHOLD); if (snapY) nextBottom += snapY.offset; }
          else if (handle.includes("n")) { snapY = resolveFreeformSnap(nextTop, 0, snapContext.yLines, FREEFORM_SNAP_THRESHOLD); if (snapY) nextTop += snapY.offset; }
        }
        this.showFreeformGuides(snapX, snapY, boundary);
        this.hideFreeformSpacingGuides();

        let scaleGroupX = (nextRight - nextLeft) / originalWidth;
        let scaleGroupY = (nextBottom - nextTop) / originalHeight;
        if (moveEvent.shiftKey && (handle.includes("e") || handle.includes("w")) && (handle.includes("n") || handle.includes("s"))) {
          const uniform = Math.abs(scaleGroupX - 1) >= Math.abs(scaleGroupY - 1) ? scaleGroupX : scaleGroupY;
          scaleGroupX = uniform;
          scaleGroupY = uniform;
          const nextWidth = originalWidth * uniform;
          const nextHeight = originalHeight * uniform;
          if (handle.includes("w")) nextLeft = selectionRect.right - nextWidth;
          else nextRight = selectionRect.left + nextWidth;
          if (handle.includes("n")) nextTop = selectionRect.bottom - nextHeight;
          else nextBottom = selectionRect.top + nextHeight;
        }

        liveUpdates = {};
        entries.forEach(entry => {
          const relativeLeft = entry.rect.left - selectionRect.left;
          const relativeTop = entry.rect.top - selectionRect.top;
          const desiredLeft = nextLeft + relativeLeft * scaleGroupX;
          const desiredTop = nextTop + relativeTop * scaleGroupY;
          const baseScaleX = Number(entry.base.scaleX) > 0 ? Number(entry.base.scaleX) : 1;
          const baseScaleY = Number(entry.base.scaleY) > 0 ? Number(entry.base.scaleY) : 1;
          // `scale` is applied about the element centre, so the box grows by
          // half its scale delta on each side. Compensate the translate to keep
          // the group edges where the gesture asks for them.
          const renderedWidth = Number(entry.base.width) > 0 ? Number(entry.base.width) : entry.target.offsetWidth;
          const renderedHeight = Number(entry.base.height) > 0 ? Number(entry.base.height) : entry.target.offsetHeight;
          const centerOffsetX = -(renderedWidth * baseScaleX * (scaleGroupX - 1)) / 2;
          const centerOffsetY = -(renderedHeight * baseScaleY * (scaleGroupY - 1)) / 2;
          const layout = {
            ...entry.base,
            x: (Number(entry.base.x) || 0) + (desiredLeft - entry.rect.left) + centerOffsetX,
            y: (Number(entry.base.y) || 0) + (desiredTop - entry.rect.top) + centerOffsetY,
            scaleX: baseScaleX * scaleGroupX,
            scaleY: baseScaleY * scaleGroupY
          };
          liveUpdates[entry.key] = layout;
          this.applyFreeformLiveStyle(entry.target, layout, false);
        });
      } else {
        const entry = entries[0];
        const baseWidth = Number(entry.base.width) > 0 ? Number(entry.base.width) : entry.rect.width;
        const baseHeight = Number(entry.base.height) > 0 ? Number(entry.base.height) : entry.rect.height;
        const minW = 24;
        const minH = 16;
        let adjustedDx = rawDx;
        let adjustedDy = rawDy;
        if (handle.includes("e")) adjustedDx = Math.min(adjustedDx, boundary.right - entry.rect.right);
        if (handle.includes("w")) adjustedDx = Math.max(adjustedDx, boundary.left - entry.rect.left);
        if (handle.includes("s")) adjustedDy = Math.min(adjustedDy, boundary.bottom - entry.rect.bottom);
        if (handle.includes("n")) adjustedDy = Math.max(adjustedDy, boundary.top - entry.rect.top);
        let snapX = null;
        let snapY = null;
        if (!moveEvent.altKey && snapContext) {
          if (handle.includes("e")) { snapX = resolveFreeformSnap(entry.rect.right + adjustedDx, 0, snapContext.xLines, FREEFORM_SNAP_THRESHOLD); if (snapX) adjustedDx += snapX.offset; }
          else if (handle.includes("w")) { snapX = resolveFreeformSnap(entry.rect.left + adjustedDx, 0, snapContext.xLines, FREEFORM_SNAP_THRESHOLD); if (snapX) adjustedDx += snapX.offset; }
          if (handle.includes("s")) { snapY = resolveFreeformSnap(entry.rect.bottom + adjustedDy, 0, snapContext.yLines, FREEFORM_SNAP_THRESHOLD); if (snapY) adjustedDy += snapY.offset; }
          else if (handle.includes("n")) { snapY = resolveFreeformSnap(entry.rect.top + adjustedDy, 0, snapContext.yLines, FREEFORM_SNAP_THRESHOLD); if (snapY) adjustedDy += snapY.offset; }
        }
        this.showFreeformGuides(snapX, snapY, boundary);
        this.hideFreeformSpacingGuides();
        let width = baseWidth;
        let height = baseHeight;
        let x = Number(entry.base.x) || 0;
        let y = Number(entry.base.y) || 0;
        if (handle.includes("e")) width = Math.max(minW, baseWidth + adjustedDx);
        if (handle.includes("s")) height = Math.max(minH, baseHeight + adjustedDy);
        if (handle.includes("w")) {
          const next = Math.max(minW, baseWidth - adjustedDx);
          x += baseWidth - next;
          width = next;
        }
        if (handle.includes("n")) {
          const next = Math.max(minH, baseHeight - adjustedDy);
          y += baseHeight - next;
          height = next;
        }
        const diagonal = (handle.includes("e") || handle.includes("w")) && (handle.includes("n") || handle.includes("s"));
        const keepAspect = diagonal && (moveEvent.shiftKey || entry.base.aspectLocked === true);
        if (keepAspect && baseWidth > 0 && baseHeight > 0) {
          const aspect = baseWidth / baseHeight;
          const relativeW = Math.abs(width - baseWidth) / baseWidth;
          const relativeH = Math.abs(height - baseHeight) / baseHeight;
          if (relativeW >= relativeH) height = Math.max(minH, width / aspect);
          else width = Math.max(minW, height * aspect);
          const maxW = handle.includes("e") ? baseWidth + Math.max(0, boundary.right - entry.rect.right) : baseWidth + Math.max(0, entry.rect.left - boundary.left);
          const maxH = handle.includes("s") ? baseHeight + Math.max(0, boundary.bottom - entry.rect.bottom) : baseHeight + Math.max(0, entry.rect.top - boundary.top);
          const fit = Math.min(1, maxW / width, maxH / height);
          if (fit < 1) { width *= fit; height *= fit; }
          x = (Number(entry.base.x) || 0) + (handle.includes("w") ? baseWidth - width : 0);
          y = (Number(entry.base.y) || 0) + (handle.includes("n") ? baseHeight - height : 0);
        }
        liveUpdates = { [entry.key]: { ...entry.base, x, y, width, height } };
        this.applyFreeformLiveStyle(entry.target, liveUpdates[entry.key], false);
      }
      this.updateFreeformOverlay();
    };
    const onUp = upEvent => {
      if (pointerId != null && upEvent?.pointerId != null && upEvent.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      this._freeformOverlay?.classList.remove("is-transforming");
      document.body.classList.remove("freeform-transforming", "freeform-direct-dragging");
      this.hideFreeformGuides();
      this.hideFreeformSpacingGuides();
      const reparentTarget = pendingReparentTarget;
      this.clearFreeformReparentTarget();
      if (action === "move" && crossSectionMove && reparentTarget && this.commitFreeformReparent(entries, liveUpdates, reparentTarget)) {
        this._freeformCrossSectionMode = false;
        this.updateFreeformOverlay();
        return;
      }
      state.setFreeformLayouts(liveUpdates, state.viewport, action === "move"
        ? (keys.length > 1 ? "Déplacement sélection libre" : "Déplacement élément libre")
        : (keys.length > 1 ? "Redimensionnement groupe libre" : "Redimensionnement élément libre"));
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    if (options.initialMoveEvent) onMove(options.initialMoveEvent);
  }

  nudgeFreeformSelection(dx, dy) {
    const keys = this.getFreeformSelectedKeys();
    if (!keys.length || this.isFreeformSelectionLocked(keys)) return;
    const updates = {};
    keys.forEach(key => {
      const current = this.getFreeformLayout(key, state.viewport);
      updates[key] = { ...current, x: (Number(current.x) || 0) + dx, y: (Number(current.y) || 0) + dy };
    });
    state.setFreeformLayouts(updates, state.viewport, keys.length > 1 ? "Déplacement clavier sélection libre" : "Déplacement clavier élément libre");
  }

  alignFreeformSelection(mode = "left") {
    const keys = this.getFreeformSelectedKeys();
    const canvas = document.getElementById("canvas-container");
    if (!canvas || keys.length < 2 || this.isFreeformSelectionLocked(keys)) return;
    const entries = keys.map(key => {
      const element = canvas.querySelector(`[data-layout-key="${key}"]`);
      return element ? { key, element, rect: element.getBoundingClientRect(), layout: { ...this.getFreeformLayout(key, state.viewport) } } : null;
    }).filter(Boolean);
    if (entries.length < 2) return;
    const bounds = {
      left: Math.min(...entries.map(entry => entry.rect.left)),
      top: Math.min(...entries.map(entry => entry.rect.top)),
      right: Math.max(...entries.map(entry => entry.rect.right)),
      bottom: Math.max(...entries.map(entry => entry.rect.bottom))
    };
    const centerX = (bounds.left + bounds.right) / 2;
    const centerY = (bounds.top + bounds.bottom) / 2;
    const updates = {};
    entries.forEach(entry => {
      let dx = 0;
      let dy = 0;
      if (mode === "left") dx = bounds.left - entry.rect.left;
      else if (mode === "center") dx = centerX - (entry.rect.left + entry.rect.width / 2);
      else if (mode === "right") dx = bounds.right - entry.rect.right;
      else if (mode === "top") dy = bounds.top - entry.rect.top;
      else if (mode === "middle") dy = centerY - (entry.rect.top + entry.rect.height / 2);
      else if (mode === "bottom") dy = bounds.bottom - entry.rect.bottom;
      updates[entry.key] = {
        ...entry.layout,
        x: (Number(entry.layout.x) || 0) + dx,
        y: (Number(entry.layout.y) || 0) + dy
      };
    });
    state.setFreeformLayouts(updates, state.viewport, `Alignement ${mode}`);
  }

  distributeFreeformSelection(axis = "horizontal") {
    const keys = this.getFreeformSelectedKeys();
    const canvas = document.getElementById("canvas-container");
    if (!canvas || keys.length < 3 || this.isFreeformSelectionLocked(keys)) return;
    const entries = keys.map(key => {
      const element = canvas.querySelector(`[data-layout-key="${key}"]`);
      return element ? { key, element, rect: element.getBoundingClientRect(), layout: { ...this.getFreeformLayout(key, state.viewport) } } : null;
    }).filter(Boolean);
    if (entries.length < 3) return;
    const horizontal = axis === "horizontal";
    entries.sort((a, b) => horizontal ? a.rect.left - b.rect.left : a.rect.top - b.rect.top);
    const firstStart = horizontal ? entries[0].rect.left : entries[0].rect.top;
    const lastEnd = horizontal ? entries.at(-1).rect.right : entries.at(-1).rect.bottom;
    const totalSize = entries.reduce((sum, entry) => sum + (horizontal ? entry.rect.width : entry.rect.height), 0);
    const gap = (lastEnd - firstStart - totalSize) / (entries.length - 1);
    const updates = {};
    let cursor = firstStart;
    entries.forEach(entry => {
      const currentStart = horizontal ? entry.rect.left : entry.rect.top;
      const delta = cursor - currentStart;
      updates[entry.key] = {
        ...entry.layout,
        x: (Number(entry.layout.x) || 0) + (horizontal ? delta : 0),
        y: (Number(entry.layout.y) || 0) + (horizontal ? 0 : delta)
      };
      cursor += (horizontal ? entry.rect.width : entry.rect.height) + gap;
    });
    state.setFreeformLayouts(updates, state.viewport, horizontal ? "Distribution horizontale" : "Distribution verticale");
  }

  copyFreeformSelectionToViewport(targetViewport, sourceViewport = state.viewport) {
    const keys = this.getFreeformSelectedKeys();
    const valid = ["desktop", "tablet", "mobile"];
    if (!keys.length || this.isFreeformSelectionLocked(keys) || !valid.includes(targetViewport) || !valid.includes(sourceViewport) || targetViewport === sourceViewport) return;
    const sourceLayouts = state.currentProject?.freeformLayout?.[sourceViewport] || {};
    const updates = {};
    keys.forEach(key => {
      const sourceLayout = sourceLayouts[key];
      if (!sourceLayout) return;
      updates[key] = adaptFreeformLayoutToViewport(sourceLayout, sourceViewport, targetViewport);
    });
    if (!Object.keys(updates).length) {
      this.showToast(`Aucune transformation ${sourceViewport} à adapter pour la sélection`, "info");
      return;
    }
    state.setFreeformLayouts(updates, targetViewport, `Adapter ${sourceViewport} vers ${targetViewport}`);
    const targetLabel = targetViewport === "desktop" ? "Desktop" : targetViewport === "tablet" ? "Tablette" : "Mobile";
    this.showToast(`Sélection adaptée vers ${targetLabel}`, "success");
  }

  changeFreeformLayerOrder(mode = "forward") {
    const keys = this.getFreeformSelectedKeys();
    if (!keys.length || this.isFreeformSelectionLocked(keys)) return;
    const currentLayouts = state.currentProject?.freeformLayout?.[state.viewport] || {};
    const allZ = Object.values(currentLayouts).map(layout => Number(layout?.z)).filter(Number.isFinite);
    const minZ = Math.min(0, ...allZ);
    const maxZ = Math.max(0, ...allZ);
    const selected = keys.map(key => ({ key, layout: { ...this.getFreeformLayout(key, state.viewport) }, z: Number(this.getFreeformLayout(key, state.viewport)?.z) || 0 }));
    const updates = {};
    if (mode === "front" || mode === "back") {
      const ordered = [...selected].sort((a, b) => a.z - b.z);
      const start = mode === "front" ? Math.min(998, maxZ + 1) : Math.max(-10, minZ - ordered.length);
      ordered.forEach((entry, index) => {
        const z = mode === "front" ? Math.min(999, start + index) : Math.max(-10, start + index);
        updates[entry.key] = { ...entry.layout, z };
      });
    } else {
      const delta = mode === "backward" ? -1 : 1;
      selected.forEach(entry => { updates[entry.key] = { ...entry.layout, z: Math.max(-10, Math.min(999, entry.z + delta)) }; });
    }
    state.setFreeformLayouts(updates, state.viewport, mode === "front" ? "Premier plan" : mode === "back" ? "Arrière-plan" : mode === "backward" ? "Reculer un calque" : "Avancer un calque");
  }

  toggleFreeformAspectLock() {
    const keys = this.getFreeformSelectedKeys();
    if (keys.length !== 1 || this.isFreeformSelectionLocked(keys)) return;
    const current = this.getFreeformLayout(keys[0], state.viewport);
    const nextLocked = current?.aspectLocked !== true;
    state.setFreeformLayout(keys[0], state.viewport, { ...current, aspectLocked: nextLocked }, nextLocked ? "Verrouiller le ratio" : "Libérer le ratio");
  }

  toggleFreeformSelectionLock() {
    const keys = this.getFreeformSelectedKeys();
    if (!keys.length) return;
    const shouldUnlock = this.isFreeformSelectionLocked(keys);
    state.setFreeformLocked(keys, !shouldUnlock, shouldUnlock ? "Déverrouiller les calques" : "Verrouiller les calques");
  }

  resetFreeformSelection() {
    const keys = this.getFreeformSelectedKeys();
    if (!keys.length || this.isFreeformSelectionLocked(keys)) return;
    state.clearFreeformLayouts(keys, state.viewport, keys.length > 1 ? "Réinitialisation sélection libre" : "Réinitialisation élément libre");
  }

  groupFreeformSelection() {
    const keys = this.getFreeformSelectedKeys();
    if (keys.length < 2 || this.isFreeformSelectionLocked(keys)) return;
    const groupId = state.createFreeformGroup(keys, "Grouper les éléments libres");
    if (!groupId) return;
    this._freeformSelectedKeys = keys;
    this._freeformSelectedKey = keys[0];
    requestAnimationFrame(() => this.selectFreeformKeys(keys, keys[0]));
  }

  ungroupFreeformSelection() {
    const keys = this.getFreeformSelectedKeys();
    const group = this.getExactFreeformGroup(keys);
    if (!group || this.isFreeformSelectionLocked(keys)) return;
    state.deleteFreeformGroup(group.id, "Dégrouper les éléments libres");
    this._freeformSelectedKeys = keys;
    this._freeformSelectedKey = keys[0];
    requestAnimationFrame(() => this.selectFreeformKeys(keys, keys[0]));
  }

  ensureFreeformMarquee() {
    let box = document.getElementById("freeform-marquee-box");
    if (!box) {
      box = document.createElement("div");
      box.id = "freeform-marquee-box";
      box.className = "freeform-marquee-box";
      box.setAttribute("aria-hidden", "true");
      document.body.appendChild(box);
    }
    this._freeformMarqueeBox = box;
    return box;
  }

  clearFreeformMarqueePreview() {
    document.querySelectorAll("#canvas-container [data-layout-key].is-freeform-marquee-hit").forEach(el => el.classList.remove("is-freeform-marquee-hit"));
    this._freeformMarqueeHitKeys = [];
    if (this._freeformMarqueeBox) {
      this._freeformMarqueeBox.classList.remove("is-visible");
      this._freeformMarqueeBox.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("freeform-marqueeing");
  }

  getFreeformMarqueeCandidates(canvas = document.getElementById("canvas-container")) {
    if (!canvas) return [];
    return [...canvas.querySelectorAll(".artisite-root.editor-mode [data-layout-key]")].filter(element => {
      if (!element.isConnected) return false;
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
      const rect = element.getBoundingClientRect();
      return rect.width >= 2 && rect.height >= 2;
    });
  }

  collapseFreeformMarqueeHierarchy(elements = []) {
    const hitSet = new Set(elements.filter(Boolean));
    return [...hitSet].filter(element => {
      let ancestor = element.parentElement?.closest?.("[data-layout-key]");
      while (ancestor) {
        if (hitSet.has(ancestor)) return false;
        ancestor = ancestor.parentElement?.closest?.("[data-layout-key]");
      }
      return true;
    });
  }

  expandFreeformGroupKeys(layoutKeys = []) {
    const expanded = new Set(layoutKeys.filter(Boolean));
    [...expanded].forEach(key => {
      const group = this.getFreeformGroupForKey(key);
      group?.members?.forEach(member => expanded.add(member));
    });
    return [...expanded];
  }

  armFreeformMarquee(event, canvas, { baseKeys = [] } = {}) {
    if (!canvas || event.pointerType === "touch") return;
    const startPoint = { x: event.clientX, y: event.clientY };
    const pointerId = event.pointerId;
    const additiveKeys = [...new Set(baseKeys.filter(Boolean))];
    const box = this.ensureFreeformMarquee();
    const candidates = this.getFreeformMarqueeCandidates(canvas);
    const scrollHost = document.getElementById("editor-main-canvas");
    let started = false;
    let hitKeys = [];
    let lastPointer = { clientX: event.clientX, clientY: event.clientY };
    let autoScrollFrame = 0;

    const stopAutoScroll = () => {
      if (autoScrollFrame) cancelAnimationFrame(autoScrollFrame);
      autoScrollFrame = 0;
    };
    const cleanupListeners = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
    const updateHits = moveEvent => {
      const marquee = marqueeRectFromPoints(startPoint, { x: moveEvent.clientX, y: moveEvent.clientY });
      if (!marquee) return;
      box.style.left = `${marquee.left}px`;
      box.style.top = `${marquee.top}px`;
      box.style.width = `${marquee.width}px`;
      box.style.height = `${marquee.height}px`;
      box.classList.add("is-visible");
      box.setAttribute("aria-hidden", "false");
      const hitElements = candidates.filter(element => marqueeContainsRectCenter(marquee, element.getBoundingClientRect()));
      const rawHits = this.collapseFreeformMarqueeHierarchy(hitElements)
        .map(element => element.dataset.layoutKey)
        .filter(Boolean);
      hitKeys = this.expandFreeformGroupKeys(rawHits);
      document.querySelectorAll("#canvas-container [data-layout-key].is-freeform-marquee-hit").forEach(el => el.classList.remove("is-freeform-marquee-hit"));
      hitKeys.forEach(key => canvas.querySelector(`[data-layout-key="${key}"]`)?.classList.add("is-freeform-marquee-hit"));
      this._freeformMarqueeHitKeys = hitKeys;
    };
    const tickAutoScroll = () => {
      autoScrollFrame = 0;
      if (!started || !scrollHost || !lastPointer) return;
      const speed = resolveEdgeAutoScroll(lastPointer.clientY, scrollHost.getBoundingClientRect());
      if (!speed) return;
      const before = scrollHost.scrollTop;
      scrollHost.scrollTop = Math.max(0, Math.min(scrollHost.scrollHeight - scrollHost.clientHeight, before + speed));
      if (scrollHost.scrollTop !== before) updateHits(lastPointer);
      autoScrollFrame = requestAnimationFrame(tickAutoScroll);
    };
    const ensureAutoScroll = () => {
      if (!autoScrollFrame && scrollHost && resolveEdgeAutoScroll(lastPointer.clientY, scrollHost.getBoundingClientRect())) {
        autoScrollFrame = requestAnimationFrame(tickAutoScroll);
      }
    };
    const onMove = moveEvent => {
      if (pointerId != null && moveEvent.pointerId != null && moveEvent.pointerId !== pointerId) return;
      if (!started && Math.hypot(moveEvent.clientX - startPoint.x, moveEvent.clientY - startPoint.y) < 5) return;
      if (!started) {
        started = true;
        document.body.classList.add("freeform-marqueeing");
      }
      moveEvent.preventDefault();
      lastPointer = { clientX: moveEvent.clientX, clientY: moveEvent.clientY };
      updateHits(lastPointer);
      ensureAutoScroll();
    };
    const finish = commit => {
      cleanupListeners();
      stopAutoScroll();
      const finalKeys = commit ? this.expandFreeformGroupKeys([...additiveKeys, ...hitKeys]) : additiveKeys;
      this.clearFreeformMarqueePreview();
      if (commit) {
        if (finalKeys.length) this.selectFreeformKeys(finalKeys, finalKeys.at(-1));
        else this.clearFreeformSelection();
      }
    };
    const onUp = upEvent => {
      if (pointerId != null && upEvent?.pointerId != null && upEvent.pointerId !== pointerId) return;
      finish(started);
    };
    const onCancel = cancelEvent => {
      if (pointerId != null && cancelEvent?.pointerId != null && cancelEvent.pointerId !== pointerId) return;
      finish(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
  }

  armFreeformDirectDrag(event, target, { wasSelected = false, onClick = null } = {}) {
    if (!target?.dataset?.layoutKey || event.shiftKey || this.isFreeformSelectionLocked()) return;
    if (event.target.closest("input, textarea, select, option")) return;
    const textLike = target.hasAttribute("data-editable") || target.matches("[contenteditable='true']");
    if (textLike && !wasSelected) return;
    const startPoint = { x: event.clientX, y: event.clientY };
    const pointerId = event.pointerId;
    let started = false;
    const cleanup = () => {
      window.removeEventListener("pointermove", onArmMove);
      window.removeEventListener("pointerup", onArmUp);
      window.removeEventListener("pointercancel", onArmUp);
    };
    const onArmMove = moveEvent => {
      if (pointerId != null && moveEvent.pointerId != null && moveEvent.pointerId !== pointerId) return;
      if (Math.hypot(moveEvent.clientX - startPoint.x, moveEvent.clientY - startPoint.y) < 5) return;
      started = true;
      cleanup();
      moveEvent.preventDefault();
      window.getSelection?.()?.removeAllRanges?.();
      this.startFreeformInteraction({
        clientX: startPoint.x,
        clientY: startPoint.y,
        pointerId,
        preventDefault() {},
        stopPropagation() {}
      }, "move", "", { direct: true, startPoint, pointerId, initialMoveEvent: moveEvent });
    };
    const onArmUp = () => {
      if (!started) {
        cleanup();
        if (typeof onClick === "function") onClick();
      }
    };
    window.addEventListener("pointermove", onArmMove);
    window.addEventListener("pointerup", onArmUp);
    window.addEventListener("pointercancel", onArmUp);
  }

  initFreeformEditing() {
    const canvas = document.getElementById("canvas-container");
    if (!canvas || state.editorMode === "preview") {
      this._freeformOverlay?.classList.remove("is-visible");
      this.hideFreeformGuides();
      this.clearFreeformMarqueePreview();
      return;
    }
    this.ensureFreeformOverlay();
    if (canvas !== this._freeformBoundCanvas) {
      this._freeformBoundCanvas = canvas;
      canvas.addEventListener("pointerdown", event => {
        if (event.button !== undefined && event.button !== 0) return;
        if (event.target.closest(".editor-section-toolbar, .cta-direct-badge, .cta-context-popover, .sec-bg-popover, .sec-motion-popover, .floating-text-toolbar")) return;
        // CTAs own their click interaction. Layout editing is entered explicitly
        // from the button popover so the two editing modes never stack.
        if (event.target.closest("[data-cta-popover-wrapper]")) return;
        const target = this.resolveFreeformPointerTarget(event.target, canvas, { parentStep: event.metaKey || event.ctrlKey });
        if (target) {
          const previousKeys = this.getFreeformSelectedKeys();
          const wasSelected = previousKeys.includes(target.dataset.layoutKey);
          const additive = Boolean(event.shiftKey || this._freeformAdditiveMode);
          let collapseOnClick = null;
          if (!additive && wasSelected && previousKeys.length > 1) {
            const activeGroup = this.getExactFreeformGroup(previousKeys);
            this.selectFreeformKeys(previousKeys, target.dataset.layoutKey);
            if (!activeGroup) collapseOnClick = () => this.selectFreeformTarget(target);
          } else {
            this.selectFreeformTarget(target, { additive });
          }
          this.armFreeformDirectDrag(event, target, { wasSelected, onClick: collapseOnClick });
        } else if (!event.target.closest("#freeform-selection-box")) {
          const baseKeys = event.shiftKey ? this.getFreeformSelectedKeys() : [];
          this.armFreeformMarquee(event, canvas, { baseKeys });
          if (!event.shiftKey) this.clearFreeformSelection();
        }
      }, true);
      const scrollHost = document.getElementById("editor-main-canvas");
      scrollHost?.addEventListener("scroll", () => this.updateFreeformOverlay(), { passive: true });
    }
    if (!this._freeformWindowBound) {
      window.addEventListener("resize", () => this.updateFreeformOverlay(), { passive: true });
      document.addEventListener("keydown", event => {
        const keys = this.getFreeformSelectedKeys();
        if (!keys.length) return;
        const editable = event.target?.matches?.("input, textarea, select, [contenteditable='true']");
        if (editable) return;
        // Une barre masquée ne doit plus répondre aux flèches : la sélection reste
        // en mémoire pour le fil de contexte, mais elle n'est plus manipulable.
        const selectionBox = document.getElementById("freeform-selection-box");
        if (!selectionBox || !selectionBox.classList.contains("is-visible")) return;
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "g") {
          event.preventDefault();
          if (event.shiftKey) this.ungroupFreeformSelection();
          else this.groupFreeformSelection();
          return;
        }
        if (event.key === "Escape") {
          this.clearFreeformSelection();
          return;
        }
        const step = event.shiftKey ? 10 : 1;
        if (event.key === "ArrowLeft") { event.preventDefault(); this.nudgeFreeformSelection(-step, 0); }
        else if (event.key === "ArrowRight") { event.preventDefault(); this.nudgeFreeformSelection(step, 0); }
        else if (event.key === "ArrowUp") { event.preventDefault(); this.nudgeFreeformSelection(0, -step); }
        else if (event.key === "ArrowDown") { event.preventDefault(); this.nudgeFreeformSelection(0, step); }
      });
      this._freeformWindowBound = true;
    }
    const restoredKeys = this.getFreeformSelectedKeys();
    if (restoredKeys.length) this.selectFreeformKeys(restoredKeys, this._freeformSelectedKey);
  }

  // Inline editing in canvas
  initInlineEditing() {
    this.initCanvasInteractivity();

    // Select section on click
    document.querySelectorAll(".editor-section-wrapper").forEach(wrapper => {
      wrapper.onclick = (e) => {
        const sectionId = wrapper.getAttribute("data-section-id");
        if (sectionId) {
          state.setSelectedSection(sectionId);
        }
      };
    });

    // Canvas section hover toolbar buttons click
    document.querySelectorAll(".editor-section-toolbar button").forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        this.closeAllFloatingToolbars("section");
        const action = btn.getAttribute("data-action");
        const secId = btn.getAttribute("data-id");
        if (action === "move-up") this.moveSection(secId, "up");
        else if (action === "move-down") this.moveSection(secId, "down");
        else if (action === "toggle-bg") this.cycleSectionBg(secId);
        else if (action === "toggle-motion-menu") this.toggleSectionMotionMenu(secId);
        else if (action === "insert-after") this.openAddSectionModal();
        else if (action === "toggle-vis") this.toggleSectionVisibility(secId);
        else if (action === "duplicate") this.duplicateSection(secId);
        else if (action === "delete") this.deleteSection(secId);
      };
    });

    // Direct contenteditable on text elements
    document.querySelectorAll("[data-editable]").forEach(el => {
      el.setAttribute("contenteditable", "true");
      el.classList.add("hover:outline", "hover:outline-1", "hover:outline-dashed", "hover:outline-zinc-400", "rounded", "transition-all", "cursor-text");

      el.addEventListener("click", (e) => {
        if (el.closest("[data-cta-popover-wrapper]")) {
          this.hideFloatingTextToolbar();
          return;
        }
        const secWrapper = el.closest(".editor-section-wrapper");
        const secId = secWrapper?.getAttribute("data-section-id");
        if (secId && state.selectedSectionId !== secId) {
          state.setSelectedSection(secId);
        }
        this.showFloatingTextToolbar(el, secId);
      });

      el.addEventListener("focus", () => {
        el.dataset.initialValue = el.innerText.trim();
        if (el.closest("[data-cta-popover-wrapper]")) {
          this.hideFloatingTextToolbar();
          return;
        }
        const secWrapper = el.closest(".editor-section-wrapper");
        const secId = secWrapper?.getAttribute("data-section-id");
        if (secId) {
          this.showFloatingTextToolbar(el, secId);
        }
      });

      el.oninput = () => {
        const field = el.getAttribute("data-editable");
        const value = el.innerText.trim();
        const secWrapper = el.closest(".editor-section-wrapper");
        const secId = secWrapper?.getAttribute("data-section-id");
        if (secId && field && state.currentProject) {
          const sec = state.currentProject.sections.find(s => s.id === secId);
          if (sec && sec.content) {
            setDeepValue(sec.content, field, value);
          }
          const mirrorInputs = document.querySelectorAll(`#accordion-${secId} [data-field="${field}"], #inspector-panel-content [data-field="${field}"]`);
          mirrorInputs.forEach(inp => {
            if (document.activeElement !== inp) inp.value = value;
          });
          const saveStatus = document.getElementById("save-status-text");
          if (saveStatus) {
            saveStatus.textContent = "Modification en cours...";
            saveStatus.className = "text-ui-sm font-medium text-amber-600";
          }
        }
      };

      el.onblur = () => {
        const field = el.getAttribute("data-editable");
        const value = el.innerText.trim();
        const initialValue = el.dataset.initialValue || "";
        const secWrapper = el.closest(".editor-section-wrapper");
        const secId = secWrapper?.getAttribute("data-section-id");
        if (secId && field) {
          this.commitInlineFieldUpdate(secId, field, initialValue, value);
        }
        if (el.innerText !== value) el.innerText = value;
      };

      el.onkeydown = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          this.exitInlineEditing();
          return;
        }
        if (e.key === "Enter" && !el.tagName.toLowerCase().includes("p")) {
          e.preventDefault();
          el.blur();
        }
      };
    });

    this.initFreeformEditing();

    // Sidebar Section Reordering via HTML5 Drag & Drop
    document.querySelectorAll(".section-card-grip[draggable='true']").forEach(grip => {
      grip.addEventListener("dragstart", (e) => {
        this._isDragging = true;
        this._justDragged = true;
        const secId = grip.getAttribute("data-sec-id");
        e.dataTransfer.setData("text/plain", secId);
        e.dataTransfer.effectAllowed = "move";
        const card = grip.closest(".section-card, .studio-v3-sectionrow");
        if (card) card.classList.add("is-dragging");
      });
      grip.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
        e.preventDefault();
        e.stopPropagation();
        const secId = grip.getAttribute("data-sec-id");
        if (secId) state.moveSection(secId, e.key === "ArrowUp" ? "up" : "down");
      });

      grip.addEventListener("dragend", () => {
        this._isDragging = false;
        setTimeout(() => { this._justDragged = false; }, 200);
        document.querySelectorAll(".section-card, .studio-v3-sectionrow").forEach(el => {
          el.classList.remove("is-dragging", "drop-above", "drop-below");
        });
      });
    });

    document.querySelectorAll(".section-card, .studio-v3-sectionrow").forEach(card => {
      card.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const rect = card.getBoundingClientRect();
        const isAfter = (e.clientY - rect.top) > (rect.height / 2);
        if (isAfter) {
          card.classList.remove("drop-above");
          card.classList.add("drop-below");
        } else {
          card.classList.remove("drop-below");
          card.classList.add("drop-above");
        }
      });

      card.addEventListener("dragleave", (e) => {
        if (e.relatedTarget && card.contains(e.relatedTarget)) return;
        card.classList.remove("drop-above", "drop-below");
      });

      card.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._justDragged = true;
        const sourceId = e.dataTransfer.getData("text/plain");
        const targetId = card.getAttribute("data-sec-id");
        const rect = card.getBoundingClientRect();
        const isAfter = (e.clientY - rect.top) > (rect.height / 2);
        card.classList.remove("drop-above", "drop-below");
        if (sourceId && targetId && sourceId !== targetId) {
          state.reorderSections(sourceId, targetId, isAfter ? "after" : "before");
        }
        setTimeout(() => { this._justDragged = false; }, 200);
      });
    });
  }
}

// Start app when DOM ready
document.addEventListener("DOMContentLoaded", () => {
  new App();
});

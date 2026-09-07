import { state, getDeepValue, setDeepValue } from "./state.js";
import { renderDashboard } from "./components/dashboard.js";
import { renderEditor } from "./components/editor.js";
import { renderWizardModal } from "./components/wizard.js";
import { renderCloserModal } from "./components/closerModal.js";
import { renderShareModal } from "./components/shareModal.js";
import { renderCommandPalette } from "./components/commandPalette.js";
import { renderAddSectionModal } from "./components/addSectionModal.js";
import { renderImageModal } from "./components/imageModal.js";
import { renderInspector } from "./components/inspector.js";
import { renderWebsiteHTML, generateLocalBusinessSchema } from "./components/renderer.js";
import { generateSite, createSectionData } from "./engine/generator.js";
import { processCopilotPrompt, applyCopilotOperations } from "./engine/copilot.js";
import { downloadHTML, downloadJSON } from "./engine/exporter.js";
import { getStylePresetById } from "./data/styles.js";
import { getTradeById } from "./data/trades.js";
import { getTradeFallbackDataUrl } from "./data/imageFallbacks.js";
import { ensureFontCatalog } from "./data/fonts.js";
import { getIcon } from "./components/icons.js";

class App {
  constructor() {
    this.rootEl = document.getElementById("app");
    this.wizardMode = "fast";
    this.activeSidebarTab = "sections";
    this.closerTab = "script";
    this.typographyTarget = "heading";

    this.init();
  }

  init() {
    // Expose app on window for inline handlers
    window.app = this;
    ensureFontCatalog();
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
        this.closeModals();
        this.toggleExportMenu(false);
      }
    });

    // Outside-click dismissal for dropdowns and popovers
    document.addEventListener("click", (e) => {
      const menu = document.getElementById("export-menu");
      const btn = document.getElementById("export-menu-button");
      if (menu && menu.dataset.open === "true" && !menu.contains(e.target) && !btn?.contains(e.target)) {
        this.toggleExportMenu(false);
      }
      document.querySelectorAll(".sec-motion-popover:not(.hidden)").forEach(pop => {
        const secId = pop.dataset.sectionId;
        if (!pop.contains(e.target) && !e.target.closest(`[data-motion-trigger="${secId}"]`)) {
          pop.classList.add("hidden");
        }
      });
    });

    // Check URL parameters (e.g. ?demo=proj-esprit-nature)
    const urlParams = new URLSearchParams(window.location.search);
    const demoId = urlParams.get("demo");
    if (demoId) {
      const p = state.projects.find(x => x.id === demoId || x.name.toLowerCase().includes(demoId.toLowerCase()));
      if (p) {
        state.setCurrentProject(p);
        state.setView("preview");
      }
    }

    this.render();
  }

  render() {
    if (!this.rootEl) return;
    const previousScrollTop = state.currentView === "editor"
      ? document.querySelector("main")?.scrollTop
      : null;

    if (state.currentView === "dashboard") {
      this.rootEl.innerHTML = renderDashboard(state);
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
    if (previousScrollTop !== null && previousScrollTop !== undefined) {
      requestAnimationFrame(() => {
        const main = document.querySelector("main");
        if (main) main.scrollTop = previousScrollTop;
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

    if (state.activeDrawer === "new_project") {
      modalContainer.innerHTML = renderWizardModal();
    } else if (state.activeDrawer === "closer") {
      modalContainer.innerHTML = renderCloserModal(state.currentProject);
    } else if (state.activeDrawer === "share_modal") {
      modalContainer.innerHTML = renderShareModal(state.currentProject);
    } else if (state.activeDrawer === "command_palette") {
      modalContainer.innerHTML = renderCommandPalette(state.currentProject, state.projects);
      setTimeout(() => {
        document.getElementById("cmd-palette-input")?.focus();
      }, 50);
    } else if (state.activeDrawer === "add_section") {
      modalContainer.innerHTML = renderAddSectionModal(state.currentProject);
    } else if (state.activeDrawer === "image_modal") {
      modalContainer.innerHTML = renderImageModal(state);
    } else {
      modalContainer.innerHTML = "";
    }
  }

  // Navigation methods
  openDashboard() {
    state.setView("dashboard");
  }

  openEditor(projectId) {
    if (projectId) state.setCurrentProject(projectId);
    state.setView("editor");
  }

  openPreview(projectId) {
    if (projectId) state.setCurrentProject(projectId);
    state.setView("preview");
  }

  openWizard() {
    state.setDrawer("new_project");
  }

  closeWizard() {
    state.closeDrawer();
  }

  openCloserModal(projectId) {
    if (projectId) state.setCurrentProject(projectId);
    state.setDrawer("closer");
  }

  closeCloserModal() {
    state.closeDrawer();
  }

  openShareModal() {
    state.setDrawer("share_modal");
  }

  closeShareModal() {
    state.closeDrawer();
  }

  copyShareUrl() {
    const input = document.getElementById("share-modal-url-input");
    if (input) {
      input.select();
      navigator.clipboard?.writeText(input.value);
      const label = document.getElementById("btn-copy-share-label");
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
    }
  }

  toggleStickyBar(enabled) {
    if (!state.currentProject) return;
    if (!state.currentProject.settings) state.currentProject.settings = {};
    state.currentProject.settings.stickyBarEnabled = enabled;
    state.pushHistory(enabled ? "Activation bandeau flottant" : "Désactivation bandeau flottant");
    state.saveToStorage();
    this.render();
  }

  updateWhatsAppNumber(number) {
    if (!state.currentProject) return;
    if (!state.currentProject.settings) state.currentProject.settings = {};
    state.currentProject.settings.whatsappNumber = number;
    state.pushHistory("Modification WhatsApp");
    state.saveToStorage();
    this.render();
  }

  switchGlobalTheme(theme) {
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
    state.pushHistory(`Ambiance : ${theme}`);
    state.saveToStorage();
    this.render();
  }

  copyJsonLdSchema() {
    if (!state.currentProject) return;
    const schema = generateLocalBusinessSchema(state.currentProject);
    navigator.clipboard?.writeText(schema);
    alert("✓ Schema.org (LocalBusiness JSON-LD) copié dans le presse-papier !");
  }

  openAddSectionModal() {
    state.setDrawer("add_section");
  }

  closeAddSectionModal() {
    state.closeDrawer();
  }

  closeModals() {
    state.closeDrawer();
    const lightbox = document.getElementById("lightbox-modal");
    if (lightbox) lightbox.classList.remove("open");
  }

  setViewport(vp) {
    state.setViewport(vp);
  }

  updateViewportUI() {
    const vp = state.viewport;
    const canvasContainer = document.getElementById("canvas-container");
    if (canvasContainer) {
      canvasContainer.className = {
        desktop: "w-full max-w-none shadow-none transition-all duration-300 bg-white min-h-full",
        tablet: "w-[768px] mx-auto shadow-sm rounded-2xl overflow-hidden border border-zinc-300 my-8 bg-white transition-all duration-300 min-h-full",
        mobile: "w-[390px] mx-auto shadow-sm rounded-3xl overflow-hidden border-2 border-zinc-400 my-8 bg-white transition-all duration-300 min-h-full"
      }[vp] || "w-full";
    }
    document.querySelectorAll(".viewport-option").forEach(button => {
      const label = button.getAttribute("aria-label") || "";
      const active = (vp === "desktop" && label.includes("ordinateur")) ||
        (vp === "tablet" && label.includes("tablette")) ||
        (vp === "mobile" && label.includes("mobile"));
      button.classList.toggle("is-active", active);
    });
  }

  setSidebarTab(tab) {
    this.activeSidebarTab = tab;
    state.activeSidebarTab = tab;
    
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
    ["script", "whatsapp", "email", "roi"].forEach(t => {
      const btn = document.getElementById(`tab-closer-${t}`);
      const panel = document.getElementById(`closer-panel-${t}`);
      if (btn && panel) {
        if (t === tab) {
          btn.className = "px-3 py-1.5 rounded-md font-medium text-zinc-900 bg-white shadow-xs border border-zinc-200";
          panel.classList.remove("hidden");
        } else {
          btn.className = "px-3 py-1.5 rounded-md font-medium text-zinc-600 hover:text-zinc-900 border border-transparent";
          panel.classList.add("hidden");
        }
      }
    });
  }

  // Wizard Generation Submission with Animated Terminal & AI Call
  async handleWizardSubmit(e) {
    e.preventDefault();
    const name = document.getElementById("wiz-name")?.value || "Artisan";
    const tradeId = document.getElementById("wiz-trade")?.value || "paysagiste";
    const city = document.getElementById("wiz-city")?.value || "Montauban";
    const phone = document.getElementById("wiz-phone")?.value || "07 82 14 39 50";
    const region = document.getElementById("wiz-region")?.value || "Occitanie";
    const presetId = document.getElementById("wiz-preset")?.value || null;
    const ambiance = document.getElementById("wiz-ambiance")?.value || "mineral";
    const tone = document.getElementById("wiz-tone")?.value || "artisan";
    const customColor = document.getElementById("wiz-color")?.value?.trim() || document.getElementById("wiz-color-picker")?.value || null;
    const email = document.getElementById("wiz-email")?.value || null;

    // Show AI Generation Terminal Overlay
    const terminal = document.getElementById("wizard-terminal");
    const nameDisplay = document.getElementById("term-name");
    if (nameDisplay) nameDisplay.textContent = `${name} (${city})`;
    if (terminal) terminal.style.display = "flex";

    // Launch AI request in parallel
    const aiPromise = fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, trade: tradeId, city, phone, region, tone, ambiance })
    }).then(r => r.ok ? r.json() : null).catch(() => null);

    const steps = [
      { id: "step-1", delay: 250 },
      { id: "step-2", delay: 550 },
      { id: "step-3", delay: 850 },
      { id: "step-4", delay: 1150 },
      { id: "step-5", delay: 1450 },
      { id: "step-6", delay: 1750 }
    ];

    steps.forEach(({ id, delay }) => {
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.classList.remove("opacity-40");
          el.classList.add("text-emerald-400");
          const icon = el.querySelector(".step-icon");
          if (icon) icon.textContent = "✓";
        }
      }, delay);
    });

    const aiRes = await aiPromise;

    setTimeout(() => {
      const validColor = customColor && /^#[0-9a-f]{6}$/i.test(customColor) ? customColor : undefined;
      const newProject = generateSite({
        name,
        tradeId,
        city,
        phone,
        region,
        presetId,
        email,
        primaryColor: validColor
      });

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

      state.closeDrawer();
      state.addProject(newProject, true);
    }, 2000);
  }

  // Actions on Sections
  selectSection(sectionId) {
    const alreadySelected = state.selectedSectionId === sectionId;
    state.setSelectedSection(sectionId);
    if (alreadySelected) this.updateSelectedSectionUI();
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

    // 3. Highlight and open accordion in sidebar cards
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

    // 4. Update Right Inspector panel directly without wiping canvas
    const rightInspector = document.getElementById("right-inspector-panel");
    if (rightInspector) {
      const selectedSec = state.currentProject.sections.find(s => s.id === sectionId) || state.currentProject.sections[0];
      rightInspector.innerHTML = renderInspector(selectedSec, state.currentProject, state);
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
      document.querySelector(`.editor-section-wrapper[data-section-id="${sectionId}"]`);

    if (!canvasSec) return false;

    const scrollHost = canvas?.closest("main") || canvas?.parentElement;
    if (scrollHost && typeof scrollHost.scrollTo === "function") {
      const hostRect = scrollHost.getBoundingClientRect();
      const targetRect = canvasSec.getBoundingClientRect();
      const targetTop = scrollHost.scrollTop + targetRect.top - hostRect.top -
        (scrollHost.clientHeight - canvasSec.offsetHeight) / 2;

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
      window.requestAnimationFrame(run);
    } else {
      setTimeout(run, 0);
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

    // 1. Update in-memory state data directly using setDeepValue
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
      saveStatus.className = "text-[11px] font-medium text-amber-600";
    }
  }

  commitFieldUpdate(sectionId, path, value) {
    if (!state.currentProject) return;
    const sec = state.currentProject.sections.find(s => s.id === sectionId);
    if (!sec || !sec.content) return;

    setDeepValue(sec.content, path, value);
    state.pushHistory(`Modification ${path}`);
    state.saveToStorage();
    this.updateUndoRedoUI();

    const saveStatus = document.getElementById("save-status-text");
    if (saveStatus) {
      saveStatus.textContent = "✓ Enregistré";
      saveStatus.className = "text-[11px] font-medium text-zinc-500";
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
    const chevron = parentCard?.querySelector(".section-card-header .text-zinc-400 svg");

    if (isHidden) {
      body.classList.remove("hidden");
      chevron?.classList.add("rotate-180");
    } else {
      body.classList.add("hidden");
      chevron?.classList.remove("rotate-180");
    }
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
    const updated = JSON.parse(JSON.stringify(state.currentProject));
    const sec = updated.sections.find(s => s.id === sectionId);
    if (!sec) return;
    sec.settings = { ...(sec.settings || {}), bgTheme: theme, customBackground: "" };
    state.updateProject(updated, true, `Changement fond (${theme})`);
  }

  setSectionCustomBg(sectionId, hexColor) {
    if (!state.currentProject) return;
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

    // Instant visual replay on the canvas element for immediate 60fps tactile feedback
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

  setSectionMotion(sectionId, preset) {
    if (!state.currentProject) return;
    const allowed = new Set(["none", "fade-in", "slide-up", "slide-in", "spring", "progress-fill", "reveal", "stagger", "shimmer", "pulse"]);
    if (!allowed.has(preset)) return;
    const updated = JSON.parse(JSON.stringify(state.currentProject));
    const sec = updated.sections.find(s => s.id === sectionId);
    if (!sec) return;
    sec.settings = { ...(sec.settings || {}), motionPreset: preset === "none" ? "" : preset };
    state.updateProject(updated, true, `Animation du bloc : ${preset}`);
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
        btn.className = `py-1 border rounded text-center text-[11px] font-medium ${isAct ? 'border-zinc-900 bg-white font-semibold shadow-xs text-zinc-950' : 'border-zinc-200 bg-white text-zinc-600'}`;
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
    }, 4000);
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
    this.showToast(`🗑️ Bouton masqué`, "info", {
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
      const open = wrapper.classList.toggle("is-active");
      wrapper.setAttribute("aria-expanded", String(open));
    }
  }

  adjustFieldFontSize(sectionId, field, delta) {
    if (!state.currentProject) return;
    const sec = state.currentProject.sections.find(s => s.id === sectionId);
    if (!sec) return;
    sec.settings = sec.settings || {};
    const key = `fontSize_${field}`;
    const current = parseFloat(sec.settings[key]) || 0;
    const next = Math.max(-10, Math.min(24, current + delta));
    sec.settings[key] = next;

    // Apply live to DOM element
    const el = document.querySelector(`#section-${sectionId} [data-editable="${field}"]`);
    if (el) {
      el.style.fontSize = next === 0 ? "" : `calc(1em + ${next}px)`;
    }

    state.pushHistory(`Taille de texte ${field} (${next >= 0 ? '+' : ''}${next}px)`);
    state.saveToStorage();
    this.updateUndoRedoUI();
    this.showToast(`Taille du texte : ${next >= 0 ? '+' : ''}${next}px`, "info");
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
        sec.settings[key] = !isCurrentlyBold;
        el.style.fontWeight = isCurrentlyBold ? "400" : "800";
        state.pushHistory(`Style gras ${field}`);
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
        sec.settings[key] = !isCurrentlyItalic;
        el.style.fontStyle = isCurrentlyItalic ? "normal" : "italic";
        state.pushHistory(`Style italique ${field}`);
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
        sec.settings[key] = !isCurrentlyUnderline;
        el.style.textDecoration = isCurrentlyUnderline ? "none" : "underline";
        state.pushHistory(`Style souligné ${field}`);
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
    this._activeEditableEl = el;
    const toolbar = document.getElementById("floating-text-toolbar");
    if (!toolbar) return;

    const rect = el.getBoundingClientRect();
    const mainEl = document.querySelector("main");
    const mainRect = mainEl?.getBoundingClientRect() || { top: 0, left: 0 };
    const scrollTop = mainEl ? mainEl.scrollTop : window.scrollY;

    const topPos = Math.max(8, rect.top - mainRect.top + scrollTop - 40);
    const leftPos = Math.max(16, Math.min(window.innerWidth - 340, rect.left - mainRect.left));

    toolbar.style.top = `${topPos}px`;
    toolbar.style.left = `${leftPos}px`;
    toolbar.style.display = "flex";

    const btnFontDown = document.getElementById("ftb-font-down");
    const btnFontUp = document.getElementById("ftb-font-up");
    const btnBold = document.getElementById("ftb-bold");
    const btnItalic = document.getElementById("ftb-italic");
    const btnUnderline = document.getElementById("ftb-underline");
    const btnClose = document.getElementById("ftb-close");

    if (btnFontDown) btnFontDown.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.adjustActiveTextFontSize(-1); };
    if (btnFontUp) btnFontUp.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.adjustActiveTextFontSize(1); };
    if (btnBold) btnBold.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.toggleActiveTextBold(); };
    if (btnItalic) btnItalic.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.toggleActiveTextItalic(); };
    if (btnUnderline) btnUnderline.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.toggleActiveTextUnderline(); };
    if (btnClose) btnClose.onclick = (e) => { e.preventDefault(); e.stopPropagation(); toolbar.style.display = "none"; };
  }

  hideFloatingTextToolbar() {
    const toolbar = document.getElementById("floating-text-toolbar");
    if (toolbar) toolbar.style.display = "none";
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
    state.saveToStorage();
    this.render();
    setTimeout(() => {
      this.scrollToSection(newSection.id);
    }, 100);
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

  handleAddSection(type, variant) {
    const project = state.currentProject;
    if (!project) return;
    const trade = getTradeById(project.business.tradeId);
    const secData = createSectionData(type, variant, trade, project.business);
    state.addSection(secData);
    state.closeDrawer();
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
    const promptInput = document.getElementById("ai-image-prompt-input");
    const prompt = promptInput?.value?.trim() || "Photo artisanale pro";
    const btn = document.getElementById("btn-generate-ai-photo");
    const outputContainer = document.getElementById("ai-image-output-container");
    const previewImg = document.getElementById("ai-generated-preview-img");

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="animate-spin mr-1.5">⚡</span><span>Génération du visuel par l'IA en cours...</span>`;
    }

    try {
      const tradeId = state.currentProject?.business?.tradeId || "paysagiste";
      const sectionType = state.activeImageMeta?.sectionType || "hero";

      let imageUrl = "";
      try {
        const res = await fetch("/api/ai/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, tradeId, sectionType, style: this.selectedAIStyle || "4k" })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.imageUrl) imageUrl = data.imageUrl;
        }
      } catch (err) {
        // Fallback to vector engine
      }

      if (!imageUrl) {
        const { getTradeFallbackDataUrl } = await import("./data/imageFallbacks.js");
        imageUrl = getTradeFallbackDataUrl(tradeId, sectionType, prompt);
      }

      this.lastGeneratedAIPhotoUrl = imageUrl;
      if (previewImg) previewImg.src = imageUrl;
      if (outputContainer) outputContainer.classList.remove("hidden");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>⚡ Regénérer une autre variante</span>`;
      }
    }
  }

  applyGeneratedAIPhoto() {
    if (!this.lastGeneratedAIPhotoUrl || !state.activeImageMeta) return;
    const { sectionId, fieldPath, itemIndex } = state.activeImageMeta;
    this.applyImageUpdate(sectionId, fieldPath, this.lastGeneratedAIPhotoUrl, itemIndex);
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

  setSectionMotion(secId, preset) {
    if (!state.currentProject) return;
    const updated = JSON.parse(JSON.stringify(state.currentProject));
    const sec = updated.sections.find(s => s.id === secId);
    if (!sec) return;
    sec.motionPreset = preset;
    state.updateProject(updated, true, `Animation section (${preset})`);

    const pop = document.getElementById(`sec-motion-popover-${secId}`);
    if (pop) pop.classList.add("hidden");

    // Immediate live replay on canvas element
    const secEl = document.getElementById(`section-${secId}`);
    if (secEl) {
      secEl.setAttribute("data-motion", preset);
      secEl.classList.remove("is-revealed");
      void secEl.offsetWidth; // trigger DOM reflow to restart CSS animation
      secEl.classList.add("is-revealed");
    }
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
    state.currentProject.branding.borderRadius = radius;
    state.currentProject.branding.buttonRadius = btnRadius;

    const root = document.querySelector(".artisite-root");
    if (root) {
      root.style.setProperty("--radius", radius);
      root.style.setProperty("--btn-radius", btnRadius);
      root.style.setProperty("--cta-radius", btnRadius);
    }
    state.pushHistory("Modification arrondi");
    state.saveToStorage();
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
    const motionElements = document.querySelectorAll("[data-motion]:not([data-motion='none'])");
    if (!motionElements.length) return;

    if (typeof IntersectionObserver === "undefined") {
      motionElements.forEach(el => el.classList.add("is-revealed"));
      return;
    }

    if (this._scrollObserver) {
      this._scrollObserver.disconnect();
    }

    const scrollContainer = document.querySelector("main.overflow-y-auto") || document.querySelector("main") || null;

    this._scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
        }
      });
    }, {
      root: scrollContainer,
      threshold: 0.05,
      rootMargin: "0px 0px -20px 0px"
    });

    motionElements.forEach(el => {
      this._scrollObserver.observe(el);
    });

    if (scrollContainer && !this._mainScrollBound) {
      scrollContainer.addEventListener("scroll", () => {
        const containerRect = scrollContainer.getBoundingClientRect();
        document.querySelectorAll("[data-motion]:not([data-motion='none']):not(.is-revealed)").forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.top < containerRect.bottom + 60 && r.bottom > containerRect.top - 60) {
            el.classList.add("is-revealed");
          }
        });
      }, { passive: true });
      this._mainScrollBound = true;
    }
  }

  updateTypography(headingFont, bodyFont) {
    if (!state.currentProject) return;
    state.currentProject.branding.headingFont = headingFont;
    state.currentProject.branding.bodyFont = bodyFont;

    const root = document.querySelector(".artisite-root");
    if (root) {
      root.style.setProperty("--font-heading", `'${headingFont}', -apple-system, BlinkMacSystemFont, sans-serif`);
      root.style.setProperty("--font-body", `'${bodyFont}', -apple-system, BlinkMacSystemFont, sans-serif`);
    }

    state.pushHistory(`Typographie : ${headingFont}`);
    state.saveToStorage();
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

    const targetId = promptText.match(/#([a-z][a-z0-9-]*)/i)?.[1] || null;
    const targetNode = targetId ? document.querySelector(`[data-ui-id="${targetId}"]`) : null;

    const feedback = document.getElementById("copilot-feedback");
    if (feedback) {
      feedback.innerHTML = `
        <div class="ai-state-indicator flex items-center gap-2 p-2 bg-amber-50 rounded-lg text-amber-900 border border-amber-200">
          <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
          <span class="text-xs font-semibold">Analyse & Raisonnement en cours...</span>
        </div>
      `;
      feedback.classList.remove("hidden");
    }

    const renderApprovalCard = (summary, onApply) => {
      if (!feedback) {
        onApply();
        return;
      }
      feedback.innerHTML = `
        <div class="ai-approval-card border border-zinc-200 bg-white p-3.5 rounded-xl shadow-md space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <span>✨</span> Proposition Studio IA
            </span>
            <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Confiance 96%
            </span>
          </div>
          <div class="ai-confidence-bar h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div class="ai-confidence-fill h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" style="width: 96%;"></div>
          </div>
          <p class="text-xs text-zinc-600 font-medium">${summary}</p>
          <div class="ai-approval-actions flex gap-2 pt-1">
            <button type="button" id="btn-approve-ai" class="btn-keycap btn-keycap-dark flex-1 py-1.5 text-xs font-bold text-white bg-zinc-900 rounded-lg shadow-xs">
              ✓ Appliquer
            </button>
            <button type="button" id="btn-reject-ai" class="btn-keycap btn-keycap-light px-3 py-1.5 text-xs text-zinc-600 rounded-lg">
              ✕ Ignorer
            </button>
          </div>
        </div>
      `;
      const btnApprove = document.getElementById("btn-approve-ai");
      const btnReject = document.getElementById("btn-reject-ai");
      if (btnApprove) {
        btnApprove.onclick = () => {
          onApply();
          feedback.innerHTML = `<div class="text-xs font-semibold text-emerald-700 p-2 bg-emerald-50 rounded-lg border border-emerald-200">✅ Modification appliquée avec succès (Annulation ⌘Z possible)</div>`;
          if (input) input.value = "";
          setTimeout(() => state.setCopilotOpen(false), 900);
        };
      }
      if (btnReject) {
        btnReject.onclick = () => {
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
        if (json.success && json.data) {
          const d = json.data;
          const updated = JSON.parse(JSON.stringify(state.currentProject));
          if (Array.isArray(d.operations)) {
            const targeted = applyCopilotOperations(updated, d.operations);
            if (!targeted.applied.length) {
              if (feedback) feedback.textContent = `⚠️ ${d.summary || "Aucune opération valide n’a été appliquée."}`;
              return;
            }
            renderApprovalCard(d.summary || "Modification ciblée prête à être appliquée.", () => {
              state.updateProject(targeted.project, true, `Copilot ciblé: ${promptText}`);
            });
            return;
          }
          if (d.suggestedPreset) {
            const p = getStylePresetById(d.suggestedPreset);
            if (p) {
              updated.branding.presetId = p.id;
              updated.branding.primaryColor = p.primaryColor;
              updated.branding.secondaryColor = p.secondaryColor;
              updated.branding.bgColor = p.bgColor;
              updated.branding.textColor = p.textColor;
            }
          }
          if (d.borderRadius) updated.branding.borderRadius = d.borderRadius;
          if (d.buttonRadius) updated.branding.buttonRadius = d.buttonRadius;
          const hero = updated.sections.find(s => s.type === "hero");
          if (hero && hero.content) {
            if (d.updatedTitle) hero.content.title = d.updatedTitle;
            if (d.updatedSubtitle) hero.content.subtitle = d.updatedSubtitle;
            if (d.updatedBadge) hero.content.badge = d.updatedBadge;
          }
          renderApprovalCard(d.summary || "Modifications prêtes à être appliquées par Gemini !", () => {
            state.updateProject(updated, true, `Copilot AI: ${promptText}`);
          });
          return;
        }
      }
    } catch (err) {
      console.warn("API Copilot failed, using local engine:", err);
    }

    // Local fallback
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
      state.deleteProject(id);
    }
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
    const siteHTML = renderWebsiteHTML(project, { isEditor: false, isStandalone: false });

    const isClientDemo = window.location.search.includes("demo=");

    this.rootEl.innerHTML = `
      <div class="relative min-h-screen bg-zinc-950">
        
        ${isClientDemo ? "" : `
        <!-- Floating Commercial Pitch Ribbon for Michel -->
        <div class="fixed top-3 left-1/2 transform -translate-x-1/2 z-50 bg-zinc-950/90 text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-md border border-zinc-800 flex items-center gap-3.5 text-xs">
          <div class="flex items-center gap-2 font-medium text-zinc-300">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Proposition : <strong class="text-white">${project.business.name}</strong></span>
          </div>

          <div class="h-3.5 w-[1px] bg-zinc-800"></div>

          <button type="button" onclick="window.app.openEditor()" class="text-zinc-400 hover:text-white font-medium flex items-center gap-1 transition-colors">
            ${getIcon("edit", "w-3.5 h-3.5")}
            <span>Retour Éditeur</span>
          </button>

          <button type="button" onclick="window.app.openCloserModal()" class="px-2.5 py-1 rounded-full bg-white text-zinc-950 hover:bg-zinc-100 font-medium flex items-center gap-1 shadow-xs transition-colors">
            ${getIcon("sparkles", "w-3.5 h-3.5")}
            <span>Script Appel</span>
          </button>
        </div>
        `}

        <!-- The Clean Site Canvas without any editor chrome -->
        <div>
          ${siteHTML}
        </div>

      </div>
    `;

    this.initCanvasInteractivity();
    this.syncSiteThemeToggle();
    this.hydrateImageFallbacks();
  }

  // Interactive hooks for the canvas
  initCanvasInteractivity() {
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
        document.querySelectorAll(".faq-item").forEach(el => el.classList.remove("active"));
        if (!isOpen) item.classList.add("active");
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
      const setOpen = (open) => wrapper.setAttribute("aria-expanded", String(open));
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
        if (event.target.closest(".cta-context-popover") || event.target.closest(".cta-direct-badge")) return;
        event.preventDefault();

        // If clicking on the editable label inside the button, focus it for inline typing
        const editableSpan = event.target.closest("[data-editable]");
        if (editableSpan) {
          editableSpan.focus();
          return;
        }

        this.hideFloatingTextToolbar();
        document.querySelectorAll("[data-cta-popover-wrapper].is-active").forEach(w => {
          if (w !== wrapper) {
            w.classList.remove("is-active");
            w.setAttribute("aria-expanded", "false");
          }
        });

        const open = wrapper.classList.toggle("is-active");
        setOpen(open);
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

    if (!this._popoverOutsideClickBound) {
      document.addEventListener("click", (e) => {
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
        const value = el.innerText;
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
            saveStatus.className = "text-[11px] font-medium text-amber-600";
          }
        }
      };

      el.onblur = () => {
        const field = el.getAttribute("data-editable");
        const value = el.innerText.trim();
        const initialValue = el.dataset.initialValue;
        const secWrapper = el.closest(".editor-section-wrapper");
        const secId = secWrapper?.getAttribute("data-section-id");
        if (secId && field && value !== initialValue) {
          this.commitFieldUpdate(secId, field, value);
        }
      };

      el.onkeydown = (e) => {
        if (e.key === "Enter" && !el.tagName.toLowerCase().includes("p")) {
          e.preventDefault();
          el.blur();
        }
      };
    });

    // Sidebar Section Reordering via HTML5 Drag & Drop
    document.querySelectorAll(".section-card-grip[draggable='true']").forEach(grip => {
      grip.addEventListener("dragstart", (e) => {
        this._isDragging = true;
        this._justDragged = true;
        const secId = grip.getAttribute("data-sec-id");
        e.dataTransfer.setData("text/plain", secId);
        e.dataTransfer.effectAllowed = "move";
        const card = grip.closest(".section-card");
        if (card) card.classList.add("is-dragging");
      });

      grip.addEventListener("dragend", () => {
        this._isDragging = false;
        setTimeout(() => { this._justDragged = false; }, 200);
        document.querySelectorAll(".section-card").forEach(el => {
          el.classList.remove("is-dragging", "drop-above", "drop-below");
        });
      });
    });

    document.querySelectorAll(".section-card").forEach(card => {
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

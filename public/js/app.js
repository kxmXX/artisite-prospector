import { state, getDeepValue, setDeepValue } from "./state.js";
import { renderDashboard } from "./components/dashboard.js";
import { renderEditor } from "./components/editor.js";
import { renderWizardModal } from "./components/wizard.js";
import { renderCloserModal } from "./components/closerModal.js";
import { renderShareModal } from "./components/shareModal.js";
import { renderCommandPalette } from "./components/commandPalette.js";
import { renderAddSectionModal } from "./components/addSectionModal.js";
import { renderImageModal } from "./components/imageModal.js";
import { renderWebsiteHTML, generateLocalBusinessSchema } from "./components/renderer.js";
import { generateSite, createSectionData } from "./engine/generator.js";
import { processCopilotPrompt } from "./engine/copilot.js";
import { downloadHTML, downloadJSON } from "./engine/exporter.js";
import { getStylePresetById } from "./data/styles.js";
import { getTradeById } from "./data/trades.js";
import { getTradeFallbackDataUrl } from "./data/imageFallbacks.js";
import { getIcon } from "./components/icons.js";

class App {
  constructor() {
    this.rootEl = document.getElementById("app");
    this.wizardMode = "fast";
    this.activeSidebarTab = "sections";
    this.closerTab = "script";

    this.init();
  }

  init() {
    // Expose app on window for inline handlers
    window.app = this;
    document.body.classList.toggle("dark-theme", state.themeMode === "dark");

    // Subscribe to state changes
    state.subscribe((s, event) => {
      if (event === "live_text_change" || event === "live_color_change" || event === "live_business_change" || event === "sidebar_tab_change") {
        return;
      }
      if (event === "theme_mode_change") {
        document.body.classList.toggle("dark-theme", s.themeMode === "dark");
        this.render();
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
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        this.undo();
      } else if ((e.metaKey || e.ctrlKey) && (e.shiftKey && e.key.toLowerCase() === "z" || e.key.toLowerCase() === "y")) {
        e.preventDefault();
        this.redo();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        this.openCommandPalette();
      } else if (e.key === "Escape") {
        this.closeModals();
      }
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
    } else if (theme === "mineral") {
      b.bgColor = "#f4f4f5";
      b.bgSecondary = "#ffffff";
      b.textColor = "#18181b";
      b.textMuted = "#71717a";
    } else if (theme === "dark") {
      b.bgColor = "#09090b";
      b.bgSecondary = "#18181b";
      b.textColor = "#f4f4f5";
      b.textMuted = "#a1a1aa";
    }
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
      body: JSON.stringify({ name, trade: tradeId, city, phone, region })
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
      const newProject = generateSite({
        name,
        tradeId,
        city,
        phone,
        region,
        presetId,
        email
      });

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
    state.setSelectedSection(sectionId);
    this.updateSelectedSectionUI();
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
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
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

  scrollToSection(sectionId) {
    const canvasSec = document.getElementById(`section-${sectionId}`) || document.querySelector(`.editor-section-wrapper[data-section-id="${sectionId}"]`);
    if (canvasSec) {
      canvasSec.scrollIntoView({ behavior: "smooth", block: "center" });
      canvasSec.classList.remove("section-focus-glow");
      void canvasSec.offsetWidth; // Trigger reflow
      canvasSec.classList.add("section-focus-glow");
      setTimeout(() => {
        canvasSec.classList.remove("section-focus-glow");
      }, 1600);
    }
  }

  toggleSectionAccordion(sectionId, event) {
    const card = document.querySelector(`.section-card[data-sec-id="${sectionId}"]`);
    const accordion = document.getElementById(`accordion-${sectionId}`);
    const chevron = card?.querySelector(".accordion-chevron");
    
    if (!accordion || !card) {
      this.scrollToSection(sectionId);
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
      this.scrollToSection(sectionId);
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
    const themes = ["white", "mineral", "dark"];
    const current = sec.settings.bgTheme || "white";
    const nextIdx = (themes.indexOf(current) + 1) % themes.length;
    this.setSectionBg(sectionId, themes[nextIdx]);
  }

  setSectionBg(sectionId, theme) {
    if (!state.currentProject) return;
    const sec = state.currentProject.sections.find(s => s.id === sectionId);
    if (!sec) return;
    if (!sec.settings) sec.settings = {};
    sec.settings.bgTheme = theme;

    // Apply directly to canvas element classes
    const canvasSec = document.getElementById(`section-${sectionId}`) || document.querySelector(`.editor-section-wrapper[data-section-id="${sectionId}"]`);
    if (canvasSec) {
      canvasSec.classList.remove("bg-sec-white", "bg-sec-mineral", "bg-sec-dark");
      canvasSec.classList.add(`bg-sec-${theme}`);
    }

    state.pushHistory(`Changement fond (${theme})`);
    state.saveToStorage();
    this.updateUndoRedoUI();

    // Update active button state in sidebar if open
    const accordion = document.getElementById(`accordion-${sectionId}`);
    if (accordion) {
      const btns = accordion.querySelectorAll(".grid-cols-3 button");
      const map = ["white", "mineral", "dark"];
      btns.forEach((b, i) => {
        if (map[i] === theme) {
          b.className = "py-1 text-[11px] font-medium border rounded text-center transition-colors border-zinc-900 bg-white font-semibold shadow-xs";
        } else {
          b.className = "py-1 text-[11px] font-medium border rounded text-center transition-colors border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-white";
        }
      });
    }
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
    state.setEditorMode(mode);
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

  liveUpdateBorderRadius(radius, btnRadius) {
    if (!state.currentProject) return;
    state.currentProject.branding.borderRadius = radius;
    state.currentProject.branding.buttonRadius = btnRadius;

    const root = document.querySelector(".artisite-root");
    if (root) {
      root.style.setProperty("--radius", radius);
      root.style.setProperty("--btn-radius", btnRadius);
    }
    state.pushHistory("Modification arrondi");
    state.saveToStorage();
    this.updateUndoRedoUI();

    // Update border radius button active states in sidebar settings
    const tabSettings = document.getElementById("sidebar-tab-settings");
    if (tabSettings) {
      const btns = tabSettings.querySelectorAll(".grid-cols-3 button");
      btns.forEach((btn, idx) => {
        const radMap = ['0.25rem', '0.75rem', '1.5rem'];
        const isAct = radMap[idx] === radius;
        btn.className = `py-1.5 border text-center font-medium transition-all ${isAct ? 'border-zinc-900 bg-white font-semibold shadow-xs text-zinc-950' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'} ${idx === 0 ? 'rounded-md' : idx === 1 ? 'rounded-lg' : 'rounded-full'}`;
      });
    }
  }

  updateBorderRadius(radius, btnRadius) {
    this.liveUpdateBorderRadius(radius, btnRadius);
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

    const feedback = document.getElementById("copilot-feedback");
    if (feedback) {
      feedback.textContent = "⏳ Analyse de la demande en cours...";
      feedback.classList.remove("hidden");
    }

    try {
      const apiRes = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: promptText, project: state.currentProject })
      });
      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json.success && json.data) {
          const d = json.data;
          const updated = JSON.parse(JSON.stringify(state.currentProject));
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
          state.updateProject(updated, true, `Copilot AI: ${promptText}`);
          if (feedback) {
            feedback.textContent = `✨ ${d.summary || 'Modifications appliquées par Gemini !'}`;
          }
          if (input) input.value = "";
          return;
        }
      }
    } catch (err) {
      console.warn("API Copilot failed, using local engine:", err);
    }

    // Local fallback
    const res = processCopilotPrompt(state.currentProject, promptText);
    state.updateProject(res.project, true, `Copilot: ${promptText}`);
    if (feedback) {
      feedback.textContent = `✓ ${res.message}`;
    }
    if (input) input.value = "";
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
    if (state.currentProject) {
      downloadHTML(state.currentProject);
    }
  }

  exportJSON() {
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
          Document commercial non contractuel • Artisite Prospector v4.0
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

    this.rootEl.innerHTML = `
      <div class="relative min-h-screen bg-zinc-950">
        
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

    // 1. Before / After slider
    const container = document.querySelector(".ba-container");
    if (container) {
      const beforeWrapper = container.querySelector(".ba-img-before-wrapper");
      const beforeImg = container.querySelector(".ba-img-before");
      const handle = container.querySelector(".ba-handle");

      if (beforeWrapper && handle) {
        const updateSlider = (x) => {
          const rect = container.getBoundingClientRect();
          let posX = x - rect.left;
          if (posX < 0) posX = 0;
          if (posX > rect.width) posX = rect.width;
          const percentage = (posX / rect.width) * 100;
          beforeWrapper.style.width = percentage + "%";
          handle.style.left = percentage + "%";
          if (beforeImg) beforeImg.style.width = rect.width + "px";
        };

        window.addEventListener("resize", () => {
          const rect = container.getBoundingClientRect();
          if (beforeImg) beforeImg.style.width = rect.width + "px";
        });

        let isDragging = false;
        handle.onmousedown = () => { isDragging = true; };
        window.onmouseup = () => { isDragging = false; };
        window.onmousemove = (e) => {
          if (isDragging) updateSlider(e.clientX);
        };

        handle.ontouchstart = () => { isDragging = true; };
        window.ontouchend = () => { isDragging = false; };
        window.ontouchmove = (e) => {
          if (isDragging && e.touches[0]) updateSlider(e.touches[0].clientX);
        };

        setTimeout(() => {
          const rect = container.getBoundingClientRect();
          if (beforeImg) beforeImg.style.width = rect.width + "px";
        }, 100);
      }
    }

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
        e.stopPropagation();
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
        const secWrapper = el.closest(".editor-section-wrapper");
        const secId = secWrapper?.getAttribute("data-section-id");
        if (secId && field) {
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
    document.querySelectorAll(".section-card[draggable='true'], .section-item-drag").forEach(item => {
      item.addEventListener("dragstart", (e) => {
        if (e.target.closest("input, textarea, select, button, .section-accordion-body")) {
          e.preventDefault();
          return;
        }
        const secId = item.getAttribute("data-sec-id");
        e.dataTransfer.setData("text/plain", secId);
        e.dataTransfer.effectAllowed = "move";
        item.classList.add("is-dragging");
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("is-dragging");
        document.querySelectorAll(".section-card, .section-item-drag").forEach(el => {
          el.classList.remove("drop-above", "drop-below");
        });
      });

      item.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const rect = item.getBoundingClientRect();
        const isAfter = (e.clientY - rect.top) > (rect.height / 2);
        if (isAfter) {
          item.classList.remove("drop-above");
          item.classList.add("drop-below");
        } else {
          item.classList.remove("drop-below");
          item.classList.add("drop-above");
        }
      });

      item.addEventListener("dragleave", (e) => {
        if (e.relatedTarget && item.contains(e.relatedTarget)) return;
        item.classList.remove("drop-above", "drop-below");
      });

      item.addEventListener("drop", (e) => {
        e.preventDefault();
        const sourceId = e.dataTransfer.getData("text/plain");
        const targetId = item.getAttribute("data-sec-id");
        const isAfter = item.classList.contains("drop-below");
        item.classList.remove("drop-above", "drop-below");
        if (sourceId && targetId && sourceId !== targetId) {
          state.reorderSections(sourceId, targetId, isAfter ? "after" : "before");
        }
      });
    });
  }
}

// Start app when DOM ready
document.addEventListener("DOMContentLoaded", () => {
  new App();
});

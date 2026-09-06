import { state } from "./state.js";
import { renderDashboard } from "./components/dashboard.js";
import { renderEditor } from "./components/editor.js";
import { renderWizardModal } from "./components/wizard.js";
import { renderCloserModal } from "./components/closerModal.js";
import { renderAddSectionModal } from "./components/addSectionModal.js";
import { renderImageModal } from "./components/imageModal.js";
import { renderWebsiteHTML } from "./components/renderer.js";
import { generateSite, createSectionData } from "./engine/generator.js";
import { processCopilotPrompt } from "./engine/copilot.js";
import { downloadHTML, downloadJSON } from "./engine/exporter.js";
import { getStylePresetById } from "./data/styles.js";
import { getTradeById } from "./data/trades.js";
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

    // Subscribe to state changes
    state.subscribe((s, event) => {
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

  setSidebarTab(tab) {
    this.activeSidebarTab = tab;
    state.activeSidebarTab = tab;
    state.notify("sidebar_tab_change");
  }

  switchWizardMode(mode) {
    this.wizardMode = mode;
    const fastTab = document.getElementById("tab-mode-fast");
    const advTab = document.getElementById("tab-mode-adv");
    const advFields = document.getElementById("wiz-advanced-fields");
    
    if (mode === "fast") {
      fastTab.className = "pb-3 border-b-2 border-orange-600 text-orange-600 flex items-center gap-1.5";
      advTab.className = "pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 flex items-center gap-1.5";
      if (advFields) advFields.style.display = "none";
    } else {
      advTab.className = "pb-3 border-b-2 border-orange-600 text-orange-600 flex items-center gap-1.5";
      fastTab.className = "pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 flex items-center gap-1.5";
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
          btn.className = "pb-3 border-b-2 border-orange-600 text-orange-600";
          panel.classList.remove("hidden");
        } else {
          btn.className = "pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900";
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
    ["library", "url", "upload"].forEach(t => {
      const btn = document.getElementById(`tab-img-${t}`);
      const panel = document.getElementById(`image-panel-${t}`);
      if (btn && panel) {
        if (t === tab) {
          btn.className = "pb-2.5 border-b-2 border-orange-600 text-orange-600";
          panel.style.display = "block";
        } else {
          btn.className = "pb-2.5 border-b-2 border-transparent text-slate-500 hover:text-slate-900";
          panel.style.display = "none";
        }
      }
    });
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
      const placeholder = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80";
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

  updateBrandingColor(colorKey, value) {
    const proj = JSON.parse(JSON.stringify(state.currentProject));
    proj.branding[colorKey] = value;
    state.updateProject(proj, true, `Mise à jour couleur ${colorKey}`);
  }

  updateBorderRadius(radius, btnRadius) {
    const proj = JSON.parse(JSON.stringify(state.currentProject));
    proj.branding.borderRadius = radius;
    proj.branding.buttonRadius = btnRadius;
    state.updateProject(proj, true, "Mise à jour arrondi");
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
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; }
          .header { border-bottom: 2px solid #ea580c; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
          h1 { margin: 0; font-size: 24px; color: #0f172a; }
          .sub { color: #ea580c; font-weight: bold; margin-top: 5px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background: #f8fafc; }
          .card h3 { margin-top: 0; font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; }
          ul { padding-left: 20px; font-size: 14px; line-height: 1.8; }
          .pricing { background: #fff7ed; border: 2px solid #fdba74; border-radius: 12px; padding: 25px; margin-top: 30px; }
          .price-val { font-size: 32px; font-weight: bold; color: #ea580c; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Proposition de Site Vitrine Professionnel</h1>
            <div class="sub">Destinée à : ${b.name} (${b.city})</div>
          </div>
          <div style="text-align: right; font-size: 13px;">
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
          <h3 style="margin-top:0;">Offre Spéciale Clé en Main</h3>
          <div class="price-val">990 € H.T. <span style="font-size:16px; color:#475569; font-weight:normal;">(ou 89 € / mois hébergement & nom de domaine inclus)</span></div>
          <p style="font-size:14px; margin-top:10px; color:#475569;">
            Site déjà développé, configuré et prêt à être branché sur votre nom de domaine officiel sous 48 heures.
          </p>
        </div>

        <div class="footer">
          Document commercial non contractuel • Édité avec Artisite Prospector v4.0
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
      <div class="relative min-h-screen bg-slate-900">
        
        <!-- Floating Commercial Pitch Ribbon for Michel -->
        <div class="fixed top-3 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md border border-slate-700 flex items-center gap-4 text-xs">
          <div class="flex items-center gap-2 font-semibold">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Proposition pour <strong>${project.business.name}</strong></span>
          </div>

          <div class="h-4 w-[1px] bg-slate-700"></div>

          <button type="button" onclick="window.app.openEditor()" class="text-slate-300 hover:text-white font-medium flex items-center gap-1">
            ${getIcon("edit", "w-3.5 h-3.5")}
            <span>Retour Éditeur</span>
          </button>

          <button type="button" onclick="window.app.openCloserModal()" class="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1">
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
  }

  // Interactive hooks for the canvas
  initCanvasInteractivity() {
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

    // Toolbar buttons click
    document.querySelectorAll(".editor-section-toolbar button").forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const action = btn.getAttribute("data-action");
        const secId = btn.getAttribute("data-id");
        if (action === "move-up") this.moveSection(secId, "up");
        else if (action === "move-down") this.moveSection(secId, "down");
        else if (action === "toggle-vis") this.toggleSectionVisibility(secId);
        else if (action === "duplicate") this.duplicateSection(secId);
        else if (action === "delete") this.deleteSection(secId);
      };
    });

    // Direct contenteditable on text elements
    document.querySelectorAll("[data-editable]").forEach(el => {
      el.setAttribute("contenteditable", "true");
      el.classList.add("hover:outline", "hover:outline-2", "hover:outline-orange-400", "rounded", "transition-all", "cursor-text");

      el.addEventListener("click", (e) => {
        e.stopPropagation();
      });

      el.onblur = () => {
        const field = el.getAttribute("data-editable");
        const value = el.innerText.trim();
        const secWrapper = el.closest(".editor-section-wrapper");
        const secId = secWrapper?.getAttribute("data-section-id");
        if (secId && field) {
          this.updateSectionContent(secId, field, value);
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
    document.querySelectorAll(".section-item-drag").forEach(item => {
      item.addEventListener("dragstart", (e) => {
        const secId = item.getAttribute("data-sec-id");
        e.dataTransfer.setData("text/plain", secId);
        e.dataTransfer.effectAllowed = "move";
        item.classList.add("is-dragging");
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("is-dragging");
        document.querySelectorAll(".section-item-drag").forEach(el => {
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

      item.addEventListener("dragleave", () => {
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

import { SAMPLE_PROJECTS } from "./data/sampleProjects.js";

const STORAGE_KEY = "artisite_projects_v4";

class AppStateManager {
  constructor() {
    this.projects = [];
    this.currentProject = null;
    this.currentView = "dashboard"; // "dashboard", "editor", "preview"
    this.viewport = "desktop"; // "desktop", "tablet", "mobile"
    this.selectedSectionId = null;
    this.activeInspectorTab = "content"; // "content", "style", "visibility"
    this.activeSidebarTab = "sections"; // "sections", "settings"
    this.activeDrawer = null; // null, "closer", "new_project", "add_section"

    // History for Undo/Redo
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 30;

    // Listeners
    this.listeners = new Set();

    this.init();
  }

  init() {
    this.loadFromStorage();
    if (this.projects.length === 0) {
      this.projects = [...SAMPLE_PROJECTS];
      this.saveToStorage();
    }
    this.currentProject = this.projects[0];
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(changeEvent = "state_change") {
    this.listeners.forEach(cb => {
      try {
        cb(this, changeEvent);
      } catch (err) {
        console.error("State listener error:", err);
      }
    });
  }

  loadFromStorage() {
    try {
      if (typeof localStorage !== "undefined") {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          this.projects = JSON.parse(data);
        }
      }
    } catch (e) {
      console.warn("Could not read from localStorage, using in-memory:", e);
      this.projects = [];
    }
  }

  saveToStorage() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.projects));
      }
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }

  // View management
  setView(view) {
    this.currentView = view;
    this.notify("view_change");
  }

  setViewport(vp) {
    this.viewport = vp;
    this.notify("viewport_change");
  }

  setDrawer(drawerName) {
    this.activeDrawer = drawerName;
    this.notify("drawer_change");
  }

  closeDrawer() {
    this.activeDrawer = null;
    this.notify("drawer_change");
  }

  // Project selection & CRUD
  setCurrentProject(projectOrId) {
    let proj = typeof projectOrId === "string" 
      ? this.projects.find(p => p.id === projectOrId) 
      : projectOrId;
    if (proj) {
      this.currentProject = proj;
      this.selectedSectionId = proj.sections[0]?.id || null;
      this.undoStack = [];
      this.redoStack = [];
      this.notify("project_selected");
    }
  }

  addProject(newProject, switchToEditor = true) {
    this.projects.unshift(newProject);
    this.saveToStorage();
    if (switchToEditor) {
      this.setCurrentProject(newProject);
      this.setView("editor");
    } else {
      this.notify("project_added");
    }
  }

  updateProject(updatedProject, commitHistory = true, historyDesc = "Modification du projet") {
    if (commitHistory && this.currentProject) {
      this.pushHistory(historyDesc);
    }

    this.currentProject = { ...updatedProject, updatedAt: new Date().toISOString() };
    const idx = this.projects.findIndex(p => p.id === this.currentProject.id);
    if (idx !== -1) {
      this.projects[idx] = this.currentProject;
    }
    this.saveToStorage();
    this.notify("project_updated");
  }

  duplicateProject(projectId) {
    const original = this.projects.find(p => p.id === projectId);
    if (!original) return null;

    const copy = JSON.parse(JSON.stringify(original));
    copy.id = `proj-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    copy.name = `${original.name} (Copie)`;
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = new Date().toISOString();
    copy.pipelineStatus = "prospect";

    this.projects.unshift(copy);
    this.saveToStorage();
    this.notify("project_duplicated");
    return copy;
  }

  deleteProject(projectId) {
    this.projects = this.projects.filter(p => p.id !== projectId);
    if (this.currentProject?.id === projectId) {
      this.currentProject = this.projects[0] || null;
    }
    this.saveToStorage();
    this.notify("project_deleted");
  }

  // Section Management within currentProject
  setSelectedSection(sectionId) {
    if (this.selectedSectionId === sectionId) return;
    this.selectedSectionId = sectionId;
    this.notify("section_selected");
  }

  updateSectionContent(sectionId, fieldPath, value) {
    if (!this.currentProject) return;
    const sec = this.currentProject.sections.find(s => s.id === sectionId);
    if (!sec || !sec.content) return;
    const currentVal = getDeepValue(sec.content, fieldPath);
    if (currentVal === value) return;

    this.pushHistory(`Modification ${fieldPath}`);
    const project = JSON.parse(JSON.stringify(this.currentProject));
    const targetSec = project.sections.find(s => s.id === sectionId);
    if (targetSec && targetSec.content) {
      setDeepValue(targetSec.content, fieldPath, value);
      this.updateProject(project, false);
    }
  }

  updateSectionVariant(sectionId, newVariant) {
    if (!this.currentProject) return;
    this.pushHistory("Changement de variante de section");

    const project = JSON.parse(JSON.stringify(this.currentProject));
    const sec = project.sections.find(s => s.id === sectionId);
    if (sec) {
      sec.variant = newVariant;
      this.updateProject(project, false);
    }
  }

  toggleSectionVisibility(sectionId) {
    if (!this.currentProject) return;
    this.pushHistory("Basculement visibilité section");

    const project = JSON.parse(JSON.stringify(this.currentProject));
    const sec = project.sections.find(s => s.id === sectionId);
    if (sec) {
      sec.visibility = !sec.visibility;
      this.updateProject(project, false);
    }
  }

  moveSection(sectionId, direction = "up") {
    if (!this.currentProject) return;
    this.pushHistory(`Déplacement section ${direction}`);

    const project = JSON.parse(JSON.stringify(this.currentProject));
    const idx = project.sections.findIndex(s => s.id === sectionId);
    if (idx === -1) return;

    if (direction === "up" && idx > 0) {
      const temp = project.sections[idx - 1];
      project.sections[idx - 1] = project.sections[idx];
      project.sections[idx] = temp;
    } else if (direction === "down" && idx < project.sections.length - 1) {
      const temp = project.sections[idx + 1];
      project.sections[idx + 1] = project.sections[idx];
      project.sections[idx] = temp;
    }
    this.updateProject(project, false);
  }

  reorderSections(sourceSectionId, targetSectionId, position = "before") {
    if (!this.currentProject || sourceSectionId === targetSectionId) return;
    this.pushHistory("Réorganisation des sections");

    const project = JSON.parse(JSON.stringify(this.currentProject));
    const sourceIdx = project.sections.findIndex(s => s.id === sourceSectionId);
    const targetIdx = project.sections.findIndex(s => s.id === targetSectionId);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const [movedSec] = project.sections.splice(sourceIdx, 1);
    const newTargetIdx = project.sections.findIndex(s => s.id === targetSectionId);
    const insertIdx = position === "after" ? newTargetIdx + 1 : newTargetIdx;
    project.sections.splice(insertIdx, 0, movedSec);

    this.selectedSectionId = movedSec.id;
    this.updateProject(project, false);
  }

  duplicateSection(sectionId) {
    if (!this.currentProject) return;
    this.pushHistory("Duplication de section");

    const project = JSON.parse(JSON.stringify(this.currentProject));
    const idx = project.sections.findIndex(s => s.id === sectionId);
    if (idx === -1) return;

    const clone = JSON.parse(JSON.stringify(project.sections[idx]));
    clone.id = `sec-${clone.type}-${Date.now()}`;
    project.sections.splice(idx + 1, 0, clone);
    this.selectedSectionId = clone.id;
    this.updateProject(project, false);
  }

  deleteSection(sectionId) {
    if (!this.currentProject) return;
    this.pushHistory("Suppression de section");

    const project = JSON.parse(JSON.stringify(this.currentProject));
    project.sections = project.sections.filter(s => s.id !== sectionId);
    if (this.selectedSectionId === sectionId) {
      this.selectedSectionId = project.sections[0]?.id || null;
    }
    this.updateProject(project, false);
  }

  addSection(newSectionConfig, insertAfterId = null) {
    if (!this.currentProject) return;
    this.pushHistory("Ajout d'une nouvelle section");

    const project = JSON.parse(JSON.stringify(this.currentProject));
    const newSec = {
      id: `sec-${newSectionConfig.type}-${Date.now()}`,
      type: newSectionConfig.type,
      variant: newSectionConfig.variant || "default",
      visibility: true,
      content: newSectionConfig.content || {},
      settings: newSectionConfig.settings || {}
    };

    if (insertAfterId) {
      const idx = project.sections.findIndex(s => s.id === insertAfterId);
      if (idx !== -1) {
        project.sections.splice(idx + 1, 0, newSec);
      } else {
        project.sections.push(newSec);
      }
    } else {
      // Add right before footer if footer exists
      const footerIdx = project.sections.findIndex(s => s.type === "footer");
      if (footerIdx !== -1) {
        project.sections.splice(footerIdx, 0, newSec);
      } else {
        project.sections.push(newSec);
      }
    }

    this.selectedSectionId = newSec.id;
    this.updateProject(project, false);
    this.closeDrawer();
  }

  // History: Undo / Redo
  pushHistory(actionDescription = "Action") {
    if (!this.currentProject) return;
    const snapshot = JSON.stringify(this.currentProject);
    this.undoStack.push({ snapshot, desc: actionDescription });
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = []; // clear redo on new change
    this.notify("history_change");
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  undo() {
    if (!this.canUndo() || !this.currentProject) return;
    const currentSnapshot = JSON.stringify(this.currentProject);
    const prev = this.undoStack.pop();
    this.redoStack.push({ snapshot: currentSnapshot, desc: prev.desc });

    const restoredProject = JSON.parse(prev.snapshot);
    this.currentProject = restoredProject;
    const idx = this.projects.findIndex(p => p.id === restoredProject.id);
    if (idx !== -1) this.projects[idx] = restoredProject;
    this.saveToStorage();
    this.notify("undo");
  }

  redo() {
    if (!this.canRedo() || !this.currentProject) return;
    const currentSnapshot = JSON.stringify(this.currentProject);
    const next = this.redoStack.pop();
    this.undoStack.push({ snapshot: currentSnapshot, desc: next.desc });

    const restoredProject = JSON.parse(next.snapshot);
    this.currentProject = restoredProject;
    const idx = this.projects.findIndex(p => p.id === restoredProject.id);
    if (idx !== -1) this.projects[idx] = restoredProject;
    this.saveToStorage();
    this.notify("redo");
  }
}

export function getDeepValue(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

export function setDeepValue(obj, path, value) {
  const parts = path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const nextPart = parts[i + 1];
    if (!current[part] || typeof current[part] !== "object") {
      current[part] = /^\d+$/.test(nextPart) ? [] : {};
    }
    current = current[part];
  }
  const lastKey = parts[parts.length - 1];
  current[lastKey] = value;
}

export const state = new AppStateManager();


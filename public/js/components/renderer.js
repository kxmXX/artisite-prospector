import { getIcon } from "./icons.js";

/**
 * Image renderer with optional Editor Controls (Replace, Trash, Drag & Drop).
 */
export function renderEditableImage(url, { sectionId = "", fieldPath = "", alt = "", className = "", options = {}, itemIndex = null } = {}) {
  const isEditor = options?.isEditor;
  const placeholder = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80";
  const displayUrl = url || placeholder;

  if (!isEditor) {
    return `<img src="${displayUrl}" alt="${alt}" class="${className}">`;
  }

  const indexParam = itemIndex !== null && itemIndex !== undefined ? itemIndex : 'null';

  return `
    <div class="relative group/img w-full h-full"
         ondragover="event.preventDefault(); this.classList.add('ring-4', 'ring-orange-500');"
         ondragleave="this.classList.remove('ring-4', 'ring-orange-500');"
         ondrop="event.preventDefault(); this.classList.remove('ring-4', 'ring-orange-500'); window.app.handleImageElementDrop(event, '${sectionId}', '${fieldPath}', ${indexParam});">
      <img src="${displayUrl}" alt="${alt}" class="${className}">
      
      <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20 pointer-events-auto p-2">
        <button type="button" 
                onclick="event.stopPropagation(); window.app.openImagePicker('${sectionId}', '${fieldPath}', ${indexParam})" 
                class="px-2.5 py-1.5 bg-white hover:bg-orange-50 text-slate-900 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1.5 transition-transform hover:scale-105"
                title="Modifier / Remplacer cette image">
          ${getIcon("eye", "w-3.5 h-3.5 text-orange-600")}
          <span>Remplacer</span>
        </button>
        <button type="button" 
                onclick="event.stopPropagation(); window.app.deletePhoto('${sectionId}', '${fieldPath}', ${indexParam})" 
                class="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-lg flex items-center justify-center transition-transform hover:scale-105" 
                title="Supprimer la photo (Poubelle 🗑️)">
          ${getIcon("trash", "w-4 h-4")}
        </button>
      </div>
    </div>
  `;
}

/**
 * Master Renderer for the generated website.
 * Works seamlessly in Editor mode, Fullscreen Preview mode, and Standalone HTML export.
 */

export function renderWebsiteHTML(project, options = { isEditor: false, isStandalone: false }) {
  if (!project || !project.sections) {
    return `<div class="p-12 text-center text-gray-500">Aucun projet chargé</div>`;
  }

  const sectionsHTML = project.sections
    .filter(sec => options.isEditor ? true : sec.visibility !== false)
    .map(sec => renderSection(sec, project, options))
    .join("\n");

  const lightboxHTML = `
    <div id="lightbox-modal" class="lightbox-modal" style="display:none;">
      <span class="lightbox-close">&times;</span>
      <img id="lightbox-target" class="lightbox-img" src="" alt="Agrandissement photo">
    </div>
  `;

  return `
    <div class="artisite-root font-body text-main bg-site min-h-screen" style="
      --primary: ${project.branding.primaryColor};
      --secondary: ${project.branding.secondaryColor};
      --accent: ${project.branding.accentColor};
      --bg: ${project.branding.bgColor};
      --bg-sec: ${project.branding.bgSecondary};
      --text: ${project.branding.textColor};
      --text-muted: ${project.branding.textMuted};
      --font-heading: '${project.branding.headingFont}', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-body: '${project.branding.bodyFont}', -apple-system, BlinkMacSystemFont, sans-serif;
      --radius: ${project.branding.borderRadius};
      --btn-radius: ${project.branding.buttonRadius};
    ">
      ${sectionsHTML}
      ${lightboxHTML}
    </div>
  `;
}

function renderSection(sec, project, options) {
  const isEditor = options.isEditor;
  const isHidden = sec.visibility === false;

  let innerHTML = "";
  switch (sec.type) {
    case "header":
      innerHTML = renderHeader(sec, project, options);
      break;
    case "hero":
      innerHTML = renderHero(sec, project, options);
      break;
    case "trust":
      innerHTML = renderTrust(sec, project, options);
      break;
    case "about":
      innerHTML = renderAbout(sec, project, options);
      break;
    case "stats":
      innerHTML = renderStats(sec, project, options);
      break;
    case "services":
      innerHTML = renderServices(sec, project, options);
      break;
    case "beforeAfter":
      innerHTML = renderBeforeAfter(sec, project, options);
      break;
    case "realisations":
      innerHTML = renderRealisations(sec, project, options);
      break;
    case "gallery":
      innerHTML = renderGallery(sec, project, options);
      break;
    case "reviews":
      innerHTML = renderReviews(sec, project, options);
      break;
    case "quoteSimulator":
      innerHTML = renderQuoteSimulator(sec, project, options);
      break;
    case "hours":
      innerHTML = renderHours(sec, project, options);
      break;
    case "location":
      innerHTML = renderLocation(sec, project, options);
      break;
    case "faq":
      innerHTML = renderFaq(sec, project, options);
      break;
    case "cta":
      innerHTML = renderCta(sec, project, options);
      break;
    case "footer":
      innerHTML = renderFooter(sec, project, options);
      break;
    default:
      innerHTML = `<div class="p-8 text-center text-gray-400">Section ${sec.type}</div>`;
  }

  if (!isEditor) {
    return `<section id="${sec.type}" class="site-section ${isHidden ? 'hidden' : ''}">${innerHTML}</section>`;
  }

  // Editor Wrapper with Controls
  return `
    <div class="editor-section-wrapper relative group ${isHidden ? 'opacity-40 grayscale' : ''}" 
         data-section-id="${sec.id}" 
         data-section-type="${sec.type}">
      
      <!-- Editor Action Bar on Hover / Active -->
      <div class="editor-section-toolbar absolute top-2 right-4 z-40 flex items-center gap-1 bg-gray-900/90 backdrop-blur text-white px-2 py-1 rounded-lg text-xs shadow-lg transition-all opacity-0 group-hover:opacity-100">
        <span class="font-medium text-gray-300 mr-1.5 uppercase tracking-wider text-[10px]">${sec.type}</span>
        <button type="button" class="btn-sec-up p-1 hover:text-amber-400" title="Monter la section" data-action="move-up" data-id="${sec.id}">
          ${getIcon("chevronUp", "w-3.5 h-3.5")}
        </button>
        <button type="button" class="btn-sec-down p-1 hover:text-amber-400" title="Descendre la section" data-action="move-down" data-id="${sec.id}">
          ${getIcon("chevronDown", "w-3.5 h-3.5")}
        </button>
        <button type="button" class="btn-sec-vis p-1 hover:text-amber-400" title="${isHidden ? 'Afficher' : 'Masquer'}" data-action="toggle-vis" data-id="${sec.id}">
          ${getIcon(isHidden ? "eyeOff" : "eye", "w-3.5 h-3.5")}
        </button>
        <button type="button" class="btn-sec-dup p-1 hover:text-amber-400" title="Dupliquer" data-action="duplicate" data-id="${sec.id}">
          ${getIcon("copy", "w-3.5 h-3.5")}
        </button>
        <button type="button" class="btn-sec-del p-1 hover:text-red-400" title="Supprimer" data-action="delete" data-id="${sec.id}">
          ${getIcon("trash", "w-3.5 h-3.5")}
        </button>
      </div>

      <div class="section-canvas-content">
        ${innerHTML}
      </div>
    </div>
  `;
}

// 1. Header
function renderHeader(sec, project) {
  const c = sec.content;
  return `
    <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/5 transition-all">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <a href="#" class="flex items-center gap-3 group">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md transition-transform group-hover:scale-105" style="background-color: var(--primary);">
            ${c.brandName ? c.brandName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <span class="font-heading text-xl font-bold tracking-tight text-gray-900 block leading-tight" data-editable="brandName">${c.brandName}</span>
            <span class="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">${project.business.tradeLabel} • ${project.business.city}</span>
          </div>
        </a>

        <nav class="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
          ${(c.links || []).map(l => `<a href="${l.target}" class="hover:text-gray-900 transition-colors">${l.label}</a>`).join('')}
        </nav>

        <div class="flex items-center gap-3">
          <a href="tel:${c.phone}" class="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            ${getIcon("phone", "w-4 h-4 text-emerald-600")}
            <span data-editable="phone">${c.phone}</span>
          </a>
          <a href="#simulateur" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5" style="background-color: var(--primary);">
            ${getIcon("sparkles", "w-4 h-4")}
            <span data-editable="ctaText">${c.ctaText || "Demander un devis"}</span>
          </a>
        </div>
      </div>
    </header>
  `;
}

// 2. Hero
function renderHero(sec, project, options = {}) {
  const c = sec.content;
  const variant = sec.variant || "split-image";

  // Variant A: Fullscreen Image
  if (variant === "fullscreen-image") {
    const bgEditBtn = options.isEditor ? `
      <div class="absolute top-4 left-4 z-30">
        <button type="button" onclick="event.stopPropagation(); window.app.openImagePicker('${sec.id}', 'heroImage')" class="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 backdrop-blur">
          ${getIcon("eye", "w-3.5 h-3.5 text-orange-400")}
          <span>Changer l'image de fond</span>
        </button>
      </div>
    ` : '';

    return `
      <div class="relative overflow-hidden py-24 lg:py-36 text-white" style="
        background: linear-gradient(rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.85)), url('${c.heroImage}') center/cover no-repeat;
      ">
        ${bgEditBtn}
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md border border-white/20 text-white mx-auto">
            <span class="w-2 h-2 rounded-full animate-pulse" style="background-color: var(--accent);"></span>
            <span data-editable="badge">${c.badge}</span>
          </div>

          <h1 class="font-heading text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] max-w-4xl mx-auto" data-editable="title">
            ${c.title}
          </h1>

          <p class="text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed" data-editable="subtitle">
            ${c.subtitle}
          </p>

          <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#simulateur" class="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-base font-bold text-white shadow-2xl hover:opacity-95 transition-all transform hover:-translate-y-0.5" style="background-color: var(--primary);">
              ${getIcon("sparkles", "w-5 h-5")}
              <span data-editable="ctaPrimary">${c.ctaPrimary}</span>
            </a>

            <a href="tel:${c.phone}" class="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-full text-base font-semibold text-white bg-white/15 backdrop-blur-md border border-white/30 hover:bg-white/25 transition-colors">
              ${getIcon("phone", "w-5 h-5 text-emerald-400")}
              <span data-editable="ctaSecondary">${c.ctaSecondary}</span>
            </a>
          </div>

          <div class="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300 font-medium">
            <span class="flex items-center gap-1.5 text-emerald-400 font-bold">
              ${getIcon("checkCircle", "w-4 h-4")}
              <span>Intervention garantie à ${project.business.city}</span>
            </span>
            <span>•</span>
            <span data-editable="trustNote">${c.trustNote}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Variant B: Dark Theme
  if (variant === "dark") {
    return `
      <div class="relative overflow-hidden py-20 lg:py-28 bg-slate-950 text-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid lg:grid-cols-12 gap-12 items-center">
            
            <div class="lg:col-span-7 space-y-6">
              <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 border border-slate-700 text-amber-400">
                <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span data-editable="badge">${c.badge}</span>
              </div>

              <h1 class="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]" data-editable="title">
                ${c.title}
              </h1>

              <p class="text-lg text-slate-300 max-w-2xl leading-relaxed" data-editable="subtitle">
                ${c.subtitle}
              </p>

              <div class="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <a href="#simulateur" class="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-full text-base font-bold text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5" style="background-color: var(--primary);">
                  ${getIcon("sparkles", "w-5 h-5")}
                  <span data-editable="ctaPrimary">${c.ctaPrimary}</span>
                </a>

                <a href="tel:${c.phone}" class="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-full text-base font-semibold text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors">
                  ${getIcon("phone", "w-5 h-5 text-emerald-400")}
                  <span data-editable="ctaSecondary">${c.ctaSecondary}</span>
                </a>
              </div>

              <div class="pt-2 text-xs text-slate-400 flex items-center gap-3">
                <span class="text-emerald-400 font-semibold flex items-center gap-1">
                  ${getIcon("shield", "w-4 h-4")}
                  <span>Garantie décennale & RC Pro</span>
                </span>
                <span>•</span>
                <span data-editable="trustNote">${c.trustNote}</span>
              </div>
            </div>

            <div class="lg:col-span-5 relative">
              <div class="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-800 bg-slate-900">
                ${renderEditableImage(c.heroImage, { sectionId: sec.id, fieldPath: 'heroImage', alt: c.title, className: 'w-full h-full object-cover', options })}
              </div>
            </div>

          </div>
        </div>
      </div>
    `;
  }

  // Variant C: Minimal Editorial
  if (variant === "minimal") {
    return `
      <div class="relative py-20 lg:py-28 border-b border-black/5" style="background-color: var(--bg);">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div class="inline-block text-xs font-bold uppercase tracking-widest text-gray-500 pb-1 border-b-2 border-gray-400 mx-auto" data-editable="badge">
            ${c.badge}
          </div>

          <h1 class="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight" data-editable="title">
            ${c.title}
          </h1>

          <p class="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed" data-editable="subtitle">
            ${c.subtitle}
          </p>

          <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#simulateur" class="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-bold text-white shadow-md hover:shadow-lg transition-all" style="background-color: var(--primary);">
              ${getIcon("sparkles", "w-4 h-4")}
              <span data-editable="ctaPrimary">${c.ctaPrimary}</span>
            </a>

            <a href="tel:${c.phone}" class="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-gray-800 bg-white border border-gray-300 hover:bg-gray-50 transition-colors">
              ${getIcon("phone", "w-4 h-4 text-emerald-600")}
              <span data-editable="ctaSecondary">${c.ctaSecondary}</span>
            </a>
          </div>

          <div class="pt-4 text-xs text-gray-400">
            <span data-editable="trustNote">${c.trustNote}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Default Variant: Split Image
  return `
    <div class="relative overflow-hidden py-16 lg:py-24" style="background: linear-gradient(180deg, var(--bg-sec) 0%, var(--bg) 100%);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          <div class="lg:col-span-7 space-y-6">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white shadow-sm border border-black/5 text-gray-800" style="color: var(--primary);">
              <span class="w-2 h-2 rounded-full animate-pulse" style="background-color: var(--accent);"></span>
              <span data-editable="badge">${c.badge}</span>
            </div>

            <h1 class="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1]" data-editable="title">
              ${c.title}
            </h1>

            <p class="text-lg sm:text-xl text-gray-600 max-w-2xl leading-relaxed" data-editable="subtitle">
              ${c.subtitle}
            </p>

            <div class="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <a href="#simulateur" class="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-full text-base font-bold text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5" style="background-color: var(--primary);">
                ${getIcon("sparkles", "w-5 h-5")}
                <span data-editable="ctaPrimary">${c.ctaPrimary}</span>
              </a>

              <a href="tel:${c.phone}" class="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-full text-base font-semibold text-gray-800 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
                ${getIcon("phone", "w-5 h-5 text-emerald-600")}
                <span data-editable="ctaSecondary">${c.ctaSecondary}</span>
              </a>
            </div>

            <div class="pt-3 flex items-center gap-3 text-xs font-medium text-gray-500">
              <span class="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                ${getIcon("checkCircle", "w-4 h-4")}
                <span>Intervention directe & déplacement offert</span>
              </span>
              <span>•</span>
              <span data-editable="trustNote">${c.trustNote}</span>
            </div>
          </div>

          <div class="lg:col-span-5 relative">
            <div class="relative mx-auto max-w-md lg:max-w-none">
              <div class="aspect-[4/3] sm:aspect-[1/1] rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
                ${renderEditableImage(c.heroImage, { sectionId: sec.id, fieldPath: 'heroImage', alt: c.title, className: 'w-full h-full object-cover transform hover:scale-105 transition-transform duration-700', options })}
              </div>
              
              <!-- Floating Trust Card -->
              <div class="absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-black/5 flex items-center gap-3.5 max-w-xs">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style="background-color: var(--secondary);">
                  ${getIcon("shield", "w-6 h-6")}
                </div>
                <div>
                  <div class="text-xs font-bold text-gray-900 uppercase tracking-wider">Artisan Référencé</div>
                  <div class="text-sm font-semibold text-gray-700">${project.business.city} & Environs</div>
                  <div class="text-[11px] text-emerald-600 font-medium">✓ Devis sous 24h</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

// 3. Trust Badges
function renderTrust(sec, project) {
  const c = sec.content;
  return `
    <div class="py-12 bg-white border-y border-black/5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          ${(c.badges || []).map((b, idx) => `
            <div class="flex items-start gap-3.5 p-4 rounded-xl hover:bg-gray-50/80 transition-colors">
              <div class="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white" style="background-color: var(--primary);">
                ${getIcon(idx === 0 ? "clock" : idx === 1 ? "shield" : idx === 2 ? "badgeCheck" : "checkCircle", "w-5 h-5")}
              </div>
              <div>
                <h4 class="font-bold text-gray-900 text-sm leading-tight">${b.title}</h4>
                <p class="text-xs text-gray-500 mt-1 leading-normal">${b.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// 4. About
function renderAbout(sec, project, options = {}) {
  const c = sec.content;
  const variant = sec.variant || "editorial-split";

  // Variant A: Centered with Values
  if (variant === "centered-badge") {
    return `
      <div id="about" class="py-20 lg:py-28 text-center" style="background-color: var(--bg);">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700 mx-auto" data-editable="badge">
            ${c.badge || "À propos"}
          </div>

          <h2 class="font-heading text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight" data-editable="title">
            ${c.title}
          </h2>

          <div class="text-gray-600 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto" data-editable="story">
            <p>${c.story}</p>
          </div>

          <div class="pt-6 grid sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            ${(c.points || []).map(pt => `
              <div class="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-black/5 shadow-sm text-sm font-semibold text-gray-800">
                <div class="w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0" style="background-color: var(--primary);">
                  ${getIcon("check", "w-3.5 h-3.5")}
                </div>
                <span>${pt}</span>
              </div>
            `).join('')}
          </div>

          <div class="pt-4 flex items-center justify-center gap-4">
            <span class="font-bold text-gray-900 text-sm" data-editable="owner">${c.owner}</span>
            <span>•</span>
            <span class="text-xs text-gray-500" data-editable="role">${c.role}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Variant B: Quote Card
  if (variant === "quote-card") {
    return `
      <div id="about" class="py-20 lg:py-28" style="background-color: var(--bg-sec);">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="bg-white rounded-3xl p-8 sm:p-14 shadow-xl border border-black/5 relative overflow-hidden">
            <div class="text-6xl font-serif text-gray-200 absolute top-4 left-6 select-none">“</div>
            <div class="relative z-10 space-y-6">
              <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600" data-editable="badge">
                ${c.badge || "Le mot de l'artisan"}
              </div>

              <h2 class="font-heading text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug" data-editable="title">
                ${c.title}
              </h2>

              <p class="text-gray-700 text-lg leading-relaxed italic" data-editable="story">
                « ${c.story} »
              </p>

              <div class="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div class="font-bold text-gray-900 text-base" data-editable="owner">${c.owner}</div>
                  <div class="text-xs text-gray-500" data-editable="role">${c.role} — ${project.business.city}</div>
                </div>

                <a href="#simulateur" class="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-white shadow-md transition-all" style="background-color: var(--primary);">
                  <span>Prendre contact directement</span>
                  ${getIcon("arrowRight", "w-3.5 h-3.5")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Default: Editorial Split
  return `
    <div id="about" class="py-20 lg:py-28" style="background-color: var(--bg);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          <div class="lg:col-span-5 order-2 lg:order-1">
            <div class="relative">
              <div class="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
                ${renderEditableImage(c.image, { sectionId: sec.id, fieldPath: 'image', alt: c.title, className: 'w-full h-full object-cover', options })}
              </div>
              <div class="absolute -bottom-6 -right-6 bg-white p-5 rounded-2xl shadow-xl border border-black/5 max-w-xs">
                <div class="font-bold text-gray-900 text-base" data-editable="owner">${c.owner}</div>
                <div class="text-xs font-semibold text-gray-500" data-editable="role">${c.role}</div>
                <div class="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">
                  ${getIcon("check", "w-4 h-4")}
                  <span>À votre écoute à ${project.business.city}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-7 order-1 lg:order-2 space-y-6">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700" data-editable="badge">
              ${c.badge || "À propos"}
            </div>

            <h2 class="font-heading text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight" data-editable="title">
              ${c.title}
            </h2>

            <div class="text-gray-600 text-base sm:text-lg leading-relaxed space-y-4" data-editable="story">
              <p>${c.story}</p>
            </div>

            <div class="pt-4 grid sm:grid-cols-2 gap-3.5">
              ${(c.points || []).map(pt => `
                <div class="flex items-center gap-2.5 text-sm font-medium text-gray-800">
                  <div class="w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0" style="background-color: var(--primary);">
                    ${getIcon("check", "w-3 h-3")}
                  </div>
                  <span>${pt}</span>
                </div>
              `).join('')}
            </div>

            <div class="pt-6">
              <a href="#simulateur" class="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white shadow-md hover:shadow-lg transition-all" style="background-color: var(--primary);">
                <span>Échanger sur votre projet</span>
                ${getIcon("arrowRight", "w-4 h-4")}
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

// 5. Stats
function renderStats(sec, project) {
  const c = sec.content;
  return `
    <div class="py-14 text-white" style="background-color: var(--primary);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-white/15">
          ${(c.items || []).map(item => `
            <div class="p-4">
              <div class="font-heading text-4xl sm:text-5xl font-extrabold text-white tracking-tight">${item.value}</div>
              <div class="font-bold text-white/90 text-sm mt-2">${item.label}</div>
              <div class="text-xs text-white/70 mt-1">${item.sub}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// 6. Services
function renderServices(sec, project, options = {}) {
  const c = sec.content;
  const variant = sec.variant || "cards-grid";

  // Variant A: 2 Columns Large Format
  if (variant === "2-columns") {
    return `
      <div id="services" class="py-20 lg:py-28" style="background-color: var(--bg-sec);">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white shadow-sm text-gray-800" data-editable="badge">
              ${c.badge}
            </div>
            <h2 class="font-heading text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight" data-editable="title">
              ${c.title}
            </h2>
            <p class="text-gray-600 text-base sm:text-lg" data-editable="subtitle">
              ${c.subtitle}
            </p>
          </div>

          <div class="grid md:grid-cols-2 gap-8 lg:gap-10">
            ${(c.services || []).map((srv, idx) => `
              <div class="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-black/5 flex flex-col group">
                <div class="aspect-[16/9] overflow-hidden relative bg-slate-100">
                  ${renderEditableImage(srv.image, { sectionId: sec.id, fieldPath: 'image', itemIndex: idx, alt: srv.title, className: 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500', options })}
                  <span class="absolute top-4 right-4 z-10 bg-black/75 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    ${srv.tag}
                  </span>
                </div>
                <div class="p-8 flex-1 flex flex-col justify-between space-y-5">
                  <div class="space-y-2.5">
                    <h3 class="font-heading text-2xl font-bold text-gray-900">${srv.title}</h3>
                    <p class="text-gray-600 text-sm leading-relaxed">${srv.desc}</p>
                  </div>
                  <div class="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span class="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg">${srv.price}</span>
                    <a href="#simulateur" class="inline-flex items-center gap-1 text-xs font-bold text-white px-4 py-2 rounded-full shadow hover:opacity-90" style="background-color: var(--primary);">
                      <span>Demander un devis</span>
                      ${getIcon("arrowRight", "w-3.5 h-3.5")}
                    </a>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // Variant B: Editorial Alternating Rows
  if (variant === "editorial") {
    return `
      <div id="services" class="py-20 lg:py-28 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-800" data-editable="badge">
              ${c.badge}
            </div>
            <h2 class="font-heading text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight" data-editable="title">
              ${c.title}
            </h2>
            <p class="text-gray-600 text-base sm:text-lg" data-editable="subtitle">
              ${c.subtitle}
            </p>
          </div>

          <div class="space-y-16">
            ${(c.services || []).map((srv, idx) => {
              const isEven = idx % 2 === 1;
              return `
                <div class="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center ${isEven ? 'lg:flex-row-reverse' : ''}">
                  <div class="lg:col-span-6 ${isEven ? 'lg:order-2' : 'lg:order-1'}">
                    <div class="aspect-[16/10] rounded-3xl overflow-hidden shadow-xl border-2 border-black/5 bg-slate-100">
                      ${renderEditableImage(srv.image, { sectionId: sec.id, fieldPath: 'image', itemIndex: idx, alt: srv.title, className: 'w-full h-full object-cover', options })}
                    </div>
                  </div>
                  <div class="lg:col-span-6 ${isEven ? 'lg:order-1' : 'lg:order-2'} space-y-4">
                    <span class="inline-block text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full">${srv.tag}</span>
                    <h3 class="font-heading text-2xl sm:text-3xl font-extrabold text-gray-900">${srv.title}</h3>
                    <p class="text-gray-600 text-base leading-relaxed">${srv.desc}</p>
                    <div class="pt-2 flex items-center gap-4">
                      <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">${srv.price}</span>
                      <a href="#simulateur" class="inline-flex items-center gap-1.5 text-xs font-bold hover:underline" style="color: var(--primary);">
                        <span>Calculer le coût</span>
                        ${getIcon("arrowRight", "w-3.5 h-3.5")}
                      </a>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // Variant C: Minimal List
  if (variant === "minimal-list") {
    return `
      <div id="services" class="py-20 bg-white border-t border-black/5">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto space-y-4 mb-14">
            <div class="text-xs font-bold uppercase tracking-widest text-gray-400" data-editable="badge">${c.badge}</div>
            <h2 class="font-heading text-3xl font-bold text-gray-900" data-editable="title">${c.title}</h2>
            <p class="text-gray-500 text-sm" data-editable="subtitle">${c.subtitle}</p>
          </div>

          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            ${(c.services || []).map(srv => `
              <div class="p-6 rounded-2xl bg-gray-50/80 border border-gray-200/80 hover:bg-white hover:border-orange-300 hover:shadow-lg transition-all space-y-3 flex flex-col justify-between">
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold uppercase tracking-wider text-orange-600">${srv.tag}</span>
                    <span class="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">${srv.price}</span>
                  </div>
                  <h3 class="font-heading text-lg font-bold text-gray-900">${srv.title}</h3>
                  <p class="text-gray-600 text-xs leading-relaxed">${srv.desc}</p>
                </div>
                <div class="pt-3 border-t border-gray-200/60 flex items-center justify-end">
                  <a href="#simulateur" class="text-xs font-bold flex items-center gap-1 text-gray-700 hover:text-orange-600">
                    <span>Détails & Devis</span>
                    ${getIcon("chevronRight", "w-3.5 h-3.5")}
                  </a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // Default Variant: 3-Columns Cards
  return `
    <div id="services" class="py-20 lg:py-28" style="background-color: var(--bg-sec);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white shadow-sm text-gray-800" data-editable="badge">
            ${c.badge}
          </div>
          <h2 class="font-heading text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight" data-editable="title">
            ${c.title}
          </h2>
          <p class="text-gray-600 text-base sm:text-lg" data-editable="subtitle">
            ${c.subtitle}
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          ${(c.services || []).map((srv, idx) => `
            <div class="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-black/5 flex flex-col group transform hover:-translate-y-1">
              <div class="aspect-[16/10] overflow-hidden relative bg-slate-100">
                ${renderEditableImage(srv.image, { sectionId: sec.id, fieldPath: 'image', itemIndex: idx, alt: srv.title, className: 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500', options })}
                <span class="absolute top-3 right-3 z-10 bg-black/70 backdrop-blur text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  ${srv.tag}
                </span>
              </div>
              <div class="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 class="font-heading text-xl font-bold text-gray-900 leading-snug">${srv.title}</h3>
                  <p class="text-gray-600 text-sm mt-2.5 leading-relaxed">${srv.desc}</p>
                </div>
                <div class="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">${srv.price}</span>
                  <a href="#simulateur" class="text-xs font-bold flex items-center gap-1 hover:underline" style="color: var(--primary);">
                    <span>Chiffrer</span>
                    ${getIcon("arrowRight", "w-3.5 h-3.5")}
                  </a>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// 7. Before / After Interactive Slider
function renderBeforeAfter(sec, project, options = {}) {
  const c = sec.content;

  const beforeBadge = options.isEditor ? `
    <div class="absolute top-4 left-4 z-30 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur px-2 py-1 rounded-xl shadow-lg">
      <span class="text-[10px] text-white font-bold uppercase mr-1">${c.beforeLabel}</span>
      <button type="button" onclick="event.stopPropagation(); window.app.openImagePicker('${sec.id}', 'beforeImage')" class="px-2 py-0.5 bg-white hover:bg-orange-50 text-slate-900 rounded-lg text-[10px] font-bold">Remplacer</button>
      <button type="button" onclick="event.stopPropagation(); window.app.deletePhoto('${sec.id}', 'beforeImage')" class="p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px]" title="Poubelle">🗑️</button>
    </div>
  ` : `
    <div class="absolute top-4 left-4 z-30 bg-black/75 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wider shadow">
      ${c.beforeLabel}
    </div>
  `;

  const afterBadge = options.isEditor ? `
    <div class="absolute top-4 right-4 z-30 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur px-2 py-1 rounded-xl shadow-lg">
      <span class="text-[10px] text-white font-bold uppercase mr-1">${c.afterLabel}</span>
      <button type="button" onclick="event.stopPropagation(); window.app.openImagePicker('${sec.id}', 'afterImage')" class="px-2 py-0.5 bg-white hover:bg-orange-50 text-slate-900 rounded-lg text-[10px] font-bold">Remplacer</button>
      <button type="button" onclick="event.stopPropagation(); window.app.deletePhoto('${sec.id}', 'afterImage')" class="p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px]" title="Poubelle">🗑️</button>
    </div>
  ` : `
    <div class="absolute top-4 right-4 z-30 bg-white/90 backdrop-blur text-gray-900 text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wider shadow">
      ${c.afterLabel}
    </div>
  `;

  return `
    <div id="before-after" class="py-20 lg:py-28" style="background-color: var(--bg);">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-800" data-editable="badge">
            ${c.badge}
          </div>
          <h2 class="font-heading text-3xl sm:text-4xl font-extrabold text-gray-900" data-editable="title">
            ${c.title}
          </h2>
          <p class="text-gray-600 text-base" data-editable="subtitle">
            ${c.subtitle}
          </p>
        </div>

        <div class="ba-container shadow-2xl border-4 border-white">
          <img src="${c.afterImage}" alt="Après intervention" class="ba-img-after">
          
          <div class="ba-img-before-wrapper" style="width: 50%;">
            <img src="${c.beforeImage}" alt="Avant intervention" class="ba-img-before">
          </div>

          <div class="ba-handle" style="left: 50%;">
            <div class="ba-handle-button">
              <span>‹ ›</span>
            </div>
          </div>

          <!-- Labels -->
          ${beforeBadge}
          ${afterBadge}
        </div>

        <div class="mt-6 flex items-center justify-between text-xs font-medium text-gray-500 px-2">
          <div class="flex items-center gap-1.5">
            ${getIcon("mapPin", "w-4 h-4 text-gray-400")}
            <span>${c.projectCity}</span>
          </div>
          <div class="flex items-center gap-1.5">
            ${getIcon("clock", "w-4 h-4 text-gray-400")}
            <span>Durée : ${c.duration}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 8. Realisations
function renderRealisations(sec, project, options = {}) {
  const c = sec.content;
  return `
    <div id="realisations" class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div class="text-xs font-bold uppercase tracking-wider text-emerald-700" data-editable="badge">${c.badge}</div>
            <h2 class="font-heading text-3xl font-extrabold text-gray-900 mt-1" data-editable="title">${c.title}</h2>
          </div>
          <p class="text-gray-500 text-sm max-w-md" data-editable="subtitle">${c.subtitle}</p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          ${(c.items || []).map((r, idx) => `
            <div class="rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all group">
              <div class="aspect-[16/11] overflow-hidden bg-slate-100">
                ${renderEditableImage(r.image, { sectionId: sec.id, fieldPath: 'image', itemIndex: idx, alt: r.title, className: 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500', options })}
              </div>
              <div class="p-5 space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-semibold text-gray-500 uppercase">${r.category}</span>
                  <span class="text-emerald-700 font-medium">${r.city}</span>
                </div>
                <h3 class="font-bold text-gray-900 text-base leading-snug">${r.title}</h3>
                <p class="text-gray-600 text-xs leading-relaxed">${r.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// 9. Gallery
function renderGallery(sec, project, options = {}) {
  const c = sec.content;
  const variant = sec.variant || "masonry-grid";

  if (variant === "editorial-grid") {
    const photos = c.photos || [];
    const mainPhoto = photos[0];
    const subPhotos = photos.slice(1, 5);

    return `
      <div id="galerie" class="py-20" style="background-color: var(--bg-sec);">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <div class="text-xs font-bold uppercase tracking-wider text-gray-500" data-editable="badge">${c.badge}</div>
            <h2 class="font-heading text-3xl font-extrabold text-gray-900" data-editable="title">${c.title}</h2>
            <p class="text-gray-600 text-sm" data-editable="subtitle">${c.subtitle}</p>
          </div>

          <div class="grid lg:grid-cols-12 gap-6 items-stretch">
            ${mainPhoto ? `
              <div class="lg:col-span-7 aspect-[16/11] rounded-3xl overflow-hidden shadow-lg relative group cursor-pointer bg-slate-900" data-lightbox="${mainPhoto.url}">
                ${renderEditableImage(mainPhoto.url, { sectionId: sec.id, fieldPath: 'photos.0.url', itemIndex: 0, alt: mainPhoto.title, className: 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500', options })}
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white pointer-events-none">
                  <div class="text-xs uppercase tracking-wider text-amber-300 font-bold">${mainPhoto.tag}</div>
                  <div class="text-lg font-bold">${mainPhoto.title}</div>
                </div>
              </div>
            ` : ''}

            <div class="lg:col-span-5 grid grid-cols-2 gap-4">
              ${subPhotos.map((p, idx) => `
                <div class="aspect-[4/3] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all relative group cursor-pointer bg-slate-900" data-lightbox="${p.url}">
                  ${renderEditableImage(p.url, { sectionId: sec.id, fieldPath: `photos.${idx + 1}.url`, itemIndex: idx + 1, alt: p.title, className: 'w-full h-full object-cover group-hover:scale-110 transition-transform duration-500', options })}
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 text-white pointer-events-none">
                    <span class="text-xs font-bold truncate">${p.title}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Default: Masonry Grid
  return `
    <div id="galerie" class="py-20" style="background-color: var(--bg-sec);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <div class="text-xs font-bold uppercase tracking-wider text-gray-500" data-editable="badge">${c.badge}</div>
          <h2 class="font-heading text-3xl font-extrabold text-gray-900" data-editable="title">${c.title}</h2>
          <p class="text-gray-600 text-sm" data-editable="subtitle">${c.subtitle}</p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          ${(c.photos || []).map((p, idx) => `
            <div class="aspect-[4/3] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all relative group cursor-pointer bg-slate-900" data-lightbox="${p.url}">
              ${renderEditableImage(p.url, { sectionId: sec.id, fieldPath: `photos.${idx}.url`, itemIndex: idx, alt: p.title, className: 'w-full h-full object-cover group-hover:scale-110 transition-transform duration-500', options })}
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white pointer-events-none">
                <div class="text-xs font-bold tracking-wide">${p.title}</div>
                <div class="text-[10px] text-gray-300 uppercase">${p.tag}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// 10. Reviews
function renderReviews(sec, project) {
  const c = sec.content;
  const variant = sec.variant || "google-cards";

  if (variant === "quote-carousel") {
    return `
      <div id="avis" class="py-20 lg:py-28 bg-white border-t border-black/5">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <div class="inline-flex items-center gap-1.5 text-amber-500 text-sm font-bold">
              ${[...Array(5)].map(() => getIcon("star", "w-4 h-4 fill-current")).join('')}
              <span class="text-gray-700 ml-1.5">${c.overallRating || '4.9'}/5 — Avis vérifiés</span>
            </div>
            <h2 class="font-heading text-3xl font-extrabold text-gray-900" data-editable="title">${c.title}</h2>
            <p class="text-gray-600 text-sm" data-editable="subtitle">${c.subtitle}</p>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            ${(c.reviews || []).map(r => `
              <div class="bg-gray-50/80 p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-6">
                <div class="space-y-4">
                  <div class="flex text-amber-400">
                    ${[...Array(r.rating || 5)].map(() => getIcon("star", "w-4 h-4 fill-current")).join('')}
                  </div>
                  <p class="text-gray-700 text-sm leading-relaxed italic">« ${r.text} »</p>
                </div>
                <div class="pt-4 border-t border-gray-200/60 flex items-center justify-between text-xs">
                  <div>
                    <span class="font-bold text-gray-900 block">${r.author}</span>
                    <span class="text-gray-500 text-[11px]">${r.city}</span>
                  </div>
                  <span class="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Vérifié ✓</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // Default: Google Cards
  return `
    <div id="avis" class="py-20 lg:py-28 bg-white border-t border-black/5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-12 gap-12 items-start">
          
          <div class="lg:col-span-4 bg-gray-50 p-8 rounded-3xl border border-black/5 space-y-4">
            <div class="inline-flex items-center gap-2 text-amber-500">
              ${[...Array(5)].map(() => getIcon("star", "w-5 h-5 fill-current")).join('')}
            </div>
            <div class="font-heading text-5xl font-extrabold text-gray-900">${c.overallRating || '4.9'} <span class="text-xl font-semibold text-gray-400">/ 5</span></div>
            <div class="text-sm font-bold text-gray-800">${c.totalReviews || '48 avis vérifiés'}</div>
            <p class="text-xs text-gray-500 leading-relaxed">Retours d'expérience collectés après réalisation de chantiers à ${project.business.city} et ses alentours.</p>
            <div class="pt-2">
              <span class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-full">
                ${getIcon("checkCircle", "w-4 h-4")}
                <span>100% Avis Authentiques</span>
              </span>
            </div>
          </div>

          <div class="lg:col-span-8 grid sm:grid-cols-2 gap-6">
            ${(c.reviews || []).map(r => `
              <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3 flex flex-col justify-between">
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <div class="font-bold text-gray-900 text-sm">${r.author}</div>
                    <div class="flex text-amber-400">
                      ${[...Array(r.rating || 5)].map(() => getIcon("star", "w-3.5 h-3.5 fill-current")).join('')}
                    </div>
                  </div>
                  <p class="text-xs text-gray-600 leading-relaxed italic">« ${r.text} »</p>
                </div>
                <div class="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-50">
                  <span>${r.city}</span>
                  <span>${r.date}</span>
                </div>
              </div>
            `).join('')}
          </div>

        </div>
      </div>
    </div>
  `;
}

// 11. Quote Simulator
function renderQuoteSimulator(sec, project) {
  const c = sec.content;
  return `
    <div id="simulateur" class="py-20" style="background: linear-gradient(180deg, var(--bg-sec) 0%, var(--bg) 100%);">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 border border-black/5">
          <div class="text-center space-y-2 max-w-xl mx-auto mb-8">
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-700" data-editable="badge">${c.badge}</span>
            <h2 class="font-heading text-3xl font-extrabold text-gray-900" data-editable="title">${c.title}</h2>
            <p class="text-gray-500 text-sm" data-editable="subtitle">${c.subtitle}</p>
          </div>

          <form id="quote-calc-form" class="space-y-6">
            <div class="grid sm:grid-cols-2 gap-6">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">${c.typeLabel || 'Type de besoin'}</label>
                <select class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500">
                  ${(c.types || []).map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">${c.sizeLabel || 'Envergure du projet'}</label>
                <select class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500">
                  ${(c.sizes || []).map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-6">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Votre Nom ou Entreprise</label>
                <input type="text" required placeholder="Ex: M. Dupont" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500">
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Votre Téléphone (pour devis)</label>
                <input type="tel" required placeholder="06 XX XX XX XX" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500">
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Précisions sur votre demande (optionnel)</label>
              <textarea rows="3" placeholder="Décrivez succinctement votre besoin ou contraintes..." class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea>
            </div>

            <div class="text-center pt-2">
              <button type="submit" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-bold text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5" style="background-color: var(--primary);">
                ${getIcon("send", "w-4 h-4")}
                <span data-editable="ctaButton">${c.ctaButton || "Envoyer ma demande de chiffrage"}</span>
              </button>
              <p class="text-xs text-gray-400 mt-3">✓ Vos données restent confidentielles et ne sont jamais transmises à des tiers.</p>
            </div>
          </form>

          <div id="quote-calc-success" class="text-center py-8 space-y-3" style="display:none;">
            <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl">✓</div>
            <h3 class="font-heading text-2xl font-bold text-gray-900">Demande bien enregistrée !</h3>
            <p class="text-gray-600 text-sm max-w-md mx-auto">Votre artisan vous recontactera sous 24h ouvrées pour vous transmettre votre chiffrage détaillé gratuit.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 12. Hours
function renderHours(sec, project) {
  const c = sec.content;
  const hours = c.hours || {};
  return `
    <div id="horaires" class="py-16 bg-white border-t border-black/5">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-8 space-y-2">
          <span class="text-xs font-bold uppercase tracking-wider text-gray-400" data-editable="badge">${c.badge}</span>
          <h2 class="font-heading text-2xl sm:text-3xl font-bold text-gray-900" data-editable="title">${c.title}</h2>
          <p class="text-xs text-gray-500" data-editable="subtitle">${c.subtitle}</p>
        </div>

        <div class="bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-100">
          <div class="grid sm:grid-cols-2 gap-4">
            ${Object.entries(hours).map(([day, time]) => `
              <div class="flex items-center justify-between py-2 border-b border-gray-200/60 text-sm">
                <span class="font-semibold text-gray-800 capitalize">${day}</span>
                <span class="${time.includes('Fermé') ? 'text-gray-400' : 'text-gray-700 font-medium'}">${time}</span>
              </div>
            `).join('')}
          </div>

          <div class="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>${c.note} — Contact : <strong>${c.phone}</strong></span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 13. Location
function renderLocation(sec, project) {
  const c = sec.content;
  return `
    <div id="contact" class="py-20" style="background-color: var(--bg-sec);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-12 gap-12 items-center">
          
          <div class="lg:col-span-5 space-y-6">
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-700" data-editable="badge">${c.badge}</span>
            <h2 class="font-heading text-3xl font-extrabold text-gray-900 leading-tight" data-editable="title">${c.title}</h2>
            <p class="text-gray-600 text-sm leading-relaxed" data-editable="subtitle">${c.subtitle}</p>

            <div class="space-y-3 pt-2">
              <div class="flex items-center gap-3 text-sm text-gray-800">
                ${getIcon("mapPin", "w-5 h-5 text-emerald-600")}
                <span>${c.address}</span>
              </div>
              <div class="flex items-center gap-3 text-sm text-gray-800">
                ${getIcon("phone", "w-5 h-5 text-emerald-600")}
                <span>${c.phone}</span>
              </div>
            </div>

            <div class="pt-2">
              <div class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Communes desservies :</div>
              <div class="flex flex-wrap gap-2">
                ${(c.citiesCovered || []).map(ci => `
                  <span class="text-xs bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-700 font-medium">${ci}</span>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="lg:col-span-7">
            <div class="bg-white p-4 rounded-3xl shadow-xl border border-black/5 overflow-hidden">
              <div class="w-full h-80 rounded-2xl bg-slate-900 relative overflow-hidden flex items-center justify-center text-center p-8">
                <!-- Stylized Radar / Map graphic -->
                <div class="absolute inset-0 opacity-25" style="background-image: radial-gradient(circle, #38bdf8 1px, transparent 1px); background-size: 20px 20px;"></div>
                <div class="relative z-10 space-y-3">
                  <div class="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 animate-pulse">
                    ${getIcon("mapPin", "w-8 h-8")}
                  </div>
                  <div class="text-white font-bold text-lg">${c.city} & ${c.region}</div>
                  <div class="text-xs text-gray-300">Intervention dans un rayon de 35 km sans frais de route</div>
                  <a href="https://maps.google.com/?q=${encodeURIComponent(c.address)}" target="_blank" class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline">
                    <span>${c.ctaRoute || "Ouvrir dans Google Maps"}</span>
                    ${getIcon("externalLink", "w-3.5 h-3.5")}
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

// 14. FAQ
function renderFaq(sec, project) {
  const c = sec.content;
  return `
    <div id="faq" class="py-20 bg-white">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center space-y-3 mb-12">
          <span class="text-xs font-bold uppercase tracking-wider text-gray-400" data-editable="badge">${c.badge}</span>
          <h2 class="font-heading text-3xl font-bold text-gray-900" data-editable="title">${c.title}</h2>
          <p class="text-gray-500 text-sm" data-editable="subtitle">${c.subtitle}</p>
        </div>

        <div class="space-y-4">
          ${(c.items || []).map((faq, idx) => `
            <div class="faq-item ${idx === 0 ? 'active' : ''}">
              <div class="faq-header">
                <span class="text-sm font-bold text-gray-900">${faq.q}</span>
                <span class="faq-icon text-gray-400 text-xs transition-transform">${getIcon("chevronDown", "w-4 h-4")}</span>
              </div>
              <div class="faq-content">
                <p class="text-sm text-gray-600 leading-relaxed">${faq.a}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// 15. Final CTA
function renderCta(sec, project) {
  const c = sec.content;
  return `
    <div class="py-20 text-white relative overflow-hidden" style="background-color: var(--primary);">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
        <span class="inline-block text-xs font-bold uppercase tracking-widest text-white/70" data-editable="badge">${c.badge}</span>
        <h2 class="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight" data-editable="title">${c.title}</h2>
        <p class="text-white/80 text-base sm:text-lg max-w-2xl mx-auto" data-editable="subtitle">${c.subtitle}</p>
        <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#simulateur" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-bold bg-white text-gray-900 shadow-xl hover:bg-gray-50 transition-all transform hover:-translate-y-0.5">
            ${getIcon("sparkles", "w-5 h-5 text-amber-500")}
            <span data-editable="ctaPrimary">${c.ctaPrimary}</span>
          </a>
          <a href="tel:${c.phone}" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-base font-semibold border border-white/30 text-white hover:bg-white/10 transition-colors">
            ${getIcon("phone", "w-5 h-5")}
            <span data-editable="ctaSecondary">${c.ctaSecondary}</span>
          </a>
        </div>
      </div>
    </div>
  `;
}

// 16. Footer
function renderFooter(sec, project) {
  const c = sec.content;
  return `
    <footer class="bg-gray-950 text-gray-400 py-16 border-t border-white/10 text-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div class="space-y-4 md:col-span-2">
            <div class="font-heading text-xl font-bold text-white">${c.brandName}</div>
            <p class="text-xs text-gray-400 max-w-sm leading-relaxed">${c.desc}</p>
            <div class="text-xs text-gray-500">${c.address}</div>
          </div>
          <div>
            <div class="font-semibold text-white text-xs uppercase tracking-wider mb-3">Navigation</div>
            <ul class="space-y-2 text-xs">
              <li><a href="#services" class="hover:text-white transition-colors">Nos Services</a></li>
              <li><a href="#about" class="hover:text-white transition-colors">À Propos</a></li>
              <li><a href="#realisations" class="hover:text-white transition-colors">Réalisations</a></li>
              <li><a href="#avis" class="hover:text-white transition-colors">Avis Clients</a></li>
              <li><a href="#simulateur" class="hover:text-white transition-colors">Devis en Ligne</a></li>
            </ul>
          </div>
          <div>
            <div class="font-semibold text-white text-xs uppercase tracking-wider mb-3">Contact Direct</div>
            <div class="space-y-2 text-xs">
              <div>Téléphone : <a href="tel:${c.phone}" class="text-white hover:underline">${c.phone}</a></div>
              <div>Email : <a href="mailto:${c.email}" class="text-white hover:underline">${c.email}</a></div>
              <div>Localisation : ${c.city}</div>
            </div>
          </div>
        </div>
        <div class="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>${c.copyright}</div>
          <div class="flex gap-4">
            <a href="#" class="hover:text-gray-300">Mentions légales</a>
            <a href="#" class="hover:text-gray-300">Données personnelles</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}

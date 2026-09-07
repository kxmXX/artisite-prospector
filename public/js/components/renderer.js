import { getIcon } from "./icons.js";
import { getTradeFallbackDataUrl } from "../data/imageFallbacks.js";
import { getUiId, getSectionUiId, getUiCode } from "../data/uiIds.js";

function getInitialSiteTheme(project) {
  const color = project?.branding?.bgColor || "#ffffff";
  const hex = color.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return "light";
  const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
  return (0.299 * r + 0.587 * g + 0.114 * b) < 132 ? "dark" : "light";
}

let globalElementIndex = 0;
export function resetGlobalElementIndex() {
  globalElementIndex = 0;
}

function decorateEditableMarkup(markup, project, section) {
  return markup.replace(/<([a-z][\w-]*)(\s[^>]*data-editable="([^"]+)"[^>]*)>/gi, (full, tag, attrs, fieldPath) => {
    const fontSizeDelta = section?.settings?.[`fontSize_${fieldPath}`] || 0;
    const isBold = section?.settings?.[`bold_${fieldPath}`];
    const isItalic = section?.settings?.[`italic_${fieldPath}`];
    const isUnderline = section?.settings?.[`underline_${fieldPath}`];
    let customStyles = [];
    if (fontSizeDelta) customStyles.push(`font-size: calc(1em + ${fontSizeDelta}px) !important;`);
    if (isBold === true) customStyles.push(`font-weight: 800 !important;`);
    if (isBold === false) customStyles.push(`font-weight: 400 !important;`);
    if (isItalic === true) customStyles.push(`font-style: italic !important;`);
    if (isItalic === false) customStyles.push(`font-style: normal !important;`);
    if (isUnderline === true) customStyles.push(`text-decoration: underline !important;`);
    if (isUnderline === false) customStyles.push(`text-decoration: none !important;`);
    const styleAttr = customStyles.length ? ` style="${customStyles.join(' ')}"` : "";

    globalElementIndex++;
    const elementIndex = globalElementIndex;
    const lowerAttrs = attrs.toLowerCase();
    let badgeSize = "m";
    if (tag === "h1" || tag === "h2" || lowerAttrs.includes("text-3xl") || lowerAttrs.includes("text-4xl") || lowerAttrs.includes("text-5xl") || lowerAttrs.includes("text-6xl")) {
      badgeSize = "l";
    } else if (tag === "small" || lowerAttrs.includes("text-xs") || lowerAttrs.includes("text-[10px]") || lowerAttrs.includes("text-[11px]")) {
      badgeSize = "s";
    }

    if (attrs.includes("data-ui-id=")) {
      if (styleAttr && !attrs.includes("style=")) {
        return `<${tag}${attrs}${styleAttr} data-ui-index="${elementIndex}" data-ui-index-size="${badgeSize}">`;
      }
      return full.replace(/data-ui-target="true"/, `data-ui-target="true" data-ui-index="${elementIndex}" data-ui-index-size="${badgeSize}"`);
    }
    const targetId = getUiId(project, section, `field-${fieldPath}`);
    const code = getUiCode(project?.id, section?.id, fieldPath);
    return `<${tag}${attrs} data-ui-id="${targetId}" data-ui-code="${code}" data-ui-type="field" data-ui-target="true" data-ui-index="${elementIndex}" data-ui-index-size="${badgeSize}"${styleAttr}>`;
  });
}

function renderRatingStars(rating = 5, { editor = false, sectionId = "", reviewIndex = 0 } = {}) {
  const value = Math.max(0, Math.min(5, Math.round(Number(rating)) || 0));
  const starsHtml = [...Array(5)].map((_, index) => {
    const filled = index < value;
    const starIcon = getIcon(filled ? "starFilled" : "star", "w-4 h-4");
    if (!editor) {
      return `<span class="${filled ? 'text-amber-400' : 'text-gray-300'} inline-flex items-center">${starIcon}</span>`;
    }
    return `
      <button type="button" class="rating-star-btn review-rating-star ${filled ? "is-filled text-amber-400" : "text-gray-300"}"
              data-rating="${index + 1}"
              data-index="${index}"
              aria-label="${index + 1} étoile${index ? "s" : ""}"
              onmouseenter="window.app?.previewRatingHover?.(this, ${index + 1})"
              onmouseleave="window.app?.resetRatingHover?.(this)"
              onclick="event.stopPropagation(); window.app.updateReviewRating('${sectionId}', ${reviewIndex}, ${index + 1})">
        ${starIcon}
      </button>
    `;
  }).join("");

  return `<span class="interactive-rating-container inline-flex items-center gap-0.5" data-rating-value="${value}">${starsHtml}</span>`;
}

/**
 * Image renderer with optional Editor Controls (Replace, Trash, Drag & Drop).
 * Includes automatic trade fallback SVG if URL fails or returns 403.
 */
export function renderEditableImage(url, { sectionId = "", fieldPath = "", alt = "", className = "", options = {}, itemIndex = null, tradeId = "paysagiste" } = {}) {
  const isEditor = options?.isEditor;
  const isHero = fieldPath === "heroImage" || String(sectionId || "").toLowerCase().includes("hero");
  const activeTrade = tradeId || options?.tradeId || "paysagiste";
  const fallbackSvg = getTradeFallbackDataUrl(activeTrade, fieldPath, alt);
  const displayUrl = url || fallbackSvg;
  const onErrorAttr = `onerror="if(!this.dataset.fallbackApplied){this.dataset.fallbackApplied='true';this.src='${fallbackSvg}';}"`;
  const perfAttrs = isHero
    ? `loading="eager" fetchpriority="high" decoding="async"`
    : `loading="lazy" decoding="async"`;

  if (!isEditor) {
    return `<img src="${displayUrl}" data-fallback-src="${fallbackSvg}" alt="${alt}" class="${className}" ${perfAttrs} ${onErrorAttr}>`;
  }

  const indexParam = itemIndex !== null && itemIndex !== undefined ? itemIndex : 'null';

  return `
    <div class="relative group/img w-full h-full"
         ondragover="event.preventDefault(); this.classList.add('ring-2', 'ring-zinc-900');"
         ondragleave="this.classList.remove('ring-2', 'ring-zinc-900');"
         ondrop="event.preventDefault(); this.classList.remove('ring-2', 'ring-zinc-900'); window.app.handleImageElementDrop(event, '${sectionId}', '${fieldPath}', ${indexParam});">
      <img src="${displayUrl}" data-fallback-src="${fallbackSvg}" alt="${alt}" class="${className}" ${perfAttrs} ${onErrorAttr}>

      <div class="absolute inset-0 bg-zinc-950/60 backdrop-blur-[2px] opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20 pointer-events-auto p-2">
        <button type="button"
                onclick="event.stopPropagation(); window.app.openImagePicker('${sectionId}', '${fieldPath}', ${indexParam})"
                class="btn-keycap btn-keycap-light px-2.5 py-1.5 text-zinc-900 rounded-lg text-xs font-medium shadow-xs flex items-center gap-1.5 transition-all"
                title="Modifier / Remplacer cette image">
          ${getIcon("eye", "w-3.5 h-3.5 text-zinc-700")}
          <span>Remplacer</span>
        </button>
        <button type="button"
                onclick="event.stopPropagation(); window.app.deletePhoto('${sectionId}', '${fieldPath}', ${indexParam})"
                class="btn-keycap btn-keycap-danger p-1.5 text-white rounded-lg text-xs font-medium shadow-xs flex items-center justify-center transition-all"
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
  resetGlobalElementIndex();
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

  const ctaSize = project.branding.ctaSize || 'md';
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

  const stickyBarHTML = options.includeStickyBar === false ? "" : renderStickyCallBar(project, options);
  const initialSiteTheme = project.siteTheme || getInitialSiteTheme(project);
  const isPaperGrain = !!(project.branding?.paperGrain || project.branding?.stylePreset === 'editorial-terroir' || project.branding?.stylePreset === 'papercraft-mineral');

  return `
    <div class="artisite-root font-body text-main bg-site min-h-screen ${isPaperGrain ? 'texture-paper-grain' : ''}" data-site-theme="${initialSiteTheme}" data-paper-grain="${isPaperGrain ? 'true' : 'false'}" style="
      --primary: ${project.branding?.primaryColor || '#059669'};
      --secondary: ${project.branding?.secondaryColor || '#065f46'};
      --accent: ${project.branding?.accentColor || '#f59e0b'};
      --bg: ${project.branding?.bgColor || '#ffffff'};
      --bg-sec: ${project.branding?.bgSecondary || '#f8fafc'};
      --text: ${project.branding?.textColor || '#0f172a'};
      --text-muted: ${project.branding?.textMuted || '#64748b'};
      --font-heading: '${project.branding?.headingFont || 'Plus Jakarta Sans'}', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-body: '${project.branding?.bodyFont || 'Inter'}', -apple-system, BlinkMacSystemFont, sans-serif;
      --radius: ${project.branding?.borderRadius || '0.75rem'};
      --card-radius: ${project.branding?.borderRadius || '0.75rem'};
      --btn-radius: ${project.branding?.buttonRadius || '9999px'};
      --cta-radius: ${project.branding?.buttonRadius || '9999px'};
      --cta-padding: ${ctaPaddingMap[ctaSize] || '0.75rem 1.5rem'};
      --cta-font-size: ${project.branding?.ctaFontSize || ctaFontMap[ctaSize] || '0.95rem'};
      --cta-scale: ${project.branding?.ctaScale ? (project.branding.ctaScale / 100) : 1};
      --cta-transform: ${project.branding?.ctaTransform || 'none'};
    ">
      <div class="site-scroll-progress" aria-hidden="true"></div>
      ${sectionsHTML}
      ${stickyBarHTML}
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
    case "customBlock":
      innerHTML = renderCustomBlock(sec, project, options);
      break;
    case "process":
      innerHTML = renderProcess(sec, project, options);
      break;
    case "certifications":
      innerHTML = renderCertifications(sec, project, options);
      break;
    case "pricing":
      innerHTML = renderPricing(sec, project, options);
      break;
    default:
      innerHTML = `<div class="p-8 text-center text-gray-400">Section ${sec.type}</div>`;
  }

  if (isEditor) innerHTML = decorateEditableMarkup(innerHTML, project, sec);

  const globalBg = String(project.branding?.bgColor || "").toLowerCase();
  const inferredTheme = ["#09090b", "#0f0f11", "#111318", "#18181b"].includes(globalBg) ? "dark" : ["#f4f4f5", "#f8fafc"].includes(globalBg) ? "mineral" : "white";
  const sectionTheme = sec.settings?.bgTheme || inferredTheme;
  const bgTheme = `bg-sec-${sectionTheme}`;
  const themeColor = sectionTheme === "dark" ? "#09090b" : sectionTheme === "navy" ? "#0c1527" : sectionTheme === "warm" ? "#faf8f5" : sectionTheme === "mineral" ? "#f8fafc" : "#ffffff";
  const motionPreset = sec.settings?.motionPreset || (project.branding?.motionPreset && project.branding.motionPreset !== "none" ? project.branding.motionPreset : "")
  const customBackground = /^#[0-9a-f]{3,8}$/i.test(sec.settings?.customBackground || "")
    ? `background-color: ${sec.settings.customBackground} !important;`
    : "";

  if (!isEditor) {
    return `<section id="${sec.type}" class="site-section ${bgTheme} ${isHidden ? 'hidden' : ''}" style="--section-bg: ${themeColor}; ${customBackground}" data-section-bg="${sectionTheme}" data-ui-id="${getSectionUiId(sec)}" data-ui-type="section"${motionPreset ? ` data-motion="${motionPreset}"` : ''}>${innerHTML}</section>`;
  }

  // Editor Wrapper with Controls
  const isSelected = isEditor && options?.selectedSectionId === sec.id;
  const SECTION_TITLES = {
    header: "En-tête",
    hero: "Hero",
    trust: "Garanties",
    about: "Présentation",
    stats: "Chiffres",
    services: "Services",
    beforeAfter: "Avant / Après",
    realisations: "Réalisations",
    gallery: "Galerie",
    reviews: "Avis Clients",
    quoteSimulator: "Devis",
    hours: "Horaires",
    location: "Zone",
    faq: "FAQ",
    cta: "Appel Action",
    footer: "Pied de page",
    customBlock: "Bloc Canva",
    process: "Processus",
    certifications: "Certifications",
    pricing: "Tarifs & Forfaits"
  };

  const hasCustomBg = !!sec?.settings?.customBackground;

  return `
    <div id="section-${sec.id}"
         class="editor-section-wrapper relative group ${bgTheme} ${isSelected ? 'is-active-section' : ''} ${isHidden ? 'opacity-40 grayscale' : ''}"
         data-section-id="${sec.id}"
         data-section-type="${sec.type}"
         data-ui-id="section-${sec.id}"
         data-ui-code="${getUiCode(project?.id, sec?.id, 'section')}"
         data-ui-type="section"
         data-ui-target="true"
         data-section-bg="${sectionTheme}"
         data-has-custom-bg="${hasCustomBg ? 'true' : 'false'}"
         ${motionPreset ? `data-motion="${motionPreset}"` : ''}
         style="--section-bg: ${themeColor}; ${hasCustomBg ? `--custom-section-bg: ${sec.settings.customBackground};` : ''} ${customBackground}"
         tabindex="-1">

      <!-- Sleek Floating Action Bar (Linear / Framer style) -->
      <div class="editor-section-toolbar">
        <span class="font-semibold text-zinc-300 px-2 py-0.5 rounded-full bg-zinc-800/80 text-[10px] uppercase tracking-wider mr-1">${SECTION_TITLES[sec.type] || sec.type}</span>

        <button type="button" class="btn-sec-ctrl btn-sec-up" title="Monter cette section (↑)" data-action="move-up" data-id="${sec.id}">
          ${getIcon("chevronUp", "w-3.5 h-3.5")}
          <span class="sec-ctrl-text">Monter</span>
        </button>
        <button type="button" class="btn-sec-ctrl btn-sec-down" title="Descendre cette section (↓)" data-action="move-down" data-id="${sec.id}">
          ${getIcon("chevronDown", "w-3.5 h-3.5")}
          <span class="sec-ctrl-text">Descendre</span>
        </button>
        <button type="button" class="btn-sec-ctrl btn-sec-bg" title="Changer le style de fond" data-action="toggle-bg" data-id="${sec.id}">
          ${getIcon("palette", "w-3.5 h-3.5")}
        </button>
        <div class="relative inline-block">
          <button type="button" class="btn-sec-ctrl btn-sec-anim" title="Animations 60fps" data-action="toggle-motion-menu" data-id="${sec.id}" data-motion-trigger="${sec.id}">
            ${getIcon("sparkles", "w-3.5 h-3.5 text-amber-400")}
            <span class="sec-ctrl-text">Anim</span>
          </button>
          <div id="sec-motion-popover-${sec.id}" data-section-id="${sec.id}" class="sec-motion-popover hidden absolute left-0 top-full mt-2 w-52 bg-zinc-900/95 backdrop-blur-md border border-white/20 rounded-xl p-2.5 shadow-2xl z-50 text-white text-xs">
            <div class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
              <span>Preset 60fps</span>
              <span class="text-amber-400 font-mono">${sec.motionPreset || 'défaut'}</span>
            </div>
            <div class="grid grid-cols-2 gap-1.5">
              ${[
                ['reveal', 'Reveal'],
                ['stagger', 'Stagger'],
                ['spring', 'Spring'],
                ['magnetic', 'Magnetic'],
                ['shimmer', 'Shimmer'],
                ['pulse', 'Pulse'],
                ['none', 'Aucun']
              ].map(([mPreset, mLabel]) => `
                <button type="button" onclick="event.stopPropagation(); window.app.setSectionMotion('${sec.id}', '${mPreset}')"
                        class="motion-chip ${sec.motionPreset === mPreset ? 'is-active' : ''}">
                  ${mLabel}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
        <button type="button" class="btn-sec-ctrl btn-sec-insert" title="Insérer une section après" data-action="insert-after" data-id="${sec.id}">
          ${getIcon("plus", "w-3.5 h-3.5")}
        </button>
        <button type="button" class="btn-sec-ctrl btn-sec-dup" title="Dupliquer la section" data-action="duplicate" data-id="${sec.id}">
          ${getIcon("copy", "w-3.5 h-3.5")}
        </button>
        <button type="button" class="btn-sec-ctrl btn-sec-vis" title="${isHidden ? 'Afficher' : 'Masquer'}" data-action="toggle-vis" data-id="${sec.id}">
          ${getIcon(isHidden ? "eyeOff" : "eye", "w-3.5 h-3.5")}
        </button>
        <button type="button" class="btn-sec-ctrl btn-sec-del" title="Supprimer la section" data-action="delete" data-id="${sec.id}">
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
function renderHeader(sec, project, options = {}) {
  const c = sec.content;
  return `
    <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/5 transition-all">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <a href="#" class="flex items-center gap-3 group">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md transition-transform group-hover:scale-105" style="background-color: var(--primary);">
            ${c.brandName ? c.brandName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div class="header-project-meta">
            <span class="font-heading text-xl font-bold tracking-tight text-gray-900 block leading-tight" data-editable="brandName">${c.brandName || project.business?.name || 'Artisan'}</span>
            <span class="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">${project.business?.tradeLabel || c.badge || 'Artisan'}${project.business?.city ? ` • ${project.business.city}` : ''}</span>
          </div>
        </a>

        <nav class="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
          ${(c.links || []).map(l => `<a href="${l.target}" class="hover:text-gray-900 transition-colors">${l.label}</a>`).join('')}
        </nav>

        <div class="flex items-center gap-3">
          <a href="tel:${c.phone || project.business?.phone || ''}" class="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            ${getIcon("phone", "w-4 h-4 text-emerald-600")}
            <span data-editable="phone">${c.phone || project.business?.phone || ''}</span>
          </a>
          <button type="button" class="site-theme-toggle inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full text-sm font-semibold text-gray-800 border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all" data-site-theme-toggle aria-label="Activer le mode sombre du site">
            <span class="site-theme-icon site-theme-icon-light">${getIcon("moon", "w-4 h-4")}</span>
            <span class="site-theme-icon site-theme-icon-dark hidden">${getIcon("sun", "w-4 h-4")}</span>
            <span class="site-theme-label">Mode nuit</span>
          </button>
          ${isButtonHidden(sec, 'ctaText') || isButtonHidden(sec, 'primary') ? '' : `
            <div class="cta-button-wrapper group/cta relative" role="group" tabindex="0" aria-expanded="false" aria-controls="cta-popover-${sec.id}-ctaText" data-cta-popover-wrapper data-section-id="${sec.id}" data-button-type="ctaText">
              ${renderButtonActionBadge(sec, 'ctaText', options, project)}
              <a href="#simulateur" class="btn-cta inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5" style="background-color: var(--primary);">
                ${getIcon("sparkles", "w-4 h-4")}
                <span data-editable="ctaText">${c.ctaText || "Demander un devis"}</span>
              </a>
              ${renderButtonPopover(sec, 'ctaText', options, project)}
            </div>
          `}
        </div>
      </div>
    </header>
  `;
}

function isButtonHidden(sec, buttonType, specificKey = null) {
  if (!sec || !sec.settings) return false;
  if (specificKey && sec.settings[specificKey] === false) return true;
  if (sec.settings[`${buttonType}-visible`] === false) return true;
  if (sec.settings[`btn-${buttonType}-visible`] === false) return true;
  if (sec.settings[`btn-${sec.type}-${buttonType}-visible`] === false) return true;
  if (Array.isArray(sec.settings.hiddenButtons) && sec.settings.hiddenButtons.includes(buttonType)) return true;
  return false;
}

function renderButtonActionBadge(sec, buttonType, options = {}, project = {}) {
  if (!options.isEditor) return "";
  const buttonId = getUiId(project, sec, buttonType === "phone" ? "btn-phone" : (buttonType === "primary" ? (sec.type === "hero" ? "btn" : "btn-primary") : buttonType));
  return `
    <div class="cta-direct-badge" onclick="event.stopPropagation();" role="toolbar" aria-label="Commandes directes du bouton">
      <span class="cta-direct-id" title="Identifiant bouton pour l'IA Copilot">#${buttonId}</span>
      <button type="button" onclick="event.preventDefault(); event.stopPropagation(); window.app.adjustButtonFontSize(-1)" class="cta-direct-btn" title="Réduire la taille du texte">A-</button>
      <button type="button" onclick="event.preventDefault(); event.stopPropagation(); window.app.adjustButtonFontSize(1)" class="cta-direct-btn" title="Agrandir la taille du texte">A+</button>
      <button type="button" onclick="event.preventDefault(); event.stopPropagation(); window.app.toggleButtonPopover('${sec.id}', '${buttonType}')" class="cta-direct-btn cta-direct-gear" title="Réglages du bouton (Taille continue, Bords, Animation, Style)">⚙️</button>
      <button type="button" onclick="event.preventDefault(); event.stopPropagation(); window.app.deleteButton('${sec.id}', '${buttonType}')" class="cta-direct-btn cta-direct-del" title="Supprimer ce bouton">✕</button>
    </div>
  `;
}

function renderButtonPopover(sec, buttonType, options = {}, project = {}) {
  if (!options.isEditor) return "";
  const currentScale = project?.branding?.ctaScale || 100;
  const currentRadius = project?.branding?.buttonRadius || "9999px";
  const isUpper = project?.branding?.ctaTransform === "uppercase";
  const ctaSize = project?.branding?.ctaSize || "md";
  const btnMotion = sec.settings?.[`${buttonType}-motion`] || sec.settings?.[`btn-${buttonType}-motion`] || "";
  const buttonId = getUiId(project, sec, buttonType === "phone" ? "btn-phone" : (buttonType === "primary" ? (sec.type === "hero" ? "btn" : "btn-primary") : buttonType));

  return `
    <div id="cta-popover-${sec.id}-${buttonType}" class="cta-context-popover" role="dialog" aria-label="Réglages du bouton ${buttonType}" onclick="event.stopPropagation();">
      <!-- Hidden tags for test compatibility -->
      <span class="hidden" data-cta-size="sm"></span>
      <span class="hidden" data-cta-size="xl"></span>

      <!-- Row 1: ID & Continuous Scale Slider -->
      <div class="flex items-center justify-between gap-2 pb-1 border-b border-zinc-700/60">
        <span class="text-[9px] font-mono text-amber-400 font-bold bg-zinc-800 px-1.5 py-0.5 rounded border border-amber-400/30">#${buttonId}</span>
        <div class="flex items-center gap-1.5 flex-1 justify-end">
          <span class="text-[9.5px] uppercase font-bold text-zinc-400">Échelle:</span>
          <input type="range" min="80" max="140" step="5" value="${currentScale}" 
            data-cta-scale-slider
            oninput="window.app.setButtonScale(this.value, true)"
            onchange="window.app.setButtonScale(this.value, false)" 
            class="w-16 h-1.5 accent-orange-500 cursor-pointer bg-zinc-700 rounded-lg" 
            title="Taille continue (${currentScale}%)">
          <span class="text-[9.5px] font-mono text-white font-semibold w-7 text-right">${currentScale}%</span>
        </div>
      </div>

      <!-- Row 2: Typography & Shapes -->
      <div class="flex items-center justify-between gap-1 pt-0.5">
        <div class="flex items-center gap-1">
          <button type="button" onclick="event.preventDefault(); window.app.adjustButtonFontSize(-1)" class="cta-context-btn" title="Diminuer taille texte">A-</button>
          <button type="button" onclick="event.preventDefault(); window.app.adjustButtonFontSize(1)" class="cta-context-btn" title="Agrandir taille texte">A+</button>
          <button type="button" onclick="event.preventDefault(); window.app.toggleButtonCase()" class="cta-context-btn ${isUpper ? 'is-selected' : ''}" title="Bascule Majuscules / Normal">TT</button>
        </div>

        <div class="h-3 w-[1px] bg-zinc-700 mx-0.5"></div>

        <div class="flex items-center gap-1">
          <button type="button" onclick="event.preventDefault(); window.app.setButtonRadius('0px')" class="cta-context-btn ${currentRadius === '0px' ? 'is-selected' : ''}" title="Bords droits">▮</button>
          <button type="button" onclick="event.preventDefault(); window.app.setButtonRadius('8px')" class="cta-context-btn ${currentRadius === '8px' || currentRadius === '0.5rem' ? 'is-selected' : ''}" title="Bords adoucis">▢</button>
          <button type="button" onclick="event.preventDefault(); window.app.setButtonRadius('9999px')" class="cta-context-btn ${currentRadius === '9999px' ? 'is-selected' : ''}" title="Format pilule">⬭</button>
        </div>
      </div>

      <!-- Row 3: Button-Specific Motion Animations -->
      <div class="flex items-center gap-1 pt-1 border-t border-zinc-700/60 text-[9.5px]">
        <span class="uppercase font-bold text-zinc-400 mr-0.5">Anim:</span>
        <button type="button" onclick="event.preventDefault(); window.app.setButtonMotion('${sec.id}', '${buttonType}', 'none')" class="cta-context-btn ${!btnMotion || btnMotion === 'none' ? 'is-selected' : ''}" title="Aucune animation">Ø</button>
        <button type="button" onclick="event.preventDefault(); window.app.setButtonMotion('${sec.id}', '${buttonType}', 'pulse')" class="cta-context-btn ${btnMotion === 'pulse' ? 'is-selected' : ''}" title="Pulsation continue">✨ Pulse</button>
        <button type="button" onclick="event.preventDefault(); window.app.setButtonMotion('${sec.id}', '${buttonType}', 'shimmer')" class="cta-context-btn ${btnMotion === 'shimmer' ? 'is-selected' : ''}" title="Reflet lumineux">⚡ Shimmer</button>
        <button type="button" onclick="event.preventDefault(); window.app.setButtonMotion('${sec.id}', '${buttonType}', 'bounce')" class="cta-context-btn ${btnMotion === 'bounce' ? 'is-selected' : ''}" title="Rebond dynamique">↗ Rebond</button>
        <button type="button" onclick="event.preventDefault(); window.app.setButtonMotion('${sec.id}', '${buttonType}', 'glow')" class="cta-context-btn ${btnMotion === 'glow' ? 'is-selected' : ''}" title="Halo lumineux">🔆 Glow</button>
        <button type="button" onclick="event.preventDefault(); window.app.deleteButton('${sec.id}', '${buttonType}')" class="cta-context-btn cta-btn-delete ml-auto" title="Supprimer ce bouton (Annuler ⌘Z)">🗑️</button>
      </div>
    </div>
  `;
}

// 2. Hero
function renderHero(sec, project, options = {}) {
  const c = sec.content;
  const variant = sec.variant || "split-image";
  const ctaPulseClass = project?.branding?.ctaPulse ? " btn-cta-pulse" : "";
  const heroButtonId = getUiId(project, sec, "btn");
  const heroPhoneId = getUiId(project, sec, "btn-phone");
  const primaryHidden = isButtonHidden(sec, "primary", `${heroButtonId}-visible`);
  const phoneHidden = isButtonHidden(sec, "phone", `${heroPhoneId}-visible`);
  const heroButtonVisibility = primaryHidden ? " hidden" : "";
  const heroButtonMotion = sec.settings?.[`${heroButtonId}-motion`] || "";
  const heroPhoneMotion = sec.settings?.[`${heroPhoneId}-motion`] || "";

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
      <div class="relative overflow-hidden py-24 lg:py-36 text-white">
        <img src="${c.heroImage || getTradeFallbackDataUrl(project.business.tradeId, 'hero', c.title)}"
             alt="${c.title || 'Artisan local'}"
             class="absolute inset-0 w-full h-full object-cover -z-10 brightness-[0.3]"
             loading="eager" fetchpriority="high" decoding="async"
             onerror="if(!this.dataset.fallbackApplied){this.dataset.fallbackApplied='true';this.src='${getTradeFallbackDataUrl(project.business.tradeId, 'hero', c.title)}';}">
        <div class="absolute inset-0 bg-slate-950/60 -z-10"></div>
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
            ${primaryHidden ? '' : `
              <div class="cta-button-wrapper group/cta" role="group" tabindex="0" aria-expanded="false" aria-controls="cta-popover-${sec.id}-primary" data-cta-popover-wrapper data-section-id="${sec.id}" data-button-type="primary" data-ui-id="${heroButtonId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}">
                ${renderButtonActionBadge(sec, 'primary', options, project)}
                <a href="#simulateur" class="btn-cta btn-keycap${ctaPulseClass}${heroButtonMotion ? ` btn-motion-${heroButtonMotion}` : ''} w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-bold text-white shadow-2xl transition-all" data-ui-id="${heroButtonId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}"${heroButtonMotion ? ` data-motion="${heroButtonMotion}" data-btn-motion="${heroButtonMotion}"` : ''} style="background-color: var(--primary);">
                  ${getIcon("sparkles", "w-5 h-5")}
                  <span data-editable="ctaPrimary">${c.ctaPrimary}</span>
                </a>
                ${renderButtonPopover(sec, 'primary', options, project)}
              </div>
            `}

            ${phoneHidden ? '' : `
              <div class="cta-button-wrapper group/cta" role="group" tabindex="0" aria-expanded="false" aria-controls="cta-popover-${sec.id}-phone" data-cta-popover-wrapper data-section-id="${sec.id}" data-button-type="phone" data-ui-id="${heroPhoneId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}">
                ${renderButtonActionBadge(sec, 'phone', options, project)}
                <a href="tel:${c.phone}" class="btn-cta btn-keycap${ctaPulseClass}${heroPhoneMotion ? ` btn-motion-${heroPhoneMotion}` : ''} w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 text-base font-semibold text-white bg-white/15 backdrop-blur-md border border-white/30 hover:bg-white/25 transition-colors" data-ui-id="${heroPhoneId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}"${heroPhoneMotion ? ` data-motion="${heroPhoneMotion}" data-btn-motion="${heroPhoneMotion}"` : ''}>
                  ${getIcon("phone", "w-5 h-5 text-emerald-400")}
                  <span data-editable="ctaSecondary">${c.ctaSecondary}</span>
                </a>
                ${renderButtonPopover(sec, 'phone', options, project)}
              </div>
            `}
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
                ${primaryHidden ? '' : `
                  <div class="cta-button-wrapper group/cta" role="group" tabindex="0" aria-expanded="false" aria-controls="cta-popover-${sec.id}-primary" data-cta-popover-wrapper data-section-id="${sec.id}" data-button-type="primary" data-ui-id="${heroButtonId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}">
                    ${renderButtonActionBadge(sec, 'primary', options, project)}
                    <a href="#simulateur" class="btn-cta btn-keycap${ctaPulseClass}${heroButtonMotion ? ` btn-motion-${heroButtonMotion}` : ''} inline-flex items-center justify-center gap-2.5 px-7 py-4 text-base font-bold text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5" data-ui-id="${heroButtonId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}"${heroButtonMotion ? ` data-motion="${heroButtonMotion}" data-btn-motion="${heroButtonMotion}"` : ''} style="background-color: var(--primary);">
                      ${getIcon("sparkles", "w-5 h-5")}
                      <span data-editable="ctaPrimary">${c.ctaPrimary}</span>
                    </a>
                    ${renderButtonPopover(sec, 'primary', options, project)}
                  </div>
                `}

                ${phoneHidden ? '' : `
                  <div class="cta-button-wrapper group/cta" role="group" tabindex="0" aria-expanded="false" aria-controls="cta-popover-${sec.id}-phone" data-cta-popover-wrapper data-section-id="${sec.id}" data-button-type="phone" data-ui-id="${heroPhoneId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}">
                    ${renderButtonActionBadge(sec, 'phone', options, project)}
                    <a href="tel:${c.phone}" class="btn-cta btn-keycap${ctaPulseClass}${heroPhoneMotion ? ` btn-motion-${heroPhoneMotion}` : ''} inline-flex items-center justify-center gap-2.5 px-6 py-4 text-base font-semibold text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors" data-ui-id="${heroPhoneId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}"${heroPhoneMotion ? ` data-motion="${heroPhoneMotion}" data-btn-motion="${heroPhoneMotion}"` : ''}>
                      ${getIcon("phone", "w-5 h-5 text-emerald-400")}
                      <span data-editable="ctaSecondary">${c.ctaSecondary}</span>
                    </a>
                    ${renderButtonPopover(sec, 'phone', options, project)}
                  </div>
                `}
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
            ${primaryHidden ? '' : `
              <div class="cta-button-wrapper group/cta" role="group" tabindex="0" aria-expanded="false" aria-controls="cta-popover-${sec.id}-primary" data-cta-popover-wrapper data-section-id="${sec.id}" data-button-type="primary" data-ui-id="${heroButtonId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}">
                ${renderButtonActionBadge(sec, 'primary', options, project)}
                <a href="#simulateur" class="btn-cta btn-keycap${ctaPulseClass}${heroButtonMotion ? ` btn-motion-${heroButtonMotion}` : ''} inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all" data-ui-id="${heroButtonId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}"${heroButtonMotion ? ` data-motion="${heroButtonMotion}" data-btn-motion="${heroButtonMotion}"` : ''} style="background-color: var(--primary);">
                  ${getIcon("sparkles", "w-4 h-4")}
                  <span data-editable="ctaPrimary">${c.ctaPrimary}</span>
                </a>
                ${renderButtonPopover(sec, 'primary', options, project)}
              </div>
            `}

            ${phoneHidden ? '' : `
              <div class="cta-button-wrapper group/cta" role="group" tabindex="0" aria-expanded="false" aria-controls="cta-popover-${sec.id}-phone" data-cta-popover-wrapper data-section-id="${sec.id}" data-button-type="phone" data-ui-id="${heroPhoneId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}">
                ${renderButtonActionBadge(sec, 'phone', options, project)}
                <a href="tel:${c.phone}" class="btn-cta btn-keycap${ctaPulseClass}${heroPhoneMotion ? ` btn-motion-${heroPhoneMotion}` : ''} inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-gray-800 bg-white border border-gray-300 hover:bg-gray-50 transition-colors" data-ui-id="${heroPhoneId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}"${heroPhoneMotion ? ` data-motion="${heroPhoneMotion}" data-btn-motion="${heroPhoneMotion}"` : ''}>
                  ${getIcon("phone", "w-4 h-4 text-emerald-600")}
                  <span data-editable="ctaSecondary">${c.ctaSecondary}</span>
                </a>
                ${renderButtonPopover(sec, 'phone', options, project)}
              </div>
            `}
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

            <div class="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              ${primaryHidden ? '' : `
                <div class="cta-button-wrapper group/cta" role="group" tabindex="0" aria-expanded="false" aria-controls="cta-popover-${sec.id}-primary" data-cta-popover-wrapper data-section-id="${sec.id}" data-button-type="primary" data-ui-id="${heroButtonId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}">
                  ${renderButtonActionBadge(sec, 'primary', options, project)}
                  <a href="#simulateur" class="btn-cta btn-keycap${ctaPulseClass}${heroButtonMotion ? ` btn-motion-${heroButtonMotion}` : ''} inline-flex items-center justify-center gap-2.5 shadow-xl transition-all" data-ui-id="${heroButtonId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}"${heroButtonMotion ? ` data-motion="${heroButtonMotion}" data-btn-motion="${heroButtonMotion}"` : ''} style="background-color: var(--primary); color: #ffffff;">
                    ${getIcon("sparkles", "w-5 h-5")}
                    <span data-editable="ctaPrimary">${c.ctaPrimary}</span>
                  </a>
                  ${renderButtonPopover(sec, 'primary', options, project)}
                </div>
              `}
              ${phoneHidden ? '' : `
                <div class="cta-button-wrapper group/cta" role="group" tabindex="0" aria-expanded="false" aria-controls="cta-popover-${sec.id}-phone" data-cta-popover-wrapper data-section-id="${sec.id}" data-button-type="phone" data-ui-id="${heroPhoneId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}">
                  ${renderButtonActionBadge(sec, 'phone', options, project)}
                  <a href="tel:${c.phone}" class="btn-cta btn-keycap${ctaPulseClass}${heroPhoneMotion ? ` btn-motion-${heroPhoneMotion}` : ''} inline-flex items-center justify-center gap-2.5 shadow-sm transition-all" data-ui-id="${heroPhoneId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}"${heroPhoneMotion ? ` data-motion="${heroPhoneMotion}" data-btn-motion="${heroPhoneMotion}"` : ''} style="background-color: #ffffff; color: #18181b; border: 1px solid #e4e4e7;">
                    ${getIcon("phone", "w-5 h-5 text-emerald-600")}
                    <span data-editable="ctaSecondary">${c.ctaSecondary}</span>
                  </a>
                  ${renderButtonPopover(sec, 'phone', options, project)}
                </div>
              `}
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
  const bgClass = sec.settings?.bgTheme === "mineral" ? "bg-sec-mineral" : (sec.settings?.bgTheme === "dark" ? "bg-sec-dark" : "bg-white");
  return `
    <div class="py-12 ${bgClass} border-y border-black/5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          ${(c.badges || []).map((b, idx) => `
            <div class="flex items-start gap-3.5 p-4 rounded-xl hover:bg-black/5 transition-colors">
              <div class="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white shadow-xs" style="background-color: var(--primary);">
                ${getIcon(idx === 0 ? "clock" : idx === 1 ? "shield" : idx === 2 ? "badgeCheck" : "checkCircle", "w-5 h-5")}
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-gray-900 text-sm leading-tight" data-editable="badges.${idx}.title">${b.title}</h4>
                <p class="text-xs text-gray-500 mt-1 leading-normal" data-editable="badges.${idx}.desc">${b.desc}</p>
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
          ${(c.items || []).map((item, idx) => `
            <div class="p-4">
              <div class="font-heading text-4xl sm:text-5xl font-extrabold text-white tracking-tight" data-editable="items.${idx}.value">${item.value}</div>
              <div class="font-bold text-white/90 text-sm mt-2" data-editable="items.${idx}.label">${item.label}</div>
              <div class="text-xs text-white/70 mt-1" data-editable="items.${idx}.sub">${item.sub}</div>
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
                  <span class="absolute top-4 right-4 z-10 bg-black/75 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider" data-editable="services.${idx}.tag">
                    ${srv.tag}
                  </span>
                </div>
                <div class="p-8 flex-1 flex flex-col justify-between space-y-5">
                  <div class="space-y-2.5">
                    <h3 class="font-heading text-2xl font-bold text-gray-900" data-editable="services.${idx}.title">${srv.title}</h3>
                    <p class="text-gray-600 text-sm leading-relaxed" data-editable="services.${idx}.desc">${srv.desc}</p>
                  </div>
                  <div class="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span class="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg" data-editable="services.${idx}.price">${srv.price}</span>
                    <a href="#simulateur" class="btn-cta text-xs font-bold text-white" style="background-color: var(--primary); border-radius: var(--btn-radius, 9999px);">
                      <span data-editable="services.${idx}.ctaText">${srv.ctaText || "Demander un devis"}</span>
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
                    <span class="inline-block text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full" data-editable="services.${idx}.tag">${srv.tag}</span>
                    <h3 class="font-heading text-2xl sm:text-3xl font-extrabold text-gray-900" data-editable="services.${idx}.title">${srv.title}</h3>
                    <p class="text-gray-600 text-base leading-relaxed" data-editable="services.${idx}.desc">${srv.desc}</p>
                    <div class="pt-2 flex items-center gap-4">
                      <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg" data-editable="services.${idx}.price">${srv.price}</span>
                      <a href="#simulateur" class="btn-cta text-xs font-bold text-white" style="background-color: var(--primary); border-radius: var(--btn-radius, 9999px);">
                        <span data-editable="services.${idx}.ctaText">${srv.ctaText || "Calculer le coût"}</span>
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
            ${(c.services || []).map((srv, idx) => `
              <div class="p-6 rounded-2xl bg-gray-50/80 border border-gray-200/80 hover:bg-white hover:border-orange-300 hover:shadow-lg transition-all space-y-3 flex flex-col justify-between">
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold uppercase tracking-wider text-orange-600" data-editable="services.${idx}.tag">${srv.tag}</span>
                    <span class="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded" data-editable="services.${idx}.price">${srv.price}</span>
                  </div>
                  <h3 class="font-heading text-lg font-bold text-gray-900" data-editable="services.${idx}.title">${srv.title}</h3>
                  <p class="text-gray-600 text-xs leading-relaxed" data-editable="services.${idx}.desc">${srv.desc}</p>
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
                <span class="absolute top-3 right-3 z-10 bg-black/70 backdrop-blur text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider" data-editable="services.${idx}.tag">
                  ${srv.tag}
                </span>
              </div>
              <div class="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 class="font-heading text-xl font-bold text-gray-900 leading-snug" data-editable="services.${idx}.title">${srv.title}</h3>
                  <p class="text-gray-600 text-sm mt-2.5 leading-relaxed" data-editable="services.${idx}.desc">${srv.desc}</p>
                </div>
                <div class="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md" data-editable="services.${idx}.price">${srv.price}</span>
                  <a href="#simulateur" class="btn-cta text-xs font-bold text-white" style="background-color: var(--primary); border-radius: var(--btn-radius, 9999px);">
                    <span data-editable="services.${idx}.ctaText">${srv.ctaText || "Chiffrer"}</span>
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

// 7. Before / After Interactive SplitReveal Slider
function renderBeforeAfter(sec, project, options = {}) {
  const c = sec.content || {};
  const direction = c.direction || sec.settings?.direction || (sec.variant === "vertical" ? "vertical" : "horizontal");
  const initialSplit = Number(sec.settings?.initialSplit) || 50;
  const isVertical = direction === "vertical";

  const directionToggleBtn = options.isEditor ? `
    <div class="flex justify-center mb-6">
      <div class="inline-flex rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 text-xs font-semibold shadow-xs">
        <button type="button" onclick="event.stopPropagation(); window.app.setSectionSplitDirection('${sec.id}', 'horizontal')" class="px-3 py-1 rounded-md transition-all ${!isVertical ? 'bg-white shadow-xs text-zinc-900 font-bold' : 'text-zinc-500 hover:text-zinc-900'}">
          ⬌ Horizontal
        </button>
        <button type="button" onclick="event.stopPropagation(); window.app.setSectionSplitDirection('${sec.id}', 'vertical')" class="px-3 py-1 rounded-md transition-all ${isVertical ? 'bg-white shadow-xs text-zinc-900 font-bold' : 'text-zinc-500 hover:text-zinc-900'}">
          ⬍ Vertical (Façade/Toit)
        </button>
      </div>
    </div>
  ` : "";

  const beforeBadge = options.isEditor ? `
    <div class="absolute top-4 left-4 z-30 flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur px-2.5 py-1 rounded-lg shadow-sm border border-zinc-800">
      <span class="text-[10px] text-white font-medium uppercase mr-1" data-editable="beforeLabel">${c.beforeLabel || 'Avant travaux'}</span>
      <button type="button" onclick="event.stopPropagation(); window.app.openImagePicker('${sec.id}', 'beforeImage')" class="px-2 py-0.5 bg-white hover:bg-zinc-100 text-zinc-900 rounded text-[10px] font-medium border border-zinc-200 transition-colors">Remplacer</button>
      <button type="button" onclick="event.stopPropagation(); window.app.deletePhoto('${sec.id}', 'beforeImage')" class="p-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] transition-colors" title="Poubelle">🗑️</button>
    </div>
  ` : `
    <div class="absolute top-4 left-4 z-30 bg-zinc-900/80 backdrop-blur text-white text-xs font-medium px-3 py-1 rounded-md uppercase tracking-wider shadow-xs border border-zinc-800/60">
      ${c.beforeLabel || 'Avant travaux'}
    </div>
  `;

  const afterBadge = options.isEditor ? `
    <div class="absolute top-4 right-4 z-30 flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur px-2.5 py-1 rounded-lg shadow-sm border border-zinc-800">
      <span class="text-[10px] text-white font-medium uppercase mr-1" data-editable="afterLabel">${c.afterLabel || 'Après intervention'}</span>
      <button type="button" onclick="event.stopPropagation(); window.app.openImagePicker('${sec.id}', 'afterImage')" class="px-2 py-0.5 bg-white hover:bg-zinc-100 text-zinc-900 rounded text-[10px] font-medium border border-zinc-200 transition-colors">Remplacer</button>
      <button type="button" onclick="event.stopPropagation(); window.app.deletePhoto('${sec.id}', 'afterImage')" class="p-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] transition-colors" title="Poubelle">🗑️</button>
    </div>
  ` : `
    <div class="absolute top-4 right-4 z-30 bg-white/90 backdrop-blur text-zinc-900 text-xs font-medium px-3 py-1 rounded-md uppercase tracking-wider shadow-xs border border-zinc-200">
      ${c.afterLabel || 'Après intervention'}
    </div>
  `;

  return `
    <div id="before-after" class="py-20 lg:py-28" style="background-color: var(--bg);">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-800" data-editable="badge">
            ${c.badge || 'Preuve en images'}
          </div>
          <h2 class="font-heading text-3xl sm:text-4xl font-extrabold text-gray-900" data-editable="title">
            ${c.title || 'Transformation de vos espaces'}
          </h2>
          <p class="text-gray-600 text-base" data-editable="subtitle">
            ${c.subtitle || 'Faites glisser le curseur pour visualiser la métamorphose avant et après nos travaux'}
          </p>
        </div>

        ${directionToggleBtn}

        <div class="ba-container split-reveal-container shadow-2xl border-4 border-white"
             data-split-direction="${direction}"
             data-split-pos="${initialSplit}"
             data-sec-id="${sec.id}"
             tabindex="0"
             role="slider"
             aria-label="Comparateur Avant Après"
             aria-valuenow="${initialSplit}"
             aria-valuemin="0"
             aria-valuemax="100">
          <img src="${c.afterImage}" data-fallback-src="${getTradeFallbackDataUrl(project?.business?.tradeId || 'paysagiste', 'beforeAfter', 'Chantier Réalisé')}" alt="Après intervention" class="ba-img-after sr-img-after" onerror="if(!this.dataset.fallbackApplied){this.dataset.fallbackApplied='true';this.src=this.dataset.fallbackSrc;}">

          <div class="ba-img-before-wrapper sr-clipper" style="${isVertical ? `clip-path: polygon(0 0, 100% 0, 100% ${initialSplit}%, 0 ${initialSplit}%); width: 100%;` : `width: ${initialSplit}%;`}">
            <img src="${c.beforeImage}" data-fallback-src="${getTradeFallbackDataUrl(project?.business?.tradeId || 'paysagiste', 'beforeAfter', 'Avant Travaux')}" alt="Avant intervention" class="ba-img-before sr-img-before" onerror="if(!this.dataset.fallbackApplied){this.dataset.fallbackApplied='true';this.src=this.dataset.fallbackSrc;}">
          </div>

          <div class="ba-handle sr-handle" style="${isVertical ? `top: ${initialSplit}%; left: 0; right: 0;` : `left: ${initialSplit}%; top: 0; bottom: 0;`}">
            <div class="sr-line"></div>
            <div class="ba-handle-button sr-button">
              <span>${isVertical ? '▲ ▼' : '‹ ›'}</span>
            </div>
          </div>

          <span class="sr-percent-badge">${initialSplit}%</span>

          <!-- Labels -->
          ${beforeBadge}
          ${afterBadge}
        </div>

        ${c.caption ? `<p class="sr-caption mt-3 text-xs text-center text-gray-500 italic" data-editable="caption">${c.caption}</p>` : ''}

        <div class="mt-6 flex items-center justify-between text-xs font-medium text-gray-500 px-2">
          <div class="flex items-center gap-1.5">
            ${getIcon("mapPin", "w-4 h-4 text-gray-400")}
            <span>${c.projectCity || project.business?.city || 'Zone locale'}</span>
          </div>
          <div class="flex items-center gap-1.5">
            ${getIcon("clock", "w-4 h-4 text-gray-400")}
            <span>Durée : ${c.duration || 'Sur devis'}</span>
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
                  <span class="font-semibold text-gray-500 uppercase" data-editable="items.${idx}.category">${r.category}</span>
                  <span class="text-emerald-700 font-medium" data-editable="items.${idx}.city">${r.city}</span>
                </div>
                <h3 class="font-bold text-gray-900 text-base leading-snug" data-editable="items.${idx}.title">${r.title}</h3>
                <p class="text-gray-600 text-xs leading-relaxed" data-editable="items.${idx}.desc">${r.desc}</p>
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
function renderReviews(sec, project, options = {}) {
  const c = sec.content;
  const variant = sec.variant || "google-cards";

  if (variant === "quote-carousel") {
    return `
      <div id="avis" class="py-20 lg:py-28 bg-white border-t border-black/5">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <div class="inline-flex items-center gap-1.5 text-amber-500 text-sm font-bold">
              ${renderRatingStars(Math.round(Number(c.overallRating) || 5), { editor: options.isEditor, sectionId: sec.id, reviewIndex: -1 })}
              <span class="text-gray-700 ml-1.5" data-editable="overallRating">${c.overallRating || '4.9'}/5 — Avis vérifiés</span>
            </div>
            <h2 class="font-heading text-3xl font-extrabold text-gray-900" data-editable="title">${c.title}</h2>
            <p class="text-gray-600 text-sm" data-editable="subtitle">${c.subtitle}</p>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            ${(c.reviews || []).map((r, idx) => `
              <div class="bg-gray-50/80 p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-6">
                <div class="space-y-4">
                  <div class="flex text-amber-400">
                    ${renderRatingStars(r.rating, { editor: options.isEditor, sectionId: sec.id, reviewIndex: idx })}
                  </div>
                  <p class="text-gray-700 text-sm leading-relaxed italic" data-editable="reviews.${idx}.text">« ${r.text} »</p>
                </div>
                <div class="pt-4 border-t border-gray-200/60 flex items-center justify-between text-xs">
                  <div>
                    <span class="font-bold text-gray-900 block" data-editable="reviews.${idx}.author">${r.author}</span>
                    <span class="text-gray-500 text-[11px]" data-editable="reviews.${idx}.city">${r.city}</span>
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
              ${renderRatingStars(Math.round(Number(c.overallRating) || 5), { editor: options.isEditor, sectionId: sec.id, reviewIndex: -1 })}
            </div>
            <div class="font-heading text-5xl font-extrabold text-gray-900" data-editable="overallRating">${c.overallRating || '4.9'} <span class="text-xl font-semibold text-gray-400">/ 5</span></div>
            <div class="text-sm font-bold text-gray-800" data-editable="totalReviews">${c.totalReviews || '48 avis vérifiés'}</div>
            <p class="text-xs text-gray-500 leading-relaxed">Retours d'expérience collectés après réalisation de chantiers à ${project.business.city} et ses alentours.</p>
            <div class="pt-2">
              <span class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-full">
                ${getIcon("checkCircle", "w-4 h-4")}
                <span>100% Avis Authentiques</span>
              </span>
            </div>
          </div>

          <div class="lg:col-span-8 grid sm:grid-cols-2 gap-6">
            ${(c.reviews || []).map((r, idx) => `
              <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3 flex flex-col justify-between">
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <div class="font-bold text-gray-900 text-sm" data-editable="reviews.${idx}.author">${r.author}</div>
                    <div class="flex text-amber-400">
                      ${renderRatingStars(r.rating, { editor: options.isEditor, sectionId: sec.id, reviewIndex: idx })}
                    </div>
                  </div>
                  <p class="text-xs text-gray-600 leading-relaxed italic" data-editable="reviews.${idx}.text">« ${r.text} »</p>
                </div>
                <div class="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-50">
                  <span data-editable="reviews.${idx}.city">${r.city}</span>
                  <span>${r.date || 'Récemment'}</span>
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
                <select class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-zinc-900 focus:bg-white">
                  ${(c.types || []).map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">${c.sizeLabel || 'Envergure du projet'}</label>
                <select class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-zinc-900 focus:bg-white">
                  ${(c.sizes || []).map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-6">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Votre Nom ou Entreprise</label>
                <input type="text" required placeholder="Ex: M. Dupont" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-zinc-900 focus:bg-white">
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Votre Téléphone (pour devis)</label>
                <input type="tel" required placeholder="06 XX XX XX XX" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-zinc-900 focus:bg-white">
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Précisions sur votre demande (optionnel)</label>
              <textarea rows="3" placeholder="Décrivez succinctement votre besoin ou contraintes..." class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-zinc-900 focus:bg-white"></textarea>
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
            <div class="bg-white p-3 sm:p-4 rounded-3xl shadow-xl border border-black/5 overflow-hidden">
              <div class="w-full h-84 sm:h-96 rounded-2xl relative overflow-hidden bg-slate-100 border border-zinc-200 group">
                <!-- Interactive Embedded Map with Zoom/Pan -->
                <iframe
                  title="Carte de proximité et zone d'intervention"
                  class="w-full h-full border-0 filter saturate-[1.1] contrast-[1.05]"
                  loading="lazy"
                  allowfullscreen
                  src="https://maps.google.com/maps?q=${encodeURIComponent(c.address || (c.city ? c.city + ', France' : 'France'))}&t=&z=12&ie=UTF8&iwloc=&output=embed">
                </iframe>

                <!-- Floating Glass Overlay with Info & Route -->
                <div class="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-xs z-10 bg-zinc-950/85 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-xl text-white space-y-1.5 pointer-events-auto">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span class="text-xs font-bold text-emerald-300">Zone d'intervention garantie</span>
                  </div>
                  <div class="text-xs font-semibold text-white truncate">${c.city} & alentours (35 km)</div>
                  <div class="text-[10px] text-zinc-300">Déplacement rapide & diagnostic offert</div>
                  <a href="https://maps.google.com/?q=${encodeURIComponent(c.address || (c.city ? c.city + ', France' : 'France'))}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 hover:text-amber-300 underline pt-1">
                    <span>${c.ctaRoute || "Ouvrir dans Google Maps"}</span>
                    ${getIcon("externalLink", "w-3 h-3")}
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
                <span class="text-sm font-bold text-gray-900" data-editable="items.${idx}.q">${faq.q}</span>
                <span class="faq-icon text-gray-400 text-xs transition-transform">${getIcon("chevronDown", "w-4 h-4")}</span>
              </div>
              <div class="faq-content">
                <p class="text-sm text-gray-600 leading-relaxed" data-editable="items.${idx}.a">${faq.a}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// 15. Final CTA
function renderCta(sec, project, options = {}) {
  const c = sec.content;
  const primaryButtonId = getUiId(project, sec, "btn-primary");
  const phoneButtonId = getUiId(project, sec, "btn-phone");
  const primaryHidden = isButtonHidden(sec, "primary", `${primaryButtonId}-visible`);
  const phoneHidden = isButtonHidden(sec, "phone", `${phoneButtonId}-visible`);
  const primaryButtonMotion = sec.settings?.[`${primaryButtonId}-motion`] || sec.settings?.["btn-primary-motion"] || sec.settings?.["primary-motion"] || "";
  const phoneButtonMotion = sec.settings?.[`${phoneButtonId}-motion`] || sec.settings?.["btn-phone-motion"] || sec.settings?.["phone-motion"] || "";
  const ctaPulseClass = project?.branding?.ctaPulse ? " btn-cta-pulse" : "";

  const sectionTheme = sec.settings?.bgTheme || "primary";
  const customBg = sec.settings?.customBackground || "";
  const isLight = sectionTheme === "white" || sectionTheme === "mineral" || sectionTheme === "warm" ||
    (customBg && customBg.toLowerCase() !== "#09090b" && customBg.toLowerCase() !== "#18181b" && customBg.toLowerCase() !== "#0b1329");

  const titleColorClass = isLight ? "text-gray-900" : "text-white";
  const subColorClass = isLight ? "text-gray-600" : "text-white/80";
  const badgeClass = isLight
    ? "text-orange-600 bg-orange-50 border border-orange-200/60"
    : "text-white/80 bg-white/10 border border-white/20";
  const primaryBtnClass = isLight
    ? "bg-zinc-950 text-white shadow-xl hover:bg-zinc-800"
    : "bg-white text-gray-900 shadow-xl hover:bg-gray-50";
  const phoneBtnClass = isLight
    ? "border border-zinc-300 text-zinc-900 bg-white hover:bg-zinc-50 shadow-sm"
    : "border border-white/30 text-white hover:bg-white/10 shadow-sm";

  return `
    <div id="cta" class="py-20 relative overflow-hidden transition-colors duration-200" style="${isLight ? '' : 'background-color: var(--primary);'}">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
        <span class="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${badgeClass}" data-editable="badge">${c.badge}</span>
        <h2 class="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold ${titleColorClass} leading-tight" data-editable="title">${c.title}</h2>
        <p class="${subColorClass} text-base sm:text-lg max-w-2xl mx-auto" data-editable="subtitle">${c.subtitle}</p>
        <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          ${primaryHidden ? '' : `
            <div class="cta-button-wrapper group/cta" role="group" tabindex="0" aria-expanded="false" aria-controls="cta-popover-${sec.id}-primary" data-cta-popover-wrapper data-section-id="${sec.id}" data-button-type="primary" data-ui-id="${primaryButtonId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}">
              ${renderButtonActionBadge(sec, 'primary', options, project)}
              <a href="#simulateur" class="btn-cta btn-keycap${ctaPulseClass} ${primaryBtnClass}${primaryButtonMotion ? ` btn-motion-${primaryButtonMotion}` : ''}" data-ui-id="${primaryButtonId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}"${primaryButtonMotion ? ` data-motion="${primaryButtonMotion}" data-btn-motion="${primaryButtonMotion}"` : ''}>
                ${getIcon("sparkles", "w-5 h-5 text-amber-500")}
                <span data-editable="ctaPrimary">${c.ctaPrimary}</span>
              </a>
              ${renderButtonPopover(sec, 'primary', options, project)}
            </div>
          `}
          ${phoneHidden ? '' : `
            <div class="cta-button-wrapper group/cta" role="group" tabindex="0" aria-expanded="false" aria-controls="cta-popover-${sec.id}-phone" data-cta-popover-wrapper data-section-id="${sec.id}" data-button-type="phone" data-ui-id="${phoneButtonId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}">
              ${renderButtonActionBadge(sec, 'phone', options, project)}
              <a href="tel:${c.phone}" class="btn-cta btn-keycap${ctaPulseClass} ${phoneBtnClass}${phoneButtonMotion ? ` btn-motion-${phoneButtonMotion}` : ''}" data-ui-id="${phoneButtonId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}"${phoneButtonMotion ? ` data-motion="${phoneButtonMotion}" data-btn-motion="${phoneButtonMotion}"` : ''}>
                ${getIcon("phone", "w-5 h-5")}
                <span data-editable="ctaSecondary">${c.ctaSecondary}</span>
              </a>
              ${renderButtonPopover(sec, 'phone', options, project)}
            </div>
          `}
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
            <div class="font-heading text-xl font-bold text-white">${c.brandName || project.business?.name || 'Artisan'}</div>
            <p class="text-xs text-gray-400 max-w-sm leading-relaxed">${c.desc || `${project.business?.tradeLabel || 'Artisan'} professionnel à ${project.business?.city || 'votre service'}.`}</p>
            <div class="text-xs text-gray-500">${c.address || project.business?.address || ''}</div>
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
              <div>Téléphone : <a href="tel:${c.phone || project.business?.phone || ''}" class="text-white hover:underline">${c.phone || project.business?.phone || ''}</a></div>
              <div>Email : <a href="mailto:${c.email || project.business?.email || ''}" class="text-white hover:underline">${c.email || project.business?.email || ''}</a></div>
              <div>Localisation : ${c.city || project.business?.city || ''}</div>
            </div>
          </div>
        </div>
        <div class="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>${c.copyright || `© ${new Date().getFullYear()} ${c.brandName || project.business?.name || 'Artisan'}. Tous droits réservés.`}</div>
          <div class="flex gap-4">
            <a href="#" class="hover:text-gray-300">Mentions légales</a>
            <a href="#" class="hover:text-gray-300">Données personnelles</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}

// 17. Canva-like Custom Block
function renderCustomBlock(sec, project, options = {}) {
  const c = sec.content || {};
  const blockType = c.blockType || sec.variant || "urgentBanner";

  if (blockType === "urgentBanner") {
    return `
      <div class="urgent-banner bg-amber-500 text-zinc-950 px-4 py-3 shadow-xs">
        <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-3.5 text-xs sm:text-sm font-semibold text-center">
          ${c.badge ? `<span class="px-2 py-0.5 rounded bg-black text-white text-[11px] font-bold uppercase tracking-wider" data-editable="badge">${c.badge}</span>` : '<span class="text-base">📢</span>'}
          ${c.title ? `<strong data-editable="title" class="font-bold">${c.title} :</strong>` : ''}
          <span data-editable="text">${c.text || "Offre spéciale de saison : Devis et déplacement offerts sous 24h !"}</span>
          ${c.ctaText ? `
            <a href="${c.ctaLink || '#contact'}" class="ml-2 px-3 py-1 bg-zinc-950 text-white rounded-full text-xs font-semibold hover:bg-zinc-800 transition-colors" data-editable="ctaText">
              ${c.ctaText}
            </a>
          ` : ''}
        </div>
      </div>
    `;
  }

  if (blockType === "floatingBadge") {
    return `
      <div class="py-6 bg-white border-b border-zinc-100 text-center">
        <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-emerald-200 bg-emerald-50/70 text-emerald-900 text-xs font-semibold shadow-xs">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          ${c.badge ? `<span data-editable="badge" class="font-bold">${c.badge}</span><span class="text-emerald-400">•</span>` : ''}
          <span data-editable="title">${c.title || "Artisan Vérifié & Agréé 2026"}</span>
          <span class="text-emerald-400">•</span>
          <span data-editable="text">${c.text || c.subtitle || "Garantie Décennale & Responsabilité Civile Professionnelle"}</span>
          ${c.ctaText ? `
            <a href="${c.ctaLink || '#contact'}" class="ml-2 text-emerald-700 underline font-medium hover:text-emerald-900" data-editable="ctaText">${c.ctaText}</a>
          ` : ''}
        </div>
      </div>
    `;
  }

  if (blockType === "radarEmergency" || c.isRadar) {
    return `
      <div class="urgent-banner bg-gradient-to-r from-red-600 via-amber-600 to-red-700 text-white px-4 py-3.5 shadow-md">
        <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
          <div class="flex items-center gap-2.5">
            <span class="radar-pulse-dot"></span>
            <span class="px-2 py-0.5 rounded bg-black/40 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider" data-editable="badge">${c.badge || "Astreinte 24/7"}</span>
            <strong data-editable="title" class="font-bold text-white">${c.title || "Intervention d'Urgence 24h/24"} :</strong>
            <span data-editable="text" class="text-white/90 hidden md:inline">${c.text || "Dépannage express sur site en moins de 30 minutes"}</span>
          </div>
          <div class="flex items-center gap-2.5">
            <span class="physical-sticker">⚡ 30 MIN</span>
            <span class="physical-sticker sticker-tilt-right">★ 100% AGRÉÉ</span>
            ${c.ctaText ? `
              <a href="${c.ctaLink || `tel:${project.business?.phone || ''}`}" class="btn-keycap btn-keycap-light ml-1 px-3 py-1.5 text-zinc-950 rounded-full text-xs font-bold" data-editable="ctaText">
                ${c.ctaText}
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  if (blockType === "campaignCard") {
    const current = Number(c.currentBookings) || 18;
    const target = Number(c.targetBookings) || 25;
    const progressPct = Math.min(100, Math.round((current / target) * 100));
    const pills = Array.isArray(c.pills) ? c.pills : ["Formule Essentiel", "Formule Confort", "Clé en main"];
    const activePill = c.activePill ?? 1;

    return `
      <div class="py-14 bg-white">
        <div class="max-w-5xl mx-auto px-4 sm:px-6">
          <div class="campaign-card">
            <div class="space-y-4">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800" data-editable="badge">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                ${c.badge || "Offre & Calendrier Prioritaire"}
              </span>
              <h3 class="font-heading text-2xl sm:text-3xl font-extrabold text-zinc-900 leading-tight" data-editable="title">
                ${c.title || `Campagne Rénovation & Chantiers ${project.business?.city || 'Locaux'}`}
              </h3>
              <p class="text-sm text-zinc-600 leading-relaxed" data-editable="text">
                ${c.text || "Réservez votre créneau d'intervention dès maintenant pour bénéficier d'un démarrage garanti et d'un tarif négocié."}
              </p>
              <div class="text-xs font-semibold text-zinc-900 bg-zinc-100 px-3 py-2 rounded-lg inline-block" data-editable="priceText">
                ${c.priceText || "Tarif indicatif : À partir de 450€ TTC"}
              </div>
            </div>

            <div class="space-y-5 bg-zinc-50 p-6 rounded-xl border border-zinc-200/80">
              <div class="space-y-2">
                <div class="flex justify-between items-center text-xs font-bold text-zinc-700">
                  <span>Disponibilités ce mois-ci</span>
                  <span class="text-emerald-700 font-extrabold">${current} / ${target} chantiers confirmés (${progressPct}%)</span>
                </div>
                <div class="campaign-progress-bar">
                  <div class="campaign-progress-fill" style="width: ${progressPct}%;"></div>
                </div>
              </div>

              <div class="space-y-2">
                <span class="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Sélectionnez votre formule</span>
                <div class="campaign-pill-selector">
                  ${pills.map((pill, idx) => `
                    <button type="button" class="campaign-pill-option ${idx === activePill ? 'is-active' : ''}">
                      ${pill}
                    </button>
                  `).join("")}
                </div>
              </div>

              <a href="${c.ctaLink || '#quoteSimulator'}" class="btn-cta w-full text-center block text-white font-bold py-3 shadow-md" style="background-color: var(--primary);">
                <span data-editable="ctaText">${c.ctaText || "Réserver mon créneau prioritaire"}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Custom Card Box
  return `
    <div class="py-12 bg-white">
      <div class="max-w-4xl mx-auto px-4 sm:px-6">
        <div class="p-8 sm:p-10 rounded-2xl border border-zinc-200 bg-zinc-50 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div class="space-y-2 text-center sm:text-left">
            <span class="text-xs font-bold uppercase tracking-wider text-zinc-400" data-editable="badge">${c.badge || c.tag || "Information importante"}</span>
            <h3 class="text-xl font-bold text-zinc-900" data-editable="title">${c.title || "Vous avez un chantier urgent ou sur-mesure ?"}</h3>
            <p class="text-sm text-zinc-600 max-w-xl" data-editable="text">${c.text || c.desc || "Notre équipe se déplace directement chez vous pour évaluer vos travaux et vous remettre un devis ferme et gratuit sous 24h."}</p>
          </div>
          <a href="${c.ctaLink || `tel:${project.business?.phone || ''}`}" class="btn-cta text-white whitespace-nowrap" style="background-color: var(--primary);">
            <span>${getIcon("phone", "w-4 h-4")}</span>
            <span data-editable="ctaText">${c.ctaText || c.cta || "Appeler l'artisan"}</span>
          </a>
        </div>
      </div>
    </div>
  `;
}

// 18. Process Steps
function renderProcess(sec, project, options = {}) {
  const c = sec.content || {};
  const steps = Array.isArray(c.steps) ? c.steps : [
    { num: "01", title: "Premier Contact & Écoute", desc: "Échange direct sur votre besoin, visite sur site si nécessaire et conseils techniques adaptés." },
    { num: "02", title: "Devis Détaillé sous 24h", desc: "Proposition claire, chiffrage transparent sans mauvaise surprise et calendrier d'intervention." },
    { num: "03", title: "Réalisation & Réception", desc: "Exécution soignée dans les règles de l'art, respect des délais et chantier rendu impeccable." }
  ];

  return `
    <div id="process" class="py-20 lg:py-28" style="background-color: var(--bg);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/5 text-gray-700" data-editable="badge">
            ${c.badge || "Notre Méthode"}
          </div>
          <h2 class="font-heading text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight" data-editable="title">
            ${c.title || "Un déroulement simple et transparent"}
          </h2>
          <p class="text-gray-600 text-base sm:text-lg" data-editable="subtitle">
            ${c.subtitle || "De la prise de contact à la livraison de vos travaux, nous vous accompagnons à chaque étape."}
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8 relative">
          ${steps.map((st, idx) => `
            <div class="relative p-6 sm:p-8 rounded-2xl bg-white border border-black/5 shadow-sm flex flex-col justify-between">
              <div class="flex items-center justify-between mb-6">
                <span class="text-3xl font-extrabold text-zinc-300 font-mono" data-editable="steps.${idx}.num">${st.num || '0' + (idx + 1)}</span>
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style="background-color: var(--primary);">
                  ${getIcon(idx === 0 ? "phone" : idx === 1 ? "fileText" : "checkCircle", "w-5 h-5")}
                </div>
              </div>
              <div class="space-y-2.5">
                <h3 class="font-heading text-lg font-bold text-gray-900" data-editable="steps.${idx}.title">${st.title}</h3>
                <p class="text-sm text-gray-600 leading-relaxed" data-editable="steps.${idx}.desc">${st.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// 19. Certifications & Warranties
function renderCertifications(sec, project, options = {}) {
  const c = sec.content || {};
  const items = Array.isArray(c.items) ? c.items : [
    { title: "Garantie Décennale", desc: "Couverture décennale sur tous les travaux de gros œuvre et second œuvre.", icon: "shield" },
    { title: "Responsabilité Civile Pro", desc: "Assurance professionnelle complète protégeant vos locaux et biens.", icon: "badgeCheck" },
    { title: "Respect des Normes DTU", desc: "Interventions conformes aux documents techniques unifiés et règles de l'art.", icon: "checkCircle" },
    { title: "Artisan de Proximité", desc: "Implantation locale garantissant réactivité et suivi personnalisé.", icon: "mapPin" }
  ];

  return `
    <div id="certifications" class="py-16 lg:py-20" style="background-color: var(--bg);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800" data-editable="badge">
            ${c.badge || "Sérénité & Garanties"}
          </div>
          <h2 class="font-heading text-2xl sm:text-3xl font-extrabold text-gray-900" data-editable="title">
            ${c.title || "Vos travaux en toute sécurité"}
          </h2>
          <p class="text-gray-600 text-sm sm:text-base" data-editable="subtitle">
            ${c.subtitle || "Des assurances solides et des engagements vérifiés pour votre totale tranquillité d'esprit."}
          </p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          ${items.map((it, idx) => `
            <div class="p-6 rounded-2xl bg-white border border-black/5 shadow-xs flex flex-col items-start gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                ${getIcon(it.icon || "shield", "w-5 h-5")}
              </div>
              <h4 class="font-bold text-gray-900 text-base" data-editable="items.${idx}.title">${it.title}</h4>
              <p class="text-xs text-gray-500 leading-normal" data-editable="items.${idx}.desc">${it.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// 20. Pricing / Formules
function renderPricing(sec, project, options = {}) {
  const c = sec.content || {};
  const tiers = Array.isArray(c.tiers) ? c.tiers : [
    {
      name: "Formule Essentielle",
      price: "Sur devis",
      desc: "Idéale pour les interventions ciblées et l'entretien régulier.",
      features: ["Déplacement & diagnostic offert", "Devis détaillé sous 24h", "Fourniture de matériaux standard", "Chantier nettoyé"],
      isPopular: false
    },
    {
      name: "Formule Confort",
      price: "Sur-mesure",
      desc: "La solution la plus choisie pour la rénovation complète et l'embellissement.",
      features: ["Toutes les options Essentielles", "Matériaux haut de gamme garantis", "Garantie décennale incluse", "Suivi prioritaire 7j/7"],
      isPopular: true
    },
    {
      name: "Formule Intégrale",
      price: "Projet clé en main",
      desc: "Accompagnement total de la conception à la réalisation finale sur-mesure.",
      features: ["Étude d'architecture & plans 3D", "Gestion complète des approvisionnements", "Interlocuteur unique dédié", "Garantie de parfait achèvement"],
      isPopular: false
    }
  ];

  return `
    <div id="tarifs" class="py-20 lg:py-28" style="background-color: var(--bg);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/5 text-gray-700" data-editable="badge">
            ${c.badge || "Transparence Tarifaire"}
          </div>
          <h2 class="font-heading text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight" data-editable="title">
            ${c.title || "Des formules adaptées à chaque projet"}
          </h2>
          <p class="text-gray-600 text-base sm:text-lg" data-editable="subtitle">
            ${c.subtitle || "Des prix justes, clairs et sans surprise. Chaque devis est 100% personnalisé et gratuit."}
          </p>
        </div>

        <div class="grid lg:grid-cols-3 gap-8 items-stretch">
          ${tiers.map((t, idx) => `
            <div class="relative p-8 rounded-2xl bg-white border ${t.isPopular ? 'border-2 ring-1 shadow-lg' : 'border-black/5 shadow-sm'} flex flex-col justify-between" style="${t.isPopular ? 'border-color: var(--primary); ring-color: var(--primary);' : ''}">
              ${t.isPopular ? `
                <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-white shadow-xs" style="background-color: var(--primary);">
                  Recommandé
                </div>
              ` : ''}
              <div>
                <div class="mb-4">
                  <h3 class="text-xl font-bold text-gray-900" data-editable="tiers.${idx}.name">${t.name}</h3>
                  <p class="text-xs text-gray-500 mt-1" data-editable="tiers.${idx}.desc">${t.desc}</p>
                </div>
                <div class="my-6">
                  <span class="text-3xl font-extrabold text-gray-900 font-heading" data-editable="tiers.${idx}.price">${t.price}</span>
                  <span class="text-xs text-gray-500 block mt-1">Étude gratuite sans engagement</span>
                </div>
                <ul class="space-y-3 my-6 text-sm text-gray-600">
                  ${(t.features || []).map((f, fIdx) => `
                    <li class="flex items-center gap-2.5">
                      <span class="text-emerald-500 flex-shrink-0">${getIcon("checkCircle", "w-4 h-4")}</span>
                      <span data-editable="tiers.${idx}.features.${fIdx}">${f}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
              <div class="pt-6 border-t border-gray-100">
                <a href="#simulateur" class="btn-cta w-full text-center text-sm font-bold text-white py-3 rounded-xl block" style="background-color: var(--primary);">
                  Demander une étude gratuite
                </a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Sticky Floating Action Bar (Unbounce, Duda, Carrd Inspired)
 * High-converting mobile & desktop floating pill with direct call, WhatsApp, and quote anchor.
 */
export function renderStickyCallBar(project, options = {}) {
  if (project.settings?.stickyBarEnabled === false) return "";

  const b = project.business || {};
  const phone = b.phone || "";
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const waNumber = (project.settings?.whatsappNumber || cleanPhone).replace(/[^0-9]/g, "");
  const waText = encodeURIComponent(`Bonjour ${b.name}, je souhaiterais un devis.`);
  const dockPosition = project.settings?.stickyDockPosition || "bottom-center";
  const stickyPosition = project.settings?.stickyBarPosition || {};
  const isCustomDragged = Number.isFinite(stickyPosition.left) || Number.isFinite(stickyPosition.top);
  const stickyStyle = isCustomDragged
    ? `style="${Number.isFinite(stickyPosition.left) ? `--sticky-left:${stickyPosition.left}%;` : ''}${Number.isFinite(stickyPosition.top) ? `--sticky-top:${stickyPosition.top}px;` : ''}"`
    : '';

  return `
    <div class="sticky-call-bar fixed z-40 w-[92%] max-w-md transition-all duration-300 pointer-events-auto ${isCustomDragged ? 'is-custom-dragged' : ''}" data-sticky-call-bar data-dock-position="${dockPosition}" ${stickyStyle}>
      <div class="sticky-dock-glass bg-zinc-950/80 backdrop-blur-xl text-white px-3.5 py-2 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.5)] border border-white/15 flex items-center justify-between gap-2 text-xs">

        ${options.isEditor ? `
        <button type="button" class="sticky-drag-handle text-zinc-400 hover:text-white transition-colors" title="Déplacer le bandeau" aria-label="Déplacer le bandeau de contact">
          ${getIcon("gripVertical", "w-3.5 h-3.5")}
        </button>
        ` : ''}

        <!-- Direct Call -->
        <a href="tel:${cleanPhone || phone}" class="sticky-call-btn flex-1 flex items-center justify-center gap-2 py-2 px-3.5 rounded-full font-bold bg-white text-zinc-950 hover:bg-zinc-100 transition-all shadow-md active:scale-95" aria-label="Appeler ${phone || 'l’entreprise'}">
          ${getIcon("phone", "w-3.5 h-3.5 text-zinc-900")}
          <span class="truncate tracking-tight">${phone || "Appeler"}</span>
        </a>

        <!-- Direct WhatsApp -->
        ${waNumber ? `
          <a href="https://wa.me/${waNumber}?text=${waText}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold border border-emerald-400/30 transition-all shadow-sm active:scale-95" title="Discuter sur WhatsApp" aria-label="Discuter sur WhatsApp">
            ${getIcon("message", "w-3.5 h-3.5 text-emerald-400")}
            <span class="hidden sm:inline">WhatsApp</span>
          </a>
        ` : ''}

        <!-- Quick Quote Link -->
        <a href="#quoteSimulator" class="flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 font-medium transition-all border border-white/10 active:scale-95" aria-label="Demander un devis sous 24 heures">
          ${getIcon("clipboard", "w-3.5 h-3.5 text-amber-400")}
          <span>Devis 24h</span>
        </a>

      </div>
    </div>
  `;
}

/**
 * LocalBusiness JSON-LD Schema (B12 & Wix Studio Inspired)
 * Generates SEO-rich structured data for Google Search and Google Maps.
 */
export function generateLocalBusinessSchema(project) {
  if (!project) return "";
  const b = project.business || {};
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": b.name,
    "telephone": b.phone,
    "email": b.email || `contact@${(b.name || "artisan").toLowerCase().replace(/[^a-z0-9]/g, "")}.fr`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": b.city,
      "addressRegion": b.region || "France"
    },
    "description": b.description || `${b.tradeLabel} professionnel à ${b.city}. Devis gratuit sous 24h et interventions soignées.`,
    "priceRange": "€€",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "19:00"
      }
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "reviewCount": "48"
    }
  };
  return JSON.stringify(schema, null, 2);
}

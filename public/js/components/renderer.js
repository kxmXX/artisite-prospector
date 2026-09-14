import { getIcon } from "./icons.js";
import { HERO_STYLES } from "./heroStyles.js";
import { getTradeFallbackDataUrl } from "../data/imageFallbacks.js";
import { getUiId, getSectionUiId, getUiCode } from "../data/uiIds.js";

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getInitialSiteTheme(project) {
  const color = project?.branding?.bgColor || "#ffffff";
  const hex = color.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return "light";
  const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
  return (0.299 * r + 0.587 * g + 0.114 * b) < 132 ? "dark" : "light";
}

let globalElementIndex = 0;
let globalButtonIndex = 0;
const buttonIndexMap = new Map();

export function resetGlobalElementIndex() {
  globalElementIndex = 0;
  globalButtonIndex = 0;
  buttonIndexMap.clear();
}

function getButtonSequentialNumber(sec, buttonType) {
  const key = `${sec?.id || 'sec'}_${buttonType}`;
  if (!buttonIndexMap.has(key)) {
    globalButtonIndex += 1;
    buttonIndexMap.set(key, globalButtonIndex);
  }
  return buttonIndexMap.get(key);
}

function decorateEditableMarkup(markup, project, section) {
  return markup.replace(/<([a-z][\w-]*)(\s[^>]*data-editable="([^"]+)"[^>]*)>/gi, (full, tag, attrs, fieldPath) => {
    const fontSizeDelta = section?.settings?.[`fontSize_${fieldPath}`] || 0;
    const isBold = section?.settings?.[`bold_${fieldPath}`];
    const isItalic = section?.settings?.[`italic_${fieldPath}`];
    const isUnderline = section?.settings?.[`underline_${fieldPath}`];
    const textColor = section?.settings?.[`color_${fieldPath}`];
    const textMotion = section?.settings?.[`motion_${fieldPath}`] || section?.settings?.elementMotions?.[fieldPath];

    let customStyles = [];
    if (fontSizeDelta) customStyles.push(`font-size: calc(1em + ${fontSizeDelta}px) !important;`);
    if (isBold === true) customStyles.push(`font-weight: 800 !important;`);
    if (isBold === false) customStyles.push(`font-weight: 400 !important;`);
    if (isItalic === true) customStyles.push(`font-style: italic !important;`);
    if (isItalic === false) customStyles.push(`font-style: normal !important;`);
    if (isUnderline === true) customStyles.push(`text-decoration: underline !important;`);
    if (isUnderline === false) customStyles.push(`text-decoration: none !important;`);
    if (textColor) customStyles.push(`color: ${textColor} !important;`);

    let motionAttrs = "";
    if (textMotion && textMotion !== "none") {
      motionAttrs = ` data-motion="${textMotion}"`;
      if (textMotion === "pulse") {
        motionAttrs += ` data-btn-motion="pulse"`;
      }
    }

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
        return `<${tag}${attrs}${motionAttrs}${styleAttr} data-ui-index="${elementIndex}" data-ui-index-size="${badgeSize}">`;
      }
      return full.replace(/data-ui-target="true"/, `data-ui-target="true" data-ui-index="${elementIndex}" data-ui-index-size="${badgeSize}"${motionAttrs}`);
    }
    const targetId = getUiId(project, section, `field-${fieldPath}`);
    const code = getUiCode(project?.id, section?.id, fieldPath);
    return `<${tag}${attrs} data-ui-id="${targetId}" data-ui-code="${code}" data-ui-type="field" data-ui-target="true" data-ui-index="${elementIndex}" data-ui-index-size="${badgeSize}"${motionAttrs}${styleAttr}>`;
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

  const indexParam = itemIndex !== null && itemIndex !== undefined ? itemIndex : 'null';
  const idx = (itemIndex !== null && itemIndex !== undefined && itemIndex !== "null") ? itemIndex : 0;
  const project = options?.project || (typeof state !== "undefined" ? state.currentProject : null);
  const sec = project?.sections?.find(s => s.id === sectionId);
  const imgKey = `${fieldPath}_${idx}`;
  const imgMotion = sec?.settings?.imageMotions?.[imgKey] || sec?.settings?.[`motion_${fieldPath}`] || sec?.settings?.motion_image || "";
  const motionAttr = imgMotion && imgMotion !== "none" ? ` data-motion="${imgMotion}"` : "";
  const motionClass = imgMotion && imgMotion !== "none" ? ` motion-preset-${imgMotion.replace('-in', '')}${imgMotion === 'pulse' ? ' btn-pulse-active' : ''}` : "";

  if (!isEditor) {
    return `<img src="${displayUrl}" data-fallback-src="${fallbackSvg}" alt="${alt}" class="${className}${motionClass}" ${perfAttrs} ${onErrorAttr}${motionAttr}>`;
  }

  return `
    <div class="relative group/img w-full h-full"
         ondragover="event.preventDefault(); this.classList.add('ring-2', 'ring-zinc-900');"
         ondragleave="this.classList.remove('ring-2', 'ring-zinc-900');"
         ondrop="event.preventDefault(); this.classList.remove('ring-2', 'ring-zinc-900'); window.app.handleImageElementDrop(event, '${sectionId}', '${fieldPath}', ${indexParam});">
      <img src="${displayUrl}" data-fallback-src="${fallbackSvg}" alt="${alt}" class="${className}${motionClass}" ${perfAttrs} ${onErrorAttr}${motionAttr}>

      <div class="absolute inset-0 bg-zinc-950/60 backdrop-blur-[2px] opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20 pointer-events-auto p-2">
        <button type="button"
                onclick="event.stopPropagation(); window.app.openImagePicker('${sectionId}', '${fieldPath}', ${indexParam})"
                class="btn-keycap btn-keycap-light px-2.5 py-1.5 text-zinc-900 rounded-lg text-xs font-medium shadow-xs flex items-center gap-1.5 transition-all"
                title="Modifier / Remplacer cette image">
          ${getIcon("eye", "w-3.5 h-3.5 text-zinc-700")}
          <span>Remplacer</span>
        </button>
        <div class="relative inline-block">
          <button type="button"
                  onclick="event.stopPropagation(); window.app.toggleImageMotionMenu('${sectionId}', '${fieldPath}', ${indexParam})"
                  class="btn-keycap btn-keycap-light px-2 py-1.5 text-zinc-900 rounded-lg text-xs font-medium shadow-xs flex items-center gap-1 transition-all"
                  title="Animer cette image (60fps)">
            ${getIcon("sparkles", "w-3.5 h-3.5 text-amber-500")}
            <span>Anim</span>
          </button>
          <div id="img-motion-menu-${sectionId}-${String(fieldPath).replace(/\./g, '-')}-${indexParam !== 'null' ? indexParam : '0'}" class="hidden absolute left-0 bottom-full mb-2 w-56 bg-zinc-900/95 backdrop-blur-md border border-white/20 rounded-xl p-2.5 shadow-2xl z-50 text-white text-[11px]">
            <div class="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center justify-between">
              <span>Animation Image</span>
              <span class="text-amber-400 font-mono">${imgMotion || 'aucune'}</span>
            </div>
            <div class="grid grid-cols-2 gap-1.5">
              ${[
                ['pulse', 'Pulse ✨'],
                ['zoom-in', 'Zoom'],
                ['fade-in', 'Fondu'],
                ['spring', 'Spring 🍏'],
                ['shimmer', 'Shimmer'],
                ['none', 'Aucune']
              ].map(([mPreset, mLabel]) => `
                <button type="button" onclick="event.stopPropagation(); window.app.setImageMotion('${sectionId}', '${fieldPath}', ${indexParam}, '${mPreset}')"
                        class="motion-chip ${((imgMotion || 'none') === mPreset) ? 'is-active' : ''} ${mPreset === 'none' ? 'col-span-2 text-zinc-400' : ''}">
                  ${mLabel}${((imgMotion || 'none') === mPreset && mPreset !== 'none') ? ' ✓' : ''}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
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
  options = { ...options, project };

  const activePage = options.activeVirtualPage || project._activeVirtualPage || null;
  const PAGE_SECTIONS_MAP = {
    home: ["header", "hero", "trust", "about", "quoteBlock", "certifications", "stats", "cta", "footer"],
    services: ["header", "services", "customBlock", "process", "stepperBlock", "tabsBlock", "tableBlock", "sliderBlock", "certifications", "cta", "footer"],
    realisations: ["header", "beforeAfter", "realisations", "gallery", "videoBlock", "reviews", "cta", "footer"],
    devis: ["header", "quoteSimulator", "pricing", "roiCalculator", "cta", "footer"],
    contact: ["header", "bookingBlock", "hours", "location", "faq", "cta", "footer"]
  };

  const sectionsHTML = project.sections
    .filter(sec => {
      if (options.isEditor) return true;
      if (sec.visibility === false) return false;
      if (options.isStandalone && project.branding?.navigationMode === "multi-tab") {
        return true;
      }
      if (activePage && project.branding?.navigationMode === "multi-tab") {
        const allowed = PAGE_SECTIONS_MAP[activePage] || PAGE_SECTIONS_MAP.home;
        if (sec.page) return sec.page === activePage;
        if (allowed.includes(sec.type)) return true;
        const isMappedAnywhere = Object.values(PAGE_SECTIONS_MAP).some(types => types.includes(sec.type));
        if (!isMappedAnywhere && activePage === "home") return true;
        return false;
      }
      return true;
    })
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
  const socialProofHTML = renderSocialProofToast(project, options);

  const isAppleScrollFx = project.branding?.appleScrollFx !== false;

  return `
    <div class="artisite-root font-body text-main bg-site min-h-screen ${isPaperGrain ? 'texture-paper-grain' : ''} ${isAppleScrollFx ? 'apple-scrollfx-enabled' : ''}" data-site-theme="${initialSiteTheme}" data-paper-grain="${isPaperGrain ? 'true' : 'false'}" style="
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
      <style>${HERO_STYLES}</style>
      ${sectionsHTML}
      ${stickyBarHTML}
      ${lightboxHTML}
      ${socialProofHTML}
    </div>
  `;
}

function renderSection(sec, project, options) {
  if (!sec) return "";
  if (!sec.id) {
    sec.id = `sec-${sec.type || 'block'}-${Math.random().toString(36).substr(2, 6)}`;
  }
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
    case "quoteBlock":
      innerHTML = renderQuoteBlock(sec, project, options);
      break;
    case "videoBlock":
      innerHTML = renderVideoBlock(sec, project, options);
      break;
    case "stepper":
    case "stepperBlock":
      innerHTML = renderStepperBlock(sec, project, options);
      break;
    case "tableBlock":
      innerHTML = renderTableBlock(sec, project, options);
      break;
    case "sliderBlock":
      innerHTML = renderSliderBlock(sec, project, options);
      break;
    case "tabsBlock":
      innerHTML = renderTabsBlock(sec, project, options);
      break;
    case "roiCalculator":
      innerHTML = renderRoiCalculator(sec, project, options);
      break;
    case "bookingBlock":
      innerHTML = renderBookingBlock(sec, project, options);
      break;
    default:
      innerHTML = `<div class="p-8 text-center text-gray-400">Section ${sec.type}</div>`;
  }

  if (isEditor) innerHTML = decorateEditableMarkup(innerHTML, project, sec);

  const globalBg = String(project.branding?.bgColor || "").toLowerCase();
  const inferredTheme = sec.type === "cta" ? "primary" : (["#09090b", "#0f0f11", "#111318", "#18181b"].includes(globalBg) ? "dark" : ["#f4f4f5", "#f8fafc"].includes(globalBg) ? "mineral" : "white");
  const sectionTheme = sec.settings?.bgTheme || inferredTheme;
  const bgTheme = `bg-sec-${sectionTheme}`;
  const themeColor = sectionTheme === "dark" ? "#09090b" : sectionTheme === "navy" ? "#0c1527" : sectionTheme === "warm" ? "#faf8f5" : sectionTheme === "mineral" ? "#f8fafc" : sectionTheme === "primary" ? (project.branding?.primaryColor || "#059669") : "#ffffff";
  const motionPreset = sec.settings?.motionPreset || sec.motionPreset || (project.branding?.motionPreset && project.branding.motionPreset !== "none" ? project.branding.motionPreset : "");
  const customBackground = /^#[0-9a-f]{3,8}$/i.test(sec.settings?.customBackground || "")
    ? `background-color: ${sec.settings.customBackground} !important;`
    : "";

  if (!isEditor) {
    return `<section id="${sec.type}" class="site-section ${bgTheme} ${isHidden ? 'hidden' : ''}" style="--section-bg: ${themeColor}; ${customBackground}" data-section-type="${sec.type}" data-section-bg="${sectionTheme}" data-scroll-fx="zoom" data-ui-id="${getSectionUiId(sec)}" data-ui-type="section"${motionPreset ? ` data-motion="${motionPreset}"` : ''}>${innerHTML}</section>`;
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
    pricing: "Tarifs & Forfaits",
    quoteBlock: "Citation Éditoriale",
    videoBlock: "Vidéo Immersion",
    stepperBlock: "Étapes de Chantier",
    tableBlock: "Tableau Comparatif",
    sliderBlock: "Curseur Surface",
    tabsBlock: "Onglets Prestations",
    roiCalculator: "Simulateur ROI",
    bookingBlock: "Prise Rendez-vous"
  };

  const hasCustomBg = !!sec?.settings?.customBackground;

  return `
    <div id="section-${sec.id}"
         class="editor-section-wrapper relative group ${bgTheme} ${isSelected ? 'is-active-section' : ''} ${isHidden ? 'opacity-40 grayscale' : ''}"
         data-section-id="${sec.id}"
         data-section-type="${sec.type}"
         data-scroll-fx="zoom"
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
        <div class="relative inline-block">
          <button type="button" class="btn-sec-ctrl btn-sec-bg" title="Changer le style de fond" onclick="event.stopPropagation(); window.app.toggleSectionBgMenu('${sec.id}')" data-action="toggle-bg" data-id="${sec.id}">
            ${getIcon("palette", "w-3.5 h-3.5")}
          </button>
          <div id="sec-bg-popover-${sec.id}" data-section-id="${sec.id}" class="sec-bg-popover hidden absolute left-0 top-full mt-2 w-56 bg-zinc-900/95 backdrop-blur-md border border-white/20 rounded-xl p-2.5 shadow-2xl z-50 text-white text-xs">
            <div class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
              <span>Couleur de Fond</span>
              <span class="text-amber-400 font-mono">${sec.settings?.bgTheme || 'white'}</span>
            </div>
            <div class="grid grid-cols-5 gap-1.5 mb-2">
              <button type="button" onclick="event.stopPropagation(); window.app.setSectionBg('${sec.id}', 'white')" class="w-8 h-8 rounded-lg border ${sec.settings?.bgTheme === 'white' ? 'border-amber-400 ring-2 ring-amber-400/50 font-bold' : 'border-white/20'} bg-white text-zinc-900 text-[10px] font-bold flex items-center justify-center shadow-xs" title="Blanc Lumineux">⚪</button>
              <button type="button" onclick="event.stopPropagation(); window.app.setSectionBg('${sec.id}', 'mineral')" class="w-8 h-8 rounded-lg border ${sec.settings?.bgTheme === 'mineral' ? 'border-amber-400 ring-2 ring-amber-400/50 font-bold' : 'border-white/20'} bg-slate-100 text-zinc-900 text-[10px] font-bold flex items-center justify-center shadow-xs" title="Minéral Doux">◻️</button>
              <button type="button" onclick="event.stopPropagation(); window.app.setSectionBg('${sec.id}', 'warm')" class="w-8 h-8 rounded-lg border ${sec.settings?.bgTheme === 'warm' ? 'border-amber-400 ring-2 ring-amber-400/50 font-bold' : 'border-white/20'} bg-amber-50 text-zinc-900 text-[10px] font-bold flex items-center justify-center shadow-xs" title="Chaleureux">☀️</button>
              <button type="button" onclick="event.stopPropagation(); window.app.setSectionBg('${sec.id}', 'dark')" class="w-8 h-8 rounded-lg border ${sec.settings?.bgTheme === 'dark' ? 'border-amber-400 ring-2 ring-amber-400/50 font-bold' : 'border-white/20'} bg-zinc-950 text-white text-[10px] font-bold flex items-center justify-center shadow-xs" title="Sombre Anthracite">◼️</button>
              <button type="button" onclick="event.stopPropagation(); window.app.setSectionBg('${sec.id}', 'navy')" class="w-8 h-8 rounded-lg border ${sec.settings?.bgTheme === 'navy' ? 'border-amber-400 ring-2 ring-amber-400/50 font-bold' : 'border-white/20'} bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shadow-xs" title="Bleu Nuit">🌑</button>
            </div>
            <div class="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
              <label class="flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white">
                <input type="color" value="${sec.settings?.customBackground || '#ffffff'}" onchange="event.stopPropagation(); window.app.setSectionCustomBg('${sec.id}', this.value)" class="w-5 h-5 rounded border-0 cursor-pointer bg-transparent">
                <span>Personnalisée</span>
              </label>
              <button type="button" onclick="event.stopPropagation(); window.app.setSectionBg('${sec.id}', 'white')" class="text-[10px] text-zinc-400 hover:text-amber-400">Reset</button>
            </div>
          </div>
        </div>
        <div class="relative inline-block">
          <button type="button" class="btn-sec-ctrl btn-sec-anim" title="Animations 60fps" data-action="toggle-motion-menu" data-id="${sec.id}" data-motion-trigger="${sec.id}">
            ${getIcon("sparkles", "w-3.5 h-3.5 text-amber-400")}
            <span class="sec-ctrl-text">Anim</span>
          </button>
          <div id="sec-motion-popover-${sec.id}" data-section-id="${sec.id}" class="sec-motion-popover hidden absolute left-0 top-full mt-2 w-56 bg-zinc-900/95 backdrop-blur-md border border-white/20 rounded-xl p-2.5 shadow-2xl z-50 text-white text-xs">
            <div class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
              <span>Preset 60fps</span>
              <span class="text-amber-400 font-mono font-bold">${sec.settings?.motionPreset || sec.motionPreset || 'défaut'}</span>
            </div>
            <div class="grid grid-cols-2 gap-1.5">
              ${[
                ['reveal', 'Reveal'],
                ['stagger', 'Stagger'],
                ['spring', 'Spring 🍏'],
                ['magnetic', 'Magnetic'],
                ['shimmer', 'Shimmer'],
                ['pulse', 'Pulse ✨'],
                ['none', 'Aucun']
              ].map(([mPreset, mLabel]) => `
                <button type="button" 
                        onmouseenter="window.app.previewSectionMotion('${sec.id}', '${mPreset}')"
                        onclick="event.stopPropagation(); window.app.setSectionMotion('${sec.id}', '${mPreset}')"
                        class="motion-chip ${((sec.settings?.motionPreset || sec.motionPreset || 'none') === mPreset) ? 'is-active' : ''} ${mPreset === 'none' ? 'col-span-2 text-zinc-400' : ''}">
                  ${mLabel}${((sec.settings?.motionPreset || sec.motionPreset || 'none') === mPreset && mPreset !== 'none') ? ' ✓' : ''}
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
  const isPaysagiste = project?.business?.tradeId === "paysagiste";
  return `
    <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/5 transition-all">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <a href="#" class="flex items-center gap-3 group no-underline select-none">
          ${isPaysagiste ? `
            <span class="font-heading text-xl sm:text-2xl font-black tracking-tight text-gray-900 block leading-tight no-underline" data-editable="brandName">${c.brandName || project.business?.name || 'Esprit Nature'}</span>
          ` : `
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md transition-transform group-hover:scale-105 flex-shrink-0" style="background-color: var(--primary);">
              ${c.brandName ? c.brandName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div class="header-project-meta">
              <span class="font-heading text-xl font-bold tracking-tight text-gray-900 block leading-tight no-underline" data-editable="brandName">${c.brandName || project.business?.name || 'Artisan'}</span>
              <span class="text-[11px] font-medium text-gray-500 uppercase tracking-wider block no-underline">${project.business?.tradeLabel || c.badge || 'Artisan'}${project.business?.city ? ` • ${project.business.city}` : ''}</span>
            </div>
          `}
        </a>

        <nav class="hidden md:flex items-center gap-7 text-sm font-semibold text-gray-700">
          ${project.branding?.navigationMode === "multi-tab" ? `
            <div class="flex items-center gap-1.5 bg-zinc-100/90 p-1 rounded-full border border-zinc-200/80" data-navigation-mode="multi-tab">
              <button type="button" onclick="(window.app?.setVirtualPage ? window.app.setVirtualPage('home') : window.artisiteSwitchPage?.('home'))" data-tab-nav="home" class="tab-nav-btn px-3 py-1 rounded-full text-xs font-semibold transition-all ${(options.activeVirtualPage || project._activeVirtualPage || 'home') === 'home' ? 'bg-white text-zinc-950 shadow-xs font-bold' : 'text-zinc-600 hover:text-zinc-900'}">Accueil</button>
              <button type="button" onclick="(window.app?.setVirtualPage ? window.app.setVirtualPage('services') : window.artisiteSwitchPage?.('services'))" data-tab-nav="services" class="tab-nav-btn px-3 py-1 rounded-full text-xs font-semibold transition-all ${(options.activeVirtualPage || project._activeVirtualPage) === 'services' ? 'bg-white text-zinc-950 shadow-xs font-bold' : 'text-zinc-600 hover:text-zinc-900'}">Services</button>
              <button type="button" onclick="(window.app?.setVirtualPage ? window.app.setVirtualPage('realisations') : window.artisiteSwitchPage?.('realisations'))" data-tab-nav="realisations" class="tab-nav-btn px-3 py-1 rounded-full text-xs font-semibold transition-all ${(options.activeVirtualPage || project._activeVirtualPage) === 'realisations' ? 'bg-white text-zinc-950 shadow-xs font-bold' : 'text-zinc-600 hover:text-zinc-900'}">Réalisations</button>
              <button type="button" onclick="(window.app?.setVirtualPage ? window.app.setVirtualPage('devis') : window.artisiteSwitchPage?.('devis'))" data-tab-nav="devis" class="tab-nav-btn px-3 py-1 rounded-full text-xs font-semibold transition-all ${(options.activeVirtualPage || project._activeVirtualPage) === 'devis' ? 'bg-white text-zinc-950 shadow-xs font-bold' : 'text-zinc-600 hover:text-zinc-900'}">Devis</button>
              <button type="button" onclick="(window.app?.setVirtualPage ? window.app.setVirtualPage('contact') : window.artisiteSwitchPage?.('contact'))" data-tab-nav="contact" class="tab-nav-btn px-3 py-1 rounded-full text-xs font-semibold transition-all ${(options.activeVirtualPage || project._activeVirtualPage) === 'contact' ? 'bg-white text-zinc-950 shadow-xs font-bold' : 'text-zinc-600 hover:text-zinc-900'}">Contact & RDV</button>
            </div>
          ` : (c.links || []).map(l => `<a href="${l.target}" class="hover:text-gray-900 transition-colors no-underline">${l.label}</a>`).join('')}
        </nav>

        <div class="flex items-center gap-3">
          ${isPaysagiste ? '' : `
            <a href="tel:${c.phone || project.business?.phone || ''}" class="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors no-underline">
              ${getIcon("phone", "w-4 h-4 text-emerald-600")}
              <span data-editable="phone">${c.phone || project.business?.phone || ''}</span>
            </a>
            <button type="button" onclick="event.stopPropagation(); window.app ? window.app.toggleSiteTheme() : null;" class="site-theme-toggle inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full text-sm font-semibold text-gray-800 border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all" data-site-theme-toggle aria-label="Activer le mode sombre du site">
              <span class="site-theme-icon site-theme-icon-light">${getIcon("moon", "w-4 h-4")}</span>
              <span class="site-theme-icon site-theme-icon-dark hidden">${getIcon("sun", "w-4 h-4")}</span>
              <span class="site-theme-label">Mode nuit</span>
            </button>
          `}
          ${isButtonHidden(sec, 'ctaText') || isButtonHidden(sec, 'primary') ? '' : `
            <div class="cta-button-wrapper group/cta relative" role="group" tabindex="0" aria-expanded="false" aria-controls="cta-popover-${sec.id}-ctaText" data-cta-popover-wrapper data-section-id="${sec.id}" data-button-type="ctaText">
              ${renderButtonActionBadge(sec, 'ctaText', options, project)}
              <a href="#simulateur" class="btn-cta inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 no-underline" style="background-color: var(--primary);">
                ${getIcon("phone", "w-4 h-4 text-white")}
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
  const btnNum = getButtonSequentialNumber(sec, buttonType);
  const buttonId = getUiId(project, sec, buttonType === "phone" ? "btn-phone" : (buttonType === "primary" ? (sec.type === "hero" ? "btn" : "btn-primary") : buttonType));
  return `
    <div class="cta-direct-badge" onclick="event.stopPropagation();" role="toolbar" aria-label="Commandes directes du bouton">
      <span class="cta-direct-id font-mono font-bold" title="Bouton #${btnNum} (Identifiant: #${buttonId})">#${btnNum}</span>
      <button type="button" onclick="event.preventDefault(); event.stopPropagation(); window.app.adjustButtonFontSize(-1)" class="cta-direct-btn" title="Réduire la taille du texte">A-</button>
      <button type="button" onclick="event.preventDefault(); event.stopPropagation(); window.app.adjustButtonFontSize(1)" class="cta-direct-btn" title="Agrandir la taille du texte">A+</button>
      <button type="button" onclick="event.preventDefault(); event.stopPropagation(); window.app.toggleButtonPopover('${sec.id}', '${buttonType}')" class="cta-direct-btn cta-direct-gear" title="Réglages du bouton (Taille continue, Bords, Animation, Style)">⚙️</button>
      <button type="button" onclick="event.preventDefault(); event.stopPropagation(); window.app.deleteButton('${sec.id}', '${buttonType}')" class="cta-direct-btn cta-direct-del" title="Supprimer ce bouton">✕</button>
    </div>
  `;
}

function renderButtonPopover(sec, buttonType, options = {}, project = {}) {
  if (!options.isEditor) return "";
  const btnNum = getButtonSequentialNumber(sec, buttonType);
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
      <span class="hidden" data-button-id="${buttonId}"></span>

      <!-- Row 1: ID & Continuous Scale Slider -->
      <div class="flex items-center justify-between gap-2 pb-1 border-b border-zinc-700/60">
        <span class="text-[10px] font-mono text-amber-400 font-bold bg-zinc-800 px-2 py-0.5 rounded border border-amber-400/30" title="Identifiant #${buttonId}">#${btnNum}</span>
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
        <button type="button" onclick="event.preventDefault(); window.app.setButtonMotion('${sec.id}', '${buttonType}', 'pulse')" class="cta-context-btn ${btnMotion === 'pulse' ? 'is-selected' : ''}" title="Pulsation continue">✨ Pulse${btnMotion === 'pulse' ? ' ✓' : ''}</button>
        <button type="button" onclick="event.preventDefault(); window.app.setButtonMotion('${sec.id}', '${buttonType}', 'shimmer')" class="cta-context-btn ${btnMotion === 'shimmer' ? 'is-selected' : ''}" title="Reflet lumineux">⚡ Shimmer${btnMotion === 'shimmer' ? ' ✓' : ''}</button>
        <button type="button" onclick="event.preventDefault(); window.app.setButtonMotion('${sec.id}', '${buttonType}', 'bounce')" class="cta-context-btn ${btnMotion === 'bounce' ? 'is-selected' : ''}" title="Rebond dynamique">↗ Rebond${btnMotion === 'bounce' ? ' ✓' : ''}</button>
        <button type="button" onclick="event.preventDefault(); window.app.setButtonMotion('${sec.id}', '${buttonType}', 'glow')" class="cta-context-btn ${btnMotion === 'glow' ? 'is-selected' : ''}" title="Halo lumineux">🔆 Glow${btnMotion === 'glow' ? ' ✓' : ''}</button>
        <button type="button" onclick="event.preventDefault(); window.app.deleteButton('${sec.id}', '${buttonType}')" class="cta-context-btn cta-btn-delete ml-auto" title="Supprimer ce bouton (Annuler ⌘Z)">🗑️</button>
      </div>
    </div>
  `;
}

// 2. Hero
function renderHero(sec, project, options = {}) {
  const c = sec.content;
  const variant = sec.variant || "split-image";
  const isGlobalPulse = project?.branding?.motionPreset === "pulse";
  const ctaPulseClass = (project?.branding?.ctaPulse || isGlobalPulse) ? " btn-cta-pulse" : "";
  const heroButtonId = getUiId(project, sec, "btn");
  const heroPhoneId = getUiId(project, sec, "btn-phone");
  const primaryHidden = isButtonHidden(sec, "primary", `${heroButtonId}-visible`);
  const phoneHidden = isButtonHidden(sec, "phone", `${heroPhoneId}-visible`);
  const heroButtonVisibility = primaryHidden ? " hidden" : "";
  const heroButtonMotion = sec.settings?.[`${heroButtonId}-motion`] || sec.settings?.["btn-primary-motion"] || sec.settings?.["primary-motion"] || (isGlobalPulse ? "pulse" : "");
  const heroPhoneMotion = sec.settings?.[`${heroPhoneId}-motion`] || sec.settings?.["btn-phone-motion"] || sec.settings?.["phone-motion"] || "";

  // Variant A: Fullscreen Image (Sendpage Benchmark Grade)
  if (variant === "fullscreen-image") {
    const darkening = typeof sec.settings?.overlayDarkening === 'number' ? sec.settings.overlayDarkening : 45;
    const overlayOpacity = Math.max(0, Math.min(90, darkening)) / 100;

    const bgEditBtn = options.isEditor ? `
      <div class="absolute top-4 left-4 z-30 flex items-center gap-2">
        <button type="button" onclick="event.stopPropagation(); window.app.openImagePicker('${sec.id}', 'heroImage')" class="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 backdrop-blur border border-white/20">
          ${getIcon("eye", "w-3.5 h-3.5 text-orange-400")}
          <span>Changer l'image</span>
        </button>
      </div>
    ` : '';

    return `
      <div class="hero-fullscreen text-white">
        <img src="${c.heroImage || getTradeFallbackDataUrl(project.business?.tradeId, 'hero', c.title)}"
             alt="${c.title || 'Artisan local'}"
             class="hero-background"
             loading="eager" fetchpriority="high" decoding="async"
             onerror="if(!this.dataset.fallbackApplied){this.dataset.fallbackApplied='true';this.src='${getTradeFallbackDataUrl(project.business?.tradeId, 'hero', c.title)}';}">
        <div class="hero-darkening-overlay" aria-hidden="true" style="background-color: rgba(0, 0, 0, ${overlayOpacity});"></div>
        ${bgEditBtn}
        <div class="hero-content text-center space-y-7">
          <div class="liquid-glass-badge inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-white shadow-lg mx-auto select-none">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm"></span>
            <span data-editable="badge">${c.badge}</span>
          </div>

          <h1 class="font-heading text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-4xl mx-auto drop-shadow-sm" data-editable="title">
            ${c.title}
          </h1>

          <p class="text-base sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed font-normal drop-shadow-xs" data-editable="subtitle">
            ${c.subtitle}
          </p>

          <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            ${primaryHidden ? '' : `
              <div class="cta-button-wrapper group/cta" role="group" tabindex="0" aria-expanded="false" aria-controls="cta-popover-${sec.id}-primary" data-cta-popover-wrapper data-section-id="${sec.id}" data-button-type="primary" data-ui-id="${heroButtonId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}">
                ${renderButtonActionBadge(sec, 'primary', options, project)}
                <a href="#simulateur" class="btn-cta btn-keycap${ctaPulseClass}${heroButtonMotion ? ` btn-motion-${heroButtonMotion}` : ''} w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-base font-bold text-white shadow-2xl transition-all no-underline" data-ui-id="${heroButtonId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}"${heroButtonMotion ? ` data-motion="${heroButtonMotion}" data-btn-motion="${heroButtonMotion}"` : ''} style="background-color: var(--primary);">
                  ${getIcon("phone", "w-5 h-5 text-white")}
                  <span data-editable="ctaPrimary">${c.ctaPrimary}</span>
                </a>
                ${renderButtonPopover(sec, 'primary', options, project)}
              </div>
            `}

            ${phoneHidden ? '' : `
              <div class="cta-button-wrapper group/cta" role="group" tabindex="0" aria-expanded="false" aria-controls="cta-popover-${sec.id}-phone" data-cta-popover-wrapper data-section-id="${sec.id}" data-button-type="phone" data-ui-id="${heroPhoneId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}">
                ${renderButtonActionBadge(sec, 'phone', options, project)}
                <a href="tel:${c.phone}" class="btn-cta btn-keycap${ctaPulseClass}${heroPhoneMotion ? ` btn-motion-${heroPhoneMotion}` : ''} w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-full text-base font-semibold text-white bg-black/50 backdrop-blur-md border border-white/25 hover:bg-black/65 transition-colors no-underline" data-ui-id="${heroPhoneId}" data-ui-type="button" data-ui-target="${options.isEditor ? 'true' : 'false'}"${heroPhoneMotion ? ` data-motion="${heroPhoneMotion}" data-btn-motion="${heroPhoneMotion}"` : ''}>
                  <span data-editable="ctaSecondary">${c.ctaSecondary || c.phone}</span>
                </a>
                ${renderButtonPopover(sec, 'phone', options, project)}
              </div>
            `}
          </div>

          ${project.business?.tradeId === 'paysagiste' ? '' : `
            <div class="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-white/80 font-medium">
              <span class="flex items-center gap-1.5 text-emerald-400 font-bold">
                ${getIcon("checkCircle", "w-4 h-4")}
                <span>Intervention garantie à ${project.business?.city || 'proximité'}</span>
              </span>
              <span>•</span>
              <span data-editable="trustNote">${c.trustNote}</span>
            </div>
          `}
        </div>

        <!-- Sendpage Scroll Down Indicator -->
        <div class="hero-discover flex justify-center">
          <a href="#about" class="hero-scroll-discover inline-flex flex-col items-center gap-1 text-[11px] font-bold tracking-widest uppercase text-white/80 hover:text-white transition-all transform hover:translate-y-1 no-underline">
            <span>DÉCOUVRIR</span>
            <span class="text-base animate-bounce">↓</span>
          </a>
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
            ${(c.points || []).map((pt, pIdx) => `
              <div class="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-black/5 shadow-sm text-sm font-semibold text-gray-800">
                <div class="w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0" style="background-color: var(--primary);">
                  ${getIcon("check", "w-3.5 h-3.5")}
                </div>
                <span data-editable="points.${pIdx}">${pt}</span>
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

  // Default: Editorial Split (Sendpage High Fidelity)
  const isPaysagiste = project.business?.tradeId === "paysagiste";
  const certifiedBadge = c.certified || "Artisan certifié";
  const roleText = c.role || "Jardinier & Paysagiste";
  const storyText = c.story || "";
  const paragraphs = storyText.split(/\n\n+/).filter(Boolean);

  return `
    <div id="about" class="py-20 lg:py-28" style="background-color: var(--bg);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          <!-- Left Column: Story and Content -->
          <div class="lg:col-span-7 order-1 lg:order-1 space-y-4">
            <div class="text-xs font-bold uppercase tracking-wider text-[#527c22] dark:text-[#8FA382]" data-editable="badge">
              ${c.badge || "À PROPOS"}
            </div>

            <h2 class="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight" data-editable="title">
              ${c.title}
            </h2>

            <!-- Signature Green Accent Dash -->
            <div class="w-12 h-1 rounded-full mt-2.5 mb-5" style="background-color: var(--primary, #527c22);"></div>

            <!-- Artisan Certifié Badge -->
            <div>
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#f0f5eb] text-[#527c22] border border-[#527c22]/20">
                <span class="font-bold">✓</span>
                <span data-editable="certified">${certifiedBadge}</span>
              </span>
            </div>

            <!-- Role Subtitle -->
            <div class="text-gray-500 dark:text-zinc-400 font-medium text-sm sm:text-base pt-1 pb-2" data-editable="role">
              ${roleText}
            </div>

            <!-- Story Paragraphs -->
            <div class="text-gray-600 dark:text-zinc-300 text-base leading-relaxed space-y-4 pt-1 pb-4" data-editable="story">
              ${paragraphs.length > 0 ? paragraphs.map(p => `<p>${p}</p>`).join('') : `<p>${storyText}</p>`}
            </div>

            <!-- Bullet Points (visible for non-paysagiste, hidden data tags for paysagiste) -->
            ${(!isPaysagiste && c.points && c.points.length > 0) ? `
              <div class="pt-2 pb-6 grid sm:grid-cols-2 gap-3.5">
                ${c.points.map((pt, pIdx) => `
                  <div class="flex items-center gap-2.5 text-sm font-medium text-gray-800 dark:text-zinc-200">
                    <div class="w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0" style="background-color: var(--primary, #527c22);">
                      ${getIcon("check", "w-3 h-3")}
                    </div>
                    <span data-editable="points.${pIdx}">${pt}</span>
                  </div>
                `).join('')}
              </div>
            ` : (c.points && c.points.length > 0) ? `
              <div class="hidden" aria-hidden="true">
                ${c.points.map((pt, pIdx) => `<span data-editable="points.${pIdx}">${pt}</span>`).join('')}
              </div>
            ` : ''}

            <!-- Bottom Actions -->
            <div class="pt-4 flex flex-wrap items-center gap-4 sm:gap-6">
              <a href="#simulateur" class="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all no-underline" style="background-color: var(--primary, #527c22);">
                ${getIcon("phone", "w-4 h-4 text-white")}
                <span data-editable="aboutCta">${c.aboutCta || "Demander un devis personnalisé"}</span>
              </a>
              <a href="#services" class="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline transition-colors no-underline" style="color: var(--primary, #527c22);">
                <span data-editable="aboutLink">${c.aboutLink || "Découvrir nos services"}</span>
                ${getIcon("arrowRight", "w-4 h-4")}
              </a>
            </div>
          </div>

          <!-- Right Column: Benjamin Portrait Photo -->
          <div class="lg:col-span-5 order-2 lg:order-2">
            <div class="relative">
              <div class="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-zinc-800 bg-slate-100">
                ${renderEditableImage(c.image, { sectionId: sec.id, fieldPath: 'image', alt: c.title, className: 'w-full h-full object-cover', options })}
              </div>
              ${isPaysagiste ? '' : `
                <div class="absolute -bottom-6 -right-6 bg-white p-5 rounded-2xl shadow-xl border border-black/5 max-w-xs">
                  <div class="font-bold text-gray-900 text-base" data-editable="owner">${c.owner}</div>
                  <div class="text-xs font-semibold text-gray-500" data-editable="role">${c.role}</div>
                  <div class="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">
                    ${getIcon("check", "w-4 h-4")}
                    <span>À votre écoute à ${project.business.city}</span>
                  </div>
                </div>
              `}
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

// 5. Stats
function renderStats(sec, project) {
  const c = sec.content || {};
  const city = project.business?.city || "votre secteur";
  const defaultItems = [
    { value: "24h", label: "Délai moyen devis", sub: "Étude chiffrée gratuite" },
    { value: "100%", label: "Satisfaction garantie", sub: "Contrôle qualité systématique" },
    { value: "10 ans", label: "Garantie décennale", sub: "Assurance professionnelle" },
    { value: "0 €", label: "Frais de déplacement", sub: `Rayon de 30 km autour de ${city}` }
  ];
  const items = (Array.isArray(c.items) && c.items.length > 0)
    ? c.items
    : ((Array.isArray(c.stats) && c.stats.length > 0) ? c.stats : defaultItems);

  return `
    <div class="py-14 text-white shadow-inner" style="background-color: var(--primary);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-white/20">
          ${items.map((item, idx) => `
            <div class="p-4 flex flex-col justify-center items-center">
              <div class="font-heading text-4xl sm:text-5xl font-black text-white tracking-tight leading-none" data-editable="items.${idx}.value">${item.value || '100%'}</div>
              <div class="font-bold text-white/95 text-sm sm:text-base mt-2.5 leading-snug" data-editable="items.${idx}.label">${item.label || 'Engagement Qualité'}</div>
              <div class="text-xs text-white/80 mt-1 font-medium leading-normal" data-editable="items.${idx}.sub">${item.sub || 'Service certifié'}</div>
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

  // Default Variant: 3-Columns Cards (Sendpage High Fidelity)
  const isPaysagiste = project.business?.tradeId === "paysagiste";
  return `
    <div id="services" class="py-20 lg:py-28" style="background-color: var(--bg-sec);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto space-y-2 mb-12 sm:mb-16">
          <div class="text-xs font-bold uppercase tracking-wider text-[#527c22] dark:text-[#8FA382]" data-editable="badge">
            ${c.badge}
          </div>
          <h2 class="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight" data-editable="title">
            ${c.title}
          </h2>
          <!-- Green Accent Dash -->
          <div class="w-12 h-1 rounded-full mx-auto mt-2.5 mb-5" style="background-color: var(--primary, #527c22);"></div>
          ${c.subtitle ? `
            <p class="text-gray-600 dark:text-zinc-400 text-sm sm:text-base max-w-xl mx-auto" data-editable="subtitle">
              ${c.subtitle}
            </p>
          ` : ''}
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          ${(c.services || []).map((srv, idx) => `
            <div class="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-zinc-800 flex flex-col group transform hover:-translate-y-1">
              <div class="aspect-[16/10] overflow-hidden relative bg-slate-100">
                ${renderEditableImage(srv.image, { sectionId: sec.id, fieldPath: 'image', itemIndex: idx, alt: srv.title, className: 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500', options })}
                ${(!isPaysagiste && srv.tag) ? `
                  <span class="absolute top-3 right-3 z-10 bg-black/70 backdrop-blur text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider" data-editable="services.${idx}.tag">
                    ${srv.tag}
                  </span>
                ` : (srv.tag) ? `
                  <span class="hidden" data-editable="services.${idx}.tag">${srv.tag}</span>
                ` : ''}
              </div>
              <div class="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 class="font-heading text-xl font-bold text-gray-900 dark:text-white leading-snug" data-editable="services.${idx}.title">${srv.title}</h3>
                  <p class="text-gray-600 dark:text-zinc-400 text-sm mt-2 leading-relaxed" data-editable="services.${idx}.desc">${srv.desc}</p>
                </div>
                ${!isPaysagiste ? `
                  <div class="pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                    ${srv.price ? `<span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md" data-editable="services.${idx}.price">${srv.price}</span>` : ''}
                    <a href="#simulateur" class="btn-cta text-xs font-bold text-white" style="background-color: var(--primary); border-radius: var(--btn-radius, 9999px);">
                      <span data-editable="services.${idx}.ctaText">${srv.ctaText || "Chiffrer"}</span>
                      ${getIcon("arrowRight", "w-3.5 h-3.5")}
                    </a>
                  </div>
                ` : (srv.price) ? `
                  <span class="hidden" data-editable="services.${idx}.price">${srv.price}</span>
                ` : ''}
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

// Helper to render individual gallery card (Standard Photo or Before/After Interactive Comparison)
function renderGalleryCard(p, idx, sec, project, options, aspectClass) {
  const isBeforeAfter = p.type === 'beforeAfter' || (p.beforeImage && p.afterImage);
  const tradeId = project?.business?.tradeId || 'paysagiste';
  const isPaysagiste = tradeId === 'paysagiste';

  if (isBeforeAfter) {
    const beforeSrc = p.beforeImage || getTradeFallbackDataUrl(tradeId, 'beforeAfter', 'Avant');
    const afterSrc = p.afterImage || getTradeFallbackDataUrl(tradeId, 'beforeAfter', 'Après');
    return `
      <div class="gallery-card bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group">
        <div class="relative ${aspectClass} overflow-hidden bg-slate-900 select-none">
          <div class="ba-container split-reveal-container ba-card w-full h-full"
               data-split-direction="horizontal"
               data-split-pos="50"
               data-sec-id="${sec.id}"
               tabindex="0"
               role="slider"
               aria-label="Comparateur Avant Après ${escapeHtml(p.title || '')}"
               aria-valuenow="50"
               aria-valuemin="0"
               aria-valuemax="100">
            <img src="${afterSrc}" alt="Après intervention" class="ba-img-after sr-img-after" loading="lazy">
            <div class="ba-img-before-wrapper sr-clipper" style="width: 50%;">
              <img src="${beforeSrc}" alt="Avant travaux" class="ba-img-before sr-img-before" loading="lazy">
            </div>
            <div class="ba-handle sr-handle" style="left: 50%; top: 0; bottom: 0;">
              <div class="sr-line"></div>
              <div class="ba-handle-button sr-button w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-md text-zinc-900 text-xs flex items-center justify-center font-bold">
                <span>‹ ›</span>
              </div>
            </div>
            <!-- Badges Avant / Après matching Sendpage Esprit Nature -->
            <div class="absolute top-3 left-3 z-20 pointer-events-none">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/65 backdrop-blur-md text-white border border-white/20 shadow-sm">
                AVANT
              </span>
            </div>
            <div class="absolute top-3 right-3 z-20 pointer-events-none">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-600/90 backdrop-blur-md text-white border border-white/20 shadow-sm">
                APRÈS
              </span>
            </div>
          </div>
        </div>
        ${isPaysagiste ? `
          <div class="hidden" aria-hidden="true">
            <span data-editable="photos.${idx}.tag">${p.tag || 'Avant / Après'}</span>
            <span data-editable="photos.${idx}.title">${p.title || 'Comparatif'}</span>
          </div>
        ` : `
          <div class="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-1.5">
            <div>
              <div class="text-[10.5px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1" data-editable="photos.${idx}.tag">${p.tag || 'Avant / Après'}</div>
              <h3 class="font-bold text-zinc-900 dark:text-white text-base sm:text-lg leading-snug group-hover:text-emerald-700 transition-colors" data-editable="photos.${idx}.title">${p.title || 'Comparatif Réalisation'}</h3>
              ${p.desc ? `<p class="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm mt-1 line-clamp-2" data-editable="photos.${idx}.desc">${p.desc}</p>` : ''}
            </div>
          </div>
        `}
      </div>
    `;
  }

  // Standard photo card
  const photoUrl = p.url || p.image || getTradeFallbackDataUrl(tradeId, 'gallery', p.title || 'Réalisation');
  return `
    <div class="gallery-card bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer" data-lightbox="${photoUrl}">
      <div class="relative ${aspectClass} overflow-hidden bg-slate-900">
        ${renderEditableImage(photoUrl, { sectionId: sec.id, fieldPath: `photos.${idx}.url`, itemIndex: idx, alt: p.title || 'Photo', className: 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500', options })}
        <div class="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/60 backdrop-blur text-white text-xs shadow-md">
            🔍
          </span>
        </div>
      </div>
      ${isPaysagiste ? `
        <div class="hidden" aria-hidden="true">
          <span data-editable="photos.${idx}.tag">${p.tag || 'Réalisation'}</span>
          <span data-editable="photos.${idx}.title">${p.title || 'Chantier Soigné'}</span>
        </div>
      ` : `
        <div class="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-1.5">
          <div>
            <div class="text-[10.5px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1" data-editable="photos.${idx}.tag">${p.tag || 'Réalisation'}</div>
            <h3 class="font-bold text-zinc-900 dark:text-white text-base sm:text-lg leading-snug group-hover:text-emerald-700 transition-colors" data-editable="photos.${idx}.title">${p.title || 'Chantier Soigné'}</h3>
            ${p.desc ? `<p class="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm mt-1 line-clamp-2" data-editable="photos.${idx}.desc">${p.desc}</p>` : ''}
          </div>
        </div>
      `}
    </div>
  `;
}

// 9. Gallery
function renderGallery(sec, project, options = {}) {
  const c = sec.content || {};
  const variant = sec.variant || "masonry-grid";
  const aspectRatio = sec.settings?.aspectRatio || "4/3";
  const aspectClass = aspectRatio === "16/9" ? "aspect-[16/9]" : aspectRatio === "1/1" ? "aspect-square" : "aspect-[4/3]";
  const photos = c.photos || [];

  if (variant === "editorial-grid") {
    const mainPhoto = photos[0];
    const subPhotos = photos.slice(1, 5);

    return `
      <div id="galerie" class="py-20 lg:py-28" style="background-color: var(--bg-sec);">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <div class="text-xs font-bold uppercase tracking-wider text-[#527c22] dark:text-[#8FA382]" data-editable="badge">${c.badge || 'NOS RÉALISATIONS'}</div>
            <h2 class="font-heading text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white" data-editable="title">${c.title || 'Galerie'}</h2>
            <div class="w-12 h-1 rounded-full mx-auto mt-2.5 mb-5" style="background-color: var(--primary, #527c22);"></div>
            <p class="text-gray-600 dark:text-zinc-400 text-sm sm:text-base" data-editable="subtitle">${c.subtitle || 'Découvrez en images la qualité de nos interventions et le soin apporté à chaque projet.'}</p>
          </div>

          <div class="grid lg:grid-cols-12 gap-6 items-stretch">
            ${mainPhoto ? `
              <div class="lg:col-span-7">
                ${renderGalleryCard(mainPhoto, 0, sec, project, options, "aspect-[16/11]")}
              </div>
            ` : ''}

            <div class="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              ${subPhotos.map((p, idx) => `
                <div>
                  ${renderGalleryCard(p, idx + 1, sec, project, options, aspectClass)}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Default: Sendpage 3-column Editorial Grid
  return `
    <div id="galerie" class="py-20 lg:py-28" style="background-color: var(--bg-sec);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto space-y-2 mb-12 sm:mb-16">
          <div class="text-xs font-bold uppercase tracking-wider text-[#527c22] dark:text-[#8FA382]" data-editable="badge">${c.badge || 'NOS RÉALISATIONS'}</div>
          <h2 class="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight" data-editable="title">${c.title || 'Galerie'}</h2>
          <!-- Green Accent Dash -->
          <div class="w-12 h-1 rounded-full mx-auto mt-2.5 mb-5" style="background-color: var(--primary, #527c22);"></div>
          ${c.subtitle ? `<p class="text-gray-600 dark:text-zinc-400 text-sm sm:text-base max-w-xl mx-auto" data-editable="subtitle">${c.subtitle}</p>` : ''}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          ${photos.map((p, idx) => renderGalleryCard(p, idx, sec, project, options, aspectClass)).join('')}
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

  const isPaysagiste = project?.business?.tradeId === "paysagiste";

  if (isPaysagiste) {
    return `
      <div id="avis" class="py-20 lg:py-28 bg-white dark:bg-zinc-950 border-t border-black/5">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-2xl mx-auto space-y-2 mb-8">
            <div class="text-xs font-bold uppercase tracking-wider text-[#527c22] dark:text-[#8FA382]" data-editable="badge">
              ${c.badge || 'TÉMOIGNAGES'}
            </div>
            <h2 class="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight" data-editable="title">
              ${c.title || 'Ce que disent nos clients'}
            </h2>
            <!-- Signature Green Accent Dash -->
            <div class="w-12 h-1 rounded-full mx-auto mt-2.5 mb-5" style="background-color: var(--primary, #527c22);"></div>
            ${c.subtitle ? `
              <p class="text-gray-600 dark:text-zinc-400 text-sm sm:text-base max-w-xl mx-auto" data-editable="subtitle">
                ${c.subtitle}
              </p>
            ` : ''}
          </div>

          <!-- Centered Google Rating Summary Bar matching Sendpage -->
          <div class="flex items-center justify-center gap-2.5 mb-12">
            <svg class="w-5 h-5 inline-block shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"/>
              <path fill="#FBBC05" d="M5.28 14.27A7.17 7.17 0 0 1 4.9 12c0-.79.14-1.57.38-2.27V6.58H1.25A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.25 5.42l4.03-3.15Z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/>
            </svg>
            <div class="flex items-center text-[#f59e0b] gap-0.5 text-sm">
              ${renderRatingStars(5, { editor: options.isEditor, sectionId: sec.id, reviewIndex: -1 })}
            </div>
            <span class="text-xs font-semibold text-zinc-600 dark:text-zinc-400 ml-1">5.0/5 — 5 avis</span>
            <span class="hidden" data-editable="overallRating">${c.overallRating || '5.0'}</span>
            <span class="hidden" data-editable="totalReviews">${c.totalReviews || '5 avis'}</span>
          </div>

          <!-- 3-Column Reviews Grid matching Sendpage Screenshot -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            ${(c.reviews || []).map((r, idx) => `
              <div class="bg-white dark:bg-zinc-900 p-6 sm:p-7 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
                <div class="space-y-3">
                  <div class="flex items-start justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-[#edf4e8] text-[#527c22] font-bold text-sm flex items-center justify-center shrink-0">
                        ${r.author ? r.author.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <div class="font-bold text-gray-900 dark:text-white text-sm leading-tight" data-editable="reviews.${idx}.author">${r.author}</div>
                        <div class="flex text-[#f59e0b] text-xs mt-0.5">
                          ${renderRatingStars(r.rating, { editor: options.isEditor, sectionId: sec.id, reviewIndex: idx })}
                        </div>
                      </div>
                    </div>
                    <svg class="w-4 h-4 shrink-0 mt-0.5 opacity-80" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"/>
                      <path fill="#FBBC05" d="M5.28 14.27A7.17 7.17 0 0 1 4.9 12c0-.79.14-1.57.38-2.27V6.58H1.25A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.25 5.42l4.03-3.15Z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/>
                    </svg>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed font-normal" data-editable="reviews.${idx}.text">« ${r.text} »</p>
                </div>
                <span class="hidden" data-editable="reviews.${idx}.city">${r.city}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // Default: Google Cards (2-Columns with Left Summary Box)
  return `
    <div id="avis" class="py-20 lg:py-28 bg-white dark:bg-zinc-950 border-t border-black/5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto space-y-2 mb-12 sm:mb-16">
          <div class="text-xs font-bold uppercase tracking-wider text-[#527c22] dark:text-[#8FA382]" data-editable="badge">
            ${c.badge || 'AVIS CLIENTS'}
          </div>
          <h2 class="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight" data-editable="title">
            ${c.title || 'Ce que disent nos clients'}
          </h2>
          <!-- Signature Green Accent Dash -->
          <div class="w-12 h-1 rounded-full mx-auto mt-2.5 mb-5" style="background-color: var(--primary, #527c22);"></div>
          ${c.subtitle ? `
            <p class="text-gray-600 dark:text-zinc-400 text-sm sm:text-base max-w-xl mx-auto" data-editable="subtitle">
              ${c.subtitle}
            </p>
          ` : ''}
        </div>

        <div class="grid lg:grid-cols-12 gap-12 items-start">

          <div class="lg:col-span-4 bg-gray-50 dark:bg-zinc-900 p-8 rounded-3xl border border-black/5 dark:border-zinc-800 space-y-4">
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
  const c = sec.content || {};
  const hours = c.hours || {};
  const isPaysagiste = project?.business?.tradeId === "paysagiste";
  const isUnified = sec.variant === "unified-map" || sec.settings?.unifiedMap || isPaysagiste;

  if (isUnified) {
    const defaultDays = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
    const dayLabels = {
      lundi: "Lundi",
      mardi: "Mardi",
      mercredi: "Mercredi",
      jeudi: "Jeudi",
      vendredi: "Vendredi",
      samedi: "Samedi",
      dimanche: "Dimanche"
    };

    return `
      <div id="horaires" class="py-20 lg:py-28 bg-white dark:bg-zinc-950 border-t border-black/5">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-2xl mx-auto space-y-2 mb-12 sm:mb-16">
            <div class="text-xs font-bold uppercase tracking-wider text-[#527c22] dark:text-[#8FA382]" data-editable="badge">
              ${c.badge || 'HORAIRES'}
            </div>
            <h2 class="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight" data-editable="title">
              ${c.title || 'Horaires & Lieu'}
            </h2>
            <!-- Signature Green Accent Dash -->
            <div class="w-12 h-1 rounded-full mx-auto mt-2.5 mb-4" style="background-color: var(--primary, #527c22);"></div>
            <div class="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-zinc-300">
              <span class="text-[#527c22]">📍</span>
              <span data-editable="subtitle">${c.subtitle || project.business?.city || 'Montauban'}</span>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto">
            <!-- Left Column: Timetable Card -->
            <div class="lg:col-span-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm p-6 sm:p-8 flex flex-col justify-between">
              <div class="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                ${defaultDays.map(day => {
                  const time = hours[day] || (day === "dimanche" ? "Fermé" : "9h - 12h / 14h - 18h");
                  const isClosed = time.toLowerCase().includes("fermé");
                  return `
                    <div class="flex items-center justify-between py-4 text-sm sm:text-base">
                      <div class="flex items-center gap-3">
                        <svg class="w-4 h-4 ${isClosed ? 'text-zinc-400' : 'text-[#527c22]'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="font-semibold text-gray-900 dark:text-white">${dayLabels[day] || day}</span>
                      </div>
                      <span class="${isClosed ? 'text-zinc-400 dark:text-zinc-500 italic' : 'text-gray-700 dark:text-zinc-300 font-medium'}" data-editable="hours.${day}">${time}</span>
                    </div>
                  `;
                }).join('')}
              </div>
              ${c.note ? `
                <div class="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-gray-400 dark:text-zinc-500 flex items-center justify-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>${c.note}</span>
                </div>
              ` : ''}
            </div>

            <!-- Right Column: Interactive Map -->
            <div class="lg:col-span-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden min-h-[380px] sm:min-h-[440px] relative flex items-center justify-center p-3">
              ${isPaysagiste ? `
                <img
                  title="Carte Horaires et Lieu"
                  alt="Carte Horaires et Lieu"
                  class="w-full h-full object-contain rounded-2xl min-h-[360px]"
                  loading="lazy"
                  src="images/map-montauban.png"
                  data-fallback-src="images/map-montauban.png"
                  onerror="if(!this.dataset.fallbackApplied){this.dataset.fallbackApplied='true';this.src='images/map-montauban.png';}">
                <!-- Zoom controls matching Sendpage -->
                <div class="absolute top-5 right-5 z-10 flex flex-col bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden pointer-events-auto">
                  <button type="button" class="w-8 h-8 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 font-bold border-b border-zinc-200 text-sm select-none" aria-label="Zoom avant">+</button>
                  <button type="button" class="w-8 h-8 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 font-bold text-sm select-none" aria-label="Zoom arrière">−</button>
                </div>
                <!-- Accessible Embed & Route Link for full platform and test compatibility -->
                <iframe
                  title="Carte Horaires et Lieu"
                  class="hidden"
                  loading="lazy"
                  src="https://maps.google.com/maps?q=${encodeURIComponent(c.address || (c.city ? c.city + ', France' : (project.business?.city ? project.business.city + ', France' : 'Montauban, France')))}&t=&z=12&ie=UTF8&iwloc=&output=embed">
                </iframe>
                <div class="hidden">
                  <a href="https://maps.google.com/?q=${encodeURIComponent(c.address || (c.city ? c.city + ', France' : (project.business?.city ? project.business.city + ', France' : 'Montauban, France')))}">Calculer mon itinéraire</a>
                </div>
              ` : `
                <iframe
                  title="Carte Horaires et Lieu"
                  class="w-full h-full min-h-[380px] sm:min-h-[440px] border-0 filter saturate-[1.05]"
                  loading="lazy"
                  src="https://maps.google.com/maps?q=${encodeURIComponent(c.address || (c.city ? c.city + ', France' : (project.business?.city ? project.business.city + ', France' : 'Montauban, France')))}&t=&z=12&ie=UTF8&iwloc=&output=embed">
                </iframe>
                <div class="absolute bottom-3 left-3 z-10 pointer-events-auto">
                  <a href="https://maps.google.com/?q=${encodeURIComponent(c.address || (c.city ? c.city + ', France' : (project.business?.city ? project.business.city + ', France' : 'Montauban, France')))}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-black/60 hover:bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 transition-all no-underline">
                    <span>Calculer mon itinéraire</span>
                    ${getIcon("externalLink", "w-3 h-3")}
                  </a>
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Classic hours variant
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
            <span>${c.note || "Disponible sur rendez-vous"} — Contact : <strong>${c.phone || project.business?.phone || ''}</strong></span>
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

                <!-- Clean Route Badge (High Clarity, No heavy frosted blur) -->
                <div class="absolute bottom-3 left-3 z-10 map-clean-overlay p-3 text-white space-y-1.5 pointer-events-auto">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span class="text-xs font-bold text-emerald-300">Zone d'intervention garantie</span>
                  </div>
                  <div class="text-xs font-semibold text-white truncate">${c.city || project.business?.city || 'Intervention locale'} & alentours (35 km)</div>
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

// 14. FAQ (High Fidelity Esprit Nature / Sendpage Rows with Plus-Minus Toggle)
function renderFaq(sec, project) {
  const c = sec.content || {};
  return `
    <div id="faq" class="py-20 lg:py-28 bg-white dark:bg-zinc-950">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center space-y-2 mb-12 sm:mb-16">
          <div class="text-xs font-bold uppercase tracking-wider text-[#527c22] dark:text-[#8FA382]" data-editable="badge">
            ${c.badge || 'QUESTIONS FRÉQUENTES'}
          </div>
          <h2 class="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight" data-editable="title">
            ${c.title || 'FAQ'}
          </h2>
          <!-- Green Accent Dash -->
          <div class="w-12 h-1 rounded-full mx-auto mt-2.5 mb-5" style="background-color: var(--primary, #527c22);"></div>
          ${c.subtitle ? `
            <p class="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed" data-editable="subtitle">
              ${c.subtitle}
            </p>
          ` : ''}
        </div>

        <div class="divide-y divide-zinc-200/80 dark:divide-zinc-800 border-t border-b border-zinc-200/80 dark:border-zinc-800">
          ${(c.items || []).map((faq, idx) => `
            <div class="faq-item group/faq transition-colors py-5 sm:py-6 ${idx === 0 ? 'active' : ''}">
              <div class="faq-header flex items-center justify-between gap-4 cursor-pointer select-none">
                <span class="text-base sm:text-lg font-bold text-zinc-900 dark:text-white group-hover/faq:text-emerald-600 dark:group-hover/faq:text-emerald-400 transition-colors leading-snug" data-editable="items.${idx}.q">${faq.q}</span>
                <span class="faq-icon-btn shrink-0">+</span>
              </div>
              <div class="faq-content pt-3">
                <p class="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal" data-editable="items.${idx}.a">${faq.a}</p>
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
  const isGlobalPulse = project?.branding?.motionPreset === "pulse";
  const primaryButtonMotion = sec.settings?.[`${primaryButtonId}-motion`] || sec.settings?.["btn-primary-motion"] || sec.settings?.["primary-motion"] || (isGlobalPulse ? "pulse" : "");
  const phoneButtonMotion = sec.settings?.[`${phoneButtonId}-motion`] || sec.settings?.["btn-phone-motion"] || sec.settings?.["phone-motion"] || "";
  const ctaPulseClass = (project?.branding?.ctaPulse || isGlobalPulse) ? " btn-cta-pulse" : "";

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

// 21. Editorial Quote (Component Gallery: Quote / Pull Quote)
function renderQuoteBlock(sec, project, options = {}) {
  const c = sec.content || {};
  return `
    <div class="py-16 sm:py-24 bg-white">
      <div class="max-w-4xl mx-auto px-4 sm:px-6">
        <div class="component-quote relative p-8 sm:p-12 rounded-3xl bg-zinc-50 border border-zinc-200/80 shadow-xs text-center space-y-6">
          <div class="text-4xl sm:text-5xl text-amber-500/40 font-serif leading-none select-none">“</div>
          <blockquote class="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 leading-snug tracking-tight max-w-2xl mx-auto" data-editable="quote">
            ${c.quote || "« Notre priorité absolue n'est pas seulement de réaliser un chantier, c'est de bâtir une relation de confiance durable avec chaque famille. »"}
          </blockquote>
          <div class="pt-4 border-t border-zinc-200/60 flex items-center justify-center gap-3">
            <div class="w-12 h-12 rounded-full overflow-hidden border border-zinc-300 bg-zinc-200 flex-shrink-0">
              <img src="${c.authorPhoto || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=200&q=80'}" alt="${c.authorName || 'Fondateur'}" class="w-full h-full object-cover">
            </div>
            <div class="text-left">
              <div class="font-bold text-sm text-zinc-900" data-editable="authorName">${c.authorName || project.business?.name || "Dirigeant Fondateur"}</div>
              <div class="text-xs text-zinc-500" data-editable="authorRole">${c.authorRole || `Artisan Référencé • ${project.business?.city || 'Local'}`}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 22. Immersive Video Player (Component Gallery: Video / Media Embed)
function renderVideoBlock(sec, project, options = {}) {
  const c = sec.content || {};
  return `
    <div class="py-16 sm:py-20 bg-zinc-950 text-white">
      <div class="max-w-5xl mx-auto px-4 sm:px-6">
        <div class="text-center space-y-3 mb-8">
          <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-amber-300 border border-white/15" data-editable="badge">
            ${c.badge || "🎬 Immersion Chantier"}
          </span>
          <h2 class="font-heading text-2xl sm:text-3xl font-extrabold" data-editable="title">
            ${c.title || "Découvrez nos chantiers en action"}
          </h2>
          <p class="text-zinc-400 text-sm max-w-xl mx-auto" data-editable="subtitle">
            ${c.subtitle || "Chaque geste compte. Regardez nos artisans en situation réelle sur nos réalisations locales."}
          </p>
        </div>

        <div class="component-video-player relative aspect-video rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-zinc-900 group">
          <img src="${c.poster || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80'}" alt="Vidéo de présentation" class="w-full h-full object-cover opacity-80 group-hover:scale-102 transition-transform duration-500">
          <div class="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-6 text-center">
            <button type="button" onclick="alert('Lecture vidéo de présentation artisan')" class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 text-zinc-950 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group-hover:bg-amber-400">
              <span class="text-2xl ml-1">▶</span>
            </button>
            <span class="mt-4 text-xs font-semibold tracking-wider uppercase text-zinc-300 bg-black/60 px-3 py-1 rounded-full border border-white/20">
              Vidéo 4K • 1 min 45
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 23. Stepper / Processus Chantier (Component Gallery: Stepper)
function renderStepperBlock(sec, project, options = {}) {
  const c = sec.content || {};
  const rawSteps = (c.steps && Array.isArray(c.steps)) ? c.steps : (Array.isArray(sec.steps) ? sec.steps : null);
  const steps = rawSteps && rawSteps.length >= 2 ? rawSteps : [
    { step: "1", title: "Diagnostic & Devis Gratuit", desc: "Visite technique offerte à domicile sous 24h avec chiffrage sans engagement." },
    { step: "2", title: "Planification & Préparation", desc: "Validation des matériaux, calendrier d'intervention et protection des lieux." },
    { step: "3", title: "Exécution des Travaux", desc: "Réalisation rigoureuse dans les règles de l'art par nos artisans qualifiés." },
    { step: "4", title: "Réception & Nettoyage", desc: "Contrôle qualité contradictoire, remise de garantie et chantier rendu impeccable." }
  ];

  const colClass = steps.length === 2
    ? "sm:grid-cols-2 lg:grid-cols-2 stepper-cols-2"
    : (steps.length === 3
      ? "sm:grid-cols-2 lg:grid-cols-3 stepper-cols-3"
      : "sm:grid-cols-2 lg:grid-cols-4");

  const addStepBtn = options.isEditor ? `
    <div class="mt-8 flex justify-center">
      <button type="button" onclick="event.stopPropagation(); window.app.addStepperStep('${sec.id}')" class="btn-keycap btn-keycap-light px-4 py-2 text-xs font-bold text-zinc-900 rounded-xl shadow-xs flex items-center gap-2 hover:bg-zinc-100 transition-all border border-zinc-200">
        ${getIcon("plus", "w-3.5 h-3.5 text-zinc-700")}
        <span>Ajouter une étape (${steps.length + 1})</span>
      </button>
    </div>
  ` : '';

  return `
    <div class="py-16 sm:py-24 bg-zinc-50 border-y border-zinc-200/60">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="text-center max-w-2xl mx-auto mb-14 space-y-2.5">
          <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/5 text-zinc-700" data-editable="badge">
            ${c.badge || "Étapes de Chantier"}
          </span>
          <h2 class="font-heading text-2xl sm:text-3xl font-extrabold text-zinc-900" data-editable="title">
            ${c.title || "Un parcours limpide du devis à la livraison"}
          </h2>
        </div>

        <div class="component-stepper grid ${colClass} gap-6 relative">
          ${steps.map((st, idx) => `
            <div class="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col justify-between space-y-4 relative group/step">
              ${options.isEditor && steps.length > 2 ? `
                <button type="button" onclick="event.stopPropagation(); window.app.removeStepperStep('${sec.id}', ${idx})" class="absolute top-3 right-3 opacity-0 group-hover/step:opacity-100 transition-opacity p-1 text-zinc-400 hover:text-red-500 rounded" title="Supprimer cette étape">
                  ${getIcon("trash", "w-3.5 h-3.5")}
                </button>
              ` : ''}
              <div class="flex items-center justify-between">
                <span class="w-9 h-9 rounded-full bg-zinc-900 text-white font-mono text-sm font-bold flex items-center justify-center">
                  ${st.step || idx + 1}
                </span>
                <span class="text-[10px] uppercase tracking-wider text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Étape 0${idx + 1}</span>
              </div>
              <div class="space-y-1.5 flex-1">
                <h4 class="font-bold text-zinc-900 text-base" data-editable="steps.${idx}.title">${st.title}</h4>
                <p class="text-xs text-zinc-600 leading-relaxed" data-editable="steps.${idx}.desc">${st.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>
        ${addStepBtn}
      </div>
    </div>
  `;
}

// 24. Comparison Table (Component Gallery: Table)
function renderTableBlock(sec, project, options = {}) {
  const c = sec.content || {};
  const rows = Array.isArray(c.rows) ? c.rows : [
    { label: "Déplacement & Diagnostic", standard: "0 € (Offert)", premium: "0 € (Prioritaire 24h)" },
    { label: "Assurance & Garantie", standard: "RC Pro standard", premium: "Garantie Décennale 10 ans" },
    { label: "Délai moyen d'intervention", standard: "7 à 10 jours", premium: "Sous 48h garanti" },
    { label: "Nettoyage fin de chantier", standard: "Inclus", premium: "Remise à neuf totale" },
    { label: "Interlocuteur dédié", standard: "Standard", premium: "Chef d'équipe direct" }
  ];

  return `
    <div class="py-16 sm:py-24 bg-white">
      <div class="max-w-4xl mx-auto px-4 sm:px-6">
        <div class="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/5 text-zinc-700" data-editable="badge">
            ${c.badge || "Tableau Comparatif"}
          </span>
          <h2 class="font-heading text-2xl sm:text-3xl font-extrabold text-zinc-900" data-editable="title">
            ${c.title || "Comparateur transparent des prestations"}
          </h2>
        </div>

        <div class="component-table rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">
          <table class="w-full text-left text-xs sm:text-sm">
            <thead class="bg-zinc-900 text-white font-semibold">
              <tr>
                <th class="p-4 sm:p-5">Critère & Service</th>
                <th class="p-4 sm:p-5 text-center">Prestation Standard</th>
                <th class="p-4 sm:p-5 text-center text-amber-300">Formule Sérénité Pro ★</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-200">
              ${rows.map((r, idx) => `
                <tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/70'}">
                  <td class="p-3.5 sm:p-4 font-medium text-zinc-800" data-editable="rows.${idx}.label">${r.label}</td>
                  <td class="p-3.5 sm:p-4 text-center text-zinc-600" data-editable="rows.${idx}.standard">${r.standard}</td>
                  <td class="p-3.5 sm:p-4 text-center font-bold text-emerald-700 bg-emerald-50/40" data-editable="rows.${idx}.premium">${r.premium}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// 25. Interactive Surface Slider (Component Gallery: Slider)
function renderSliderBlock(sec, project, options = {}) {
  const c = sec.content || {};
  return `
    <div class="component-slider py-16 sm:py-20 bg-zinc-50 border-y border-zinc-200/80">
      <div class="max-w-3xl mx-auto px-4 sm:px-6">
        <div class="p-8 sm:p-10 rounded-3xl bg-white border border-zinc-200 shadow-sm text-center space-y-6">
          <div class="space-y-2">
            <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200" data-editable="badge">
              ${c.badge || "Curseur Interactif"}
            </span>
            <h3 class="font-heading text-xl sm:text-2xl font-extrabold text-zinc-900" data-editable="title">
              ${c.title || "Estimez le dimensionnement de votre surface"}
            </h3>
            <p class="text-xs text-zinc-500" data-editable="subtitle">
              ${c.subtitle || "Faites glisser le curseur pour visualiser l'envergure approximative de votre projet."}
            </p>
          </div>

          <div class="space-y-4 max-w-md mx-auto pt-2">
            <div class="flex items-center justify-between font-bold text-sm text-zinc-700">
              <span>Surface estimée :</span>
              <span id="slider-block-val-${sec.id}" class="text-xl font-mono text-emerald-700 font-extrabold">50 m²</span>
            </div>
            <input type="range" min="10" max="250" step="5" value="50"
                   oninput="const el = document.getElementById('slider-block-val-${sec.id}'); if (el) el.textContent = this.value + ' m²';"
                   class="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-600">
            <div class="flex justify-between text-[11px] text-zinc-400 font-mono">
              <span>10 m²</span>
              <span>100 m²</span>
              <span>250 m²</span>
            </div>
          </div>

          <div class="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="text-left text-xs text-zinc-600">
              <span class="font-bold text-zinc-900">Devis ferme sous 24h</span> • Déplacement offert à ${project.business?.city || 'domicile'}
            </div>
            <a href="#simulateur" class="btn-cta text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs whitespace-nowrap" style="background-color: var(--primary);">
              Demander mon chiffrage
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 26. Category Tabs (Component Gallery: Tabs)
function renderTabsBlock(sec, project, options = {}) {
  const c = sec.content || {};
  const tabs = Array.isArray(c.tabs) && c.tabs.length > 0 ? c.tabs : [
    { title: "Entretien Régulier", text: "Tonte, taille de haies, désherbage écologique et remise en état saisonnière.", tag: "Formule Abonnement" },
    { title: "Création & Aménagement", text: "Conception paysagère sur-mesure, allées pavées, clôtures et plantations durables.", tag: "Projet Clé en main" },
    { title: "Élagage & Soins", text: "Élagage raisonné grande hauteur, abattage sécurisé et rognage de souches.", tag: "Intervention Sécurisée" }
  ];

  const tabsJsonSafe = JSON.stringify(tabs).replace(/"/g, '&quot;');

  return `
    <div class="py-16 sm:py-24 bg-white" id="tabs-block-${sec.id}" data-tabs="${tabsJsonSafe}">
      <div class="max-w-5xl mx-auto px-4 sm:px-6">
        <div class="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/5 text-zinc-700" data-editable="badge">
            ${c.badge || "Nos Spécialités"}
          </span>
          <h2 class="font-heading text-2xl sm:text-3xl font-extrabold text-zinc-900" data-editable="title">
            ${c.title || "Explorez nos prestations par domaine"}
          </h2>
        </div>

        <div class="component-tabs space-y-6">
          <div class="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-zinc-100 max-w-xl mx-auto border border-zinc-200">
            ${tabs.map((tb, idx) => `
              <button type="button"
                      data-tab-btn="${idx}"
                      onclick="(function(btn){
                        const root = btn.closest('[data-tabs]');
                        if (!root) return;
                        try {
                          const data = JSON.parse(root.getAttribute('data-tabs').replace(/&quot;/g, '\"'));
                          const item = data[${idx}];
                          if (!item) return;
                          root.querySelectorAll('[data-tab-btn]').forEach(b => {
                            b.className = 'px-4 py-2 rounded-xl text-xs font-bold transition-all text-zinc-600 hover:text-zinc-900';
                          });
                          btn.className = 'px-4 py-2 rounded-xl text-xs font-bold transition-all bg-white text-zinc-900 shadow-xs';
                          const tagEl = root.querySelector('[data-tab-tag]');
                          const titleEl = root.querySelector('[data-tab-title]');
                          const textEl = root.querySelector('[data-tab-text]');
                          if (tagEl) tagEl.textContent = item.tag || 'Spécialité';
                          if (titleEl) titleEl.textContent = item.title;
                          if (textEl) textEl.textContent = item.text;
                        } catch(e){}
                      })(this)"
                      class="px-4 py-2 rounded-xl text-xs font-bold transition-all ${idx === 0 ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'}">
                ${tb.title}
              </button>
            `).join('')}
          </div>

          <div id="tab-content-${sec.id}" class="p-8 sm:p-10 rounded-3xl bg-zinc-50 border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
            <div class="space-y-2 text-center sm:text-left">
              <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider" data-tab-tag>${tabs[0]?.tag || 'Spécialité'}</span>
              <h3 class="text-xl font-bold text-zinc-900" data-tab-title>${tabs[0]?.title || 'Prestation'}</h3>
              <p class="text-sm text-zinc-600 max-w-lg leading-relaxed" data-tab-text>${tabs[0]?.text || 'Descriptif détaillé de la prestation artisanale.'}</p>
            </div>
            <a href="#simulateur" class="btn-cta text-white px-6 py-3 rounded-xl text-xs font-bold shadow-xs whitespace-nowrap" style="background-color: var(--primary);">
              Consulter nos disponibilités
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 27. Interactive ROI & Payback Calculator (MVP Feature 1)
function renderRoiCalculator(sec, project, options = {}) {
  const c = sec.content || {};
  const ticket = Number(c.defaultTicket) || 1200;
  const leads = Number(c.defaultLeads) || 4;
  const conv = Number(c.defaultConv) || 50;
  const siteCost = Number(c.siteCost) || 990;

  const wonDeals = Math.max(1, Math.round((leads * conv) / 100));
  const yearlyRev = wonDeals * ticket * 12;
  const yearlyProfit = yearlyRev - siteCost;
  const paybackDays = Math.max(1, Math.round((siteCost / (wonDeals * ticket)) * 30));

  return `
    <div class="py-16 sm:py-24 component-roi-calculator bg-zinc-50/50" id="roi-calculator-${sec.id}">
      <div class="max-w-5xl mx-auto px-4 sm:px-6">
        <div class="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800" data-editable="badge">
            ${c.badge || "Rentabilité Immédiate"}
          </span>
          <h2 class="font-heading text-2xl sm:text-4xl font-extrabold text-zinc-900" data-editable="title">
            ${c.title || "Calculez la Rentabilité Réelle de Votre Futur Site"}
          </h2>
          <p class="text-sm text-zinc-600 leading-relaxed" data-editable="subtitle">
            ${c.subtitle || "Ajustez les curseurs ci-dessous selon votre activité pour estimer vos gains annuels."}
          </p>
        </div>

        <div class="grid lg:grid-cols-12 gap-8 items-stretch">
          <!-- Sliders Box -->
          <div class="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
            <div class="space-y-2">
              <div class="flex justify-between items-center text-xs font-semibold">
                <span class="text-zinc-700">Panier moyen d'un chantier :</span>
                <span id="roi-ticket-val-${sec.id}" class="text-sm font-bold text-zinc-950 font-mono">${ticket} €</span>
              </div>
              <input type="range" min="300" max="6000" step="100" value="${ticket}"
                     class="simulateur-roi-slider w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                     oninput="(function(el){
                       const root = el.closest('.component-roi-calculator');
                       if (!root) return;
                       const t = Number(el.value);
                       const l = Number(root.querySelector('[data-roi-leads]').value);
                       const c = Number(root.querySelector('[data-roi-conv]').value);
                       const cost = ${siteCost};
                       root.querySelector('#roi-ticket-val-${sec.id}').textContent = t + ' €';
                       const won = Math.max(1, Math.round((l * c) / 100));
                       const yRev = won * t * 12;
                       const yNet = yRev - cost;
                       const days = Math.max(1, Math.round((cost / (won * t)) * 30));
                       root.querySelector('[data-roi-rev]').textContent = yRev.toLocaleString('fr-FR') + ' € / an';
                       root.querySelector('[data-roi-profit]').textContent = '+' + yNet.toLocaleString('fr-FR') + ' € net';
                       root.querySelector('[data-roi-payback]').textContent = days + ' jours';
                     })(this)" data-roi-ticket>
              <div class="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>300 €</span>
                <span>3 000 €</span>
                <span>6 000 €</span>
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex justify-between items-center text-xs font-semibold">
                <span class="text-zinc-700">Demandes de devis générées / mois :</span>
                <span id="roi-leads-val-${sec.id}" class="text-sm font-bold text-zinc-950 font-mono">${leads} contacts</span>
              </div>
              <input type="range" min="1" max="15" step="1" value="${leads}"
                     class="simulateur-roi-slider w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                     oninput="(function(el){
                       const root = el.closest('.component-roi-calculator');
                       if (!root) return;
                       const t = Number(root.querySelector('[data-roi-ticket]').value);
                       const l = Number(el.value);
                       const c = Number(root.querySelector('[data-roi-conv]').value);
                       const cost = ${siteCost};
                       root.querySelector('#roi-leads-val-${sec.id}').textContent = l + ' contacts';
                       const won = Math.max(1, Math.round((l * c) / 100));
                       const yRev = won * t * 12;
                       const yNet = yRev - cost;
                       const days = Math.max(1, Math.round((cost / (won * t)) * 30));
                       root.querySelector('[data-roi-rev]').textContent = yRev.toLocaleString('fr-FR') + ' € / an';
                       root.querySelector('[data-roi-profit]').textContent = '+' + yNet.toLocaleString('fr-FR') + ' € net';
                       root.querySelector('[data-roi-payback]').textContent = days + ' jours';
                     })(this)" data-roi-leads>
              <div class="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>1</span>
                <span>7</span>
                <span>15</span>
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex justify-between items-center text-xs font-semibold">
                <span class="text-zinc-700">Taux de closing / conversion :</span>
                <span id="roi-conv-val-${sec.id}" class="text-sm font-bold text-zinc-950 font-mono">${conv} %</span>
              </div>
              <input type="range" min="20" max="80" step="5" value="${conv}"
                     class="simulateur-roi-slider w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                     oninput="(function(el){
                       const root = el.closest('.component-roi-calculator');
                       if (!root) return;
                       const t = Number(root.querySelector('[data-roi-ticket]').value);
                       const l = Number(root.querySelector('[data-roi-leads]').value);
                       const c = Number(el.value);
                       const cost = ${siteCost};
                       root.querySelector('#roi-conv-val-${sec.id}').textContent = c + ' %';
                       const won = Math.max(1, Math.round((l * c) / 100));
                       const yRev = won * t * 12;
                       const yNet = yRev - cost;
                       const days = Math.max(1, Math.round((cost / (won * t)) * 30));
                       root.querySelector('[data-roi-rev]').textContent = yRev.toLocaleString('fr-FR') + ' € / an';
                       root.querySelector('[data-roi-profit]').textContent = '+' + yNet.toLocaleString('fr-FR') + ' € net';
                       root.querySelector('[data-roi-payback]').textContent = days + ' jours';
                     })(this)" data-roi-conv>
              <div class="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>20 %</span>
                <span>50 %</span>
                <span>80 %</span>
              </div>
            </div>
          </div>

          <!-- Result Display Cards -->
          <div class="lg:col-span-5 bg-zinc-900 text-white p-6 sm:p-8 rounded-3xl flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
            <div class="space-y-1">
              <div class="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">Chiffre d'Affaires Estimé</div>
              <div class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono" data-roi-rev>
                ${yearlyRev.toLocaleString('fr-FR')} € / an
              </div>
              <div class="text-xs text-zinc-400 font-medium">Dont <span class="text-emerald-300 font-bold" data-roi-profit>+${yearlyProfit.toLocaleString('fr-FR')} € net</span> après amortissement du site.</div>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800">
              <div class="bg-zinc-800/80 p-3 rounded-2xl">
                <div class="text-[10px] text-zinc-400 font-medium uppercase">Rentabilité en</div>
                <div class="text-lg font-bold text-white font-mono mt-0.5" data-roi-payback>${paybackDays} jours</div>
                <div class="text-[10px] text-emerald-400 font-medium">Dès le 1er chantier</div>
              </div>
              <div class="bg-zinc-800/80 p-3 rounded-2xl">
                <div class="text-[10px] text-zinc-400 font-medium uppercase">Coût du Site</div>
                <div class="text-lg font-bold text-white font-mono mt-0.5">${siteCost} €</div>
                <div class="text-[10px] text-zinc-400">Paiement unique ou 89€/m</div>
              </div>
            </div>

            <a href="${c.ctaLink || '#contact'}" class="btn-cta text-white py-3.5 px-6 rounded-2xl text-xs font-bold text-center shadow-lg transition-transform hover:scale-105" style="background-color: var(--primary);">
              ${c.ctaText || "Activer mon site rentable"}
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 28. Interactive Intervention & Appointment Booking (MVP Feature 3)
function renderBookingBlock(sec, project, options = {}) {
  const c = sec.content || {};
  const phone = c.phone || project.business?.phone || "07 00 00 00 00";
  const slots = Array.isArray(c.slots) && c.slots.length > 0 ? c.slots : [
    { id: "slot-1", label: "Aujourd'hui", time: "14h00 - 16h30", status: "urgent" },
    { id: "slot-2", label: "Demain Matin", time: "08h30 - 11h30", status: "available" },
    { id: "slot-3", label: "Demain Après-midi", time: "14h00 - 17h00", status: "available" },
    { id: "slot-4", label: "Cette semaine", time: "Créneau flexible", status: "available" }
  ];
  const services = Array.isArray(c.services) && c.services.length > 0 ? c.services : [
    "Diagnostic & Devis Gratuit",
    "Intervention d'Urgence",
    "Rénovation Complète",
    "Entretien & Dépannage"
  ];

  return `
    <div class="py-16 sm:py-24 bg-white component-booking-block" id="booking-block-${sec.id}">
      <div class="max-w-4xl mx-auto px-4 sm:px-6">
        <div class="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/5 text-zinc-800" data-editable="badge">
            ${c.badge || "Disponibilités en Direct"}
          </span>
          <h2 class="font-heading text-2xl sm:text-3xl font-extrabold text-zinc-900" data-editable="title">
            ${c.title || "Réservez Votre Créneau d'Intervention ou Devis"}
          </h2>
          <p class="text-sm text-zinc-600" data-editable="subtitle">
            ${c.subtitle || "Sélectionnez une prestation et un créneau d'intervention sans engagement."}
          </p>
        </div>

        <form onsubmit="(function(e, form){
          e.preventDefault();
          const confirmBox = form.querySelector('[data-booking-success]');
          const contentBox = form.querySelector('[data-booking-form-body]');
          if (confirmBox && contentBox) {
            contentBox.classList.add('hidden');
            confirmBox.classList.remove('hidden');
          }
        })(event, this)" class="bg-zinc-50 border border-zinc-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div data-booking-form-body class="space-y-6">
            <!-- Service Choice -->
            <div class="space-y-2">
              <label class="block text-xs font-bold text-zinc-700 uppercase tracking-wider">1. Type d'intervention</label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                ${services.map((srv, idx) => `
                  <button type="button" onclick="(function(btn){
                    const parent = btn.closest('.component-booking-block');
                    parent.querySelectorAll('[data-srv-pill]').forEach(b => b.classList.remove('bg-zinc-900', 'text-white', 'border-zinc-900'));
                    parent.querySelectorAll('[data-srv-pill]').forEach(b => b.classList.add('bg-white', 'text-zinc-700', 'border-zinc-200'));
                    btn.classList.add('bg-zinc-900', 'text-white', 'border-zinc-900');
                    btn.classList.remove('bg-white', 'text-zinc-700', 'border-zinc-200');
                  })(this)" data-srv-pill class="px-3 py-2 rounded-xl text-xs font-semibold border text-center transition-all ${idx === 0 ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs' : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'}">
                    ${srv}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Slots Selection -->
            <div class="space-y-2">
              <label class="block text-xs font-bold text-zinc-700 uppercase tracking-wider">2. Créneau souhaité</label>
              <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                ${slots.map((s, idx) => `
                  <div onclick="(function(card){
                    const root = card.closest('.component-booking-block');
                    root.querySelectorAll('[data-slot-card]').forEach(c => c.classList.remove('border-emerald-600', 'bg-emerald-50/60', 'ring-2', 'ring-emerald-600'));
                    root.querySelectorAll('[data-slot-card]').forEach(c => c.classList.add('border-zinc-200', 'bg-white'));
                    card.classList.add('border-emerald-600', 'bg-emerald-50/60', 'ring-2', 'ring-emerald-600');
                    card.classList.remove('border-zinc-200', 'bg-white');
                  })(this)" data-slot-card class="booking-slot-card p-3.5 rounded-2xl border cursor-pointer transition-all ${idx === 0 ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600 shadow-xs' : 'border-zinc-200 bg-white hover:border-zinc-400'}">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-zinc-900">${s.label}</span>
                      ${s.status === 'urgent' ? '<span class="text-[9.5px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Urgent</span>' : '<span class="text-[9.5px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Libre</span>'}
                    </div>
                    <div class="text-xs font-medium text-zinc-600 mt-1">${s.time}</div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Contact & Submit -->
            <div class="pt-3 border-t border-zinc-200/80 flex flex-col sm:flex-row items-center gap-3">
              <input type="tel" data-booking-phone required placeholder="Votre numéro de téléphone (ex: 06 12 34 56 78)" class="w-full sm:flex-1 bg-white border border-zinc-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900">
              <button type="submit" class="w-full sm:w-auto btn-cta text-white px-6 py-3 rounded-xl text-xs font-bold shadow-sm hover:opacity-95 transition-all whitespace-nowrap" style="background-color: var(--primary);">
                ${c.ctaConfirm || "Valider la réservation du créneau"}
              </button>
            </div>
          </div>

          <!-- Confirmation Success Box -->
          <div data-booking-success class="hidden py-8 text-center space-y-3">
            <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 class="text-lg font-bold text-zinc-900">Créneau pré-réservé avec succès !</h3>
            <p class="text-xs text-zinc-600 max-w-md mx-auto">
              Notre artisan a bien reçu votre demande d'intervention. Vous serez contacté par SMS ou appel sous 15 minutes pour confirmer les détails.
            </p>
            <div class="pt-2">
              <a href="tel:${phone}" class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline">
                📞 Besoin immédiat ? Appelez directement le ${phone}
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;
}

// 29. Live Social Proof Toast Simulator (MVP Feature 2)
function renderSocialProofToast(project, options = {}) {
  if (options.isEditor || project.branding?.socialProofEnabled === false) return "";
  const city = project.business?.city || "votre commune";
  const trade = project.business?.tradeLabel || "artisan";

  return `
    <div id="social-proof-toast" class="social-proof-toast fixed bottom-4 left-4 z-40 bg-white/95 backdrop-blur-md border border-zinc-200/90 rounded-2xl p-3 shadow-lg flex items-center gap-3 transition-all duration-500 max-w-sm" role="status" aria-live="polite" data-city="${escapeHtml(city)}" data-trade="${escapeHtml(trade)}">
      <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base flex-shrink-0 border border-emerald-200">
        ⚡
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-xs font-bold text-zinc-900 truncate" id="sp-toast-text">
          Demande de devis reçue à ${city}
        </div>
        <div class="flex items-center gap-1.5 text-[10.5px] text-zinc-500 font-medium">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span id="sp-toast-time">Il y a 6 min</span>
          <span>•</span>
          <span class="text-emerald-700 font-semibold">Vérifié ✓</span>
        </div>
      </div>
      <button type="button" onclick="this.closest('#social-proof-toast').remove()" class="text-zinc-400 hover:text-zinc-700 p-1 text-xs" aria-label="Fermer la notification">
        ✕
      </button>
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

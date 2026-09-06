/**
 * Export Suite for Michel:
 * 1. Standalone Single-File HTML (Self-contained, production-ready, zero dependencies)
 * 2. Project JSON Export / Import
 * 3. Commercial Proposal Print Document
 */

import { renderWebsiteHTML, generateLocalBusinessSchema } from "../components/renderer.js";
import { UTILITY_CSS } from "./exportStyles.js";
import { FONT_CATALOG } from "../data/fonts.js";

const EXPORT_FONT_QUERY = FONT_CATALOG
  .map(font => `family=${encodeURIComponent(font.name).replace(/%20/g, '+')}:wght@400;500;600;700;800`)
  .join('&');

export function exportStandaloneHTML(project) {
  const htmlBody = renderWebsiteHTML(project, { isEditor: false, isStandalone: true });
  const b = project.branding;
  const bus = project.business;

  return `<!DOCTYPE html>
<html lang="fr" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${bus.name} — ${bus.tradeLabel} à ${bus.city}</title>
  <meta name="description" content="${bus.name}, votre artisan ${bus.tradeLabel.toLowerCase()} professionnel à ${bus.city} et alentours. Devis gratuit sous 24h.">
  
  <!-- LocalBusiness Structured Data (Schema.org JSON-LD) for Local Google SEO -->
  <script type="application/ld+json">
${generateLocalBusinessSchema(project)}
  </script>
  
  <!-- Modern Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?${EXPORT_FONT_QUERY}&display=swap" rel="stylesheet">
  
  <style>
${UTILITY_CSS}

    :root {
      --primary: ${b.primaryColor};
      --secondary: ${b.secondaryColor};
      --accent: ${b.accentColor};
      --bg: ${b.bgColor};
      --bg-sec: ${b.bgSecondary};
      --text: ${b.textColor};
      --text-muted: ${b.textMuted};
      --font-heading: '${b.headingFont}', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-body: '${b.bodyFont}', -apple-system, BlinkMacSystemFont, sans-serif;
      --radius: ${b.borderRadius};
      --btn-radius: ${b.buttonRadius};
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-body);
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }
    h1, h2, h3, h4, .font-heading { font-family: var(--font-heading); font-weight: 700; line-height: 1.2; }
    a { color: inherit; text-decoration: none; }
    img { max-width: 100%; height: auto; display: block; }
    button { font-family: inherit; cursor: pointer; border: none; }

    /* Physical keyboard keycap treatment for exported CTAs. */
    .btn-keycap { position: relative; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; transition: transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease; }
    .btn-keycap:hover { transform: translateY(-1px); }
    .btn-keycap:active { transform: translateY(1.5px); }
    .btn-keycap-light { background: #f7f1e6; color: #18181b; border: 1px solid #d8cbb8; border-bottom: 3px solid #aa9b87; box-shadow: 0 3px 0 #aa9b87, 0 4px 8px rgba(56,42,24,.12); }
    .btn-keycap-dark { background: #27282b; color: #fff; border: 1px solid #3f4146; border-bottom: 3px solid #111214; box-shadow: 0 3px 0 #111214, 0 4px 8px rgba(0,0,0,.25); }
    .btn-keycap-accent { background: #f06b3d; color: #24130d; border: 1px solid #d9572c; border-bottom: 3px solid #a94123; box-shadow: 0 3px 0 #a94123, 0 4px 10px rgba(169,65,35,.24); }

    .sticky-call-bar { position: fixed; left: 50%; bottom: max(1rem, env(safe-area-inset-bottom)); transform: translateX(-50%); width: min(92vw, 28rem); z-index: 120; }
    [data-ui-target="false"]::after { display: none !important; }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 1ms !important; transition-duration: 1ms !important; scroll-behavior: auto !important; } }

    /* Utilities */
    .container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 1.25rem; }
    .section-py { padding-top: 5rem; padding-bottom: 5rem; }
    .btn-primary {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
      background-color: var(--primary); color: #ffffff;
      padding: 0.875rem 1.75rem; border-radius: var(--btn-radius);
      font-weight: 600; font-size: 0.95rem; transition: all 0.2s ease;
      box-shadow: 0 4px 14px rgba(0,0,0,0.12);
    }
    .btn-primary:hover { opacity: 0.92; transform: translateY(-1px); }
    .btn-secondary {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
      background-color: transparent; color: var(--text);
      border: 1px solid rgba(0,0,0,0.15);
      padding: 0.875rem 1.75rem; border-radius: var(--btn-radius);
      font-weight: 600; font-size: 0.95rem; transition: all 0.2s ease;
    }
    .btn-secondary:hover { background-color: rgba(0,0,0,0.05); }

    /* Badge */
    .badge-pill {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.35rem 0.85rem; border-radius: 9999px;
      font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
      background-color: rgba(0,0,0,0.06); color: var(--primary);
    }

    /* Before-After Slider */
    .ba-container {
      position: relative; width: 100%; height: 480px; overflow: hidden;
      border-radius: var(--radius); user-select: none;
    }
    .ba-img-after {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      object-fit: cover;
    }
    .ba-img-before-wrapper {
      position: absolute; top: 0; left: 0; height: 100%; width: 50%;
      overflow: hidden; z-index: 10;
    }
    .ba-img-before {
      position: absolute; top: 0; left: 0; height: 100%;
      min-width: 100%; object-fit: cover;
    }
    .ba-handle {
      position: absolute; top: 0; bottom: 0; left: 50%; width: 4px;
      background-color: #ffffff; cursor: ew-resize; z-index: 20;
      box-shadow: 0 0 12px rgba(0,0,0,0.5);
    }
    .ba-handle-button {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 44px; height: 44px; border-radius: 50%;
      background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      color: #111827; font-size: 14px; font-weight: bold;
    }

    /* FAQ Accordion */
    .faq-item {
      border: 1px solid rgba(0,0,0,0.08); border-radius: var(--radius);
      margin-bottom: 0.75rem; background: #ffffff; overflow: hidden;
    }
    .faq-header {
      padding: 1.25rem; font-weight: 600; cursor: pointer;
      display: flex; justify-content: space-between; align-items: center;
    }
    .faq-content {
      padding: 0 1.25rem 1.25rem; display: none; color: var(--text-muted); font-size: 0.95rem;
    }
    .faq-item.active .faq-content { display: block; }
    .faq-item.active .faq-icon { transform: rotate(180deg); }

    /* Lightbox */
    .lightbox-modal {
      display: none; position: fixed; z-index: 9999; inset: 0;
      background: rgba(0,0,0,0.85); align-items: center; justify-content: center;
    }
    .lightbox-modal.open { display: flex; }
    .lightbox-img { max-width: 90vw; max-height: 85vh; border-radius: 8px; object-fit: contain; }
    .lightbox-close {
      position: absolute; top: 20px; right: 25px; color: #ffffff;
      font-size: 32px; font-weight: bold; cursor: pointer;
    }

    /* Standalone day/night theme */
    .artisite-root { transition: background-color 0.2s ease, color 0.2s ease; }
    .site-theme-toggle { min-height: 40px; cursor: pointer; }
    .site-theme-icon { display: inline-flex; }
    .btn-cta-pulse { animation: ctaPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes ctaPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.95; transform: scale(1.02); } }
    .artisite-root[data-site-theme="dark"] {
      --bg: #111318 !important; --bg-sec: #1c222b !important;
      --text: #f4f4f5 !important; --text-muted: #b4bac7 !important;
      background: #111318 !important; color: #f4f4f5;
    }
    .artisite-root[data-site-theme="dark"] .bg-white,
    .artisite-root[data-site-theme="dark"] .bg-white\\/95 { background-color: #171a20 !important; }
    .artisite-root[data-site-theme="dark"] .bg-gray-50,
    .artisite-root[data-site-theme="dark"] .bg-slate-50 { background-color: #20242c !important; }
    .artisite-root[data-site-theme="dark"] .text-gray-900,
    .artisite-root[data-site-theme="dark"] .text-gray-800,
    .artisite-root[data-site-theme="dark"] .text-gray-700 { color: #f4f4f5 !important; }
    .artisite-root[data-site-theme="dark"] .text-gray-600,
    .artisite-root[data-site-theme="dark"] .text-gray-500,
    .artisite-root[data-site-theme="dark"] .text-gray-400 { color: #b4bac7 !important; }
    .artisite-root[data-site-theme="dark"] .border-gray-100,
    .artisite-root[data-site-theme="dark"] .border-gray-200,
    .artisite-root[data-site-theme="dark"] .border-black\\/5 { border-color: #303641 !important; }
    .artisite-root[data-site-theme="dark"] .site-theme-toggle { background: #20242c !important; color: #f4f4f5 !important; border-color: #3b4350 !important; }
    .artisite-root[data-site-theme="dark"] .site-section { color: #f4f4f5; }

    @media (max-width: 768px) {
      .section-py { padding-top: 3.5rem; padding-bottom: 3.5rem; }
      .ba-container { height: 340px; }
    }
  </style>
</head>
<body>
  ${htmlBody}

  <!-- Interactive Scripts Bundle -->
  <script>
    // 1. Standalone day/night theme toggle
    (function initSiteTheme() {
      const root = document.querySelector('.artisite-root');
      const toggles = document.querySelectorAll('[data-site-theme-toggle]');
      if (!root || !toggles.length) return;

      function syncThemeToggle() {
        const dark = root.dataset.siteTheme === 'dark';
        toggles.forEach(button => {
          button.setAttribute('aria-label', dark ? 'Activer le mode jour du site' : 'Activer le mode nuit du site');
          const label = button.querySelector('.site-theme-label');
          if (label) label.textContent = dark ? 'Mode jour' : 'Mode nuit';
          const lightIcon = button.querySelector('.site-theme-icon-light');
          const darkIcon = button.querySelector('.site-theme-icon-dark');
          if (lightIcon) lightIcon.classList.toggle('hidden', dark);
          if (darkIcon) darkIcon.classList.toggle('hidden', !dark);
        });
      }

      toggles.forEach(button => {
        button.addEventListener('click', () => {
          root.dataset.siteTheme = root.dataset.siteTheme === 'dark' ? 'light' : 'dark';
          syncThemeToggle();
        });
      });

      syncThemeToggle();
    })();

    // 2. Client-side fallback for failed remote images
    (function initImageFallbacks() {
      function applyFallback(img) {
        if (!img || img.dataset.fallbackApplied === 'true') return;
        const fallback = img.dataset.fallbackSrc;
        if (!fallback) return;
        img.dataset.fallbackApplied = 'true';
        img.removeAttribute('srcset');
        img.src = fallback;
      }

      function hydrateImageFallbacks() {
        document.querySelectorAll('img[data-fallback-src]').forEach(img => {
          if (img.dataset.fallbackListenerAttached !== 'true') {
            img.addEventListener('error', () => applyFallback(img));
            img.dataset.fallbackListenerAttached = 'true';
          }
          if (img.complete && img.naturalWidth === 0) applyFallback(img);
        });
      }

      hydrateImageFallbacks();
      window.setTimeout(hydrateImageFallbacks, 0);
    })();

    // 3. Before-After Comparison Slider
    (function initBeforeAfter() {
      const container = document.querySelector('.ba-container');
      if (!container) return;
      const beforeWrapper = container.querySelector('.ba-img-before-wrapper');
      const beforeImg = container.querySelector('.ba-img-before');
      const handle = container.querySelector('.ba-handle');
      if (!beforeWrapper || !handle) return;

      function updateSlider(x) {
        const rect = container.getBoundingClientRect();
        let posX = x - rect.left;
        if (posX < 0) posX = 0;
        if (posX > rect.width) posX = rect.width;
        const percentage = (posX / rect.width) * 100;
        beforeWrapper.style.width = percentage + '%';
        handle.style.left = percentage + '%';
        if (beforeImg) beforeImg.style.width = rect.width + 'px';
      }

      window.addEventListener('resize', () => {
        const rect = container.getBoundingClientRect();
        if (beforeImg) beforeImg.style.width = rect.width + 'px';
      });

      let isDragging = false;
      function onStart(e) { isDragging = true; }
      function onEnd() { isDragging = false; }
      function onMove(e) {
        if (!isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        updateSlider(clientX);
      }

      handle.addEventListener('mousedown', onStart);
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('mousemove', onMove);

      handle.addEventListener('touchstart', onStart, { passive: true });
      window.addEventListener('touchend', onEnd);
      window.addEventListener('touchmove', onMove, { passive: true });

      // Initial alignment
      setTimeout(() => {
        const rect = container.getBoundingClientRect();
        if (beforeImg) beforeImg.style.width = rect.width + 'px';
      }, 100);
    })();

    // 4. FAQ Accordion Toggle
    (function initFaq() {
      document.querySelectorAll('.faq-header').forEach(header => {
        header.addEventListener('click', () => {
          const item = header.closest('.faq-item');
          if (!item) return;
          const isOpen = item.classList.contains('active');
          document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('active'));
          if (!isOpen) item.classList.add('active');
        });
      });
    })();

    // 5. Lightbox functionality
    (function initLightbox() {
      const modal = document.getElementById('lightbox-modal');
      const imgTarget = document.getElementById('lightbox-target');
      if (!modal || !imgTarget) return;

      document.querySelectorAll('[data-lightbox]').forEach(el => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          const src = el.getAttribute('data-lightbox');
          imgTarget.src = src;
          modal.classList.add('open');
        });
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('lightbox-close')) {
          modal.classList.remove('open');
        }
      });
    })();

    // 6. Quote Simulator Calculation
    (function initQuoteSimulator() {
      const form = document.getElementById('quote-calc-form');
      if (!form) return;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const success = document.getElementById('quote-calc-success');
        if (success) {
          success.style.display = 'block';
          form.style.display = 'none';
        }
      });
    })();
  </script>
</body>
</html>`;
}

export function downloadJSON(project) {
  const filename = `${slugify(project.name)}-site-data.json`;
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
  triggerDownload(blob, filename);
}

export function downloadHTML(project) {
  const filename = `${slugify(project.name)}-site-vitrine.html`;
  const html = exportStandaloneHTML(project);
  const blob = new Blob([html], { type: "text/html" });
  triggerDownload(blob, filename);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function slugify(text) {
  return (text || "projet")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

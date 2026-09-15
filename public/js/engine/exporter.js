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
  const animationMultiplier = b.animationSpeed === "fast" ? 0.6 : (b.animationSpeed === "slow" ? 1.5 : 1);

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
  <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&f[]=general-sans@500,600,700&f[]=clash-display@500,600,700&f[]=cabinet-grotesk@500,700,800&display=swap">
  
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
      --cta-radius: ${b.buttonRadius};
      --anim-duration-multiplier: ${animationMultiplier};
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
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
    .btn-cta, [data-cta-button] { border-radius: var(--cta-radius, var(--btn-radius, 8px)) !important; }

    /* Vitrine 1.1 — keep the public export visually aligned with the editor
       preview. These are deliberately local to the commercial template. */
    .max-w-7xl.vitrine-shell { max-width: 112rem; }
    .site-section[id], #services, #about, #avis, #galerie, #faq, #horaires { scroll-margin-top: 5rem; }
    .vitrine-site-header { background: rgba(255, 255, 255, .98); }
    .vitrine-template.public-mode > .site-section[data-section-type="header"] { position: sticky; top: 0; z-index: 90; }
    .vitrine-template.public-mode > .site-section[data-section-type="header"] .vitrine-site-header { position: static; }

    /* Section background studio — export must honor the exact same visible surface as the editor. */
    .bg-sec-white { background-color: #ffffff !important; color: #09090b !important; }
    .bg-sec-mineral { background-color: #f8fafc !important; color: #09090b !important; }
    .bg-sec-dark { background-color: #09090b !important; color: #f4f4f5 !important; }
    .bg-sec-warm { background-color: #faf8f5 !important; color: #292524 !important; }
    .bg-sec-navy { background-color: #0c1527 !important; color: #f8fafc !important; }
    .bg-sec-primary { background-color: var(--primary, #059669) !important; color: #ffffff !important; }
    .site-section[data-section-bg] > :first-child { background-color: transparent !important; background-image: none !important; }
    .site-section[data-has-custom-bg="true"] > :first-child { background-color: transparent !important; background-image: none !important; }
    .site-section[data-section-bg="dark"] h1, .site-section[data-section-bg="dark"] h2, .site-section[data-section-bg="dark"] h3,
    .site-section[data-section-bg="navy"] h1, .site-section[data-section-bg="navy"] h2, .site-section[data-section-bg="navy"] h3 { color: #ffffff !important; }
    .site-section[data-section-bg="dark"] p, .site-section[data-section-bg="navy"] p { color: #a1a1aa !important; }
    .vitrine-site-header-inner { min-height: 5rem; max-width: 80rem !important; }
    .vitrine-site-nav { gap: 2.35rem; font-size: .875rem; font-weight: 500; }
    .vitrine-site-nav a { color: #262626; text-decoration: none; }
    .vitrine-site-nav a:hover, .vitrine-site-nav a:focus-visible { color: var(--primary, #527c22); }
    .vitrine-header-cta { min-height: 2.75rem; padding: 0 1.5rem; font-size: .875rem; font-weight: 600; }
    .vitrine-about-image { min-height: 32rem; }
    .vitrine-about-actions { column-gap: 1.75rem; row-gap: 1rem; }
    .vitrine-about-cta { min-height: 3.75rem; white-space: nowrap; }
    .vitrine-about-link { min-height: 3.25rem; white-space: nowrap; }
    @media (max-width: 1023px) { .vitrine-about-grid { grid-template-columns: minmax(0, 1fr); } }
    @media (max-width: 639px) { .vitrine-about-image { min-height: 0; } .vitrine-about-cta, .vitrine-about-link { max-width: 100%; white-space: normal; text-align: center; } }
    .vitrine-section-title { font-size: clamp(2.5rem, 4vw, 3.5rem); line-height: 1.08; }
    .vitrine-service-grid { gap: 2rem; }
    .vitrine-service-card-body { padding: 2rem; }
    .vitrine-review-grid { max-width: 96rem; }
    .max-w-7xl.vitrine-faq-shell { max-width: 112rem; }
    .max-w-7xl.vitrine-hours-shell { max-width: 112rem; }
    .vitrine-hours-grid { max-width: 92rem; }
    .vitrine-hours-card, .vitrine-hours-map { min-height: 25rem; }
    .vitrine-hours-card { padding: 2rem; }
    .vitrine-hours-row { padding: 1.05rem 0; font-size: 1rem; }
    .vitrine-review-summary { margin-bottom: 3.5rem; }
    .vitrine-review-card { min-height: 18.5rem; padding: 2rem; }
    .vitrine-review-author { font-size: 1.0625rem; }
    .vitrine-review-copy { font-size: 1.0625rem; line-height: 1.65; }
    .vitrine-faq-list { max-width: 80rem; }
    .vitrine-faq-list .faq-item { padding: 1.35rem 0; }
    .vitrine-faq-list .faq-header { width: 100%; text-align: left; }
    .vitrine-faq-list .faq-content { padding: 1rem 0 .25rem; }
    .vitrine-site-footer { background: #fff; color: #52615b; border-top: 1px solid #e7ece4; }
    .vitrine-site-footer a { color: #29352c; text-decoration: none; }
    .vitrine-site-footer a:hover, .vitrine-site-footer a:focus-visible { color: var(--primary, #527c22); text-decoration: underline; text-underline-offset: .2em; }
    .vitrine-template.public-mode .site-section:target > * { animation: vitrine-section-arrival 440ms cubic-bezier(.16, 1, .3, 1) both; }
    @keyframes vitrine-section-arrival { from { opacity: .72; transform: translateY(1.1rem); filter: blur(3px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
    @media (prefers-reduced-motion: reduce) { .vitrine-template.public-mode .site-section:target > * { animation: none; } }
    .vitrine-faq-shell .faq-item { border: 0; border-radius: 0; margin: 0; background: transparent; overflow: visible; }
    .vitrine-faq-shell .faq-header { padding: 0; width: 100%; text-align: left; }
    .vitrine-faq-shell .faq-content { padding: 0.75rem 0 0; }
    @media (min-width: 1024px) {
      .lg\\:col-span-6 { grid-column: span 6 / span 6; }
      .vitrine-about-grid { gap: 5rem; }
      .vitrine-about-title { font-size: 3.75rem; line-height: 1.08; }
      .vitrine-about-story { font-size: 1.125rem; }
      .vitrine-about-image { min-height: 42rem; }
      .vitrine-service-grid { gap: 2.5rem; }
      .vitrine-about-actions { column-gap: 2.25rem; }
      .max-w-7xl.vitrine-hours-shell { max-width: 112rem; }
      .vitrine-hours-grid { max-width: 92rem; gap: 2.5rem; }
      .vitrine-hours-card, .vitrine-hours-map { min-height: 31rem; }
      .vitrine-hours-card { padding: 2.5rem; }
      .vitrine-hours-row { padding: 1.25rem 0; font-size: 1.0625rem; }
      .vitrine-review-summary { margin-bottom: 4rem; }
      .vitrine-review-card { min-height: 20.5rem; padding: 2.25rem; }
      .vitrine-review-author { font-size: 1.125rem; }
      .vitrine-review-copy { font-size: 1.125rem; line-height: 1.68; }
      .vitrine-faq-list { max-width: 80rem; }
      .vitrine-faq-list .faq-item { padding: 1.6rem 0; }
    }

    /* Physical keyboard keycap treatment for exported CTAs. */
    .btn-keycap { position: relative; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; transition: transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease; }
    .btn-keycap:hover { transform: translateY(-1px); }
    .btn-keycap:active { transform: translateY(1.5px); }
    .btn-keycap-light { background: #f7f1e6; color: #18181b; border: 1px solid #d8cbb8; border-bottom: 3px solid #aa9b87; box-shadow: 0 3px 0 #aa9b87, 0 4px 8px rgba(56,42,24,.12); }
    .btn-keycap-dark { background: #27282b; color: #fff; border: 1px solid #3f4146; border-bottom: 3px solid #111214; box-shadow: 0 3px 0 #111214, 0 4px 8px rgba(0,0,0,.25); }
    .btn-keycap-accent { background: #f06b3d; color: #24130d; border: 1px solid #d9572c; border-bottom: 3px solid #a94123; box-shadow: 0 3px 0 #a94123, 0 4px 10px rgba(169,65,35,.24); }

    .sticky-call-bar { position: fixed; left: 50%; bottom: max(1rem, env(safe-area-inset-bottom)); transform: translateX(-50%); width: min(92vw, 28rem); z-index: 120; }
    [data-ui-target="false"]::after { display: none !important; }
    [data-motion]:not([data-motion="none"]) { opacity: 0; transition: opacity 350ms cubic-bezier(0.16, 1, 0.3, 1), transform 350ms cubic-bezier(0.16, 1, 0.3, 1); will-change: opacity, transform; }
    [data-motion="fade-in"].is-revealed { animation: motion-fade-in 380ms cubic-bezier(0.16, 1, 0.3, 1) both; opacity: 1 !important; }
    [data-motion="slide-up"].is-revealed { animation: motion-slide-up 450ms cubic-bezier(0.16, 1, 0.3, 1) both; opacity: 1 !important; }
    [data-motion="slide-in"].is-revealed { animation: motion-slide-in 450ms cubic-bezier(0.16, 1, 0.3, 1) both; opacity: 1 !important; }
    [data-motion="spring"].is-revealed { animation: motion-spring 550ms cubic-bezier(0.34, 1.56, 0.64, 1) both; opacity: 1 !important; }
    [data-motion="progress-fill"].is-revealed { animation: motion-progress-fill 650ms cubic-bezier(0.16, 1, 0.3, 1) both; transform-origin: left; opacity: 1 !important; }
    [data-motion="reveal"].is-revealed { animation: motion-reveal 650ms cubic-bezier(0.16, 1, 0.3, 1) both; opacity: 1 !important; }
    [data-motion="stagger"].is-revealed { animation: motion-stagger 650ms cubic-bezier(0.16, 1, 0.3, 1) both; opacity: 1 !important; }
    [data-motion="magnetic"].is-revealed { animation: motion-magnetic 500ms cubic-bezier(0.2, 0.8, 0.2, 1) both; opacity: 1 !important; }
    [data-motion="shimmer"].is-revealed { animation: motion-shimmer 850ms ease-out both; opacity: 1 !important; }
    [data-motion="pulse"].is-revealed { animation: motion-pulse 1.8s ease-in-out infinite; opacity: 1 !important; }
    [data-motion="zoom-in"].is-revealed { animation: motion-zoom-in 650ms cubic-bezier(0.16, 1, 0.3, 1) both; opacity: 1 !important; }
    [data-motion]:not([data-motion="pulse"]).is-revealed { animation-duration: calc(0.85s * var(--anim-duration-multiplier, 1)) !important; }
    [data-motion="pulse"].is-revealed { animation-duration: calc(1.8s * var(--anim-duration-multiplier, 1)) !important; }
    .is-revealed { opacity: 1 !important; }
    @keyframes motion-fade-in { from { opacity: 0; transform: scale(0.99); } to { opacity: 1; transform: scale(1); } }
    @keyframes motion-slide-up { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes motion-slide-in { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes motion-spring { from { opacity: 0; transform: translateY(20px) scale(0.95); } 65% { transform: translateY(-3px) scale(1.015); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes motion-reveal { from { opacity: 0; transform: translateY(22px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes motion-stagger { from { opacity: 0; transform: translateY(24px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes motion-magnetic { 0% { opacity: 0; transform: translateY(14px) scale(0.97); } 70% { transform: translateY(-4px) scale(1.01); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes motion-shimmer { 0% { opacity: .85; filter: brightness(1); transform: scale(.99); } 50% { opacity: 1; filter: brightness(1.2); transform: scale(1.01); } 100% { opacity: 1; filter: brightness(1); transform: scale(1); } }
    @keyframes motion-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.025); } }
    @keyframes motion-zoom-in { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: scale(1); } }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; transition-duration: 1ms !important; scroll-behavior: auto !important; } }

    /* Modern Web Guidance: Native 2026 Scroll Progress Indicator & Offscreen Optimization */
    .site-scroll-progress { position: fixed; top: 0; left: 0; right: 0; height: 3px; background: var(--primary, #059669); transform-origin: 0 50%; transform: scaleX(0); z-index: 9999; pointer-events: none; box-shadow: 0 0 10px var(--primary, rgba(5,150,105,0.4)); }
    @supports (animation-timeline: scroll()) {
      .site-scroll-progress { animation: site-scroll-grow auto linear; animation-timeline: scroll(); }
      @keyframes site-scroll-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    }
    .artisite-root.public-mode:not(.vitrine-template) .site-section:not(:first-child):not(:nth-child(2)) { content-visibility: auto; contain-intrinsic-size: 1px 500px; }
    a:focus-visible, button:focus-visible, input:focus-visible { outline: 2px solid var(--primary, #059669) !important; outline-offset: 2px !important; }

    /* SplitReveal 2026 */
    .split-reveal-container { position: relative; overflow: hidden; user-select: none; touch-action: none; border-radius: 1.5rem; background-color: #09090b; }
    .sr-img-after { display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
    .sr-clipper { position: absolute; inset: 0; overflow: hidden; pointer-events: none; will-change: clip-path; }
    .sr-img-before { display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
    .sr-handle { position: absolute; z-index: 25; cursor: ew-resize; touch-action: none; display: flex; align-items: center; justify-content: center; pointer-events: auto; }
    .split-reveal-container[data-split-direction="horizontal"] .sr-handle { top: 0; bottom: 0; width: 48px; transform: translateX(-50%); cursor: ew-resize; }
    .split-reveal-container[data-split-direction="vertical"] .sr-handle { left: 0; right: 0; height: 48px; transform: translateY(-50%); cursor: ns-resize; }
    .sr-line { position: absolute; background-color: #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.5); pointer-events: none; }
    .split-reveal-container[data-split-direction="horizontal"] .sr-line { top: 0; bottom: 0; left: 50%; width: 2px; transform: translateX(-50%); }
    .split-reveal-container[data-split-direction="vertical"] .sr-line { left: 0; right: 0; top: 50%; height: 2px; transform: translateY(-50%); }
    .sr-button { width: 42px; height: 42px; border-radius: 9999px; background: #ffffff; color: #18181b; box-shadow: 0 4px 14px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2px solid #ffffff; }
    .sr-percent-badge { position: absolute; bottom: 1rem; right: 1rem; left: auto; transform: none; background: rgba(9,9,11,0.85); backdrop-filter: blur(8px); color: #ffffff; font-family: monospace; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 9999px; border: 1px solid rgba(255,255,255,0.15); pointer-events: none; z-index: 20; }
    .sr-caption { margin-top: 0.75rem; font-size: 0.875rem; color: #71717a; text-align: center; font-style: italic; }

    /* Papercraft Texture 2026 */
    :root { --bg-cream: #F5F1E8; --bg-paper: #FAF8F3; --shadow-paper: 3px 6px 12px rgba(60,50,40,0.14); }
    .texture-paper-grain, [data-paper-grain="true"] { position: relative; background-color: var(--paper-bg, var(--bg-cream)); }
    .texture-paper-grain::before, [data-paper-grain="true"]::before { content: ""; position: absolute; inset: 0; pointer-events: none; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.048'/%3E%3C/svg%3E"); background-repeat: repeat; background-size: 160px 160px; mix-blend-mode: multiply; z-index: 1; }
    .paper-card { background: var(--bg-paper, #FAF8F3); border: 1px solid rgba(60,50,40,0.12); box-shadow: var(--shadow-paper); border-radius: 0px; position: relative; overflow: hidden; }

    /* CampaignCard & Compteur */
    .campaign-card { display: grid; grid-template-columns: 1fr; gap: 1.5rem; background: #ffffff; border-radius: 1rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.08); overflow: hidden; padding: 1.5rem; }
    @media (min-width: 768px) { .campaign-card { grid-template-columns: 4fr 6fr; padding: 2rem; align-items: center; } }
    .campaign-progress-bar { height: 10px; width: 100%; background-color: #e4e4e7; border-radius: 9999px; overflow: hidden; position: relative; }
    .campaign-progress-fill { height: 100%; background: linear-gradient(90deg, #10b981, #059669); border-radius: 9999px; }
    .campaign-pill-selector { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .campaign-pill-option { padding: 0.4rem 0.85rem; border-radius: 9999px; border: 1px solid #d4d4d8; font-size: 0.8125rem; font-weight: 600; cursor: pointer; background: #f4f4f5; color: #27272a; }
    .campaign-pill-option.is-active { background: #18181b; color: #ffffff; border-color: #18181b; }

    /* Radar & Stickers */
    .radar-pulse-dot { position: relative; display: inline-flex; width: 10px; height: 10px; border-radius: 9999px; background-color: #ef4444; }
    .radar-pulse-dot::after { content: ""; position: absolute; inset: -4px; border-radius: 9999px; background-color: rgba(239,68,68,0.4); animation: radar-ping 1.5s cubic-bezier(0,0,0.2,1) infinite; }
    @keyframes radar-ping { 75%, 100% { transform: scale(2.2); opacity: 0; } }
    .physical-sticker { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.75rem; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; background: #fef08a; color: #854d0e; border: 1px solid rgba(133,77,14,0.2); box-shadow: 2px 4px 8px rgba(0,0,0,0.12); border-radius: 4px; transform: rotate(-2.5deg); }
    .physical-sticker.sticker-tilt-right { transform: rotate(2.5deg); }

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
    .artisite-root[data-site-theme="dark"] .border-zinc-100,
    .artisite-root[data-site-theme="dark"] .border-zinc-200,
    .artisite-root[data-site-theme="dark"] .border-black\\/5 { border-color: #303641 !important; }
    .artisite-root[data-site-theme="dark"] .text-zinc-900,
    .artisite-root[data-site-theme="dark"] .text-zinc-800,
    .artisite-root[data-site-theme="dark"] .text-zinc-700 { color: #f4f4f5 !important; }
    .artisite-root[data-site-theme="dark"] .text-zinc-600,
    .artisite-root[data-site-theme="dark"] .text-zinc-500,
    .artisite-root[data-site-theme="dark"] .text-zinc-400 { color: #b4bac7 !important; }
    .artisite-root[data-site-theme="dark"] .faq-item { background-color: #171a20 !important; border-color: #303641 !important; }
    .artisite-root[data-site-theme="dark"] .faq-header,
    .artisite-root[data-site-theme="dark"] .faq-header span { color: #f4f4f5 !important; }
    .artisite-root[data-site-theme="dark"] .faq-content,
    .artisite-root[data-site-theme="dark"] .faq-content p { color: #b4bac7 !important; }
    .artisite-root[data-site-theme="dark"] .campaign-card { background-color: #171a20 !important; color: #f4f4f5 !important; border-color: #303641 !important; }
    .sticky-call-btn { background-color: #ffffff !important; color: #09090b !important; }
    .sticky-call-btn:hover { background-color: #f4f4f5 !important; }
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
    // Freeform cross-section parenting — mirrors the editor/preview runtime.
    (function initFreeformReparenting() {
      const root = document.querySelector('.artisite-root');
      if (!root) return;
      const getViewport = () => {
        const width = root.getBoundingClientRect().width || window.innerWidth;
        return width < 640 ? 'mobile' : (width < 1024 ? 'tablet' : 'desktop');
      };
      const ensureLayer = section => {
        const id = section.dataset.sectionId || 'section';
        let layer = Array.from(section.children).find(child => child.dataset && child.dataset.freeformReparentLayer === id);
        if (!layer) {
          layer = document.createElement('div');
          layer.className = 'freeform-reparent-layer';
          layer.dataset.freeformReparentLayer = id;
          Object.assign(layer.style, { position: 'absolute', inset: '0', pointerEvents: 'none', overflow: 'visible' });
          if (getComputedStyle(section).position === 'static') section.style.position = 'relative';
          section.appendChild(layer);
        }
        return layer;
      };
      const apply = () => {
        const attr = 'data-freeform-parent-' + getViewport();
        const sections = Array.from(root.querySelectorAll('.site-section[data-section-id]'));
        root.querySelectorAll('[data-layout-key]').forEach(element => {
          const key = element.dataset.layoutKey;
          if (!key) return;
          const parentId = element.getAttribute(attr) || '';
          const placeholder = root.querySelector('[data-freeform-placeholder="' + key + '"]');
          if (!parentId) {
            if (placeholder) placeholder.replaceWith(element);
            return;
          }
          const section = sections.find(candidate => candidate.dataset.sectionId === parentId);
          if (!section) return;
          if (!placeholder && !element.closest('.freeform-reparent-layer')) {
            const marker = document.createElement('span');
            marker.hidden = true;
            marker.dataset.freeformPlaceholder = key;
            element.before(marker);
          }
          const layer = ensureLayer(section);
          if (element.parentElement !== layer) layer.appendChild(element);
          element.style.pointerEvents = 'auto';
        });
      };
      apply();
      let resizeTimer = 0;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(apply, 80);
      });
    })();

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

    // 3. Before-After SplitReveal Comparison Slider (Multi-instances, Horizontal & Vertical, Keyboard WCAG)
    (function initBeforeAfter() {
      document.querySelectorAll('.ba-container, .split-reveal-container').forEach(container => {
        if (container.dataset.srReady) return;
        container.dataset.srReady = 'true';

        const beforeWrapper = container.querySelector('.ba-img-before-wrapper, .sr-clipper');
        const beforeImg = container.querySelector('.ba-img-before, .sr-img-before');
        const handle = container.querySelector('.ba-handle, .sr-handle');
        const badge = container.querySelector('.sr-percent-badge');
        const isVertical = container.dataset.splitDirection === 'vertical';
        if (!beforeWrapper || !handle) return;

        function updateSlider(coord) {
          const rect = container.getBoundingClientRect();
          let percentage = 50;
          if (isVertical) {
            let posY = coord - rect.top;
            if (posY < 0) posY = 0;
            if (posY > rect.height) posY = rect.height;
            percentage = Math.round((posY / rect.height) * 100);
            beforeWrapper.style.clipPath = 'polygon(0 0, 100% 0, 100% ' + percentage + '%, 0 ' + percentage + '%)';
            beforeWrapper.style.width = '100%';
            handle.style.top = percentage + '%';
          } else {
            let posX = coord - rect.left;
            if (posX < 0) posX = 0;
            if (posX > rect.width) posX = rect.width;
            percentage = Math.round((posX / rect.width) * 100);
            beforeWrapper.style.width = percentage + '%';
            beforeWrapper.style.clipPath = 'none';
            handle.style.left = percentage + '%';
            if (beforeImg) beforeImg.style.width = rect.width + 'px';
          }
          container.dataset.splitPos = percentage;
          container.setAttribute('aria-valuenow', percentage);
          if (badge) badge.textContent = percentage + '%';
        }

        window.addEventListener('resize', () => {
          if (!isVertical && beforeImg) {
            const rect = container.getBoundingClientRect();
            beforeImg.style.width = rect.width + 'px';
          }
        });

        let isDragging = false;
        function onStart(e) { isDragging = true; }
        function onEnd() { isDragging = false; }
        function onMove(e) {
          if (!isDragging) return;
          const p = e.touches ? e.touches[0] : e;
          updateSlider(isVertical ? p.clientY : p.clientX);
        }

        handle.addEventListener('mousedown', onStart);
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('mousemove', onMove);

        handle.addEventListener('touchstart', onStart, { passive: true });
        window.addEventListener('touchend', onEnd);
        window.addEventListener('touchmove', onMove, { passive: true });

        container.addEventListener('click', (e) => {
          if (e.target.closest('button') || e.target.closest('.sr-handle')) return;
          updateSlider(isVertical ? e.clientY : e.clientX);
        });

        container.addEventListener('keydown', (e) => {
          let cur = Number(container.dataset.splitPos) || 50;
          const step = e.shiftKey ? 10 : 2;
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            const next = Math.max(0, cur - step);
            const rect = container.getBoundingClientRect();
            updateSlider(isVertical ? rect.top + (next / 100) * rect.height : rect.left + (next / 100) * rect.width);
          } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            const next = Math.min(100, cur + step);
            const rect = container.getBoundingClientRect();
            updateSlider(isVertical ? rect.top + (next / 100) * rect.height : rect.left + (next / 100) * rect.width);
          }
        });

        // Initial alignment
        setTimeout(() => {
          if (!isVertical && beforeImg) {
            const rect = container.getBoundingClientRect();
            beforeImg.style.width = rect.width + 'px';
          }
        }, 100);
      });
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

    // 7. Scroll-Reveal 60fps Motion
    (function initScrollReveal() {
      if (!window.IntersectionObserver) {
        document.querySelectorAll('[data-motion]:not([data-motion="none"])').forEach(el => el.classList.add('is-revealed'));
        return;
      }
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
      document.querySelectorAll('[data-motion]:not([data-motion="none"])').forEach(el => obs.observe(el));
    })();

    // 8. Virtual Multi-Page Navigation Mode (Standalone)
    (function initVirtualNavigation() {
      const isMultiTab = ${project.branding?.navigationMode === "multi-tab"};
      if (!isMultiTab) return;
      const pageMap = {
        home: ["header", "hero", "trust", "about", "quoteBlock", "certifications", "stats", "cta", "footer"],
        services: ["header", "services", "customBlock", "process", "stepperBlock", "tabsBlock", "tableBlock", "sliderBlock", "certifications", "cta", "footer"],
        realisations: ["header", "beforeAfter", "realisations", "gallery", "videoBlock", "reviews", "cta", "footer"],
        devis: ["header", "quoteSimulator", "pricing", "roiCalculator", "cta", "footer"],
        contact: ["header", "bookingBlock", "hours", "location", "faq", "cta", "footer"]
      };

      window.artisiteSwitchPage = function(pageId) {
        const allowed = pageMap[pageId] || pageMap.home;
        document.querySelectorAll('[data-section-type]').forEach(el => {
          const type = el.getAttribute('data-section-type');
          if (type === 'header' || type === 'footer') {
            el.style.display = '';
          } else if (allowed.includes(type)) {
            el.style.display = '';
          } else {
            el.style.display = 'none';
          }
        });
        document.querySelectorAll('.tab-nav-btn').forEach(btn => {
          const isCurrent = btn.getAttribute('data-tab-nav') === pageId;
          if (isCurrent) {
            btn.className = 'tab-nav-btn px-3 py-1 rounded-full text-xs font-semibold transition-all bg-white text-zinc-950 shadow-xs font-bold';
          } else {
            btn.className = 'tab-nav-btn px-3 py-1 rounded-full text-xs font-semibold transition-all text-zinc-600 hover:text-zinc-900';
          }
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };

      window.artisiteSwitchPage('home');
    })();

    // 9. Rotating Social Proof Toast (Standalone)
    (function initSocialProof() {
      const toast = document.getElementById('social-proof-toast');
      if (!toast) return;
      const textEl = toast.querySelector('#sp-toast-text');
      const timeEl = toast.querySelector('#sp-toast-time');
      if (!textEl || !timeEl) return;
      const city = toast.getAttribute('data-city') || ${JSON.stringify(project.business?.city || "votre commune")};
      const trade = toast.getAttribute('data-trade') || ${JSON.stringify(project.business?.tradeLabel || "artisan")};
      const messages = [
        { text: 'Demande de devis reçue à ' + city, time: 'Il y a 6 min' },
        { text: 'Nouveau créneau réservé (' + trade + ')', time: 'Il y a 14 min' },
        { text: 'Rappel téléphonique confirmé à ' + city, time: 'Il y a 28 min' },
        { text: "Intervention d'urgence validée", time: 'Il y a 42 min' }
      ];
      let idx = 0;
      setInterval(() => {
        if (!toast.isConnected) return;
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => {
          idx = (idx + 1) % messages.length;
          textEl.textContent = messages[idx].text;
          timeEl.textContent = messages[idx].time;
          toast.style.opacity = '1';
          toast.style.transform = 'translateY(0)';
        }, 400);
      }, 7000);
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

/**
 * MVP Feature 9: Production Package Generator
 * Generates XML Sitemap, Robots.txt, PWA WebManifest, and Standalone HTML.
 */
export function generateSitemapXML(project, baseUrl = "https://artisite-prospector.vercel.app") {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const today = new Date().toISOString().split("T")[0];
  const pages = [
    { path: "", priority: "1.0", changefreq: "weekly" },
    { path: "#services", priority: "0.9", changefreq: "monthly" },
    { path: "#realisations", priority: "0.8", changefreq: "weekly" },
    { path: "#contact", priority: "0.8", changefreq: "monthly" },
    { path: "#simulateur", priority: "0.7", changefreq: "monthly" }
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>${cleanBase}/${p.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}

export function generateRobotsTXT(project, baseUrl = "https://artisite-prospector.vercel.app") {
  const cleanBase = baseUrl.replace(/\/$/, "");
  return `# Robots.txt pour ${project?.business?.name || "Artisan"}
User-agent: *
Allow: /
Sitemap: ${cleanBase}/sitemap.xml
`;
}

export function generateWebManifest(project) {
  const b = project?.business || {};
  const brand = project?.branding || {};
  return JSON.stringify({
    name: `${b.name || "Artisan"} — ${b.tradeLabel || "Artisan"}`,
    short_name: b.name || "Artisan",
    description: `Site officiel de ${b.name || "Artisan"} à ${b.city || ""}`,
    start_url: "/",
    display: "standalone",
    background_color: brand.bgColor || "#ffffff",
    theme_color: brand.primaryColor || "#059669",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "64x64 32x32 24x24 16x16",
        type: "image/x-icon"
      }
    ]
  }, null, 2);
}

export function generateProductionPackage(project, baseUrl = "https://artisite-prospector.vercel.app") {
  return {
    "index.html": exportStandaloneHTML(project),
    "sitemap.xml": generateSitemapXML(project, baseUrl),
    "robots.txt": generateRobotsTXT(project, baseUrl),
    "site.webmanifest": generateWebManifest(project)
  };
}

/**
 * Pure Vanilla JS In-Memory ZIP Archive Generator (PKWARE Store format)
 */
function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

export function calculateCRC32(bytes) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

export function createZipArchive(files) {
  const encoder = new TextEncoder();
  const entries = [];
  let offset = 0;

  for (const [filename, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(filename);
    const dataBytes = typeof content === "string" ? encoder.encode(content) : content;
    const crc = calculateCRC32(dataBytes);
    const size = dataBytes.length;

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, size, true);
    view.setUint32(22, size, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    entries.push({
      filename,
      nameBytes,
      dataBytes,
      crc,
      size,
      offset,
      localHeader
    });

    offset += localHeader.length + size;
  }

  const centralParts = [];
  let centralDirSize = 0;
  for (const entry of entries) {
    const cdHeader = new Uint8Array(46 + entry.nameBytes.length);
    const view = new DataView(cdHeader.buffer);
    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint16(14, 0, true);
    view.setUint32(16, entry.crc, true);
    view.setUint32(20, entry.size, true);
    view.setUint32(24, entry.size, true);
    view.setUint16(28, entry.nameBytes.length, true);
    view.setUint16(30, 0, true);
    view.setUint16(32, 0, true);
    view.setUint16(34, 0, true);
    view.setUint16(36, 0, true);
    view.setUint32(38, 0, true);
    view.setUint32(42, entry.offset, true);
    cdHeader.set(entry.nameBytes, 46);

    centralParts.push(cdHeader);
    centralDirSize += cdHeader.length;
  }

  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, entries.length, true);
  eocdView.setUint16(10, entries.length, true);
  eocdView.setUint32(12, centralDirSize, true);
  eocdView.setUint32(16, offset, true);
  eocdView.setUint16(20, 0, true);

  const totalLength = offset + centralDirSize + eocd.length;
  const zipBuffer = new Uint8Array(totalLength);
  let pos = 0;
  for (const entry of entries) {
    zipBuffer.set(entry.localHeader, pos);
    pos += entry.localHeader.length;
    zipBuffer.set(entry.dataBytes, pos);
    pos += entry.dataBytes.length;
  }
  for (const cd of centralParts) {
    zipBuffer.set(cd, pos);
    pos += cd.length;
  }
  zipBuffer.set(eocd, pos);

  return new Blob([zipBuffer], { type: "application/zip" });
}

export function generateProductionZip(project, baseUrl = "https://artisite-prospector.vercel.app") {
  const pkg = generateProductionPackage(project, baseUrl);
  return createZipArchive(pkg);
}

export function downloadProductionPackage(project) {
  try {
    const slug = slugify(project.business?.name || project.name || "artisan");
    const zipBlob = generateProductionZip(project);
    triggerDownload(zipBlob, `pack-production-${slug}.zip`);
  } catch {
    const pkg = generateProductionPackage(project);
    downloadHTML(project);
    const sitemapBlob = new Blob([pkg["sitemap.xml"]], { type: "application/xml" });
    triggerDownload(sitemapBlob, "sitemap.xml");
    const robotsBlob = new Blob([pkg["robots.txt"]], { type: "text/plain" });
    triggerDownload(robotsBlob, "robots.txt");
    const manifestBlob = new Blob([pkg["site.webmanifest"]], { type: "application/manifest+json" });
    triggerDownload(manifestBlob, "site.webmanifest");
  }
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

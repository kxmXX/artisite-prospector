// Shared by canvas, client view and standalone export through the renderer.
export const HERO_STYLES = `
.artisite-root .hero-fullscreen {
  position: relative; isolation: isolate; overflow: hidden;
  display: flex; flex-direction: column; justify-content: center;
  height: min(calc(100svh - 5rem), 56.25vw);
  min-height: 42rem; padding: clamp(3rem, 5.5vw, 6rem) 1.25rem 2rem;
  color: #fff; background: #182119;
}
.hero-fullscreen > .hero-background,
.hero-fullscreen > .hero-darkening-overlay {
  position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;
}
.hero-fullscreen > .hero-background { z-index: 0; object-fit: cover; }
.hero-fullscreen > .hero-darkening-overlay { z-index: 1; }
.hero-fullscreen > .hero-content,
.hero-fullscreen > .hero-discover { position: relative; z-index: 2; }
.hero-fullscreen > .hero-content { width: 100%; max-width: 68rem; margin: auto; }
.artisite-root .hero-fullscreen .hero-content h1 {
  color: #fff !important; font-size: clamp(2rem, 4.6vw, 4.5rem);
  line-height: 1.14; text-wrap: balance; overflow-wrap: anywhere;
  margin: 1.75rem auto; max-width: 22ch;
}
.artisite-root .hero-fullscreen .hero-content p {
  color: #fff !important; margin: 0 auto 1.75rem; max-width: 65ch; line-height: 1.6;
}
.artisite-root .hero-fullscreen .hero-scroll-discover { color: #fff; }
.hero-fullscreen .hero-discover { margin-top: 3rem; }
.hero-fullscreen .liquid-glass-badge { max-width: 100%; white-space: normal; }
@media (max-width: 767px) {
  .artisite-root .hero-fullscreen { height: auto; min-height: 78svh; padding-top: 4rem; }
}
@media (max-width: 600px) {
  .hero-fullscreen .cta-button-wrapper { width: 100%; }
  .hero-fullscreen .btn-cta { width: 100%; white-space: normal; }
}
`;

# Theme tokens

## Compact summary

- App canvas: `#F4F5F7`; editor chrome: white/zinc; dark editor: `#09090b` / `#111114`.
- Client tokens: `--primary`, `--secondary`, `--accent`, `--bg`, `--bg-sec`, `--text`, `--text-muted` from the selected trade preset.
- Client dark mode: `--bg: #111318`, `--bg-sec: #1c222b`, `--text: #f4f4f5`, `--text-muted: #b4bac7`.
- Radius: cards `0.75rem–1.5rem`; keycaps `8px`; client buttons use preset button radius.
- Shadows: restrained 1–6px editor shadows, larger client hero/card shadows.
- Breakpoints: utility classes at `sm`, `md`, `lg`, `xl`; PC shell tuning at `980px`, `1250px`, `1440px`, `1536px`.
- Typography: system UI for app chrome; generated client heading/body fonts come from style presets.

## Raw sources

- `public/css/app.css`: application and editor CSS, keycap controls, responsive PC shell and scoped client dark mode.
- `public/js/data/styles.js`: generated-site presets and typography/color tokens.
- `public/js/engine/exportStyles.js`: utility CSS embedded into standalone exports.
- `public/js/components/renderer.js`: per-project inline CSS custom properties.

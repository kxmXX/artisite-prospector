# Page dependency trees

## `/` — Dashboard

Entry: `public/index.html`

Dependencies:

- `public/js/app.js`
  - `public/js/state.js`
  - `public/js/components/dashboard.js`
    - `public/js/components/icons.js`
    - `public/js/data/imageFallbacks.js`
  - `public/js/components/wizard.js`
  - `public/js/components/closerModal.js`
  - `public/js/components/shareModal.js`
  - `public/js/components/commandPalette.js`
  - `public/js/components/addSectionModal.js`
  - `public/js/components/imageModal.js`
  - `public/js/components/renderer.js`
    - `public/js/components/icons.js`
    - `public/js/data/imageFallbacks.js`
  - `public/js/engine/generator.js`
  - `public/js/engine/exporter.js`

## `/` — Editor / client preview

Entry: `public/js/app.js` state view `editor`

Dependencies:

- `public/js/components/editor.js`
  - `public/js/components/renderer.js`
  - `public/js/components/inspector.js`
  - `public/js/components/addSectionModal.js`
  - `public/js/components/icons.js`
- `public/css/app.css`
- `public/js/engine/exporter.js`

## `/api/ai/image`

Entry: `server/apiHandler.js`

- `server/gemini.js`
- `public/js/data/imageFallbacks.js`

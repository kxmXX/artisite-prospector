# Extractable components

## AppShell

- Source: `public/index.html`
- Category: layout
- Description: full-height SPA host and modal portal.
- Extractable props: none.
- Hardcoded: app and modal container ids, French document metadata.

## DashboardTopBar

- Source: `public/js/components/dashboard.js`
- Category: layout
- Description: product identity, search field and prospect generation action.
- Extractable props: search value, generation action.
- Hardcoded: Artisite Prospector branding and French labels.

## EditorShell

- Source: `public/js/components/editor.js`
- Category: layout
- Description: PC header, section navigator, canvas and inspector.
- Extractable props: `project`, `viewport`, `editorMode`, `selectedSectionId`.
- Hardcoded: device labels, editor actions and tactile keycap styling.

## SectionToolbar

- Source: `public/js/components/renderer.js`
- Category: basic
- Description: move, background, insert, visibility and delete controls for an editor section.
- Extractable props: section id, section type, hidden state.
- Hardcoded: icon names, keycap geometry and tooltips.

## SiteThemeToggle

- Source: `public/js/components/renderer.js` + `public/js/app.js`
- Category: basic
- Description: generated-site day/night toggle, also embedded in standalone export.
- Extractable props: initial theme, standalone flag.
- Hardcoded: sun/moon icon names and French labels.

## ProjectCard

- Source: `public/js/components/dashboard.js`
- Category: basic
- Description: prospect thumbnail, pipeline status, metrics and actions.
- Extractable props: project data and pipeline status.
- Hardcoded: action labels, status labels and keycap variants.

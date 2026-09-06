# Layouts

## Application shell

- Source: `public/index.html`
- Description: minimal full-height shell that loads the SPA and modal portal.

```html
<!DOCTYPE html>
<html lang="fr" class="h-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Artisite Prospector v4 — Générateur de sites vitrines de proximité</title>
  <meta name="description" content="SAS de création ultra rapide et vente de sites vitrines haut de gamme pour artisans et entreprises locales.">
  <link rel="stylesheet" href="css/app.css">
</head>
<body class="h-full bg-[#F4F5F7] text-zinc-900 antialiased overflow-x-hidden">
  <div id="app" class="min-h-full"></div>
  <div id="modal-container"></div>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

## Dashboard shell

- Source: `public/js/components/dashboard.js`
- Layout: sticky global bar, responsive cockpit metrics, responsive project-card grid and tactile action controls.

## Editor shell

- Source: `public/js/components/editor.js`
- Layout: PC top bar, section sidebar, central responsive canvas, optional right inspector. Client preview hides editor chrome while keeping the generated site.

## Generated client shell

- Source: `public/js/components/renderer.js`
- Layout: 16 ordered sections with site-level theme state, local image fallbacks and separate editor-only controls.

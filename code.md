# Artisite Prospector v4.2.0 — état technique

## Parcours principal

La version courante est `4.2.0`. Les modifications de cette itération sont décrites dans `CHANGELOG.md` et validées par `npm test`.

1. `public/js/engine/generator.js` crée un projet métier avec ses sections spécialisées (y compris SplitReveal, CampaignCard, Urgence Radar).
2. `public/js/components/renderer.js` produit le site en mode conception, aperçu client ou export autonome, avec indicateur de défilement GPU 120 FPS.
3. `public/js/app.js` orchestre l’édition inline, les sections, les CTA, les images et les thèmes.
4. `public/js/engine/exporter.js` transforme le projet en HTML autonome avec les interactions client intégrées (SplitReveal, Papercraft).
5. `server/apiHandler.js` expose les endpoints de santé, d’enrichissement IA et d’image.

## État validé (v4.2.0)

- Comparateur `SplitReveal` multi-instance bidirectionnel (horizontal/vertical) avec badge de pourcentage temps réel et accessibilité clavier WCAG.
- Moteur de texture `Papercraft` minéral et grain fractal SVG natif via `feTurbulence` (zéro requête externe).
- Cartes d'offres limitées `CampaignCard` avec jauge de progression calculée et pilules de sélection interactives.
- Bandeau d'astreinte radar 24/7 clignotant et stickers physiques tiltés.
- Carte d'approbation IA Studio avec jauge de confiance transparente et boutons d'application directe.
- Performance Modern Web : `fetchpriority="high"` LCP, `loading="lazy"`, `decoding="async"` et `content-visibility: auto`.
- Suppression des badges techniques parasites (`#btn-phone`, `#cta`, `#h1`) sur les textes et boutons.
- Contrôleur de boutons CTA avec suppression unitaire (Undo/Redo `⌘Z`), curseur de dimensionnement continu (80%-140%), rayons personnalisés et contrôles typographiques.
- Moteur d'animation cinématique Scroll-Reveal 60 FPS déclenché par `IntersectionObserver` et feedback instantané dans l'éditeur.
- Réorganisation Drag & Drop de sections fiabilisée sur la poignée `.section-card-grip`.
- Interface PC élargie avec contrôles tactiles type keycap 3D, libellés d’appareils et tooltips.
- Mode Conception séparé du mode Aperçu Client final.
- Thème de l’éditeur séparé du thème jour/nuit du site généré et de l’export.
- Fallback SVG local pour les images distantes défaillantes, y compris dans l’API image.
- Documentation de suivi complète dans `README.md`, `document.md` et `CHANGELOG.md`.

## Vérification

```bash
npm test
```

Le test navigateur local vérifie aussi le rendu desktop, les modes, le thème et l’absence d’erreurs console après chargement.

## Limites connues

La persistance reste locale au navigateur (`localStorage`) et les médias distants restent optionnels. L’authentification, la base multi-utilisateur, le stockage cloud et un fournisseur de génération d’images bitmap devront être ajoutés avant une exploitation SaaS complète.

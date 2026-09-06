# Artisite Prospector — état technique

## Parcours principal

1. `public/js/engine/generator.js` crée un projet métier avec ses 16 sections.
2. `public/js/components/renderer.js` produit le site en mode conception, aperçu client ou export.
3. `public/js/app.js` orchestre l’édition inline, les sections, les CTA, les images et les thèmes.
4. `public/js/engine/exporter.js` transforme le projet en HTML autonome avec les interactions client.
5. `server/apiHandler.js` expose les endpoints de santé, d’enrichissement IA et d’image.

## État validé

- Interface PC élargie avec contrôles tactiles type keycap, libellés d’appareils et tooltips.
- Mode Conception séparé du mode Aperçu Client final.
- Thème de l’éditeur séparé du thème jour/nuit du site généré et de l’export.
- Fallback SVG local pour les images distantes défaillantes, y compris dans l’API image.
- CTA éditables avec tailles S/M/L/XL et animation Pulse ; sections réordonnables et catalogue navigable.
- Documentation de suivi complète dans `README.md`.

## Vérification

```bash
npm test
```

Le test navigateur local vérifie aussi le rendu desktop, les modes, le thème et l’absence d’erreurs console après chargement.

## Limites connues

La persistance reste locale au navigateur (`localStorage`) et les médias distants restent optionnels. L’authentification, la base multi-utilisateur, le stockage cloud et un fournisseur de génération d’images bitmap devront être ajoutés avant une exploitation SaaS complète.

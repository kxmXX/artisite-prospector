# Artisite Prospector — document projet

Version courante : **4.1.0**  
Nature : éditeur visuel vanilla JS pour générer et vendre des sites vitrines locaux.

## Objectif produit

Permettre à un commercial de générer une démonstration personnalisée, de modifier chaque élément visible sur un canvas, puis d’exporter un site autonome HTML ou un projet JSON.

## Principes d’édition

- Ce qui est visible dans le canvas doit être ciblable et modifiable.
- Chaque cible possède un identifiant interne stable et un code numérique lisible au survol.
- Toute mutation persistante passe par l’historique Undo/Redo.
- Les contrôles de la sidebar ne doivent jamais déplacer le canvas par accident.
- Les animations, couleurs, typographies et rayons doivent agir sur le rendu réel, pas seulement sur l’interface de réglage.
- Les contrastes et les états clavier/souris doivent rester accessibles.

## Architecture

- `public/js/app.js` : état, commandes et événements.
- `public/js/components/editor.js` : structure de l’éditeur et panneaux de réglage.
- `public/js/components/renderer.js` : rendu du site et des contrôles de canvas.
- `public/js/state.js` : projet courant, persistance locale et historique.
- `public/js/engine/exporter.js` : export HTML autonome.
- `public/js/data/inspiration.js` : recettes de patterns UI/UX réutilisables.

## Validation obligatoire pour une évolution

1. Ajouter ou mettre à jour un test automatisé.
2. Vérifier le rendu avec les 16 sections.
3. Vérifier les modes desktop, tablette et mobile.
4. Vérifier la réversibilité par Undo/Redo.
5. Vérifier l’export autonome.
6. Vérifier les interactions critiques dans le navigateur.

## État de la version 4.1.0

La version documente la passe de fiabilisation du canvas : navigation isolée, ciblage par codes, réglages de présentation, animations par bloc, édition des boutons, contrôle du contraste et réorganisation des sections.

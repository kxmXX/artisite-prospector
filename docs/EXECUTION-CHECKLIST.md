# Artist — Checklist de reprise et de livraison

Ce fichier est le point de reprise opérationnel. **Il doit être mis à jour dans le même commit
que chaque changement de produit.** Il complète le journal détaillé dans
`docs/codex-execution-state.md` et le plan historique dans `docs/artist-consolidation-plan.md`.

## Référence de travail

- Dépôt actif : `/Users/kevinmokai/Documents/Codex/2026-09-07/artist-consolidation`
- Branche de travail : `refactor/artist-consolidation`
- Livraison obligatoire : pousser le commit sur `origin/main` et sur la branche de travail.
- Version visible : `package.json`, `public/js/version.js`, `public/index.html`, le changelog
  et cette checklist doivent annoncer la même version.
- Modèle vitrine prioritaire : artisan paysagiste « Esprit Nature », rendu public éditable.
- Références visuelles autoritaires : captures dans
  `/Users/kevinmokai/Downloads/CORRECTION SAAS/`, notamment hero 06/09, À propos et Avis 12/09.
- DA : **premium minimal / éditorial / calme / naturel / fiable / spacieux**. Header blanc fixe,
  texte noir, vert naturel pour les CTA. Les touches clavier sont réservées à l’éditeur, pas au
  site client.
- Mouvement : navigation d’ancre douce native, un seul langage de révélation discret, jamais de
  scroll-jacking ; respecter `prefers-reduced-motion`.

## État exact à `4.8.0-alpha.3`

- [x] Ancres vitrine Services, À propos, Avis, Galerie et FAQ.
- [x] Sections public paysagiste toujours peintes (pas de contenu blanc dû à `content-visibility`).
- [x] Carte / horaires en deux colonnes desktop et pile mobile.
- [x] Dimensions explicites pour Avis, Horaires et export autonome.
- [x] FAQ accessible au clavier (`aria-expanded`, `aria-controls`).
- [x] Vitrine sans badge de certification inventé sur une nouvelle génération.
- [x] Header noir, surface 112rem, CTA À propos séparés, footer vitrine et dock public retiré.
- [x] Version `4.8.0-alpha.3` synchronisée et livrée sur `main`. Le hash de livraison est
  toujours vérifiable avec `git log -1 --oneline` afin que cette checklist ne devienne jamais
  incohérente après un amendement documentaire.

## Prochain lot — vitrine de référence

- [x] Vérifier le header public à 1440 px : liens noirs, espacement large, CTA vert, aucune couleur
  navigateur visitée/bleue/violette.
- [ ] Vérifier le hero : image couvrante 16:9, titre lisible, hauteur proche d’un viewport.
- [x] Vérifier À propos : largeur utile accrue, texte/image à proportions éditoriales et deux CTA
  sans chevauchement.
- [ ] Vérifier Services, Galerie, Horaires, Avis et FAQ sur les captures desktop.
- [x] Vérifier le footer vitrine : pas de contact vide, liens utiles uniquement, contraste lisible.
- [x] Vérifier l’absence du dock/pilule de téléphone sur **le rendu public vitrine** ; conserver le
  réglage déplaçable uniquement dans l’éditeur.
- [x] Tester 1440 px et 390 px, puis l’export HTML autonome.
- [ ] Incrémenter en `4.8.0-alpha.4`, mettre à jour les cinq emplacements de version et pousser.

## Après la vitrine — contrôles de l’éditeur

- [ ] Réparer les réglages de fond : une couleur de fond ne doit jamais modifier seulement le texte.
- [ ] Réparer la typographie : catalogue chargé une fois, aperçu immédiat, corps/titres distincts.
- [ ] Réparer le rayon global des boutons et vérifier carré → pilule.
- [ ] Rendre le catalogue d’animations réellement appliqué aux blocs, avec aperçu et réduction de
  mouvement ; ne pas proposer un effet qui ne se voit pas.
- [ ] Finaliser les identifiants visibles de **tous** les composants éditables, positionnés hors du
  texte, et les opérations IA ciblées avec Undo.
- [ ] Vérifier les actions de suppression de boutons, le glisser-déposer de sections et les contrôles
  visibles à contraste suffisant.

## Procédure de chaque commit

1. Relire `AGENTS.md`, cette checklist et `docs/codex-execution-state.md`.
2. Ne modifier qu’un lot cohérent ; préserver les données existantes et les fichiers hors périmètre.
3. Tester les fichiers directement concernés, puis `git diff --check`.
4. Contrôler la vitrine locale sur desktop et mobile lorsque le rendu change.
5. Mettre à jour cette checklist, `CHANGELOG.md`, l’état d’exécution et la version visible.
6. `git add` explicitement les fichiers du lot, commit, push branche + `main`.
7. Noter ici : commit, tests réellement exécutés, anomalies connues et prochaine action unique.

## Dernière livraison validée

- Commit : `83cb290 fix(vitrine): enforce reference proportions`
- Tests : 20/20 (`vitrine_conversion_path`, `exporter`, `v440_fixes_and_dashboard`) + `git diff --check`.
- Contrôle local : Horaires 528 × 541 px par colonne à 1440 px ; Avis 400 × 328–342 px.
- Anomalie ouverte : les captures de l’utilisateur signalent encore un header violet, une largeur
  insuffisante, des CTA qui se chevauchent, un footer non conforme et un dock public visible.
  Ces points font partie du lot `alpha.3` et ont été corrigés ; la prochaine
  vérification porte sur le hero, Services et Galerie.

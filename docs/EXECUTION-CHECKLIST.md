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

## État exact à `4.8.0-alpha.7`

- [x] Navigation vitrine Services / À propos / Avis / Galerie / FAQ, sticky et compensée sous un header de 80 px.
- [x] Header de référence : canevas `80rem`, libellés noirs éditables, CTA vert « Demander un devis personnalisé » et export desktop qui ne masque plus `md:flex`.
- [x] Hero, Services, Galerie, Avis et proportions générales déjà validés conservés.
- [x] À propos aligné sur la capture : récit exact, rôle, CTA, portrait et badge « Artisan certifié » uniquement dans la démo de référence ; aucune certification inventée sur une nouvelle génération.
- [x] Horaires & Lieu en deux colonnes desktop / pile mobile ; carte interactive par défaut, ville/adresse éditables et mode image personnalisée disponible.
- [x] FAQ : surtitre `FAQ`, titre `Questions fréquentes`, questions de référence et accordéon clavier/ARIA.
- [x] Vitrine utilisable comme template : Hero et Galerie conservent leurs contrôles existants ; navigation, À propos, images Services, Avis, Horaires/carte et FAQ sont éditables depuis le même éditeur.
- [x] Responsive téléphone conservé sans débordement horizontal sur les règles validées en alpha.6.
- [x] Validation `4.8.0-alpha.7` : 15/15 tests vitrine ciblés, 173/173 suite complète, `git diff --check`, contrôle export du header à 1624 × 900 px.

## Lot vitrine de référence — terminé

- [x] Header public rapproché de la référence sans rouvrir les sections déjà validées.
- [x] Contenu À propos et hiérarchie FAQ alignés sur les captures fournies.
- [x] Carte Horaires & Lieu rendue interactive tout en gardant une option image.
- [x] Export standalone synchronisé avec le rendu public et navigation desktop visible.
- [x] Principaux contenus du template rendus modifiables depuis le SaaS sans architecture parallèle.
- [x] Publication préparée en `4.8.0-alpha.7`.

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

- Lot `4.8.0-alpha.7` : finition de la référence Esprit Nature + passage en template réellement éditable.
- Header : 80 px, canevas 80rem, mêmes libellés/CTA que la référence ; correctif standalone `md:flex !important` pour éviter la disparition du menu.
- À propos / FAQ : contenu de référence et hiérarchie corrigés ; certification limitée à la démo, jamais injectée sur une nouvelle génération.
- Horaires : iframe Google Maps interactive par défaut, liée à la ville/adresse ; image statique toujours sélectionnable.
- Éditeur : navigation, À propos, images Services, Avis et Horaires/carte complètent les contrôles Hero/Galerie/FAQ déjà présents.
- Tests : 15/15 ciblés, 173/173 complets, `git diff --check`. Commit fonctionnel `cbcac39`.
- Contrôle visuel : export standalone 1624 × 900 px, header conforme en géométrie et navigation visible.
- Prochaine action unique : reprendre les réglages transversaux de l’éditeur (fonds, typographie, rayon global des boutons, animations) sans retoucher la vitrine sauf régression mesurée.

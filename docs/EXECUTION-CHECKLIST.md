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

## État exact à `4.8.0-alpha.5`

- [x] Ancres vitrine Services, À propos, Avis, Galerie et FAQ.
- [x] Sections public paysagiste toujours peintes (pas de contenu blanc dû à `content-visibility`).
- [x] Carte / horaires en deux colonnes desktop et pile mobile.
- [x] Dimensions explicites pour Avis, Horaires et export autonome.
- [x] FAQ accessible au clavier (`aria-expanded`, `aria-controls`).
- [x] Vitrine sans badge de certification inventé sur une nouvelle génération.
- [x] Header noir, surface 112rem, CTA À propos séparés, footer vitrine et dock public retiré.
- [x] Contrainte `.max-w-7xl` neutralisée par une règle vitrine plus spécifique : largeur réelle
  de 1440 px mesurée sur un viewport de 1440 px.
- [x] Hero desktop 16:9 mesuré à 1440 × 810 px ; header encore visible à `scrollY = 4700`.
- [x] Transition d’ancre issue du pattern InView de Motion Primitives, avec mouvement réduit.
- [x] Version `4.8.0-alpha.5` synchronisée ; ce lot aligne Services, Galerie, Avis, Horaires et
  FAQ sur le même canevas 112rem que À propos et le header. Le hash de livraison reste
  vérifiable avec `git log -1 --oneline` après publication.

## Prochain lot — vitrine de référence

- [x] Vérifier le header public à 1440 px : liens noirs, espacement large, CTA vert, aucune couleur
  navigateur visitée/bleue/violette.
- [x] Vérifier le hero : image couvrante 16:9, titre lisible, hauteur proche d’un viewport.
- [x] Vérifier À propos : largeur utile accrue, texte/image à proportions éditoriales et deux CTA
  sans chevauchement.
- [x] Vérifier Services, Galerie, Horaires, Avis et FAQ sur les captures desktop : tous les
  shells mesurent 1440 px sur un viewport 1440 px, comme À propos et le header.
- [x] Vérifier le footer vitrine : pas de contact vide, liens utiles uniquement, contraste lisible.
- [x] Vérifier l’absence du dock/pilule de téléphone sur **le rendu public vitrine** ; conserver le
  réglage déplaçable uniquement dans l’éditeur.
- [x] Tester 1440 px et 390 px, puis l’export HTML autonome.
- [x] Incrémenter en `4.8.0-alpha.5`, synchroniser les emplacements de version et publier le lot.

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

- Lot `4.8.0-alpha.5` : proportions secondaires alignées sur la référence À propos sans modifier
  son shell validé ; aperçu et export autonome partagent les mêmes règles.
- Tests : 25/25 (`vitrine_conversion_path`, `hero_surface`, `exporter`, `gold`,
  `v440_fixes_and_dashboard`) + `git diff --check`.
- Suite complète : 170/170. Le test historique du Sticky Call Bar a été réaligné sur le contrat actuel (`href="#simulateur"` + libellé accessible), sans modifier son comportement.
- Contrôle Chrome/CDP desktop : header, Services, À propos, Avis, Galerie, Horaires et FAQ =
  1440/1440 px ; section header `sticky`, `top: 0` après 4700 px de scroll.
- Contrôle 390 px : shells et document = 390 px, aucun débordement horizontal. La grille et
  l'image À propos ont été corrigées uniquement sous les breakpoints concernés, sans modifier
  les proportions desktop validées.
- Prochaine action unique : reprendre les réglages fonctionnels de l'éditeur (fonds, typographie,
  rayon de boutons, animations), sans rouvrir les proportions vitrine sauf nouvelle régression.

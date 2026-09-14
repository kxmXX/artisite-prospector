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

## État exact à `4.8.0-alpha.8`

- [x] Navigation vitrine Services / À propos / Avis / Galerie / FAQ, sticky et compensée sous un header de 80 px.
- [x] Header de référence : canevas `80rem`, libellés noirs éditables, CTA vert « Demander un devis personnalisé » et export desktop qui ne masque plus `md:flex`.
- [x] Hero, Services, Galerie, Avis et proportions générales déjà validés conservés.
- [x] À propos aligné sur la capture : récit exact, rôle, CTA, portrait et badge « Artisan certifié » uniquement dans la démo de référence ; aucune certification inventée sur une nouvelle génération.
- [x] Horaires & Lieu en deux colonnes desktop / pile mobile ; carte interactive par défaut, ville/adresse éditables et mode image personnalisée disponible.
- [x] FAQ : surtitre `FAQ`, titre `Questions fréquentes`, questions de référence et accordéon clavier/ARIA.
- [x] Vitrine utilisable comme template : Hero et Galerie conservent leurs contrôles existants ; navigation, À propos, images Services, Avis, Horaires/carte et FAQ sont éditables depuis le même éditeur.
- [x] Responsive téléphone conservé sans débordement horizontal sur les règles validées en alpha.6.
- [x] Validation vitrine héritée de `4.8.0-alpha.7` conservée ; lot éditeur `4.8.0-alpha.8` validé par 37/37 tests ciblés, 177/177 suite complète et `git diff --check`.

## Lot vitrine de référence — terminé

- [x] Header public rapproché de la référence sans rouvrir les sections déjà validées.
- [x] Contenu À propos et hiérarchie FAQ alignés sur les captures fournies.
- [x] Carte Horaires & Lieu rendue interactive tout en gardant une option image.
- [x] Export standalone synchronisé avec le rendu public et navigation desktop visible.
- [x] Principaux contenus du template rendus modifiables depuis le SaaS sans architecture parallèle.
- [x] Publication préparée en `4.8.0-alpha.7`.

## Après la vitrine — contrôles de l’éditeur

- [x] Réparer les réglages de fond : la surface visible de la section suit maintenant le thème/couleur dans l’éditeur, le rendu public et l’export standalone ; test de parité ajouté.
- [x] Réparer la typographie : catalogue dédupliqué par `ensureFontCatalog`, aperçu immédiat via variables CSS, cibles Titres/Texte réellement distinctes, export fidèle et mutation compatible Undo.
- [x] Réparer le rayon global des boutons : carré → pilule s’applique aux CTA réels dans l’éditeur, le rendu public et l’export, sans modifier le rayon des cartes/conteneurs.
- [x] Rendre le catalogue d’animations réellement appliqué aux blocs : presets distincts en preview/export, vitesse persistée, aperçu direct et `prefers-reduced-motion` qui neutralise les boucles.
- [x] Finaliser les identifiants visibles de **tous** les composants éditables : références stables `#E…` affichées hors du texte pour sections/champs/images/boutons, résolution IA exacte et mutations ciblées compatibles Undo.
- [x] Vérifier les actions de suppression/restauration de boutons, le glisser-déposer de sections et les contrôles visibles : Undo immédiat, mutation de réordre testée, poignée focusable/accessible et focus à contraste renforcé.

## Complétude du template vitrine

- [x] Simulateur de devis éditable depuis la sidebar : libellés prestation/taille/délai, listes d’options et texte du bouton.
- [x] Le délai souhaité est réellement rendu dans le formulaire public lorsqu’il possède des options.
- [x] Footer éditable depuis la sidebar : nom, description, téléphone, email, adresse et copyright.

## Procédure de chaque commit

1. Relire `AGENTS.md`, cette checklist et `docs/codex-execution-state.md`.
2. Ne modifier qu’un lot cohérent ; préserver les données existantes et les fichiers hors périmètre.
3. Tester les fichiers directement concernés, puis `git diff --check`.
4. Contrôler la vitrine locale sur desktop et mobile lorsque le rendu change.
5. Mettre à jour cette checklist, `CHANGELOG.md`, l’état d’exécution et la version visible.
6. `git add` explicitement les fichiers du lot, commit, push branche + `main`.
7. Noter ici : commit, tests réellement exécutés, anomalies connues et prochaine action unique.

## Dernière livraison validée

- Lot `4.8.0-alpha.8` : contrôles transversaux fonds / typographies / rayon global des boutons / animations fiabilisés de l’éditeur jusqu’à l’export.
- Fonds : surface de section cohérente dans preview/public/export, y compris couleurs personnalisées.
- Typographies : Titres/Texte séparés, export fidèle et Undo correct.
- Boutons : rayon global indépendant du rayon des cartes et propagé aux CTA réels/export.
- Animations : presets distincts, vitesse persistée et reduced-motion complet.
- Tests : 37/37 ciblés, 177/177 complets, `git diff --check`.
- Lot `4.8.0-alpha.9` : références stables `#E…` pour les cibles éditables et résolution Copilot champ par champ ; 11/11 tests ciblés, 178/178 complets.
- Lot `4.8.0-alpha.10` : suppression/restauration + Undo, drag-and-drop câblé jusqu’à `reorderSections`, poignée accessible et focus contrasté ; 36/36 tests ciblés, 180/180 complets.
- Lot `4.8.0-alpha.11` : simulateur de devis et footer complétés comme champs de template éditables ; 16/16 tests vitrine ciblés, 180/180 complets.
- Prochaine action unique : audit de couverture final des champs vitrine puis contrôle visuel de l’éditeur, sans modifier la composition publique validée.

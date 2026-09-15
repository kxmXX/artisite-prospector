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

## Reprise P0 qualité produit — signalement du 15 septembre

- [x] Séparer la vitrine canonique Esprit Nature des données persistées de la bibliothèque : `Voir la vitrine` repart d'une instance fraîche et ne reprend ni freeform ni contenu corrompu localement.
- [x] Donner aux vues dashboard/éditeur/aperçu/vitrine une vraie navigation navigateur : URL interne, Retour et Avancer via `history.pushState/popstate`.
- [x] `Voir le site` depuis l'éditeur affiche le projet réellement ouvert, pas Esprit Nature par défaut.
- [x] Mettre en place un registre de templates explicite dans le wizard : Esprit Nature 1:1 + Artisan Moderne + Local Chaleureux, avec instanciation propre, `templateId/templateName` et personnalisation ensuite libre.
- [x] Validation visuelle dédiée vitrine/template : Chrome 1440 et 390 sur démo canonique + nouvelle instance ; largeur viewport exacte, header 1280 desktop, hero pleine largeur, ordre stable, simulateur avant footer et footer dernier.
- [x] Bibliothèque nettoyable : sélection multi-projets 34×34, Tout sélectionner sur les cartes visibles, compteur, annulation et suppression groupée persistée ; une bibliothèque volontairement vide reste vide après reload.
- [x] Coordonner les overlays de l'éditeur : Texte, Section, Freeform et CTA sont mutuellement exclusifs, leurs couches sont centralisées et la sélection reste intacte (`4.8.0-alpha.36`).
- [x] Rendre les CTA et cellules réellement manipulables : chemin CTA unique, entrée Freeform explicite par « Position », chrome non superposé et redimensionnement borné au parent (`4.8.0-alpha.41`). Le CTA d’en-tête, auparavant non lié, ouvre désormais ses réglages (`4.8.0-alpha.49`) et les ancres du canevas sont inertes en édition (`4.8.0-alpha.50`).

## Audit reçu après `4.8.0-alpha.35`

- [x] Collisions des barres flottantes — livré et vérifié dans `4.8.0-alpha.36`.
- [x] XSS du renderer/export et duplication de `escapeHtml` — rendu métier neutralisé, URL/CSS/scripts filtrés et utilitaire partagé livré dans `4.8.0-alpha.37`.
- [x] PIN client — aucun fallback, aucun secret réaffiché, validation 4–6 chiffres et portée « démo interne uniquement » explicite dans `4.8.0-alpha.38`.
- [x] Protection des routes IA — CORS restreint/configurable et budget par IP sur génération, copilote et image livré dans `4.8.0-alpha.39`.
- [x] Labels du wizard — associations natives `for`/`id` complètes dans `4.8.0-alpha.40`.
- [x] Polices — import CSS Google Fonts bloquant supprimé ; chargement unique par `<link>` dans `4.8.0-alpha.40`.
- [x] Progression du terminal IA — étapes liées à la requête et à la construction réelles, fallback local explicite et ouverture après assemblage (`4.8.0-alpha.42`).
- [ ] Bundling/performance — à mesurer avant d’introduire Vite ; ne pas créer une migration globale sans preuve de gain et sans préserver le serveur Node/Vercel.
- [~] Persistance serveur et audit SEO réel — exclus explicitement par l’utilisateur pour cette mission.
- [~] Avis Google fictifs / badges associés — conservation explicitement demandée par l’utilisateur.

## P0 — reprise qualité de l’éditeur visuel Canva / Figma

- [~] Auditer largement les gestes réels : premier passage desktop 1280 et mobile simulé 390 effectué (`4.8.0-alpha.43`). Restent tablette, rotation et rotation+scale, multi-sélection tactile et parité export.
- [x] Éliminer les superpositions de chrome et les layouts cassés : dock de contact client masqué en édition, pile Freeform mesurée anti-collision, repères libres exclus de l’aperçu (`4.8.0-alpha.43`).
- [~] Repenser l’édition des cellules autour d’un modèle spatial cohérent : historique d’édition réparé (`4.8.0-alpha.43`) et tableau comparatif rendu défilable pour ne plus couper les cellules sur canevas étroit (`4.8.0-alpha.48`) ; sortie de mode explicite livrée (`4.8.0-alpha.52` : Échap et validation partagent `exitInlineEditing`) ; restent les limites spatiales.
- [x] Rendre chaque outil réellement opérant et lisible : l’édition inline et l’inspecteur enregistrent à nouveau une transaction annulable (`4.8.0-alpha.43`).
- [x] Fiabiliser les animations : origine unique (`4.8.0-alpha.45`), aperçu de section réellement visible et vitesse appliquée à chaque preset (`4.8.0-alpha.46`), boucles une/deux/infinie et distinction explicite section / élément / image (`4.8.0-alpha.53`). Reste à neutraliser les motions pendant un transform libre, au-delà de la suspension déjà posée.
- [x] Matrice de non-régression des gestes : 9 tests comportementaux sur le moteur libre (souris, tactile, clavier, responsive) et vérification du câblage des trois modalités (`4.8.0-alpha.51`). La géométrie est désormais testée par valeurs, pas par présence de chaînes. Reste à étendre la matrice à un vrai navigateur si un jour Playwright rejoint les dépendances.
- [~] Réduire la complexité d’usage : libellés Freeform clarifiés (`Resp.` → `Responsive`, `Page` → `Entre sections`, `→ D` → `Vers desktop`, `Reset ici` → `Réinitialiser ici`), distinction explicite section / élément / image et sélecteur de boucle unique (`4.8.0-alpha.51` à `4.8.0-alpha.54`). Une refonte plus profonde de l’architecture d’information des barres d’outils reste possible mais n’est pas bloquante.

### Constats ouverts issus de l’audit et du détecteur

- [x] Jank de l’aperçu appareil — la bascule Ordinateur/Tablette/Mobile n’anime plus la largeur du canevas (`4.8.0-alpha.44`).
- [x] Aperçu mobile/tablette simulé — la largeur du canevas gouverne les breakpoints via une couche éditeur dédiée, sans modifier les media queries du site public (`4.8.0-alpha.44`). Les container queries restent la piste si le rendu doit un jour être isolé dans une iframe.
- [x] Rotation/redimensionnement d’objets déjà tournés ou scalés — origine unique `50% 50%` dans l’éditeur, l’aperçu et l’export, et compensation du redimensionnement de groupe (`4.8.0-alpha.45`). Reste un audit géométrique des gestes sur éléments tournés (le cadre de sélection reste une AABB).
- [x] Conflit motion / Freeform : l’origine n’est plus revendiquée par un élément seulement positionné, donc `progress-fill` retrouve son `transform-origin:left` (`4.8.0-alpha.47`).
- Dégradé indigo résiduel (`app.js:3605`) signalé par le détecteur comme marqueur de palette IA.

Prochaine action exacte : audit navigateur large de l’éditeur Esprit Nature sur 1440/1024/390, inventaire des aberrations mesurées, puis premier lot P0 sur les collisions et gestes de base. Le bundling passe après la remise en état fonctionnelle de l’éditeur.

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

## Audit régressions V3 — base `f49ec7f`

- [x] Baseline réelle reprise depuis `origin/main` : V3 `f49ec7f`, version restée `4.8.0-alpha.13`, suite historique 184/184 malgré des régressions navigateur non couvertes.
- [x] P0 — Réglages V3 : le rail déclenche maintenant un rendu immédiat de la surface Réglages au lieu d’attendre un autre événement.
- [x] P0 — Prévisualisation appareil : états V3 synchronisés et largeurs réelles 768 px / 390 px après transition, sans dépendre des utilitaires arbitraires absents.
- [x] P0 — Chrome de section : toolbar déplacée dans une voie dédiée hors du contenu client ; contrôle navigateur = 0 px de recouvrement.
- [x] P0 — Mobile : le dock V3 et la sticky call bar ne se superposent plus ; en conception la sticky client est masquée, en aperçu le dock éditeur est retiré.
- [x] P1 — Console : correction du `getIcon()` qui sérialisait un objet en `width/height="[object Object]"`.
- [x] P1 — Actions de structure : cibles critiques portées à 32 px minimum.
- [x] P0 — Contrôles de contenu accessibles à 1280/1024/mobile via un inspecteur responsive V3 ; sélection d’une section ouvre la surface et mobile ferme le panneau Structure concurrent.
- [x] P0/P1 — Sélection, visibilité, drag-and-drop souris, réordre clavier, édition texte, Assistant et Undo rejoués dans la V3.
- [x] P0/P1 — Image picker : les actions imbriquées Services/Réalisations ciblent le vrai chemin (`services.N.image` / `items.N.image`) ; application URL + Undo rejoués en navigateur. CTA/popover desktop : ouverture, suppression et Undo validés.
- [x] P1 — Modales V3 : hauteur bornée au viewport, scroll interne, focus initial explicite, Escape et retour de fermeture validés à 1440/1024/390 sur Image/Share/Ajouter/Commande/Wizard/Closer.
- [x] P1 — Dashboard responsive et derniers chemins CTA/mobile audités à 1440/1024/390 : aucun overflow horizontal ; inspecteur responsive borné/scrollable ; popover CTA tactile ouvre et reste dans le viewport.


## Édition libre Canva / Figma — nouveau cap produit

- [x] Fondation — modèle `freeformLayout` persistant par clé stable et par breakpoint, réinjecté dans éditeur/preview/export avec Undo/Redo.
- [x] Sélection phase 1 — textes, images et CTA stables affichent un cadre unique avec dimensions, poignée Move, Reset et 8 poignées de resize.
- [x] Sélection universelle phase 2 — cartes, conteneurs, sous-blocs et icônes métiers ont des clés structurelles stables ; clic profond + ⌘/Ctrl-clic remonte la hiérarchie de calques.
- [x] Déplacement phase 1 — Pointer Events via poignée Move, flèches clavier (Shift = 10 px) et contrainte à la section ; pas de drag HTML5 sur le canvas.
- [x] Déplacement phase 2a — drag direct du corps sélectionné avec seuil 5 px, suivi 1:1 sans transition, snapping bords/centres et Alt pour désactiver temporairement l’accroche.
- [x] Déplacement phase 2b — mode `Page` explicite, reparenting persistant par breakpoint entre sections, dimensions visuelles conservées, aller/retour et Undo cohérents jusque dans preview/export.
- [x] Redimensionnement phase 1 — 8 poignées côtés/coins, dimensions min et aperçu direct, persistées à la fin du geste.
- [x] Redimensionnement phase 2a — rotation libre persistante sur élément ou sélection, orbite collective autour du centre et Shift = pas de 15°.
- [x] Redimensionnement phase 2b — ratio individuel verrouillable par breakpoint, Shift temporaire, bornes de section et neutralisation des anciennes contraintes min/max lors d’une taille libre explicite.
- [x] Multi-sélection phase 1 — Shift-clic ajoute/retire des cibles, cadre englobant unique, déplacement souris/clavier et Reset collectifs en une mutation Undo.
- [x] Multi-sélection phase 2a — marquee par glisser dans le vide, aperçu des cibles touchées, Shift additif et respect des groupes.
- [x] Multi-sélection phase 2b — ajout/retrait tactile via `Multi +`, cibles coarse accessibles et auto-scroll progressif de bord pendant le marquee.
- [x] Groupes phase 1 — Grouper/Dégrouper persistant, clic sur un membre resélectionne le groupe, déplacement collectif sans perdre les géométries individuelles.
- [x] Groupes phase 2a — redimensionnement collectif persistant par scale autour du cadre, ratio uniforme avec Shift et Undo batch unique.
- [x] Groupes phase 2b-1 — ordre/z-index contrôlable : avancer/reculer, premier plan/arrière-plan, persistance par breakpoint et Undo.
- [x] Groupes phase 2b-2 — groupes imbriqués persistants avec sous-groupes préservés, sélection par unité, ungroup un niveau et Undo.
- [x] Alignement phase 1 — gauche/centre/droite/haut/milieu/bas et distribution horizontale/verticale en mutation batch.
- [x] Alignement phase 2a — guides intelligents visibles et snapping à 6 px pendant le déplacement, y compris bords/centres de section et éléments voisins.
- [x] Alignement phase 2b — snapping pendant le resize, équidistance entre voisins et guides de spacing avec mesure en px ; Alt désactive toujours les accroches.
- [x] Responsive phase 1 — positions/dimensions isolées par desktop/tablette/mobile ; le viewport simulé gagne sur la taille réelle du navigateur.
- [x] Responsive phase 2 — héritage/adaptation assistée et commandes de copie/reset entre breakpoints, avec adaptation proportionnelle 1200/768/390 et resynchronisation du cadre après transition.
- [x] Persistance phase 1 — transformations enregistrées dans l’état projet, sauvegarde locale, Undo/Redo, preview et export standalone.
- [x] Calques phase 1 — verrouillage persistant avec Undo ; un calque verrouillé reste sélectionnable mais refuse drag, resize, clavier, alignement, groupage et changement de plan.
- [ ] Robustesse — tests unitaires + navigateur pour texte/image/CTA/groupe, souris/tactile/clavier, sans collision avec inline editing, popovers ou modales.

## Stabilité async / backend — reprise après l’éditeur

- [x] Protéger la génération photo IA : résultat lié à projet/section/champ/index, réponse tardive ignorée après changement de cible ou de projet, application revérifiée avant mutation.
- [x] Dédupliquer les requêtes de génération IA simultanées qui portent la même clé de contexte : une seule promesse `in-flight` par clé exacte, contextes différents isolés, puis promotion dans le cache TTL.
- [ ] Revoir les prompts de génération restants pour ne pas transformer des exemples en faits client non vérifiés.
- [ ] Contre-audit sécurité / performance et limites de partage avant toute revendication multi-utilisateur.

## Procédure de chaque commit

1. Relire `AGENTS.md`, cette checklist et `docs/codex-execution-state.md`.
2. Ne modifier qu’un lot cohérent ; préserver les données existantes et les fichiers hors périmètre.
3. Tester les fichiers directement concernés, puis `git diff --check`.
4. Contrôler la vitrine locale sur desktop et mobile lorsque le rendu change.
5. Mettre à jour cette checklist, `CHANGELOG.md`, l’état d’exécution et la version visible.
6. `git add` explicitement les fichiers du lot, commit, push branche + `main`.
7. Noter ici : commit, tests réellement exécutés, anomalies connues et prochaine action unique.

## Dernière livraison validée

- Lot `4.8.0-alpha.35` : nettoyage de bibliothèque par sélection multi-projets et suppression groupée. Sélection individuelle 34×34, Tout sélectionner sur les cartes visibles, compteur et état conservés à travers un rerender dashboard. `deleteProjects()` persiste les suppressions en batch ; une bibliothèque vidée reste `[]` après reload et ne réinjecte plus Esprit Nature. QA Chrome : 4→2→0 projets, persistance après reload, mobile 390 sans overflow, zéro erreur console. 19/19 ciblés, 233/233 complets et `git diff --check`.

- Lot `4.8.0-alpha.34` : garde-fou visuel template et composition publique. Le simulateur de devis passe avant le footer afin que le footer reste réellement le dernier bloc. QA Chrome canonique + instance à 1440/390 : 1440/1440 puis 390/390, header 1280 desktop, hero pleine largeur, même ordre de sections, 0 overflow, 3 placeholders avis + 7 horaires à renseigner sur instance non documentée, zéro erreur console. 34/34 ciblés, 232/232 complets et `git diff --check`.

- Lot `4.8.0-alpha.33` : registre de templates réel dans le wizard. Esprit Nature conserve composition/variants/sections visibles de la référence sans copier état/données démo ; Artisan Moderne et Local Chaleureux restent distincts. Avis/Horaires sans faits restent visibles avec états `à renseigner`, sans fausse note ni faux horaires. QA wizard 1440/390 + création réelle de deux templates, 28/28 ciblés, 232/232 complets et `git diff --check`.

- Lot `4.8.0-alpha.32` : séparation démo canonique / projet local + vraie navigation navigateur. QA Chrome avec `proj-esprit-nature` volontairement corrompu : vitrine fraîche, CTA canonique, aucun freeform, largeur 1440/1440 ; Retour dashboard. Dupont éditeur → aperçu propre → Retour éditeur → Retour dashboard → Avancer éditeur. 43/43 ciblés, 228/228 complets et `git diff --check`.

- Lot audit renforcé post-`4.8.0-alpha.31` : 226/226 complets et `git diff --check` ; diff alpha.29→31 relu, production cohérente. Dette tracée : `app.js` volumineux, runtime reparenting dupliqué editor/export et mentions factuelles secondaires encore à auditer. Aucun changement produit/version dans ce lot.

- Lot vérification production (base `4.8.0-alpha.31`) : Vercel a d’abord servi un HTML `alpha.30` pendant que `/js/version.js` était déjà `alpha.31`, puis l’HTML a convergé 12 s plus tard avec `x-vercel-cache: MISS`. QA direct sur `https://artisite-prospector.vercel.app/` en 390 tactile : titre `alpha.31`, CTA ouvert, `aria-expanded=true`, popover dans le viewport, overflow horizontal 0 et zéro erreur console. 226/226 complets et `git diff --check`.

- Lot `4.8.0-alpha.31` : QA global dashboard/éditeur 1440/1024/390 et fiabilisation CTA mobile. Aucun overflow horizontal ; inspecteur responsive 390 px = 374×694 dans le viewport ; binding CTA rendu idempotent et tap tactile résolu au Pointer Event avant le clic synthétique retargeté. QA Chrome : popover ouvert à 1024 et 390, `aria-expanded=true`, entièrement visible, zéro erreur console. 51/51 ciblés, 226/226 complets et `git diff --check`.

- Lot `4.8.0-alpha.30` : reparenting inter-sections explicite via `Page`, `parentSectionId` par breakpoint, couche libre commune éditeur/preview/export et retour vers toute section sans changement de dimensions. QA Chrome : Header→Hero puis Hero→Header, 87,625×72 avant/après, Undo replace dans Hero ; preview/standalone reparentent réellement le DOM. 50/50 ciblés, 225/225 complets et `git diff --check`.

- Lot `4.8.0-alpha.29` : multi-sélection tactile sans Shift + auto-scroll de bord du marquee. QA Chrome : Multi 50×34 px, 1→2→1 éléments au tap, +102 px de scroll pendant le marquee, zéro erreur console. 48/48 ciblés, 223/223 complets et `git diff --check`.

- Lot `4.8.0-alpha.28` : groupes imbriqués, ungroup un niveau et Shift-clic par unité ; barre Responsive repliée par défaut pour supprimer un chevauchement. QA Chrome : groupe parent 3 calques, Move +10 collectif, sous-groupe 2 calques intact après ungroup. 37/37 ciblés, 221/221 complets et `git diff --check`.

- Lot `4.8.0-alpha.27` : adaptation responsive explicite Desktop/Tablette/Mobile, héritage Desktop et Reset local. QA Chrome : 12/8 → 3,9/2,6, édition Mobile indépendante à 10,9, héritage/restauration et toolbar bornée, zéro erreur console. 44/44 ciblés, 219/219 complets et `git diff --check`.

- Lot `4.8.0-alpha.26` : ratio individuel verrouillable + Shift temporaire, resize borné à la section et priorité du layout libre sur les anciens min/max CSS. QA Chrome : ratio 0,7999907→0,7999748, taille état/rendu concordante, +2000 px reste borné. 42/42 ciblés, 217/217 complets et `git diff --check`.

- Lot `4.8.0-alpha.25` : snap des bords pendant resize + équidistance intelligente et guides de spacing mesurés ; correction de sérialisation DOMRect. QA Chrome : resize 247→282 px à 0,016 px du bord cible et spacing 22,5/22,5 px avec label 23 px. 41/41 ciblés, 216/216 complets et `git diff --check`.

- Lot `4.8.0-alpha.24` : rotation libre persistante, poignée dédiée, Shift 15°, rotation/orbite collective et parité preview/export ; le libellé du cadre laisse désormais passer les clics hors boutons. QA Chrome validé, 38/38 ciblés, 213/213 complets et `git diff --check`.

- Lot `4.8.0-alpha.23` : ordre de calques + verrouillage persistant ; premier plan/arrière-plan/±1 par breakpoint, verrou global Undo-compatible et blocage des transformations. QA Chrome : z-index 0→1, verrouillage bloque drag/clavier, déverrouillage restaure le drag ; 37/37 ciblés, 212/212 complets et `git diff --check`.

- Lot `4.8.0-alpha.8` : contrôles transversaux fonds / typographies / rayon global des boutons / animations fiabilisés de l’éditeur jusqu’à l’export.
- Fonds : surface de section cohérente dans preview/public/export, y compris couleurs personnalisées.
- Typographies : Titres/Texte séparés, export fidèle et Undo correct.
- Boutons : rayon global indépendant du rayon des cartes et propagé aux CTA réels/export.
- Animations : presets distincts, vitesse persistée et reduced-motion complet.
- Tests : 37/37 ciblés, 177/177 complets, `git diff --check`.
- Lot `4.8.0-alpha.9` : références stables `#E…` pour les cibles éditables et résolution Copilot champ par champ ; 11/11 tests ciblés, 178/178 complets.
- Lot `4.8.0-alpha.10` : suppression/restauration + Undo, drag-and-drop câblé jusqu’à `reorderSections`, poignée accessible et focus contrasté ; 36/36 tests ciblés, 180/180 complets.
- Lot `4.8.0-alpha.11` : simulateur de devis et footer complétés comme champs de template éditables ; 16/16 tests vitrine ciblés, 180/180 complets.
- Lot `4.8.0-alpha.12` : génération photo IA protégée contre les réponses tardives et les changements de cible/projet ; 9/9 tests async ciblés, 183/183 complets.
- Lot `4.8.0-alpha.13` : déduplication `in-flight` exacte des générations IA ; 10/10 backend ciblés, 184/184 complets.
- Lot `4.8.0-alpha.14` : premier correctif V3 post-`f49ec7f` — Réglages, previews appareil, collisions toolbar/dock, SVG et cibles de structure stabilisés ; audit navigateur 1440/390, 39/39 ciblés, 189/189 complets et `git diff --check`.
- Lot `4.8.0-alpha.15` : sélection V3 synchronisée, inspecteur responsive sous 1280 px, drag/drop V3 rebranché sur les nouvelles lignes et édition de contenu vérifiée à 1280/1024/390 ; 27/27 ciblés, 191/191 complets.
- Lot `4.8.0-alpha.16` : chemins d’images imbriquées corrigés, modales V3 bornées au viewport et focus d’ouverture fiabilisé ; validation navigateur 1440/1024/390, 9/9 ciblés, 193/193 complets.
- Lot `4.8.0-alpha.17` : fondation Canva/Figma — clés de layout stables, sélection texte/image/CTA, Move + 8 poignées de resize, clavier/Reset/Undo et layouts distincts desktop/tablette/mobile avec parité preview/export ; 37/37 ciblés, 196/196 complets et `git diff --check`.
- Lot `4.8.0-alpha.18` : Shift multi-sélection, cadre englobant, groupes persistants Grouper/Dégrouper, déplacement/Reset collectifs et batch Undo unique ; barre d’actions maintenue dans le viewport ; 23/23 ciblés, 198/198 complets et `git diff --check`.
- Lot `4.8.0-alpha.19` : resize collectif de groupe par scale persistant, Shift ratio, alignements 6 axes et distributions H/V ; QA navigateur avec reload/persistance ; 24/24 ciblés, 199/199 complets et `git diff --check`.
- Lot `4.8.0-alpha.20` : drag direct du corps sélectionné, snapping 6 px bords/centres, guides visuels, Alt pour désactiver le snap et restauration instantanée du scroll canvas ; 30/30 ciblés, 205/205 complets et `git diff --check`.
- Lot `4.8.0-alpha.21` : marquee de multi-sélection, Shift additif, preview des hits et drag direct de la sélection résultante ; 32/32 ciblés, 207/207 complets et `git diff --check`.
- Lot `4.8.0-alpha.22` : hiérarchie de calques structurels (cartes/conteneurs/icônes), clés stables editor/public/export, ⌘/Ctrl-clic pour remonter parent et marquee hiérarchique ; 35/35 ciblés, 210/210 complets et `git diff --check`.
- Prochaine action unique : redimensionnement collectif des groupes puis alignement/distribution dans un commit séparé.
- Prochaine action unique : démarrer la fondation Canva/Figma — modèle de layout libre persistant + sélection universelle + premier déplacement/redimensionnement sur cibles stables, avant multi-sélection/groupes.

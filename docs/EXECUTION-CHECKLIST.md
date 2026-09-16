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

## DÉFAUT MAJEUR CONSTATÉ — le site autonome exporté est cassé (à traiter en priorité)

**Constat, 17 septembre 2026.** L'option « Exporter → Site autonome » produit une page visuellement
cassée : la section hero superpose son contenu (titre dupliqué, badge et citation qui se chevauchent,
texte `#&0239;` visible), l'image de fond n'apparaît pas et la mise en page des sections ne
s'applique pas. **Reproduit à l'identique sur la base `fe06c75`**, donc **antérieur aux lots 1 et 2** :
ce n'est pas une régression introduite par la maturation.

Cause identifiée : le HTML autonome embarque sa **propre copie** des styles du site (bloc `<style>`
écrit à la main dans `public/js/engine/exporter.js`, lignes ~44-372) au lieu de la source qui sert
l'éditeur et l'aperçu (`public/css/app.css` + `public/js/components/heroStyles.js`). Cette copie est
incomplète : les règles de mise en page des sections, du hero et de la vitrine manquent. Le test
`le HTML autonome exporté se suffit à lui-même` ne vérifie que la *présence* d'une règle pour chaque
classe, pas la fidélité de la mise en page.

Correctif à prévoir (lot dédié) : extraire les styles **du site** (et non du chrome) de `app.css` dans
un module partagé unique, consommé par l'éditeur, l'aperçu et l'export — primitive commune plutôt que
deux copies divergentes — puis vérifier l'export au navigateur. La vitrine publique et l'aperçu
éditeur, eux, sont corrects.

## Mission de maturation produit — plan approuvé, 9 lots (à partir de 4.9.0-alpha.1)

Objectif : rendre le produit compréhensible et utilisable par un débutant (personnaliser site,
section, élément, état, animation), obtenir un rendu professionnel, et retrouver son travail depuis
un autre appareil. Décisions validées avec l'utilisateur : comptes sur serveur Node + fichier de
données (zéro dépendance npm) · approfondir la direction studio-v3 et supprimer les couches mortes
(pas de refonte globale) · flux par défaut et position libre en option · éditeur et design d'abord,
comptes en dernier lot.
**Réversion explicite d'une exclusion antérieure** : la persistance serveur, jusqu'ici hors périmètre,
devient le lot 9. L'audit SEO réel et les faux avis Google restent exclus.

- [x] **Lot 1 — Socle design system** (`4.9.0-alpha.1`) : 452 classes sans règle → 0. Générateur
      unique `scripts/build-utilities.mjs` → `public/css/utilities.css` + `public/js/engine/utilitiesCss.js`,
      jetons déclarés dans `public/css/tokens.css`, focus unique `:focus-visible`, marqueurs « IA »
      retirés, 8 tests dédiés, **280/280**. *Point ouvert* : l'en-tête de la vitrine rendu dans le
      canvas étroit de l'éditeur (~640 px) est à l'étroit (liens qui se replient, FAQ proche du CTA) —
      traité au lot 2 avec la largeur de canvas et l'en-tête responsive.
- [~] **Lot 2 — Finition UI/UX** (2a livré en `4.9.0-alpha.2`) : `product-precision.css` supprimée
      et marqueur `studio-modal-card` retiré ; 397 tailles arbitraires du chrome remplacées par
      l'échelle `text-ui-*` ; 33 graisses intermédiaires normalisées ; 7 `outline:0` retirés ;
      16 couples de contraste < 4,5:1 remontés (pire cas 2,16:1 → 5,50:1) ; `pointer:coarse` étendu
      à 44 px sur tout le chrome ; `prefers-reduced-motion` étendu au dashboard et aux modales ;
      13 tests design, **285/285**. **Reste (2b)** : couche orpheline `studio-v3.css:373-478`,
      204 glyphes emoji du chrome → `icons.js`, convergence rayons/ombres/espacements, cascade de
      cartes dans l'inspecteur, liste gelée des 34 classes sans règle, navigation du dashboard
      ≤ 760 px, et le point ouvert ci-dessous.
- [x] **Lot 2b — Icônes, densité, téléphone** (`4.9.0-alpha.3`) : 122 emojis/glyphes du chrome
      remplacés par `icons.js` (63 → 89 clés, dont `tag`/`laptop`/`upload` qui retombaient sur un
      cercle générique) ; 92 lignes de CSS mort retirées de `studio-v3.css` (vérifiées au navigateur) ;
      dashboard ≤ 760 px — le rail devient une barre basse (le thème redevient accessible), titres en
      `clamp()`, métadonnées conservées. **285/285**.
      **2c partiel livré en `4.9.0-alpha.8`** : `placeholder-zinc-400` (classe invalide, la couleur
      du texte indicatif ne s'appliquait jamais) corrigée en `placeholder:text-zinc-400`,
      `no-scrollbar` reçoit une vraie définition, et cinq marqueurs redondants sont retirés
      (`app-dashboard-shell`, `dashboard-topbar`, `dashboard-v3-field-name`, `ai-avatar-wrapper`,
      `cmd-group`). La liste gelée passe de **34 à 26** classes côté application.
      *Reste de 2c* : convergence rayons/ombres/espacements (32 rayons et 47 ombres distincts dans
      le chrome), réduction de la cascade de cartes de l'inspecteur, et les 26 classes restantes.
      *Point ouvert 2a mesuré* : dans le canvas de l'éditeur (~640 px à 1280 de fenêtre), la vitrine
      rend sa navigation bureau et déborde (logo replié, FAQ sous le CTA). Cause identifiée : les
      media queries du site répondent à la fenêtre, pas au canvas. Correction prévue au lot
      responsive via des requêtes de conteneur sur le canvas — **non appliquée à ce stade**;
      la vitrine publique, elle, est correcte (vérifiée pleine largeur).
- [~] **Lot 3 — Sélection et hiérarchie** (3a livré en `4.9.0-alpha.7`) : Échap suit un escalier
      unique (édition en ligne, modale, élément, barres), une sélection dont la boîte est masquée ne
      répond plus aux flèches, et la barre d'étape affiche `Section ▸ Élément`. 4 tests dédiés.
      **Reste (3b)** : l'état de sélection reste porté par deux variables historiques
      (`_freeformSelectedKey`/`selectedSectionId`) au lieu d'une source unique ; pas d'arbre des
      éléments dans le panneau Structure ; les 830 lignes inertes de `renderSectionAccordionContent`
      sont toujours présentes et **plusieurs de leurs capacités ne sont atteignables nulle part
      ailleurs** (boucle d'animation de section, motifs d'inspiration, assombrissement du hero) :
      les réimplanter avant de supprimer le template, pas l'inverse.
- [~] **Lot 4 — Inspecteur contextuel** (4a et 4b livrés en `4.9.0-alpha.14` à `alpha.16`) :
      modèle de mise en page de section (largeur pleine/contenu/étroite, respiration
      compacte/normale/aérée, alignement), **conditionné** pour ne rien changer aux vitrines existantes,
      branché sur l'élément `<section>` et injecté par `renderWebsiteHTML` — donc éditeur, aperçu et
      **site autonome exporté** partagent la même feuille. Trois rangées de contrôles dans l'inspecteur,
      application annulable. 7 tests, **331/331**.
      *Vérifié par test* : marquage et variables présents dans l'aperçu **et** dans l'export, aucune
      émission pour une section non modifiée, feuille injectée pour les trois surfaces.
      *Non vérifié* : l'**apparence à l'écran** des trois rangées (l'inspecteur est hors du champ des
      captures à 1280 px, et je n'ai ni redimensionnement de fenêtre ni accès aux styles calculés).
      **Reste (4c)** : onglets par portée, divulgation progressive, `elementStyles[layoutKey]` pour les
      éléments, wording humain (fin du « 60fps », « preset », « responsive », « HEX/RGB », « WCAG AA »).
- [~] **Lot 5 — États des éléments** (5a en `4.9.0-alpha.9`, 5b en `4.9.0-alpha.11` et
      `alpha.12`) : modèle `elementStates[layoutKey]` (survol, focus, actif, désactivé), primitive
      unique `elementStateCSS` injectée par le renderer et donc partagée par l'éditeur, l'aperçu et
      l'export, liste blanche de propriétés et valeurs filtrées, plafond de 400 règles. Interface :
      sélecteur « Principal · Survol · Focus · Actif · Désactivé » dans le menu couleur du texte,
      réglages routés vers l'état choisi, retour au style principal en sortant de l'édition, et
      pastille rappelant l'état actif hors du menu. 8 tests dédiés, **323/323**.
      **Reste (5b, second temps)** : aucun aperçu immédiat d'un état sans survol réel ; le bouton
      « Revenir au style principal » n'existe que par l'entrée « Principal » du menu ; seuls la
      **couleur** est éditable par état — fond, bordure, ombre et opacité sont prévus par le modèle
      (`ALLOWED_PROPERTIES`) mais aucun contrôle ne les expose.
- [ ] **Défauts visuels relevés à l'inspection** (`4.9.0-alpha.31` → `.34`) : lanceur d'assistant réduit à
      une pastille compacte (il recouvrait la carte du hero) avec le bord épais retiré ; kickers numérotés
      du tableau de bord supprimés ; tous les glyphes du chrome et du rendu remplacés par le système
      d'icônes (statuts, sélection freeform, bouton de lecture, étapes de l'assistant). *Reste* :
      unification du vocabulaire de boutons, vérification mobile.
- [x] **Panneau de propriétés rendu accessible** (`4.9.0-alpha.37`) : à 1280 px c'était une surtoile masquée
      qu'aucun contrôle n'ouvrait. Bouton « Propriétés de la section » ajouté dans la barre du haut, avec
      `aria-controls`/`aria-expanded`. **Vérifié à l'écran** : réglages de section, 12 animations du catalogue,
      divulgation avancée repliée, bouton de test. *Reste non vérifié* : les propriétés d'élément (styles,
      états, position), dont l'accès dépend d'un geste de glisser indisponible dans mon outillage.
- [x] **Chemin vers les réglages d'élément** (`4.9.0-alpha.38`) : la sélection d'élément n'existait qu'en
      sélection libre (geste de glisser non annoncé). Liste « Éléments de la section » ajoutée dans le
      panneau, cliquable, calculée sur la même référence que le rendu. **Vérifié à l'écran** : les cinq états
      d'élément, le remplissage, les angles, l'opacité, le fond, la bordure et l'ombre (lots 4c et 5a/5b
      confirmés). *Reste* : voir à l'écran le bloc « Position et taille » (lot 6), plus bas dans le panneau.
- [ ] **Lot 6 — Positionnement, largement vérifié** (`4.9.0-alpha.35` → `.42`) : champs numériques X / Y /
      Largeur / Hauteur / Rotation, bornes, « flux par défaut » tenu (aucune règle CSS sans valeur saisie),
      activation explicite de la position libre **sans déplacement**, retour au flux. La liste des éléments
      est dérivée du balisage rendu, donc elle couvre aussi les **images et les boutons** (`4.9.0-alpha.42`).
      **Vérifié à l'écran de bout en bout** : sélection → activation → pastille « position libre », X et Y à 0,
      panneau maintenu ouvert. *Reste* : le geste de déplacement à la souris (validation utilisateur demandée),
      les boîtes de sélection unifiées, les gestes par appareil.
- [ ] **Lot 6 — Positionnement** : flux par défaut, position libre en option, champs numériques
      X/Y/L/H/rotation, boîte de sélection réduite à un menu `⋯`, bornes clavier = bornes souris.
- [ ] **Lot 7 — Mouvement unifié** : catalogue unique, déclencheur, durée, délai, courbe, direction,
      répétition explicite, tester/rejouer/arrêter/réinitialiser, runtime partagé à l'export.
      *Acquis 7a/7b/7c (`4.9.0-alpha.22` → `.28`)* : catalogue unique dans `public/js/data/motionPresets.js`,
      lu par l'inspecteur, le rendu (section, texte, image) et l'aperçu au survol ; les 12 entrées
      proposées sont jouables ; durée et délai réglables sur les trois surfaces, dérivés du catalogue
      et injectés par le rendu (une seule feuille pour éditeur, aperçu et export). La **courbe**
      (`4.9.0-alpha.59`) et la **direction** (`4.9.1`) sont désormais réglables ; la direction n'apparaît
      que pour les animations qui en ont une (montée douce, entrée latérale), afin de ne pas promettre un
      effet que le rendu ne joue pas. La **répétition** parle désormais un seul vocabulaire (`4.9.1`) :
      une rangée partagée par les trois surfaces, alimentée par le catalogue, et l'ancien `infinite`
      traduit en `loop` à la lecture. *Reste* : outil tester/rejouer/arrêter/réinitialiser, et
      neutralisation des motions pendant un transform libre.
- [x] **Lot 4d — Divulgation progressive de l'inspecteur** (clos en `4.9.0-alpha.48`) : primitive partagée
      (`disclosure`, `<details>/<summary>` natifs, focus clavier, état retenu au nouveau rendu) appliquée au
      rythme de l'animation de section (`4.9.0-alpha.29`) puis aux réglages d'élément — espacement et angles
      immédiats, opacité / fond / bordure / ombre repliés (`4.9.0-alpha.40`) ; les dix groupes de réglages
      globaux sont des accordéons, désormais **focusables et annoncés** (`4.9.0-alpha.48`). Le groupe « Mise
      en page » de section n'en a pas besoin : trois rangées ne font pas un mur.
- [x] **Panneau de propriétés en retard sur la section** (`4.9.0-alpha.44`) : la visibilité dépendait d'une
      requête média et non d'un état, d'où un panneau bloqué sur la section précédente. Elle est désormais
      portée par `state.inspectorPanelOpen` ; **vérifié à l'écran** — le panneau affiche bien la section
      choisie. Conséquence assumée : il ne s'ouvre plus tout seul sous 1280 px, l'auteur l'ouvre par le bouton.
- [ ] **Lot 3b — Sélection unique et arbre des éléments** (`4.9.0-alpha.49` → `.50`) : `setElementSelection`
      est le seul point d'écriture de la sélection d'élément (quatre chemins y passent), et deux
      désynchronisations sont corrigées — nettoyage de la sélection libre, changement de section. Chaque
      section du panneau Structure se déplie pour montrer ses éléments, nommés par un module partagé avec le
      panneau de propriétés. *Reste* : le remplacement des 830 lignes inertes de
      `renderSectionAccordionContent`.
- [ ] **Passe anti-slop (skill Impeccable)** : surfaces du navigateur thématisées en `4.9.0-alpha.30`
      (sélection, curseur de saisie, barres de défilement, chiffres tabulaires, anneau de focus unique),
      portée bornée à `.studio-editor` ; **tous** les glyphes du chrome et du rendu remplacés par des icônes
      dessinées (`4.9.0-alpha.32` → `.34`) ; vocabulaire de boutons unifié par des jetons de contrôle
      (`4.9.0-alpha.45`), à rendu identique ; verre décoratif retiré du chrome, surfaces opaques
      (`4.9.0-alpha.46`), voiles de modale et site publié conservés. *Reste* : PRODUCT.md / DESIGN.md.
- [x] **Lot 8 — Undo/Redo exhaustif** (`4.9.0-alpha.4`) : 11 commandes mutaient avant de prendre
      l'instantané (l'annulation ne restaurait rien) et 20 commandes n'avaient aucun historique ;
      toutes prennent désormais leur instantané **avant** la mutation, y compris les six
      affectations `updateProject(..., false)` des animations. `pushHistoryCoalesced` regroupe les
      mutations continues (25 pas de curseur = 1 entrée). 10 tests dédiés, **295/295**.
      *Reste* : le regroupement n'est branché que sur les deux curseurs de taille de texte et
      l'assombrissement du hero ; les glissers freeform et le glisser du bandeau collant ne sont pas
      encore transactionnels.
- [x] **Lot 9 — Comptes et persistance** (9a serveur livré en `4.9.0-alpha.5`) :
      `server/store.js` (fichier JSON atomique, `DATA_DIR`) et `server/accounts.js` (scrypt + sel,
      jetons de session stockés hachés, cookie `HttpOnly`/`SameSite=Lax`/`Secure`, `ownerId` par
      projet, 404 uniforme hors propriétaire, freinage 20 tentatives/5 min, refus 503 explicite sans
      disque persistant). Routes branchées dans `server/apiHandler.js`, 8 tests dédiés, **303/303**.
      **9b livré en `4.9.0-alpha.6`** : `api.js` (appel unique, `ApiError`), `session.js` (trois états
      connecté / anonyme / indisponible + hors ligne), modale de compte branchée sur le coordinateur
      d'overlays, bouton « Se connecter » et pastille « identifiant · Se déconnecter » dans l'en-tête
      du dashboard, poussée différée des écritures (600 ms), fusion de la bibliothèque en gardant la
      version la plus récente par projet, et bandeau de migration des créations locales avec copie de
      secours avant import. 7 tests client supplémentaires, **310/310**, et connexion réelle vérifiée
      au navigateur sur un serveur local.
      **Production résolue en `4.9.1`** : `server/store.js` sait écrire dans **Vercel Blob** en
      instantanés immuables (`artisite/db/<horodatage>.json`, lecture par liste du plus récent,
      cinq conservés), avec repli Redis REST et fichier local. Le site public ne répond plus 503 ;
      inscription, session, import de projet et déconnexion vérifiés en production. Une panne de
      lecture lève au lieu de renvoyer une base vide (`REMOTE_STORE_TIMEOUT@hôte`). 3 tests de
      backend supplémentaires, **408/408**.
      *Reste à faire sur ce chantier* : la synchronisation ne pousse que le projet courant (pas une
      suppression côté serveur quand un projet est effacé localement), et aucun test n'a été fait sur
      deux navigateurs simultanés.

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

## LOT DE LIVRAISON — aperçu animé des presets 4.8.0-alpha.54 — 15 septembre 2026

- Demande utilisateur restante : « surtout au niveau graphique pour les mettre en place ». Le survol d’un preset joue désormais son mouvement sur le bouton lui-même, dans les quatre surfaces : panneau de section, menu texte, menu image et grille des Réglages.
- Implémentation : attribut `data-motion-preview="<preset>"` sur les boutons + règles CSS `:hover` réutilisant les keyframes réelles du rendu final (`motion-fade-in`, `motion-slide-up`, `motion-spring`, `motion-reveal`, `motion-stagger`, `motion-shimmer`, `motion-zoom-in`, `textPulse`, `motion-magnetic`, `motion-progress-fill`). Aucune duplication d’animation : ce qui est survolé est ce qui sera publié.
- Accessibilité : aperçu désactivé sous `prefers-reduced-motion`; aide « Survolez un preset pour le prévisualiser. » dans chaque menu.
- Tests : `tests/motion_loop.test.js` compte 5 tests (3 boucles rendues, absence par défaut, reduced-motion, libellés, aperçu) ; 272/272 complets.
- Peaufinage restant possible (non bloquant) : refonte plus profonde de l’architecture d’information des barres d’outils, exécution Playwright automatisée de la matrice de gestes.

## LOT DE LIVRAISON — boucles et distinction des animations 4.8.0-alpha.53 — 15 septembre 2026

- Demande utilisateur : rendre les animations plus faciles à mettre en place graphiquement, permettre des boucles, et distinguer nettement animation de section et animation d’élément. Skill Impeccable rechargé et playbook `animate.md` relu.
- Boucles : nouveau vocabulaire `once | twice | infinite`. Modèle `settings.motionLoop` (section), `settings.elementMotionLoops[field]` (texte), `settings.imageMotionLoops[key]` (image). Le renderer émet `data-motion-loop` sur la section, l’élément et l’image. CSS : `animation-iteration-count` piloté par l’attribut, neutralisé sous `prefers-reduced-motion`.
- UI : sélecteur « Répétition » partagé (Une fois / ×2 / Boucle) dans le panneau de section, le menu du texte et celui de l’image, avec état actif synchronisé à l’ouverture (`syncMotionLoopButtons`) et à chaque changement.
- Clarté : « Animation du bloc » → « Animation de la section » ; « Animation Texte 60fps » → « Animation de l’élément · texte » ; « Animation Image » → « Animation de l’image · élément », chacun avec un texte d’aide qui renvoie vers le bon outil. Glyphes ajoutés aux presets.
- Tests : 4 nouveaux tests (`tests/motion_loop.test.js`) — rendu des trois boucles, absence de boucle par défaut, neutralisation reduced-motion, libellés distincts ; 271/271 complets. Sonde de rendu confirmée.
- Prochaine action exacte : finaliser la lisibilité graphique des menus (aperçu animé des presets) et clôturer la mission.

## LOT DE LIVRAISON — sortie d’édition explicite 4.8.0-alpha.52 — 15 septembre 2026

- Cause : le bouton de fermeture de la barre d’outils texte se contentait de `style.display = "none"` sans blur, et la cellule n’écoutait pas Échap. Une fois dans une cellule, l’utilisateur restait en édition sans sortie claire.
- Correctif : nouvelle méthode `exitInlineEditing()` qui blur l’élément actif contenteditable (donc déclenche le commit `onblur`), vide `_activeEditableEl` et masque la barre. Elle est partagée par Échap dans la cellule, le bouton de validation et le gestionnaire global Échap.
- Affordance : le bouton devient une coche avec `title="Terminer l’édition (Échap)"` et `aria-label`, au lieu d’un « Fermer » ambigu.
- Preuve navigateur : cliquer un titre hero fait apparaître la barre (TAILLE, B/U, Couleur, Anim) ; Échap la fait disparaître et retire le focus.
- Tests : 12/12 tests d’intégrité éditeur, 267/267 complets, `node --check` et `git diff --check` propres.
- Prochaine action exacte : réduire la complexité d’usage des barres d’outils et des libellés, puis passe finale de cohérence UI/UX.

## LOT DE LIVRAISON — matrice de gestes 4.8.0-alpha.51 — 15 septembre 2026

- Nouveau fichier `tests/editor_gesture_matrix.test.js` : 9 tests organisés par modalité, exécutés en valeurs exactes sur le moteur pur `engine/freeform.js`.
- Souris : `resolveFreeformSnap` (bord droit, centre, hors seuil, entrées invalides), `rectAxisLines` (début/centre/fin), `resolveEqualSpacingSnap` (écart partagé = 40 px), `marqueeContainsRectCenter` (centre dedans/dehors).
- Tactile : `resolveEdgeAutoScroll` (haut négatif, bas positif, milieu 0, hors cadre 0, rectangle dégénéré 0) et vérification de `pointerType === "touch"`, `touch-action:none`, `@media(pointer:coarse)`.
- Clavier : pas de 1 px / 10 px, Échap, groupage/dégroupage ⌘G, magnétisme de rotation à 15° et verrou de ratio.
- Responsive : `adaptFreeformLayoutToViewport` desktop→mobile (x 120→39, y 60→19,5, largeur 600→195, hauteur 300→97,5, rotation conservée).
- Honnêteté : il s’agit d’une matrice comportementale Node et de câblage, complétée par les passages navigateur manuels des tours précédents ; ce n’est pas encore une exécution Playwright automatisée.
- Tests : 9/9 matrice, 266/266 complets, détecteur Impeccable 0 alerte sur le moteur.
- Prochaine action exacte : réduire la complexité d’usage des barres d’outils et de leurs libellés, puis sortie de mode explicite des cellules.

## LOT DE LIVRAISON — ancres inertes en édition 4.8.0-alpha.50 — 15 septembre 2026

- `decorateLayoutKeys` reçoit `isEditor` et, en mode éditeur uniquement, ajoute `onclick="event.preventDefault()"` à chaque ancre portant `href`. Le canevas n’est pas une page vivante : un clic ne doit jamais naviguer. `href` reste pour la sémantique et la parité d’export.
- Portée vérifiée par sonde : 24 ancres éditeur traitées (2 appartiennent à la barre collante de niveau supérieur, masquée en édition), **0 injection** dans le HTML public, et `href="#simulateur"` toujours présent côté éditeur.
- Observation honnête : en automatisation, le panneau de réglages s’ouvre bien, mais l’URL peut encore afficher `#simulateur` après le clic — aucun code applicatif n’écrit ce hash (`location.hash` n’est jamais assigné) ; il s’agit probablement d’un artefact du pilotage synthétique. La garantie posée est celle du renderer : l’action par défaut est annulée en ligne.
- Tests : 11/11 tests d’intégrité éditeur, 257/257 complets, `node --check` et `git diff --check` propres.
- Prochaine action exacte : construire la matrice de non-régression des gestes (souris / tactile / clavier) puis simplifier les barres d’outils et leurs libellés.

## LOT DE LIVRAISON — CTA d’en-tête réparé 4.8.0-alpha.49 — 15 septembre 2026

- Cause : le wrapper du CTA d’en-tête (`renderHeader`, renderer.js) omettait `data-ui-target="true"`, contrairement aux CTA de hero/CTA. La liaison éditeur (`initCanvasInteractivity`) sort tôt quand cet attribut est absent : le bouton principal de l’en-tête n’avait donc aucun gestionnaire de réglages et son clic suivait `href="#simulateur"`.
- Correctif : `decorateLayoutKeys` reçoit `isEditor` et garantit `data-ui-target="true"` sur chaque wrapper `data-cta-popover-wrapper` en mode éditeur, avant l’ajout de la clé de layout. Le site public et l’aperçu client conservent zéro cible éditeur, donc leur navigation native.
- Preuve navigateur : cliquer le CTA d’en-tête affiche désormais le panneau (curseur « Taille continue », « Bords », « Animation »). Avant, le wrapper n’était pas lié du tout.
- Tests : 10/10 tests d’intégrité éditeur, 256/256 complets, `node --check` et `git diff --check` propres.
- Limite connue : l’ancre d’en-tête peut encore changer le hash `#simulateur` selon la séquence de clic ; à rendre inerte en mode éditeur au prochain lot.
- Prochaine action exacte : rendre l’ancre CTA inerte en mode éditeur, puis construire la matrice de non-régression des gestes et simplifier les barres d’outils.

## LOT DE LIVRAISON — cellules de tableau éditables 4.8.0-alpha.48 — 15 septembre 2026

- Cause : le conteneur `.component-table` portait `overflow-hidden`. Sur un canevas étroit (mobile simulé ou téléphone réel), les trois colonnes se comprimaient puis étaient coupées, rendant la sélection et l’édition tactile imprévisibles — exactement le symptôme « édition des cellules mal conçue ».
- Correctif : le tableau est enveloppé dans `.component-table-scroll` (`overflow-x:auto`, `overscroll-behavior-x:contain`), conservant les coins arrondis et le clip de l’en-tête sur le conteneur parent. Le tableau garde une largeur minimale de 40 rem afin que les cellules restent lisibles et saisissables.
- Tactile : sous `pointer:coarse`, les cellules `data-editable` du tableau reçoivent un rembourrage renforcé.
- Tests : 9/9 tests d’intégrité éditeur, 255/255 complets, `node --check` et `git diff --check` propres.
- Prochaine action exacte : construire la matrice de non-régression des gestes (souris / tactile / clavier) puis simplifier les barres d’outils et leurs libellés.

## LOT DE LIVRAISON — origine libre non prédatrice 4.8.0-alpha.47 — 15 septembre 2026

- Conflit identifié au tour précédent : `freeformDeclarations` émettait `transform-origin:50% 50%!important` sur tout élément disposant d’un layout libre, y compris un simple déplacement sans rotation ni échelle. L’animation `progress-fill` (qui définit `transform-origin:left`) pivotait donc au centre, et un élément librement déplacé ne pouvait plus faire tourner correctement une barre de progression.
- Correctif : l’origine n’est émise que si une échelle ou une rotation est présente — les deux cas que le tour alpha.45 devait unifier — et le style vivant retire la propriété dans le cas contraire, pour qu’un preset reprenne la main.
- Test : rendu réel via `renderWebsiteHTML` — un layout `{x,y}` ne contient pas `transform-origin`, tandis que `{x,y,rotation}` et `{x,y,scaleX,scaleY}` contiennent `transform-origin:50% 50%!important`.
- Tests : 8/8 tests d’intégrité éditeur, 254/254 complets, `node --check` et `git diff --check` propres.
- Prochaine action exacte : neutraliser toute motion sur l’élément pendant un transform libre au-delà de la pause déjà posée, et couvrir par une matrice de non-régression souris/tactile/clavier.

## LOT DE LIVRAISON — aperçu d’animation fidèle 4.8.0-alpha.46 — 15 septembre 2026

- Cause racine : `previewSectionMotion` ajoutait `is-revealed` mais jamais `motion-preview`. Or `#canvas-container [data-motion]:not(.motion-preview){opacity:1!important}` (spécificité d’identifiant, `!important`) gagne sur les animations : le fondu des presets Fade/Zoom/Reveal/Shimmer était donc entièrement écrasé. Les presets à base de transform (Slide, Spring) semblaient marcher, ce qui expliquait l’impression d’animations « partiellement en panne ».
- Correctif : la prévisualisation de section passe sous `motion-preview` (comme le faisait déjà l’aperçu de texte/image), déclenche l’animation, puis retire la classe après 1,2 s pour restaurer le garde-fou ; Pulse reste actif.
- Vitesse : le sélecteur Rapide/Naturel/Posé écrasait toutes les durées par une base unique de 0,85 s. Chaque preset expose maintenant `--motion-duration` (650/700/750/850/500 ms) et le multiplicateur s’applique dessus. Pulse, TextPulse et ImgPulse, dont la durée est dans un raccourci `!important`, intègrent directement `calc(durée * var(--anim-duration-multiplier))`.
- Tests : test comportemental sur `previewSectionMotion` (classe `motion-preview` + minuterie de restauration), assertions sur la vitesse par preset ; 7/7 tests d’intégrité, 252/252 complets.
- Prochaine action exacte : neutraliser les motions pendant un transform libre et auditer l’interaction `filter`/`drop-shadow` de Pulse avec le redimensionnement.

## LOT DE LIVRAISON — transformations libres cohérentes 4.8.0-alpha.45 — 15 septembre 2026

- Cause racine : `freeformDeclarations` et `applyFreeformLiveStyle` n’émettaient `transform-origin:0 0` que lorsqu’une échelle existait. Un élément tourné pivotait donc au centre tant qu’il n’était pas mis à l’échelle, puis basculait sur son coin dès qu’une échelle apparaissait — le même geste produisait deux comportements.
- Correctif : origine unique `transform-origin:50% 50%!important` émise systématiquement dans le renderer (éditeur, aperçu, export) et dans le style vivant de l’éditeur. Rotation et échelle partagent désormais le centre.
- Redimensionnement de groupe : l’échelle autour du centre décale chaque bord d’une demi-variation ; le déplacement est compensé (`centerOffsetX/Y`) pour que les bords visés restent exacts.
- Compatibilité : les éléments simplement tournés conservent leur rendu précédent (ils étaient déjà au centre) ; seuls les éléments mis à l’échelle changent de pivot, justement pour rejoindre le modèle attendu.
- Preuve : sonde de rendu CSS sur un élément `rotation:30 scale:1.4` → `transform-origin:50% 50%!important` dans les trois contextes ; 5/5 tests d’intégrité, 251/251 complets.
- Détecteur Impeccable : avertissements préexistants (badge ambre, `animate-bounce`, image lightbox vide) sans lien avec ce lot.
- Prochaine action exacte : aperçu fiable des presets d’animation et neutralisation des motions pendant un transform (vitesse `--anim-duration-multiplier` ignorée par les animations `!important`).

## LOT DE LIVRAISON — aperçu mobile/tablette fidèle 4.8.0-alpha.44 — 15 septembre 2026

- Cause racine : les media queries `sm`/`md`/`lg` de `app.css` répondent à la fenêtre, pas à la largeur du cadre simulé. Dans un canevas de 390 px sur un écran 1280, `md:flex` gardait donc la navigation desktop active et celle-ci débordait.
- Correctif : nouvelle couche `public/css/editor-canvas-viewport.css`, chargée uniquement par `public/index.html`. Elle neutralise les utilitaires de breakpoint définis (base puis sm/md/lg) sous `#canvas-container[data-viewport="mobile"]` et `[data-viewport="tablet"]`, avec une spécificité d’identifiant qui bat les règles média et des valeurs de base copiées à l’identique depuis `app.css`.
- En tablette, seuls les utilitaires `lg` sont neutralisés puis les utilitaires `sm`/`md` sont ré-affirmés, afin de respecter la vraie progression mobile-first.
- Frontière sûre : renderer et export ne référencent jamais cette couche ; les sites clients gardent leurs media queries.
- Performance : `#canvas-container` n’anime plus `width` ; la bascule d’appareil ne déclenche plus un recalcul complet de la page.
- Vérification navigateur : mobile 390 = navigation desktop masquée et hero empilé ; tablette 768 = navigation desktop conservée ; ordinateur inchangé.
- Tests : 4/4 tests d’intégrité éditeur, 250/250 complets, `git diff --check` et `node --check` propres ; détecteur Impeccable exécuté (avertissements de palette/shimmer préexistants, déjà couverts par la DA validée).
- Prochaine action exacte : rotation et redimensionnement d’objets déjà tournés ou scalés (géométrie AABB écran vs coordonnées locales, `transform-origin` unique).

## LOT DE LIVRAISON — édition visuelle fiable 4.8.0-alpha.43 — 15 septembre 2026

- Cause racine corrigée : `commitFieldUpdate` mutant l’état avant `pushHistory`, chaque modification de texte, de cellule et de champ inspecteur enregistrait un instantané déjà modifié ; Undo était donc un no-op silencieux pour une grande partie de l’édition.
- Correctif : `beginFieldEdit` capture la valeur d’avant-édition (au focus ou à la première frappe), `commitFieldUpdate` restaure cette valeur avant de pousser l’historique puis applique le résultat. Undo annule, Redo rétablit, testé sur une cellule `data-editable` du tableau.
- Contrôles : les barres alignement/calques/responsive partagent une pile unique mesurée qui bascule au-dessus de la sélection quand le bas du canevas est occupé, avec défilement horizontal borné.
- Chrome : le dock de contact client et les repères Freeform sont retirés du mode édition et de l’aperçu.
- Tactile : boutons et poignées passent à 44 px sous `pointer:coarse`.
- Mouvement : animations suspendues pendant un transform Freeform pour stabiliser les mesures de sélection et de magnétisme.
- Détecteur Impeccable exécuté sur `studio-v3.css` et `app.js` : deux avertissements préexistants consignés (transition de largeur du canevas, dégradé indigo).
- Tests : 3 nouveaux tests d’intégrité d’interaction, 36/36 ciblés éditeur/V3 puis 249/249 complets ; `git diff --check` et `node --check` propres.
- Prochaine action exacte : traiter l’aperçu mobile/tablette simulé (container queries) puis la transition de largeur du canevas, avant rotation/redimensionnement d’objets tournés.

## LOT EN COURS — remise en état éditeur visuel Canva / Figma — après 4.8.0-alpha.42

- Priorité utilisateur : ratisser largement les aberrations graphiques et fonctionnelles de l’éditeur (boutons, cellules, overlays, gestes Freeform, responsive simulé et animations), avant le bundling.
- Checklist : nouveau bloc P0 ajouté avec audit 1440/1024/390, collisions, modèle spatial des cellules, feedback/persistance, animations, matrice souris/tactile/clavier et simplification des commandes.
- Audit navigateur initial à 1280 : en mode Desktop, le site est comprimé dans la zone centrale et le header casse ; en mode Mobile simulé à 390 px, les media queries suivent encore la fenêtre 1280 px, donc navigation desktop et gros CTA débordent hors du canvas. Le dock de contact client et le launcher IA recouvrent aussi la surface d’édition.
- Audit code P0 confirmé : l’édition inline mute l’état avant la création de l’historique, rendant Undo potentiellement inopérant ; les trois barres Freeform peuvent converger au même Y près du bas ; cibles tactiles resize trop petites ; animations et mesures Freeform peuvent se disputer la géométrie.
- Skill Impeccable : installé globalement dans `/Users/kevinmokai/.dsh/skills/impeccable` depuis `pbakaus/impeccable`, puis chargé dans la session.
- Premier lot prévu : transaction Undo réelle pour l’édition inline/cellules, placement anti-collision des barres Freeform, cibles tactiles, neutralisation du chrome client en édition et garde-fous de mouvement pendant les transforms.

## LOT DE LIVRAISON — terminal IA fidèle au réseau 4.8.0-alpha.42 — 15 septembre 2026

- Progression : les étapes ne sont plus cochées par délais décoratifs ; rédaction, assemblage, design et finalisation avancent selon la réponse réseau et la construction effective du projet.
- Transparence : HTTP 429, erreur réseau ou réponse invalide annoncent le modèle local au lieu de simuler une génération IA réussie.
- Accessibilité : état courant exposé, annonce `role=status` et animations neutralisées si le mouvement est réduit.
- QA navigateur : génération locale réelle depuis le wizard, terminal affiché puis éditeur ouvert sur le projet `Jardin Test`; 11/11 tests async ciblés et 246/246 complets couvrent réponse lente, succès et rate limit ; syntaxe et `git diff --check` propres.
- Prochaine action exacte : établir la mesure initiale poids/requêtes avant toute décision de bundling ou migration Vite.

## LOT DE LIVRAISON — édition CTA/cellules sans collision 4.8.0-alpha.41 — 15 septembre 2026

- Interaction : un CTA ne déclenche plus le pointeur Freeform par propagation. Son panneau conserve taille, casse, rayon, animations et suppression ; « Position » bascule volontairement vers le cadre de manipulation.
- Géométrie : une cible unique utilise son parent éditable immédiat comme limite de redimensionnement ; une cellule de carte ne peut plus envahir la colonne suivante.
- Chrome : popover et badge CTA sont masqués pendant l’édition Texte/Section/Freeform ; poignées Move/Rotation placées dans les coins internes et libellé agrandi.
- Fichiers produit : `public/js/app.js`, `public/js/components/renderer.js`, `public/css/app.css`, `public/css/studio-v3.css`.
- Tests : 33/33 ciblés V3 puis 244/244 complets ; `git diff --check` propre.
- Restant : QA navigateur des gestes Freeform avancés, terminal IA fidèle au réseau, mesure bundling. Les faux avis Google restent volontairement inchangés.
- Prochaine action exacte : exécuter un contrôle navigateur CTA → Position → resize dans une carte, puis traiter la progression du terminal IA sans rouvrir le design vitrine validé.

## LOT DE LIVRAISON — wizard accessible et fontes dédupliquées 4.8.0-alpha.40 — 15 septembre 2026

- Wizard : nom, métier, ville, téléphone, région, preset, ambiance, tonalité, couleur et email possèdent tous une association `label[for]` / `id` testée.
- Polices : le `@import` Google Fonts du CSS est supprimé ; le `<head>` reste l’unique point de chargement réseau des familles Google.
- Tests : 33/33 ciblés verts sur accessibilité, performance légère et régressions V3 ; 242/242 tests complets verts.
- Prochaine action exacte : synchroniser les étapes du terminal IA avec la résolution effective de la requête, puis mesurer le poids/requêtes avant toute décision Vite.

## LOT DE LIVRAISON — garde-fous API IA 4.8.0-alpha.39 — 15 septembre 2026

- CORS : suppression de `Access-Control-Allow-Origin: *`. La production connue, localhost, l’hôte effectivement servi et les origines explicites `ALLOWED_ORIGINS` sont acceptés ; les autres origines reçoivent 403 sans en-tête permissif.
- Débit : `/api/ai/generate`, `/api/ai/copilot` et `/api/ai/image` consomment un budget par IP, configurable par `AI_RATE_LIMIT_MAX` et `AI_RATE_LIMIT_WINDOW_MS`, avec métadonnées RateLimit et réponse 429.
- Limite connue : compteur mémoire adapté à l’instance Node/Vercel courante ; une coordination globale multi-instance nécessiterait un store partagé, explicitement hors périmètre de cette mission.
- Tests : 16/16 ciblés verts sur CORS, corps de requête, cache et appels IA ; 240/240 tests complets verts.
- Prochaine action exacte : lot léger wizard `label/for` + déduplication de fontes, puis progression IA réseau. Les faux avis Google restent inchangés.

## LOT DE LIVRAISON — PIN de démo honnête 4.8.0-alpha.38 — 15 septembre 2026

- Validation : le PIN doit être explicitement saisi et contenir 4 à 6 chiffres ; l’absence de code ne retombe plus sur `1234` et ne peut jamais déverrouiller une démo.
- Secret : le code enregistré n’apparaît plus dans le bouton, le champ ni le toast. Toute modification révoque l’état déverrouillé courant.
- Portée : la modale explique que la protection concerne uniquement la présentation interne Artist ; un export statique HTML/ZIP reste public.
- Tests : 22/22 ciblés et 239/239 complets, dont secret absent du HTML de partage et vérification sans PIN impossible.
- Prochaine action exacte : CORS et rate limit des routes IA, sans ouvrir le chantier de persistance serveur ni modifier les faux avis Google explicitement conservés.

## LOT DE LIVRAISON — rendu et export sécurisés 4.8.0-alpha.37 — 15 septembre 2026

- Frontière de confiance : `createSafeRenderProject()` crée une copie non mutante des données métier avant le renderer commun ; texte visible, attributs et URL deviennent inertes dans l’éditeur, la vitrine et l’export.
- Styles/scripts : couleurs, longueurs, familles typographiques et transformations sont filtrées ; les valeurs insérées dans le JavaScript standalone et le JSON-LD ne peuvent plus fermer leur balise.
- Mutualisation : `public/js/utils/html.js` remplace les six implémentations locales de `escapeHtml` et porte les règles URL/CSS/script testées.
- Validation : 10/10 tests ciblés, 237/237 tests complets, une seule définition de `escapeHtml`, serveur local HTTP 200. Le navigateur Playwright existant s’est bloqué sans résultat et n’a pas été relancé en boucle ; la couverture renderer/editor/export est verte.
- Arbitrages conservés : persistance serveur, audit SEO réel et suppression des faux avis Google restent hors périmètre sur instruction utilisateur.
- Prochaine action exacte : PIN client — retirer le fallback `1234`, ne jamais réafficher le code et annoncer explicitement la portée démo interne avant de traiter CORS/rate limit.

## LOT DE LIVRAISON — coordination des outils flottants 4.8.0-alpha.36 — 15 septembre 2026

- État de départ vérifié : branche `refactor/artist-consolidation`, `main` et branche sur `083534b`, dépôt propre, version `4.8.0-alpha.35`.
- Correction : un coordinateur unique ferme les surfaces concurrentes Texte/Section/Freeform/CTA tout en conservant la sélection et les données freeform. Trois variables CSS documentent l’ordre des couches sous les modales système.
- QA Chrome réel : clic titre À propos => `active=text`, texte visible, freeform masqué, toolbar section opacity 0 ; pointer sur calque => `active=freeform`, texte masqué, freeform visible, toolbar section opacity 0 ; clic contrôle section => autres outils masqués. Zéro erreur console.
- Validation : `node --check public/js/app.js`, 31/31 tests `v3_ui_regressions`, 234/234 tests complets et `git diff --check`.
- Audit additionnel reçu : XSS/escape, PIN, CORS/rate limit, labels wizard, fontes et progression IA confirmés à traiter. Persistance serveur, audit SEO réel et avis Google fictifs sont hors périmètre sur instruction utilisateur.
- Prochaine action exacte : centraliser `escapeHtml`, sécuriser le renderer commun à l’éditeur et à l’export, puis tester des charges HTML malveillantes sur les sections publiques.

## LOT DE LIVRAISON — bibliothèque multi-sélection 4.8.0-alpha.35 — 15 septembre 2026

- Dashboard : case explicite 34×34 par projet, Tout sélectionner sur les cartes visibles, compteur, annulation et suppression groupée. Une sélection active est resynchronisée après rerender et les IDs supprimés sont purgés.
- State : `deleteProjects(ids)` supprime en batch, met à jour `currentProject`, persiste une liste vide et ne réinjecte plus automatiquement `proj-esprit-nature` lorsqu'une bibliothèque stockée existe. Le seed initial reste uniquement un comportement de première ouverture sans stockage.
- QA Chrome : 4 projets initiaux, 2 sélectionnés/supprimés puis 2 persistés après reload ; suppression des 2 restants => `artisite_projects_v11=[]`, reload => 0 projet et aucune démo recréée. Mobile 390 : barre 362 px, overflow horizontal 0, zéro erreur console.
- Validation : 19/19 ciblés, 233/233 complets et `git diff --check`.
- Prochaine action unique : audit renforcé post-stabilisation vitrine/templates/bibliothèque, puis audit/correction des overlays éditeur.

## LOT DE LIVRAISON — validation visuelle template 4.8.0-alpha.34 — 15 septembre 2026

- Composition : `quoteSimulator` est replacé avant `footer`; le footer redevient le dernier bloc visible de la vitrine de référence.
- QA Chrome 1440/390, sur `?vitrine=1` et sur une nouvelle instance `esprit-reference` : root = viewport (1440 puis 390), aucun overflow horizontal, header 1280 px desktop / 390 mobile, hero pleine largeur, ordre identique `header → hero → about → services → gallery → hours → reviews → faq → quoteSimulator → footer`.
- Instance sans faits : 3 placeholders Avis, 7 lignes horaires `À renseigner`, aucune chaîne `5.0/5 — 5 avis`; la structure reste visuellement complète sans inventer de données client.
- Validation : 34/34 ciblés, 232/232 complets et `git diff --check`.
- Prochaine action unique : bibliothèque — sélection multi-projets et suppression groupée explicite.

## LOT DE LIVRAISON — registre de templates 4.8.0-alpha.33 — 15 septembre 2026

- Wizard : trois bases explicites avant génération — Esprit Nature Référence 1:1, Artisan Moderne, Local Chaleureux. Carte active visible, 3 colonnes desktop et pile mobile scrollable.
- Données : `templateId/templateName` persistent dans le projet. Quick Generate choisit une base par défaut selon le métier ; le wizard respecte le choix utilisateur.
- Référence : même ordre/variants/visibilité que la démo canonique, identité prospect réinjectée, aucun `freeformLayout` copié et `certified` reste vide sans preuve.
- Renderer : la composition de référence dépend maintenant du template explicite ; un paysagiste peut utiliser Artisan Moderne sans hériter de la vitrine Esprit Nature.
- Factualité : une référence sans avis/horaires conserve les blocs mais rend 3 slots `Avis client à renseigner` et 7 lignes `À renseigner`; aucune note 5.0/5 ni horaires par défaut inventés. L'ancien test étoiles utilise désormais la fixture démo qui contient réellement des avis.
- QA Chrome : 1440 wizard 3×201 px dans modal 860 px ; 390 wizard 336 px par carte et scroll interne. Créations réelles Artisan Moderne/Esprit Référence ; référence preview 1440/1440, toutes sections pleine largeur, zéro erreur console.
- Validation : 28/28 ciblés, 232/232 complets et `git diff --check`.
- Prochaine action unique : bibliothèque — sélection multi + suppression groupée explicite, puis verrouiller une validation visuelle template anti-régression.

## LOT DE LIVRAISON — démo canonique et historique SPA 4.8.0-alpha.32 — 15 septembre 2026

- Cause racine du signalement vitrine : `openVitrineDemo()` relisait `proj-esprit-nature` dans `localStorage`. Une copie de projet modifiée/freeform pouvait donc devenir la démo publique de référence.
- Correctif : `createEspritNatureDemoProject()` fournit une instance fraîche hors bibliothèque pour `?vitrine=1`; une corruption volontaire du CTA + freeform persistant n'apparaît plus dans la vitrine.
- Navigation : routes `?view=editor&project=…`, `?view=preview&project=…`, `?vitrine=1`, `pushState/popstate` et restauration Retour/Avancer. Le bouton éditeur `Voir le site` cible le projet courant.
- QA Chrome 1440 : vitrine canonique = 1440 px sur body/root, CTA propre, style freeform vide ; Retour dashboard. Dupont : dashboard → éditeur → aperçu → Retour éditeur → Retour dashboard → Avancer éditeur, zéro erreur console.
- Validation : 43/43 ciblés, 228/228 complets et `git diff --check`.
- Prochaine action unique : créer un registre de templates sélectionnable dans le wizard, avec Esprit Nature 1:1 instanciable sans réutiliser la copie de bibliothèque.

## AUDIT RENFORCÉ — post-alpha.31 — 15 septembre 2026

- Régression : suite complète 226/226 et `git diff --check` propres sur `6d70267`; `main` et `refactor/artist-consolidation` synchronisés.
- Diff cumulé `alpha.29 → alpha.31` relu : reparenting + CTA responsive cohérents avec le cap freeform, aucun changement de données projet destructif observé.
- Dette : `public/js/app.js` atteint 5 637 lignes (~240 méthodes) ; le runtime de reparenting reste dupliqué entre l'éditeur et le script standalone de l'exporter. Parité actuelle validée, extraction future recommandée mais non faite dans ce lot d'audit.
- Risque factuel confirmé : plusieurs chemins secondaires contiennent encore des mentions codées en dur de garantie/certification/24/7/avis vérifiés (`renderer`, `generator`, `trades`, `copilot`, `server/gemini`). La checklist d'audit factuel reste ouverte et prioritaire ; aucune de ces mentions n'est déclarée vérifiée par cet audit.
- Cohérence plan : le tableau historique des lots 5–13 est antérieur aux livraisons alpha.7–31 ; un état courant est ajouté au plan sans supprimer l'historique.
- Prochaine action : lot R&D/backlog exploratoire obligatoire, puis reprise des tâches exploitables en privilégiant robustesse et factualité avant toute nouvelle parité Figma lourde.

## LOT DE VÉRIFICATION — production Vercel après 4.8.0-alpha.31

- Git : `main` et `refactor/artist-consolidation` convergent sur `3e08275`, version produit `4.8.0-alpha.31`.
- Propagation : premier fetch HTML encore `alpha.30` avec `x-vercel-cache: MISS`, alors que `/js/version.js` servait déjà `alpha.31`; douze secondes plus tard l’HTML a convergé vers `alpha.31`.
- Santé : `/api/health` renvoie `status=ok`, `platform=vercel`.
- QA production Chrome 390 tactile : titre alpha.31, éditeur ouvert, CTA mobile `is-active`, `aria-expanded=true`, popover entièrement dans le viewport, aucun overflow horizontal ni erreur console.
- Conclusion : aucun décalage persistant Git/production ; fenêtre transitoire de propagation seulement. Aucun bump de version pour ce lot de vérification.
- Validation locale : 226/226 complets et `git diff --check`.
- Prochaine action : audit renforcé après trois lots — suite complète, relecture diff cumulée alpha.30/31, dette/régressions silencieuses, cohérence avec `artist-consolidation-plan.md`.

## LOT DE LIVRAISON — QA responsive et CTA tactile 4.8.0-alpha.31

- Dashboard/éditeur : contrôle Chrome 1440/1024/390, `scrollWidth == clientWidth` sur les surfaces racines ; aucun overflow horizontal ni erreur console.
- Inspecteur responsive : à 1024, drawer 330×720 ; à 390, 374×694, contenu scrollable et bouton `Fermer les propriétés` fonctionnel.
- CTA : `data-cta-editor-bound` évite les listeners dupliqués après les rebinds. Sur tactile, `pointerup` ouvre le popover avant le clic synthétique ; un guard document capture neutralise ce clic retargeté pendant 400 ms.
- QA CTA : 1024 souris et 390 tactile ouvrent réellement `is-active`, `aria-expanded=true`; popover 334,5×110,5 entièrement dans le viewport et aucun overflow.
- Validation automatisée : 51/51 ciblés, 226/226 complets et `git diff --check`.
- Prochaine action : vérifier la version réellement servie par Vercel et documenter tout écart entre Git et production.

## LOT DE LIVRAISON — reparenting inter-sections 4.8.0-alpha.30

- Mode `Page` : activation explicite avant un geste inter-section ; la section sous le centre du calque est surlignée et le mode se désactive visuellement et réellement après un drop réussi.
- Persistance : `parentSectionId` vit dans `freeformLayout` au breakpoint actif ; le renderer émet origine + parents de breakpoint et le runtime déplace le nœud dans une couche absolue de la section cible.
- Géométrie : diagnostic du faux 66×45→88×72 — la première variation provenait du focus/inspecteur avant le geste. La preuve correcte pointerdown→drop conserve 87,625×72 sur Header→Hero puis Hero→Header ; aucune variation fonctionnelle.
- Aller/retour/Undo : revenir vers la section d’origine reste un placement libre absolu dans sa couche, ce qui évite les conversions erronées avec un header sticky ; Reset reste l’action de retour au flow naturel. Undo du retour replace le calque dans la section précédente.
- Cohérence : preview réutilise `applyFreeformReparenting`; standalone exécute son runtime embarqué et a été ouvert dans Chrome avec parent réel `sec-services`, `position:absolute`, 280×80. Validation : 50/50 ciblés, 225/225 complets.
- Prochaine action : QA global dashboard + éditeur 1440/1024/390, avec attention aux changements de géométrie lors de l’ouverture de l’inspecteur.

## LOT DE LIVRAISON — tactile multi-sélection et auto-scroll 4.8.0-alpha.29

- Multi tactile : `Multi +` bascule un mode additif persistant tant que la sélection existe ; les taps ajoutent/retirent les unités de groupe sans dépendre de Shift.
- Cibles tactiles : boutons du label à 34 px minimum en pointeur coarse ; Move et Rotation passent dans les coins internes du cadre pour éliminer leur collision avec `Multi +`.
- Auto-scroll : `resolveEdgeAutoScroll` calcule une vitesse progressive dans une zone de 56 px au bord ; le marquee anime `scrollTop`, recalcule ses hits et annule son RAF à la fin du geste.
- QA Chrome tactile : titre seul → Multi actif → titre+rôle → rôle seul ; cible Multi 50×34 px. QA marquee : +102 px de scroll au bord inférieur, box visible pendant le geste puis proprement retirée, zéro erreur console. Validation : 48/48 ciblés, 223/223 complets et `git diff --check`.
- Prochaine action : débordement contrôlé entre sections et reparenting explicite.

## LOT DE LIVRAISON — groupes imbriqués 4.8.0-alpha.28

- Modèle : les groupes peuvent référencer des `childGroups` avec `parentId` ; leurs `members` restent aplatis pour préserver déplacement, resize, rotation, z-index et export sans nouveau moteur de transform.
- Création : une sélection contenant un groupe complet le conserve comme sous-groupe ; les sélections partielles d’un groupe sont refusées afin d’éviter de corrompre la hiérarchie.
- Dégrouper : un niveau externe est supprimé sans supprimer ses enfants ; les sous-groupes redeviennent racines et Undo restaure le parent.
- UX : Shift-clic ajoute/retire un groupe entier ; un clic sans mouvement sur une multi-sélection non groupée recalcule la hiérarchie, tandis qu’un drag conserve la sélection collective. La barre Responsive est désormais repliée par défaut via `Resp.`.
- QA Chrome : sous-groupe titre+rôle, parent + texte, sélection externe 3 calques, Move +10 sur les 3, ungroup parent puis sous-groupe 2 calques intact et texte seul sélectionnable ; zéro erreur console. Validation : 37/37 ciblés, 221/221 complets et `git diff --check`.
- Prochaine action : ajout/retrait tactile et auto-scroll de bord pendant marquee/drag.

## LOT DE LIVRAISON — responsive assisté 4.8.0-alpha.27

- Adaptation : `adaptFreeformLayoutToViewport` applique un ratio de largeur de référence (desktop 1200, tablette 768, mobile 390) aux coordonnées/dimensions d’un layout sélectionné sans coupler les breakpoints.
- UI : barre Responsive sur le cadre avec copie vers chaque breakpoint, `Hériter D` pour réadapter Desktop vers le breakpoint actif et `Reset ici` pour effacer uniquement le breakpoint courant.
- Stabilité : `updateViewportUI()` resynchronise le cadre immédiatement puis après la transition de 300 ms ; la barre est repositionnée dans `updateFreeformOverlay()` et reste bornée au viewport.
- QA Chrome : Desktop 12/8 → Mobile 3,9/2,6 ; Mobile modifié à 10,9 sans mutation Desktop ; héritage remet 3,9/2,6 ; reset Mobile laisse Desktop 12/8 ; zéro erreur console. Validation : 44/44 ciblés, 219/219 complets et `git diff --check`.
- Prochaine action : groupes imbriqués ou tactile/auto-scroll du marquee, en gardant un chunk borné.

# État de reprise Codex — 15 septembre 2026

## LOT DE LIVRAISON — ratio et bornes de resize 4.8.0-alpha.26

- Ratio : `aspectLocked` est stocké dans le layout du breakpoint ; bouton dédié pour basculer l’état, Shift reste le verrouillage temporaire pendant le geste.
- Resize : poignée diagonale choisit l’axe dominant, recalcule l’autre dimension selon le ratio puis réduit proportionnellement si la section ne permet pas la taille demandée.
- Compatibilité CSS : les dimensions libres imposent aussi `min-width:0`, `min-height:0` et `max-height:none`, ce qui neutralise les vieux presets sans patch spécifique par composant.
- QA Chrome : ratio initial 0,7999907, final 0,7999748 ; CSS calculé 298,016×372,531, état 298,03×372,54 ; resize extrême reste dans la section et unlock supprime `aspectLocked`. Zéro erreur console. Validation automatisée : 42/42 ciblés, 217/217 complets et `git diff --check`.
- Prochaine action : outils responsive pour copier/resetter les layouts entre desktop/tablette/mobile et héritage assisté.

## LOT DE LIVRAISON — snapping resize et spacing 4.8.0-alpha.25

- Resize : les bords manipulés passent dans le même contexte de snap que le déplacement ; guides x/y et Alt fonctionnent aussi sur les poignées.
- Spacing : `resolveEqualSpacingSnap` teste tous les couples voisins compatibles sur l’axe perpendiculaire et propose l’équidistance qui demande le plus petit offset.
- Visuel : guides avant/après et badge de distance en pixels ; l’alignement classique et l’équidistance sont calculés en parallèle et la meilleure accroche gagne.
- Correctif interne : un `DOMRect` ne peut pas être spreadé pour conserver ses coordonnées ; les rectangles sont maintenant copiés explicitement.
- QA Chrome : snap resize à 0,016 px du bord, spacing 22,5/22,5 px avec badge 23 px et zéro erreur console. Validation automatisée : 41/41 ciblés, 216/216 complets et `git diff --check`.
- Prochaine action : ratio individuel verrouillable et contraintes de taille avancées.

## LOT DE LIVRAISON — rotation libre 4.8.0-alpha.24

- Poignée : contrôle de rotation séparé du Move/resize ; masqué automatiquement si la sélection est verrouillée.
- Persistance : `rotation` est normalisée et stockée par breakpoint avec x/y/scale/z ; le renderer utilise la propriété CSS `rotate` pour préserver les transforms existants.
- Groupe/multi : la sélection pivote autour de son centre commun et chaque membre reçoit son angle + ses nouveaux offsets en une seule mutation Undo.
- Précision : Shift quantifie le delta à 15°. Le libellé de sélection est pointer-transparent hors boutons pour ne plus masquer les calques voisins.
- QA Chrome : 28° → reload = 28°, Shift +13° = +15°, groupe +15° avec orbite des deux éléments ; zéro erreur console. Validation automatisée : 38/38 ciblés, 213/213 complets et `git diff --check`.
- Prochaine action : snapping pendant le resize et guides d’espacement/équidistance.

## LOT DE LIVRAISON — ordre et verrouillage des calques 4.8.0-alpha.23

- Ordre : chaque sélection expose arrière-plan / reculer / avancer / premier plan ; les valeurs `z` sont stockées dans le layout du breakpoint actif et passent par une mutation batch Undo-compatible.
- Verrouillage : `project.freeformLocked` conserve les calques verrouillés globalement ; le cadre reste sélectionnable et affiche Déverrouiller.
- Garde-fous : drag direct, poignée Move, resize, flèches, Reset, alignement/distribution, Grouper/Dégrouper et changement de plan refusent toute sélection contenant un calque verrouillé.
- QA Chrome : `z-index` calculé `0 → 1`, lock persistant après rerender, poignées masquées, drag/clavier sans mutation puis déplacement réactivé après unlock ; zéro erreur console.
- Validation automatisée : 37/37 ciblés, 212/212 complets et `git diff --check`. Prochaine action : rotation persistante avec poignée dédiée, snapping angulaire et Undo.

## LOT DE LIVRAISON — calques structurels 4.8.0-alpha.22

- Renderer : les conteneurs visuels significatifs reçoivent `data-layout-node`, transformé par `decorateLayoutKeys` en clé stable `data-layout-key` + `data-layout-type="structure"` dans tous les modes.
- Couverture : cartes/medias Services, À propos, Trust, Stats, Réalisations, Galerie, Avis, FAQ, Process, Certifications, Pricing, Stepper, citation, tableau comparatif et plusieurs blocs custom.
- Hiérarchie : `resolveFreeformPointerTarget` permet de remonter d’un niveau avec ⌘/Ctrl-clic ; le cadre affiche le label métier du calque (`Carte service 1`, `Média service 1`, etc.).
- Marquee : les descendants ne sont plus exclus globalement ; `collapseFreeformMarqueeHierarchy` ne les retire que lorsqu’un ancêtre est lui-même touché, ce qui conserve la sélection fine.
- QA navigateur : titre service → ⌘ contenu → ⌘ carte ; Move +20 sur carte entraîne carte/titre/image +20 ; marquee titre sélectionne le titre, marquee carte sélectionne la carte ; avatar Avis indépendant ; zéro erreur console.
- Tests : 35/35 ciblés (`state` + `freeform_snap` + `v3_ui_regressions`), 210/210 complets et `git diff --check`.
- Prochaine action : ordre de calques (`z-index`), premier/arrière-plan et verrouillage de cibles, puis rotation.

## LOT DE LIVRAISON — marquee multi-sélection 4.8.0-alpha.21

- Marquee : `armFreeformMarquee` démarre uniquement depuis une zone vide et après 5 px ; le rectangle utilise des coordonnées viewport et sélectionne par centre de cible pour éviter les contacts accidentels.
- Shift : la sélection de départ est conservée et fusionnée avec les hits ; toucher un membre d’un groupe étend la sélection à tous ses membres.
- Hiérarchie : le catalogue marquee retient les cibles de layout de premier niveau et ignore les descendants lorsqu’un parent possède déjà une clé, réduisant les doubles sélections CTA/texte.
- Preview : `.is-freeform-marquee-hit` ne modifie pas l’état projet ; pointerup commit la sélection, pointercancel nettoie simplement l’aperçu. Le touch reste volontairement hors scope de ce sous-lot.
- QA navigateur : marquee titre → 1 cible, Shift+marquee rôle → 2 cibles, drag direct du rôle +20 px → titre et rôle +20 px ensemble, rectangle masqué ensuite, zéro erreur console.
- Tests : 32/32 ciblés (`state` + `freeform_snap` + `v3_ui_regressions`), 207/207 complets et `git diff --check`.
- Prochaine action : étendre les clés de layout aux cartes, conteneurs, icônes et blocs structurels sélectionnables.

## LOT DE LIVRAISON — drag direct et snapping 4.8.0-alpha.20

- Drag direct : le corps d’une cible sélectionnée devient draggable après 5 px de mouvement ; le premier clic texte reste dédié à l’édition, puis les gestes suivants peuvent déplacer sans revenir à la poignée.
- Snap : moteur pur `engine/freeform.js` qui choisit la ligne la plus proche parmi start/center/end avec seuil 6 px ; section + éléments voisins alimentent les guides, Alt contourne l’accroche.
- Guides : deux overlays fixes X/Y suivent le snap et disparaissent au pointerup/cancel ; les cibles imbriquées de la sélection sont exclues pour éviter l’auto-snap.
- Fluidité : pendant toute transformation, les transitions de la cible sont neutralisées ; la restauration du scroll de `#editor-main-canvas` utilise désormais un `scrollTo(..., behavior: "instant")` au lieu d’un retour animé.
- QA navigateur : canvas stable à `scrollTop=986` avant/live/après commit, drag Alt +35 px exactement, second drag vers +4 px accroché à 0 px avec guide à `x=442,94`, guide masqué au relâchement, zéro erreur console.
- Tests : 30/30 ciblés (`state` + `freeform_snap` + `v3_ui_regressions`), 205/205 complets et `git diff --check`.
- Prochaine action : marquee de multi-sélection par glisser dans le vide, puis extension des clés de layout aux conteneurs/cartes.

## LOT DE LIVRAISON — resize groupe et alignement 4.8.0-alpha.19

- Resize groupe : une sélection groupée expose les huit poignées ; la transformation conserve le layout naturel et applique `scaleX/scaleY` autour de l'origine de chaque membre, avec déplacement relatif du membre quand le bord nord/ouest bouge.
- Ratio : Shift sur une poignée d'angle verrouille une échelle uniforme ; les facteurs sont normalisés dans `state.js`, sauvegardés par breakpoint et rendus par le CSS libre jusque dans l'export.
- Alignement : six commandes d'alignement et deux distributions H/V sont batchées via `setFreeformLayouts`, donc une opération = un point Undo.
- Validation navigateur : groupe À propos élargi de +80 px (`282,03 → 362,03`), `scaleX=1.2837` sur les deux membres après reload ; distribution verticale ramenée à deux gaps de 44,5 px et horizontale à deux gaps de 98 px, sans erreur console.
- Tests : 24/24 ciblés (`state` + `v3_ui_regressions`), 199/199 complets et `git diff --check`.
- Prochaine action : drag direct du corps sélectionné + guides/snapping, puis marquee de multi-sélection.

## LOT DE LIVRAISON — multi-sélection et groupes 4.8.0-alpha.18

- Sélection : Shift-clic ajoute/retire une cible et le cadre libre devient l’union visuelle de la sélection ; les poignées de resize individuel sont masquées tant que plusieurs éléments sont sélectionnés.
- Groupes : `project.freeformGroups` conserve les membres ; Grouper/Dégrouper passe par l’historique et un clic normal sur un membre rappelle le groupe entier.
- Transformations : déplacement souris et clavier utilise `setFreeformLayouts` pour appliquer toutes les géométries dans une seule mutation et donc un seul Undo. Reset est lui aussi batché.
- UX viewport : si une sélection remonte hors écran, la barre Grouper/Dégrouper/Reset et la poignée Move sont rabattues dans la zone visible.
- Validation navigateur : deux éléments Hero groupés, déplacés ensemble de `(+18,+24)`, Undo restaure les deux sans supprimer le groupe, puis Dégrouper ; zéro erreur console. Tests : 23/23 ciblés, 198/198 complets et `git diff --check`.
- Prochaine action : resize collectif proportionnel/non proportionnel du groupe, puis alignement/distribution.

## LOT DE LIVRAISON — fondation Canva/Figma 4.8.0-alpha.17

- Modèle : `project.freeformLayout` stocke x/y/width/height/z par clé stable et par breakpoint `desktop/tablet/mobile`; chaque mutation passe par l’historique projet.
- Cibles phase 1 : les textes éditables, images et CTA disposent d’une `data-layout-key` neutre identique en éditeur, preview et export, sans exposer les contrôles `data-ui-*` dans le public.
- Interaction : sélection unique, cadre flottant, poignée Move, huit poignées de redimensionnement, Reset et déplacement clavier 1/10 px. Les gestes utilisent Pointer Events et ne reposent pas sur le drag HTML5 du canvas.
- Responsive : le CSS généré isole les trois breakpoints et le viewport simulé de l’éditeur prévaut sur la largeur physique de la fenêtre.
- Validation navigateur : H1 déplacé/redimensionné, image et CTA sélectionnables, desktop `500×180 @ (40,10)` vs mobile `300×160 @ (5,7)` dans la même fenêtre, zéro erreur console. Tests : 37/37 ciblés, 196/196 complets et `git diff --check`.
- Prochaine action : multi-sélection Shift, groupes persistants, group/ungroup et déplacement collectif.

## LOT DE LIVRAISON — images et modales V3 4.8.0-alpha.16

- Images imbriquées : le helper d’image utilise désormais le chemin de donnée réel pour ouvrir, déposer et supprimer (`services.N.image`, `items.N.image`) au lieu du champ générique `image`; application et Undo vérifiés en navigateur.
- Modales : la surface V3 est bornée à `100vh - 32px`, les corps Image/Share/Closer scrollent dans leur propre zone et ne repoussent plus header/footer hors écran.
- Focus : Wizard, Closer, Share, Command Palette, Ajouter et Image reçoivent un focus initial déterministe ; Escape ferme les surfaces.
- Validation navigateur : 1440×900, 1024×800 et 390×844, surfaces dans le viewport, aucun message console.
- Nouveau cap demandé : éditeur libre type Canva/Figma. Prochaine action bornée : modèle de layout persistant + sélection universelle + déplacement/redimensionnement initial, puis commit séparé avant multi-sélection/groupes.

## LOT DE LIVRAISON — interactions V3 4.8.0-alpha.15

- Sélection : `section_selected` synchronise désormais canvas, lignes `.studio-v3-sectionrow`, contexte de scène et contenu de l’inspecteur sans détruire son shell.
- Responsive : sous 1280 px, l’inspecteur devient un drawer explicite au lieu de disparaître ; à 390 px il remplace le panneau Structure ouvert et conserve les champs de section.
- Réorganisation : le drag/drop et son nettoyage ciblent désormais à la fois le DOM historique et les lignes V3 ; les flèches clavier sur la poignée utilisent le même moteur d’état.
- Validation navigateur : édition d’un champ Services réussie à 1280, 1024 et 390 px ; sélection, visibilité, drag souris, réordre clavier, Undo et Assistant validés sans erreur console. Tests : 27/27 ciblés, 191/191 complets, `git diff --check`.
- Prochaine action : sélecteur d’images + contrôles CTA/popovers, puis audit des modales/focus/scroll.

## LOT DE LIVRAISON — stabilisation V3 4.8.0-alpha.14

- Base auditée : `f49ec7f feat(ui): ship structural V3 product experience` récupéré depuis `origin/main`; les 184 tests historiques passaient mais ne couvraient pas les collisions et ruptures de navigation V3.
- Réglages : `setSidebarTab()` rerend désormais immédiatement la surface V3 et rebinde les interactions ; plus de bascule différée après une autre action.
- Canvas : preview appareil piloté par état explicite `data-viewport`, largeur réelle 768/390 px après transition ; la toolbar section dispose d’une voie éditeur dédiée et ne recouvre plus le contenu client.
- Mobile : séparation stricte entre dock d’édition V3 et sticky call bar client ; le mode aperçu masque le chrome inférieur éditeur.
- Qualité : appel `getIcon()` invalide corrigé (plus de `width/height=[object Object]`) et actions de structure agrandies.
- Contrôle navigateur : Chrome headless 1440 × 900 et 390 × 844, aucun message console SVG, toolbar/content = 0 px de recouvrement, Réglages immédiat. Tests : 39/39 ciblés, 189/189 complets et `git diff --check`.
- Prochaine action : vérifier l’édition réelle sous 1280 px où l’inspecteur droit est masqué, puis rejouer sélection/visibilité/drag-drop/texte/image/CTA/Assistant/Undo.

## LOT DE LIVRAISON — déduplication génération 4.8.0-alpha.13

- `server/apiHandler.js` maintient une promesse `in-flight` par `generationCacheKey` exacte : deux requêtes concurrentes identiques n’appellent plus deux fois le modèle.
- Les contextes différents restent isolés par la clé SHA-256 existante ; le test concurrent vérifie explicitement un téléphone différent en parallèle.
- Le résultat réussi est placé dans le cache TTL avant suppression du slot en cours, évitant une course entre fin de génération et remplissage du cache. Les erreurs ne sont pas conservées dans ce cache.
- Tests : 10/10 backend ciblés (`generation_cache`, `request_body`, `server`), 184/184 complets, `git diff --check`. Prochaine action : audit factuel des prompts de génération, sans réseau.

## LOT DE LIVRAISON — stabilité IA 4.8.0-alpha.12

- `generateAIPhoto()` capture désormais le projet et la cible image d’origine ; `beginAIRequest("image-photo")` invalide la réponse après changement de projet ou modification du projet pendant l’attente.
- La cible active (section/champ/index) est revérifiée après chaque attente réseau/JSON/fallback. Changer de cible ou fermer le modal invalide aussi la génération en cours.
- `applyGeneratedAIPhoto()` refuse un candidat généré pour une autre cible et ne peut donc plus injecter une ancienne image dans un nouveau champ.
- Tests : 9/9 `ai_stale_response`, 183/183 complets, `git diff --check`. Prochaine action : déduplication des requêtes de génération IA simultanées identiques côté API, avec modèle simulé.

## LOT DE LIVRAISON — template 4.8.0-alpha.11

- Le simulateur de devis devient un vrai bloc de template éditable : labels, listes prestation/taille/délai et CTA sont pilotables depuis la sidebar.
- Le délai souhaité est maintenant visible dans le formulaire public et utilise les données du projet au lieu de rester dormant dans le modèle.
- Footer : contenu et coordonnées de section modifiables directement, sans architecture parallèle.
- Tests : 16/16 ciblés (`vitrine_conversion_path`), 180/180 complets et `git diff --check`. Prochaine action : audit de couverture final des champs vitrine et contrôle visuel éditeur.

## LOT DE LIVRAISON — éditeur 4.8.0-alpha.10

- Suppression/restauration des CTA validée avec Undo immédiat ; le comportement existant est conservé.
- Drag-and-drop sidebar validé de la poignée jusqu’à `state.reorderSections`; poignée transformée en contrôle focusable avec `aria-label`.
- Contrôles éditeur critiques : focus visible orange explicite et contraste renforcé de la poignée.
- Tests : 36/36 ciblés (`v410_enhancements`, `v410_features`, `state`, `full_system_e2e`), 180/180 complets et `git diff --check`. Prochaine action : reprendre le prochain lot produit restant sans modifier les proportions de la vitrine validée.

## LOT DE LIVRAISON — éditeur 4.8.0-alpha.9

- Identifiants stables `#E…` générés à partir du projet/section/champ et affichés hors du texte pour les sections, champs, images et boutons en mode éditeur.
- Le registre Copilot couvre désormais les feuilles de contenu imbriquées et résout soit l’identifiant interne, soit la référence courte visible.
- Les instructions ciblées de remplacement de contenu n’altèrent que le champ résolu et la mutation approuvée conserve le chemin Undo.
- Tests : 11/11 ciblés (`gold`, `v410_enhancements`), 178/178 complets et `git diff --check`. Prochaine action : suppression/restauration des boutons, drag-and-drop des sections et contraste des contrôles.

## LOT DE LIVRAISON — éditeur 4.8.0-alpha.8

- Fonds : parité corrigée entre éditeur, rendu public et export standalone ; les conteneurs internes ne recouvrent plus le fond choisi.
- Typographie : Titres et Texte sont des cibles séparées, le catalogue reste dédupliqué, l’aperçu est immédiat et les changements passent par l’historique Undo.
- Boutons : `buttonRadius` ne modifie plus `borderRadius`; tous les CTA de conversion importants suivent `--cta-radius` jusque dans l’export.
- Animations : la vitesse devient une variable projet/export, les presets exportés ont leurs propres keyframes, et `prefers-reduced-motion` arrête les boucles.
- Validation : 37/37 ciblés, 177/177 complets, `git diff --check`. Prochaine action : IDs visibles de tous les composants éditables + opérations IA ciblées Undo.

## LOT DE LIVRAISON — vitrine 4.8.0-alpha.7

- Référence utilisateur du 14/09 : les écarts restants étaient le header, le contenu À propos, la hiérarchie FAQ et le souhait d’une carte interactive. Les sections Services/Galerie/Avis validées n’ont pas été refondues.
- Header : hauteur 5rem, canevas interne 80rem, typo 18px/700 pour la marque, navigation 14px/500 et CTA 14px/600. Les labels issus de `content.links` peuvent être modifiés dans le SaaS tout en conservant les cinq ancres publiques.
- À propos : badge de démo « Artisan certifié » restauré parce qu’il figure explicitement sur la capture de référence ; le récit, rôle et CTA correspondent aux données de référence. `generateSite()` hors démo continue de produire `certified: ""`.
- FAQ : `FAQ` est le surtitre et `Questions fréquentes` le titre. L’accordéon/ARIA reste inchangé.
- Horaires : carte Google interactive par défaut à partir de `address`/`city`, lien itinéraire conservé ; `mapMode: image` permet une carte statique personnalisée.
- Éditeur vitrine : nouveaux contrôles pour identité/navigation, À propos + portrait, images Services, Avis et Horaires/carte ; réutilisation des contrôles Hero, Galerie, FAQ et CTA déjà présents.
- Export : correction de `UTILITY_CSS` (`md:flex !important`) afin que `.hidden !important` ne masque plus la navigation desktop. Screenshot standalone du header contrôlé à 1624 × 900 px.
- Validation : `vitrine_conversion_path` 15/15, suite complète 173/173, `git diff --check`. Commit fonctionnel poussé : `cbcac39`.
- Prochaine action exacte : fonds, typographie, rayon global de boutons et animations dans l’éditeur ; ne pas rouvrir les proportions de la vitrine sans régression mesurée.

## LOT DE LIVRAISON — vitrine 4.8.0-alpha.6

- Services, Galerie, Avis, Horaires & Lieu et FAQ partagent maintenant le même `vitrine-shell` 112rem que À propos et le header ; aperçu et export autonome restent synchronisés.
- Les proportions internes ont été rééquilibrées : titres secondaires communs, cartes Services plus respirantes, Avis 96rem, Horaires 92rem, FAQ 80rem.
- Correctif mobile ajouté sans toucher au desktop : grille À propos forcée en une colonne avant 1024 px, hauteur minimale de l’image retirée sous 640 px et CTA autorisés à revenir à la ligne. À 390 px, `scrollWidth = 390` et aucun élément ne déborde.
- Validation : 25/25 (`vitrine_conversion_path`, `hero_surface`, `exporter`, `gold`, `v440_fixes_and_dashboard`) + `git diff --check`. Chrome/CDP : tous les shells ciblés = 1440/1440 px ; header `sticky`, `top: 0` après 4700 px de scroll.
- Suite complète : 170/170. Le test historique du Sticky Call Bar vérifie désormais le lien `#simulateur` et son libellé accessible plutôt qu’un ancien texte d’interface.
- Prochaine action exacte : reprendre les réglages fonctionnels de l’éditeur (fonds, typographie, rayon des boutons, animations), sans rouvrir les proportions vitrine sauf régression mesurée.

## LOT VALIDÉ LOCAL — vitrine 4.8.0-alpha.4

- Cause racine du manque de largeur : `.vitrine-shell` était déclaré avant `.max-w-7xl` avec la
  même spécificité ; le navigateur conservait donc 80rem malgré l’annonce de 112rem. Le sélecteur
  `.max-w-7xl.vitrine-shell` rend maintenant la largeur effective.
- Hero desktop : hauteur `min(100svh - 6.25rem, 56.25vw)`, soit 1440 × 810 px mesurés ; mobile
  conserve un minimum de 78svh. Header porté par la section sticky, visible à 4700 px de scroll.
- Pattern intégré depuis `/Users/kevinmokai/Projects/ui-intelligence` : transition InView adaptée
  en CSS natif pour les destinations d’ancre (440 ms, translation 1.1rem, flou 3px), sans reprise
  du code React tiers et avec fallback `prefers-reduced-motion`.
- Tests exécutés : 25/25 (`vitrine_conversion_path`, `hero_surface`, `exporter`, `gold`,
  `v440_fixes_and_dashboard`) et contrôle Playwright 1440/1920/390 px. Prochaine action exacte :
  proportions Services/Galerie, puis lot éditeur fonds/typo/rayon/animations.

## LOT PRÊT À PUBLIER — vitrine 4.8.0-alpha.3

- Références appliquées : profil premium minimal, composition éditoriale ample et navigation
  d’ancre discrète ; aucune animation décorative ajoutée. Le dépôt `ui-intelligence` a été
  consulté selon son protocole, sans importer son code tiers.
- Correctifs : header vitrine avec liens noir explicite et espacement stable, shell à 112rem,
  CTA À propos séparés, FAQ en rangées pleine largeur, footer vitrine dédié et dock téléphonique
  retiré du rendu public paysagiste (conservé dans l’éditeur).
- Checklist durable ajoutée : `docs/EXECUTION-CHECKLIST.md`. Elle impose une mise à jour dans le
  même commit que toute modification et consigne état, tests, version, anomalies et prochaine action.
- Validation effectuée : 24/24 tests ciblés (`vitrine_conversion_path`, `exporter`, `gold`,
  `v440_fixes_and_dashboard`), `git diff --check`, contrôle Playwright 1440/390 px. Le header
  calcule `rgb(38, 38, 38)`, le dock public est absent et les CTA n’ont pas de recouvrement.
- Prochaine action après publication : vérifier les proportions hero/services/galerie avec les
  captures, puis reprendre les contrôles éditeur fonds/typographie/rayon/animations.

## LOT EN COURS — vitrine 4.8.0-alpha.2

- Écart traité : les références utilisateur montrent que les cartes Horaires et Avis sont
  visuellement trop compactes. Cause identifiée : les utilitaires responsives présents dans le
  HTML (`sm:p-8`, `sm:text-lg`, etc.) ne sont pas tous fournis par `public/css/app.css`.
- Correction préparée : classes vitrine explicites pour taille, padding et rythme des blocs
  Horaires, Avis et FAQ ; mêmes règles injectées dans l’export HTML. Version visible portée à
  `4.8.0-alpha.2` dans package, titre et badge runtime.
- Fichiers modifiés : `public/css/app.css`, `public/js/components/renderer.js`,
  `public/js/engine/exporter.js`, `package.json`, `public/index.html`,
  `public/js/version.js`, `CHANGELOG.md`, ce suivi et le plan.
- Tests à exécuter avant commit : vitrine/export ciblés, cohérence de version, contrôle
  navigateur desktop et mobile. **Exécutés : 20/20** (`vitrine_conversion_path`, `exporter`,
  `v440_fixes_and_dashboard`) et `git diff --check` ; mesure Playwright à 1440/390 px réussie.
- Mesures réelles : à 1440 px, Horaires 528 × 541 px par colonne ; Avis 400 × 328–342 px.
  À 390 px, Horaires 358 × 469/400 px et Avis 358 × 296–318 px : aucun écrasement horizontal.
- Prochaine action exacte après publication : reprendre le lot éditeur des contrôles de typographie,
  fonds, rayon et animations avec tests ciblés, sans toucher aux données de vitrine existantes.

## REPRISE COURTE — priorité vitrine (prévaut sur l'historique)

- Lot de fiabilité contenu : une nouvelle vitrine paysagiste ne génère plus la mention
  non vérifiée « Artisan certifié ». Le champ reste disponible pour un client qui peut
  fournir cette information. Les projets déjà personnalisés ne sont pas modifiés.
- Tests ciblés : **20/20** (génération, qualité, vitrine, hero, consolidation) +
  `git diff --check` réussis. Un test historique qui imposait cette mention a été corrigé.

- Sous-lot responsive desktop : aucune largeur horizontale excédentaire à 1280 px ; les
  grilles services et galerie sont réellement sur trois colonnes, la carte conserve sa
  largeur et les sections restent trouvables. Correction de l'utilitaire `gap-7` manquant :
  les liens du menu vitrine ne sont plus collés. Contrôle automatisé ajouté.
- Validation ciblée : **13/13** (vitrine, hero, consolidation) + `git diff --check` réussis.
  L'outil de navigateur local n'a pas offert de viewport 390 px dans ce sous-lot : la
  validation visuelle mobile exacte reste à faire, sans prétendre l'avoir réalisée.
- Sous-lot mobile « Horaires & Lieu » : le template impose une pile à une colonne avant le
  breakpoint desktop, puis deux colonnes réelles 6/12. La carte conserve donc sa hauteur
  minimale de 380 px sur téléphone au lieu d'être comprimée. L'icône de localisation suit
  aussi le système SVG (plus d'emoji isolé). Test de rendu ciblé ajouté ; validation sur un
  navigateur mobile réel reste à faire, l'environnement de prévisualisation local ayant refusé
  sa connexion isolée sur le port de test.
- Prochaine action exacte : vérifier et corriger les contrôles d'édition de présentation,
  services et galerie en mode éditeur, en gardant les mêmes données dans l'export.

- Sous-lot vitrine 1.1 — proportions : le paysagiste utilise systématiquement les cinq
  ancres de la page unique (Services, À propos, Avis, Galerie, FAQ). Le header fixe compense
  l'arrivée des ancres ; la surface est élargie à 96rem, À propos passe en 6/6 avec image
  dominante et les cartes Services gagnent en densité. Les attributs éditables et le parcours
  devis sont conservés. Tests de rendu ciblés : **16/16**, diff propre.
- Prochaine action exacte : aligner la densité des avis et de la FAQ sur les captures,
  puis vérifier le rendu exporté avant de toucher aux outils d'édition secondaires.

- Sous-lot vitrine 1.1 — Avis / FAQ : résumé Google souple, cartes d'avis et texte agrandis,
  espacement élargi. FAQ rapprochée de la référence par des rangées simples sans cadre externe
  et un rythme vertical accru. Les réponses restent `aria-expanded` / clavier et les champs
  éditables sont inchangés. Tests de rendu ciblés : **17/17**, diff propre.
- Prochaine action exacte : vérifier le rendu public/export de cette composition et les ancres
  sur les sections longues, puis seulement reprendre les outils d'édition secondaires.

- Sous-lot export vitrine : correction d'une divergence réelle — l'export HTML embarque sa
  propre CSS et ignorait les nouvelles classes vitrine. Les ancres, 6/12, proportions et FAQ
  sont désormais incluses dans le fichier autonome. Tests export + vitrine ciblés : **19/19**,
  diff propre. Prochaine action exacte : contrôle navigateur borné de l'export/public, puis
  outils secondaires si le rendu ne révèle pas de correction vitrine supplémentaire.

- Sous-lot rendu réel vitrine : Playwright a confirmé que `content-visibility` et l'effet
  Apple global pouvaient faire apparaître les sections longues blanches ou transparentes en
  capture/navigation. La vitrine paysagiste est désormais explicitement `public-mode
  vitrine-template`, tous ses 10 blocs publics sont paintables et l'effet global est désactivé
  (les animations ciblées restent disponibles). Tests ciblés : **20/20** ; contrôle navigateur
  1440 px : 10/10 sections paintables, 0 opaque/fadée. Prochaine action : reprendre les
  contrôles de personnalisation qui modifiaient mal fond/texte, rayon, typo et animations.

- Sous-lot FAQ terminé localement : accordéon compact fermé au départ, déclencheurs natifs
  au clavier avec `aria-expanded` / `aria-controls`, réponse masquée de façon cohérente et
  focus visible. La galerie emploie désormais l'icône vectorielle de recherche, sans emoji.
- Tests ciblés : **12/12** (vitrine, hero, consolidation) + `git diff --check` réussis.
- Prochaine action exacte : vérification responsive groupée desktop/mobile de la vitrine puis
  contrôles d'édition des sections présentation/services/galerie ; conserver l'export cohérent.

- Sous-lot vitrine « Horaires & Lieu » terminé localement : la grille desktop possède
  désormais ses deux colonnes réelles (6/12 + 6/12), sans écraser la carte. La démo
  Montauban affiche une carte-image remplaçable dans l'éditeur ; les autres villes
  restent liées à leur adresse via le lien Maps, sans hériter d'une fausse carte locale.
- Header vitrine : navigation de secours Services / À propos / Avis / Galerie / FAQ
  lorsqu'un template paysagiste n'a pas encore de liens. Les liens masqués réapparaissent
  bien au breakpoint desktop. Le dock de contact se cache pendant le hero et revient après,
  y compris depuis l'aperçu client ; préférence de mouvement réduit respectée.
- Présentation : aucune mention « Artisan certifié » n'est inventée si ce champ est vide.
- Tests ciblés : **12/12** (vitrine, hero, consolidation) + `git diff --check` réussis.
  Vérification de la ressource carte locale : HTTP 200. Validation navigateur desktop/mobile
  complète et export restent à faire ; ne pas prétendre à une conformité visuelle totale.
- Prochaine action exacte : traiter la présentation/services/galerie (puis FAQ compacte),
  en conservant leurs contrôles d'édition et en validant les largeurs desktop et mobile.

- Commit vitrine dédié `cd32f5d` : parcours devis rétabli et aperçu client nettoyé.
  Les CTA convergent vers `#simulateur`, la section est visible par défaut pour les nouveaux
  projets et démos, le bandeau fixe utilise la même cible. Les contrôles de popover sont
  désormais strictement réservés à l'éditeur : ils ne bloquent plus les liens publics.
- Le formulaire a des labels/auto-remplissage ; il ne prétend plus envoyer une demande sans
  endpoint. Après validation locale, il propose appel et WhatsApp. Aucune donnée saisie
  n'est transmise par ce parcours.
- Vérifications : 16/16 ciblés (génération, rendu, hero, parcours devis), syntaxe app/renderer
  et diff OK. Navigateur neuf localhost5186 : CTA -> #simulateur à scrollY5360, formulaire
  visible, soumission affiche les deux actions de contact ; barre « Proposition » absente.
- L'ancienne origine5184 conservait un projet local 9/16 : aucune migration destructrice n'a
  été appliquée aux projets existants. Une démo créée/rechargée sur une origine neuve est10/16.
- Prochaine action vitrine : présentation/services/galerie selon captures, puis FAQ compacte,
  puis vérification mobile390 et export. Ne pas rouvrir les lots backend différés à ce stade.
- Publication : branche `refactor/artist-consolidation` poussée sur GitHub, puis production
  Vercel publiée le14 septembre : https://artisite-prospector.vercel.app
  (`dpl_81B47DRPDeMj2yAsZ5mzLjQ1Xi7W`, READY). Parcours public contrôlé : CTA devis ->
  `#simulateur`, formulaire visible ; aperçu sans ruban « Proposition ».

- Demande utilisateur : vitrine fonctionnelle conforme aux captures AVANT le reste.
  Ordre détaillé révisé dans artist-consolidation-plan.md. Aucun lot supprimé.
- Dernier sous-lot : hero plein cadre, renderer.js + heroStyles.js commun aux rendus et
  export, test hero_surface. Photo/voile/texte ont désormais des couches explicites ; titre
  et sous-titre blancs, dimensions fluides. Aucun projet existant réinitialisé.
- Cause constatée navigateur : utilitaire -z-10 absent et règles de contraste globales
  forçant le titre noir. Avant : photo cachant le titre ; après : titre/sous-titre visibles.
- Tests : renderer + v470 8/8, puis nouveau hero_surface 1/1 ; syntaxe/diff OK.
  Ces tests de markup ne prouvent pas la fidélité100% malgré le nom d'un ancien test.
- Navigateur : desktop1280×720 confirmé ; demande viewport390 mais dernière confirmation
  effective683px (outil redimensionné), donc validation mobile390 complète RESTANTE.
  Textes calculés blancs confirmés après correction finale ; pas de certification WCAG
  pour toute image/tout réglage d'overlay. Barre de proposition encombrante encore visible.
- Serveurs de ce tour :5183 session7591,5184 session3382. Cache ancien constaté sur5183 ;
  confirmation finale sur127.0.0.1:5184. Pas de push, agents non relancés, alpha inchangée.
- DIFFÉRÉ, pas oublié : génération photo async, audit IA, faits non vérifiés, partage,
  sécurité/performance ; conservation des précédents correctifs state/API/cache/async.
- PROCHAINE ACTION EXACTE : parcours vitrine « Demander un devis » : vérifier #simulateur
  et #quoteSimulator, disponibilité de la section cible (démo9/16 visibles), action de contact
  réelle et navigation. Corriger ce blocage avant de poursuivre portrait/services/galerie/FAQ.
- Économie : lire seulement cette tête et le sous-lot concerné, un lot à la fois,
  tests ciblés, aucun nouvel audit/agent. Compaction conversation automatique non pilotable.

## Historique conservé — ne pas relire intégralement à chaque reprise

## État courant — réponses IA tardives protégées

Cette section prévaut sur les états historiques suivants.

- Terminé : public/js/app.js (garde par demande/projet/contenu/vue) et
  tests/ai_stale_response.test.js. Aucun autre périmètre de code modifié.
- Assistant : contrôle après réception, avant repli local et à l'approbation ; une proposition
  périmée est refusée avec notification. Une nouvelle demande invalide la précédente.
  Application unique via historique existant, Undo conservé ; fermeture différée supprimée
  pour ne pas fermer une session plus récente.
- Wizard : départ/retour projet ou fermeture du tiroir invalident la demande, y compris
  pendant le délai final et les étapes animées. Aucun projet ajouté par une réponse périmée.
- Tests ciblés : **15/15** (ai_stale_response, state), syntaxe app.js et diff --check réussis.
  Vraies méthodes App avec DOM/réseau/délais simulés ; pas de validation navigateur,
  pas d'appel réseau, pas de suite complète répétée.
- Aucun agent relancé, aucun push ; version4.8.0-alpha.1 non publiée. Aucun échec ciblé.
- Limites : refus conservateur de toute modification du projet (pas de fusion), requête
  réseau non annulée. Génération photo et audit IA hors périmètre de ce sous-lot.
  Lots UI/partage/faits générés toujours ouverts ; agents historiques inchangés ci-dessous.

**Prochaine action exacte** : protéger generateAIPhoto dans app.js contre un changement de
projet ou de cible image pendant l'attente ; vérifier le parcours application de l'image,
avec réponse différée simulée. Réutiliser la garde si adaptée, sans refonte globale.

## Historique — lecture JSON

## État courant — lecture JSON harmonisée

Cette section prévaut sur tous les états historiques ci-dessous.

- Sous-lot terminé : server/apiHandler.js et nouveau tests/request_body.test.js.
- Corps Node, chaînes/Buffer et objets pré-parsés : objet JSON requis, JSON malformé
  rejeté400, plafond2 Mio UTF-8 rejeté413. Corps brut vide conservé comme objet vide.
- Fragments multioctets conservés ; erreurs/abandon traités. Dépassement : mémoire libérée,
  données suivantes ignorées sans détruire le socket avant la réponse413.
- Objets pré-parsés mesurés après sérialisation : la taille brute initiale (espaces inclus)
  n'est plus disponible ; sa limite reste aussi à configurer au niveau de l'hébergeur.
- Tests : request_body, generation_cache, server **9/9**, syntaxe et diff --check réussis.
  Aucun réseau, aucune suite globale répétée, aucun navigateur requis pour ce lot backend.
- Branche inchangée ; aucun agent relancé, aucun push, version4.8.0-alpha.1 non publiée.
- Aucun échec ciblé restant. Lots UI, partage, faits générés et réponse IA obsolète restent ouverts.

**Prochaine action exacte** : reprendre la protection contre les réponses IA tardives dans
public/js/app.js : repérer uniquement le chemin de génération/enrichissement asynchrone,
empêcher une réponse obsolète d'écraser un projet modifié ou changé entre-temps,
et ajouter un test ciblé avec promesse différée. Ne pas réauditer ni refactoriser globalement.

## Historique — cache génération

## Dernière mise à jour — cache génération corrigé

- server/apiHandler.js : contexte canonique validé (name, trade, city, phone, region,
  tone, ambiance), utilisé à la fois pour le modèle et la clé SHA-256 versionnée.
  Casse préservée, pas de concaténation ambiguë ; configuration modèles/présence de clé prise en compte.
- Validation locale au endpoint generate : objet, champs texte, limite500 caractères par champ.
  Ce n'est pas encore une validation uniforme de tous les corps API.
- tests/generation_cache.test.js simule fetch et vérifie identité/reordering JSON,
  variation de chacun des sept champs, collisions underscore, rejet types/longueurs invalides,
  et absence de réponse cachée si la clé IA est retirée.
- **8/8 ciblés** : generation_cache, ai, server ; syntaxe et diff --check réussis.
  Le nouveau test n'utilise pas le réseau. L'ancien test ai avec clé invalide a reçu des400 Gemini.
  Pas de génération payante, pas de navigateur requis, suite globale non répétée.
- Aucun agent, aucun push. TTL15min et limite300 entrées conservés. Cache mémoire partagé,
  pas un mécanisme d'autorisation utilisateur ; aucun multi-tenant sécurisé revendiqué.
- Le prompt Gemini ignore encore tone/ambiance et contient des exemples de faits non vérifiés :
  sujet distinct, non corrigé ici. Les demandes simultanées ne sont pas encore dédupliquées.

**Prochaine action exacte** : harmoniser readBodyJSON entre requêtes Node et corps pré-parsés
serverless (JSON malformé rejeté, limite en octets, types acceptés explicites), avec tests simulés
sans réseau. Conserver les périmètres et ne pas relancer l'audit.

## Historique — chemins serveur

## Dernière mise à jour — P0 chemins serveur corrigé

Cette section prévaut sur les états historiques ci-dessous.

- server.js rejette avant accès disque les caractères de contrôle/NUL, les encodages
  malformés, antislashs et séparateurs encodés (400). Les chemins résolus hors du dossier
  public sont refusés (403), y compris un dossier voisin commençant par « public ».
- Les erreurs de lecture ne divulguent plus le chemin interne au client.
- Le port réellement alloué est journalisé, permettant un test isolé avec PORT=0.
- Nouveau tests/static_http.test.js : lancement du vrai serveur, dix requêtes invalides,
  contrôle health après chacune ; accueil, repli SPA, CSS/JS et304 ETag vérifiés.
  Le processus de test est arrêté automatiquement, sans toucher les serveurs de prévisualisation.
- Validation : **17/17 ciblés** (static_http, server, v450), syntaxe server.js et diff --check OK.
  Suite globale non relancée dans ce sous-lot ; dernier contrôle global :143/143 avant ajout du test.
- Aucun changement API/cache/frontend, aucun agent, aucun push. Pas de revendication
  de sécurité exhaustive : liens symboliques et durcissement API ne font pas partie de cette correction.

**Prochaine action exacte** : dans server/apiHandler.js, revoir la clé cache de génération
qui ignore des champs envoyés au modèle. Construire une clé exacte à partir du contexte
validé et tester deux requêtes qui ne diffèrent que par téléphone/région, ainsi que le cas identique,
avec un modèle simulé sans dépense réseau. Ne pas lancer une nouvelle exploration générale.

## Historique — accueil/version

## Dernière mise à jour — accueil/version intégré

Cette section prévaut sur les états historiques ci-dessous. Les fichiers accueil/version
précédemment en attente sont intégrés : package.json, index.html, dashboard.js, version.js,
tests/v440_fixes_and_dashboard.test.js et tests/server.test.js.

- Version cohérente **4.8.0-alpha.1**, non publiée.
- Taux calculé signé/total ; estimation fondée sur estimatedValue numérique positif ou nul.
  Valeur inconnue distincte de zéro, nombre de montants renseignés affiché.
- Suppression des promesses de création garantie en trois secondes et labels explicites du formulaire.
- Les deux liens CSS de polices existants ont été conservés : leur suppression partielle
  ne relevait pas du lot version et risquait une régression typographique.
- Première passe ciblée : 7/9 (deux assertions trop larges/ancien titre) ; assertions corrigées.
- Validation finale : **143/143 tests**, syntaxe dashboard.js et git diff --check réussis.
- Navigateur localhost:5182, 1280×720 : titre/badge alpha, taux25% pour1/4 et montant
  Non renseigné avec0/4 confirmés dans l'arbre accessible et la capture. Pas de test mobile/sombre.
- Aucun agent relancé, aucun push. Pas de refonte CSS, ni changement des contrôles du canvas.

**Prochaine action exacte** : reprendre le P0 backend déjà diagnostiqué, d'abord la requête
`/%00` et la résolution des chemins statiques dans server.js ; ajouter un test HTTP réel
qui vérifie une réponse contrôlée et que le serveur reste disponible. Puis seulement le cache API.
Le reste du plan demeure ouvert. Aucun échec automatisé connu à la fin de ce sous-lot.

## Historique — génération

## Dernière mise à jour — sous-lot génération terminé

**Cette section remplace les statuts « génération non intégrée » et les quatre échecs historiques ci-dessous.**

- Nouveau commit : `031e887`, intégration des changements génération/données récupérés et revus.
- Aucun agent relancé. Aucun push. Branche inchangée.
- Séparation generateSite / generateDemoSite ; pas de coordonnées, horaires, avis ou certifications
  préremplis dans le catalogue normal ; médias illustratifs identifiés dans les sections produites.
- Le bandeau d'urgence optionnel reste disponible mais masqué pour les nouveaux projets ordinaires.
- Correctif renderer justifié par régression : les CTA des services non paysagistes ne dépendent plus du prix.
- Les fixtures d'édition profonde et de localisation fournissent explicitement leurs données/visibilités.
- Tests : 34/34 ciblés initialement ; nouveau test couvrant tous les métiers ; contrôle final npm test
  **141/142**. Syntaxe generator.js/renderer.js et git diff --check réussis.
- L'unique échec restant est tests/server.test.js:39, assertion d'ancien titre (lot version).
- Navigateur : localhost:5180 servait des modules périmés en cache. Origine isolée localhost:5181
  utilisée ; aperçu Dupont, six CTA sans tarif présents, clic Chiffrer vers #simulateur confirmé.
  Pas de validation mobile, de contraste globale ou de soumission du formulaire dans ce sous-lot.

Fichiers inclus dans 031e887 : trades.js, sampleProjects.js, generator.js, renderer.js ; tests
generator, trades, full_system_e2e, v420_quality, v470_artist_consolidation, editor_2026,
v430_craft_and_motion et v450_system_audit_and_mvp_features.

**Restent non commités** : package.json, public/index.html, dashboard.js, version.js (nouveau),
tests/v440_fixes_and_dashboard.test.js. Ils constituent le prochain sous-lot accueil/version.

**Prochaine action exacte** : terminer l'affichage du taux calculé (68% encore codé en dur),
aligner le test du titre avec la version déclarée, tester et intégrer seulement ces fichiers.
Puis reprendre le P0 serveur NUL/cache dans son périmètre réservé, sans agent supplémentaire.

Limites du lot 4 : app.js injecte encore des coordonnées, renderer contient encore des labels
commerciaux non vérifiés, createSectionData conserve des exemples ; la FAQ neutre du catalogue
reste peu riche. Ne pas annoncer l'absence globale de faux faits ni une génération métier finalisée.

## Historique de la reprise précédente

## Dépôt et point de reprise

- Worktree : `/Users/kevinmokai/Documents/Codex/2026-09-07/artist-consolidation`.
- Branche : `refactor/artist-consolidation` ; base source `7caf557`.
- `be8600c` : plan initial, AGENTS.md et documentation. Vérifié, ne pas le recréer.
- `67465f5` : préservation des projets personnalisés au rechargement et lors des migrations.
- Aucune publication, aucun push durant cette reprise. Aucune modification de la copie ancienne.

## Terminé

- Audit initial et examen des 16 captures ; baseline 136 tests réussis avant modifications.
- Impeccable installé et guides lus ; son lanceur contexte échouait (permission d'exécution).
- Reprise : état Git, branche, AGENTS.md, plan, historique et états des quatre agents vérifiés.
- Correctif state intégré : conserver toutes les propriétés des projets existants, y compris
  la démo personnalisée, au lieu de les remplacer par les exemples lors du chargement.
- Régression testée sur stockage v11 et migrations v4/v5, en plus des tests CRUD/Undo/réorganisation.

## Agents — ne pas relancer automatiquement

| Agent | ID | Périmètre attribué | Résultat / commit |
|---|---|---|---|
| Anscombe | 01a09b9f-40c6-7550-a0a9-f309bdc88f88 | server.js, server/*, test backend dédié | Erreur quota ; audit et sondes, aucun patch/commit backend |
| Singer | 01a09b9f-415c-7da2-a732-74d72182fae7 | generator.js, trades.js, state.js, tests génération | Erreur quota ; travail partiel retrouvé, aucun commit ; partie state intégrée par principal |
| Lorentz | 01a09ba2-a7b0-7961-bcfc-44febe4851c8 | renderer.js, editor.js, test renderer dédié | Erreur quota ; lecture du contexte, aucun patch/commit livré |
| Pascal | 01a09ba3-27a5-7773-858f-9e1fcd7b7d7f | shareModal.js, shareRoutes.js, test partage dédié | Erreur quota ; aucun patch/commit livré |

Les historiques ont été relus pour récupérer les résultats. Ils n'ont pas de rapport final de réussite.
Le contrôle actuel du quota autorise le travail ordinaire ; les anciens échecs d'agents ne prouvent
pas une saturation actuelle. Aucun crédit réinitialisé ou acheté. Pas de nouvelle vague d'agents.

## Travail présent mais non intégré

Principal, accueil/version :

- `package.json`, `public/index.html`, `public/js/version.js` (nouveau) : 4.8.0-alpha.1, non publiée.
- `public/js/components/dashboard.js` : texte accueil, labels formulaire, badge version, début KPI honnêtes.
- Incomplet : conversionRate calculé mais affichage « 68% » encore codé en dur ; styles non corrigés.

Génération/données et adaptations de tests, à revoir ensemble :

- `public/js/data/trades.js` : distingue catalogue normal et historique de démonstration.
- `public/js/engine/generator.js` : coordonnées vides par défaut, pas d'avis/horaires inventés, generateDemoSite.
- `public/js/data/sampleProjects.js` : adaptation à generateDemoSite et horaires explicites.
- `tests/full_system_e2e.test.js`, `tests/generator.test.js`, `tests/trades.test.js`,
  `tests/v420_quality.test.js`, `tests/v470_artist_consolidation.test.js`.
- `tests/v440_fixes_and_dashboard.test.js` : adaptation/version ; à intégrer avec l'accueil, pas avec state.

Ces changements sont conservés dans le worktree, pas déclarés terminés. Certaines adaptations
dépassent l'affectation initiale stricte de l'agent : leur existence n'autorise pas un commit global.
Ne pas utiliser `git add .`. Aucun agent n'est encore en train d'écrire.

## Tests exécutés et limites

| Vérification | Résultat |
|---|---|
| Baseline avant modifications, principal | 136/136 |
| Baseline des agents génération/backend | 136/136 ; sondes backend ont identifié des défauts hors tests |
| Reprise : `node --test tests/state.test.js` | 9/9 |
| Reprise : `node --check public/js/state.js` | Réussi |
| Reprise : `git diff --check` | Réussi |
| Reprise : `npm test`, une seule passe | 137/141, quatre échecs ci-dessous |
| Build / lint / typecheck | Scripts absents ; non revendiqués |
| Navigateur initial | Accueil et vitrine vus à 1280×720 sur localhost:5180 ; défauts relevés |
| Navigateur après correctif state | Pas rejoué ; persistance/migrations validées par tests avec localStorage simulé |

## Échecs restants précis

1. `tests/editor_2026.test.js:39` — `Trust badges title must have data-editable`.
   La génération partielle supprime les faux badges ; vérifier la couverture de l'édition avec une donnée explicite.
2. `tests/server.test.js:39` — titre attendu `Artisite Prospector v4`, titre alpha devenu `Artist v4.8.0-alpha.1`.
   À traiter dans le lot accueil/version, pas dans le correctif serveur.
3. `tests/v430_craft_and_motion.test.js:60` — iframe de localisation absente dans le scénario testé.
   Examiner visibilité/fixture avec la nouvelle génération ; ne pas conclure sans reproduire.
4. `tests/v430_craft_and_motion.test.js:69` — CTA service éditable absent dans le scénario testé.
   Examiner renderer et variante/fixture ; ne pas supprimer l'assertion sans garder une couverture équivalente.

Risques non corrigés : crash Node via chemin `/%00` confirmé par sonde agent ; clé cache IA
incomplète ; interpolation HTML active ; fausses notifications sociales/PIN partagé ; coordonnées
encore injectées par app.js ; réponses IA tardives ; défauts hero/galerie/CSS et partage non fonctionnel inter-appareils.

## Lots restants et prochaine action exacte

- Lot 2 partiel : sauvegarde terminée ; backend/cache/async restants.
- Lot 3 partiel : accueil/version présents, thème/layout/tests à terminer.
- Lot 4 partiel : intégrer le travail génération/données sans écraser de personnalisation.
- Lots 5–13 : pas de nouvelle implémentation livrée (hero, galerie, avant/après, FAQ,
  personnalisation, partage/export, responsive/motion, sécurité/perf, contre-audit).

**Prochaine action** : lire uniquement les diffs génération/données et les scénarios
`editor_2026.test.js` / `v430_craft_and_motion.test.js` qui échouent. Déterminer fixture obsolète
vs régression réelle ; terminer et tester ce sous-lot avant tout chantier UI ou backend supplémentaire.
L'échec de titre reste réservé au sous-lot version. Les prochains changements doivent être annoncés brièvement.

Arrêt propre après ce sous-lot : aucun nouveau travail lourd lancé. Le chantier global reste ouvert.

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.1 (lot 1/9 de la maturation produit)

Plan complet approuvé en 9 lots (voir docs/EXECUTION-CHECKLIST.md). Décisions utilisateur : comptes
sur serveur Node + fichier de données sans nouvelle dépendance, approfondissement de la direction
studio-v3 sans refonte globale, flux par défaut avec position libre en option, éditeur et design
avant les comptes.

Audit préalable (trois passes indépendantes sur l'éditeur, le design system et la persistance) :
- **Classes sans règle CSS** : 452 classes / 1 863 occurrences mesurées par recensement du balisage
  contre les 4 feuilles. \`text-[10px]\` ×204, \`text-[11px]\` ×136, \`hover:bg-zinc-100\` ×39,
  \`sm:px-6\` ×41, \`dark:text-white\` ×14, etc.
- **Quatre systèmes de jetons concurrents** et \`--primary\` utilisé 13 fois sans jamais être déclaré ;
  1 068 \`!important\`.
- **\`product-precision.css\` morte** : 179/273 règles sans émetteur, écrasée par studio-v3 sur les
  trois sélecteurs encore vivants ; \`studio-v3.css:373-478\` jamais émise.
- **États** : 3 règles \`:focus-visible\` pour 50 \`:hover\`.
- **Éditeur** : aucun état d'élément, aucun modèle de style de section, aucun champ numérique de
  position, deux modèles de sélection jamais effacés ensemble, et \`renderSectionAccordionContent\`
  (830 lignes) inerte dans un \`<template>\` jamais cloné.
- **Undo/Redo** : 11 chemins qui mutent avant l'instantané, 20+ sans historique.

Lot 1 livré :
- \`public/css/tokens.css\` : échelle typographique, espacements, rayons, ombres, rôles de couleur,
  durées/courbes, anneau de focus unique, et déclaration des jetons fantômes. Les \`--v3-*\` deviennent
  des alias.
- \`scripts/build-utilities.mjs\` : relève les classes émises, déduit les manquantes par surface,
  **réutilise d'abord les déclarations déjà présentes** puis synthétise le reste, et écrit deux
  artefacts depuis une source unique (\`public/css/utilities.css\`, \`public/js/engine/utilitiesCss.js\`).
  Importable par les tests ; \`npm run build:css\` / \`npm run check:css\`.
- Détection de sélecteur corrigée : exiger un caractère de sélecteur après le nom évite les faux
  positifs sur du JavaScript (\`toast.style.transform =\` faisait croire que \`.transform\` était définie).
- \`exportStyles.js\` séparé en \`BASE_UTILITY_CSS\` + couche générée ; \`index.html\` charge jetons puis
  utilitaires ; \`package.json\` expose \`build:css\` et \`check:css\`.
- Nettoyage : dégradé indigo→violet du chrome remplacé par la couleur d'accent, \`animate-ping\` et
  \`animate-bounce\` retirées, CTA d'en-tête rendu insécable (repli de libellé supprimé).
- \`tests/design_system.test.js\` : 8 tests, dont l'autosuffisance du HTML autonome exporté (chaque
  classe du fichier exporté possède une règle dans ce même fichier). **280/280 tests complets.**

Vérifications : générateur idempotent (\`--check\`), comparaison visuelle avant/après via un worktree
sur \`fe06c75\` (dashboard 1280 identique, éditeur vérifié en 1280), aperçu client pleine largeur
vérifié en 1280 (en-tête sur une ligne, aucun chevauchement), détecteur Impeccable exécuté sur les
fichiers modifiés (alertes pré-existantes sur \`btnShimmer\`, halo rouge et fond quadrillé ; une alerte
\`gray-on-color\` est un faux positif d'appariement d'utilitaires).

Reste ouvert après ce lot (à ne pas masquer) : l'en-tête de la vitrine rendu dans le canvas étroit de
l'éditeur est à l'étroit ; 34 classes d'application n'ont toujours aucune règle (liste gelée par test,
à résorber au lot 2) ; les lots 2 à 9 restent à livrer.

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.2 (lot 2a/9)

Périmètre : finition du chrome produit avant les lots fonctionnels (sélection, inspecteur, états,
positionnement, mouvement, undo, comptes).

Livré :
- \`public/css/product-precision.css\` supprimé (179/273 règles sans émetteur, thème de modale déjà
  écrasé par studio-v3) ; \`studio-modal-card\` retiré de six modales car il ne restait qu'un marqueur
  orphelin après la suppression.
- Échelle typographique du chrome : 397 remplacements \`text-[Npx]\` → \`text-ui-2xs|xs|sm|base|md\`
  dans les fichiers de chrome uniquement (app.js, editor, inspector, dashboard, palette, modales,
  wizard). \`renderer.js\` (contenu du site) conserve ses 56 tailles calibrées.
- 33 graisses intermédiaires (640…760) normalisées vers 600/700 : les polices chargées ne les
  contiennent pas, le navigateur les synthétisait.
- 7 \`outline:0\`/\`outline:none\` retirés : ils reprenaient la main sur l'anneau \`:focus-visible\` global.
- Contraste : 18 valeurs de texte atténué remplacées par \`--ui-muted\` et \`--ui-muted-on-dark\`.
  Mesures avant → après : 2,16:1 → 5,50:1 ; 2,43:1 → 5,13:1 ; 2,72:1 → 4,78:1 ; 3,24:1 → 7,80:1.
  L'audit automatique des couleurs de texte de studio-v3.css et app.css ne remonte plus aucun échec.
- Bloc \`@media (pointer:coarse)\` complet (44 px) et bloc \`prefers-reduced-motion\` étendu au
  dashboard, aux cartes projet, aux lignes de structure, à l'inspecteur et aux modales.
- \`tests/design_system.test.js\` : +5 tests (chrome sans taille arbitraire, focus préservé, graisses
  standard, seuil de contraste des jetons, feuille morte absente, blocs tactile et mouvement).

Vérifications : \`npm test\` 285/285 ; dashboard, éditeur et modale de commande contrôlés au navigateur
en 1280 après purge du cache ; audit de contraste automatisé ; générateur d'utilitaires rejoué.

Point ouvert mesuré et non masqué : l'en-tête de la vitrine rendu dans le canvas de l'éditeur est à
l'étroit parce que les media queries du site évaluent la fenêtre et non le canvas. La vitrine publique
est correcte. Correction prévue au lot responsive (requêtes de conteneur), pas appliquée ici.

Suite : finir le lot 2 (emojis du chrome, rayons/ombres, densité, dashboard ≤ 760 px) puis ouvrir le
lot 3 (modèle de sélection unique et hiérarchie visible).

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.3 (lot 2b/9)

Livré :
- **Icônes** : 122 remplacements d'emojis/glyphes décoratifs par \`getIcon\` dans le chrome
  (editor 31, addSectionModal 24, shareModal 19, inspector 15, closerModal 11, app.js 10,
  imageModal 5, wizard 5, commandPalette 2). 26 clés ajoutées à \`icons.js\` (63 → 89), toutes au
  format 24×24 / trait 2 / currentColor. Trois clés déjà appelées mais absentes (\`tag\`, \`laptop\`,
  \`upload\`) affichaient un cercle de repli : fournies. Conservés : raccourcis clavier, \`✓\`, \`★\`,
  \`→\`, \`➔\`, \`•\`, \`%\`, contrôles freeform, statuts de terminal du wizard, et tout le contenu du site
  (\`renderer.js\`, \`heroStyles.js\`).
- **CSS mort** : 92 lignes retirées de \`studio-v3.css\` (règles dont toutes les classes étaient
  inutilisées : \`studio-v3-modal-frame\`, \`studio-v3-wizard-*\`, \`studio-v3-share/image/command/
  catalog/closer-frame\`, \`studio-v3-modal-backdrop\`, \`floating-section-toolbar\`). Suppression
  par bloc équilibré, jamais par ligne isolée ; modale de composition et wizard contrôlés au
  navigateur après coup — inchangés.
- **Dashboard ≤ 760 px** : le rail n'est plus \`display:none\` mais devient une barre basse fixe
  (les quatre accès sont conservés, dont le basculement de thème qui était perdu) ; \`padding-bottom\`
  compensatoire ; titres 44 px et 38 px remplacés par \`clamp()\` ; métadonnées de projet réaffichées.
- **Défaut majeur documenté** : le site autonome exporté est cassé (hero superposé, mise en page des
  sections absente). **Reproduit à l'identique sur \`fe06c75\`** : antérieur aux lots 1 et 2. Cause :
  \`public/js/engine/exporter.js\` embarque sa propre copie partielle des styles du site au lieu de la
  source partagée. Consigné en tête de \`docs/EXECUTION-CHECKLIST.md\` avec le plan de correction.
  Le test d'autosuffisance de l'export ne vérifie que la présence d'une règle par classe, pas la
  fidélité de la mise en page — limite reconnue.

Vérifications : \`npm test\` 285/285 ; \`npm run check:css\` à jour (387 règles app, 369 export) ;
modale de composants (icônes) et wizard contrôlés au navigateur en 1280 ; comparaison de l'export
autonome courant et de la base \`fe06c75\` servis localement (les deux cassés de la même façon).

Suite : lot 3 — modèle de sélection unique, fil d'Ariane, liste des éléments, suppression des
880 lignes inertes de \`renderSectionAccordionContent\`.

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.4 (lot 8/9)

Motif corrigé (relevé par l'audit, vérifié en lecture du code) : **onze commandes** modifiaient
l'état puis poussaient l'instantané — state.pushHistory enregistrait donc un état déjà modifié et
une pression sur « Annuler » ne restaurait rien de visible. Vérifié : toggleStickyBar,
updateWhatsAppNumber, switchGlobalTheme, adjustFieldFontSize, toggleActiveTextBold,
toggleActiveTextItalic, toggleActiveTextUnderline, et les deux curseurs de taille de texte.
**Vingt commandes** n'avaient aucun historique : mode de navigation, preuve sociale, code PIN client,
assombrissement du hero, et les six state.updateProject(updated, false) des animations.

Correctif : l'instantané est pris **avant** chaque mutation, et state.pushHistoryCoalesced regroupe
les mutations continues (curseurs de taille de texte, assombrissement du hero) pour qu'un mouvement
continu ne produise qu'une entrée. Les six updateProject(..., false) passent en true : une entrée
par clic, correct pour des boutons, à affiner pour d'éventuels curseurs.

Vérifications : node --check sur app.js et state.js ; tests/undo_coverage.test.js (10 tests) dont
huit parcours complets valeur avant, action, annulation, rétablissement, plus un garde-fou de source
qui échoue si updateProject(..., false) réapparaît ; **295/295 tests**.

Reste ouvert pour ce chantier : les glissers freeform et le glisser du bandeau collant persistent
directement sans transaction ; à traiter avec le lot positionnement (6).

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.5 (lot 9a/9)

Périmètre : moitié serveur de la Mission 3 (comptes et persistance multi-appareils), volontairement
simple comme demandé, sans nouvelle dépendance npm.

Ajouté :
- server/store.js : fichier db.json unique (version, users, sessions, projects), écriture atomique
  (fichier temporaire puis renommage), dossier configurable par DATA_DIR, purge des sessions
  expirées, cache mémoire invalidable pour les tests.
- server/accounts.js : scrypt + sel de 16 octets par utilisateur et comparaison timingSafeEqual ;
  jetons de session aléatoires de 32 octets dont seul le SHA-256 est stocké ; cookie HttpOnly,
  SameSite=Lax, Secure derrière HTTPS, 30 jours configurables ; ownerId par projet ; 404 uniforme
  pour un projet inexistant ou appartenant à autrui ; message de connexion identique dans les deux
  cas d'échec ; freinage de 20 tentatives par IP et par 5 minutes ; refus 503 explicite quand
  l'hébergement n'a pas de disque persistant (VERCEL sans DATA_DIR).
- Routes branchées en tête du routeur de server/apiHandler.js, avant la santé et les routes IA.
- .env.example documente DATA_DIR, SESSION_TTL_DAYS et COOKIE_SECURE ; .data/ rejoint .gitignore.

Vérifications : tests/accounts_api.test.js, 8 tests, dont la vérification que le mot de passe en
clair n'apparaît pas dans le fichier de données, que le doublon d'identifiant répond 409, que la
connexion échoue avec le même message pour un compte inconnu et un mot de passe faux, que deux
comptes ne voient ni ne modifient les projets de l'autre (404 et non 403), et que l'hébergement non
persistant répond 503. **303/303 tests complets.**

Reste pour ce chantier (9b) : le client (api.js, session.js, modale de connexion, pastille de compte
dans le dashboard), la migration des projets locaux à la première connexion avec copie de secours,
et le passage du localStorage en cache hors ligne. Aucun test de navigateur n'a encore été fait sur
ce chantier : la partie serveur est testée, pas l'interface.

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.6 (lot 9b/9)

Client des comptes, qui rend enfin la Mission 3 visible dans l'interface.

Ajouté :
- public/js/api.js : apiFetch unique (same-origin, délai d'attente, ApiError porteuse du message
  serveur). Utilisé par session.js.
- public/js/session.js : fetchSession (connecté / anonyme / indisponible / hors ligne), signIn,
  signUp, signOut, pullProjects, pushProject, removeProject, importProjects, readLocalProjects,
  planMigration (absent, plus récent, plus ancien, invalide), backupLocalProjects.
- public/js/components/authModal.js : modale de connexion / création, deux onglets, branchée sur
  state.activeDrawer comme les autres modales.
- app.js : initAccounts (crochet de sauvegarde + amorçage de session), pullCloudLibrary (fusion en
  gardant la version la plus récente par projet), queueCloudSync (poussée différée de 600 ms),
  openAuthModal, closeAuthModal, switchAuthTab, submitAuth, importLocalLibrary, dismissMigration,
  signOutAccount.
- state.js : sessionUser, authStatus, authTab, authBusy, authError, _migrationPlan, registerSaveHook
  et notification session_change.
- dashboard.js : accountControlHTML (Se connecter / identifiant · Se déconnecter / indisponible) et
  migrationBannerHTML (compter, importer, plus tard) ; studio-v3.css reçoit les styles du bandeau,
  avec ligne mobile et alternative reduced-motion.

Vérifications :
- tests/accounts_client.test.js (7 tests) : erreurs HTTP/réseau, quatre états de session, décision de
  migration, copie de secours, corps de l'import, présence des points d'entrée.
- Bout en bout au navigateur sur un serveur local (PORT=5190, DATA_DIR=/tmp/artist-data) : inscription
  par HTTP 201, connexion par l'interface, en-tête affichant « kevin.test · Se déconnecter » et
  notification de connexion. Le fichier db.json ne contient qu'un hachage scrypt (128 caractères de
  hash, 32 de sel) et un jeton de session haché en SHA-256 ; le mot de passe en clair n'y apparaît pas.
- Un défaut d'affichage a été trouvé et corrigé pendant cette vérification : la modale s'affichait en
  bas à gauche car il manquait les classes de positionnement (fixed inset-0 …) que portent les autres
  modales. Sans ce contrôle navigateur, le défaut serait passé inaperçu : les tests statiques ne
  l'auraient pas attrapé.
- **310/310 tests**, générateur d'utilitaires à jour.

Reste ouvert : la synchronisation ne pousse que le projet courant et ne propage pas les suppressions ;
aucun test multi-navigateurs simultanés n'a été fait.

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.7 (lot 3a/9)

Trois défauts de l'audit traités, tous liés à « l'utilisateur doit toujours savoir ce qu'il
sélectionne et ce qu'il modifie ».

1. Flèches sur une sélection invisible : closeAllFloatingToolbars masquait la boîte sans oublier la
   sélection. Premier correctif essayé (effacer la sélection) trop agressif : il effaçait aussi la
   sélection quand la barre texte s'ouvrait sur l'élément même qu'on venait de sélectionner, et le fil
   de contexte perdait son libellé. Correctif retenu : garde de visibilité dans le gestionnaire
   clavier, la sélection reste en mémoire.
2. Échap : un seul escalier, édition en ligne, puis modale, puis élément, puis barres. Test de source
   qui vérifie l'ordre des quatre étapes.
3. Fil de contexte : updateStageContext() unique, appelé au rendu initial, au changement de section et
   à chaque changement de sélection d'élément. Le libellé de section utilise getSectionFriendlyTitle
   (le même que le panneau Structure) au lieu du titre complet, qui était tronqué à 170 px ; la largeur
   passe à 340 px et l'infobulle porte le texte complet.

Vérifications : tests/selection_hierarchy.test.js (4 tests) ; suite complète 314/314 ; contrôle
navigateur après purge du cache — sélection d'un titre dans le canvas, la barre d'étape affiche
« Hero ▸ #EWC7TW ».

Reste du lot 3 : arbre des éléments dans le panneau Structure, sélection hiérarchique par clic droit
ou ⌘-clic depuis une liste, et suppression des 830 lignes inertes de renderSectionAccordionContent.

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.8 (lot 2c partiel)

Objectif : réduire la dette « classes émises sans aucune règle CSS », gelée par test depuis le lot 1,
et corriger au passage les deux cas où une classe mal écrite cachait un vrai défaut.

1. placeholder-zinc-400 (palette de commandes) n'est pas une classe valide : la couleur du texte
   indicatif ne s'appliquait pas. Devenue placeholder:text-zinc-400, générée par la couche
   d'utilitaires et donc réellement active.
2. no-scrollbar (barre d'onglets de la modale de partage) n'avait aucune règle : la barre de
   défilement restait visible. Règle réelle ajoutée (scrollbar-width + ::-webkit-scrollbar).
3. Cinq marqueurs redondants retirés du balisage : app-dashboard-shell, dashboard-topbar,
   dashboard-v3-field-name, ai-avatar-wrapper, cmd-group. Aucun effet visuel possible, une classe
   sans règle ne peignant rien ; c'est le balisage qui devient exact.

Liste gelée : 34 -> 26 classes côté application. Les 26 restantes sont soit des crochets
sémantiques utilisés par du JavaScript (site-theme-icon-dark, site-theme-label, tab-nav-btn,
btn-sec-*), soit des restes d'anciens gabarits dans le contenu du site (card, header, footer, title,
sub, pricing, inclusions, price-val, sig-box, sig-img, gallery-card, review-rating-star,
simulateur-roi-slider, vitrine-about-copy, vitrine-brand-name, cta-direct-gear, studio-system).

Vérifications : 314/314 tests ; générateur d'utilitaires à jour (check:css) ; listes gelées mises à
jour dans tests/design_system.test.js. Aucun contrôle navigateur n'a été jugé nécessaire ici : les
classes retirées n'avaient aucune règle, leur suppression ne peut donc rien changer au rendu, et les
deux classes réparées ont été vérifiées par le générateur (règle émise).

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.9 (lot 5a/9)

Chantier « états des éléments », première moitié : le modèle et le rendu, sans interface.

Ajouté :
- public/js/engine/elementStates.js : ELEMENT_STATES (hover, focus, active, disabled), libellés
  français, getElementState / setElementState / clearElementState (retournent un nouveau projet sans
  muter la source), elementStateCSS (une seule primitive), countStyledStates.
- renderer.js : <style data-element-states> injecté à côté de la feuille freeform, donc présent dans
  l'éditeur, l'aperçu ET l'export autonome, qui passent tous par renderWebsiteHTML.

Décisions :
- focus est traduit en :focus-visible, en cohérence avec la politique de focus unique du produit
  (tokens.css). Un état « focus au clic » serait un second langage.
- Seuls les écarts sont stockés ; un projet sans état n'émet aucune règle (test dédié).
- Sécurité : liste blanche de propriétés, refus des valeurs contenant ; { } < > url( expression(
  javascript: ou un commentaire CSS, validation des clés de mise en page, plafond de 400 règles.
- Un défaut a été introduit puis corrigé immédiatement pendant ce lot : la primitive était appelée
  dans le renderer avant d'être importée, ce qui cassait cinq suites de tests. Le contrôle « suite
  complète » l'a attrapé avant tout commit.

Vérifications : tests/element_states.test.js (5 tests) ; suite complète 319/319 ; la règle d'état est
présente dans renderWebsiteHTML et dans exportStandaloneHTML, et absente quand aucun état n'est
défini.

Reste (5b) : le sélecteur d'état dans l'inspecteur, l'application des réglages à l'état choisi, le
retour au style principal et l'intégration à l'historique. Aucun état n'est encore définissable
depuis l'interface, et je ne présente donc pas ce chantier comme livré.

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.10 (finitions de cohérence)

Increment volontairement petit, livré pour ne pas laisser une session s'arrêter sur du travail
non poussé.

- Les cinq dernières valeurs border-radius:999px de studio-v3.css passent par le jeton
  --ui-radius-full. Un premier essai a écrit var(--ui-radius-full, 999px), dont le repli littéral
  faisait échouer le test censé garantir l'absence de valeur littérale : le repli a été retiré,
  tokens.css étant toujours chargé.
- Nouveau test dans tests/design_system.test.js : le chrome ne doit contenir ni 999px ni 9999px
  littéral, et le jeton doit être déclaré une seule fois.
- app.css conserve 24 valeurs de rayon (contenu du site) : à traiter avec le lot de densité, pas à
  l'aveugle.

Vérifications : 320/320 tests.

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.11 (lot 5b/9)

Le socle des états (5a) devient utilisable : sélecteur « Principal / Survol / Focus / Actif /
Désactivé » dans le menu couleur de la barre d'outils texte, et routage des réglages vers l'état
choisi via elementStates et la clé de mise en page du renderer (getUiCode). Sortir de l'édition
repart toujours du style principal.

Deux erreurs commises puis corrigées pendant ce lot, à consigner :
1. syncActiveTextStateButtons() touchait document sans garde : une suite existante
   (editor_interaction_integrity) instancie App.prototype sans DOM et échouait. Garde ajouté.
2. Le test ajouté importait app.js, dont l'initialisation lance une requête de session asynchrone ;
   après la fin du test, la promesse touchait document et faisait échouer le fichier entier avec
   « A resource generated asynchronous activity after the test ended ». Le test a été réécrit en
   vérifications de source, sans importer app.js. Leçon : ne pas importer un module à effet de bord
   dans une suite de tests unitaires.

Vérifications : 322/322 tests ; les 5 tests du modèle (5a) passent inchangés.

Reste (5b, second temps) : aperçu immédiat de l'état sans survol réel, bouton « Revenir au style
principal » hors du menu, extension des états aux autres propriétés que la couleur.

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.12 (sécurité d'usage des états)

Défaut trouvé par relecture du lot précédent, pas par un test : une fois un état choisi dans le menu
couleur, fermer le menu faisait disparaître toute indication. L'auteur pouvait donc croire régler le
style principal alors qu'il écrivait dans un état. La barre d'outils porte désormais une pastille
d'état (fond ambré, libellé français) tant que l'état actif n'est pas « Principal » ; elle disparaît
avec le retour au principal, y compris en sortant de l'édition.

Vérifications : 323/323 tests.

Reste (5b, second temps) : aperçu immédiat de l'état sans survol réel, bouton « Revenir au style
principal » hors du menu, extension des états aux autres propriétés que la couleur.

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.13 (retour au style principal)

Complète l'exigence « l'utilisateur doit pouvoir revenir au style principal » du chantier des états :
une action explicite « Effacer cet état » supprime les déclarations de l'état choisi, via
clearElementState et state.updateProject (donc annulable), avec deux messages d'aide quand l'action
n'a pas de sens (aucun état choisi, aucun texte sélectionné).

Une erreur de test a été corrigée au passage : un fragment d'assertion contenant une apostrophe
échappée cassait la syntaxe du fichier de test ; remplacé par un fragment sans apostrophe.

Vérifications : 324/324 tests.

Reste (5b, second temps) : aperçu immédiat d'un état sans survol réel, et extension des états aux
propriétés autres que la couleur (fond, bordure, ombre, opacité), que le modèle autorise déjà.

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.14 (lot 4a/9)

Réglages de section : rien n'existait (l'audit relevait qu'une section n'avait que fond, assombrissement
et animation). Première moitié posée, sans aucun risque pour l'existant.

- public/js/engine/sectionStyle.js : échelles de largeur, d'espacement et d'alignement, valeurs par
  défaut complètes, setSectionLayout sans mutation, sectionLayoutAttributes qui ne renvoie quelque
  chose que si l'auteur a réellement modifié un réglage, et SECTION_LAYOUT_CSS (feuille partagée,
  conditionnée par data-section-layout="custom").
- Décision structurante : le CSS vit dans le module et sera injecté par renderWebsiteHTML, comme
  HERO_STYLES, pour éviter la troisième copie de styles que l'audit reprochait au site exporté.
- Choix de sûreté : aucune règle non conditionnée sur .site-section, pour que les vitrines existantes
  gardent un rendu strictement identique. Un test le verrouille.

Vérifications : tests/section_layout.test.js (6 tests) ; 330/330 tests complets.

Reste (4b) : brancher sectionLayoutAttributes et SECTION_LAYOUT_CSS dans les DEUX chemins de rendu du
renderer (éditeur et vitrine), puis l'interface dans l'inspecteur. Aucun réglage de section n'est
encore possible depuis le produit.

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.15 (lot 4b/9, NON VALIDÉ VISUELLEMENT)

Branché : sectionLayoutAttributes et SECTION_LAYOUT_CSS dans renderer.js (attribut + variables sur
l'élément section, feuille injectée à côté de HERO_STYLES), trois rangées de contrôles dans
l'inspecteur (sectionLayoutControlsHTML), et setSectionLayoutValue dans app.js via state.updateProject
(donc annulable).

Outil corrigé : le releveur de classes du générateur lisait les attributs class coupés par une
concaténation JavaScript et produisait des jetons fantômes (dont « id »), ce qui faisait échouer le
test de couverture. Il ignore désormais ces fragments APRÈS retrait des expressions de gabarit — un
premier correctif trop large, appliqué avant le retrait, avait fait perdre 21 règles légitimes.

Ce qui n'est PAS fait, et qu'il faut lever avant de considérer le lot 4 livré :
- Aucune validation visuelle. À 1280 px l'inspecteur n'est pas dans le champ de la capture, et je n'ai
  pas d'outil de redimensionnement ni d'accès aux styles calculés.
- Un test d'intégration a été écrit puis RETIRÉ : « le rendu partagé applique la mise en page sans
  toucher aux sections par défaut » échouait sur sa première assertion (le rendu de la démo contenait
  déjà data-section-layout="custom"), et je n'ai pas pu déterminer pourquoi dans la marge restante.
  Hypothèses à vérifier : un champ style déjà présent dans les projets de démonstration, ou une
  section modifiée qui n'est pas rendue comme le test le supposait. Le retirer plutôt que l'assouplir
  évite de figer une assertion qui ne prouve rien.
- Les 6 tests du modèle restent verts ; 330/330 au total.

Prochaine action recommandée : ouvrir l'éditeur dans un navigateur réel, sélectionner une section,
vérifier que les trois rangées apparaissent dans l'inspecteur et qu'un changement de largeur modifie
réellement le rendu et l'export ; puis rétablir le test d'intégration une fois la cause identifiée.

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.16 (lot 4b vérifié)

Le doute consigné au lot précédent est levé. Diagnostic : mon assertion cherchait
data-section-layout="custom" dans toute la page rendue, or la feuille de style injectée contient
elle-même ce sélecteur — quatre occurrences venaient du CSS, aucune du balisage. Le test compare
désormais le balisage seul, après retrait des blocs <style>.

Conséquence : le branchement du lot 4b est VÉRIFIÉ au niveau du rendu — une section personnalisée
porte l'attribut et la variable dans l'aperçu comme dans le site autonome exporté, une démo non
modifiée n'émet rien, et la feuille partagée est bien injectée pour les trois surfaces.

Leçon de méthode, à garder : quand une assertion de rendu échoue, vérifier d'abord CE QU'ELLE ATTEINT
VRAIMENT (balisage ou feuille de style) avant de suspecter le code. J'ai retiré un test valide et
consigné un avertissement inutile parce que je n'ai pas fait ce contrôle tout de suite.

Reste, honnêtement : l'inspecteur n'a pas pu être observé à l'écran (hors champ des captures à
1280 px, pas de redimensionnement ni de styles calculés disponibles). Le modèle, le rendu, la parité
et l'annulation sont prouvés par test ; l'apparence des trois rangées de contrôles ne l'est pas.

---

## Journal — 17 septembre 2026 · point de reprise réaligné (lot 4)

L'entrée « Lot 4 » de la checklist annonçait « non commencé » alors que 4a et 4b sont livrés. Elle est
corrigée, avec la distinction explicite entre ce qui est prouvé par test (marquage, variables, parité
aperçu/export, absence d'émission par défaut, annulation) et ce qui ne l'est pas (l'apparence à
l'écran des trois rangées de contrôles).

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.17 (lot 4c/9)

Premiers réglages d'élément du produit. La mission demandait taille, position, alignement, padding,
margin, gap, typographie, couleur, fond, bordure, radius, ombre, opacité ; trois sont livrés
(respiration interne, arrondi, opacité) et les autres restent à faire, mais l'architecture est
désormais posée et réutilisable.

Choix d'architecture, identique aux sections et aux états : primitive CSS unique injectée par
renderWebsiteHTML, ciblage par data-layout-key (déjà posé par le renderer), aucune règle émise par
défaut, valeurs issues d'énumérations. Conséquence : aucune modification de balisage, parité
éditeur/aperçu/export par construction, et zéro risque pour les vitrines existantes.

Ajouté :
- public/js/engine/elementStyle.js (ELEMENT_PADDING, ELEMENT_RADIUS, ELEMENT_OPACITY,
  ELEMENT_STYLE_DEFAULTS, get/hasCustom/set/clear, elementStyleCSS).
- renderer.js : feuille <style data-element-style> injectée à côté des états et des sections.
- inspector.js : bloc « Élément sélectionné » avec la clé affichée, trois rangées de choix et le
  retour au style du thème.
- app.js : state.selectedElementKey (posé à la sélection, effacé à la désélection),
  setSelectedElementStyle, clearSelectedElementStyle, tous deux via l'historique.
- state.js : selectedElementKey.

Vérifications : tests/element_style.test.js (5 tests) ; 336/336 tests complets.

Non vérifié : l'apparence à l'écran du nouveau bloc, l'inspecteur restant hors du champ des captures
à 1280 px. À lever comme pour le lot 4b.

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.18 (réglages d'élément complétés)

Ajouté aux réglages d'élément : fond (aucun, surface, accent), bordure (aucune, fine, marquée) et
ombre (aucune, douce, portée). Six réglages au total avec la respiration, l'arrondi et l'opacité.

Deux décisions à retenir :
- Un fond accentué force la couleur de texte blanche : sans cela, le produit aurait laissé créer des
  blocs illisibles par construction.
- Les valeurs n'utilisent QUE des jetons du site (--primary, --bg-sec) ou des littéraux sûrs. Les
  jetons --ui-* du chrome sont volontairement exclus : le site autonome exporté ne les définit pas, et
  c'est exactement le type d'écart qui a cassé l'export. Les réglages précédents (arrondis) passent par
  des var() avec repli littéral, donc le problème ne s'y pose pas non plus.

Vérifications : tests/element_style.test.js (6 tests) ; 337/337 tests complets.

Non vérifié : l'apparence à l'écran des blocs de l'inspecteur, comme pour les lots 4b et 4c.

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.19 (vocabulaire de réglages unifié)

Les styles d'élément (alpha.18) et les états (alpha.9 à 13) avaient chacun leur façon de produire du
CSS : une même intention devait être écrite deux fois, avec deux risques de divergence. declarationsFor
devient la source unique ; elementStyleCSS et elementStateCSS l'utilisent tous les deux.

Garde-fous ajoutés :
- Une propriété pilotée par une échelle (padding, radius, opacity, background, border, shadow) refuse
  une valeur hors échelle. Sans cela, la liste blanche des déclarations libres aurait laissé passer
  « padding: gigantesque ».
- L'opacité conserve l'exception d'une valeur numérique nue (usage historique du curseur).

Erreurs commises pendant ce lot, à consigner :
1. Un script de troncature de test fichier coupé trop large : il a supprimé deux tests d'interface
   valides. Je les ai rétablis ; la suite est repassée de 335 à 337 tests. Leçon : après toute
   manipulation par script d'un fichier de test, recompter les tests et comparer.
2. Un remplacement a laissé une variable locale utilisée hors de sa portée (« declaration is not
   defined »), attrapé par la suite avant tout commit.

Vérifications : 337/337 tests. Non vérifié : l'apparence à l'écran, comme pour les lots 4b à 4c.

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.20 (états éditables depuis l'inspecteur)

Le vocabulaire partagé (alpha.19) devient utilisable : le bloc « Élément sélectionné » de l'inspecteur
porte un sélecteur d'état, les six rangées écrivent soit dans le style de base, soit dans l'état choisi,
et le bouton de remise à zéro change de sens selon le cas.

Point d'architecture : une seule liste ELEMENT_SCALE_ROWS, parcourue une fois, et seule la commande
appelée change (setSelectedElementStyle ou setSelectedElementStateValue). Un test compte les occurrences
de cette liste pour garantir qu'on n'a pas recopié les rangées — c'est exactement le mécanisme qui avait
fait diverger les styles de l'export.

Erreur commise et corrigée pendant ce lot : un import dupliqué de setElementState dans app.js,
attrapé par node --check avant tout commit.

Vérifications : 338/338 tests. Non vérifié : l'apparence à l'écran du bloc, comme pour les lots 4b à 4c.

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.21 (wording humain)

Passe de vocabulaire demandée explicitement par la mission (« wording humain plutôt que jargon CSS »).
23 formulations remplacées dans le chrome, dont le retrait complet des mentions de « 60fps »
(fréquence d'images = détail d'implémentation, et marqueur d'interface générée).

Deux tests de non-retour ajoutés dans tests/design_system.test.js : le jargon retiré ne peut pas
revenir, et « 60fps » ne doit plus apparaître dans le chrome.

Trois attentes de test ont été mises à jour parce qu'elles assertaient les anciens libellés : c'est un
changement de vocabulaire volontaire, pas une régression.

Erreur de manipulation : mon premier script de remplacement a été rejeté par une apostrophe échappée
dans une chaîne ; corrigé en utilisant l'apostrophe typographique, plus correcte en français.

Vérifications : 340/340 tests. Non vérifié : l'apparence à l'écran, comme depuis le lot 4b.

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.22 (lot 7a/9)

Catalogue d'animations unique, première moitié du chantier « mouvement » : le modèle, sans branchement.

L'audit relevait six catalogues parallèles (10, 7, 5, 6, 6, 6 entrées) et des noms divergents pour
les mêmes effets. motionPresets.js devient la source unique : 14 animations avec nom français,
description de ce qu'elles font, nature (entrance / attention / loop), durée et courbe ; plus
MOTION_REPEAT (une fois, deux fois, trois fois, en continu) et MOTION_TRIGGERS (apparition,
chargement, survol, clic).

Un test vérifie qu'aucune des trois surfaces principales ne redéclare un catalogue local — c'est la
garantie structurelle que la divergence ne pourra pas se réinstaller.

Erreur de test corrigée pendant le lot : ma première assertion sur les noms français rejetait
« Zoom avant » parce qu'il commence par un mot anglais. Remplacée par une liste explicite des noms
anglais interdits, plus juste et sans faux positif.

Vérifications : tests/motion_presets.test.js (6 tests) ; 346/346 tests complets.

Reste (7b) : brancher les surfaces, exposer durée, délai, courbe et direction, et les actions
tester / rejouer / arrêter / réinitialiser. Le catalogue existe mais n'est pas encore utilisé.

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.23 (catalogue vérifié)

Contrôle de couverture CSS sur les quatorze animations du catalogue : deux d'entre elles — bounce
(« Rebond d'appel ») et glow (« Halo ») — n'ont AUCUNE règle de rendu pour les sections ; elles
appartiennent au mécanisme des animations de bouton (btn-motion-*). Les avoir listées aurait promis à
l'auteur des effets jamais joués.

Retirées. Le catalogue compte douze animations, toutes réellement jouables, et un nouveau test compare
chaque identifiant aux règles data-motion="..." du CSS : annoncer une animation absente fait échouer
la suite.

Leçon : un catalogue est une promesse. Vérifier que chaque entrée est tenue par le rendu avant de
l'exposer vaut mieux que de découvrir l'écart après branchement.

Vérifications : 7 tests sur le catalogue, 347/347 au total. Le catalogue n'est toujours pas branché
sur les surfaces (lot 7b à faire).

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.24 (lot 7b, première surface)

L'inspecteur lit MOTION_PRESETS au lieu de sa liste locale de dix entrées avec noms anglais. Effet
visible : les libellés passent en français et deux animations jouables de plus sont proposées.

Un test verrouille la bascule : l'inspecteur doit contenir MOTION_PRESETS.map et plus aucun nom anglais
brut.

Vérifications : 8 tests sur le catalogue, 348/348 au total.

Reste (7b) : les cinq autres surfaces (menu de section du canevas, texte, image, bouton, réglages
globaux), l'exposition de durée, délai et courbe, et les actions tester / rejouer / arrêter /
réinitialiser.

---

## Journal — 17 septembre 2026 · 4.9.0-alpha.25 (accessibilité du mouvement vérifiée)

Contrôle des douze animations du catalogue sous prefers-reduced-motion : toutes sont neutralisées par
une règle générique présente dans les dix blocs réduits du produit. Aucun écart, donc aucune
correction.

Cette vérification devient un test permanent : elle échouera si une animation ajoutée au catalogue
pouvait se jouer malgré la demande système de réduire les mouvements. C'était une propriété vérifiée à
la main (et exigée par AGENTS.md) ; elle est désormais garantie par la suite.

Vérifications : 9 tests sur le catalogue, 349/349 au total.

Reste : lot 7b sur les cinq autres surfaces (canevas, image, texte, bouton, réglages globaux) — la
tentative de ce tour s'est heurtée à une limite d'échappement de l'outil et n'a rien modifié, l'arbre
étant resté propre.

## Journal — 17 septembre 2026 · 4.9.0-alpha.26 (lot 7b, fin du catalogue unifié des animations)

- Objectif : le rendu doit lire le catalogue unique, comme l'inspecteur le fait depuis `4.9.0-alpha.22`.
- Fait : les deux dernières listes locales du rendu (menu image, panneau de section) sont remplacées par `MOTION_PRESETS`. Le bug d'échappement du tour précédent est diagnostiqué précisément : mon remplacement laissait un `]` orphelin après `])}`, d'où « Unexpected identifier 'type' » ; `node --check` l'a montré et la correction est passée avant tout commit. L'édition procède désormais par un script Node, pas par l'éditeur de texte.
- Aperçu : `slide-in`, `magnetic` et `progress-fill` reçoivent leur règle `:hover` manquante, donc toute animation du catalogue se prévisualise.
- Tests : 349 → 351 (deux garde-fous). `scripts/build-utilities.mjs` relancé, aucune classe utilitaire nouvelle.
- Reste sur le lot 7 : durée, délai, courbe et direction réglables par animation, outil tester/rejouer/arrêter/réinitialiser, neutralisation pendant un transform libre, runtime partagé à l'export.

## Journal — 17 septembre 2026 · 4.9.0-alpha.27 (lot 7c, durée et délai pilotés par le catalogue)

- Découverte : le catalogue annonçait une durée par animation, mais `app.css` et `exporter.js` les remplaçaient toutes par 0,85 s — deux copies divergentes du même réglage global.
- Fait : `motionTimingCSS()` dans `motionPresets.js` génère le CSS depuis le catalogue (base par preset, vitesse, délai, neutralisation du délai sous `prefers-reduced-motion`). Le rendu l'injecte, donc éditeur, aperçu et export lisent la même feuille. La section émet `data-motion-speed` / `data-motion-delay` seulement quand le réglage n'est pas neutre.
- Sélecteur `[data-motion][data-motion]` volontaire : le doublement de l'attribut l'emporte sur l'ancienne règle `!important` restée dans `app.css` et `exporter.js`, sans la supprimer tant que l'export cassé (lot 2d) n'est pas réparé.
- UI : « Vitesse » et « Délai » dans le panneau Animation de la section, avec relance de l'aperçu. Un seul chemin d'écriture (`setSectionMotionTiming`) et un seul instantané d'historique.
- Tests : 351 → 357. `node --check` sur les quatre fichiers modifiés, `scripts/build-utilities.mjs` relancé, aucune classe utilitaire nouvelle.
- Reste : courbe et direction par animation, extension de la vitesse et du délai aux animations d'élément et d'image, outil tester/rejouer/arrêter/réinitialiser, motions pendant un transform libre.

## Journal — 17 septembre 2026 · 4.9.0-alpha.28 (lot 7c étendu : texte, image, menu texte migré)

- Fait : `setActiveTextTiming` et `setImageMotionTiming` donnent vitesse et délai aux animations d'élément et d'image ; le rendu émet `data-motion-speed` et `data-motion-delay` sur les nœuds texte et image, exactement comme sur la section.
- Découverte : le menu d'animation du texte (`editor.js`) était le dernier catalogue local, avec des noms anglais (« Fade », « Spring ») et une ligne d'aide en double. Il lit maintenant `MOTION_PRESETS`, affiche les 12 entrées en français, n'a plus qu'une aide, et synchronise ses boutons Vitesse/Délai à l'ouverture.
- Erreur rencontrée et corrigée : `MOTION_SPEEDS` utilisée dans `renderer.js` sans import → 12 tests rouges. Diagnostiquée par la trace de pile, corrigée, puis couverte par un test de rendu de l'éditeur qui aurait attrapé la faute.
- Tests : 357 → 360. `node --check` sur les quatre fichiers modifiés, `scripts/build-utilities.mjs` relancé.
- Reste : courbe et direction par animation ; vocabulaire de répétition du menu texte encore `once / twice / infinite` alors que le catalogue dit `once / twice / thrice / loop` (valeurs persistées, migration à préparer) ; outil tester/rejouer/arrêter/réinitialiser ; motions pendant un transform libre.

## Journal — 17 septembre 2026 · 4.9.0-alpha.29 (lot 4d entamé, et la skill Impeccable enfin utilisée)

- Constat honnête : les lots 7b, 7c et 7c étendu de cette session ont été menés sans la skill Impeccable, alors que MISSION 2 l'exigeait. Elle a été chargée à la fin du tour 29 et son `context` exécuté (`impeccable context --target public/js/components/inspector.js`).
- Résultat du `context` : le projet n'a ni PRODUCT.md ni DESIGN.md ; en mode raffinement le code existant fait autorité et `init` reste à faire. Le détecteur mécanique doit être passé une fois sur l'UI modifiée, ce qui a été fait.
- Fait : primitive de divulgation progressive (`disclosure`) dans l'inspecteur, sur `<details>/<summary>` natifs. Premier usage : les réglages de rythme (vitesse, délai) passent derrière « Réglages avancés : vitesse et délai » ; le choix de l'animation et le test restent immédiats. L'état ouvert est retenu par module, sinon le panneau se refermerait à chaque clic.
- Détecteur Impeccable : uniquement des avertissements pré-existants (gray-on-color, bounce-easing, border-accent-on-rounded) ; rien de nouveau introduit par ce lot.
- Tests : 360 → 364. `node --check` sur l'inspecteur, `scripts/build-utilities.mjs` relancé.
- Reste : étendre la divulgation aux autres groupes de l'inspecteur ; écrire PRODUCT.md et DESIGN.md ; lots 6 (positionnement), 3b (sélection et arbre des éléments), 7 (courbe, direction, tester/rejouer) et 2d (export autonome cassé) toujours ouverts.

## Journal — 17 septembre 2026 · 4.9.0-alpha.30 (surfaces du navigateur : passe craft-floor de la skill)

- Démarche : la skill a été lue jusqu'à sa table de commandes (§Commands), ses références obligatoires `craft-floor.md` et `operate.md` ont été lues avant toute édition, et la surface a été classée en mode **Operate** (outil/éditeur).
- Trouvaille : le point que la skill désigne comme « le signal le moins coûteux qu'une page a été construite plutôt qu'assemblée » était totalement absent — aucune sélection, curseur, barre de défilement ni chiffre tabulaire thématisé dans le chrome.
- Fait : jetons de surface dans `tokens.css`, thème appliqué sous `.studio-editor` (racine existante du chrome, donc pas de fuite vers le site publié — un test le contrôle), chiffres tabulaires pour les identifiants et compteurs.
- Correction d'une faute du lot précédent : j'avais introduit un second vocabulaire de focus (`--ui-focus` inexistant) alors que le produit a un anneau unique (`--ui-ring`). Corrigé ; un test interdit le retour.
- Tests : 364 → 368. Détecteur Impeccable relancé sur les fichiers modifiés.
- Reste : blur/glass décoratif des menus flottants, glyphes résiduels, PRODUCT.md/DESIGN.md ; lots 6, 3b, 7 (courbe, direction, tester/rejouer) et 2d toujours ouverts.

## Journal — 17 septembre 2026 · 4.9.0-alpha.31 (lanceur d'assistant, kickers — corrigés sur capture)

- Méthode : la skill impose une passe d'inspection visuelle groupée. Serveur lancé, éditeur ouvert dans un vrai navigateur, captures avant/après — c'est la première vérification visuelle de toute la mission.
- Défaut confirmé à l'écran : le lanceur « Studio Assistant IA » (pilule fixe de 10 rem) recouvrait la carte « ARTISAN RÉFÉRENCE » du site rendu. Réduit à une pastille ronde de 2,75 rem, nom accessible et infobulle conservés. Le `border-bottom: 3px` qu'il portait était l'antipattern déjà signalé par le détecteur.
- Craft-floor : les deux kickers numérotés du tableau de bord sont supprimés (interdiction explicite). CSS mort retiré de `studio-v3.css`.
- Rectification : mon rapport précédent parlait d'un emoji dans le lanceur ; il utilisait `getIcon`. Erreur de lecture de ma part.
- Tests : 368 → 370, plus la réécriture du test historique du lanceur. `scripts/build-utilities.mjs` relancé, détecteur Impeccable repassé.
- Reste : glyphes de statut du chrome, vocabulaire de boutons, lot 6 positionnement (Canva), 3b, 4d, 7, 2d.

## Journal — 17 septembre 2026 · 4.9.0-alpha.32 (statuts du chrome vers le système d'icônes)

- Craft-floor appliquée : les glyphes Unicode tenant lieu d'icônes sont refusés. Cinq cas dans le chrome : confirmations de copie, message Schema.org, statut d'enregistrement, copie générique, et la table d'état des étapes de l'assistant (`○ … ✓ ! ×`).
- Correctif : glyphes décoratifs retirés du texte ; états d'étape confiés à `getIcon` (`clock`, `check`, `helpCircle`, `x`).
- Périmètre respecté : le `✓` du badge de confiance est du contenu du site client, explicitement hors périmètre depuis l'origine — non touché.
- Tests : 370 → 371. `scripts/build-utilities.mjs` relancé, détecteur Impeccable repassé.
- Honnêteté sur la vérification : ce lot est couvert par test et non par capture, ces états étant transitoires. Les lots précédents (lanceur, kickers) ont bien été vérifiés à l'écran.
- Reste : vocabulaire de boutons, lot 6 positionnement (Canva), 3b, 4d, 7, 2d.

## Journal — 17 septembre 2026 · 4.9.0-alpha.33 (barre freeform : 7 glyphes remplacés par de vraies icônes)

- Correction de mon propre tour précédent : j'avais annoncé le chrome débarrassé de ses glyphes en n'ayant cherché que dans les `textContent` et les `alert`. Le balisage des barres d'outils n'avait pas été inspecté. La sélection freeform en portait sept.
- Fait : sept icônes authored ajoutées à `icons.js` dans le vocabulaire existant (24×24, trait, currentColor) et branchées dans `app.js` ; plus aucun des sept glyphes dans le fichier.
- Vérification : par test uniquement. La boîte freeform ne s'est pas laissée déclencher dans le navigateur (cliquer un élément ouvre l'édition en ligne) ; je n'ai donc pas pu confirmer l'aspect des nouvelles icônes à l'écran.
- Tests : 371 → 373. `scripts/build-utilities.mjs` relancé, `node --check` sur les deux fichiers touchés.
- Nouvelle dette repérée : glyphes `⋯ ⇄ ⊕ ▼` dans les barres de section et de texte ; vocabulaire de boutons (quatre familles, valeurs arbitraires `34px`/`10px`/`.16s` au lieu des jetons) ; puis lot 6.

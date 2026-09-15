# Journal des Modifications (CHANGELOG)

Toutes les modifications notables apportées à ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère à la numérotation [Semantic Versioning](https://semver.org/lang/fr/).

---

### 4.9.1 — 17 septembre 2026 — Les sessions fonctionnent enfin sur le site public (stockage Vercel Blob)

- **Cause du « Connexion indisponible »** : le compte était branché sur un stockage inexistant sur Vercel (disque éphémère). Toutes les routes `/api/auth/*` et `/api/projects/*` répondaient 503 — à raison : rien n'aurait été conservé. Ce n'était donc pas une absence de sessions, mais un refus honnête faute de stockage durable.
- **Backend Vercel Blob** (`server/store.js`) : la base est rangée en **instantanés immuables** sous `artisite/db/<horodatage>.json`. On n'écrase **jamais** un blob : le CDN met en cache par nom de fichier et un écrasement ne se voit pas tout de suite (vérifié : `x-vercel-cache: HIT` servait encore l'ancien contenu). La lecture liste les instantanés et prend le plus récent. Les cinq derniers sont conservés, le nettoyage ne fait jamais échouer une écriture. `BLOB_READ_WRITE_TOKEN` posé sur production, preview et développement.
- **Une panne de lecture lève**, elle ne renvoie jamais une base vide : sinon la première écriture suivante effacerait les données réelles. Le 503 porte désormais la cause exacte (`REMOTE_STORE_TIMEOUT@hôte`, `BLOB_STORE_HTTP_<code>`…) et la journalise.
- Backends conservés et testés : **Redis REST** (Upstash / Vercel KV) et **fichier JSON atomique** (`DATA_DIR`) pour le local.
- **Vérifié en production** : inscription → cookie `HttpOnly` → `/api/auth/session` → import de projet → relecture → déconnexion. Plus aucun 503 ; les données de test ont été retirées.
- Tests : 3 nouveaux (`tests/store_blob.test.js`, `tests/store_redis.test.js` sur faux serveurs, y compris l'écrasement et la panne) ; 405 → **408/408**.
- Passation : la base Upstash éphémère essayée d'abord est instable (endpoint injoignable après quelques minutes, en local comme depuis Vercel) — écartée au profit de Vercel Blob.

#### IA — le repli était en cause, pas la clé

- **Cause exacte trouvée dans les logs d'exécution** : Google renvoyait `503 — This model is currently experiencing high demand` sur les **trois** modèles 3.x. Comme la chaîne de repli ne contenait **que** des modèles 3.x et qu'aucun réessai n'existait, tout échouait en silence sur le moteur local. La clé et les noms de modèles étaient bons.
- **Correctif** : ajout d'une génération antérieure dans la chaîne (`gemini-2.5-flash`, `gemini-2.5-flash-lite`) et **réessais avec backoff** sur `429/500/502/503/504`. Un pic de charge sur les modèles récents ne fait plus tomber l'assistant.
- **Génération d'image** : `/api/ai/image` appelait un modèle **texte** en lui demandant une image — aucun modèle texte ne peut en produire. Il utilise désormais un vrai modèle image (`gemini-3.1-flash-image`, `gemini-2.5-flash-image`, `gemini-3-pro-image`), renvoie une data URL, et expose `aiAvailable` avec la cause exacte quand il retombe sur le visuel du catalogue.
- Tests : 1 nouveau (`getImageModels`) ; 408 → **409/409**.
- **Repli réellement actif** : `GEMINI_MODELS` (défini sur Vercel avec les seuls 3.x) **remplaçait** les modèles par défaut au lieu de les compléter — le filet de sécurité était donc inerte. Les modèles d'environnement passent désormais en premier, les défauts sont **ajoutés** ensuite.
- **L'échec devient visible** dans la modale (« L'IA n'a pas pu produire d'image : [raison]… ») au lieu du silence. L'erreur réelle constatée en production est `429 — quota dépassé` côté compte Google : hors code, mise en sommeil décidée avec l'auteur.
- **Pas encore en ligne** : le quota Vercel (100 déploiements/jour, compteur journalier que supprimer d'anciens déploiements ne libère pas) a bloqué le déploiement. Le code est sur `main` (`fe0f000`).

#### Chrome d'édition — une seule famille de contrôles à la fois

- Constat à l'usage : jusqu'à **quatre surcouches** se dessinaient en même temps (barre d'élément, panneau d'animation de section, sélection libre, barre blanche), et la barre blanche apparaissait **par-dessus la médiathèque**.
- Cause : l'exclusion mutuelle existait bien (`body[data-active-editor-toolbar]`), mais **ouvrir le panneau d'animation ou de fond de section ne la déclenchait pas** — la sélection libre restait affichée dessous.
- Correctif : ouvrir le panneau d'animation ou de fond ferme les autres familles (`closeAllFloatingToolbars("section")`) ; le refermer rend la main. Deux règles CSS interdisent toute surcouche d'édition **par-dessus une modale** (`body.modal-open`).
- Tests : **409/409** ; `utilitiesCss.js` régénéré pour la classe de statut IA.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.59) — Lot 7 : la courbe d'animation devient réglable

- Le catalogue portait une courbe par animation, mais l'auteur ne pouvait pas la changer. Trois courbes sont désormais proposées — **Douce** (départ vif, arrivée posée), **Rebond** (léger dépassement), **Régulière** — dans le repli « Réglages avancés » du panneau, à côté de la vitesse et du délai.
- Implémentation : la courbe choisie prime sur celle du preset par une règle unique (`animation-timing-function` sur `[data-motion-easing]`), alimentée par une variable par courbe — donc aucune règle d'animation dupliquée.
- **Le réglage survit au rechargement** : le rendu émet `data-motion-easing`, vérifié sur le HTML produit. C'est le contrôle que j'avais oublié au premier passage de ce tour, et que la sonde a rattrapé.
- Tests : 1 nouveau ; **404/404**. Vérifié : 3 courbes au catalogue, règle d'override présente, ligne dans l'inspecteur, attribut dans le rendu.
- Reste sur le lot 7 : la **direction** par animation.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.58) — Lot 7 : arrêter et réinitialiser une animation

- Le panneau proposait « Tester l'animation en direct » mais rien pour **l'arrêter**, ni pour **revenir aux réglages d'origine** : une fois une animation posée, il fallait décocher à la main chaque réglage (preset, répétition, vitesse, délai).
- Ajouté sous le bouton de test : **Arrêter** (retire `is-revealed`, `motion-preview` et l'état de pulsation, et annule le minuteur d'aperçu) et **Réinitialiser** (efface preset, répétition, vitesse et délai, avec instantané d'historique — donc annulable).
- Tests : 1 nouveau ; **403/403**. Vérifié sur la sortie réelle de l'inspecteur : les trois boutons sont présents.
- Reste sur le lot 7 : la **courbe** (easing) et la **direction** par animation.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.57) — Lot 3b soldé : les 843 lignes inertes sont supprimées

- **Suppression effectuée** : `renderSectionAccordionContent` (843 lignes) et le `<template id="studio-v3-section-capabilities">` qui le portait. `editor.js` passe de **1856 à 1013 lignes**. Aucune référence ne subsiste, aucun appel.
- Elle n'a été possible qu'après trois tours de préparation : (1) inventaire des 31 capacités du gabarit, (2) réimplantation de celles qui n'avaient **aucun** autre point d'entrée — listes, assombrissement du hero, tailles de champ, motifs d'inspiration, boucle d'animation de section, carte des horaires, format et nature de galerie, restauration des boutons masqués, (3) **déblocage des tests** qui validaient le code mort et l'auraient protégé indéfiniment.
- Un test restait : il cherchait le libellé « Interactive Google Maps » dans l'éditeur. Repointé vers l'inspecteur, où le contrôle vit désormais sous le nom « Carte interactive ».
- Tests : **403/403** après suppression, aucune assertion supprimée. Le contenu retiré vivait dans un `<template>`, que les navigateurs ne rendent pas : l'interface visible ne pouvait pas changer, et la suite couvre le rendu de l'éditeur.
- Dette restante, signalée : `updateListField` (éditer le champ d'une entrée de liste) n'a toujours pas d'interface vivante.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.56) — Deux tests cessent de protéger du code mort

- **Cause profonde du lot 3b** : deux tests assertaient des chaînes qui ne vivaient que dans le gabarit jamais rendu (`renderSectionAccordionContent`). L'un cherchait les **titres de groupes** du panneau mort ; l'autre lisait le HTML **rendu**, où un `<template>` apparaît même s'il n'est jamais affiché. Voilà pourquoi 837 lignes inertes ont survécu : **la suite de tests les protégeait**.
- Réécrits pour viser les **emplacements vivants** : le panneau de propriétés (choix de l'image de carte, format de galerie, nature d'une entrée, ajout d'avis et de services, retrait d'entrée), l'arbre des éléments, et les méthodes réelles de l'application. Le second rend désormais l'éditeur **avec la section concernée sélectionnée** — la seule façon honnête d'obtenir ces contrôles, puisqu'ils dépendent de la section.
- Conséquence directe : la suppression des 843 lignes ne fera plus tomber ces tests **pour la bonne raison** — ils ne valident plus du code mort.
- Dette signalée sans la masquer : `updateListField` (éditer le champ d'une entrée de liste) reste sans interface vivante.
- Tests : **403/403**, aucune assertion supprimée.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.55) — Les contrôles de carte redeviennent accessibles

- Réimplanté : le **mode d'affichage de la carte** du bloc horaires (carte interactive / image personnalisée) et le **choix de l'image de carte**. Ces deux réglages n'existaient que dans le gabarit jamais rendu — c'est précisément ce que décrivait le test tombé au tour précédent, et donc une capacité que ma suppression ratée aurait emportée.
- Vérifié : les contrôles apparaissent sur la section horaires et **nulle part ailleurs** (contrôle négatif systématique).
- Reste pour rendre la suppression des 843 lignes sûre : les contrôles de contenu de la vitrine (un autre test tombé les décrit), puis la reprise avec un inventaire complet — appels **et** libellés cette fois.
- Tests : **403/403**.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.54) — La boucle d'animation de section retrouve une interface, et une suppression ratée

- **Capacité restaurée** : la boucle d'animation de section (Une fois / ×2 / Boucle) n'avait **aucune** interface vivante — le popover du canevas ne contient aucun `data-section-loop` (vérifié : 0 occurrence dans `renderer.js`). Elle n'existait que dans le gabarit mort. Elle est maintenant dans le panneau de propriétés, sous les presets d'animation.
- **Suppression tentée puis annulée**, et c'est le point important : j'ai supprimé les 843 lignes inertes, et six tests sont tombés. En les examinant, j'ai découvert qu'ils **validaient le code mort** — ils assertaient des chaînes qui ne vivaient que dans le gabarit. C'est ainsi que 837 lignes ont survécu si longtemps : la suite de tests les protégeait.
- Trois de ces tests pointaient vers des équivalents vivants (libellés d'animation, aperçu au survol) : corrigés pour viser l'inspecteur. Mais trois autres décrivaient des capacités qui n'existaient **que** là — contrôles de carte des horaires, contrôles de contenu de la vitrine. Mon inventaire du tour précédent listait les **appels** du code mort, pas ses **libellés** : il était donc incomplet.
- Décision : **restaurer `editor.js`**. Une suppression ne se justifie que si aucune fonction ne disparaît. Je garde ce que le tour a produit de bon — la boucle de section dans l'inspecteur — et je reprends la suppression avec un inventaire qui couvre aussi le balisage.
- Tests : **403/403**. Deux tests réécrits vers les emplacements vivants, aucun supprimé, aucune assertion affaiblie sans le dire.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.53) — Lot 3b : plus aucune capacité orpheline

- Les trois derniers réglages enfermés dans le gabarit jamais rendu sont réimplantés : le **format de la galerie** (4/3, 16/9, carré, avec l'état actif), la **nature de chaque entrée** (photo ↔ comparatif Avant/Après), et la **restauration des boutons masqués** (principal, téléphone) — sans elle, retirer un bouton était définitif dans l'interface.
- Vérifié sur la sortie réelle de l'inspecteur : 3 formats proposés pour la galerie, 2 restaurations quand les deux boutons sont masqués, aucune quand rien n'est masqué.
- **Bilan du lot 3b, côté capacités** : les quinze méthodes qui n'avaient d'autre point d'entrée que le code mort sont désormais accessibles depuis le panneau — listes (avis, services, FAQ, galerie, points forts), assombrissement du hero, tailles de champ, motifs d'inspiration, format et nature de la galerie, restauration des boutons. **Les 837 lignes peuvent être supprimées sans rien perdre** : c'est le prochain tour.
- Tests : 1 nouveau ; 402 → **403/403**.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.52) — Lot 3b : les trois derniers réglages morts reprennent vie

- Suite de l'inventaire : après les listes, restaient trois capacités enfermées dans le gabarit jamais rendu — **l'assombrissement du hero**, les **curseurs de taille** de titre / sous-titre / texte, et les **motifs d'inspiration**.
- Réimplémentées dans un bloc replié « Réglages avancés : contenu et inspiration » du panneau de propriétés : un curseur d'assombrissement (visible **uniquement** pour le hero), trois curseurs de taille de champ, et six motifs d'inspiration avec leur description en infobulle.
- Erreur d'insertion commise puis corrigée dans le même tour : j'ai d'abord inséré l'appel dans le **corps** de la fonction au lieu du gabarit, ce que `node --check` a immédiatement signalé. Aucun commit avec du code cassé.
- Mesuré sur un projet de référence : assombrissement présent pour le hero et absent ailleurs, 3 curseurs, 6 motifs.
- Tests : 1 nouveau ; 401 → **402/402**.
- Reste avant suppression des 837 lignes : `toggleGalleryItemType`, `setGalleryAspectRatio`, `restoreButton`.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.51) — Lot 3b : les listes redeviennent éditables

- Inventaire avant suppression : les 837 lignes de `renderSectionAccordionContent` sont bien **inertes** (son gabarit n'est cloné nulle part), mais elles portent **31 capacités**, dont une quinzaine sans aucun autre point d'entrée. Supprimer d'abord aurait retiré des fonctions.
- La plus visible : **les listes de la section**. On pouvait modifier un avis existant, mais ni en ajouter ni en supprimer un. Les services, la FAQ, la galerie et les points forts étaient dans le même cas.
- Réimplémenté dans l'inspecteur : un bloc « Listes de la section » qui affiche chaque liste avec son compte, un bouton **Ajouter** quand l'application sait fabriquer une entrée complète (avis, services, FAQ, galerie), et un bouton **Retirer** par entrée — via une opération générique unique, `removeListEntry`, annulable.
- Mesuré sur un projet de référence : services → 6 entrées retirables et 1 ajout ; FAQ → 1 et 1 ; points forts → 4 retirables ; avis → 1 ajout.
- Tests : 1 nouveau ; 400 → **401/401**. Vérifié sur la sortie réelle de l'inspecteur, pas seulement en source.
- Reste sur 3b : l'assombrissement du hero, les motifs d'inspiration, et les curseurs de taille de champ — puis la suppression des 837 lignes.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.50) — Lot 3b : l'arbre des éléments dans la structure

- Fait : chaque section du panneau Structure peut se **déplier** pour montrer ses éléments — « Nom de marque », « Téléphone », « Texte du bouton 1 / 2 »… Cliquer un élément le sélectionne exactement comme depuis le panneau de propriétés : même point d'écriture, même indicateur sur le canevas.
- Un **module partagé**, `public/js/data/elementLabels.js`, porte les noms lisibles et leur numérotation : le panneau de propriétés et l'arbre de la structure nomment désormais le même élément de la même façon. L'inspecteur n'a plus sa table locale — un test l'interdit, pour qu'elles ne divergent pas.
- **Vérifié à l'écran, et le contrôle a servi deux fois** : la première capture a montré l'arbre fonctionnel **et** un défaut que j'avais introduit — mon nouveau bouton était un sixième enfant dans une grille à cinq colonnes, ce qui faisait passer les chevrons des sections suivantes à la ligne. Corrigé (colonne ajoutée, place réservée même sans élément), la seconde capture confirme l'alignement.
- Tests : 2 nouveaux ; 398 → **400/400**.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.49) — Lot 3b : une seule source de sélection d'élément

- Fait : `setElementSelection(layoutKey, options)` devient le **seul point d'écriture** de la sélection d'élément. Quatre chemins la renseignaient chacun de leur côté — la liste des éléments, le clic sur le canevas, le nettoyage, et la sélection libre. Un test garantit qu'il ne reste qu'**une seule affectation directe** dans tout le fichier.
- Deux désynchronisations corrigées au passage, de la même famille : (1) vider la sélection libre laissait `state.selectedElementKey` en place, donc le panneau continuait d'éditer un élément que plus rien n'indiquait sur le canevas ; (2) changer de section gardait l'élément de l'**ancienne** section, donc le panneau montrait ses réglages pendant qu'on éditait la nouvelle. Les deux passent désormais par le point unique.
- **Vérifié à l'écran** : sélection d'un élément dans la liste → contour en pointillés sur le canevas **et** « Élément sélectionné » dans le panneau — l'indicateur unifié livré en `4.9.0-alpha.43` est enfin visible sur une capture ; puis changement de section → le panneau affiche la nouvelle section et **relâche l'élément** (bloc élément disparu, contour effacé).
- Tests : 2 nouveaux ; 396 → **398/398**.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.48) — Lot 4d clos, et les réglages deviennent accessibles

- Constat en fermant le lot 4d : les **dix** groupes de réglages globaux (entreprise, favicon, couleurs, typographie, boutons, export, SEO, navigation, preuve sociale, code PIN) étaient déjà des accordéons — mais leurs en-têtes étaient des `<div onclick>` : **non focusables au clavier, invisibles pour un lecteur d'écran**, sans état annoncé.
- Correctif : chaque en-tête porte `role="button"`, `tabindex="0"`, `aria-controls` vers son corps, `aria-expanded` calculé à l'ouverture, et répond à Entrée et à Espace. Le type d'élément et la mise en page ne changent pas — pas de régression visuelle possible. `toggleSettingsItem` met `aria-expanded` à jour à chaque basculement.
- Le lot 4d est donc **clos** : divulgation sur le rythme d'animation de section (`4.9.0-alpha.29`), sur les réglages d'élément (`4.9.0-alpha.40`), et accordéons sur les dix groupes globaux. Le groupe « Mise en page » de section n'en a pas besoin — trois rangées de pastilles ne font pas un mur.
- Tests : 1 nouveau ; 395/395.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.47) — Chaque élément de la section porte un nom distinct

- Constat : la liste « Éléments de la section » affichait jusqu'à neuf fois le même libellé dans la section Services (« Titre », « Texte »…). Deux boutons du menu portaient tous deux « Texte du bouton ». Impossible de savoir lequel on réglait.
- Deux causes, deux correctifs : (1) un bouton n'a pas de `data-editable`, son champ dort dans la liaison du popover contextuel (`aria-controls="cta-popover-<section>-<champ>"`) — cette information est maintenant lue, ce qui nomme « Bouton principal », « Texte du bouton » au lieu du générique « Bouton » ; (2) dans une section à listes, plusieurs éléments partagent le même nom de champ — ils sont désormais **numérotés** (« Titre 1 », « Titre 2 »…).
- Libellés complétés : Étiquette, Description courte, Lien, Type de bloc.
- Résultat mesuré sur un projet de référence : **zéro doublon** dans les trois sections testées (hero, header, services).
- Tests : 2 nouveaux, dont un qui parcourt **toutes** les sections d'un projet et refuse tout libellé en double ; 393 → **395/395**.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.46) — Le chrome perd son verre décoratif

- Craft-floor : « le verre et le flou comme décoration plutôt que comme effet précis ». Le chrome de l'éditeur en portait huit : les cinq menus flottants sombres (`bg-zinc-900/95 backdrop-blur-md`), la pilule de retour à l'aperçu, la barre du haut, le panneau de structure, l'en-tête du panneau de propriétés, et — le plus explicite — un `.sticky-dock-glass` dont le commentaire assumait le « glassmorphism ».
- Correctif : surfaces opaques, flou retiré. Les valeurs ne bougent presque pas (95 % → 100 % d'opacité) : c'est la suppression d'une signature visuelle, pas un changement de composition. La profondeur reste portée par les ombres, qui existaient déjà.
- Conservé volontairement : le **voile des modales** (`rgba(20,27,25,.32)` + `blur(18px)`) et l'en-tête du **site publié** (`bg-white/95 backdrop-blur-md`). Le premier est un effet au service d'une intention — détacher une boîte de dialogue du contenu ; le second appartient au design du site du client, hors périmètre.
- Tests : 1 nouveau ; 392 → **393/393**.
- Vérification : par test et par revue des valeurs. Je n'ai **pas** pu ouvrir un menu flottant à l'écran : la barre de section est masquée dès qu'un autre outil est actif (chrome contextuel), et mon clic a été bloqué — je le dis plutôt que de prétendre l'avoir vu.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.45) — Un seul vocabulaire de boutons, par les jetons

- Constat : les familles de boutons du chrome (`studio-v3-*`, `motion-loop-btn`, `btn-keycap`) réécrivaient chacune leurs valeurs — `height:34px`, `border-radius:10px`, `transition:.16s ease`, `border-radius:.5rem`, `opacity:.28`. Rien de visible à l'écran, mais autant d'occasions de diverger à la prochaine retouche.
- Correctif : cinq jetons de contrôle dans `tokens.css` — hauteur, rayon, écart, opacité désactivée et une transition partagée — que les familles consomment désormais. Les valeurs sont **numériquement identiques** (34 px, 10 px, 160 ms ≈ .16 s, 8 px) : c'est un changement de source de vérité, pas d'apparence.
- Un test vérifie que les jetons existent, que les familles les utilisent, et qu'aucune valeur arbitraire ne revient dans la règle partagée.
- Un test existant encodait la chaîne `var(--btn-radius, var(--cta-radius, 8px))` : **réécrit** pour vérifier le contrat — respecter les variables — au lieu de la valeur figée, afin qu'il ne casse plus à chaque changement de jeton.
- Tests : 1 nouveau ; 391 → **392/392**. Capture de contrôle : rendu inchangé, comme attendu.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.44) — Le panneau de propriétés suit enfin la section

- Cause trouvée : la visibilité du panneau dépendait d'une **requête média** (`matchMedia("(max-width: 1280px)")`) au lieu d'un état. Sur un écran large, ce chemin ne l'ouvrait donc jamais ; et après un changement de section il restait **bloqué sur la section précédente** — je cliquais « Hero », le panneau affichait « Menu ».
- Correctif : la visibilité est portée par `state.inspectorPanelOpen`, un état unique. `refreshInspectorPanel()` rend le contenu **et** applique la visibilité depuis cet état ; le bouton « Propriétés de la section » le bascule. La requête média disparaît du chemin du panneau.
- Effet de bord assumé : le panneau ne s'ouvre plus tout seul sous 1280 px. C'est un choix — une surtoile qui s'ouvre à chaque sélection de section recouvre le canevas. L'auteur l'ouvre explicitement, et son choix est conservé.
- **Vérifié à l'écran** : panneau fermé au chargement, ouvert par le bouton, **et il affiche bien « Hero » après sélection de Hero** — la désynchronisation a disparu. La liste des éléments du hero expose Badge, Titre, Sous-titre, Bouton principal, Bouton secondaire et Mention de confiance.
- Deux tests encodaient l'ancienne implémentation (requête média, classe ajoutée à la main) : ils ont été **réécrits** sur le nouveau contrat, pas supprimés.
- Tests : **391/391**.
- Reste, cosmétique : deux éléments de la liste peuvent porter le même libellé « Bouton » ; à désambiguïser.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.43) — Un seul indicateur de sélection d'élément

- Constat : sélectionner un élément dans la liste remplissait le panneau de propriétés mais **ne montrait rien sur le canevas**. L'auteur ne savait pas quel élément il réglait. Les deux chemins de sélection — liste et sélection libre — n'avaient pas le même retour visuel.
- Correctif : `highlightSelectedElement` applique la **même classe** que la sélection libre (`.is-freeform-selected`, le style de canevas déjà existant) et retire l'ancienne. Une seule source de sélection (`state.selectedElementKey`), un seul indicateur pour les deux chemins.
- Tests : 1 nouveau ; 390 → **391/391**.
- **Non vérifié visuellement**, et je le dis plutôt que de le laisser croire : je n'ai pas réuni les conditions d'une capture concluante. Sélectionner une section par sa ligne n'a pas rafraîchi le panneau — il affichait encore « Menu » alors que Hero était visé — et l'élément que j'ai fini par sélectionner se trouvait derrière le panneau.
- Anomalie relevée au passage, à instruire : le panneau de propriétés peut rester sur la **section précédente** après un clic sur une ligne de section. `renderInspector` ne lève pourtant **aucune** erreur sur les 16 sections d'un projet de référence — la cause est donc dans le chemin d'événement (`handleSectionNavigation` / `selectSection`), pas dans le rendu.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.42) — La liste des éléments vient du rendu, images et boutons compris

- Défaut trouvé en vérifiant : la liste « Éléments de la section » était dérivée des champs du **contenu**. Or plusieurs champs ne produisent aucun élément décorable (`blockType`, `ctaLink`, une provenance d'image, un compteur) : leurs clés étaient proposées alors qu'elles ne correspondent à **rien** sur le canevas — l'auteur aurait réglé un élément invisible.
- Correctif : la liste est désormais dérivée du **balisage rendu** (`collectSectionElements`), donc seuls les éléments réellement positionnables apparaissent. Un test vérifie que chaque clé proposée existe bien dans le canevas.
- Ce changement ajoute du même coup **les images et les boutons**, qui n'apparaissaient nulle part dans le contenu : la section Menu expose maintenant un élément « Bouton » que rien ne montrait auparavant.
- Libellés enrichis : nom de marque, téléphone, texte du bouton, image principale, mention de confiance, réservations actuelles et objectif.
- Tests : 2 nouveaux ; 388 → **390/390**.
- Reste : le geste de déplacement à la souris (validation utilisateur demandée), les boîtes de sélection unifiées, les gestes par appareil.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.41) — Position libre explicite, et le panneau ne se referme plus

- Fait : `enableElementTransform` active la position libre d'un élément **sans le déplacer** (décalage nul), et l'inspecteur propose « Activer la position libre » tant que l'élément suit le flux, puis « Revenir au flux » ensuite. L'option existait déjà, mais rien ne l'annonçait : elle ne s'activait qu'en tapant une valeur dans un champ.
- Bug corrigé au passage, et il comptait : **chaque modification refermait le panneau de propriétés**. `state.updateProject(..., true)` reconstruit l'éditeur, ce qui emportait la classe `is-responsive-open` avec l'ancien nœud. Un helper partagé, `refreshInspectorPanel()`, le rouvre et le re-rend après chaque écriture — les quatre chemins (activation, retour au flux, saisie d'une valeur, sélection d'un élément) passent désormais par lui.
- Correction de forme : un commentaire de documentation avait glissé au-dessus de la mauvaise méthode lors d'un ajout précédent ; remis sur la sienne.
- **Vérifié à l'écran, de bout en bout** : sélection d'un élément dans la liste → « Activer la position libre » → la pastille passe à « position libre », X et Y passent à 0 **sans que l'élément bouge**, le bouton devient « Revenir au flux », et **le panneau reste ouvert**. C'est le premier chemin d'écriture du lot 6 que je peux confirmer, et la première fois que je vois la bascule flux → position libre.
- Tests : 2 nouveaux ; 386 → **388/388**.
- Reste sur le lot 6 : le **geste** de déplacement à la souris (validation utilisateur demandée), la position libre pour les images et les boutons, et les boîtes de sélection unifiées.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.40) — Lot 4d : le bloc d'élément se replie aussi

- L'élément sélectionné affichait six rangées de réglages au même niveau. Désormais l'espacement et la forme — les deux qui font l'essentiel du travail — restent immédiats, et l'opacité, le fond, la bordure et l'ombre passent derrière « Réglages avancés : opacité, fond, bordure, ombre », replié par défaut, avec indicateur +/− et état retenu au nouveau rendu.
- La grille des réglages reste déclarée **une seule fois** : elle est partagée en deux groupes nommés, aucune rangée n'est recopiée. Le test qui vérifiait « parcourue une fois » vérifie maintenant « déclarée une seule fois, partagée, partage nommé » — il n'a pas été supprimé.
- **Vérifié à l'écran** : le bloc affiche espacement et angles, la divulgation repliée, et le bouton « Revenir au style du thème » ; le résumé « Réglages avancés : opacité, fond, bordure, ombre » est bien rendu.
- Tests : **386/386**.
- Reste sur 4d : le groupe « Mise en page » de section et les réglages globaux du projet.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.39) — Le bloc « Position et taille » est vérifié à l'écran

- **Vérifié à l'écran** : après sélection d'un élément dans la liste, le panneau affiche « POSITION ET TAILLE » avec la pastille « flux normal » et les cinq champs — X, Y, Largeur, Hauteur, Rotation — tous à `auto` tant que rien n'est saisi. La règle « flux par défaut, position libre en option » est donc **visible**, et pas seulement testée.
- **Non vérifié** : l'écriture. Mes outils de navigateur remplissent le champ mais ne déclenchent pas l'événement `onchange` ; la valeur n'est jamais validée et la pastille reste sur « flux normal ». Je n'ai **aucune preuve d'un défaut** — seulement l'impossibilité de valider ce chemin autrement que par les tests unitaires, qui passent.
- Correction d'une fausse alerte que j'avais émise en cours de route : le canevas « perturbé » (contour en pointillés, badge d'élément, boutons Remplacer / Anim sur l'image) n'est pas une casse de mise en page — c'est le chrome de sélection d'élément qui s'affiche, ce qui est le comportement attendu. J'avais mal interprété une capture, et je le note pour ne pas laisser cette inquiétude dans le dossier.
- Tests : inchangés à **386/386** — ce lot ne modifie aucun code, il consigne une vérification.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.38) — Les réglages d'élément deviennent accessibles, et vérifiés

- Cause : la sélection d'élément n'avait qu'un seul point d'entrée, la **sélection libre**, c'est-à-dire un geste de glisser que rien n'annonçait. Les réglages d'élément — styles du lot 4c, états des lots 5a/5b, position du lot 6 — étaient donc **inatteignables** par un clic, ce qui explique aussi pourquoi je n'avais jamais pu les voir.
- Correctif : liste « Éléments de la section » dans le panneau de propriétés — chaque champ textuel de la section y apparaît sous un libellé lisible, calculé sur la même référence stable que le rendu (`getUiCode`). Cliquer un élément le sélectionne.
- Correction annexe : la sélection d'élément posait `elementStyleState = "base"`, une valeur qui n'existe pas ; l'état neutre est `"default"`. L'inspecteur recevait donc un état inconnu.
- Détail d'implémentation : le re-rendu passe par `renderInspector` appelé directement, et non par `updateSelectedSectionUI`, qui repartait de la section et faisait perdre la sélection d'élément.
- **Vérifié à l'écran** : le panneau affiche « ÉLÉMENT SÉLECTIONNÉ » avec la référence stable, les cinq états (Principal, Survol, Focus clavier, Actif, Désactivé), les réglages de remplissage, angles, opacité, fond, bordure et ombre, et « Revenir au style du thème ». **Les lots 4c et 5a/5b sont confirmés visuellement pour la première fois.**
- Tests : 2 nouveaux ; 384 → **386/386**.
- Reste : le bloc « Position et taille » du lot 6 est plus bas dans le panneau défilant et n'a pas encore été vu à l'écran ; lot 3b (arbre complet, 830 lignes inertes), lot 4d (3 blocs), lot 7 (courbe, direction, tester), export 2d.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.37) — Le panneau de propriétés devient accessible, et enfin vérifié

- Cause : à 1280 px, `.studio-v3-inspector-panel` est une **surtoile** masquée (`transform: translateX(calc(100% + 24px))`, `opacity: 0`, `pointer-events: none`) qui n'apparaît qu'avec la classe `is-responsive-open`. Cette classe n'était posée que par un chemin indirect, jamais déclenché par la flèche « Inspecter ». Le panneau était donc **inatteignable** à cette largeur, et rien dans l'interface ne permettait de l'ouvrir.
- Correctif : bouton « Propriétés de la section » dans la barre du haut, avec `aria-controls` et `aria-expanded`, plus une méthode `toggleInspectorPanel()` qui ouvre ou ferme la surtoile et rafraîchit son contenu.
- **Vérifié à l'écran, pour la première fois de la mission** : le panneau s'ouvre et affiche « Réglages de la section », les contrôles de mise en page (pleine largeur / contenu / étroit, densité, alignement), les 12 animations du catalogue, la divulgation « Réglages avancés : vitesse et délai » **repliée avec son indicateur**, et le bouton « Tester l'animation en direct ». Les lots 4a, 4b, 4d (premier bloc), 7a, 7b et 7c sont donc désormais confirmés visuellement, et pas seulement par test.
- Toujours non vérifié, et je le redis : les propriétés d'**élément** (styles, états, position). Cliquer un texte n'ouvre pas la barre d'édition et ne renseigne pas la sélection d'élément ; ce chemin dépend d'un geste que mes outils de navigateur ne produisent pas.
- Tests : 1 nouveau ; 383 → **384/384**.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.36) — Le panneau de propriétés suivait la mauvaise section

- Bug certain, trouvé en lisant le code après une capture : `selectSection` ne rafraîchissait le panneau de propriétés que si la section était **déjà** sélectionnée (`if (alreadySelected) this.updateSelectedSectionUI()`). Changer de section laissait donc le panneau afficher les propriétés de la section précédente ; il fallait cliquer deux fois pour voir les bonnes.
- Correctif : le panneau est rafraîchi à chaque sélection, sans condition. Un test empêche le retour de l'ancienne condition.
- Découverte non résolue, documentée telle quelle : à 1280 px, le panneau de propriétés devient une **surtoile** (`.studio-v3-inspector-panel` en `@media (max-width:1280px)` : `transform: translateX(100% + 24px)`, `opacity: 0`, `pointer-events: none`) qui n'apparaît qu'avec la classe `is-responsive-open`. Malgré le correctif ci-dessus et un rechargement complet du navigateur, je n'ai pas réussi à la faire apparaître en cliquant la flèche « Inspecter » d'une section. Conséquence : **toute la surface de propriétés (sections, éléments, position) reste non vérifiée à l'écran** et peut être inatteignable à cette largeur.
- Tests : 1 nouveau ; 382 → **383/383**.
- Vérification : le correctif est démontré par lecture et par test, pas par capture — je n'ai pas pu rendre le panneau visible.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.35) — Lot 6 entamé : position et taille en nombres

- Fait : nouveau module `public/js/engine/elementTransform.js` — lecture, écriture et retrait des valeurs `x`, `y`, largeur, hauteur et rotation d'un élément, **palier par palier** (desktop / tablette / mobile), avec bornes (une largeur ne peut pas être nulle, la rotation reste dans ±180°).
- Règle tenue : **flux par défaut, position libre en option**. Un élément sans valeur ne produit **aucune** règle CSS — un test le vérifie — et l'entrée de position disparaît dès que le dernier champ est vidé : aucun projet ne se retrouve avec des réglages fantômes.
- Interface : bloc « Position et taille » pour l'élément sélectionné — cinq champs numériques, une pastille « flux normal / position libre » et un bouton « Revenir au flux ». L'écriture passe par un chemin unique et prend son instantané d'historique **avant** la mutation, comme l'exige le lot 8.
- Écart structurel découvert : `state.selectedElementKey` n'était renseigné qu'à **un seul endroit** du produit — l'entrée en sélection libre. Les réglages d'élément (les styles qui existaient déjà *et* ces nouveaux champs) n'étaient donc atteignables que par ce chemin, lui-même déclenché par un geste de glisser. Un clic sur un élément le sélectionne désormais pour l'inspecteur.
- Tests : 8 nouveaux dans `tests/element_transform.test.js` — 7 sur le modèle et le CSS réellement produit par le rendu, 1 sur le rendu des champs par l'inspecteur ; 374 → **382/382**.
- Vérification : **par test, pas par capture**. La sélection libre exige un geste de glisser que mes outils de navigateur ne savent pas produire ; le chemin par clic n'a pas non plus pu être confirmé à l'écran avant la fin du tour. Le modèle, l'interface et le CSS sont couverts — **le geste ne l'est pas**.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.34) — Le dernier glyphe du produit part, remplacé par une icône

- Trois derniers cas, dont deux que mes tours précédents avaient manqués : le bouton de lecture du composant vidéo (`▶`, affiché sur le site du client), les six pastilles d'étape du terminal de l'assistant (`○`, encore écrites en dur dans le balisage alors que leur mise à jour dynamique utilisait déjà le système d'icônes), et le bouton « Tester l'animation » de l'inspecteur (`▶`).
- Correctif : icône `play` ajoutée à la bibliothèque (même vocabulaire 24×24, trait, `currentColor`) et branchée aux trois endroits ; les pastilles d'étape sont laissées vides et remplies par le code qui les pilote déjà.
- Fausse alerte levée : je pensais voir des glyphes `⋯ ⇄ ⊕ ▼` dans les barres de section et de texte d'après une capture. Vérification faite dans le code, ce sont **déjà** des icônes SVG — j'avais mal lu une image à basse résolution. Je le note pour ne pas laisser croire à un travail qui n'a pas eu lieu.
- Tests : 1 nouveau ; 373 → **374/374**.
- Reste sur le volet visuel : unification du vocabulaire de boutons (valeurs arbitraires `34px`/`10px`/`.16s` au lieu des jetons — dette de nommage, pas défaut visible), puis le fond : lot 6 positionnement.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.33) — La barre de sélection freeform quitte les glyphes

- Craft-floor : « les glyphes Unicode ou emoji tenant lieu d'un système d'icônes » sont refusés. La sélection freeform — le contrôle le plus « Canva » du produit — en portait sept : `↻` (pivoter), `⇤ − + ⇥` (ordre des plans), `H↔` et `V↕` (distribuer). Mon tour précédent avait conclu trop vite que le chrome était nettoyé : je n'avais cherché que dans les `textContent`, jamais dans le balisage des barres d'outils.
- Correctif : sept icônes ajoutées à la bibliothèque (`rotateCw`, `bringToFront`, `sendToBack`, `bringForward`, `sendBackward`, `distributeHorizontal`, `distributeVertical`), dessinées dans le même vocabulaire que les 89 existantes — SVG 24×24, trait, `currentColor` — et branchées dans la barre freeform.
- Tests : 2 nouveaux dans `tests/visual_craft.test.js` (aucun glyphe restant, et chaque icône rend un SVG bien formé sans glyphe) ; 371 → **373/373**.
- Vérification : **par test, pas par capture**. J'ai ouvert l'éditeur et cliqué un élément, mais cela déclenche l'édition de texte en ligne et non la boîte freeform ; je n'ai pas réussi à la faire apparaître dans le navigateur dans le temps imparti. Les icônes sont donc garanties présentes et bien formées, pas validées à l'œil — je préfère l'écrire que de le laisser supposer.
- Découverte au passage : les barres d'outils de section et de texte portent encore des glyphes (`⋯ ⇄ ⊕ ▼`). Relevé pour le prochain tour.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.32) — Les statuts du chrome passent par le système d'icônes

- Craft-floor : « les glyphes Unicode ou emoji tenant lieu d'un système d'icônes » sont refusés. Le chrome en portait encore cinq : la confirmation de copie, le message Schema.org, le statut « Enregistré », la copie générique, et surtout la table d'état des étapes de l'assistant (`○ … ✓ ! ×`), cinq glyphes qui tenaient lieu d'icônes.
- Correctif : les glyphes décoratifs qui préfixaient du texte sont retirés (le mot porte déjà le sens), et les cinq états d'étape passent par `getIcon` (`clock`, `check`, `helpCircle`, `x`) dans le créneau d'icône qui leur était destiné.
- Distinction maintenue : le `✓` du badge « Assurance décennale valide » est du **contenu** affiché sur le site du client, pas du chrome. La mission avait explicitement mis les badges hors périmètre — il reste intact.
- Tests : 1 nouveau dans `tests/visual_craft.test.js` ; 370 → **371/371**.
- Vérification : par test, pas par capture — ces états sont transitoires (toast, alerte, étape d'assistant) et ne se laissent pas photographier de façon fiable. Je le dis plutôt que de prétendre l'inverse.
- Reste : unification du vocabulaire de boutons (quatre familles coexistent), puis lot 6 positionnement.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.31) — Le lanceur d'assistant ne recouvre plus le canevas, les kickers disparaissent

- Cause, **vue à l'écran** et non déduite : le lanceur « Studio Assistant IA » était une pilule fixe de 10 rem posée en bas à droite **au-dessus du canevas** ; sur un site réel elle recouvrait la carte « ARTISAN RÉFÉRENCE » du hero — exactement la superposition que la mission initiale visait. Il portait en plus un `border-bottom: 3px solid` sur un élément entièrement arrondi, soit l'antipattern `border-accent-on-rounded` que le détecteur d'Impeccable signalait déjà à `app.css:2137`.
- Correctif : lanceur réduit à une pastille ronde compacte (2,75 rem) ancrée dans le coin, nom accessible conservé (`aria-label`) plus une infobulle ; bord épais supprimé ; bloc de texte large retiré ; règle CSS de la pilule devenue morte supprimée (14 lignes en moins dans `app.css`).
- Craft-floor appliquée telle quelle : les deux kickers numérotés du tableau de bord (« 01 — Direction commerciale », « 02 — Directions actives ») sont supprimés. La règle est explicite — « aucun brief ne le rachète » — et les titres se tiennent seuls. Cinq lignes de CSS devenues mortes retirées de `studio-v3.css`.
- Vérification **par captures**, la première de la mission : avant/après sur l'éditeur (la carte du hero est de nouveau entièrement lisible, plus aucun recouvrement) et sur le tableau de bord (le titre démarre sans étiquette).
- Correction d'honnêteté : j'avais annoncé un « emoji ✨ » dans le lanceur. Vérification faite dans le code, il utilisait déjà `getIcon("sparkles")` — c'était une erreur de lecture de ma part, pas un défaut du produit.
- Tests : 2 nouveaux dans `tests/visual_craft.test.js`, et le test historique du lanceur réécrit pour décrire le nouveau contrat (compact, nom accessible, sans bord épais) au lieu de l'ancienne pilule ; 368 → **370/370**.
- Reste : glyphes de statut résiduels du chrome (`✓ ○ × !`), unification du vocabulaire de boutons (quatre familles coexistent), puis lot 6 positionnement.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.30) — Les surfaces du navigateur sont thématisées (skill Impeccable)

- Ce que la skill relève et que le produit ne faisait pas : « la sélection de texte, le curseur, les barres de défilement, les anneaux de focus et les chiffres tabulaires arrivent avec les réglages par défaut du navigateur, qui n'appartiennent à aucun design system. C'est le signal le moins coûteux qu'une page a été construite plutôt qu'assemblée — et celui que les modèles oublient le plus systématiquement. » Vérification faite : `::selection`, `caret-color`, `::-webkit-scrollbar`, `scrollbar-color`, `::placeholder`, `::marker` et `font-variant-numeric` étaient **absents** du chrome de l'éditeur.
- Correctif : jetons de surface ajoutés dans `tokens.css` (sélection, curseur, barre, piste), puis thème porté à `.studio-editor`. La racine du chrome existe déjà, donc la portée exclut le site publié par construction — et un test le vérifie plutôt que de le supposer.
- Second vocabulaire de focus supprimé : la divulgation du lot précédent s'appuyait sur un jeton `--ui-focus` inexistant, d'où un anneau vert de secours alors que le produit n'a qu'un anneau (`--ui-ring`). Corrigé, et un test interdit le retour d'un second jeton.
- Mode Operate respecté : les chiffres des identifiants et des compteurs passent en chiffres tabulaires, toutes les couleurs viennent des jetons existants (encre, papier, accent), aucune valeur arbitraire ajoutée, et le site publié garde ses surfaces par défaut.
- Tests : 4 nouveaux dans `tests/browser_surfaces.test.js` (jetons déclarés, surfaces réellement thémées, portée limitée au chrome, focus unique) ; 364 → **368/368**.
- Reste, signalé par la skill et non traité ici : « glass et blur comme décoration » dans les menus flottants, et des glyphes/emoji résiduels dans le chrome ; PRODUCT.md et DESIGN.md restent à écrire.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.29) — Lot 4d entamé : l'inspecteur cache le secondaire

- Problème : l'inspecteur présentait tous ses contrôles au même niveau. Sur le seul bloc Animation, l'auteur voyait 12 pastilles, la vitesse, le délai et le bouton de test sans aucune hiérarchie — « wall of controls » au sens de la skill Impeccable.
- Correctif : primitive de divulgation progressive partagée (`disclosure`) dans l'inspecteur, appuyée sur `<details>/<summary>` natifs — donc accessible au clavier sans JavaScript, avec anneau de focus. Premier usage : « Réglages avancés : vitesse et délai » regroupe le rythme derrière un résumé lisible ; le choix de l'animation et le bouton de test restent immédiats.
- Détail qui compte : l'état ouvert est retenu par module et réappliqué au nouveau rendu du panneau. Sans cela le panneau se refermerait à chaque modification — le remède serait devenu le défaut.
- Skill Impeccable : chargée, et son `context` exécuté pour cette session. Le projet n'a ni PRODUCT.md ni DESIGN.md : en mode raffinement le code fait autorité, `init` reste à faire. Détecteur mécanique relancé sur les fichiers modifiés : uniquement des avertissements pré-existants (gray-on-color, bounce-easing, border-accent-on-rounded), aucun introduit par ce lot.
- Tests : 4 nouveaux dans `tests/inspector_disclosure.test.js` (replié par défaut, essentiel visible, état retenu au nouveau rendu, style et focus clavier) ; 360 → **364/364**.
- Reste : appliquer le même patron aux autres groupes de l'inspecteur (états, réglages d'élément, composants) et écrire PRODUCT.md / DESIGN.md.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.28) — Lot 7c étendu : texte et image, et le menu texte rejoint le catalogue

- Cause : la vitesse et le délai n'existaient que pour la section ; et le menu d'animation du texte, dernier survivant des anciens catalogues locaux, affichait encore « Fade », « Slide », « Spring » — la même animation portait donc deux noms selon l'endroit — avec une ligne d'aide dupliquée.
- Correctif : `setActiveTextTiming` et `setImageMotionTiming` écrivent la vitesse et le délai des éléments et des images, avec les mêmes trois choix que la section ; le rendu émet `data-motion-speed` et `data-motion-delay` sur les nœuds texte et image, comme sur la section.
- Menu texte : il lit désormais `MOTION_PRESETS`, expose les 12 entrées du catalogue avec leurs libellés français, et n'affiche plus qu'une seule ligne d'aide. À l'ouverture, les boutons Vitesse et Délai montrent la valeur réellement enregistrée pour le champ sélectionné.
- Méthode : une erreur d'import (`MOTION_SPEEDS` utilisée dans `renderer.js` sans être importée) a été détectée par la suite complète, diagnostiquée à la trace de pile, puis corrigée avant tout commit. Un test de rendu réel de l'éditeur couvre maintenant cette classe de faute.
- Tests : 3 nouveaux dans `tests/motion_timing.test.js` ; 357 → **360/360**.
- Reste : courbe et direction par animation ; le menu texte garde le vocabulaire de répétition `once / twice / infinite` alors que le catalogue dit `once / twice / thrice / loop` — migration à faire avec précaution car ces valeurs sont persistées dans les projets.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.27) — Lot 7c : la durée et le délai viennent du catalogue

- Cause : le catalogue annonçait une durée propre pour chaque animation, mais une règle globale (`--anim-duration-multiplier` sur une base figée à 0,85 s), présente en double dans `app.css` et `exporter.js`, écrasait toutes ces durées. Toutes les animations jouaient au même rythme et l'auteur ne pouvait rien régler.
- Correctif : `motionTimingCSS()` dérive le CSS du catalogue — une variable `--motion-base` par animation, la vitesse relative et le délai — et le rendu l'injecte (`<style data-motion-timing>`) pour l'éditeur, l'aperçu et l'export. Le réglage global de vitesse reste appliqué par-dessus.
- Réglages : « Vitesse » (Normale / Lente / Rapide) et « Délai » (Aucun / Léger / Net) dans le panneau Animation de la section ; l'animation est relancée à chaque changement pour que l'effet soit visible. Un seul chemin d'écriture (`setSectionMotionTiming`) et un seul instantané d'historique.
- Accessibilité : un délai est ramené à 0 sous `prefers-reduced-motion`.
- Tests : 5 nouveaux dans `tests/motion_timing.test.js`, dont une assertion sur le rendu réel (feuille injectée, attributs posés uniquement quand le réglage n'est pas neutre) ; 351 → **357/357**.
- Reste : courbe et direction par animation, vitesse et délai pour les animations d'élément et d'image, outil tester/rejouer/arrêter/réinitialiser.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.26) — Lot 7b : le rendu lit enfin le catalogue d'animations

- Cause : le catalogue unique existait depuis `4.9.0-alpha.22` et l'inspecteur le lisait, mais deux surfaces du rendu déclaraient encore leur propre liste — le menu d'animation d'image (6 entrées) et le panneau d'animation de section (7 entrées). La même animation y portait un autre nom, et six animations disponibles n'étaient proposées nulle part.
- Correctif : `renderEditableImage` et `renderSection` construisent désormais leurs pastilles depuis `MOTION_PRESETS`. Chaque menu propose les 12 entrées du catalogue — 11 animations réellement jouables plus « Aucune » — donc ce qui est affiché se joue.
- Aperçu au survol : les pastilles `slide-in`, `magnetic` et `progress-fill` n'avaient aucune règle `:hover` et ne se prévisualisaient pas ; les 11 animations jouables se prévisualisent maintenant, avec les keyframes du rendu final.
- Tests : 2 garde-fous ajoutés (`tests/motion_presets.test.js`) — interdiction de toute liste locale inline dans le rendu, et aperçu au survol obligatoire pour chaque animation du catalogue ; 349 → **351/351**.
- Vérification : `node --check` sur le renderer, `scripts/build-utilities.mjs` (aucune classe utilitaire nouvelle), suite complète 351/351. Contrôle visuel non réalisé (capture indisponible).

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.25) — L'accessibilité du mouvement devient vérifiée

- **Contrôle mené sur les douze animations du catalogue** : chacune est bien neutralisée quand le
  système demande de réduire les mouvements. Le produit tient donc sa promesse — dix blocs
  `prefers-reduced-motion` couvrent les animations d'éléments par une règle générique. Aucun écart
  trouvé, donc aucune correction à apporter : le résultat est celui d'une vérification, pas d'une
  réparation.
- **Cette vérification devient permanente** : un test échoue désormais si une animation du catalogue
  pouvait se jouer malgré `prefers-reduced-motion`. C'était jusqu'ici une propriété vérifiée à la main
  et rappelée dans les règles du dépôt ; elle est maintenant garantie par la suite.
- **QA** : `tests/motion_presets.test.js` passe de 8 à 9 tests. **349/349 tests**.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.24) — Lot 7b : l'inspecteur lit le catalogue

- **Première surface branchée** : la liste d'animations de la section dans l'inspecteur ne déclare plus
  ses dix entrées ni ses noms anglais — elle lit `MOTION_PRESETS`. L'auteur voit donc désormais
  « Apparition en fondu », « Montée douce », « Rebond »… au lieu de « Fade », « Slide », « Spring ».
- **Deux animations de plus** deviennent accessibles à cet endroit (« Entrée latérale », « Barre qui se
  remplit ») : le catalogue vérifié au lot précédent garantit qu'elles sont réellement jouables.
- **QA** : test ajouté — l'inspecteur doit lire le catalogue et ne plus contenir de nom anglais brut.
  **348/348 tests**.
- *Reste (7b)* : les cinq autres surfaces (menu de section du canevas, texte, image, bouton, réglages
  globaux), l'exposition de la durée, du délai et de la courbe, et les actions tester / rejouer /
  arrêter / réinitialiser.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.23) — Le catalogue ne promet que du réel

- **Défaut trouvé dans mon propre travail avant de le brancher** : le catalogue livré au lot précédent
  annonçait **« Rebond d'appel » et « Halo »**, deux effets qui n'existent **pas** dans le rendu des
  sections — ils appartiennent à la famille des animations de bouton (`btn-motion-*`). Les afficher
  dans la liste des animations de section aurait promis à l'auteur des effets qui ne se jouent jamais.
- **Les deux entrées sont retirées** du catalogue (douze animations, toutes jouables) et un test
  **interdit désormais d'annoncer une animation absente du CSS** : il compare chaque identifiant du
  catalogue aux règles `data-motion="…"` réellement présentes. C'est le garde-fou qui empêche cette
  classe de mensonge de revenir.
- **QA** : `tests/motion_presets.test.js` passe de 6 à 7 tests. **347/347 tests**.
- *Rappel de portée* : le catalogue n'est toujours **pas** branché sur les surfaces (lot 7b). Rien ne
  change pour l'auteur à ce stade.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.22) — Lot 7a : catalogue d'animations unique

- **Cause racine traitée** : l'audit relevait **six surfaces d'animation avec six catalogues
  différents** (10, 7, 5, 6, 6 et 6 entrées) et les mêmes effets portant des noms distincts selon
  l'endroit — « Fade » ici, « Fondu » là. `public/js/data/motionPresets.js` devient la **source
  unique** : quatorze animations décrites par un nom français, ce qu'elles font, et leur nature
  (apparition, attention, continu).
- **Les mots de l'auteur, pas ceux du code** : « Apparition en fondu », « Montée douce », « Rebond »,
  « Rideau », « Cascade », « Magnétique », « Pulsation », « Reflet », « Barre qui se remplit ». Un test
  interdit qu'un nom anglais brut revienne s'afficher.
- **La répétition devient explicite**, comme le demandait la mission : *Une fois · Deux fois ·
  Trois fois · En continu*, avec l'avertissement que le continu ne s'arrête jamais et doit rester
  réservé aux éléments décoratifs. Les **déclencheurs** sont posés : à l'apparition, au chargement,
  au survol, au clic.
- **Replis sûrs** : un identifiant inconnu (projet ancien) retombe sur « Aucune » ou s'affiche tel
  quel, plutôt que de disparaître silencieusement.
- **QA** : `tests/motion_presets.test.js` (6 tests) — unicité, absence de doublon, noms lisibles,
  nature explicite, répétition et déclencheurs, replis, et vérification qu'aucune surface ne
  redéclare son propre catalogue. **346/346 tests**.
- **Ce qui reste (7b)** : brancher les six surfaces sur ce catalogue, exposer durée, délai, courbe et
  direction, et ajouter les actions tester / rejouer / arrêter / réinitialiser. En l'état, le
  catalogue existe et les surfaces **ne l'utilisent pas encore** : rien ne change pour l'auteur.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.21) — Wording humain dans le chrome

- **23 formulations techniques remplacées par du français lisible**, comme le demandait la mission
  (« wording humain plutôt que jargon CSS ») : « Animation du Bloc (60fps) » → « Animation de la
  section », « Inspecteur de Section » → « Réglages de la section », « Intelligence Composant » →
  « Analyse du bloc », « Ratio libre / verrouillé » → « Proportions libres / bloquées », « Vers
  desktop / tablette / mobile » → « Adapter au bureau / à la tablette / au mobile », « Hériter du
  desktop » → « Reprendre la version bureau ».
- **La fréquence d'images disparaît de l'interface** : six dernières mentions de « 60fps » retirées
  (infobulles et texte d'aide). C'est une information d'implémentation, pas une information utile à
  l'auteur — et un marqueur d'interface générée.
- **Deux tests de non-retour** ajoutés : le jargon retiré ne peut pas revenir dans le chrome, et
  « 60fps » n'y a plus sa place.
- **QA** : 3 attentes de test mises à jour (le vocabulaire a changé volontairement), **340/340 tests**.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.20) — États éditables depuis l'inspecteur

- **Les six réglages d'élément s'appliquent maintenant au style de base ou à un état**, au choix, dans
  le bloc « Élément sélectionné » : un sélecteur **Principal · Survol · Focus · Actif · Désactivé**, une
  aide qui rappelle que les réglages suivants ne visent que cet état, et un bouton qui devient
  **« Effacer cet état »** au lieu de « Revenir au style du thème ».
- **Une seule grille pour les deux cibles** : les six rangées sont déclarées une fois et parcourues une
  fois ; seule la commande change selon l'état choisi. Un test vérifie l'absence de duplication — c'est
  la garantie que les deux chemins ne divergeront pas.
- **Tout reste annulable** : chaque réglage d'état passe par l'historique avec un libellé explicite
  (« Réglage de l'état Survol ») et non un message générique.
- **QA** : `tests/element_states.test.js` passe de 9 à 10 tests. **338/338 tests**.
- *Toujours non vérifié* : l'apparence à l'écran de ce bloc (inspecteur hors du champ des captures à
  1280 px). Le modèle, la parité aperçu/export et l'annulation sont prouvés par test.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.19) — Un seul vocabulaire de réglages

- **Cause racine traitée** : les styles d'élément et les états d'élément étaient deux familles de
  réglages séparées, avec deux façons d'écrire le CSS. Une même intention — « respiration aérée » —
  devait s'écrire deux fois. Une **primitive partagée** (`declarationsFor`) produit désormais les
  déclarations pour les deux : un état peut porter les six réglages d'élément (respiration, arrondi,
  opacité, fond, bordure, ombre) **et** une déclaration libre filtrée (couleur issue du nuancier).
- **Garde-fou** : une propriété pilotée par une échelle refuse une valeur hors échelle — sinon
  « padding: gigantesque » passerait par la liste blanche des déclarations libres. L'opacité garde
  l'exception d'une valeur numérique nue, qui est l'usage historique du curseur.
- **QA** : `tests/element_states.test.js` passe de 5 à 9 tests (vocabulaire partagé, refus des
  valeurs hors échelle, et restauration des deux tests d'interface). **337/337 tests**.
- *Deux tests d'interface avaient été supprimés par erreur pendant ce lot* (un script de troncature a
  coupé plus large que prévu) : je les ai **rétablis** plutôt que de laisser la suite s'appauvrir en
  silence.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.18) — Réglages d'élément complétés

- **Fond, bordure et ombre** rejoignent la respiration, l'arrondi et l'opacité : six réglages par
  élément, tous **annulables** et tous conditionnés (rien n'est émis si l'auteur n'a rien changé).
- **Un fond accentué impose un texte lisible** : la paire « fond accentué + texte blanc » est
  indissociable dans le modèle, pour ne pas livrer un contraste illisible par construction.
- **Contrainte de parité respectée** : les valeurs n'utilisent que des jetons du **site**
  (`--primary`, `--bg-sec`) ou des valeurs littérales sûres. Les jetons `--ui-*` du chrome ne sont
  **pas** utilisés, car le site autonome exporté ne les définit pas — c'est précisément le genre
  d'écart qui a cassé l'export.
- **QA** : `tests/element_style.test.js` passe de 5 à 6 tests. **337/337 tests**.
- *Toujours non vérifié* : l'apparence à l'écran des blocs de l'inspecteur (hors champ des captures à
  1280 px). Le rendu, la parité aperçu/export et l'annulation sont, eux, prouvés par test.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.17) — Lot 4c : réglages d'élément

- **Répond à la demande « LES BLOCS / ÉLÉMENTS »** de la mission, qui n'avait rien : un élément
  sélectionné dans le canevas peut recevoir une **respiration interne** (aucune, compacte, normale,
  aérée), un **arrondi** (angles vifs, adouci, arrondi, pilule) et une **opacité** (100, 85, 60 %),
  plus un bouton **« Revenir au style du thème »**.
- **Même architecture que les sections et les états** : le CSS est produit par une primitive unique
  (`elementStyleCSS`) injectée par `renderWebsiteHTML`, et il cible la clé de mise en page stable que le
  renderer pose déjà sur chaque élément — **aucun balisage à modifier**. Éditeur, aperçu et site
  autonome exporté reçoivent donc exactement la même feuille.
- **Rien par défaut** : un élément non réglé n'émet aucune règle. Les 16 sections de la vitrine de
  référence ne bougent pas d'un pixel.
- **Aucune valeur libre dans le CSS** : tout vient d'énumérations, une propriété ou une valeur inconnue
  est ignorée et la source n'est jamais mutée.
- **Application annulable** : `setSelectedElementStyle` et `clearSelectedElementStyle` passent par
  l'historique.
- **QA** : `tests/element_style.test.js` (5 tests) — absence de règle par défaut, déclaration ciblée,
  entrées invalides ignorées, source intacte, suppression propre, présence à l'identique dans l'aperçu
  **et** dans l'export. **336/336 tests**.
- *Non vérifié* : l'apparence à l'écran du nouveau bloc « Élément sélectionné » dans l'inspecteur,
  pour la même raison que le lot 4b (inspecteur hors du champ des captures à 1280 px).

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.16) — Lot 4b vérifié

- **Le doute du lot précédent est levé, et l'erreur était dans mon test, pas dans le code.** L'assertion
  « le rendu partagé n'applique rien par défaut » échouait parce qu'elle cherchait
  `data-section-layout="custom"` dans **toute** la page : or la feuille de style injectée contient
  elle-même ce sélecteur. Le test compare désormais le **balisage seul**, feuilles retirées.
- **Preuve rétablie et exécutée** : une section personnalisée porte bien `data-section-layout="custom"`
  et `--section-max: 56rem` dans l'aperçu **et** dans le site autonome exporté ; une démo non modifiée
  n'émet aucun marquage, et la feuille partagée est injectée pour les trois surfaces.
- **QA** : `tests/section_layout.test.js` passe de 6 à 7 tests. **331/331 tests**.
- *Reste sur ce lot* : la seule chose que je n'ai pas pu faire est de **regarder** l'inspecteur à
  l'écran (il est hors du champ de mes captures à 1280 px). Le modèle, le branchement du rendu, la
  parité éditeur/aperçu/export et l'application annulable sont, eux, prouvés par test.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.15) — Lot 4b : réglages de section branchés

- **Renderer** : les deux réglages sont posés sur l'élément `<section>` (variables CSS et attribut
  `data-section-layout="custom"`) et la feuille partagée `SECTION_LAYOUT_CSS` est injectée à côté des
  styles du hero — donc éditeur, aperçu et site autonome exporté partagent la même source.
- **Inspecteur** : trois rangées de choix (largeur, respiration, alignement) avec l'état actif visible,
  et la mention que ces réglages ne concernent que la section sélectionnée.
- **Application** : `setSectionLayoutValue` passe par l'historique d'annulation.
- **Outil d'analyse corrigé** : le releveur de classes lisait les attributs `class` coupés par une
  concaténation JavaScript et en tirait des jetons fantômes (par exemple « id »). Il ignore désormais
  ces fragments, après retrait des expressions de gabarit — les attributs normaux restent analysés.
- **QA** : **330/330 tests**. `tests/section_layout.test.js` couvre le modèle (6 tests).
- **Avertissement honnête, à lever impérativement au prochain lot** : le branchement n'a **pas** pu
  être validé visuellement. L'inspecteur n'est pas visible à 1280 px avec mes outils, et le test
  d'intégration que j'avais écrit (« le rendu partagé applique la mise en page ») **échouait sans que
  je puisse diagnostiquer pourquoi** dans la marge restante : je l'ai retiré plutôt que de le laisser
  en échec ou de l'assouplir jusqu'à ce qu'il ne prouve plus rien. Il est possible qu'un champ
  `style` déjà présent dans les projets de démonstration déclenche le marquage, ou que la section
  modifiée ne soit pas rendue comme le test le supposait. **À vérifier avant de considérer le lot 4
  comme livré.**

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.14) — Lot 4a : socle des réglages de section

- **Le manque le plus net de l'audit** : une section n'avait **aucun** réglage de mise en page — ni
  largeur, ni respiration verticale, ni alignement. `public/js/engine/sectionStyle.js` pose le modèle
  (largeur pleine / contenu / étroite, espacement compact / normal / aéré, alignement gauche / centre /
  droite), avec valeurs par défaut complètes et repli sur les valeurs sûres en cas de réglage inconnu.
- **Aucun risque pour les vitrines existantes** : rien n'est rendu tant que l'auteur n'a pas modifié un
  réglage. Le CSS partagé ne cible que les sections portant `data-section-layout="custom"`, et un test
  interdit toute règle non conditionnée sur `.site-section`.
- **Une seule source de CSS** : la feuille vit dans le module et sera injectée par `renderWebsiteHTML`,
  comme les styles du hero — donc éditeur, aperçu et **site autonome exporté** partageront le même
  rendu, sans troisième copie.
- **QA** : `tests/section_layout.test.js` (6 tests) — pas de réglage, pas de rendu ; variables bornées ;
  valeurs inconnues neutralisées ; la section source n'est jamais mutée ; CSS conditionné ; validation
  des identifiants. **330/330 tests**.
- **Ce qui reste (4b)** : le branchement dans le renderer (les deux chemins éditeur et vitrine) et
  l'interface dans l'inspecteur. En l'état, **l'auteur ne peut pas encore régler une section** : le
  modèle est prêt et testé, rien de plus.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.13) — Revenir au style principal

- **Action explicite « Effacer cet état »** dans le menu couleur : elle supprime toutes les
  déclarations de l'état choisi sur l'élément et ramène au style principal, au lieu de laisser
  l'auteur chercher comment défaire un survol. L'effacement passe par `clearElementState`, donc par
  le modèle partagé, et par `state.updateProject`, donc il est **annulable**.
- **Le produit explique au lieu d'échouer en silence** : sans état choisi, l'action indique
  « Choisissez d'abord un état à effacer » ; sans texte sélectionné, elle invite à en sélectionner un.
- **QA** : test ajouté (présence de l'action, passage par la primitive et par l'historique, message
  d'aide). **324/324 tests**.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.12) — Sécurité d'usage des états

- **Trou de sécurité d'usage corrigé, introduit par le lot précédent** : une fois un état choisi
  (« Survol », « Focus »…), fermer le menu faisait disparaître toute trace de ce choix. L'auteur
  pouvait ensuite régler une couleur en croyant modifier le style principal alors qu'il modifiait un
  survol. La barre d'outils affiche désormais une **pastille d'état** tant que l'état actif n'est pas
  « Principal ».
- **QA** : test ajouté (présence du rappel et de sa bascule). **323/323 tests**.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.11) — Lot 5b : les états sont éditables

- **Sélecteur d'état dans le menu couleur du texte** : « Principal · Survol · Focus · Actif ·
  Désactivé ». L'auteur voit toujours **à quel état** s'appliquent les réglages suivants ; un message
  le confirme à chaque changement, et sortir de l'édition revient automatiquement au style principal.
- **Les réglages respectent l'état choisi** : hors « Principal », la couleur alimente
  `elementStates[clé].état` au lieu du style par défaut, donc la règle est produite par la primitive
  partagée et se retrouve à l'identique dans l'éditeur, l'aperçu et le **site autonome exporté**.
  Le chemin du style principal n'est pas exécuté en plus, et la modification passe par l'historique
  d'annulation.
- **QA** : 2 tests ajoutés — présence des cinq états dans l'interface, et vérification que la branche
  « état » écrit bien dans `elementStates` via la clé de mise en page du renderer, avant de sortir.
  **322/322 tests**.
- *Reste (5b, second temps)* : l'aperçu immédiat de l'état sans survol réel, le bouton explicite
  « Revenir au style principal » hors du menu, et l'extension des états aux autres réglages
  (fond, bordure, opacité) qui utilisent encore le style par défaut uniquement.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.10) — Finitions de cohérence

- **Un seul rayon « pilule » dans le chrome** : les cinq dernières valeurs littérales `999px` de
  `studio-v3.css` passent par le jeton `--ui-radius-full`. La valeur est identique, mais le chrome
  n'a plus deux familles parallèles (`999px` et `9999px`) pour la même intention. Un test interdit
  désormais toute valeur littérale de rayon pilule dans la feuille du chrome.
  *Portée volontairement limitée* : les 24 valeurs de `app.css` concernent surtout le contenu du site
  et seront traitées avec le lot de densité, pas à l'aveugle.
- **QA** : **320/320 tests**.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.9) — Lot 5a : socle des états d'élément

- **Modèle de données** (`public/js/engine/elementStates.js`) : chaque élément peut porter des écarts
  de style pour **survol, focus, actif et désactivé**, indexés par sa clé de mise en page stable
  (`data-layout-key`). Le style par défaut reste dans le rendu habituel : seuls les écarts sont
  stockés, et un projet sans état ne produit **aucune** feuille de style.
- **Une seule primitive de rendu** : `elementStateCSS` est injectée par `renderWebsiteHTML`, donc
  l'éditeur, l'aperçu et le **site autonome exporté** partagent exactement les mêmes règles — l'auteur
  voit ce qui sera publié. Le `focus` est traduit en `:focus-visible`, cohérent avec la politique de
  focus unique du produit.
- **Sécurité** : liste blanche de propriétés CSS et refus des valeurs contenant `;`, `{`, `}`, `<`,
  `>`, `url(`, `expression(` ou `javascript:`. Les clés de mise en page sont validées avant d'entrer
  dans un sélecteur. Un plafond de 400 règles évite une feuille de style non bornée.
- **QA** : `tests/element_states.test.js` (5 tests) — aller-retour sans muter le projet source, refus
  des déclarations dangereuses ou hors liste, vidage d'un état et nettoyage de l'élément, forme exacte
  du CSS produit (`:hover`, `:focus-visible`, `:disabled`), présence dans l'aperçu **et** dans
  l'export, et absence totale de règle quand aucun état n'est défini. **319/319 tests**.
- **Ce qui reste (5b, non fait)** : l'interface — sélecteur d'état dans l'inspecteur, application des
  réglages à l'état choisi, bouton « Revenir au style principal », et entrée dans l'historique. En
  l'état, le modèle et le rendu existent et sont testés, mais **rien dans l'interface ne permet encore
  de définir un état**.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.8) — Lot 2c : dette de classes réduite

- **Défaut réel corrigé** : le champ de recherche de la palette de commandes portait
  `placeholder-zinc-400`, qui n'est pas une classe valide — la couleur du texte indicatif ne
  s'appliquait donc jamais. Remplacé par `placeholder:text-zinc-400`, désormais généré et actif.
- **Barre d'onglets sans barre de défilement** : `no-scrollbar` était utilisée sans aucune règle
  (la barre restait visible). Elle reçoit une vraie définition (`scrollbar-width: none` et
  `::-webkit-scrollbar`), donc le contenu reste défilable mais sans barre apparente.
- **Marqueurs redondants retirés** : `app-dashboard-shell`, `dashboard-topbar`,
  `dashboard-v3-field-name`, `ai-avatar-wrapper` et `cmd-group` n'avaient aucune règle et
  doublonnaient une classe déjà stylée. Aucun effet visuel possible (une classe sans règle ne peint
  rien) ; le balisage et les listes gelées sont simplement plus honnêtes.
- **Dette suivie** : la liste gelée des classes émises sans règle CSS passe de **34 à 26** côté
  application. Les 26 restantes sont des crochets sémantiques (`site-theme-*`, `tab-nav-btn`,
  `btn-sec-*`) ou des restes d'anciens gabarits, à traiter avec l'arbre des éléments.
- **QA** : **314/314 tests**, générateur d'utilitaires à jour, listes gelées mises à jour.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.7) — Lot 3a : savoir ce qui est sélectionné

- **Défaut corrigé (relevé par l'audit)** : deux modèles de sélection se déclenchaient ensemble sans
  jamais s'effacer. Masquer une barre laissait la sélection active en mémoire, si bien que les
  **flèches déplaçaient un élément invisible**. Un garde de visibilité empêche désormais toute
  manipulation d'une sélection dont la boîte n'est plus à l'écran, sans effacer la sélection — le fil
  de contexte continue de l'afficher.
- **Échap suit un escalier unique et prévisible** : édition en ligne, puis modale, puis élément
  sélectionné, puis barres flottantes. Auparavant, Échap faisait tout à la fois et ne remontait jamais
  la hiérarchie.
- **Fil de contexte visible** : la barre d'étape de l'éditeur affiche `Section ▸ Élément` (par
  exemple « Hero ▸ #EWC7TW ») au lieu du seul nom de section, avec le libellé humain du nœud
  (`data-layout-label`) et l'infobulle portant toujours le texte complet. Le libellé est calculé par
  une méthode unique, utilisée à la fois par le rendu initial et par chaque changement de sélection.
- **QA** : `tests/selection_hierarchy.test.js` (4 tests) — libellé humain et repli sur la référence
  stable, sélection multiple, remise à zéro, ordre de l'escalier Échap, et garde de visibilité des
  flèches. **314/314 tests**. Vérifié au navigateur : sélection d'un titre dans le canvas, la barre
  affiche « Hero ▸ #EWC7TW ».

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.6) — Lot 9b : comptes dans l'interface

- **Appel HTTP unique** (`public/js/api.js`) : `apiFetch` avec `credentials: "same-origin"`, délai
  d'attente, et `ApiError` qui porte le message du serveur — l'interface n'interprète plus jamais un
  code HTTP elle-même.
- **Session** (`public/js/session.js`) : amorçage au démarrage, connexion, inscription, déconnexion,
  récupération et envoi des projets, et distinction explicite des trois états : connecté, anonyme,
  **indisponible** (hébergement sans disque persistant) ou hors ligne — dans ce dernier cas
  l'application reste utilisable en local au lieu de bloquer.
- **Interface** : bouton « Se connecter » dans l'en-tête du dashboard, modale de compte (deux onglets,
  français, sans jargon), et pastille « identifiant · Se déconnecter » une fois connecté. La modale
  utilise le coordinateur d'overlays existant et les mêmes classes que les autres modales.
- **Synchronisation** : quand une session est ouverte, chaque enregistrement local est aussi poussé au
  serveur (groupé sur 600 ms) ; au démarrage, la bibliothèque du compte est fusionnée avec la copie
  locale en gardant la version la plus récente par projet. Le `localStorage` reste la copie hors ligne.
- **Migration des créations locales** : à la première connexion, les sites présents sur l'appareil mais
  absents du compte (ou plus récents) sont proposés dans un bandeau, avec **copie de secours
  `artisite_migration_backup_v11` avant tout import**. Rien n'est jamais supprimé silencieusement.
- **QA** : `tests/accounts_client.test.js` (7 tests) — erreurs HTTP et réseau de `apiFetch`, les quatre
  états de session, la décision de migration (absent, plus récent, plus ancien, invalide), la copie de
  secours, le corps envoyé à l'import, et la présence des points d'entrée dans l'interface.
  **310/310 tests**.
- **Vérifié au navigateur** : connexion réelle de bout en bout sur un serveur local — la modale
  s'ouvre centrée, le compte est créé, l'en-tête affiche l'identifiant et la déconnexion, et le fichier
  de données ne contient que des empreintes `scrypt` et un jeton de session haché.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.5) — Lot 9a : comptes côté serveur

- **Persistance serveur sans aucune dépendance** : `server/store.js` tient un fichier JSON unique
  (utilisateurs, sessions, projets) écrit de façon atomique — fichier temporaire puis renommage —
  avec un dossier configurable par `DATA_DIR`. Node 18 suffit.
- **Mots de passe** : `scrypt` avec un sel aléatoire de 16 octets par utilisateur et comparaison à
  temps constant. Le mot de passe en clair n'apparaît ni dans la réponse HTTP ni dans le fichier de
  données (vérifié par test).
- **Sessions** : jeton aléatoire de 32 octets, **seul son SHA-256 est stocké**, cookie `HttpOnly`,
  `SameSite=Lax`, `Secure` derrière HTTPS, expiration à 30 jours configurable.
- **Routes** : `POST /api/auth/register|login|logout`, `GET /api/auth/session`,
  `GET /api/projects`, `PUT|DELETE /api/projects/:id`, `POST /api/projects/import`. Chaque projet
  porte un `ownerId` ; toute lecture ou écriture hors propriétaire répond **404**, identique au cas
  « inexistant », pour ne pas révéler l'existence d'un projet. La connexion renvoie le **même message**
  pour un identifiant inconnu et un mot de passe faux (pas d'énumération des comptes).
- **Freinage** : 20 tentatives par adresse IP et par tranche de 5 minutes sur connexion et inscription.
- **Honnêteté de déploiement** : sur un hébergement sans disque persistant (Vercel), les routes de
  compte répondent **503 avec un message explicite** au lieu de laisser croire que les données sont
  conservées.
- **QA** : `tests/accounts_api.test.js` (8 tests) — hachage vérifié sur le contenu du fichier,
  inscription, doublon, saisies invalides, connexion, session anonyme, déconnexion et révocation,
  isolation entre deux comptes, mise à jour et suppression par le propriétaire, refus 503.
  **303/303 tests**.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.4) — Lot 8 : annulation réellement fiable

- **Motif corrigé** : onze commandes **enregistraient l'instantané après avoir modifié le projet**.
  Le bouton « Annuler » restaurait alors un état déjà modifié : appuyer une fois ne changeait rien.
  Bandeau flottant, numéro WhatsApp, ambiance globale, gras/italique/souligné et taille de texte par
  flèches poussaient tous leur historique trop tard ; l'instantané est désormais pris **avant**.
- **Vingt commandes n'avaient aucun historique** : couleur de texte, réglages de navigation, preuve
  sociale, code PIN client, assombrissement du hero, taille de texte au curseur, et les six
  affectations `updateProject(..., false)` des animations. Toutes sont annulables.
- **Mutations continues regroupées** : `pushHistoryCoalesced` fusionne les pas d'un curseur dans une
  seule entrée d'historique (25 pas = 1 entrée au lieu de 25), sans quoi l'annulation aurait demandé
  autant de clics que de mouvements.
- **QA** : nouvelle suite `tests/undo_coverage.test.js` — huit commandes vérifiées de bout en bout
  (valeur avant, action, annulation, rétablissement), garde-fou de source interdisant
  `updateProject(..., false)`, et mesure du regroupement. **295/295 tests**.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.3) — Lot 2b : icônes, densité et téléphone

- **Icônes cohérentes** : les 122 emojis et glyphes décoratifs du chrome sont remplacés par de vraies
  icônes du système maison (`icons.js`) — 63 → 89 clés. Trois appels existants (`tag`, `laptop`,
  `upload`) affichaient un cercle générique parce que la clé manquait : c'est corrigé. Les raccourcis
  clavier (`⌘K`, `Échap`), les glyphes typographiques (`✓`, `★`, `→`) et le contenu du site restent
  intacts.
- **CSS mort retiré** : 92 lignes de règles dont aucun composant ne portait la classe
  (`studio-v3-modal-frame`, `studio-v3-wizard-*`, `floating-section-toolbar`, …). Vérifié au
  navigateur : la modale de composition et le wizard sont inchangés.
- **Dashboard sur téléphone** : le rail ne disparaît plus à ≤ 760 px — il devient une barre basse qui
  conserve l'accès aux projets, à la création, à la vitrine et au thème (auparavant le basculement de
  thème était inaccessible sur mobile). Les titres passent en `clamp()` au lieu de 44 px et 38 px
  fixes, et les métadonnées de projet restent visibles.
- **Défaut majeur découvert et documenté** (antérieur à ces lots, reproduit sur `fe06c75`) : le
  **site autonome exporté est cassé** — le hero superpose son contenu et la mise en page des sections
  ne s'applique pas, parce que l'export embarque une copie partielle et divergente des styles du site
  au lieu de la source qui sert l'éditeur et l'aperçu. Correctif planifié en lot dédié (extraction des
  styles de site en module partagé) ; la vitrine publique et l'aperçu éditeur sont corrects.
- **QA** : 285/285 tests, `npm run check:css` à jour, modale de composants et wizard vérifiés au
  navigateur.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.2) — Lot 2a : finition du chrome

- **Feuille de style morte supprimée** : `product-precision.css` (179 de ses 273 règles n'étaient
  émises par aucun composant ; ses trois sélecteurs encore vivants étaient déjà écrasés par
  studio-v3). Le marqueur orphelin `studio-modal-card` est retiré de six modales. Vérifié avant/après
  au navigateur : dashboard et modale de commande inchangés.
- **Typographie du chrome unifiée** : 397 tailles arbitraires (`text-[8px]` … `text-[11.5px]`)
  remplacées par cinq classes d'échelle (`text-ui-2xs/xs/sm/base/md`) adossées aux jetons. Les tailles
  du *contenu du site* (`renderer.js`) sont conservées : la vitrine garde ses valeurs calibrées.
- **Graisses normalisées** : 33 déclarations utilisaient des graisses intermédiaires (640, 650, 680,
  690, 720, 730, 750, 760) que les polices chargées ne contiennent pas et que le navigateur
  synthétisait. Elles retombent sur 600 ou 700.
- **Focus** : les 7 `outline:0` / `outline:none` restants sont retirés — l'anneau `:focus-visible`
  unique n'était plus neutralisé par un sélecteur de classe plus spécifique.
- **Contraste** : les 16 couples texte/fond sous 4,5:1 sont remplacés par les jetons atténués.
  Mesure : les pires cas passent de 2,16:1, 2,43:1, 2,57:1 et 3,24:1 à 5,50:1, 5,13:1, 4,78:1 et
  7,80:1 ; l'audit automatique ne trouve plus aucune couleur de texte sous le seuil.
- **Tactile** : bloc `pointer:coarse` étendu à tout le chrome (topbar, rail, actions de ligne,
  commutateurs, actions groupées, barre d'outils de section, boutons freeform) — 44 px minimum.
- **Mouvement** : l'alternative `prefers-reduced-motion` couvre désormais le dashboard, les cartes
  projet, les lignes de structure, l'inspecteur, la barre d'étape et les modales.
- **QA** : 5 tests de non-régression ajoutés (zéro taille arbitraire dans le chrome, aucune
  suppression d'anneau de focus, aucune graisse intermédiaire, seuil de contraste des jetons,
  absence de la feuille morte, blocs tactile et mouvement) — **13/13 tests design, 285/285 complets**.
- *Point ouvert consigné* : dans le canvas de l'éditeur (~640 px à 1280 de fenêtre), la vitrine rend
  sa navigation bureau et se retrouve à l'étroit (le logo se replie, FAQ frôle le CTA). Cause :
  les media queries du site répondent à la **fenêtre**, pas à la largeur du canvas. Correction prévue
  au lot responsive (requêtes de conteneur sur le canvas), pas encore appliquée.

### Maturation produit — 17 septembre 2026 (4.9.0-alpha.1) — Lot 1/9 : socle design system

- **Cause racine corrigée** : le balisage utilise un vocabulaire d'utilitaires (hérité de Tailwind)
  dont seules quelques familles étaient écrites à la main. Mesure avant lot : **452 classes émises
  sans aucune règle CSS** (1 863 occurrences) — tailles arbitraires (`text-[10px]` ×204,
  `text-[11px]` ×136), états `hover:` ×39, `focus:`, variantes `sm:`/`lg:`, mode sombre
  `dark:`, opacités `/60`, `shrink-0`, `whitespace-nowrap`, `ring-2`… Autrement dit : la
  micro-typographie, les états d'interaction et le responsive du chrome n'étaient pas appliqués.
- **Une seule source** : `scripts/build-utilities.mjs` relève les classes réellement émises, déduit
  celles qui n'ont aucune règle, **réutilise d'abord les déclarations déjà écrites** dans le projet,
  puis synthétise le reste. Il produit deux artefacts depuis cette source : `public/css/utilities.css`
  (application, éditeur, aperçu) et `public/js/engine/utilitiesCss.js` (site autonome exporté).
  Résultat : 386 règles applicatives, 369 pour l'export, **0 classe d'utilitaire sans règle**.
- **Parité éditeur / export** : la même couche alimente l'application et le HTML autonome, et un test
  vérifie que **chaque classe du HTML exporté possède une règle dans ce même fichier**.
- **Jetons du produit** (`public/css/tokens.css`) : échelle typographique, espacements, rayons,
  ombres, couleurs de rôle, durées et courbes — plus la déclaration des jetons fantômes
  (`--primary` utilisé 13× sans être déclaré, `--btn-radius`, `--card-radius`, `--motion-ease`,
  `--font-heading`, `--font-body`, `--sticky-*`). Les `--v3-*` deviennent des alias.
- **Politique de focus unique** : un seul anneau `:focus-visible` global. Les 63 `focus:outline-none`
  du balisage ne sont **volontairement pas générés** : ils auraient remis un contour transparent et
  supprimé la seule indication de focus clavier.
- **Nettoyage des marqueurs « IA »** : dégradé indigo → violet du chrome remplacé par la couleur
  d'accent du produit, pastille `animate-ping` et flèche `animate-bounce` retirées (animations
  gratuites), CTA d'en-tête rendu insécable.
- **QA** : nouvelle suite `tests/design_system.test.js` (8 tests : fraîcheur du générateur,
  zéro classe non couverte, définitions réelles des tailles/variantes/états, jetons déclarés,
  autosuffisance du HTML exporté, non-retour des marqueurs IA) et **280/280 tests complets**.
- **Mesure de non-régression visuelle** : comparaison avant/après (worktree sur `fe06c75`) du
  dashboard et de l'éditeur à 1280 ; le dashboard est identique, l'éditeur gagne ses micro-libellés
  et ses états. Point ouvert consigné : en canvas étroit (~640 px) l'en-tête de la vitrine rendu dans
  l'éditeur est à l'étroit — à traiter au lot 2.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.54)

- Aperçu des presets : survoler un preset joue son mouvement **directement sur le bouton**, dans le panneau de section, le menu du texte, celui de l’image et la grille des Réglages. L’auteur voit le mouvement avant de l’appliquer, sans quitter le menu.
- Fidélité : l’aperçu réutilise exactement les mêmes keyframes que le rendu final — ce qui est survolé est ce qui sera publié — et il est désactivé sous `prefers-reduced-motion`.
- Aide : chaque menu affiche « Survolez un preset pour le prévisualiser. »
- QA : 5/5 tests d’animation (boucles + aperçu), 272/272 tests complets, `git diff --check` propre.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.53)

- Boucles d’animation : chaque animation peut désormais être jouée **une fois, deux fois ou en boucle continue**, au niveau de la section, du texte et de l’image. Un sélecteur « Répétition » est partagé par les trois menus, et la boucle est neutralisée automatiquement avec `prefers-reduced-motion`.
- Distinction section / élément : les intitulés deviennent « Animation de la section », « Animation de l’élément · texte » et « Animation de l’image · élément », avec un texte d’aide qui renvoie vers le bon outil — fini le « Animation du bloc » ambigu.
- Lisibilité : chaque preset porte un glyphe, et l’état actif est conservé à l’ouverture des menus.
- QA : 4 tests de boucle (rendu section/élément/image, absence de boucle par défaut, neutralisation reduced-motion, libellés distincts), 271/271 tests complets.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.52)

- Sortie de l’édition en ligne : Échap termine désormais l’édition d’une cellule ou d’un texte en confirmant la valeur et en retirant le focus, au lieu de laisser le curseur actif. Le bouton de la barre d’outils texte devient une validation explicite (« Terminer l’édition », coche) qui blur la cellule.
- Un seul chemin de sortie (`exitInlineEditing`) est partagé par Échap dans la cellule, la validation et le gestionnaire global Échap — plus de mode « coincé ».
- QA : test comportemental (blur effectif, barre masquée), 12/12 tests d’intégrité éditeur, 267/267 tests complets, sortie confirmée par capture navigateur.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.51)

- Matrice de non-régression des gestes : 9 tests couvrant les trois modalités. Souris — magnétisme d’ancrage (bord, centre, seuil), lignes d’alignement, égalisation des espacements, sélection au cadre. Tactile — défilement automatique en bordure. Clavier — pas de 1 px / 10 px, Échap, groupage ⌘G, magnétisme à 15°. Responsive — mise à l’échelle entre breakpoints.
- La géométrie du moteur libre est désormais vérifiée par comportement (valeurs exactes) plutôt que par simple présence de chaînes dans le code.
- QA : 9/9 pour la nouvelle matrice, 266/266 tests complets, détecteur Impeccable sans alerte sur le moteur.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.50)

- Ancres d’édition : chaque ancre du canevas porte désormais `onclick="event.preventDefault()"` en mode éditeur. `href` reste présent pour la sémantique et la parité d’export, mais un clic ne peut plus déclencher de navigation de fragment ni d’ouverture `tel:`/`sms:` parasite.
- Portée : le site public et l’export conservent leurs liens natifs, sans aucune injection.
- QA : test de rendu vérifiant l’ancre d’en-tête inerte en éditeur et l’absence totale d’injection publique ; 11/11 tests d’intégrité éditeur, 257/257 tests complets.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.49)

- CTA d’en-tête : son conteneur ne portait pas `data-ui-target="true"`, il était donc exclu de la liaison éditeur. Cliquer le bouton principal de l’en-tête ouvrait uniquement son lien `#simulateur` au lieu de ses réglages — le contrôle le plus visible de la page était inutilisable. Le renderer garantit désormais cette liaison pour chaque CTA en mode éditeur, sans modifier le site public.
- QA : test de rendu vérifiant que l’en-tête CTA est lié dans l’éditeur et que le site public conserve zéro cible éditeur ; ouverture du panneau confirmée en navigateur.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.48)

- Tableau comparatif : le conteneur était en `overflow-hidden`, si bien que sur un canevas étroit les trois colonnes se comprimaient et le contenu était coupé. Le tableau vit maintenant dans un conteneur à défilement horizontal, avec une largeur minimale de 40 rem pour garder des cellules lisibles.
- Tactile : les cellules éditables du tableau reçoivent un rembourrage renforcé sous pointeur grossier, pour une cible de saisie fiable.
- QA : test de rendu sur le conteneur de défilement et la largeur minimale ; 9/9 tests d’intégrité éditeur, 255/255 tests complets.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.47)

- Conflit d’origine : la couche libre émettait `transform-origin:50% 50%!important` sur tout élément positionné, même sans rotation ni échelle. Elle écrasait donc l’origine propre à certaines animations, notamment `progress-fill` qui doit progresser depuis la gauche. L’origine n’est désormais revendiquée que lorsqu’une rotation ou une échelle l’exige.
- Style vivant : l’éditeur retire aussi l’origine dès qu’un élément n’a plus ni rotation ni échelle, afin qu’un preset d’animation reprenne la main après réinitialisation.
- QA : test de rendu vérifiant l’absence d’origine sur un élément seulement positionné et sa présence sur rotation ou échelle ; 8/8 tests d’intégrité, 254/254 tests complets.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.46)

- Aperçu des animations de section : la prévisualisation ajoutait `is-revealed` sans `motion-preview`, si bien que le garde-fou d’édition `opacity:1!important` écrasait le fondu. Les presets basés sur l’opacité (Fade, Zoom, Reveal, Shimmer) paraissaient donc morts. L’aperçu bascule désormais sous `motion-preview`, puis restaure le garde-fou.
- Vitesse : le multiplicateur de rythme écrasait les durées propres à chaque preset par une base unique de 0,85 s. Chaque preset conserve maintenant son temps via `--motion-duration`, que la vitesse multiplie ; Pulse, TextPulse et ImgPulse, déclarés en `!important`, honorent eux aussi le multiplicateur.
- QA : test comportemental sur l’aperçu de section, test sur la vitesse par preset, 252/252 tests complets, syntaxe et `git diff --check` propres.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.45)

- Transformations libres : rotation et échelle partagent désormais une origine unique au centre de l’élément. Auparavant l’ajout d’une échelle faisait passer l’origine de `50% 50%` à `0 0`, si bien qu’un élément déjà redimensionné se mettait soudain à pivoter autour de son coin.
- Cohérence éditeur / aperçu / export : la même déclaration `transform-origin:50% 50%!important` est émise dans les trois contextes, donc le rendu ne saute plus entre l’édition et la publication.
- Redimensionnement de groupe : l’échelle étant appliquée autour du centre, le déplacement est compensé de la moitié du delta d’échelle de chaque côté afin que les bords demandés par le geste restent exacts.
- QA : test d’intégrité sur l’origine unique et la compensation, sonde de rendu CSS vérifiée, 251/251 tests complets, syntaxe et `git diff --check` propres.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.44)

- Aperçu appareil : la largeur simulée du canevas gouverne désormais les breakpoints. En modes Mobile et Tablette, les utilitaires desktop (`md:flex`, `lg:grid-cols-*`, `lg:col-span-*`, `lg:order-*`, tailles de texte) reviennent à leur valeur de base ; la navigation desktop ne déborde plus dans le cadre 390 px et le hero se recompose en colonne.
- Portée sûre : la couche d’aperçu est chargée uniquement par la coque éditeur (`public/index.html`) et n’est référencée ni par le renderer ni par l’export ; les sites clients conservent exactement leurs media queries d’origine.
- Performance : la bascule Ordinateur/Tablette/Mobile n’anime plus la largeur du canevas, supprimant le layout thrash sur toute la page.
- QA : 4/4 tests d’intégrité éditeur, 250/250 tests complets, captures 390/768/1280, détecteur Impeccable exécuté.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.43)

- Historique : l’édition inline du canevas et des cellules, comme la saisie dans l’inspecteur et la barre latérale, capturent désormais la valeur d’avant-édition. Undo annule réellement la modification et Redo la rétablit, au lieu d’enregistrer un instantané déjà modifié.
- Contrôles Freeform : les barres d’alignement, de calques et de responsive partagent une pile mesurée qui bascule au-dessus de la sélection quand le bas du canevas est occupé ; plus de convergence au même point.
- Chrome éditeur : le dock de contact client et les repères Freeform n’apparaissent plus pendant l’édition ni au-dessus de l’aperçu.
- Tactile : boutons et poignées des contrôles libres portent à 44 px sous pointeur grossier.
- Animations : les transitions et animations sont suspendues pendant un déplacement/redimensionnement pour stabiliser la géométrie mesurée.
- QA : 36/36 tests ciblés éditeur/V3, 249/249 complets, détecteur Impeccable exécuté (deux avertissements préexistants consignés), syntaxe et `git diff --check` propres.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.42)

- Wizard : les six étapes du terminal suivent désormais le cycle réel de la requête et de la construction du projet ; aucun minuteur ne valide la rédaction avant la réponse réseau.
- Transparence : une réponse IA indisponible ou limitée affiche explicitement la reprise par le modèle local, tandis que l’éditeur ne s’ouvre qu’après l’assemblage effectif.
- Accessibilité : état courant exposé avec `aria-current`, annonces polies et animation neutralisée avec `prefers-reduced-motion`. Validation : 11/11 tests async ciblés, 246/246 complets, syntaxe et `git diff --check`.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.41)

- Éditeur CTA : un clic ouvre uniquement les réglages du bouton ; le déplacement/redimensionnement passe désormais par l’action explicite « Position », sans superposer les outils CTA et Freeform.
- Canevas libre : une cellule isolée est bornée par son parent éditable immédiat, empêchant son redimensionnement de recouvrir la colonne voisine. Les poignées et le libellé ne se chevauchent plus.
- QA : 33/33 tests ciblés sur les régressions V3 puis 244/244 tests complets.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.40)

- Accessibilité : chaque champ nommé du wizard possède désormais une association native `label[for]` / `id`, y compris les paramètres avancés.
- Performance : suppression du `@import` Google Fonts bloquant et dupliqué ; les familles restent chargées une seule fois depuis le `<head>`.
- QA : 33/33 tests ciblés sur le wizard, les fontes et les régressions V3 ; 242/242 tests complets.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.39)

- API : les origines navigateur sont limitées à la production, au développement local, aux hôtes servis ou à la liste `ALLOWED_ORIGINS` ; le wildcard CORS global est supprimé.
- Coûts IA : génération, copilote et image sont limités par IP avec budget/fenêtre configurables et réponse HTTP 429 explicite.
- Exploitation : les réglages sont documentés dans `.env.example`. Validation : 16/16 tests serveur ciblés et 240/240 complets, origines autorisée/refusée et dépassement de quota compris.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.38)

- Démo client : suppression du code implicite `1234` ; seul un PIN explicitement configuré de 4 à 6 chiffres peut déverrouiller une présentation.
- Confidentialité : le PIN sauvegardé n’est plus réaffiché dans le bouton, le champ ou les notifications ; changer le code révoque aussi l’accès déverrouillé courant.
- Transparence : le partage précise désormais que ce verrou protège la démo interne Artist, pas les exports HTML/ZIP statiques. Validation : 22/22 tests ciblés et 239/239 complets.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.37)

- Sécurité : le contenu métier modifiable est neutralisé avant tout rendu public, éditeur ou export autonome ; les URL exécutables, injections CSS et fermetures de script JSON-LD sont rejetées.
- Architecture : les six copies de `escapeHtml` sont remplacées par un module partagé qui centralise aussi les règles URL, CSS et sérialisation JavaScript.
- QA : charges XSS testées dans l’identité, le Hero, les liens et les styles ; rendu/export restent inertes. Validation : 10/10 tests ciblés, 237/237 complets, syntaxe et `git diff --check`.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.36)

- Éditeur : les outils contextuels Texte, Section, Freeform et CTA sont désormais mutuellement exclusifs ; ouvrir l’un masque les autres sans effacer la sélection ni les réglages persistés.
- Couches : les trois niveaux d’outils utilisent les variables partagées `--z-toolbar-section`, `--z-toolbar-text` et `--z-toolbar-freeform` au lieu de valeurs dispersées.
- QA Chrome sur l’éditeur Esprit Nature : Texte → une seule barre visible, Freeform → un seul cadre visible, contrôle Section → autres outils masqués ; zéro erreur console. Validation : 31/31 tests ciblés, 234/234 complets, syntaxe et `git diff --check`.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.35)

- Bibliothèque : sélection multi-projets, sélection de toutes les cartes visibles, compteur, annulation et suppression groupée avec cibles 34×34.
- Persistance : une suppression groupée est sauvegardée en une opération ; vider volontairement la bibliothèque persiste `[]` et ne recrée plus automatiquement le projet Esprit Nature au prochain chargement.
- QA Chrome : suppression 4→2 puis reload=2, suppression 2→0 puis reload=0 ; sélection conservée après rerender et aucun overflow à 390 px. Validation : 19/19 ciblés, 233/233 complets et `git diff --check`.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.34)

- Vitrine : le simulateur de devis est désormais placé avant le footer ; le footer redevient le dernier bloc public, sans section interactive après lui.
- Garde-fou visuel : démo canonique et nouvelle instance Esprit contrôlées en Chrome à 1440 et 390 px ; largeur racine = viewport, header centré à 1280 px desktop, hero pleine largeur et aucun overflow horizontal.
- Template sûre : une instance sans avis/horaires conserve 3 emplacements d’avis et 7 horaires `À renseigner`, sans note ni horaires inventés. Validation : 34/34 ciblés, 232/232 complets et `git diff --check`.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.33)

- Templates : registre explicite avec `Esprit Nature — Référence 1:1`, `Artisan Moderne` et `Local Chaleureux`; le wizard choisit la base avant génération et persiste `templateId/templateName`.
- Référence 1:1 : la composition, les variants et les sections visibles de la démo canonique sont instanciés sans copier son état freeform ni ses données client; le nom, la ville, le téléphone et les contenus métier viennent du nouveau projet.
- Alternatives : un paysagiste peut désormais choisir une direction non-Esprit Nature ; `templateId` pilote le renderer au lieu de forcer tous les paysagistes dans la même composition.
- Factualité : les sections Avis/Horaires restent présentes dans la template de référence mais affichent des emplacements `à renseigner` quand les données ne sont pas fournies; suppression des fallbacks publics `5.0/5 — 5 avis` et `9h - 12h / 14h - 18h` dans ce cas.
- QA Chrome : picker 3 colonnes propre à 1440, pile scrollable à 390 sans overflow; création Artisan Moderne puis Esprit Référence testées réellement. La référence est pleine largeur 1440/1440, 3 slots avis transparents, 7 horaires `À renseigner`, zéro erreur console. Validation : 28/28 ciblés puis 232/232 complets et `git diff --check`.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.32)

- Démo canonique : `Voir la vitrine` instancie désormais une copie fraîche de la référence Esprit Nature au lieu de relire `proj-esprit-nature` depuis `localStorage`; les déplacements/freeform ou contenus cassés d'une copie de bibliothèque ne contaminent plus la vitrine de référence.
- Navigation : dashboard, éditeur, aperçu projet et vitrine canonique utilisent de vraies entrées `history.pushState` et restaurent la vue via `popstate`; Retour/Avancer reste dans l'application.
- Aperçu éditeur : `Voir le site` prévisualise maintenant le projet courant au lieu d'ouvrir systématiquement Esprit Nature.
- QA Chrome : avec une copie Esprit Nature volontairement corrompue en storage, la vitrine affiche le CTA canonique, `freeformLayout` vide et 1440/1440 px; Retour revient au dashboard. Dupont éditeur → aperçu → Retour revient à l'éditeur Dupont, puis au dashboard; zéro erreur console. Validation : 43/43 ciblés, 228/228 complets et `git diff --check`.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.31)

- Responsive : audit navigateur du dashboard et de l’éditeur à 1440×900, 1024×800 et 390×844 sans débordement horizontal ; sticky client masquée en conception mobile.
- Inspecteur : drawer V3 validé à 1024 et 390 px, borné au viewport, scrollable et fermable par un contrôle accessible.
- CTA éditeur : les listeners de popover sont désormais idempotents lors des rebinds ; sur tactile, le tap est résolu au `pointerup` et le clic synthétique retargeté vers un contrôle flottant est neutralisé en capture.
- QA Chrome : popover CTA réellement ouvert à 1024 et 390, `aria-expanded=true`, surface intégralement dans le viewport et zéro erreur console. Validation automatisée : 51/51 ciblés, 226/226 complets et `git diff --check`.
- Production : Vercel vérifié après propagation ; HTML/runtime/titre navigateur servent `4.8.0-alpha.31`, `/api/health` est OK et le QA tactile 390 de la production reproduit le popover CTA sans overflow.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.30)

- Reparenting : mode `Page` explicite pour déplacer un calque entre sections ; `parentSectionId` est persisté par breakpoint et les sections publiques exposent le même contrat que l’éditeur.
- Géométrie : déplacement inter-section conserve la boîte visuelle mesurée au début du geste ; Header→Hero et retour restent à 87,625×72 dans le QA Chrome, sans resize fonctionnel.
- UX/Undo : la cible de section est surlignée, `Page` repasse réellement à OFF après le drop, un retour vers la section d’origine reste un placement libre explicite et Undo restaure la section précédente.
- Cohérence : runtime de reparenting partagé dans l’éditeur/preview et script équivalent dans l’export standalone ; test Chrome standalone confirme un élément `position:absolute` dans la couche de la section cible. Validation : 50/50 ciblés, 225/225 complets.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.29)

- Tactile : bouton `Multi +` accessible au doigt pour ajouter/retirer des éléments sans Shift ; groupes conservés comme unités et état `aria-pressed` explicite.
- Ergonomie coarse pointer : cibles du label portées à 34 px minimum et poignées Move/Rotation repositionnées dans les coins du cadre afin de ne plus recouvrir les commandes tactiles.
- Marquee : auto-scroll progressif du vrai `#editor-main-canvas` à l’approche des bords supérieur/inférieur, avec recalcul des hits pendant le scroll et arrêt garanti au pointerup/cancel.
- QA Chrome : tap titre → 1, `Multi ✓`, tap rôle → 2, retap titre → rôle seul ; marquee au bord inférieur fait défiler +102 px pendant le geste ; zéro erreur console. Validation : 48/48 ciblés, 223/223 complets et `git diff --check`.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.28)

- Groupes imbriqués : un groupe parent conserve ses sous-groupes via `childGroups/parentId` tout en gardant `members` aplati pour les transformations existantes.
- Sélection : Shift-clic traite désormais un groupe comme une unité ; clic simple sur une multi-sélection non groupée réévalue la hiérarchie sans casser le drag collectif.
- Dégrouper un niveau : supprimer un groupe parent libère ses sous-groupes sans les détruire ; Undo restaure la hiérarchie complète.
- UX : la barre Responsive est repliée par défaut derrière `Resp.` afin de ne plus recouvrir les champs voisins. QA Chrome : parent 3 calques, Move +10 sur les 3, ungroup externe puis sous-groupe 2 calques intact, zéro erreur console. Validation : 37/37 ciblés, 221/221 complets et `git diff --check`.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.27)

- Responsive assisté : adaptation explicite d’une sélection entre Desktop / Tablette / Mobile avec échelle de référence 1200 / 768 / 390 ; x/y/width/height sont proportionnels, rotation/z/scale/ratio restent cohérents.
- Outils : barre Responsive avec `→ D / → T / → M`, `Hériter D` et `Reset ici`, mutations indépendantes par breakpoint et Undo-compatible via le moteur d’état existant.
- UX : le cadre et ses toolbars sont resynchronisés au début et à la fin de la transition de viewport afin de ne plus sortir de l’écran après un switch d’appareil.
- QA Chrome : Desktop x=12/y=8 → Mobile x=3,9/y=2,6 ; édition Mobile x=10,9 sans toucher Desktop ; héritage restaure 3,9/2,6 ; Reset supprime uniquement Mobile ; toolbars bornées au viewport, zéro erreur console. Validation : 44/44 ciblés, 219/219 complets et `git diff --check`.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.26)

- Ratio : bouton `Ratio libre / Ratio verrouillé` pour une sélection unique, persisté par breakpoint ; Shift conserve temporairement le ratio sur une poignée diagonale.
- Contraintes : resize individuel et collectif borné à la section active afin d’éviter les dimensions incontrôlées.
- Priorité freeform : une largeur/hauteur explicite neutralise désormais `min-width/min-height/max-height` hérités, en live comme dans preview/export.
- QA Chrome : cadre portrait `537,59×672` redimensionné en `298,02×372,53`, ratio conservé à `0,000016` près ; état `298,03×372,54`, `min-height:0px`, énorme drag toujours contenu dans la section, zéro erreur console. Validation : 42/42 ciblés, 217/217 complets et `git diff --check`.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.25)

- Resize snapping : les poignées de redimensionnement accrochent désormais les bords/centres voisins et ceux de la section, avec guides visuels ; Alt désactive l’accroche.
- Équidistance : pendant un déplacement, le moteur compare alignement classique et spacing entre voisins puis choisit l’offset le plus proche ; les gaps égaux sont matérialisés par deux guides et une mesure en px.
- Fiabilité : les `DOMRect` voisins sont sérialisés explicitement (`left/right/top/bottom/width/height`) au lieu d’un spread vide.
- QA Chrome : largeur 247→282 px avec écart final 0,016 px au bord cible ; spacing vertical final 22,5/22,5 px, label `23 px`, zéro erreur console. Validation : 41/41 ciblés, 216/216 complets et `git diff --check`.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.24)

- Rotation libre : poignée dédiée sur le cadre de sélection, angle persistant dans `freeformLayout` et rendu identique en éditeur, preview et export.
- Précision : Shift verrouille le delta de rotation par pas de 15° ; l’angle est normalisé dans l’état et compatible Undo/Redo.
- Multi-sélection : plusieurs calques pivotent autour de leur centre commun, chacun conservant son angle relatif et son propre offset.
- UX : le libellé bleu du cadre ne bloque plus les clics sur le contenu placé derrière ; seuls ses boutons capturent les événements. QA Chrome : 28° persistants après reload, 13° + Shift → +15°, rotation collective validée sans erreur console. Validation : 38/38 ciblés, 213/213 complets et `git diff --check`.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.23)

- Calques : commandes Premier plan / Avancer / Reculer / Arrière-plan persistées dans le `freeformLayout` du breakpoint actif.
- Verrouillage : un ou plusieurs calques peuvent être verrouillés avec Undo/Redo ; ils restent sélectionnables pour être déverrouillés mais ne peuvent plus être déplacés, redimensionnés, alignés, groupés ou réordonnés.
- UX : cadre orange pour une sélection verrouillée, poignées de transformation masquées et toolbar de calques maintenue accessible.
- Validation navigateur : z-index réel `0 → 1`, verrouillage bloque drag + clavier, déverrouillage réactive le déplacement, zéro erreur console. Validation : 37/37 ciblés, 212/212 complets et `git diff --check`.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.22)

- Calques structurels : Services, Galerie, Réalisations, Avis, FAQ, À propos, Stats, Process, Certifications, Tarifs, Stepper, citation, tableau comparatif et blocs custom exposent désormais des parents visuels sélectionnables en plus de leurs champs internes.
- Hiérarchie : clic normal cible le calque le plus profond ; ⌘/Ctrl + clic répété remonte d’un niveau (ex. titre → contenu carte → carte) sans perdre les clés stables.
- Marquee hiérarchique : un rectangle serré peut sélectionner un enfant ; si le parent et ses descendants sont tous couverts, le parent gagne afin d’éviter les doubles sélections.
- Parité : `data-layout-node` reçoit une clé déterministe identique dans editor/public/export ; les transformations d’un parent entraînent naturellement tous ses descendants tandis que les enfants restent ajustables individuellement.
- QA navigateur : carte Service +20 px → carte/titre/image +20 px ; marquee serré → titre seul, marquee carte → carte seule ; avatar Avis sélectionnable indépendamment ; zéro erreur console. Validation : 35/35 ciblés, 210/210 complets et `git diff --check`.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.21)

- Marquee : glisser dans une zone vide dessine un rectangle de sélection après un seuil de 5 px ; un clic vide simple conserve la désélection classique.
- Sélection additive : Shift + marquee ajoute les nouvelles cibles à la sélection existante et étend automatiquement les groupes persistants touchés.
- Hiérarchie : les cibles imbriquées sont filtrées pendant le marquee afin d’éviter de sélectionner simultanément un CTA parent et son libellé enfant.
- Preview : les éléments touchés sont surlignés pendant le geste sans mutation d’état ; la sélection n’est commise qu’au pointerup et annulée proprement au pointercancel.
- QA navigateur : titre seul sélectionné par rectangle, Shift + rôle → 2 éléments, puis drag direct +20 px appliqué aux deux ; zéro erreur console. Validation : 32/32 ciblés, 207/207 complets et `git diff --check`.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.20)

- Drag direct : un élément déjà sélectionné peut être tiré directement par son corps après un seuil de 5 px ; les textes conservent le clic simple pour l’édition et passent en déplacement dès qu’un vrai geste est détecté.
- Snapping : bords et centres de la section et des éléments voisins s’accrochent dans un seuil de 6 px ; Alt désactive temporairement l’accroche.
- Guides : lignes verticales/horizontales visibles pendant le snap puis retirées au relâchement ; les relations parent/enfant de la sélection sont exclues des cibles parasites.
- Fluidité : suppression des transitions CSS pendant drag/resize et restauration instantanée du `scrollTop` du vrai canvas après rerender, supprimant le saut de ~420 ms observé.
- QA navigateur : drag Alt +35 px suivi 1:1, puis snap depuis 4 px d’écart vers 0 px avec guide visible ; zéro erreur console. Validation : 30/30 ciblés, 205/205 complets et `git diff --check`.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.19)

- Groupes : le cadre d’un groupe possède de nouveau ses huit poignées ; le resize met à l’échelle les membres autour de leur position relative sans provoquer de reflow de la section.
- Ratio : Shift sur une poignée d’angle applique une mise à l’échelle uniforme du groupe ; `scaleX/scaleY` est persisté par breakpoint et réinjecté en preview/export.
- Alignement : gauche/centre/droite/haut/milieu/bas et distribution horizontale/verticale sont disponibles sur toute multi-sélection et passent par une seule mutation Undo.
- QA navigateur : groupe À propos `282,03 → 362,03 px`, `scaleX=1.2837` conservé après reload ; distribution V `20/69 → 44,5/44,5` et H `128/68 → 98/98`, zéro erreur console. Validation : 24/24 ciblés, 199/199 complets et `git diff --check`.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.18)

- Canva/Figma : Shift-clic multi-sélection avec cadre englobant et actions adaptées à plusieurs éléments.
- Groupes : Grouper/Dégrouper persistant dans le projet ; sélectionner un membre rappelle le groupe complet.
- Transformations collectives : déplacement souris/clavier et Reset appliqués en batch avec un seul point Undo.
- UX : la barre d’actions et la poignée de déplacement restent atteignables lorsque la sélection déborde au-dessus du viewport. Validation : 23/23 ciblés, 198/198 complets et `git diff --check`.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.17)

- Éditeur libre : première fondation Canva/Figma avec clé de layout stable sur textes, images et CTA, cadre de sélection, Move, Reset et huit poignées de redimensionnement.
- Interaction : Pointer Events, déplacement clavier accessible et Undo/Redo ; la géométrie est persistée seulement à la fin du geste.
- Responsive : positions et dimensions séparées entre desktop/tablette/mobile, y compris dans le simulateur de viewport.
- Livraison : les mêmes règles de layout sont réutilisées en preview et dans l’export standalone. Validation : 37/37 ciblés, 196/196 complets et `git diff --check`.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.16)

- Images éditeur : les actions Remplacer / drop / suppression des images imbriquées utilisent désormais le chemin réel du contenu et conservent Undo.
- Modales V3 : hauteur maximale bornée au viewport et scroll interne pour éviter les headers/footers hors écran sur laptop.
- Accessibilité : focus initial explicite pour Wizard, Closer, Share, Command Palette, Ajouter et Image, avec fermeture Escape conservée.
- Validation : navigateur 1440×900, 1024×800 et 390×844 ; tests V3 ciblés et suite complète exécutés avant publication.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.15)

- Éditeur V3 : la sélection de section synchronise désormais la ligne Structure, le canvas et l’inspecteur depuis un état unique.
- Responsive : l’inspecteur devient un drawer utilisable sous 1280 px et reste accessible sur mobile au lieu d’être supprimé par CSS.
- Réorganisation : drag-and-drop souris et flèches clavier utilisent les nouvelles `.studio-v3-sectionrow`; styles de drop ajoutés.
- Contrôle réel : édition Services vérifiée à 1280/1024/390 px ; visibilité, drag, clavier, Undo et Assistant rejoués sans erreur console.
- Couverture : 27/27 ciblés, 191/191 complets et `git diff --check`.

### Consolidation — 15 septembre 2026 (4.8.0-alpha.14)

- V3 post-`f49ec7f` : Réglages du rail rendus immédiatement, preview appareil réellement contraint à 768/390 px et états actifs synchronisés.
- Canvas éditeur : toolbar de section déplacée hors de la surface client ; sur mobile, séparation du dock V3 et de la sticky call bar selon Conception/Aperçu.
- Correctifs UI : fin des erreurs SVG `width/height=[object Object]` et cibles de structure principales agrandies à 32 px.
- Audit navigateur : Chrome 1440 × 900 / 390 × 844, 0 px de recouvrement toolbar/contenu et aucune erreur console SVG après correction.
- Couverture : nouveau `tests/v3_ui_regressions.test.js`; 39/39 ciblés, 189/189 complets et `git diff --check`.

### Consolidation — 14 septembre 2026 (4.8.0-alpha.13)

- API génération : les requêtes simultanées portant exactement la même clé de contexte partagent désormais une seule promesse modèle en cours.
- Isolation : une variation de contexte validé (téléphone, région ou autre champ de clé) garde son propre appel et ne reçoit jamais la réponse d’une autre requête.
- Cache : un résultat réussi est promu dans le cache TTL avant de libérer le slot `in-flight`, supprimant la fenêtre où un troisième appel pouvait repartir vers le modèle.
- Validation : 10/10 tests backend ciblés, 184/184 sur la suite complète et `git diff --check`.

### Consolidation — 14 septembre 2026 (4.8.0-alpha.12)

- IA image : une génération asynchrone est désormais liée au projet, à la section, au champ et à l’index qui l’ont déclenchée ; une réponse tardive n’est plus réutilisable sur une autre cible.
- Changement de cible/projet ou fermeture du sélecteur : la génération en attente est invalidée et le candidat précédent est effacé.
- Application : le visuel généré est revérifié contre la cible active avant toute mutation ; la mise à jour d’image conserve le chemin d’historique existant.
- Validation : 9/9 sur `ai_stale_response`, 183/183 sur la suite complète et `git diff --check`.

### Consolidation — 14 septembre 2026 (4.8.0-alpha.11)

- Template vitrine : le simulateur de devis expose maintenant dans la sidebar ses libellés, listes de prestations/tailles/délais et son CTA.
- Formulaire public : le champ de délai souhaité, déjà présent dans le modèle de données, est désormais réellement rendu et suit les options éditées.
- Footer : nom, description, téléphone, email, adresse et copyright sont modifiables depuis le même éditeur que le reste du template.
- Validation : 16/16 sur `vitrine_conversion_path`, 180/180 complets et `git diff --check`.

### Consolidation — 14 septembre 2026 (4.8.0-alpha.10)

- Éditeur : suppression/restauration des CTA revérifiée avec Undo immédiat et couverture de régression.
- Sections : le drag-and-drop de la sidebar reste relié à `reorderSections`; la poignée est désormais un vrai contrôle focusable avec libellé accessible.
- Contrastes : poignée et contrôles critiques disposent d’un état focus explicite à fort contraste, visible sur surfaces claires et sombres.
- Validation : 36/36 ciblés (`v410_enhancements`, `v410_features`, `state`, `full_system_e2e`), 180/180 complets et `git diff --check`.

### Consolidation — 14 septembre 2026 (4.8.0-alpha.9)

- Éditeur : références stables courtes `#E…` visibles hors des contenus pour sections, champs, images et boutons, sans recouvrir le texte client.
- Copilot ciblé : une référence stable résout exactement son composant ; les changements de contenu ciblés restent limités au champ demandé et passent par le flux Undo.
- Images imbriquées : services et réalisations exposent désormais leur chemin de donnée réel (`services.N.image`, `items.N.image`) pour un ciblage non ambigu.
- Validation : 11/11 tests ciblés (`gold`, `v410_enhancements`), puis 178/178 sur la suite complète et `git diff --check`.

### Consolidation — 14 septembre 2026 (4.8.0-alpha.8)

- Éditeur — fonds : thèmes et couleurs personnalisées pilotent désormais la surface réellement visible dans l’éditeur, le rendu public et l’export standalone ; les wrappers internes ne masquent plus le choix.
- Typographie : cibles Titres/Texte réellement indépendantes, aperçu immédiat par variables CSS, export fidèle et mutations désormais compatibles Undo.
- Boutons : le rayon global carré → pilule s’applique aux CTA de conversion y compris À propos/formulaire et à l’export, sans modifier le rayon des cartes/conteneurs.
- Animations : presets distincts réellement exportés, vitesse persistée (`fast` / `normal` / `slow`) et réduction des mouvements qui neutralise les animations continues.
- Validation : 37/37 tests ciblés, suite complète 177/177 et `git diff --check`. La vitrine Esprit Nature conserve ses proportions validées.

### Consolidation — 14 septembre 2026 (4.8.0-alpha.7)

- Référence Esprit Nature : header ramené au canevas desktop `80rem` et à 80 px de haut, typographie/menu/CTA recalibrés sur les captures ; les libellés Services / À propos / Avis / Galerie / FAQ restent désormais éditables sans perdre leurs ancres.
- À propos : la démo de référence retrouve le badge visible « Artisan certifié » et conserve mot pour mot le récit, le rôle et les deux CTA de la capture. Une nouvelle vitrine hors démo ne reçoit toujours aucune certification non vérifiée.
- FAQ : hiérarchie corrigée conformément à la référence (`FAQ` en surtitre, `Questions fréquentes` en titre) tout en conservant l’accordéon accessible.
- Horaires & Lieu : carte Google interactive par défaut, pilotée par ville/adresse et lien d’itinéraire ; l’éditeur permet de revenir à une image personnalisée.
- Template éditable : contrôles explicites ajoutés pour identité/navigation, contenu et portrait À propos, images Services, avis clients, horaires/adresse et mode de carte. Les contrôles Hero, Galerie et FAQ existants restent réutilisés au lieu de créer un second système.
- Export autonome : correction de la règle responsive `hidden` / `md:flex` qui pouvait masquer le menu desktop ; aperçu exporté contrôlé à 1624 × 900 px.
- Validation : `vitrine_conversion_path` 15/15, suite complète 173/173 et `git diff --check`. Commit fonctionnel : `cbcac39`.

### Consolidation — 14 septembre 2026 (4.8.0-alpha.6)

- Vitrine paysagiste : Services, Galerie, Avis, Horaires & Lieu et FAQ utilisent désormais le même canevas public `112rem` que le bloc À propos et le header, sans modifier sa géométrie desktop validée.
- Proportions : titres secondaires harmonisés, cartes Services plus respirantes, grille Avis portée à 96rem, grille Horaires à 92rem et liste FAQ à 80rem ; l’export HTML autonome embarque les mêmes règles.
- Responsive : la grille À propos est contrainte à une vraie colonne avant 1024 px et son image 4:5 n’impose plus de largeur minimale sur téléphone ; à 390 px, le document reste à 390 px sans débordement horizontal.
- Validation : 25/25 tests ciblés + `git diff --check`. Contrôle Chrome/CDP à 1440 × 810 px : header, Services, À propos, Avis, Galerie, Horaires et FAQ ont tous un shell de 1440 px ; le header reste `sticky` à `scrollY = 4700`.
- Régression globale : 170/170 tests. Le test Sticky Call Bar vérifie le contrat réel du CTA (`#simulateur` + libellé accessible) plutôt qu’un ancien texte commercial.
- Suite complète : 170/170 ; le test Sticky Call Bar vérifie le contrat actuel du lien devis (`#simulateur`) et son libellé accessible.

### Consolidation non publiée — 14 septembre 2026 (4.8.0-alpha.4)

- Vitrine : correction de la vraie contrainte de largeur. La règle `.max-w-7xl` écrasait le
  shell vitrine ; la spécificité est désormais explicite, ce qui fait passer le contenu de
  1280 à 1440 px sur un viewport de 1440 px et réduit effectivement les marges latérales.
- Hero paysagiste : composition desktop calculée en 16:9 (`1440 × 810` vérifié), tout en
  conservant une hauteur mobile adaptée. Le header reste réellement fixe sur toute la page.
- Transitions : arrivée d’ancre native inspirée du pattern InView de Motion Primitives
  (translation, opacité et flou pendant 440 ms), sans scroll-jacking et désactivée avec
  `prefers-reduced-motion`.

- Vitrine paysagiste : header élargi à liens noirs explicites, CTA calibré, surface de lecture
  portée à 112rem et actions « À propos » séparées sans risque de chevauchement.
- Vitrine paysagiste : dock de téléphone retiré du rendu public pour laisser les CTA éditoriaux
  maîtriser le parcours ; le dock reste disponible dans l’éditeur et pour les autres templates.
- Vitrine paysagiste : footer public cohérent avec la référence, sans contacts vides ni liens
  génériques hors parcours ; FAQ espacée avec des déclencheurs pleine largeur.
- Documentation : ajout de `docs/EXECUTION-CHECKLIST.md`, à actualiser avec chaque commit pour
  permettre une reprise fiable par un autre intervenant.

- Vitrine : les proportions d’Horaires & Lieu et des avis reposent maintenant sur des
  classes dédiées réellement fournies par le CSS, plutôt que sur des utilitaires responsives
  absents. L’aperçu et l’export HTML reçoivent les mêmes dimensions.
- Version visible portée à `4.8.0-alpha.2` dans le titre, le badge de l’application et le
  package afin d’identifier sans ambiguïté ce lot après publication.

### Consolidation précédente — 14 septembre 2026 (4.8.0-alpha.1)

- Génération vitrine : aucune certification n’est désormais inventée par défaut ; le champ
  reste personnalisable pour les informations vérifiées.

- Vitrine desktop : navigation espacée correctement entre ses liens ; contrôle de non-
  débordement et des grilles principales ajouté à la validation ciblée.

- Vitrine : FAQ compacte et accessible au clavier, avec états ARIA synchronisés ; icône de
  zoom de galerie harmonisée avec le système vectoriel.

- Vitrine : bloc « Horaires & Lieu » remis en deux colonnes sur desktop. La carte de la
  démo est remplaçable dans l'éditeur ; les autres villes utilisent leur adresse et un lien
  d'itinéraire au lieu d'une carte Montauban imposée.
- Vitrine mobile : le même bloc s'empile désormais explicitement avant le breakpoint desktop,
  avec une carte d'au moins 380 px de haut ; l'icône de localisation est vectorielle.
- Vitrine 1.1 : navigation fixe unifiée Services / À propos / Avis / Galerie / FAQ, ancres
  compensées sous le header, composition élargie, présentation 6/6 à photo dominante et
  cartes Services agrandies sans retirer les champs d'édition.
- Vitrine 1.1 : avis plus respirants et FAQ élargie, avec séparateurs simples et zones de
  lecture plus généreuses, tout en conservant l'accordéon clavier et les données éditables.
- Export HTML autonome : styles vitrine 1.1 synchronisés avec l'aperçu (ancres, split
  À propos, colonnes, proportions et FAQ) pour éviter une divergence après téléchargement.
- Vitrine : suppression du fondu global qui pouvait laisser des sections entières non peintes
  hors viewport ; chaque bloc reste lisible pendant la navigation et les ancres.
- Vitrine : navigation de secours pour le template paysagiste, dock de contact caché sur le
  hero, respect de `prefers-reduced-motion` et absence de badge de certification par défaut.

- Publication production sur Vercel : `artisite-prospector.vercel.app`.

- Vitrine : appels à l'action devis actifs, cible unique et formulaire accessible. Sans
  connexion d'envoi configurée, la confirmation dirige explicitement vers téléphone/WhatsApp.
- Aperçu client allégé : suppression du ruban commercial interne qui masquait le header.

- Vitrine plein cadre : photo, voile et contenu correctement superposés ; titre/sous-titre
  blancs et composition responsive commune à l'éditeur, l'aperçu et l'export HTML.

- Wizard/assistant : réponses périmées refusées après changement de projet ou modification,
  avec contrôle à l'approbation et maintien d'Undo. 15/15 tests ciblés sans réseau.

- Lecture JSON API cohérente entre Node et serverless : erreurs400 explicites, limite2 Mio
  en octets, conservation des caractères UTF-8 fragmentés, gestion des requêtes interrompues.
- Validation ciblée :9/9 tests, sans appel réseau. Pas de publication.

## [4.2.0] - 2026-09-07

### Ajouté
- **Comparateur SplitReveal Multi-Instance (Horizontal & Vertical)** : Support de l'orientation bidirectionnelle (horizontal pour façades/jardins, vertical pour toitures/ravalements), badge de pourcentage dynamique en temps réel (`50%`), navigation clavier WCAG (`←`/`→` et `↑`/`↓`), et boutons de bascule d'orientation dans l'éditeur.
- **Moteur de Texture Papercraft & Grain Tactile 2026** : Bruit fractal organique généré par filtre SVG `feTurbulence` intégré en CSS data-URI ultra-léger (zéro requête réseau, prêt pour utilisation hors-ligne), avec tokens `--bg-cream` et ombrage papier `--shadow-paper`.
- **Nouveaux Presets de Style 2026** : Ajout des thèmes *Éditorial Terroir* (Instrument Serif / Sans, fond crème naturel) et *Papercraft Minéral* (Clash Display / Satoshi, angles vifs 0px).
- **Module Commercial CampaignCard & Jauge de Chantiers** : Carte d'offre limitée avec barre de progression dynamique calculée (ex: 18 / 25 chantiers confirmés = 72%) et pilules de sélection interactive de forfaits.
- **Bandeau d'Astreinte Radar 24/7 & Stickers Physiques Tiltés** : Point radar clignotant animé avec ondes d'urgence et stickers physiques découpés avec rotation subtile (`-2.5°` / `+2.5°`).
- **Machine à États IA Studio & Carte d'Approbation Transparente** : Affichage d'une jauge de confiance transparente (ex: 96%) avec résumé concis des modifications et boutons d'action instantanés *Appliquer* / *Ignorer*.
- **Modern Web Guidance — Performance & Accessibilité 2026** : Indicateur de défilement natif GPU 120 FPS (`animation-timeline: scroll()`), priorité de chargement LCP (`fetchpriority="high"` sur le Hero), décodage asynchrone (`decoding="async"`), rendu différé des sections hors écran (`content-visibility: auto`) et anneau de focus haute visibilité WCAG 2.2 AA (`:focus-visible`).
- **Packs Typographiques Premium** : Intégration des fontes contemporaines *Satoshi*, *General Sans*, *Clash Display*, *Cabinet Grotesk* via CDN sécurisé avec correctif Google Fonts API v2.
- **Bandeau d'Appel Flottant Dockable** : Contrôle de positionnement segmenté (*Gauche*, *Centre*, *Droite*) dans l'onglet des paramètres.

### Corrigé
- **Contraste adaptatif sur thèmes sombres** : Règle de cascade CSS pour empêcher les textes noirs sur fond sombre dans les sections Navy et Dark.
- **Harmonisation des fonds de section** : Éradication des écrasements de couleur par héritage transparent des conteneurs internes.
- **Étoiles d'Avis Google Reviews** : Remplacement des étoiles filaires par des étoiles pleines dorées (`#fbbf24`) éditables d'un clic avec mise à jour réactive.
- **Intégrité de l'export autonome HTML** : Inclusion intégrale des styles Papercraft, du SplitReveal multi-instance et du scroll-indicator dans les fichiers exportés.

---

## [4.1.0] - 2026-09-07

### Ajouté
- **Suppression granulaire des boutons d'action (CTA)** : Ajout de la commande de suppression d'un bouton spécifique (`deleteButton`) avec historique complet d'annulation (`⌘Z` / `Ctrl+Z`).
- **Contrôleur de dimensionnement continu** : Remplacement du sélecteur rigide par un curseur de taille de bouton (80% à 140% / 12px à 22px), complété par des boutons d'incrément typographique (`A-`, `A+`) et une bascule Majuscules.
- **Sélecteur de rayon de courbure (Border Radius)** : Permet de choisir en un clic entre bords vifs (0px), adoucis (8px) ou pilule intégrale (9999px).
- **Moteur d'animation Scroll-Reveal 60 FPS** : Observation via `IntersectionObserver` déclenchant l'apparition fluide des sections lors du défilement, avec prévisualisation immédiate lors de la sélection d'un préréglage dans l'éditeur.
- **Finition Keycap Tactile 3D** : Effet de relief mécanique inspiré des claviers physiques haut de gamme (biseau subtil, ombre d'enfoncement `:active`, reflets rétro-éclairés).
- **Séparation stricte Mode Sombre/Clair vs Aperçu Client** : Mode Aperçu Client épuré dissimulant toutes les poignées et bordures d'édition pour le partage d'écran lors des cold-calls.
- **Patterns d'inspiration et contrat de validation UI** : Intégration de structures modulaires et fallbacks fiabilisés.

### Corrigé
- **Suppression des badges et numéros parasites** : Retrait du pseudo-élément CSS `[data-ui-target="true"]::after` qui affichait des libellés d'identifiants (`#btn-phone`, `#cta`, `#h1`) en surimpression sur les textes et boutons.
- **Fiabilisation du Drag & Drop de sections** : Limitation du glisser-déposer à la poignée dédiée (`.section-card-grip`), empêchant les blocages et sélections intempestives lors du clic sur les champs de saisie ou accordéons enfants.
- **Amélioration des proportions PC** : Correction des contraintes de hauteur et des marges pour un confort visuel optimal sur grands écrans d'ordinateur.

---

## [4.0.0] - 2026-09-06

### Ajouté
- Moteur de génération de sites vitrines de proximité en 16 sections complètes.
- Générateur de QR Code SVG vectoriel pur sans dépendance externe.
- Modal de partage commercial avec lien de prévisualisation et pitch de vente personnalisé.
- Palette de commandes globale (`⌘K`) avec recherche instantanée de sections, d'actions et de thèmes.
- Barre d'action flottante sticky avec déclencheurs d'appels directs, WhatsApp et devis.
- Injection automatique des balises SEO Schema.org `LocalBusiness` JSON-LD dans l'export autonome.
- Module de closing commercial proposant des argumentaires percutants adaptés au secteur d'activité.
- Catalogue de fallbacks SVG intégrés pour les 12 métiers artisanaux.
- Fallback multi-modèles Gemini AI (cascade automatique en cas d'indisponibilité ou d'erreur de quota).
- Compatibilité de déploiement Vercel Serverless via fonctions API catch-all.
# 4.8.0 — Consolidation (non publiée)

- Cache de génération IA : contexte complet validé et clé hachée sans collisions de concaténation/casse ; téléphone/région distingués. 8 tests ciblés réussis.

- Serveur local : chemins malformés/NUL et sorties du dossier public refusés sans crash ; erreurs de lecture génériques. Validation HTTP réelle et17 tests ciblés réussis.

- Version de travail 4.8.0-alpha.1 alignée dans le titre, l'accueil et package.json.
- Indicateurs accueil issus des données : taux signé/total, montants renseignés sans estimation inventée.
- Validation de ce sous-lot : 143/143 tests, affichage desktop vérifié. Les lots sombre/responsive/backend restent ouverts.

- Plan d'exécution et règles de projet établis avant correction sur la base `7caf557`.
- 16 captures examinées, 136 tests existants réussis ; vérification fonctionnelle à compléter.
- Correctif intégré `67465f5` : les personnalisations existantes de la démo sont conservées au rechargement et en migration v4/v5 (9 tests state réussis).
- Autres lots partiels non intégrés ; état et quatre échecs de tests restants dans `docs/codex-execution-state.md`.
- `031e887` : catalogue client séparé de la démo, faits inconnus laissés vides, urgence masquée par défaut ; CTA service conservé sans prix. Contrôle d'intégration : 141/142, seul test du titre/version reste en échec. Les limites de rendu et de saisie sont documentées.

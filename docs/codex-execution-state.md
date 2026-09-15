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

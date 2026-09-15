# Artist — Plan de consolidation révisable

Date : 13 septembre 2026. Base vérifiée : `7caf557`, dépôt `Documents/saas theo`.
Branche : `refactor/artist-consolidation`, worktree isolé `Documents/Codex/2026-09-07/artist-consolidation`.
Version cible : **4.8.0**, non publiée. La base déclare 4.2.0 dans package.json,
V4.3 PRO sur l'accueil et v4.7 dans les tests : cette divergence sera supprimée.

## Avancement courant — 4.8.0-alpha.2

### Correction géométrique effective — 4.8.0-alpha.4

- Le plafond réel à 80rem a été supprimé par un sélecteur plus spécifique ; la vitrine utilise
  désormais toute la largeur à 1440 px et conserve 64 px de marge par côté à 1920 px.
- Hero desktop 16:9, header fixé au niveau de la section entière et transition d’ancre native
  intégrée depuis les principes Motion Primitives du dépôt UI Intelligence.
- Validation bornée : 25 tests ciblés et trois viewports (1440, 1920, 390). Le prochain sous-lot
  compare Services/Galerie aux captures, puis revient aux outils d’édition prioritaires.

### Lot vitrine de référence — 4.8.0-alpha.3

- Header du template paysagiste : liens noir explicites, espacement accru et CTA vert calibré.
- Surface vitrine portée à 112rem ; actions À propos séparées par une règle dédiée afin qu’aucun
  réglage CSS absent ne les fasse se chevaucher.
- Dock téléphone supprimé du rendu public paysagiste ; il reste dans l’éditeur, où il est
  configurable et déplaçable. Footer public dédié, contacts vides omis et FAQ aérée.
- Checklist de transmission ajoutée dans `docs/EXECUTION-CHECKLIST.md`. À chaque commit : version,
  tests, anomalies, prochaine action et hash de livraison doivent y être consignés.
- Contrôles réalisés : 24/24 tests ciblés, `git diff --check`, Playwright desktop/mobile. Les
  prochains écarts à traiter restent le hero, les proportions Services/Galerie, puis les réglages
  éditeur de fond, typo, rayon et animation.

- Lot vitrine en cours : correction des proportions constatées sur les captures des sections
  « Horaires & Lieu », Avis et FAQ. Les dimensions critiques passent par des classes vitrine
  dédiées et présentes dans le CSS, puis sont recopiées dans l’export autonome.
- Contrôle navigateur local effectué : à 1440 px, les deux cartes Horaires font 528 × 541 px,
  les avis 400 × 328–342 px ; à 390 px, les cartes restent à 358 px de large et s’empilent
  sans compression. Le titre de page produit est `Artist v4.8.0-alpha.2`.
- Ensuite seulement : reprendre les contrôles d’édition encore prioritaires (typo, fonds,
  rayon, animations) sans modifier les données personnalisées des vitrines.

## État de consolidation courant — après 4.8.0-alpha.34

Cette section prévaut sur le tableau historique des lots 5–13 ci-dessous sans le supprimer.

- Incident qualité du 15/09 : la vitrine "Voir la vitrine" réutilisait la copie Esprit Nature persistée ; des modifications freeform pouvaient donc dégrader la démo de référence. Alpha.32 sépare désormais la démo canonique de la bibliothèque et lui garantit une instance fraîche.
- Navigation SPA : dashboard, éditeur, aperçu projet et vitrine disposent maintenant de routes internes avec historique Retour/Avancer ; `Voir le site` vise le projet courant.
- Vitrine/hero/FAQ/personnalisation/export/responsive : les sous-lots historiques restent livrés, mais ils doivent maintenant être protégés par une validation visuelle de template avant tout nouveau chantier Figma lourd.
- Templates : registre livré dans le wizard avec Esprit Nature 1:1, Artisan Moderne et Local Chaleureux. Une instance de référence reprend la composition sans copier les données de démo ; Avis/Horaires sans faits sont explicitement à renseigner.
- QA visuel anti-régression de la template validé en alpha.34 : canonique et instance contrôlées à 1440/390, footer dernier et devis juste avant.
- Prochaine priorité produit : nettoyage de bibliothèque (sélection/suppression groupée), puis audit des overlays éditeur.
- Restent ouverts après stabilisation template : robustesse texte/image/CTA/groupe, audit factuel des prompts/fallbacks, limites partage/multi-utilisateur et contre-audit sécurité/performance.
- Dette suivie : concentration de logique dans `app.js` et duplication du runtime de reparenting editor/export. Aucun refactor lourd sans besoin mesuré.

## État initial vérifié

- Vanilla JS, serveur Node natif, aucune dépendance npm déclarée ; `npm test` : **136/136**.
- Aucun script build, lint ou typecheck : ne pas annoncer leur réussite fictive.
- State/localStorage + historique, renderer commun, moteur de génération, API Gemini,
  comparateurs et partage existent déjà. Pas de réécriture de framework.
- La vieille copie 4.1.0 et son renderer modifié ne sont pas utilisés. `.gemini/` du dépôt récent reste intact.
- Les tests actuels vérifient surtout des chaînes HTML. Ils ne prouvent ni les gestes,
  ni l'absence de débordement, ni une isolation multiutilisateur.
- Accueil réel : le champ nom est annoncé par l'accessibilité comme champ texte,
  pas comme checkbox. Une mise en page défectueuse le fait ressembler à une case.
- Les badges « Taux 68% », les revenus estimés et certaines certifications sont codés
  comme données réelles sans provenance. Les partager comme faits serait trompeur.
- Impeccable installé depuis le dépôt demandé. Lecture complète des guides audit,
  harden et craft-floor ; lanceur contexte non exécutable, aucun PRODUCT.md/DESIGN.md existant.

## Autorité visuelle et preuves

Les 16 images de `Downloads/CORRECTION SAAS` ont été examinées.

| Référence | Conséquence concrète |
|---|---|
| EX 06/09 11.29.40 | Hero photo jardin plein cadre, assombrissement, titre blanc centré, deux CTA et navigation sobre |
| EX 12/09 15.48.05 | Présentation 2 colonnes, portrait vertical, paragraphes lisibles, pas de carte inutile |
| EX 12/09 15.49.16 | Prestations avec photos cohérentes, grille responsive et descriptions courtes |
| EX 12/09 15.49.45 | Galerie 3 colonnes desktop, images 4:3, intervalles serrés, comparaisons mélangées |
| EX 12/09 15.50.04 | Horaires et carte en deux colonnes, informations éditables |
| EX 12/09 15.50.24 | Avis sobres ; ne pas copier les témoignages comme ceux d'un autre artisan |
| EX 13/09 01.12.12 | FAQ compacte : question, séparateur fin, plus, réponse dépliable |
| BUG 00.52.58 / 00.53.29 | Informations artisan / identité et mode client à vérifier |
| BUG 01.04.36 / 01.15.11 | Hero trop tassé, texte sans contraste, barre d'outils envahissante |
| BUG 01.05.21 | Champ nom écrasé dans génération rapide |
| BUG 01.06.13 | Titres de projets illisibles en sombre |
| BUG 01.10.07 / 01.10.23 | Images hors sujet et fausses preuves avant/après |
| BUG 01.14.16 | Cible de galerie compacte, pas une galerie artificiellement illustrée |

Sendpage en ligne n'a pas pu être ouvert par l'outil web ; les captures fournies
restent la référence visuelle. Aucun asset tiers ni témoignage ne sera copié sans droit établi.
Le style touches de clavier est conservé pour les commandes de l'éditeur, pas imposé à tous les sites.

## Lots, responsabilités et critères de sortie

### Ordre prioritaire révisé — 14 septembre, demande utilisateur

1. Vitrine conforme aux captures : hero5, présentation/services, galerie6, avant/après7,
   FAQ8. Navigation/devis/contact passent en tête dès qu'ils bloquent le parcours visiteur.
2. Vitrine desktop/mobile et export (10–11), puis contrôles nécessaires à l'édition (9 et3).
3. Reprendre les tâches différées : génération photo/audit IA2, faits générés4,
   partage10, sécurité/performance12 et contre-audit13. Aucun lot abandonné.

Un seul sous-lot à la fois ; pas de nouveaux agents ni d'audit général.
Terminé partiellement lot5 : couches photo/voile/texte et lisibilité titre/sous-titre corrigées,
styles communs vitrine/éditeur/export, 9 tests ciblés cumulés. Desktop contrôlé ; mobile390
reste à confirmer (viewport outil instable). Ni conformité complète ni WCAG globale revendiquées.
Prochaine action : parcours devis/contact (#simulateur vs #quoteSimulator et cible visible),
puis présentation/services/galerie/FAQ. Voir la tête courte de codex-execution-state.md.

### Sous-lot parcours devis vitrine terminé — 14 septembre 2026

- Commit `cd32f5d` : CTA/hyperliens et bandeau vers `#simulateur`, simulateur visible sur
  nouvelles vitrines et démos ; popovers CTA limités à l'éditeur, aperçu client sans ruban
  commercial. Le formulaire ne revendique aucun envoi sans endpoint et termine par appel/WhatsApp.
- 16/16 tests ciblés ; navigateur5186 confirme l'arrivée au formulaire, puis la confirmation
  locale et les actions de contact. Projets déjà personnalisés préservés sans migration forcée.
- Suite prioritaire : mise en forme de la vitrine, présentation/services/galerie/FAQ, puis
  mobile/export. Les lots techniques différés restent planifiés.

### Sous-lot Horaires & Lieu terminé — 14 septembre 2026

- Grille vitrine réparée : les deux colonnes desktop occupent chacune 6/12 ; la liste
  d'horaires et la surface carte ne se réduisent plus à une fine bande.
- La carte de la démo paysagiste est un média `mapImage` remplaçable dans l'éditeur.
  Les projets d'une autre ville gardent une carte liée à leur adresse et un itinéraire Maps,
  afin de ne pas afficher Montauban par défaut.
- Navigation paysagiste de secours, dock de contact non-obstructif et absence de certification
  inventée complètent ce sous-lot. Tests ciblés 12/12 et vérification statique réussis.
- Suite : présentation/services/galerie, FAQ compacte, puis contrôles responsive et export.

### Sous-lot mobile Horaires & Lieu — 14 septembre 2026

- La grille est explicitement mono-colonne avant le breakpoint desktop ; la carte ne peut plus
  être comprimée sous 380 px dans cette composition. L'icône de position est harmonisée au
  système SVG. Test de rendu ajouté ; validation sur appareil/mobile navigateur reste distincte.

### Sous-lot vitrine 1.1 — proportions et navigation — 14 septembre 2026

- Navigation fixe paysagiste normalisée sur les cinq destinations de la page, avec compensation
  de scroll. Surface de lecture élargie, split À propos équilibré 6/6 et photo dominante,
  services plus généreux. Personnalisation et export conservent leurs mêmes données.
- Suite : avis/FAQ selon captures puis contrôle visuel navigateur/export, avant les outils
  d'édition secondaires.

### Sous-lot vitrine 1.1 — Avis et FAQ — 14 septembre 2026

- Avis amplifiés et aérés ; FAQ remise en rangées simples, larges et accessibles au clavier.
  Les deux blocs continuent à utiliser les mêmes champs de contenu exportables.
- Suite : vérification du rendu public et de l'export, puis reprise des outils secondaires.

### Sous-lot export vitrine 1.1 — 14 septembre 2026

- Les règles de navigation et proportions vitrine sont désormais embarquées dans l'export HTML
  autonome, y compris les colonnes 6/12 et la FAQ sans cadre. Suite : contrôle navigateur
  borné public/export avant les outils secondaires.

### Sous-lot rendu réel vitrine — 14 septembre 2026

- Le différé de rendu et le fondu global sont exclus de la vitrine paysagiste : les sections
  restent immédiatement peintes pour les ancres, le scroll et l'export. Vérification
  navigateur locale à 1440 px : 10 sections, aucune opacity résiduelle.

### Sous-lot FAQ accessible terminé — 14 septembre 2026

- FAQ compacte au chargement, navigation au clavier, état `aria-expanded` et association
  explicite question/réponse. L'icône de loupe de galerie rejoint le système SVG commun.
- Tests ciblés 12/12. Suite : contrôle responsive desktop/mobile et cohérence export,
  avant de poursuivre les autres lots d'édition.

| Lot | Action | Validation requise | État |
|---|---|---|---|
| 1 | Audit, contexte durable, version/changelog honnêtes | Base, captures, architecture et risques tracés | Audit/plan terminés be8600c ; version4.8.0-alpha.1 intégrée non publiée |
| 2 | Stabilité : validation API, cache, tâches async et sauvegarde | Tests entrées invalides / réponses obsolètes / isolation contexte | Sauvegarde terminée67465f5 ; chemins serveur protégés et testés HTTP ; cache/API/async restent à faire |
| 3 | Accueil, sombre, tokens et lisibilité des contrôles | Vrai champ nom utilisable, thèmes sans perte d'état, mobile sans overflow | Accueil/version/KPI intégrés et vus desktop ; sombre/responsive restent ouverts |
| 4 | Génération métier et faits non inventés | Plusieurs métiers, téléphone vide conservé, pas de faux avis/certifications | Catalogue/moteur intégrés 031e887 ; limites app.js/renderer et richesse métier restent à traiter |
| 5 | Hero / portrait / overlay | Slider appliqué, contraste et proportions vérifiés dans le navigateur | À faire |
| 6 | Galerie : tailles, médias et réorganisation | Vide/1/plusieurs, override indépendant, suppression et Undo | À faire |
| 7 | Avant/après | Plusieurs instances, clavier, souris, gestes interrompus, export | À faire |
| 8 | FAQ | Questions métier éditables, accordéon clavier, layout compact | À faire |
| 9 | Personnalisation | Texte/rayon/couleur/mouvement persistants, paramètres non ciblés préservés | À faire |
| 10 | Aperçu / partage / publication / export | Routes exactes, limites localStorage explicites, pas de faux PIN sécurisé | À faire |
| 11 | Motion et responsive | Desktop/tablette/mobile et reduced-motion, contrôle utilisable | À faire |
| 12 | Sécurité / performances | Validation/régression, limites auth documentées, coût DOM/images | À faire |
| 13 | Contre-audit et rapport | Suite complète, vérification visuelle bornée, commits atomiques, restants priorisés | À faire |

Exécution parallèle autorisée : agent backend, agent génération/données, principal UI/intégration.
Les écritures sont attribuées par fichiers disjoints. Pas de commit englobant aveuglément le travail d'autrui.

## Méthode de validation

Chaque bug corrigé obtient un test comportemental ou d'intégration adapté ; garder les tests de rendu
mais corriger ceux qui sanctuarisent une information fabriquée. Vérifier la syntaxe des modules avec Node.
Serveur isolé : `http://localhost:5180`, sans toucher le port utilisé par l'utilisateur.
Inspection visuelle groupée desktop/mobile puis une confirmation après corrections ; pas de polissage infini.
La souris, le clavier et les viewports émulés sont distingués d'un vrai test matériel tactile.

## Risques à suivre

- P0/P1 : aucune vraie identité utilisateur ni stockage partagé autorisé. Un lien local n'est pas un partage SaaS.
- P1 : HTML construit par interpolation ; toutes les frontières données/markup sont à contrôler.
- P1 : une réponse IA tardive ne doit pas écraser des modifications manuelles.
- P1 : images de démonstration et contenus générés ne sont pas des réalisations vérifiées.
- 6 mois : séparer progressivement les responsabilités d'app.js/renderer.js avec contrats testés.
- 12 mois : auth, stockage propriétaire, migrations/sauvegardes, quotas et publication isolée avant multi-tenant.
- Ne pas inventer l'infrastructure absente ni annoncer « commercialisable » sur la seule base des tests locaux.

Les états seront mis à jour avec les preuves effectives dans le rapport final, pas par anticipation.

## Reprise contrôlée — 13 septembre 2026

- Aucun nouvel audit ni agent relancé. Les quatre agents sont arrêtés sur erreur de quota ; aucun commit agent.
- Résultats intermédiaires récupérés : cache incomplet, crash serveur sur chemin NUL,
  limites du PIN/localStorage, défaut de remplacement automatique de la démo au chargement.
- Sous-lot prioritaire terminé : ne plus remplacer un projet Esprit Nature personnalisé lors
  du chargement ou de la migration v4/v5. Commit `67465f5`, fichiers state.js et state.test.js seulement.
- Tests ciblés : **9/9**, syntaxe state.js et `git diff --check` réussis.
- Une seule passe d'intégration sur le travail partiel : **137/141**, quatre échecs conservés
  et détaillés dans [l'état d'exécution](codex-execution-state.md). Pas de validation globale revendiquée.
- Prochaine action : intégrer le sous-lot génération déjà écrit en examinant les trois échecs de rendu,
  sans remettre de faux faits dans les données pour satisfaire les anciennes assertions.
- Les changements accueil/version restent séparés ; pas de publication ni push effectué.

### Sous-lot génération intégré

- Commit `031e887` : catalogue démo séparé, coordonnées inconnues vides, preuves/horaires non
  inventés par generateSite, médias identifiés comme illustratifs, urgence masquée par défaut.
- Vrai défaut corrigé : le CTA des services non paysagistes reste rendu lorsque le prix est vide.
- Tests d'édition et de carte corrigés avec fixtures explicites ; aucune assertion supprimée pour masquer le défaut.
- 34 tests ciblés réussis, puis extension tous métiers ; contrôle final **141/142**.
  Seul échec restant : titre historique attendu dans tests/server.test.js, lot version non intégré.
- Navigateur sur localhost:5181 (origine neuve pour éviter le cache de 5180) : six CTA sans prix
  visibles dans l'arbre d'accessibilité, clic « Chiffrer » atteint le formulaire #simulateur.
- Portée limitée : les mentions factices codées dans le renderer, les ajouts via createSectionData,
  les entrées app.js et le style final ne sont pas validés par ce correctif de données.
- Prochain sous-lot : terminer accueil/version déjà modifié, notamment taux de conversion affiché,
  cohérence titre et test serveur, avant de revenir aux P0 backend.

### Sous-lot accueil/version terminé

- Version runtime/package/titre alignée à4.8.0-alpha.1 ; taux réel et valeurs estimées explicites.
- Cas sans projets, un tiers signé, tous signés, montants absents/négatifs/non numériques/zéro testés.
- Suite finale **143/143** ; capture desktop et accessibilité confirment les valeurs affichées.
- Pas de publication ni de nouveaux agents. Prochaine correction : crash serveur sur chemin NUL,
  avec test HTTP réel de maintien en service, puis cache API dans un sous-lot séparé.

### Sous-lot P0 chemins serveur terminé

- NUL, encodage malformé et chemins hors public refusés sans arrêt du processus.
- 17/17 tests ciblés réussis, dont nouveau test HTTP réel sur port éphémère ; health reste
  disponible après dix cas invalides. CSS, JS, SPA et ETag conservés.
- Pas de relance de la suite globale ni de modification UI pour ce lot backend circonscrit.
- Prochaine action : clé cache exacte de génération et tests de collisions téléphone/région,
  avec modèle simulé. Les autres durcissements restent ouverts.

### Sous-lot cache génération terminé

- Clé versionnée SHA-256 du contexte validé complet, casse préservée ; téléphone/région
  et configuration modèles pris en compte. Le modèle reçoit le même contexte validé.
- 8/8 tests ciblés réussis ; nouveau test cache simulé sans réseau. Pas de suite globale répétée.
- Restent : parseur JSON commun, limites en octets, races/déduplication, prompt factuel et auth.
- Prochaine action : harmoniser readBodyJSON Node/serverless et tester les erreurs de parsing/tailles.

### Sous-lot lecture JSON terminé — 14 septembre 2026

- Contrat objet JSON commun aux corps Node et pré-parsés ; JSON invalide400, plafond2 Mio
  mesuré en octets413 ; fragments UTF-8 correctement assemblés et interruptions traitées.
- 9/9 tests ciblés (request_body, generation_cache, server), syntaxe et diff --check réussis.
  Aucun réseau ni agent, pas de push. Limite pré-parsée mesurée sur JSON resérialisé,
  pas sur le corps brut déjà consommé par l'hébergeur.
- Prochain sous-lot du lot2 : empêcher les réponses IA tardives d'écraser les modifications
  utilisateur dans app.js, avec scénario de réponse différée. Les lots suivants restent ouverts.

### Sous-lot réponses IA tardives terminé — 14 septembre 2026

- Wizard et assistant liés à la demande initiale et au contenu du projet ; changement de
  projet/vue, édition ou nouvelle demande rendent le résultat périmé. Vérification aussi
  au clic Appliquer et après délai wizard ; historique/Undo conservés.
- 15/15 tests ciblés avec méthodes App et promesses retardées, sans réseau ; syntaxe et
  diff --check réussis. Navigateur non testé dans ce sous-lot, aucun push ni agent.
- Prochain sous-lot : génération photo asynchrone et cible image ; audit IA et autres lots ouverts.

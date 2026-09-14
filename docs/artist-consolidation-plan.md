# Artist — Plan de consolidation révisable

Date : 13 septembre 2026. Base vérifiée : `7caf557`, dépôt `Documents/saas theo`.
Branche : `refactor/artist-consolidation`, worktree isolé `Documents/Codex/2026-09-07/artist-consolidation`.
Version cible : **4.8.0**, non publiée. La base déclare 4.2.0 dans package.json,
V4.3 PRO sur l'accueil et v4.7 dans les tests : cette divergence sera supprimée.

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

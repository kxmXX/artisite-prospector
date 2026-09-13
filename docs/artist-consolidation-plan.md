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
| 1 | Audit, contexte durable, version/changelog honnêtes | Base, captures, architecture et risques tracés | En cours |
| 2 | Stabilité : validation API, cache, tâches async et sauvegarde | Tests entrées invalides / réponses obsolètes / isolation contexte | À faire |
| 3 | Accueil, sombre, tokens et lisibilité des contrôles | Vrai champ nom utilisable, thèmes sans perte d'état, mobile sans overflow | À faire |
| 4 | Génération métier et faits non inventés | Plusieurs métiers, téléphone vide conservé, pas de faux avis/certifications | À faire |
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

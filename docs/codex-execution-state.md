# État de reprise Codex — 14 septembre 2026

## REPRISE COURTE — priorité vitrine (prévaut sur l'historique)

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

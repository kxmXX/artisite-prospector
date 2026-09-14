# Journal des Modifications (CHANGELOG)

Toutes les modifications notables apportées à ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère à la numérotation [Semantic Versioning](https://semver.org/lang/fr/).

---

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

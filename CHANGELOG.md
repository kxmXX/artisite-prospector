# Journal des Modifications (CHANGELOG)

Toutes les modifications notables apportées à ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère à la numérotation [Semantic Versioning](https://semver.org/lang/fr/).

---

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

- Plan d'exécution et règles de projet établis avant correction sur la base `7caf557`.
- 16 captures examinées, 136 tests existants réussis ; vérification fonctionnelle à compléter.
- Aucune correction des lots suivants n'est annoncée comme livrée à ce stade.

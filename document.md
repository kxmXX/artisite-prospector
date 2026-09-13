# Artist — Spécifications Techniques & Architecture

> Consolidation du 13 septembre 2026 : base package **4.2.0**, cible **4.8.0 non publiée**.
> Les sections historiques ci-dessous décrivent des intentions et fonctionnalités antérieures,
> pas une certification de leur qualité. État audité et lots : [plan de consolidation](docs/artist-consolidation-plan.md).
> Baseline vérifiée : 136 tests Node réussis. Aucun build/lint/typecheck configuré.

## 1. Présentation Générale

**Artisite Prospector v4.2.0** est une plateforme SaaS/Sandbox haute performance conçue pour les commerciaux, agences web, freelances et prospecteurs (« Michel »). Elle permet de générer en quelques secondes des sites vitrines premium, hyper-personnalisés et prêts à la vente pour les artisans et petites entreprises locales.

Le produit transforme un minimum d'informations (nom, métier, ville, téléphone) en un site vitrine complet de plus de 16 modules, avec proposition de valeur adaptée, palette de couleurs minérale/éditoriale, textures de papier grainées, typographies modernes et déclencheurs de conversion (appels d'urgence radar, devis, WhatsApp, forfaits limités).

---

## 2. Principes d'Édition & UX

- **Ce qui est visible dans le canvas doit être ciblable et modifiable** en direct sans rechargement.
- **Toute mutation persistante passe par l’historique Undo/Redo** (`⌘Z` / `Ctrl+Z`).
- **Navigation indépendante** : les contrôles de la sidebar ne doivent jamais déplacer le canvas par accident.
- **Réactivité réelle** : les animations, couleurs, typographies et rayons agissent sur le rendu réel du visualiseur.
- **Accessibilité et lisibilité** : contrastes soignés, dimensions PC confortables, et zéro badge technique polluant l'affichage.

---

## 3. Nouveautés Majeures de la Version 4.2.0

### 3.1 Comparateur SplitReveal Multi-Instance (Horizontal & Vertical)
- Prise en charge bidirectionnelle : curseur horizontal classique OU vertical (indispensable pour les toitures, façades et ravalements).
- Badge de pourcentage dynamique en temps réel (`sr-percent-badge`, ex: `50%`) avec support d'accessibilité clavier WCAG (`←`/`→` et `↑`/`↓`).
- Isolation complète : instances multiples sans interférence mutuelle, adaptées aux écrans tactiles et souris.

### 3.2 Moteur de Texture Papercraft & Grain Tactile 2026
- Bruit fractal organique généré par filtre SVG `feTurbulence` intégré en CSS data-URI ultra-léger (zéro requête réseau, 100% offline-ready).
- Nouveaux tokens de design system : `--bg-cream` (`#F5F1E8`), `--shadow-paper`, et presets *Éditorial Terroir* et *Papercraft Minéral*.

### 3.3 Module Commercial CampaignCard & Jauge Dynamique de Chantiers
- Carte de réservation avec jauge de progression calculée (ex: 18 / 25 chantiers confirmés = 72%).
- Pilules de sélection interactive de forfaits (*Essentielle*, *Confort*, *Sérénité*).

### 3.4 Bandeau d'Astreinte Radar 24/7 & Stickers Physiques Tiltés
- Point radar clignotant animé (`radar-pulse-dot`) avec ondes concentriques d'urgence pour électriciens, plombiers et serruriers.
- Stickers physiques découpés avec rotation subtile (`-2.5°` / `+2.5°`) et ombre portée tactile.

### 3.5 Machine à États IA Studio & Carte d'Approbation Transparente
- Carte d'approbation `AIApprovalCard` affichant la jauge de confiance (ex: 96%), le résumé des modifications et les boutons instantanés *Appliquer* / *Ignorer*.

### 3.6 Performance & Accessibilité Modern Web Guidance
- Jauge de lecture native sur thread compositeur GPU 120 FPS (`animation-timeline: scroll()`) sans aucun écouteur JS.
- Optimisation LCP avec `fetchpriority="high"` et `loading="eager"` sur le Hero, et `loading="lazy"` + `decoding="async"` sur les autres médias.
- Rendu différé des sections inférieures hors écran via `content-visibility: auto`.
- Anneau de focus tactile WCAG 2.2 AA (`:focus-visible`).

### 3.7 Correction des Superpositions et Badges UI
- Suppression définitive des pseudo-éléments `::after` (`[data-ui-target="true"]::after`) qui affichaient des identifiants techniques bruyants (`#btn-phone`, `#cta`, `#h1`) sur les textes et les boutons du visualiseur.
- Interface épurée et conforme à la charte graphique 2026–2030 (Linear, Raycast, Framer).

### 3.8 Contrôleur Tactile de Boutons CTA & Suppression avec Historique (Undo / Redo)
- **Suppression granulaire** : Possibilité de supprimer individuellement un bouton d'action (CTA primaire, secondaire, d'urgence) depuis le visualiseur ou l'inspecteur, avec prise en charge complète de l'annulation (`⌘Z` / `Ctrl+Z`).
- **Curseur de taille continu** : Remplacement des paliers rigides par un slider continu de mise à l'échelle (80% à 140% / 12px à 22px).
- **Sélecteur de rayon (Corner Radius)** : Bascule instantanée entre bords droits (`0px`), bords adoucis (`8px` ou `12px`), et format pilule (`9999px`).
- **Contrôles typographiques** : Boutons rapides `A-` / `A+` et bascule Casse Majuscules / Normal.

### 3.9 Moteur d'Animation Scroll-Reveal à 60 FPS
- Activation via `IntersectionObserver` sur les sections annotées `[data-motion]`.
- 4 préréglages cinématiques : `fade-in`, `slide-up`, `slide-in`, `spring`.
- Feedback visuel immédiat dans l'éditeur lors du changement de préréglage d'animation.

### 3.10 Réorganisation Drag & Drop Fiabilisée
- Isolation du drag-handle sur la poignée de préhension dédiée (`.section-card-grip`).
- Prévention des blocages lors des clics sur les contrôles enfants (accordéons, interrupteurs, inputs).
- Réordonnancement temps réel dans le store réactif avec persistance locale automatique.

---

## 4. Architecture Technique

```
artisite-prospector/
├── api/                     # Fonctions serverless (déploiement Vercel)
│   ├── [...path].js         # Routeur catch-all API
│   └── index.js             # Entrée principale API
├── public/                  # Frontend Vanilla JS / CSS Moderne
│   ├── css/
│   │   └── app.css          # Design System 2026-2030, Keycaps, Utilitaires
│   ├── js/
│   │   ├── app.js           # Orchestrateur UI, Event Bus, Observateur de scroll
│   │   ├── state.js         # Gestion d'état unifiée avec pile Undo/Redo
│   │   ├── components/      # Composants UI (Editor, Renderer, Modals, Palette)
│   │   ├── data/            # Métiers (TRADES), Polices, Fallbacks SVG, Inspiration
│   │   └── engine/          # Moteur de génération, Copilot IA, Export autonome
│   └── index.html           # Point d'entrée SPA
├── server/                  # Serveur local Node.js & intégration Gemini
│   ├── apiHandler.js        # Gestionnaire des requêtes REST
│   └── gemini.js            # Client IA avec cascade de repli (Fallback multi-modèles)
├── tests/                   # Suite de tests unitaires (Node test runner natif)
├── document.md              # Spécifications & Architecture (ce fichier)
├── CHANGELOG.md             # Journal chronologique des versions
└── package.json             # Métadonnées v4.2.0
```

---

## 5. Métiers Supportés (12 Secteurs Locaux)
1. **Jardinier & Paysagiste** (`landscaper`)
2. **Plombier & Chauffagiste** (`plumber`)
3. **Électricien** (`electrician`)
4. **Peintre en bâtiment** (`painter`)
5. **Couvreur & Zingueur** (`roofer`)
6. **Maçon & Rénovation** (`mason`)
7. **Menuisier & Agencement** (`carpenter`)
8. **Serrurier & Dépannage** (`locksmith`)
9. **Mécanicien & Garage** (`mechanic`)
10. **Coiffeur & Barbier** (`hairdresser`)
11. **Boulanger & Pâtissier** (`baker`)
12. **Restaurateur** (`restaurant`)

---

## 6. Matrice de Qualité & Critères d'Acceptation
- 100% des tests unitaires exécutés avec succès (`npm test`).
- Zéro dépendance externe lourde (Vanilla JS ESM natif, CSS moderne ultra-rapide).
- Compatible Desktop PC grand écran, Tablettes et Mobiles.
- Export HTML 100% autonome, transportable par clé USB ou envoi direct au prospect.

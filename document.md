# Artisite Prospector v4.1.0 — Spécifications Techniques & Architecture

## 1. Présentation Générale

**Artisite Prospector v4.1.0** est une plateforme SaaS/Sandbox haute performance conçue pour les commerciaux, agences web, freelances et prospecteurs (« Michel »). Elle permet de générer en quelques secondes des sites vitrines premium, hyper-personnalisés et prêts à la vente pour les artisans et petites entreprises locales.

Le produit transforme un minimum d'informations (nom, métier, ville, téléphone) en un site vitrine complet de 16 modules, avec proposition de valeur adaptée, palette de couleurs minérale/éditoriale, typographies modernes et déclencheurs de conversion (appels, devis, WhatsApp).

---

## 2. Principes d'Édition & UX

- **Ce qui est visible dans le canvas doit être ciblable et modifiable** en direct sans rechargement.
- **Toute mutation persistante passe par l’historique Undo/Redo** (`⌘Z` / `Ctrl+Z`).
- **Navigation indépendante** : les contrôles de la sidebar ne doivent jamais déplacer le canvas par accident.
- **Réactivité réelle** : les animations, couleurs, typographies et rayons agissent sur le rendu réel du visualiseur.
- **Accessibilité et lisibilité** : contrastes soignés, dimensions PC confortables, et zéro badge technique polluant l'affichage.

---

## 3. Nouveautés Majeures de la Version 4.1.0

### 3.1 Correction des Superpositions et Badges UI
- Suppression définitive des pseudo-éléments `::after` (`[data-ui-target="true"]::after`) qui affichaient des identifiants techniques bruyants (`#btn-phone`, `#cta`, `#h1`) sur les textes et les boutons du visualiseur.
- Interface épurée et conforme à la charte graphique 2026–2030 (Linear, Raycast, Framer).

### 3.2 Contrôleur Tactile de Boutons CTA & Suppression avec Historique (Undo / Redo)
- **Suppression granulaire** : Possibilité de supprimer individuellement un bouton d'action (CTA primaire, secondaire, d'urgence) depuis le visualiseur ou l'inspecteur, avec prise en charge complète de l'annulation (`⌘Z` / `Ctrl+Z`).
- **Curseur de taille continu** : Remplacement des paliers rigides par un slider continu de mise à l'échelle (80% à 140% / 12px à 22px).
- **Sélecteur de rayon (Corner Radius)** : Bascule instantanée entre bords droits (`0px`), bords adoucis (`8px` ou `12px`), et format pilule (`9999px`).
- **Contrôles typographiques** : Boutons rapides `A-` / `A+` et bascule Casse Majuscules / Normal.

### 3.3 Moteur d'Animation Scroll-Reveal à 60 FPS
- Activation via `IntersectionObserver` sur les sections annotées `[data-motion]`.
- 4 préréglages cinématiques : `fade-in`, `slide-up`, `slide-in`, `spring`.
- Feedback visuel immédiat dans l'éditeur lors du changement de préréglage d'animation.

### 3.4 Réorganisation Drag & Drop Fiabilisée
- Isolation du drag-handle sur la poignée de préhension dédiée (`.section-card-grip`).
- Prévention des blocages lors des clics sur les contrôles enfants (accordéons, interrupteurs, inputs).
- Réordonnancement temps réel dans le store réactif avec persistance locale automatique.

### 3.5 Design Tactile Rétro-Moderne (Keycap 3D)
- Finition des touches d'action en relief mécanique (biseautage discret, ombre d'enfoncement `:active { transform: translateY(1.5px); }`, rétro-éclairage hover).
- Séparation stricte entre le Thème Sombre/Clair de l'application et le Mode Aperçu Client (qui masque l'intégralité des barres d'outils et bordures d'édition pour le partage d'écran commercial).

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
└── package.json             # Métadonnées v4.1.0
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

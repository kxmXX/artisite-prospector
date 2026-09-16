---
name: Artist
description: Éditeur visuel de sites vitrines pour revendeurs et artisans du bâtiment
colors:
  ink: "#18201f"
  ink-2: "#26302e"
  paper: "#f4f2ec"
  panel: "#fbfaf7"
  canvas: "#e9ebe7"
  muted: "#5f6866"
  muted-on-dark: "#aab4b0"
  line: "rgba(24, 32, 31, .11)"
  accent: "#d76a3b"
  accent-soft: "#fae9df"
  sage: "#dce7df"
  ring: "#1f6feb"
  site-primary: "#527c22"
  site-secondary: "#8FA382"
  site-bg: "#FAFAF7"
  site-bg-secondary: "#F0F2EB"
  site-text: "#1C241B"
  site-text-muted: "#5E6B5D"
  section-dark: "#09090b"
  section-warm: "#faf8f5"
typography:
  chrome-label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.1em"
  chrome-body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  chrome-heading:
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.25
  site-heading:
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 1.15
  site-body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "999px"
  control: "10px"
spacing:
  space-1: "4px"
  space-2: "8px"
  space-3: "12px"
  space-4: "16px"
  space-5: "20px"
  space-6: "24px"
  space-8: "32px"
  space-10: "40px"
  space-12: "48px"
components:
  button-keycap:
    rounded: "{rounded.full}"
    padding: "16px 32px"
    typography: "{typography.site-body}"
  button-keycap-light:
    rounded: "{rounded.full}"
    padding: "6px 10px"
    typography: "{typography.chrome-label}"
  motion-button:
    rounded: "{rounded.control}"
    height: "34px"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.xl}"
  canvas:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.xl}"
---

# Design

Ce document décrit le système visuel **existant** d'Artist, tel qu'il est dans le code. Il couvre deux surfaces distinctes : le **chrome de l'application** (le studio d'édition) et le **site publié** (ce que voit le client final). Les jetons sont normatifs ; la prose explique comment les appliquer.

## Overview

Artist a deux mondes visuels qui ne doivent pas se mélanger :

- **Le chrome studio** — un outil dense et calme, à fond papier chaud, où l'attention va au contenu édité et non à l'interface. Jetons dans `public/css/tokens.css`, styles dans `public/css/studio-v3.css`.
- **Le site publié** — un rendu marketing par métier, cadré par des palettes de métier (`public/js/data/styles.js`) et des thèmes de section. Styles dans `public/css/app.css`, rendu par `public/js/components/renderer.js`.

Le chrome ne doit **jamais** déteindre sur le site publié : le site garde ses propres polices, couleurs et rayons (`--primary`, `--bg`, `--font-heading`…), posés par le rendu.

## Colors

**Chrome.** `--ui-ink` (#18201f) porte le texte et les sélections ; `--ui-paper` (#f4f2ec) est le fond de l'application, `--ui-panel` (#fbfaf7) celui des panneaux, `--ui-canvas` (#e9ebe7) celui du canevas. L'accent est un orange brûlé (`--ui-accent` #d76a3b), réservé aux éléments actifs et au curseur de saisie ; `--ui-sage` (#dce7df) est un fond de soutien verdoyant. Le verre décoratif a été retiré : les surfaces sont opaques.

**Site.** La palette par défaut (métier nature) : primaire #527c22, secondaire #8FA382, fond #FAFAF7, fond secondaire #F0F2EB, texte #1C241B, texte atténué #5E6B5D. Chaque métier reçoit une palette de la même famille dans `STYLE_PRESETS`. Les thèmes de section (`bg-sec-white|mineral|dark|warm|primary`) posent un fond et un texte cohérents ; `dark` est le seul à inverser le texte.

## Typography

**Chrome.** Deux familles : `--font-inter` pour l'interface, `--font-jakarta` pour les titres. L'échelle est volontairement petite (9 → 24 px) parce que l'outil est dense ; les libellés sont en majuscules espacées (`--ui-tracking-label` 0.1em) à 9–10 px, le corps à 12 px, les titres à 20 px. Les chiffres et identifiants passent en `font-variant-numeric: tabular-nums` : un compteur ne doit pas danser.

**Site.** La police de titre et de corps vient du style de métier (`--font-heading`, `--font-body`), choisie dans le catalogue de polices. Le titre de héros va jusqu'à 3,75 rem, graisse 800 ; le corps reste à 16 px / 1,65 pour la lecture.

## Layout

**Chrome.** Trois colonnes : rail d'outils (66 px), panneau Structure (286 px), canevas (1fr), propriétés (318 px). Sous 1280 px les panneaux se resserrent ; sous 900 px la disposition passe en bloc — l'édition reste pensée **desktop et tablette**, jamais téléphone. L'espacement suit une base de 4 px (`--ui-space-*`).

**Site.** Grille marketing classique : `max-w-6xl` centré, sections pleine largeur avec respiration `sm:p-12 / lg:p-24`, colonnes qui passent de 1 à 2/3/4 selon la largeur. La largeur de section est réglable (`pleine`, `contenu`, `étroite`).

## Elevation & Depth

Le chrome est **plat, sans verre** : la profondeur vient de trois ombres neutres (`--ui-shadow-1/2/3`, teintées sur l'encre) et de bordures 1 px (`--ui-line`), pas de halos colorés. Le site utilise ses propres ombres, posées par la palette de métier. Les seuls “reliefs” du site sont les boutons à touches (`btn-keycap`), avec une ombre portée basse qui simule une touche de clavier.

## Shapes

Rayons du chrome : 4 → 22 px, plus `full` (999 px) pour les pastilles. Les **contrôles** partagent un rayon unique (`--ui-radius-control` 10 px) et une hauteur unique (`--ui-control-height` 34 px) : pastilles d'animation, touches et chips ne réécrivent plus leurs valeurs. Les **boutons du site** sont pleinement arrondis (`--btn-radius`), sauf si le métier impose un rayon plus sobre (`buttonRadius` dans le style).

## Components

- **`btn-keycap` / `btn-keycap-light`** — boutons à touche du site et du chrome du canevas : fond, bordure basse épaisse, ombre basse, enfoncement de 1,5 px à l'appui. Ne jamais remplacer par une ombre floue colorée.
- **`motion-loop-btn`** — le contrôle de choix du chrome (une option active = fond encre, texte papier). Il sert aussi bien aux animations qu'aux états d'élément : un seul vocabulaire de boutons.
- **`ui-disclosure`** — divulgation native `<details>/<summary>` : l'inspecteur montre l'essentiel, le reste se déplie. Focus clavier visible, état retenu au nouveau rendu.
- **`freeform-selection-box`** — la boîte de sélection du canevas : un seul indicateur, partagé par la sélection libre et la liste des éléments. Pendent une transformation, toutes les animations du canevas sont figées.
- **`campaign-progress-fill`** — la barre de progression anime `transform: scaleX(var(--campaign-progress))`, jamais `width`.

## Do's and Don'ts

**À faire**
- Garder le chrome sur ses jetons (`tokens.css`) et le site sur ses variables de rendu.
- Utiliser `--ui-transition-control` pour tout changement d'état de contrôle.
- Vérifier chaque animation sous `prefers-reduced-motion` : elle doit être coupée.
- Garder le focus visible (`:focus-visible`, anneau unique `--ui-ring`).

**À ne pas faire**
- Pas de verre décoratif, de flou gratuit ni de halo coloré dans le chrome.
- Pas de glyphe texte là où une icône dessinée existe.
- Pas d'animation de propriété de mise en page (`width`, `height`, `top`, `left`) pour un effet continu.
- Pas de texte gris sur un fond coloré, ni de contraste sous le seuil de lisibilité.
- Ne pas réintroduire une liste de polices, couleurs ou animations en dur : le catalogue (`motionPresets.js`, `styles.js`, `fonts.js`) est la seule source.

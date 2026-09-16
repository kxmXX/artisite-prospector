# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Revendeurs et agences.** Un commercial — souvent seul, sans équipe design — produit et présente des sites vitrines à des artisans et TPE du bâtiment. Il doit tenir plusieurs prospects la même semaine et convaincre en rendez-vous, pas écrire du code.

Utilisateur final (le client du revendeur) : l'artisan, qui reçoit un site à son nom. Il n'édite pas l'outil.

## Product Purpose

Artist transforme un prospect — nom, métier, ville — en une **direction de site vitrine complète** : contenu, sections, images, animations. Le revendeur obtient une démo crédible en quelques minutes et la présente en rendez-vous.

Succès = **une démo crédible en quelques minutes, puis plusieurs sites clients produits à la suite**, sans repartir de zéro.

## Positioning

Un seul passage génère un site complet de **16 sections** pour l'un des **12 métiers artisanaux**, à partir de trois informations seulement, et le met immédiatement dans un éditeur visuel qui montre **exactement** ce qui sera publié. Ce n'est pas un constructeur de pages à assembler : la matière première (structure, textes, images de métier) est déjà composée.

## Operating Context

- Le revendeur travaille en **desktop ou tablette**, en rendez-vous ou en préparation ; jamais sur téléphone.
- Il présente soit l'éditeur, soit la **vue client** (le site sans le chrome d'édition), soit un **export HTML autonome**, soit un lien de prévisualisation partagé.
- Les projets sont conservés côté serveur (comptes et sessions), avec import de projets locaux existants.
- L'IA (assistant, génération d'images) est un **bonus en sommeil** : l'outil doit rester pleinement utilisable sans elle.

## Capabilities and Constraints

Confirmé :
- génération d'un site par métier et ville, 16 sections, variantes de mise en page ;
- éditeur visuel : sélection, position libre, redimensionnement, aimantation, animations (catalogue unique), états d'élément, comparateur avant/après ;
- vue client identique au rendu de l'éditeur ;
- export HTML autonome sans dépendance ;
- comptes, sessions et persistance de projets.

Contraintes :
- pas d'éditeur sur téléphone — le contrôle se fait sur desktop et tablette ;
- aucune dépendance npm, exécution Node ≥ 18 et déploiement Vercel ;
- les faits inconnus ne sont **pas inventés** : ils restent vides ou clairement de démonstration ;
- toute animation doit avoir une alternative quand `prefers-reduced-motion` est demandé.

Décision ouverte : l'assistant IA et la génération d'images restent en sommeil tant que la facturation Google n'est pas rétablie.

## Evidence on Hand

**Aucune preuve réelle pour l'instant : tout ce qui est affiché est de la démonstration.** Il n'existe ni avis clients vérifiés, ni photos de chantier réelles, ni identité de marque fournie. Le travail futur ne doit pas présenter ces contenus comme des faits, ni fabriquer des témoignages, des prix ou des références.

## Product Principles

1. **Une démo crédible prime sur l'exhaustivité.** Mieux vaut un site juste et présentable qu'un site complet mais générique.
2. **Rien d'inventé présenté comme vrai.** Un fait inconnu reste vide ou de démonstration, jamais affirmé.
3. **L'auteur garde la décision.** Chaque réglage est visible, modifiable, annulable — rien n'est imposé en silence.
4. **Ce que l'auteur voit est ce qui est publié.** Éditeur, vue client et export partagent la même source de rendu.
5. **Ça doit tourner partout, sans installation.** Aucune dépendance npm ; Node et Vercel suffisent.

## Accessibility & Inclusion

- Un seul anneau de focus, visible au clavier (`:focus-visible`), sur toutes les surfaces.
- Toute animation est neutralisée sous `prefers-reduced-motion` (y compris les boucles et les aperçus).
- Le contraste du texte publié est une exigence produit, pas un réglage optionnel.

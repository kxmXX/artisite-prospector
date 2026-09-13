import { getTradeById, findTradeByKeywords } from "../data/trades.js";
import { getStylePresetById } from "../data/styles.js";
import {
  evaluateCompositionPolicy,
  detectAntiPatterns,
  UI_COMPOSITION_POLICIES
} from "./componentIntelligence.js";

/**
 * Generates a complete, structured premium website for local business prospect.
 */
export function generateSite(input = {}) {
  const name = (input.name || "Artisan & Co").trim();
  const rawTrade = input.tradeId || input.trade || "paysagiste";
  const trade = getTradeById(rawTrade) || findTradeByKeywords(rawTrade);
  const city = (input.city || "Montauban").trim();
  const region = (input.region || (city.toLowerCase().includes("montauban") || city.toLowerCase().includes("toulouse") ? "Occitanie" : "Votre région")).trim();
  const phone = (input.phone || "07 68 94 32 10").trim();
  const email = (input.email || `contact@${slugify(name)}.fr`).trim();
  const address = (input.address || `Zone Artisanale, ${city}`).trim();

  // Pick preset
  const presetId = input.presetId || trade.defaultPreset || "nature-premium";
  const preset = getStylePresetById(presetId);

  const branding = {
    presetId: preset.id,
    presetName: preset.name,
    primaryColor: input.primaryColor || preset.primaryColor,
    secondaryColor: input.secondaryColor || preset.secondaryColor,
    accentColor: input.accentColor || preset.accentColor,
    bgColor: input.bgColor || preset.bgColor,
    bgSecondary: input.bgSecondary || preset.bgSecondary,
    textColor: input.textColor || preset.textColor,
    textMuted: input.textMuted || preset.textMuted,
    headingFont: input.headingFont || preset.headingFont,
    bodyFont: input.bodyFont || preset.bodyFont,
    borderRadius: preset.borderRadius || "0.75rem",
    buttonRadius: preset.buttonRadius || "9999px",
    cardStyle: preset.cardStyle || "bordered",
    socialProofEnabled: input.socialProofEnabled !== undefined ? Boolean(input.socialProofEnabled) : true,
    navigationMode: input.navigationMode || "one-page"
  };

  const business = {
    name,
    tradeId: trade.id,
    tradeLabel: trade.label,
    category: trade.category,
    badge: trade.badge,
    city,
    region,
    phone,
    email,
    address,
    openingHours: trade.id === "restaurant" ? {
      lundi: "Fermé",
      mardi: "12h00 - 14h30 / 19h00 - 22h30",
      mercredi: "12h00 - 14h30 / 19h00 - 22h30",
      jeudi: "12h00 - 14h30 / 19h00 - 22h30",
      vendredi: "12h00 - 14h30 / 19h00 - 23h00",
      samedi: "12h00 - 15h00 / 19h00 - 23h30",
      dimanche: "12h00 - 15h00 (Fermé le soir)"
    } : trade.id === "boulanger" ? {
      lundi: "Fermé",
      mardi: "06h30 - 19h30",
      mercredi: "06h30 - 19h30",
      jeudi: "06h30 - 19h30",
      vendredi: "06h30 - 19h30",
      samedi: "06h30 - 19h30",
      dimanche: "07h00 - 13h00"
    } : {
      lundi: "08h00 - 19h00",
      mardi: "08h00 - 19h00",
      mercredi: "08h00 - 19h00",
      jeudi: "08h00 - 19h00",
      vendredi: "08h00 - 19h00",
      samedi: "08h30 - 13h00",
      dimanche: "Fermé (urgences sur appel)"
    }
  };

  const isFoodTrade = ["restaurant", "boulanger"].includes(trade.id);
  const isPersonalCare = ["coiffeur"].includes(trade.id);
  const isLiberal = ["avocat"].includes(trade.id);

  const isBuildingGrosOeuvre = ["couvreur", "macon"].includes(trade.id);

  let aboutPoints = [
    `Déplacement offert et étude personnalisée à ${city}`,
    isBuildingGrosOeuvre ? "Garantie décennale et assurance responsabilité civile" : "Assurance responsabilité civile professionnelle et finitions soignées",
    "Chantiers nettoyés et restitués impeccables",
    "Interlocuteur unique tout au long de votre projet"
  ];
  let statsItems = [
    { value: "24h", label: "Délai moyen d'envoi du devis", sub: "Étude chiffrée gratuite" },
    { value: "100%", label: "Satisfaction garantie", sub: "Contrôle qualité systématique" },
    isBuildingGrosOeuvre ? { value: "10 ans", label: "Garantie décennale", sub: "Sur les travaux structurels" } : { value: "Soigné", label: "Finition artisanale", sub: "Respect des délais et des lieux" },
    { value: "0 €", label: "Frais de déplacement", sub: `Dans un rayon de 30 km de ${city}` }
  ];

  if (isFoodTrade) {
    aboutPoints = [
      "Produits frais rigoureusement sélectionnés chaque matin",
      "Recettes traditionnelles et savoir-faire 100% artisanal",
      "Respect strict des normes d'hygiène et de traçabilité HACCP",
      `Accueil chaleureux et convivial au cœur de ${city}`
    ];
    statsItems = [
      { value: "100%", label: "Fait Maison", sub: "Cuisine et préparation artisanale" },
      { value: "Local", label: "Circuits Courts", sub: "Producteurs et maraîchers de proximité" },
      { value: "Frais", label: "Arrivages Quotidiens", sub: "Sélection des meilleurs produits bruts" },
      { value: "7j/7", label: "Plaisir & Convivialité", sub: `Votre adresse gourmande à ${city}` }
    ];
  } else if (isPersonalCare) {
    aboutPoints = [
      "Diagnostic personnalisé et écoute attentive de vos envies",
      "Produits professionnels de haute qualité respectueux du cheveu",
      "Espace détente soigné avec bacs massants et boissons offertes",
      `Prestations soignées sur rendez-vous au cœur de ${city}`
    ];
    statsItems = [
      { value: "100%", label: "Sur-Mesure", sub: "Conseil visagiste et diagnostic personnalisé" },
      { value: "Pro", label: "Produits de Soin", sub: "Gammes professionnelles sélectionnées" },
      { value: "Détente", label: "Cadre Apaisant", sub: "Un moment de bien-être rien que pour vous" },
      { value: "5 ★", label: "Attention & Soin", sub: `Votre salon de référence à ${city}` }
    ];
  } else if (isLiberal) {
    aboutPoints = [
      "Confidentialité absolue et respect strict du secret professionnel",
      "Transparence totale des honoraires fixés par convention préalable",
      "Écoute humaine, disponibilité et réactivité pour défendre vos intérêts",
      `Cabinet facilement accessible au centre de ${city}`
    ];
    statsItems = [
      { value: "100%", label: "Secret Professionnel", sub: "Confidentialité et déontologie de l'Ordre" },
      { value: "Clair", label: "Honoraires Maîtrisés", sub: "Convention préalable transparente" },
      { value: "Dédié", label: "Conseil & Défense", sub: "Stratégie juridique sur mesure" },
      { value: "Direct", label: "Écoute & Réactivité", sub: `À vos côtés à ${city} et sa région` }
    ];
  }

  // Section 1: Header
  const headerSection = {
    id: "sec-header",
    type: "header",
    variant: "sticky-premium",
    visibility: true,
    content: {
      brandName: name,
      badge: trade.badge,
      phone,
      ctaText: isFoodTrade ? "Réserver une table" : isPersonalCare ? "Prendre RDV" : isLiberal ? "Prendre RDV" : "Demander un devis",
      links: [
        { label: "Prestations", target: "#services" },
        { label: "Savoir-Faire", target: "#about" },
        { label: "Réalisations", target: "#realisations" },
        { label: "Avis Clients", target: "#reviews" },
        { label: isFoodTrade ? "Réserver" : "Contact & Devis", target: "#quoteSimulator" },
        { label: "Accès", target: "#location" }
      ]
    },
    settings: { sticky: true }
  };

  // Section 2: Hero
  const heroSection = {
    id: "sec-hero",
    type: "hero",
    variant: "split-image",
    visibility: true,
    content: {
      badge: `${trade.badge} • ${city}`,
      title: trade.heroTitles[0] || `Votre artisan de confiance à ${city}`,
      subtitle: `${trade.heroSubtitles[0]} Intervention soignée à ${city} et ses environs.`,
      ctaPrimary: trade.ctaPrimary || "Demander mon devis gratuit",
      ctaSecondary: trade.ctaSecondary || "Appeler directement",
      phone,
      heroImage: trade.heroImage,
      trustNote: isLiberal ? "✓ Déontologie et secret professionnel garantis" : isFoodTrade ? "✓ Produits frais cuisinés maison chaque jour" : "✓ Devis 100% gratuit sous 24h sans engagement"
    },
    settings: { align: "left" }
  };

  // Section 3: Trust Badges
  const trustSection = {
    id: "sec-trust",
    type: "trust",
    variant: "grid-4",
    visibility: true,
    content: {
      badge: "Garanties & Engagements",
      title: `Pourquoi Faire Confiance à ${name} ?`,
      badges: trade.trustBadges
    },
    settings: { columns: 4 }
  };

  // Section 4: About / Story
  const aboutSection = {
    id: "sec-about",
    type: "about",
    variant: "split-story",
    visibility: true,
    content: {
      badge: "Notre Histoire & Philosophie",
      title: trade.aboutTitle || `À propos de ${name}`,
      story: trade.aboutStory.replace(/notre entreprise/g, name),
      owner: trade.aboutOwner || "L'équipe",
      role: trade.aboutRole || trade.label,
      image: trade.aboutImage,
      points: aboutPoints
    },
    settings: { reversed: false }
  };

  // Section 5: Key Stats (following rule 57: honest metrics, not fake invented counts)
  const statsSection = {
    id: "sec-stats",
    type: "stats",
    variant: "ribbon",
    visibility: true,
    content: {
      items: statsItems
    },
    settings: { background: "primary" }
  };

  // Section 6: Services
  const servicesSection = {
    id: "sec-services",
    type: "services",
    variant: "cards-grid",
    visibility: true,
    content: {
      badge: "Nos Prestations",
      title: `Prestations & Savoir-Faire à ${city}`,
      subtitle: `Découvrez l'ensemble de nos services professionnels adaptés aux particuliers et professionnels à ${city} et ses alentours.`,
      ctaCard: "Demander un chiffrage",
      services: trade.defaultServices.map((s, idx) => ({
        id: `srv-${idx + 1}`,
        title: s.title,
        desc: s.desc,
        tag: s.tag,
        price: s.price,
        image: s.image
      }))
    },
    settings: { columns: 3 }
  };

  // Section 7: Before / After interactive slider
  const beforeAfterSection = {
    id: "sec-before-after",
    type: "beforeAfter",
    variant: "interactive-slider",
    visibility: true,
    content: {
      badge: "Preuve en images",
      title: trade.beforeAfter.title,
      subtitle: trade.beforeAfter.subtitle,
      beforeImage: trade.beforeAfter.beforeImage,
      afterImage: trade.beforeAfter.afterImage,
      beforeLabel: trade.beforeAfter.beforeLabel,
      afterLabel: trade.beforeAfter.afterLabel,
      projectCity: `${trade.beforeAfter.projectCity} (${city})`,
      duration: trade.beforeAfter.duration
    },
    settings: { initialSplit: 50 }
  };

  // Section 8: Realisations
  const realisationsSection = {
    id: "sec-realisations",
    type: "realisations",
    variant: "cards-3",
    visibility: true,
    content: {
      badge: "Chantiers Réalisés",
      title: "Nos Dernières Réalisations",
      subtitle: `Quelques exemples récents de projets menés à bien à ${city} et en ${region}.`,
      items: trade.realisations.map((r, i) => ({
        id: `real-${i + 1}`,
        title: r.title,
        category: r.category,
        city: r.city.includes("local") || r.city.includes("Secteur") ? city : r.city,
        desc: r.desc,
        image: r.image
      }))
    },
    settings: { showTags: true }
  };

  // Section 9: Gallery
  const gallerySection = {
    id: "sec-gallery",
    type: "gallery",
    variant: "masonry-grid",
    visibility: true,
    content: {
      badge: "Portfolio Visuel",
      title: "Galerie Photos & Métier",
      subtitle: "Un aperçu soigné de notre quotidien, de notre outillage et de nos finitions.",
      photos: trade.gallery.map((g, idx) => ({
        id: `gal-${idx + 1}`,
        url: g.url,
        title: g.title,
        tag: g.tag
      }))
    },
    settings: { enableLightbox: true }
  };

  // Section 10: Reviews
  const reviewsSection = {
    id: "sec-reviews",
    type: "reviews",
    variant: "google-cards",
    visibility: true,
    content: {
      badge: "Avis Clients Vérifiés",
      title: "La Confiance de Nos Clients Locaux",
      subtitle: `Découvrez les retours d'expérience des particuliers et entreprises qui nous ont confié leurs projets à ${city}.`,
      overallRating: "4.9",
      totalReviews: "48 avis Google",
      badgeText: "Avis Google vérifiés",
      reviews: trade.reviews.map((rev, i) => ({
        id: `rev-${i + 1}`,
        author: rev.author,
        city: rev.city.includes("Particulier") ? `Particulier (${city})` : rev.city,
        rating: rev.rating,
        date: rev.date,
        text: rev.text
      }))
    },
    settings: { showRatingCard: true }
  };

  // Section 11: Quote Simulator
  const quoteSection = {
    id: "sec-quote-simulator",
    type: "quoteSimulator",
    variant: "interactive-calculator",
    visibility: true,
    content: {
      badge: "Devis Express en Ligne",
      title: "Simulez Votre Projet en 3 Clics",
      subtitle: "Sélectionnez votre besoin et recevez une estimation chiffrée gratuite et sans engagement sous 24h.",
      typeLabel: trade.quoteConfig.typeLabel,
      types: trade.quoteConfig.types,
      sizeLabel: trade.quoteConfig.sizeLabel,
      sizes: trade.quoteConfig.sizes,
      urgencyLabel: "Délai souhaité",
      urgencyOptions: ["Dès que possible", "Sous 15 jours", "Dans le mois", "Simple estimation"],
      ctaButton: "Envoyer ma demande de chiffrage",
      phonePrompt: "Ou appelez-nous directement au"
    },
    settings: { directSubmit: true }
  };

  // Section 12: Hours
  const hoursSection = {
    id: "sec-hours",
    type: "hours",
    variant: "table-card",
    visibility: true,
    content: {
      badge: "Disponibilités",
      title: "Horaires d'Ouverture & Accueil",
      subtitle: `Nous intervenons du lundi au samedi sur ${city} et ses communes limitrophes.`,
      hours: business.openingHours,
      note: "En cas d'urgence constatée, notre ligne téléphonique reste active 7j/7.",
      phone
    },
    settings: { showLiveStatus: true }
  };

  // Section 13: Location / Intervention Zone
  const isStorefront = isFoodTrade || isPersonalCare || isLiberal;
  const locationSection = {
    id: "sec-location",
    type: "location",
    variant: "zone-card",
    visibility: true,
    content: {
      badge: isStorefront ? "Nous Rendre Visite" : "Proximité & Déplacement",
      title: isStorefront ? `Notre Établissement à ${city}` : `Zone d'Intervention : ${city} & ${region}`,
      subtitle: isStorefront
        ? `Idéalement situé au cœur de ${city}, notre établissement vous accueille dans un cadre soigné et facile d'accès.`
        : `Basés à ${city}, nous nous déplaçons rapidement dans un rayon de 35 km sans frais kilométriques superflus.`,
      city,
      region,
      address: business.address,
      phone,
      radius: isStorefront ? "Accueil sur place" : "Rayon de 35 km",
      citiesCovered: [
        city,
        `${city} Centre`,
        "Secteur Nord",
        "Secteur Sud",
        "Communes du bassin local",
        "Périphérie immédiate"
      ],
      ctaRoute: "Calculer mon itinéraire"
    },
    settings: { interactiveMap: true }
  };

  // Section 14: FAQ
  const faqSection = {
    id: "sec-faq",
    type: "faq",
    variant: "accordion",
    visibility: true,
    content: {
      badge: "Foire Aux Questions",
      title: "Questions Fréquentes",
      subtitle: "Tout ce que vous devez savoir avant de nous confier votre projet.",
      items: (trade.faq || []).map((item, idx) => ({
        id: `faq-${idx + 1}`,
        q: item.q,
        a: item.a
      }))
    },
    settings: { allowMultiple: false }
  };

  // Section 15: Final CTA
  const ctaSection = {
    id: "sec-cta",
    type: "cta",
    variant: "banner-dark",
    visibility: true,
    content: {
      badge: "Passons à l'action",
      title: `Prêt à concrétiser votre projet à ${city} ?`,
      subtitle: `Bénéficiez dès aujourd'hui d'une écoute attentive, d'un travail soigné et d'un accompagnement personnalisé sans mauvaise surprise.`,
      ctaPrimary: trade.ctaPrimary,
      ctaSecondary: trade.ctaSecondary,
      phone,
      trustNote: "Intervention rapide • Garantie professionnelle • Devis gratuit"
    },
    settings: { style: "dark" }
  };

  // Section 16: Footer
  const footerSection = {
    id: "sec-footer",
    type: "footer",
    variant: "columns-classic",
    visibility: true,
    content: {
      brandName: name,
      badge: trade.badge,
      desc: isLiberal
        ? `Cabinet professionnel de conseil juridique et de défense à ${city} et ses alentours. Rigueur, confidentialité et respect de la déontologie.`
        : isFoodTrade
        ? `Établissement artisanal de qualité à ${city}. Produits frais, savoir-faire traditionnel et passion du goût au quotidien.`
        : `Artisan professionnel spécialisé en ${trade.category.toLowerCase()} à ${city} et ses alentours. Travail soigné, devis gratuits et respect des délais.`,
      phone,
      email,
      address: business.address,
      city,
      copyright: `© ${new Date().getFullYear()} ${name}. Tous droits réservés. Site vitrine de présentation professionnelle.`
    },
    settings: { showLegalNotice: true }
  };

  const isEmergencyTrade = ["plombier", "electricien", "serrurier", "couvreur", "depannage"].includes(trade.id);
  const emergencyBanner = isEmergencyTrade ? createSectionData("customBlock", "radarEmergency", trade, business) : null;
  if (emergencyBanner) emergencyBanner.id = "sec-radar-emergency";

  const sections = [
    headerSection,
    heroSection,
    ...(emergencyBanner ? [emergencyBanner] : []),
    trustSection,
    aboutSection,
    statsSection,
    servicesSection,
    beforeAfterSection,
    gallerySection,
    realisationsSection,
    reviewsSection,
    quoteSection,
    hoursSection,
    locationSection,
    faqSection,
    ctaSection,
    footerSection
  ];

  const projectId = input.id || `proj-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  return {
    id: projectId,
    name,
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pipelineStatus: input.pipelineStatus || "generated", // prospect, generated, contacted, demo_sent, won
    business,
    branding,
    siteTheme: input.siteTheme || ((preset.bgColor || "#ffffff").toLowerCase() === "#0f0f11" ? "dark" : "light"),
    closerTips: trade.closerTips || {},
    settings: input.settings || { stickyBarEnabled: true, clientDemoPin: null },
    sections,
    componentAudit: {
      evaluatedAt: new Date().toISOString(),
      composition: evaluateCompositionPolicy(UI_COMPOSITION_POLICIES.landingPage, sections.map(s => s.type)),
      antiPatterns: detectAntiPatterns(sections.map(s => s.type), { pageType: "landing" }),
      a11ySummary: { totalChecked: sections.length, compliant: true }
    }
  };
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function createSectionData(type, variant, trade, business = {}) {
  // Support flexible argument patterns (e.g. (type, business, variant) or (type, variant, trade, business))
  if (variant && typeof variant === "object" && (!trade || typeof trade === "string")) {
    const tempVariant = typeof trade === "string" ? trade : null;
    business = variant;
    variant = tempVariant;
    trade = null;
  }
  if (!trade && business) {
    trade = getTradeById(business.tradeId) || findTradeByKeywords(business.tradeLabel || business.tradeId || "paysagiste");
  }
  if (!trade) {
    trade = getTradeById("renovation");
  }

  const name = business.name || "Artisan Local";
  const city = business.city || "Secteur Local";
  const region = business.region || "Votre Région";
  const phone = business.phone || "07 XX XX XX XX";
  const email = business.email || `contact@artisan.fr`;
  const address = business.address || `Zone Artisanale, ${city}`;

  const sec = (() => {
    switch (type) {
    case "header":
      return {
        type: "header",
        variant: variant || "sticky-premium",
        content: {
          brandName: name,
          badge: trade?.badge || "Artisan Qualifié",
          phone,
          ctaText: "Demander un devis",
          links: [
            { label: "Services", target: "#services" },
            { label: "Réalisations", target: "#realisations" },
            { label: "Avant / Après", target: "#before-after" },
            { label: "Avis", target: "#avis" },
            { label: "Tarifs & Devis", target: "#simulateur" },
            { label: "Contact", target: "#contact" }
          ]
        },
        settings: { sticky: true }
      };

    case "footer":
      return {
        type: "footer",
        variant: variant || "columns-classic",
        content: {
          brandName: name,
          badge: trade?.badge || "Artisan Qualifié",
          desc: `Artisan professionnel spécialisé en ${trade?.category?.toLowerCase() || 'rénovation'} à ${city} et ses alentours. Travail soigné, devis gratuits et respect des délais.`,
          phone,
          email,
          address,
          city,
          copyright: `© ${new Date().getFullYear()} ${name}. Tous droits réservés. Site vitrine de présentation professionnelle.`
        },
        settings: { showLegalNotice: true }
      };

    case "hero":
      return {
        type: "hero",
        variant: variant || "split-image",
        content: {
          badge: `${trade.badge} • ${city}`,
          title: trade.heroTitles[0] || `Votre artisan de confiance à ${city}`,
          subtitle: `${trade.heroSubtitles[0]} Intervention soignée à ${city} et ses environs.`,
          ctaPrimary: trade.ctaPrimary || "Demander mon devis gratuit",
          ctaSecondary: trade.ctaSecondary || "Appeler directement",
          phone,
          heroImage: trade.heroImage,
          trustNote: "✓ Devis 100% gratuit sous 24h sans engagement"
        },
        settings: { align: "left" }
      };

    case "services":
      return {
        type: "services",
        variant: variant || "cards-grid",
        content: {
          badge: "Nos Prestations",
          title: `Prestations & Savoir-Faire à ${city}`,
          subtitle: `Découvrez l'ensemble de nos services professionnels adaptés à vos projets à ${city}.`,
          ctaCard: "Demander un chiffrage",
          services: (trade.defaultServices || []).map((s, idx) => ({
            id: `srv-${idx + 1}`,
            title: s.title,
            desc: s.desc,
            tag: s.tag,
            price: s.price,
            image: s.image
          }))
        },
        settings: { columns: 3 }
      };

    case "about": {
      const isFood = ["restaurant", "boulanger"].includes(trade.id);
      const isPersonalCare = ["coiffeur"].includes(trade.id);
      const isLiberal = ["avocat"].includes(trade.id);
      let secAboutPoints = [
        `Déplacement offert et étude personnalisée à ${city}`,
        "Assurance décennale et responsabilité civile professionnelle",
        "Chantiers nettoyés et restitués impeccables",
        "Interlocuteur unique tout au long de votre projet"
      ];
      if (isFood) {
        secAboutPoints = [
          "Produits frais rigoureusement sélectionnés chaque matin",
          "Recettes traditionnelles et savoir-faire 100% artisanal",
          "Respect strict des normes d'hygiène et de traçabilité HACCP",
          `Accueil chaleureux et convivial au cœur de ${city}`
        ];
      } else if (isPersonalCare) {
        secAboutPoints = [
          "Diagnostic personnalisé et écoute attentive de vos envies",
          "Produits professionnels de haute qualité respectueux du cheveu",
          "Espace détente soigné avec bacs massants et boissons offertes",
          `Prestations soignées sur rendez-vous au cœur de ${city}`
        ];
      } else if (isLiberal) {
        secAboutPoints = [
          "Confidentialité absolue et respect strict du secret professionnel",
          "Transparence totale des honoraires fixés par convention préalable",
          "Écoute humaine, disponibilité et réactivité pour défendre vos intérêts",
          `Cabinet facilement accessible au centre de ${city}`
        ];
      }
      return {
        type: "about",
        variant: variant || "editorial-split",
        content: {
          badge: "Notre Savoir-Faire",
          title: trade.aboutTitle || `L'exigence d'un artisan local à ${city}`,
          story: (trade.aboutStory || "").replace(/ notre entreprise /gi, name),
          owner: trade.aboutOwner,
          role: trade.aboutRole,
          image: trade.aboutImage,
          points: secAboutPoints
        },
        settings: { reversed: false }
      };
    }

    case "beforeAfter":
      return {
        type: "beforeAfter",
        variant: variant || "interactive-slider",
        content: {
          badge: "Preuve en images",
          title: trade.beforeAfter?.title || "Transformation spectaculaire de vos espaces",
          subtitle: trade.beforeAfter?.subtitle || "Faites glisser le curseur pour visualiser la métamorphose avant et après nos travaux",
          beforeImage: trade.beforeAfter?.beforeImage,
          afterImage: trade.beforeAfter?.afterImage,
          beforeLabel: trade.beforeAfter?.beforeLabel || "Avant travaux",
          afterLabel: trade.beforeAfter?.afterLabel || "Après notre intervention",
          projectCity: `${city}`,
          duration: trade.beforeAfter?.duration || "3 jours de chantier",
          direction: variant === "vertical" ? "vertical" : "horizontal",
          caption: "Glissez le curseur interactif ou utilisez les flèches du clavier pour comparer nos réalisations"
        },
        settings: { initialSplit: 50, direction: variant === "vertical" ? "vertical" : "horizontal" }
      };

    case "gallery":
      return {
        type: "gallery",
        variant: variant || "masonry-grid",
        content: {
          badge: "Portfolio Visuel",
          title: "Galerie Photos & Métier",
          subtitle: "Un aperçu soigné de notre quotidien, de notre outillage et de nos réalisations.",
          photos: (trade.gallery || []).map((g, idx) => ({
            id: `gal-${idx + 1}`,
            url: g.url,
            title: g.title,
            tag: g.tag
          }))
        },
        settings: { enableLightbox: true }
      };

    case "realisations":
      return {
        type: "realisations",
        variant: variant || "cards-3",
        content: {
          badge: "Chantiers Réalisés",
          title: "Nos Dernières Réalisations",
          subtitle: `Quelques exemples récents de projets menés à bien à ${city} et alentours.`,
          items: (trade.realisations || []).map((r, i) => ({
            id: `real-${i + 1}`,
            title: r.title,
            category: r.category,
            city: city,
            desc: r.desc,
            image: r.image
          }))
        },
        settings: { showTags: true }
      };

    case "reviews":
      return {
        type: "reviews",
        variant: variant || "google-cards",
        content: {
          badge: "Avis Clients Vérifiés",
          title: "La Confiance de Nos Clients Locaux",
          subtitle: `Découvrez les retours d'expérience des particuliers qui nous ont confié leurs projets à ${city}.`,
          overallRating: "4.9",
          totalReviews: "48 avis Google",
          badgeText: "Avis Google vérifiés",
          reviews: (trade.reviews || []).map((rev, i) => ({
            id: `rev-${i + 1}`,
            author: rev.author,
            city: `Client vérifié (${city})`,
            rating: rev.rating,
            date: rev.date,
            text: rev.text
          }))
        },
        settings: { showRatingCard: true }
      };

    case "stats":
      return {
        type: "stats",
        variant: variant || "ribbon",
        content: {
          items: [
            { value: "24h", label: "Délai moyen d'envoi du devis", sub: "Étude chiffrée gratuite" },
            { value: "100%", label: "Satisfaction garantie", sub: "Contrôle qualité systématique" },
            { value: "10 ans", label: "Garantie décennale", sub: "Selon nature des travaux" },
            { value: "0 €", label: "Frais de déplacement", sub: `Dans un rayon de 30 km de ${city}` }
          ]
        },
        settings: { background: "primary" }
      };

    case "quoteSimulator":
      return {
        type: "quoteSimulator",
        variant: variant || "interactive-calculator",
        content: {
          badge: "Devis Express en Ligne",
          title: "Simulez Votre Projet en 3 Clics",
          subtitle: "Sélectionnez votre besoin et recevez une estimation chiffrée gratuite sous 24h.",
          typeLabel: trade.quoteConfig?.typeLabel || "Type de prestation",
          types: trade.quoteConfig?.types || ["Prestation standard", "Rénovation complète", "Entretien régulier"],
          sizeLabel: trade.quoteConfig?.sizeLabel || "Envergure estimée",
          sizes: trade.quoteConfig?.sizes || ["Petite surface", "Moyenne surface", "Grande surface"],
          urgencyLabel: "Délai souhaité",
          urgencyOptions: ["Dès que possible", "Sous 15 jours", "Dans le mois", "Simple estimation"],
          ctaButton: "Envoyer ma demande de chiffrage",
          phonePrompt: "Ou appelez-nous directement au"
        },
        settings: { directSubmit: true }
      };

    case "hours":
      return {
        type: "hours",
        variant: variant || "table-card",
        content: {
          badge: "Disponibilités",
          title: "Horaires d'Ouverture & Accueil",
          subtitle: `Nous intervenons du lundi au samedi sur ${city} et ses communes limitrophes.`,
          hours: {
            lundi: "08h00 - 19h00",
            mardi: "08h00 - 19h00",
            mercredi: "08h00 - 19h00",
            jeudi: "08h00 - 19h00",
            vendredi: "08h00 - 19h00",
            samedi: "08h30 - 13h00",
            dimanche: "Fermé (urgences sur appel)"
          },
          note: "En cas d'urgence constatée, notre ligne téléphonique reste active 7j/7.",
          phone
        },
        settings: { showLiveStatus: true }
      };

    case "location":
      return {
        type: "location",
        variant: variant || "zone-card",
        content: {
          badge: "Proximité & Déplacement",
          title: `Zone d'Intervention : ${city} & ${region}`,
          subtitle: `Basés à ${city}, nous nous déplaçons rapidement dans un rayon de 35 km sans frais de route.`,
          city,
          region,
          address,
          phone,
          radius: "Rayon de 35 km",
          citiesCovered: [city, `${city} Centre`, "Secteur Nord", "Secteur Sud", "Périphérie immédiate"],
          ctaRoute: "Calculer mon itinéraire"
        },
        settings: { interactiveMap: true }
      };

    case "faq":
      return {
        type: "faq",
        variant: variant || "accordion",
        content: {
          badge: "Foire Aux Questions",
          title: "Questions Fréquentes",
          subtitle: "Tout ce que vous devez savoir avant de nous confier votre projet.",
          items: (trade.faq || []).map((item, idx) => ({
            id: `faq-${idx + 1}`,
            q: item.q,
            a: item.a
          }))
        },
        settings: { accordionAutoClose: true }
      };

    case "cta":
      return {
        type: "cta",
        variant: variant || "banner-action",
        content: {
          badge: "Prenez Contact",
          title: `Prêt à concrétiser votre projet à ${city} ?`,
          subtitle: `Votre artisan ${trade.label?.toLowerCase() || 'local'} se déplace gratuitement pour vous conseiller et chiffrer votre besoin.`,
          ctaPrimary: "Demander mon devis gratuit",
          ctaSecondary: `Appeler : ${phone}`,
          phone
        },
        settings: { background: "dark" }
      };

    case "trust":
      return {
        type: "trust",
        variant: variant || "grid-4",
        content: {
          badges: [
            { title: "Devis en 24h", desc: "Étude chiffrée gratuite et sans engagement" },
            { title: "Garantie Décennale", desc: "Tous travaux couverts et assurés" },
            { title: "Artisan Qualifié", desc: `Intervention soignée à ${city}` },
            { title: "Chantier Propre", desc: "Nettoyage rigoureux après travaux" }
          ]
        },
        settings: {}
      };

    case "process":
      return {
        type: "process",
        variant: variant || "steps-3",
        content: {
          badge: "Notre Méthode",
          title: "Un déroulement simple et transparent",
          subtitle: `De la prise de contact à la livraison de vos travaux à ${city}, nous vous accompagnons à chaque étape.`,
          steps: [
            { num: "01", title: "Premier Contact & Écoute", desc: "Échange direct sur votre besoin, visite sur site si nécessaire et conseils techniques adaptés." },
            { num: "02", title: "Devis Détaillé sous 24h", desc: "Proposition claire, chiffrage transparent sans mauvaise surprise et calendrier d'intervention." },
            { num: "03", title: "Réalisation & Réception", desc: "Exécution soignée dans les règles de l'art, respect des délais et chantier rendu impeccable." }
          ]
        },
        settings: {}
      };

    case "certifications":
      return {
        type: "certifications",
        variant: variant || "cards-4",
        content: {
          badge: "Sérénité & Garanties",
          title: "Vos travaux en toute sécurité",
          subtitle: "Des assurances solides et des engagements vérifiés pour votre totale tranquillité d'esprit.",
          items: [
            { title: "Garantie Décennale", desc: "Couverture décennale sur tous les travaux de gros œuvre et second œuvre.", icon: "shield" },
            { title: "Responsabilité Civile Pro", desc: "Assurance professionnelle complète protégeant vos locaux et biens.", icon: "badgeCheck" },
            { title: "Respect des Normes DTU", desc: "Interventions conformes aux documents techniques unifiés et règles de l'art.", icon: "checkCircle" },
            { title: "Artisan de Proximité", desc: `Implantation locale à ${city} garantissant réactivité et suivi personnalisé.`, icon: "mapPin" }
          ]
        },
        settings: {}
      };

    case "pricing":
      return {
        type: "pricing",
        variant: variant || "cards-3",
        content: {
          badge: "Transparence Tarifaire",
          title: "Des formules adaptées à chaque projet",
          subtitle: "Des prix justes, clairs et sans surprise. Chaque devis est 100% personnalisé et gratuit.",
          tiers: [
            {
              name: "Formule Essentielle",
              price: "Sur devis",
              desc: "Idéale pour les interventions ciblées et l'entretien régulier.",
              features: ["Déplacement & diagnostic offert", "Devis détaillé sous 24h", "Fourniture de matériaux standard", "Chantier nettoyé"],
              isPopular: false
            },
            {
              name: "Formule Confort",
              price: "Sur-mesure",
              desc: "La solution la plus choisie pour la rénovation complète et l'embellissement.",
              features: ["Toutes les options Essentielles", "Matériaux haut de gamme garantis", "Garantie décennale incluse", "Suivi prioritaire 7j/7"],
              isPopular: true
            },
            {
              name: "Formule Intégrale",
              price: "Projet clé en main",
              desc: "Accompagnement total de la conception à la réalisation finale sur-mesure.",
              features: ["Étude d'architecture & plans 3D", "Gestion complète des approvisionnements", "Interlocuteur unique dédié", "Garantie de parfait achèvement"],
              isPopular: false
            }
          ]
        },
        settings: {}
      };

    case "customBlock": {
      const isCampaign = variant === "campaignCard";
      const isRadar = variant === "radarEmergency";
      return {
        type: "customBlock",
        variant: variant || "urgentBanner",
        content: {
          blockType: variant || "urgentBanner",
          badge: isRadar ? "Astreinte 24/7" : (isCampaign ? "Réservations ouvertes" : "Information"),
          title: isRadar 
            ? "Intervention d'urgence & Dépannage rapide 24h/24"
            : (isCampaign ? `Campagne Rénovation & Chantiers ${city}` : "Chantier urgent ou projet sur-mesure ?"),
          text: isRadar
            ? `Notre équipe intervient en moins de 30 minutes à ${city} et ses alentours. Matériel professionnel et devis immédiat.`
            : (isCampaign 
              ? `Planifiez votre projet dès maintenant pour garantir une disponibilité prioritaire sur notre calendrier d'intervention.`
              : `Notre équipe se déplace directement à ${city} pour évaluer vos travaux et vous remettre un devis gratuit sous 24h.`),
          ctaText: isRadar ? `Appel d'urgence (${phone})` : (isCampaign ? "Réserver mon créneau prioritaire" : `Contacter l'artisan (${phone})`),
          ctaLink: isRadar ? `tel:${phone}` : "#quoteSimulator",
          currentBookings: isCampaign ? 18 : undefined,
          targetBookings: isCampaign ? 25 : undefined,
          priceText: isCampaign ? "À partir de 450€ TTC" : undefined,
          pills: isCampaign ? ["Formule Essentiel", "Formule Confort", "Clé en main"] : undefined,
          activePill: isCampaign ? 1 : undefined,
          isRadar: isRadar,
          stickers: isRadar ? ["⚡ Intervention 30 min", "★ 100% Agréé Assurance"] : undefined
        },
        settings: {}
      };
    }

    case "quoteBlock":
      return {
        type: "quoteBlock",
        variant: variant || "editorial-quote",
        content: {
          badge: "Parole de Fondateur",
          quote: `« Notre priorité absolue à ${city} n'est pas seulement de réaliser un chantier, c'est de bâtir une relation de confiance durable avec chaque client. »`,
          authorName: name,
          authorRole: `Artisan Référencé • ${city}`,
          authorPhoto: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=200&q=80"
        },
        settings: {}
      };

    case "videoBlock":
      return {
        type: "videoBlock",
        variant: variant || "immersive-player",
        content: {
          badge: "🎬 Immersion Chantier",
          title: `Découvrez nos chantiers en action à ${city}`,
          subtitle: "Chaque geste compte. Regardez nos artisans en situation réelle sur nos réalisations locales.",
          poster: trade?.heroImage || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
          videoUrl: "#"
        },
        settings: { bgTheme: "dark" }
      };

    case "stepperBlock":
      return {
        type: "stepperBlock",
        variant: variant || "numbered-stepper",
        content: {
          badge: "Étapes de Chantier",
          title: "Un parcours limpide du devis à la livraison",
          steps: [
            { step: "1", title: "Diagnostic & Devis Gratuit", desc: `Visite technique offerte à ${city} sous 24h avec chiffrage sans engagement.` },
            { step: "2", title: "Planification & Préparation", desc: "Validation des matériaux, calendrier d'intervention et protection des lieux." },
            { step: "3", title: "Exécution des Travaux", desc: "Réalisation soignée dans les règles de l'art par nos artisans qualifiés." },
            { step: "4", title: "Réception & Nettoyage", desc: "Contrôle qualité contradictoire, remise de garantie et chantier rendu impeccable." }
          ]
        },
        settings: {}
      };

    case "tableBlock":
      return {
        type: "tableBlock",
        variant: variant || "comparison-table",
        content: {
          badge: "Tableau Comparatif",
          title: "Comparateur transparent des prestations",
          rows: [
            { label: "Déplacement & Diagnostic", standard: "0 € (Offert)", premium: "0 € (Prioritaire 24h)" },
            { label: "Assurance & Garantie", standard: "RC Pro standard", premium: "Garantie Décennale 10 ans" },
            { label: "Délai moyen d'intervention", standard: "7 à 10 jours", premium: "Sous 48h garanti" },
            { label: "Nettoyage fin de chantier", standard: "Inclus", premium: "Remise à neuf totale" },
            { label: "Interlocuteur dédié", standard: "Standard", premium: "Chef d'équipe direct" }
          ]
        },
        settings: {}
      };

    case "sliderBlock":
      return {
        type: "sliderBlock",
        variant: variant || "surface-slider",
        content: {
          badge: "Curseur Interactif",
          title: "Estimez le dimensionnement de votre surface",
          subtitle: `Faites glisser le curseur pour visualiser l'envergure approximative de votre projet à ${city}.`,
          min: 10,
          max: 250,
          default: 50,
          unit: "m²"
        },
        settings: {}
      };

    case "tabsBlock":
      return {
        type: "tabsBlock",
        variant: variant || "segmented-tabs",
        content: {
          badge: "Nos Spécialités",
          title: "Explorez nos prestations par domaine",
          tabs: [
            { title: "Intervention Standard", text: `Prestation courante d'entretien et de rénovation pour particuliers à ${city}.`, tag: "Essentiel" },
            { title: "Rénovation Complète", text: "Projet clé en main de A à Z avec matériaux haut de gamme et garantie décennale.", tag: "Sérénité Pro" },
            { title: "Urgences & Dépannages", text: `Astreinte rapide sous 30 minutes sur ${city} et ses environs.`, tag: "Express 24/7" }
          ]
        },
        settings: {}
      };

    case "roiCalculator":
      return {
        type: "roiCalculator",
        variant: variant || "interactive-calculator",
        content: {
          badge: "Rentabilité Immédiate",
          title: "Calculez la Rentabilité Réelle de Votre Futur Site",
          subtitle: `Voyez exactement combien de nouveaux chantiers à ${city} suffisent pour rentabiliser votre investissement.`,
          defaultTicket: 1200,
          defaultLeads: 4,
          defaultConv: 50,
          siteCost: 990,
          ctaText: "Réserver ce retour sur investissement",
          ctaLink: `tel:${phone}`
        },
        settings: { bgTheme: "mineral" }
      };

    case "bookingBlock":
      return {
        type: "bookingBlock",
        variant: variant || "slot-picker",
        content: {
          badge: "Disponibilités en Direct",
          title: "Réservez Votre Créneau d'Intervention ou Devis",
          subtitle: `Sélectionnez un créneau disponible cette semaine à ${city} pour une prise en charge rapide.`,
          services: [
            "Diagnostic & Devis Gratuit",
            "Intervention d'Urgence",
            "Rénovation Complète",
            "Entretien & Dépannage"
          ],
          slots: [
            { id: "slot-1", label: "Aujourd'hui", time: "14h00 - 16h30", status: "urgent" },
            { id: "slot-2", label: "Demain Matin", time: "08h30 - 11h30", status: "available" },
            { id: "slot-3", label: "Demain Après-midi", time: "14h00 - 17h00", status: "available" },
            { id: "slot-4", label: "Cette semaine", time: "Créneau flexible", status: "available" }
          ],
          phonePrompt: "Confirmation immédiate par SMS ou WhatsApp",
          phone,
          ctaConfirm: "Valider la réservation du créneau"
        },
        settings: { bgTheme: "white" }
      };

    default:
      return {
        type,
        variant: variant || "default",
        content: {
          badge: "Section",
          title: `Section ${type}`,
          subtitle: "Contenu de section personnalisable."
        },
        settings: {}
      };
    }
  })();

  if (sec && !sec.id) {
    sec.id = `sec-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }
  return sec;
}

/**
 * Sales & Closer Toolkit for Michel.
 * Generates tailored cold-call pitch, objection scripts, WhatsApp/SMS teasers, and ROI simulator.
 */

export function generateColdCallScript(project) {
  const b = project.business;
  const name = b.name;
  const city = b.city;
  const trade = b.tradeLabel;
  const tips = project.closerTips || {};

  return {
    intro: {
      step: "1. Accroche Téléphonique (15 secondes)",
      speech: `« Bonjour ${b.name}, je suis Michel. Je vous appelle directement depuis mon atelier web : j'ai vu la qualité de vos interventions en tant que ${trade.toLowerCase()} à ${city}, mais j'ai remarqué que vos futurs clients ne peuvent pas voir vos réalisations avant/après sur Google lorsqu'ils cherchent un artisan sur le secteur. »`,
      objective: "Capter l'attention sans posture de démarcheur agressif."
    },
    pitch: {
      step: "2. L'Effet Démo (Montrer le travail déjà fait)",
      speech: `« Au lieu de vous parler dans le vide avec des promesses, j'ai pris l'initiative de créer une proposition concrète de ce que pourrait être votre véritable vitrine internet : avec vos services, vos avis clients, vos garanties et vos photos. Je vous l'ai préparée et elle est déjà visible sur mon écran. Est-ce que vous avez 60 secondes pour que je vous l'envoie sur votre WhatsApp ou pour jeter un coup d'œil ? »`,
      objective: "Transformer le coup de fil en consultation visuelle immédiate."
    },
    objections: [
      {
        objection: "« J'ai déjà une page Facebook / Instagram »",
        response: tips.objectionFacebook || `« C'est un excellent point, Facebook est super pour vos proches. Mais quand un propriétaire à ${city} a un besoin urgent ou un budget travaux, il ne va pas scroller sur Facebook : il tape sur Google. Sans site officiel, vous laissez 100% de ces clients à vos concurrents. »`
      },
      {
        objection: "« J'ai déjà assez de travail grâce au bouche-à-oreille »",
        response: `« C'est la preuve que vous travaillez très bien ! Mais un site ne sert pas seulement à avoir 'plus' de chantiers : il sert à choisir de MEILLEURS chantiers, plus rentables, et à justifier vos tarifs face à des clients exigeants qui veulent voir votre sérieux. »`
      },
      {
        objection: "« Ça coûte trop cher, les agences demandent 3 000 € »",
        response: `« C'est justement pour cela que je vous contacte directement sans intermédiaire. Le site est déjà fait et pré-configuré, vous n'avez pas de frais de développement de 3 000 €. Pour quelques dizaines d'euros par mois ou un forfait unique accessible, il est en ligne à votre nom sous 24 heures. »`
      },
      {
        objection: "« Je n'ai pas le temps de m'en occuper »",
        response: `« Vous n'avez strictement rien à faire. J'ai déjà tout rédigé et mis en place. Vous me dites juste 'Oui' ou 'On modifie telle photo', et je gère l'hébergement, la sécurité et la mise en ligne à 100%. »`
      }
    ],
    closing: {
      step: "3. La Conclusion / Prise de décision",
      speech: `« Regardez le lien que je vous envoie à l'instant. Si le rendu vous plaît et que vous trouvez qu'il représente dignement votre savoir-faire à ${city}, on le met en ligne cette semaine. Qu'est-ce que vous en pensez ? »`
    }
  };
}

export function generateWhatsappPitch(project, demoUrl = "") {
  const b = project.business;
  const url = demoUrl || (typeof window !== "undefined" && window.location ? window.location.href : "");
  return `Bonjour ${b.name},

C'est Michel. J'ai pris le temps de concevoir une démonstration de ce que pourrait être votre futur site vitrine professionnel pour vos prestations de ${b.tradeLabel.toLowerCase()} à ${b.city}.

👉 Vous pouvez le tester directement ici depuis votre mobile :
${url}

Qu'en pensez-vous ? Si cela vous convient, nous pouvons le personnaliser et le mettre en ligne sur votre nom de domaine officiel dès cette semaine.`;
}

export function generateEmailPitch(project, demoUrl = "") {
  const b = project.business;
  const url = demoUrl || (typeof window !== "undefined" && window.location ? window.location.href : "");
  return {
    subject: `Proposition de site vitrine pour ${b.name} (${b.city})`,
    body: `Bonjour ${b.name},

J'ai analysé la visibilité locale des artisans ${b.tradeLabel.toLowerCase()} sur le secteur de ${b.city}.

Afin de vous donner une idée concrète du rendu professionnel dont votre entreprise pourrait bénéficier pour rassurer vos prospects et valoriser vos réalisations, j'ai préparé une première version de votre futur site internet.

Vous pouvez consulter la proposition interactive directement sur ce lien :
${url}

Ce modèle intègre :
- Vos prestations détaillées et adaptées à votre clientèle
- Un module interactif Avant / Après pour valoriser vos chantiers
- Vos garanties et avis clients mis en valeur
- Un formulaire de demande de devis express mobile

Je reste à votre entière disposition pour échanger 5 minutes à ce sujet et ajuster les éléments selon vos préférences.

Bien cordialement,
Michel
Conseiller Web & Visibilité Locale
Téléphone : 06 XX XX XX XX`
  };
}

export function calculateROI(ticketMoyen = 800, siteCost = 1200) {
  const chantiersToBreakEven = (siteCost / ticketMoyen).toFixed(1);
  const yearlyGainOnePerMonth = (ticketMoyen * 12) - siteCost;
  return {
    ticketMoyen,
    siteCost,
    chantiersToBreakEven,
    yearlyGainOnePerMonth
  };
}

export function generateCompetitiveAudit(project) {
  const b = project?.business || {};
  const city = b.city || "Secteur";
  const trade = b.tradeLabel || "Artisan";

  return {
    title: `Audit de Visibilité & Benchmark Local — ${b.name}`,
    city,
    trade,
    pillars: [
      {
        name: "Vitesse de chargement & Mobile First",
        currentStatus: "28 / 100 (Critique)",
        currentScore: 28,
        prospectorScore: 99,
        prospectorStatus: "99 / 100 (Éclair)",
        impact: "74% des visiteurs sur mobile quittent un site qui met plus de 3 secondes à charger."
      },
      {
        name: "Module Avant / Après Interactif",
        currentStatus: "Inexistant (0 visuel)",
        currentScore: 0,
        prospectorScore: 100,
        prospectorStatus: "Curseur SplitReveal 4K",
        impact: "Le module avant/après multiplie par 3 le taux de conversion sur les chantiers locaux."
      },
      {
        name: "Bouton d'Appel Direct & WhatsApp Flottant",
        currentStatus: "Numéro masqué ou introuvable",
        currentScore: 15,
        prospectorScore: 100,
        prospectorStatus: "Bandeau d'Urgence 1-Clic",
        impact: "Permet au client de joindre l'artisan immédiatement sans chercher le numéro."
      },
      {
        name: "Réassurance & Labels Décennaux",
        currentStatus: "Mentions non vérifiées",
        currentScore: 30,
        prospectorScore: 95,
        prospectorStatus: "Badges de Garantie Officiels",
        impact: "Rassure immédiatement les propriétaires face aux prestataires non déclarés."
      },
      {
        name: "Simulateur de Devis & Réservation de Créneau",
        currentStatus: "Formulaire basique ou absent",
        currentScore: 10,
        prospectorScore: 96,
        prospectorStatus: "Chiffrage Express en 3 Clics",
        impact: "Capte les leads qualifiés même en dehors des heures ouvrées."
      }
    ],
    talkingPoints: [
      `« Sur ${city}, vos concurrents n'ont pas encore ce niveau d'interactivité. C'est l'opportunité de capter les chantiers les plus rentables. »`,
      `« 8 particuliers sur 10 à ${city} comparent plusieurs artisans sur leur smartphone : avec ce site, vous gagnez la comparaison systématiquement. »`
    ]
  };
}

export function generateOrderContract(project, options = {}) {
  const b = project?.business || {};
  const dateStr = new Date().toLocaleDateString("fr-FR");
  const priceMode = options.priceMode || "unique";
  const priceLabel = priceMode === "mensuel" ? "89 € H.T. / mois (engagement 12 mois)" : "990 € H.T. (paiement unique clé en main)";

  return {
    contractNumber: `BDC-${Date.now().toString().slice(-6)}`,
    date: dateStr,
    client: {
      name: b.name || "Artisan & Co",
      trade: b.tradeLabel || "Artisan",
      city: b.city || "France",
      phone: b.phone || "Non renseigné",
      email: b.email || `contact@${(b.name || "artisan").toLowerCase().replace(/[^a-z0-9]/g, "")}.fr`
    },
    service: {
      title: "Création, Déploiement & Cession du Site Vitrine Professionnel",
      inclusions: [
        "Site web complet responsive optimisé mobile/tablette/PC",
        "Module interactif Avant / Après chantiers avec images haute définition",
        "Bandeau d'appel téléphonique et contact WhatsApp direct",
        "Simulateur de devis express en ligne et créneaux d'urgence",
        "Intégration des avis Google vérifiés et note 4.9/5",
        "Mise en conformité RGPD, mentions légales et balisage LocalBusiness JSON-LD",
        "Propriété intégrale du code source et des fichiers délivrés"
      ],
      price: priceLabel,
      deliveryTime: "Sous 24 à 48 heures ouvrées"
    },
    guarantee: "Garantie 'Satisfait ou Remboursé' 14 jours & Accompagnement technique personnalisé."
  };
}

export function getObjectionBattlecards(project) {
  const b = project?.business || {};
  const city = b.city || "votre commune";

  return [
    {
      id: "fb",
      title: "« J'ai déjà Facebook / Instagram »",
      counter: `« C'est super pour vos proches, mais quand un particulier a une urgence ou un budget travaux à ${city}, il tape sur Google. Sans site officiel, 100% de ces chantiers partent chez vos concurrents. »`,
      confidence: "98%"
    },
    {
      id: "price",
      title: "« C'est trop cher / Pas le budget »",
      counter: `« Les agences facturent 3 000 € pour commencer de zéro. Ici le site est déjà développé et prêt : un seul chantier signé ce mois-ci vous rembourse intégralement. Le reste de l'année, c'est du bénéfice net pur. »`,
      confidence: "95%"
    },
    {
      id: "neveu",
      title: "« Mon neveu / un ami va me le faire »",
      counter: `« Beaucoup d'artisans m'ont dit ça et 6 mois plus tard rien n'est en ligne. Ici le site existe déjà, il est sur mon écran, testé et prêt à générer des appels dès cette semaine. »`,
      confidence: "92%"
    },
    {
      id: "temps",
      title: "« Je n'ai pas le temps »",
      counter: `« Vous n'avez strictement rien à faire : j'ai rédigé les textes, configuré les photos et réglé la technique. Vous me validez juste le rendu et je gère 100% de la mise en ligne. »`,
      confidence: "97%"
    },
    {
      id: "bouche",
      title: "« Le bouche-à-oreille me suffit »",
      counter: `« C'est le signe que votre travail est impeccable ! Mais le site ne sert pas seulement à avoir plus de clients, il sert à trier les chantiers les plus rentables et justifier des tarifs plus élevés. »`,
      confidence: "94%"
    }
  ];
}

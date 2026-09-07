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

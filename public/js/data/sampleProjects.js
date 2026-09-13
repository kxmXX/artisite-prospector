import { generateSite, generateDemoSite } from "../engine/generator.js";

export const SAMPLE_PROJECTS = [
  generateDemoSite({
    id: "proj-esprit-nature",
    name: "Esprit Nature",
    tradeId: "paysagiste",
    city: "Montauban",
    region: "Occitanie",
    phone: "07 70 10 29 71",
    email: "contact@esprit-nature82.fr",
    address: "Route de Paris, 82000 Montauban",
    openingHours: {
      lundi: "9h - 12h / 14h - 18h",
      mardi: "9h - 12h / 14h - 18h",
      mercredi: "9h - 12h / 14h - 18h",
      jeudi: "9h - 12h / 14h - 18h",
      vendredi: "9h - 12h / 14h - 18h",
      samedi: "9h - 12h / 14h - 18h",
      dimanche: "Fermé"
    },
    presetId: "nature-premium",
    pipelineStatus: "demo_sent",
    createdAt: "2026-09-01T10:15:00.000Z"
  }),
  generateSite({
    id: "proj-dupont-plomberie",
    name: "Dupont Plomberie Chauffage",
    tradeId: "plombier",
    city: "Toulouse",
    region: "Occitanie",
    phone: "06 41 85 92 10",
    email: "contact@dupont-plomberie31.fr",
    address: "Avenue des États-Unis, 31200 Toulouse",
    presetId: "artisan-moderne",
    pipelineStatus: "contacted",
    createdAt: "2026-09-02T14:30:00.000Z"
  }),
  generateSite({
    id: "proj-toitures-sud",
    name: "Toitures du Sud & Zinguerie",
    tradeId: "couvreur",
    city: "Albi",
    region: "Tarn",
    phone: "07 53 19 60 44",
    email: "contact@toitures-du-sud81.fr",
    address: "Chemin de Pratgraussals, 81000 Albi",
    presetId: "batiment-solide",
    pipelineStatus: "generated",
    createdAt: "2026-09-03T09:00:00.000Z"
  }),
  generateSite({
    id: "proj-atelier-gourmand",
    name: "L'Atelier Gourmand",
    tradeId: "restaurant",
    city: "Bordeaux",
    region: "Nouvelle-Aquitaine",
    phone: "05 56 48 12 90",
    email: "reservation@atelier-gourmand-bdx.fr",
    address: "Place du Parlement, 33000 Bordeaux",
    presetId: "local-chaleureux",
    pipelineStatus: "won",
    createdAt: "2026-09-04T16:45:00.000Z"
  })
];

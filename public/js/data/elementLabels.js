/**
 * Noms lisibles des elements d'une section.
 *
 * Partages par le panneau de proprietes et par l'arbre de la structure : les deux
 * doivent nommer le meme element de la meme facon, sinon l'auteur doute de ce qu'il
 * est en train de regler.
 */

export const ELEMENT_LABELS = {
  title: "Titre", subtitle: "Sous-titre", description: "Description", text: "Texte",
  badge: "Badge", cta: "Bouton", ctaLabel: "Libellé du bouton", ctaText: "Texte du bouton",
  ctaPrimary: "Bouton principal", ctaSecondary: "Bouton secondaire", image: "Image",
  image2: "Image secondaire", heroImage: "Image principale", logo: "Logo",
  price: "Prix", priceText: "Texte du prix", label: "Libellé", name: "Nom", role: "Rôle",
  brandName: "Nom de marque", phone: "Téléphone", trustNote: "Mention de confiance",
  primary: "Bouton principal",
  currentBookings: "Réservations actuelles", targetBookings: "Objectif de réservations",
  tag: "Étiquette", desc: "Description courte", link: "Lien", blockType: "Type de bloc"
};

export const ELEMENT_KIND_LABELS = { image: "Image", button: "Bouton", text: "Texte" };

export function elementLabelFor(field, kind) {
  const last = String(field || "").split(".").pop() || "";
  if (ELEMENT_LABELS[last]) return ELEMENT_LABELS[last];
  if (last) return last.replace(/[_-]+/g, " ");
  return ELEMENT_KIND_LABELS[kind] || "Element";
}

/**
 * Numerote les libelles en collision.
 * Dans une section a listes, plusieurs elements partagent le meme nom de champ :
 * sans numero, la liste afficherait quatre fois « Titre ».
 */
export function numberedLabels(elements) {
  const labels = (elements || []).map((element) => elementLabelFor(element.field, element.kind));
  const counts = labels.reduce((acc, label) => { acc[label] = (acc[label] || 0) + 1; return acc; }, {});
  const seen = {};
  return labels.map((label) => {
    if (counts[label] < 2) return label;
    seen[label] = (seen[label] || 0) + 1;
    return label + " " + seen[label];
  });
}

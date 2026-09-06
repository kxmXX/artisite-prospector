import { getStylePresetById } from "../data/styles.js";

/**
 * Intelligent AI Copilot for Michel to tweak the site using natural language requests.
 */
export function processCopilotPrompt(project, promptText) {
  if (!promptText || !promptText.trim()) return { project, message: "Aucune instruction reçue." };
  
  const text = promptText.toLowerCase().trim();
  // Deep clone project
  const updated = JSON.parse(JSON.stringify(project));
  const logs = [];

  // 1. Phone number update
  const phoneMatch = promptText.match(/(?:0|\+33)[1-9](?:[\s.-]?[0-9]{2}){4}/);
  if (phoneMatch) {
    const newPhone = phoneMatch[0];
    updated.business.phone = newPhone;
    updated.sections.forEach(sec => {
      if (sec.content && sec.content.phone) sec.content.phone = newPhone;
      if (sec.content && sec.content.ctaSecondary && sec.content.ctaSecondary.includes("0")) {
        sec.content.ctaSecondary = `Appeler : ${newPhone}`;
      }
    });
    logs.push(`Numéro de téléphone mis à jour : ${newPhone}`);
  }

  // 2. Color / style changes
  if (text.includes("sombre") || text.includes("noir") || text.includes("luxe") || text.includes("dark")) {
    const preset = getStylePresetById("luxe-sombre");
    applyPreset(updated, preset);
    logs.push("Style mis à jour : Luxe & Sombre Ébène");
  } else if (text.includes("vert") || text.includes("nature") || text.includes("écologique") || text.includes("bio")) {
    const preset = getStylePresetById("nature-premium");
    applyPreset(updated, preset);
    logs.push("Style mis à jour : Nature & Organique");
  } else if (text.includes("bleu") || text.includes("moderne") || text.includes("robuste") || text.includes("technique")) {
    const preset = getStylePresetById("artisan-moderne");
    applyPreset(updated, preset);
    logs.push("Style mis à jour : Artisan Moderne & Robuste");
  } else if (text.includes("chaleureux") || text.includes("terroir") || text.includes("bois") || text.includes("bistrot")) {
    const preset = getStylePresetById("local-chaleureux");
    applyPreset(updated, preset);
    logs.push("Style mis à jour : Local & Chaleureux Terroir");
  } else if (text.includes("épuré") || text.includes("blanc") || text.includes("minimal") || text.includes("clair")) {
    const preset = getStylePresetById("minimal-epure");
    applyPreset(updated, preset);
    logs.push("Style mis à jour : Élégance & Épuré Studio");
  }

  // 3. Radius / border styles
  if (text.includes("arrondi") || text.includes("pilule") || text.includes("rond")) {
    updated.branding.borderRadius = "1.25rem";
    updated.branding.buttonRadius = "9999px";
    logs.push("Boutons et cartes configurés en style très arrondi");
  } else if (text.includes("carré") || text.includes("droit") || text.includes("rectangulaire")) {
    updated.branding.borderRadius = "0.25rem";
    updated.branding.buttonRadius = "0.25rem";
    logs.push("Angles et boutons configurés en style net et rectangulaire");
  }

  // 4. Urgency emphasis
  if (text.includes("urgence") || text.includes("24/7") || text.includes("nuit") || text.includes("rapide")) {
    const hero = updated.sections.find(s => s.type === "hero");
    if (hero) {
      hero.content.badge = `🚨 INTERVENTIONS D'URGENCE 7J/7 • ${updated.business.city}`;
      hero.content.ctaPrimary = `Urgence 24h/24 : ${updated.business.phone}`;
      logs.push("Accentuation de la réactivité d'urgence 24/7 appliquée sur le Hero");
    }
  }

  // 5. Tax credit / aides emphasis
  if (text.includes("impôt") || text.includes("crédit") || text.includes("aide") || text.includes("50%")) {
    const trust = updated.sections.find(s => s.type === "trust");
    if (trust && trust.content.badges) {
      trust.content.badges[0] = {
        title: "Crédit d'Impôt 50% Immédiat",
        desc: "Avance immédiate déductible sur facture"
      };
      logs.push("Mise en avant renforcée du crédit d'impôt 50%");
    }
  }

  // 6. Toggle sections
  if (text.includes("supprime") || text.includes("masque") || text.includes("retire") || text.includes("enlève")) {
    if (text.includes("avant/après") || text.includes("avant apres")) {
      const sec = updated.sections.find(s => s.type === "beforeAfter");
      if (sec) { sec.visibility = false; logs.push("Section Avant/Après masquée"); }
    } else if (text.includes("galerie") || text.includes("photo")) {
      const sec = updated.sections.find(s => s.type === "gallery");
      if (sec) { sec.visibility = false; logs.push("Galerie photos masquée"); }
    } else if (text.includes("avis") || text.includes("témoignage")) {
      const sec = updated.sections.find(s => s.type === "reviews");
      if (sec) { sec.visibility = false; logs.push("Section Avis masquée"); }
    } else if (text.includes("faq")) {
      const sec = updated.sections.find(s => s.type === "faq");
      if (sec) { sec.visibility = false; logs.push("Section FAQ masquée"); }
    }
  }

  if (text.includes("active") || text.includes("affiche") || text.includes("remets") || text.includes("montre")) {
    if (text.includes("avant/après") || text.includes("avant apres")) {
      const sec = updated.sections.find(s => s.type === "beforeAfter");
      if (sec) { sec.visibility = true; logs.push("Section Avant/Après réactivée"); }
    }
  }

  // Default fallback if no specific rule matched
  if (logs.length === 0) {
    // Modify hero title or subtitle to reflect instruction
    const hero = updated.sections.find(s => s.type === "hero");
    if (hero) {
      hero.content.subtitle = `${hero.content.subtitle} (${promptText.trim()})`;
      logs.push(`Adaptation éditoriale du Hero selon la demande : "${promptText}"`);
    }
  }

  updated.updatedAt = new Date().toISOString();
  return {
    project: updated,
    message: logs.join(" • ")
  };
}

function applyPreset(project, preset) {
  project.branding.presetId = preset.id;
  project.branding.presetName = preset.name;
  project.branding.primaryColor = preset.primaryColor;
  project.branding.secondaryColor = preset.secondaryColor;
  project.branding.accentColor = preset.accentColor;
  project.branding.bgColor = preset.bgColor;
  project.branding.bgSecondary = preset.bgSecondary;
  project.branding.textColor = preset.textColor;
  project.branding.textMuted = preset.textMuted;
  project.branding.headingFont = preset.headingFont;
  project.branding.bodyFont = preset.bodyFont;
  project.branding.borderRadius = preset.borderRadius;
  project.branding.buttonRadius = preset.buttonRadius;
  project.branding.cardStyle = preset.cardStyle;
}

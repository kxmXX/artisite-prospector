/**
 * Gemini AI Integration with Dynamic Multi-Model Fallback Chain.
 * Handles generation and copilot tweaks with graceful degradation.
 */

export const DEFAULT_FALLBACK_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite"
];

// Modeles capables de produire une image (Nano Banana / Imagen). Un modele texte
// ne peut PAS generer d'image : c'etait l'erreur d'origine de /api/ai/image.
export const DEFAULT_IMAGE_MODELS = [
  "gemini-3.1-flash-image",
  "gemini-2.5-flash-image",
  "gemini-3-pro-image"
];

// Google renvoie 503 « forte demande » sur les modeles recents : sans reessai,
// toute la chaine echoue et l'application retombait en silence sur le moteur local.
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 2;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options) {
  let lastResponse = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (!RETRYABLE_STATUS.has(response.status) || attempt === MAX_RETRIES) return response;
      lastResponse = response;
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error;
    }
    await sleep(400 * Math.pow(2, attempt) + Math.floor(Math.random() * 200));
  }
  return lastResponse;
}

export function getFallbackModels() {
  if (process.env.GEMINI_MODELS) {
    const list = process.env.GEMINI_MODELS.split(",")
      .map(m => m.trim())
      .filter(Boolean);
    if (list.length > 0) return list;
  }
  return DEFAULT_FALLBACK_MODELS;
}

export function getImageModels() {
  if (process.env.GEMINI_IMAGE_MODELS) {
    const list = process.env.GEMINI_IMAGE_MODELS.split(",")
      .map(m => m.trim())
      .filter(Boolean);
    if (list.length > 0) return list;
  }
  return DEFAULT_IMAGE_MODELS;
}

export async function callGeminiWithFallback({ prompt, systemInstruction = "", jsonOutput = true, apiKey = process.env.GEMINI_API_KEY }) {
  if (!apiKey) {
    return {
      success: false,
      error: "NO_API_KEY",
      message: "GEMINI_API_KEY is not configured in environment variables."
    };
  }

  const models = getFallbackModels();
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: jsonOutput ? "application/json" : "text/plain"
        }
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      const res = await fetchWithRetry(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`⚠️ [Gemini Fallback] Model ${model} returned ${res.status}: ${errorText.slice(0, 150)} — Switching to next fallback model...`);
        lastError = `Status ${res.status}: ${errorText}`;
        continue; // Try next model
      }

      const result = await res.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        console.warn(`⚠️ [Gemini Fallback] Model ${model} returned empty response — Switching to next fallback model...`);
        lastError = "Empty response";
        continue;
      }

      let parsedData = rawText;
      if (jsonOutput) {
        try {
          parsedData = JSON.parse(rawText);
        } catch (jsonErr) {
          // Sometimes models wrap json in markdown code fences
          const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
          parsedData = JSON.parse(cleaned);
        }
      }

      return {
        success: true,
        modelUsed: model,
        data: parsedData
      };
    } catch (err) {
      console.warn(`⚠️ [Gemini Fallback] Network/runtime error with ${model}: ${err.message} — Switching to next fallback model...`);
      lastError = err.message;
    }
  }

  return {
    success: false,
    error: "ALL_MODELS_FAILED",
    lastError
  };
}

/**
 * High-level AI Website Enrichment Generator
 */
export async function enrichSiteWithAI(input = {}) {
  const { name, trade, city, phone, region } = input;
  const prompt = `
Tu es un directeur de création web et copywriter d'élite spécialisé dans les sites vitrines haut de gamme pour artisans locaux en France.
Génère les contenus ultra-personnalisés et percutants pour l'entreprise suivante :
- Nom : "${name || "Artisan & Co"}"
- Métier : "${trade || "Paysagiste"}"
- Ville : "${city || "Montauban"}"
- Téléphone : "${phone || "07 XX XX XX XX"}"
- Région : "${region || "Occitanie"}"

RÈGLES STRICTES :
1. Pas de charabia IA générique comme "nous sommes une entreprise dynamique". Sois authentique, ancré localement à ${city}.
2. Ne JAMAIS inventer de fausses certifications ni de faux chiffres factuels présentés comme réels. Utilise des réassurances valables (devis gratuit 24h, garantie décennale, réactivité, écoute).
3. Renvoie UNIQUEMENT un objet JSON valide avec cette structure exacte :
{
  "heroTitle": "Titre fort valorisant le métier et la commune",
  "heroSubtitle": "Sous-titre commercial percutant avec appel à l'action",
  "ctaPrimary": "Demander mon devis gratuit",
  "ctaSecondary": "Appeler l'artisan",
  "aboutTitle": "Titre authentique sur le savoir-faire",
  "aboutStory": "Histoire d'artisan passionné ancré à ${city} (2-3 phrases chaleureuses)",
  "aboutOwner": "Prénom du dirigeant & équipe",
  "aboutRole": "Artisan passionné",
  "services": [
    { "title": "Service 1 précis", "desc": "Courte description concrète", "tag": "Spécialité", "price": "Sur devis gratuit" },
    { "title": "Service 2 précis", "desc": "Courte description concrète", "tag": "Intervention", "price": "Sur devis gratuit" },
    { "title": "Service 3 précis", "desc": "Courte description concrète", "tag": "Sur-mesure", "price": "Sur devis gratuit" },
    { "title": "Service 4 précis", "desc": "Courte description concrète", "tag": "Entretien", "price": "Sur devis gratuit" },
    { "title": "Service 5 précis", "desc": "Courte description concrète", "tag": "Rénovation", "price": "Sur devis gratuit" },
    { "title": "Service 6 précis", "desc": "Courte description concrète", "tag": "Conseil", "price": "Sur devis gratuit" }
  ],
  "trustBadges": [
    { "title": "Devis Gratuit sous 24h", "desc": "Déplacement et étude personnalisée offerts" },
    { "title": "Garantie Décennale & Assurance", "desc": "Travaux couverts et réalisés dans les règles de l'art" },
    { "title": "Artisan Local de Proximité", "desc": "Intervention soignée à ${city} et ses alentours" },
    { "title": "Matériel Professionnel", "desc": "Équipements récents et finitions impeccables" }
  ],
  "reviews": [
    { "author": "Sophie M.", "city": "${city}", "rating": 5, "text": "Très satisfait des travaux réalisés. Ponctuel, soigné et de bon conseil !" },
    { "author": "Jean-Pierre D.", "city": "${city}", "rating": 5, "text": "Artisan sérieux, devis clair et respecté au centime près. Je recommande." },
    { "author": "Marc L.", "city": "Alentours de ${city}", "rating": 5, "text": "Réactivité exemplaire et chantier laissé parfaitement propre." }
  ],
  "faq": [
    { "q": "Quels sont vos délais pour établir un devis à ${city} ?", "a": "Nous nous déplaçons rapidement et vous remettons un devis détaillé et gratuit sous 24 à 48 heures." },
    { "q": "Vos déplacements sont-ils gratuits ?", "a": "Oui, tous les déplacements pour l'évaluation de vos chantiers sur le secteur de ${city} sont entièrement gratuits." },
    { "q": "Vos travaux sont-ils garantis ?", "a": "Absolument, toutes nos interventions sont couvertes par notre garantie décennale et notre responsabilité civile professionnelle." }
  ],
  "closerTips": {
    "hook": "Bonjour, j'ai remarqué la qualité de votre travail sur ${city} et j'ai préparé une proposition concrète de votre futur site pour attirer plus de chantiers rentables.",
    "objectionFacebook": "Une page Facebook est utile pour vos proches, mais les propriétaires à ${city} avec budget travaux cherchent sur Google."
  }
}
`;

  return callGeminiWithFallback({
    prompt,
    systemInstruction: "Tu es un copywriter web d'élite. Tu réponds exclusivement en JSON strict valide sans fioritures.",
    jsonOutput: true
  });
}

/**
 * Generation d'image via un modele image de Gemini (Nano Banana / Imagen).
 * Renvoie une data URL exploitable directement par le rendu.
 */
export async function generateImageWithGemini({ prompt, apiKey = process.env.GEMINI_API_KEY }) {
  if (!apiKey) {
    return { success: false, error: "NO_API_KEY", message: "GEMINI_API_KEY is not configured in environment variables." };
  }
  const models = getImageModels();
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetchWithRetry(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE"] }
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`⚠️ [Gemini Image] Model ${model} returned ${res.status}: ${errorText.slice(0, 150)} — Switching to next fallback model...`);
        lastError = `Status ${res.status}: ${errorText}`;
        continue;
      }

      const result = await res.json();
      const parts = result.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((part) => part.inlineData || part.inline_data);
      const inline = imagePart && (imagePart.inlineData || imagePart.inline_data);
      if (!inline || !inline.data) {
        console.warn(`⚠️ [Gemini Image] Model ${model} returned no image part — Switching to next fallback model...`);
        lastError = "No image part in response";
        continue;
      }
      const mimeType = inline.mimeType || inline.mime_type || "image/png";
      return { success: true, modelUsed: model, dataUrl: `data:${mimeType};base64,${inline.data}` };
    } catch (err) {
      console.warn(`⚠️ [Gemini Image] Network/runtime error with ${model}: ${err.message} — Switching to next fallback model...`);
      lastError = err.message;
    }
  }

  return { success: false, error: "ALL_IMAGE_MODELS_FAILED", lastError };
}

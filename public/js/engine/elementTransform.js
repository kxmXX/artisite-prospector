/**
 * Position et taille d'un element, en nombres.
 *
 * Le rendu lit `project.freeformLayout[viewport][layoutKey]` (voir
 * `freeformDeclarations` dans renderer.js). Ce module est le seul acces a ces
 * valeurs pour l'interface : lire, poser une valeur, tout retirer.
 *
 * Rien n'est ecrit tant que l'auteur ne saisit pas de valeur : un element sans
 * entree reste dans le flux normal. C'est la regle « flux par defaut, position
 * libre en option » — la position libre ne s'active jamais toute seule.
 */

export const TRANSFORM_FIELDS = Object.freeze([
  { key: "x", label: "X", unit: "px", step: 1, min: null, max: null, description: "Decalage horizontal." },
  { key: "y", label: "Y", unit: "px", step: 1, min: null, max: null, description: "Decalage vertical." },
  { key: "width", label: "Largeur", unit: "px", step: 1, min: 1, max: null, description: "Largeur imposee." },
  { key: "height", label: "Hauteur", unit: "px", step: 1, min: 1, max: null, description: "Hauteur imposee." },
  { key: "rotation", label: "Rotation", unit: "\u00b0", step: 1, min: -180, max: 180, description: "Rotation en degres." }
]);

export function transformViewport(viewport) {
  const value = String(viewport || "");
  return ["desktop", "tablet", "mobile"].includes(value) ? value : "desktop";
}

function layoutFor(project, layoutKey, viewport) {
  if (!layoutKey) return null;
  return project?.freeformLayout?.[transformViewport(viewport)]?.[layoutKey] || null;
}

/** Valeurs saisissables. `null` signifie « non regle » : on n'invente pas un zero. */
export function getElementTransform(project, layoutKey, viewport = "desktop") {
  const layout = layoutFor(project, layoutKey, viewport) || {};
  const values = {};
  for (const field of TRANSFORM_FIELDS) {
    const raw = Number(layout[field.key]);
    values[field.key] = Number.isFinite(raw) ? raw : null;
  }
  return values;
}

export function hasElementTransform(project, layoutKey, viewport = "desktop") {
  return Object.values(getElementTransform(project, layoutKey, viewport)).some((value) => value !== null);
}

/** Hors bornes ramene dans les bornes ; saisie vide retire le champ. */
export function normalizeTransformValue(fieldKey, value) {
  const field = TRANSFORM_FIELDS.find((candidate) => candidate.key === fieldKey);
  if (!field) return null;
  if (value === "" || value === null || value === undefined) return null;
  const numeric = Number(String(value).replace(",", "."));
  if (!Number.isFinite(numeric)) return null;
  let next = Math.round(numeric * 100) / 100;
  if (field.min !== null && next < field.min) next = field.min;
  if (field.max !== null && next > field.max) next = field.max;
  return next;
}

/** Copie du projet avec la valeur posee. Ne mute jamais l'entree recue. */
export function setElementTransform(project, layoutKey, viewport, fieldKey, value) {
  if (!project || !layoutKey) return project;
  const view = transformViewport(viewport);
  const next = JSON.parse(JSON.stringify(project));
  next.freeformLayout = next.freeformLayout || {};
  next.freeformLayout[view] = next.freeformLayout[view] || {};
  const current = next.freeformLayout[view][layoutKey] || {};
  const normalized = normalizeTransformValue(fieldKey, value);
  if (normalized === null) delete current[fieldKey];
  else current[fieldKey] = normalized;
  const stillUsed = TRANSFORM_FIELDS.some((field) => Number.isFinite(Number(current[field.key])))
    || (typeof current.parentSectionId === "string" && current.parentSectionId.trim());
  if (stillUsed) next.freeformLayout[view][layoutKey] = current;
  else delete next.freeformLayout[view][layoutKey];
  return next;
}

/** Revenir au flux : toute la position libre de cet element est retiree. */
export function clearElementTransform(project, layoutKey, viewport) {
  if (!project || !layoutKey) return project;
  const view = transformViewport(viewport);
  const next = JSON.parse(JSON.stringify(project));
  const entries = next.freeformLayout?.[view];
  if (entries && entries[layoutKey]) delete entries[layoutKey];
  return next;
}

export function escapeHtml(value) {
  if (value === null || value === undefined || value === false) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function sanitizeUrl(value, { allowDataImage = false, fallback = "#" } = {}) {
  const url = String(value || "").trim();
  if (!url) return fallback;
  if (url.startsWith("#") || url.startsWith("/") || url.startsWith("./") || url.startsWith("../")) return url;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(url) && !url.startsWith("//") && !url.includes("\\")) return url;
  if (/^(https?:|mailto:|tel:|sms:)/i.test(url)) return url;
  if (allowDataImage && /^data:image\/(?:png|jpe?g|gif|webp|avif|svg\+xml);/i.test(url)) return url;
  return fallback;
}

export function safeCssColor(value, fallback) {
  const color = String(value || "").trim();
  return /^(?:#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%]+\))$/i.test(color) ? color : fallback;
}

export function safeCssLength(value, fallback) {
  const length = String(value || "").trim();
  return /^\d+(?:\.\d+)?(?:px|rem|em|%)$/i.test(length) ? length : fallback;
}

export function safeFontFamily(value, fallback) {
  const family = String(value || "").replace(/[^\p{L}\p{N} _-]/gu, "").trim();
  return family || fallback;
}

export function serializeForInlineScript(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

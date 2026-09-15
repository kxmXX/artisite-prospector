/**
 * Appel HTTP unique vers l'API du produit.
 *
 * Toutes les requêtes sont same-origin (le cookie de session n'est jamais exposé au
 * JavaScript) et renvoient le JSON décodé. Toute réponse non 2xx lève une ApiError
 * porteuse du message serveur, pour que l'interface n'ait jamais à interpréter un
 * code HTTP elle-même.
 */
export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function apiFetch(pathname, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    signal,
    timeoutMs = 15000,
    fetchImpl = globalThis.fetch
  } = options;

  const init = { method, credentials: "same-origin", headers: Object.assign({}, headers) };
  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  if (signal) init.signal = signal;

  let timer = null;
  if (!signal && timeoutMs > 0) {
    init.signal = AbortSignal.timeout(timeoutMs);
  }

  let response;
  try {
    response = await fetchImpl(pathname, init);
  } catch (error) {
    if (timer) clearTimeout(timer);
    const message = error && error.name === "TimeoutError"
      ? "Le serveur n'a pas répondu à temps."
      : "Serveur injoignable. Vérifiez votre connexion.";
    throw new ApiError(message, 0, null);
  }
  if (timer) clearTimeout(timer);

  let payload = null;
  const text = await response.text();
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = null; }
  }

  if (!response.ok) {
    const message = (payload && payload.error) || ("Erreur " + response.status);
    throw new ApiError(message, response.status, payload);
  }
  return payload;
}

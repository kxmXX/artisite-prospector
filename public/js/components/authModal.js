import { getIcon } from "./icons.js";

/**
 * Connexion / création de compte. Volontairement simple : deux champs, un onglet,
 * aucun jargon. Le message d'erreur vient toujours du serveur.
 */
export function renderAuthModal(state = {}) {
  if (state.activeDrawer !== "auth") return "";
  const tab = state.authTab === "register" ? "register" : "login";
  const busy = state.authBusy ? "disabled" : "";
  const error = state.authError || "";
  const notice = state.authNotice || "";
  const unavailable = state.authStatus === "unavailable";

  return '<div class="studio-system-modal fixed inset-0 z-50 flex items-center justify-center p-4" id="auth-modal" onclick="if(event.target === this) window.app.closeAuthModal()">' +
    '<div class="studio-v3-modal w-full max-w-md overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" onclick="event.stopPropagation()">' +
      '<div class="flex items-center justify-between px-6 py-4 border-b border-zinc-200">' +
        '<div>' +
          '<div class="text-ui-xs uppercase tracking-wider text-zinc-500">Compte</div>' +
          '<h2 id="auth-modal-title" class="font-semibold text-sm text-zinc-900">' +
            (tab === "login" ? "Retrouver mes sites" : "Créer un compte") +
          '</h2>' +
        '</div>' +
        '<button type="button" onclick="window.app.closeAuthModal()" aria-label="Fermer">' + getIcon("x", "w-4 h-4") + '</button>' +
      '</div>' +

      (unavailable
        ? '<div class="px-6 py-5 text-xs text-zinc-700 leading-relaxed">' +
            'La connexion est indisponible sur cette version hébergée : son stockage n\'est pas persistant. ' +
            'Vos sites restent enregistrés dans ce navigateur. Utilisez le serveur local pour créer un compte.' +
          '</div>'
        : '<div class="px-6 pt-4">' +
            '<div class="pill-tabs-container mb-3">' +
              '<button type="button" class="pill-tab-btn ' + (tab === "login" ? "is-active" : "") + '" onclick="window.app.switchAuthTab(\'login\')">J\'ai déjà un compte</button>' +
              '<button type="button" class="pill-tab-btn ' + (tab === "register" ? "is-active" : "") + '" onclick="window.app.switchAuthTab(\'register\')">Créer un compte</button>' +
            '</div>' +
            '<form onsubmit="event.preventDefault(); window.app.submitAuth();" class="space-y-3">' +
              '<label class="block">' +
                '<span class="block text-ui-xs text-zinc-500 mb-1">Identifiant</span>' +
                '<input id="auth-username" type="text" autocomplete="username" required minlength="3" maxlength="32"' +
                ' class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-2 text-xs text-zinc-900" placeholder="prenom.nom">' +
              '</label>' +
              '<label class="block">' +
                '<span class="block text-ui-xs text-zinc-500 mb-1">Mot de passe</span>' +
                '<input id="auth-password" type="password" autocomplete="' + (tab === "login" ? "current-password" : "new-password") + '" required minlength="8"' +
                ' class="w-full bg-white border border-zinc-200 rounded-md px-2.5 py-2 text-xs text-zinc-900" placeholder="8 caractères minimum">' +
              '</label>' +
              (error ? '<p class="text-ui-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-2.5 py-2">' + error + '</p>' : '') +
              (notice ? '<p class="text-ui-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-2">' + notice + '</p>' : '') +
              '<button type="submit" class="w-full py-2.5 rounded-lg text-xs font-bold text-white bg-zinc-900" ' + busy + '>' +
                (tab === "login" ? "Se connecter" : "Créer mon compte") +
              '</button>' +
            '</form>' +
            '<p class="mt-3 mb-4 text-ui-2xs text-zinc-500 leading-relaxed">' +
              'Vos sites sont enregistrés sur le serveur : vous les retrouverez depuis n\'importe quel navigateur. ' +
              'Le mot de passe n\'est jamais stocké en clair.' +
            '</p>' +
          '</div>') +
    '</div>' +
  '</div>';
}

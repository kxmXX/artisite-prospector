import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('contre-audit : les invariants de securite du serveur restent en place', () => {
  const accounts = read('server/accounts.js');
  // Mots de passe : jamais en clair, comparison en temps constant.
  assert.match(accounts, /scryptSync/, 'scrypt doit hasher le mot de passe');
  assert.match(accounts, /timingSafeEqual/, 'la comparaison doit etre en temps constant');
  // Sessions : seul le SHA-256 est stocke, le jeton n'est jamais ecrit.
  assert.match(accounts, /tokenHash/, 'la session est referencee par le hash du jeton');
  assert.ok(!/sessions\.push\(\{[^}]*\btoken\s*:/.test(accounts), 'le jeton en clair ne doit jamais etre stocke');
  // Cookie : HttpOnly, SameSite, et Secure des qu'on est en production.
  assert.match(accounts, /HttpOnly/, 'cookie HttpOnly');
  assert.match(accounts, /SameSite=Lax/, 'cookie SameSite');
  assert.match(accounts, /process\.env\.VERCEL/, 'Secure active sur l hebergement');

  const api = read('server/apiHandler.js');
  assert.match(api, /MAX_BODY_BYTES/, 'le corps des requetes doit etre borne');
  assert.match(api, /isAllowedOrigin\(req, origin\)/, "l'origine doit etre verifiee avant toute route API");
  assert.match(api, /RATE_LIMITED_AI_PATHS/, 'les routes IA doivent etre limitees par IP');

  const server = read('server.js');
  assert.match(server, /startsWith\(PUBLIC_DIR \+ path\.sep\)/, 'la traversee de dossier doit etre refusee');
  assert.match(server, /%2f\|%5c/i, 'les separateurs encodes doivent etre refuses');
});

test("contre-audit : aucune revendication multi-utilisateur n'est faite sans verification", () => {
  // Le partage existe (projets prives par proprietaire) mais n'est jamais presente
  // comme une garantie de service multi-utilisateur.
  const html = read('public/index.html');
  assert.ok(!/multi-utilisateur garanti|collaboration temps reel|plusieurs utilisateurs simultanes/i.test(html),
    'aucune promesse de multi-utilisateur');
});

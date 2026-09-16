import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test("le prompt IA n'invente ni avis, ni noms, ni certifications", () => {
  const src = read('server/gemini.js');
  const start = src.indexOf('RÈGLES STRICTES');
  const end = src.indexOf('return callGeminiWithFallback', start);
  assert.ok(start > -1 && end > start, 'le prompt doit être localisable');
  const prompt = src.slice(start, end);

  // Des témoignages nominatifs inventés, avec 5 étoiles, étaient demandés au modèle.
  assert.ok(!/Sophie M\.|Jean-Pierre D\.|Marc L\./.test(prompt), 'aucun avis nominatif inventé');
  // Une certification ne peut pas être affirmée par l'IA : elle vient de l'artisan.
  assert.ok(!/Garantie Décennale & Assurance/.test(prompt), 'aucune certification affirmée');
  assert.ok(!/aboutOwner": "Prénom/.test(prompt), 'aucun nom de dirigeant inventé');
  // Les avis doivent rester vides et la règle doit être explicite.
  assert.ok(prompt.includes('"reviews": []'), 'les avis doivent rester vides');
  assert.match(prompt, /reviews"?\s*doit rester VIDE/i, 'la règle doit être dite en clair');
  // Les réponses de FAQ ne doivent plus affirmer de garantie ou de délai précis.
  assert.ok(!/sous 24 à 48 heures/.test(prompt), 'aucun délai affirmé');
  assert.ok(!/notre garantie décennale/.test(prompt), 'aucune garantie affirmée en FAQ');
});

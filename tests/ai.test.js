import test from "node:test";
import assert from "node:assert/strict";
import { getFallbackModels, callGeminiWithFallback, DEFAULT_FALLBACK_MODELS } from "../server/gemini.js";

test("getFallbackModels returns default models in correct order", () => {
  const models = getFallbackModels();
  assert.ok(Array.isArray(models));
  assert.ok(models.length >= 3);
  assert.equal(models[0], "gemini-2.5-flash");
  assert.equal(models[1], "gemini-2.0-flash");
  assert.equal(models[2], "gemini-1.5-flash");
});

test("getFallbackModels respects custom GEMINI_MODELS environment variable", () => {
  const original = process.env.GEMINI_MODELS;
  try {
    process.env.GEMINI_MODELS = "gemini-3.8-flash, gemini-3.7-flash, gemini-2.5-flash";
    const models = getFallbackModels();
    assert.deepEqual(models, ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-2.5-flash"]);
  } finally {
    if (original !== undefined) {
      process.env.GEMINI_MODELS = original;
    } else {
      delete process.env.GEMINI_MODELS;
    }
  }
});

test("callGeminiWithFallback gracefully fails with NO_API_KEY when no key is supplied", async () => {
  const res = await callGeminiWithFallback({
    prompt: "Test prompt",
    apiKey: ""
  });
  assert.equal(res.success, false);
  assert.equal(res.error, "NO_API_KEY");
});

test("callGeminiWithFallback falls back through all models when key is invalid", async () => {
  // Invalid key will return 400/403 on all models
  const res = await callGeminiWithFallback({
    prompt: "Test prompt",
    apiKey: "AIza_FAKE_KEY_FOR_TESTING_PURPOSES_ONLY_12345"
  });
  assert.equal(res.success, false);
  assert.equal(res.error, "ALL_MODELS_FAILED");
  assert.ok(res.lastError);
});

import test from "node:test";
import assert from "node:assert/strict";
import { getFallbackModels, callGeminiWithFallback, DEFAULT_FALLBACK_MODELS } from "../server/gemini.js";
import { handleApiRequest } from "../server/apiHandler.js";

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

test("/api/ai/image returns the local vector fallback without a Gemini key", async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  let statusCode;
  let responseBody;
  const response = {
    writeHead(code) {
      statusCode = code;
    },
    end(body) {
      responseBody = JSON.parse(body);
    }
  };

  try {
    await handleApiRequest({
      method: "POST",
      url: "/api/ai/image",
      body: {
        prompt: "Jardin contemporain",
        tradeId: "paysagiste",
        sectionType: "hero",
        style: "4k"
      }
    }, response);
  } finally {
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }

  assert.equal(statusCode, 200);
  assert.equal(responseBody.success, true);
  assert.equal(responseBody.source, "local_engine");
  assert.equal(responseBody.prompt, "Jardin contemporain");
  assert.match(responseBody.imageUrl, /^data:image\/svg\+xml/);
  assert.match(decodeURIComponent(responseBody.imageUrl), /Jardin contemporain/);
});

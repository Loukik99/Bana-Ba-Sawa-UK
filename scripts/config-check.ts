import assert from "node:assert/strict";
import {
  allowDevMailPreview,
  publicAppUrl,
  validateClientOrigin,
  validateProductionConfig,
} from "../server/config.js";

assert.equal(publicAppUrl({ NODE_ENV: "test" }), "http://localhost:5173");
assert.equal(publicAppUrl({ NODE_ENV: "development" }), "http://localhost:5173");
assert.equal(allowDevMailPreview({ NODE_ENV: "development" }), true);
assert.equal(allowDevMailPreview({ NODE_ENV: "test" }), false);
assert.equal(allowDevMailPreview({ NODE_ENV: "production" }), false);
assert.equal(allowDevMailPreview({ VERCEL: "1" }), false);

assert.throws(
  () => publicAppUrl({ NODE_ENV: "production" }),
  /APP_URL is required in production/,
);

assert.throws(
  () => validateProductionConfig({ NODE_ENV: "production" }),
  /APP_URL is required in production/,
);

assert.throws(
  () =>
    publicAppUrl({
      NODE_ENV: "production",
      APP_URL: "http://localhost:5173",
    }),
  /must not point to localhost/,
);

assert.throws(
  () =>
    validateProductionConfig({
      NODE_ENV: "production",
      APP_URL: "http://localhost:5173",
    }),
  /must not point to localhost/,
);

assert.throws(
  () =>
    publicAppUrl({
      NODE_ENV: "production",
      VERCEL: "1",
      APP_URL: "http://localhost:5173",
    }),
  /must not point to localhost/,
);

assert.throws(
  () =>
    publicAppUrl({
      NODE_ENV: "development",
      VERCEL: "1",
      APP_URL: "http://127.0.0.1:5173",
    }),
  /must not point to localhost/,
);

assert.equal(
  publicAppUrl({
    NODE_ENV: "production",
    VERCEL: "1",
    APP_URL: "https://bana-ba-sawa-uk.vercel.app/",
  }),
  "https://bana-ba-sawa-uk.vercel.app",
);

assert.throws(
  () => validateProductionConfig({ NODE_ENV: "production", VERCEL: "1" }),
  /DATABASE_URL is required/,
);

assert.throws(
  () =>
    validateClientOrigin({
      NODE_ENV: "production",
      CLIENT_ORIGIN: "http://localhost:5173",
    }),
  /CLIENT_ORIGIN must not point to localhost/,
);

assert.throws(
  () => validateClientOrigin({ NODE_ENV: "production", CLIENT_ORIGIN: "*" }),
  /wildcard/,
);

validateClientOrigin({ NODE_ENV: "development", CLIENT_ORIGIN: "http://localhost:5173" });

validateProductionConfig({
  NODE_ENV: "production",
  VERCEL: "1",
  DATABASE_URL: "postgres://example",
  APP_URL: "https://bana-ba-sawa-uk.vercel.app",
});

validateProductionConfig({
  NODE_ENV: "production",
  APP_URL: "https://banabasawa.uk",
});

console.log("Config validation checks passed.");

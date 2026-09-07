const LOCALHOST_URL = /localhost|127\.0\.0\.1/i;

export function isProductionEnv(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === "production";
}

export function isHostedDeployment(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.VERCEL);
}

export function isLocalhostUrl(url: string): boolean {
  return LOCALHOST_URL.test(url);
}

export function isPublicRuntime(env: NodeJS.ProcessEnv = process.env): boolean {
  return isProductionEnv(env) || isHostedDeployment(env);
}

export function allowDevMailPreview(env: NodeJS.ProcessEnv = process.env): boolean {
  return !isPublicRuntime(env) && env.NODE_ENV !== "test";
}

function normalizeOrigin(value: string): string {
  return value.replace(/\/$/, "");
}

export function publicAppUrl(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.APP_URL?.trim();
  const production = isPublicRuntime(env);

  if (production) {
    if (!configured) {
      throw new Error("APP_URL is required in production and must be the public website URL.");
    }
    if (isLocalhostUrl(configured)) {
      throw new Error("APP_URL must not point to localhost in production.");
    }
    return normalizeOrigin(configured);
  }

  return normalizeOrigin(configured || env.CLIENT_ORIGIN?.trim() || "http://localhost:5173");
}

export function validateClientOrigin(env: NodeJS.ProcessEnv = process.env): void {
  const origin = env.CLIENT_ORIGIN?.trim();
  if (!origin) return;

  if (origin === "*") {
    throw new Error("CLIENT_ORIGIN cannot be a wildcard when credentialed cookies are used.");
  }

  if (isPublicRuntime(env) && isLocalhostUrl(origin)) {
    throw new Error("CLIENT_ORIGIN must not point to localhost in production.");
  }
}

export function validateProductionConfig(env: NodeJS.ProcessEnv = process.env): void {
  if (isHostedDeployment(env) && !env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is required in production.");
  }

  if (isPublicRuntime(env)) {
    publicAppUrl(env);
    validateClientOrigin(env);
  }
}

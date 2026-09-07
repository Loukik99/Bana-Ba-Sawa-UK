import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32;
const TOKEN_HEX_PATTERN = /^[a-f0-9]{64}$/i;

export function createSecretToken(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

export function hashSecretToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isSecretTokenFormat(token: string): boolean {
  return TOKEN_HEX_PATTERN.test(token);
}

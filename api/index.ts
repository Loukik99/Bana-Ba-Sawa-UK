import type { IncomingMessage, ServerResponse } from "node:http";
import type { Express } from "express";
import { createServer } from "../server/create-server.js";

let appPromise: Promise<Express> | undefined;
const MAX_BODY_BYTES = 256 * 1024;

function headerValue(req: IncomingMessage, name: string): string {
  const value = req.headers[name];
  return typeof value === "string" ? value : "";
}

function withApiPrefix(url: string): string {
  const value = url.length > 0 ? url : "/";
  if (value === "/api" || value.startsWith("/api/") || value.startsWith("/api?")) {
    return value;
  }
  return value.startsWith("/") ? `/api${value}` : `/api/${value}`;
}

function originalUrl(req: IncomingMessage): string {
  return headerValue(req, "x-forwarded-uri") || headerValue(req, "x-invoke-path") || req.url || "/";
}

function getApp(): Promise<Express> {
  appPromise ??= createServer()
    .then(({ app }) => app)
    .catch((error) => {
      appPromise = undefined;
      throw error;
    });
  return appPromise;
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error("Payload too large") as Error & { status: number };
      error.status = 413;
      throw error;
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const rawBody = await readBody(req);
    if (rawBody.length > 0) {
      (req as IncomingMessage & { body?: Buffer }).body = rawBody;
    }
    const app = await getApp();
    req.url = withApiPrefix(originalUrl(req));
    return app(req, res);
  } catch (error) {
    if (res.headersSent) return;
    const status =
      error && typeof error === "object" && "status" in error && typeof (error as { status: unknown }).status === "number"
        ? (error as { status: number }).status
        : 500;
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: status === 413 ? "Please check the submitted details." : "Something went wrong. Please try again.",
      }),
    );
  }
}

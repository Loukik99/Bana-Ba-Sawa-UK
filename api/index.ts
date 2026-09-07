import type { IncomingMessage, ServerResponse } from "node:http";
import type { Express } from "express";
import { createServer } from "../server/create-server.js";

let appPromise: Promise<Express> | undefined;

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
  appPromise ??= createServer().then(({ app }) => app);
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();
  req.url = withApiPrefix(originalUrl(req));
  return app(req, res);
}

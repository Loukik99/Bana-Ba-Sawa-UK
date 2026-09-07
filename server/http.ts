import type { Response } from "express";

export function jsonError(res: Response, status: number, error: string, fields?: Record<string, string>) {
  res.status(status).json(fields ? { error, fields } : { error });
}

export function logInternalError(scope: string, error: unknown): void {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`[${scope}] ${message}`);
}

export function parseIdParam(value: unknown): number | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return undefined;
  return parsed;
}

export function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = typeof value === "string" ? Number(value) : typeof value === "number" ? value : Number.NaN;
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return parsed;
}

export function pagination(query: { page?: unknown; pageSize?: unknown }, maxPageSize = 50) {
  const page = parsePositiveInt(query.page, 1);
  const pageSize = Math.min(parsePositiveInt(query.pageSize, 20), maxPageSize);
  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  };
}

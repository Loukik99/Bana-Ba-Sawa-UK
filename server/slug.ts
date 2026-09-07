export function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "item";
}

export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const normalized = slugify(base);
  if (!(await exists(normalized))) return normalized;

  for (let index = 2; index <= 1000; index += 1) {
    const candidate = `${normalized}-${index}`;
    if (!(await exists(candidate))) return candidate;
  }

  return `${normalized}-${crypto.randomUUID().slice(0, 8)}`;
}

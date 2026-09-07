const WINDOW_MS = 15 * 60 * 1000;
const LIMIT = 5;

interface HitRecord {
  count: number;
  windowStart: number;
}

export interface ResendGuard {
  isLimited(key: string): boolean;
  record(key: string): void;
}

export interface ResendGuardOptions {
  windowMs?: number;
  limit?: number;
}

export function createResendGuard(options: ResendGuardOptions = {}): ResendGuard {
  const windowMs = options.windowMs ?? WINDOW_MS;
  const limit = options.limit ?? LIMIT;
  const hits = new Map<string, HitRecord>();

  function prune(now: number) {
    for (const [key, record] of hits) {
      if (now - record.windowStart >= windowMs) {
        hits.delete(key);
      }
    }
  }

  return {
    isLimited(key, now = Date.now()) {
      prune(now);
      const record = hits.get(key);
      return Boolean(record && record.count >= limit);
    },
    record(key, now = Date.now()) {
      prune(now);
      const record = hits.get(key);
      if (!record) {
        hits.set(key, { count: 1, windowStart: now });
        return;
      }
      record.count += 1;
    },
  };
}

export function noopResendGuard(): ResendGuard {
  return {
    isLimited() {
      return false;
    },
    record() {},
  };
}

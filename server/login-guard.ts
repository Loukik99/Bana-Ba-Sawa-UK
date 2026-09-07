const WINDOW_MS = 15 * 60 * 1000;
const FAILURES_PER_EMAIL = 10;
const FAILURES_PER_EMAIL_IP = 5;

interface FailureRecord {
  count: number;
  windowStart: number;
}

export interface LoginFailureGuard {
  isLimited(email: string, ip: string): boolean;
  recordFailure(email: string, ip: string): void;
  clear(email: string, ip: string): void;
}

export interface LoginFailureGuardOptions {
  windowMs?: number;
  emailLimit?: number;
  emailIpLimit?: number;
}

function createTracker(limit: number, windowMs: number) {
  const hits = new Map<string, FailureRecord>();

  function prune(now: number) {
    for (const [key, record] of hits) {
      if (now - record.windowStart >= windowMs) {
        hits.delete(key);
      }
    }
  }

  return {
    isLimited(key: string, now = Date.now()): boolean {
      prune(now);
      const record = hits.get(key);
      return Boolean(record && record.count >= limit);
    },
    record(key: string, now = Date.now()): void {
      prune(now);
      const record = hits.get(key);
      if (!record) {
        hits.set(key, { count: 1, windowStart: now });
        return;
      }
      record.count += 1;
    },
    clear(key: string): void {
      hits.delete(key);
    },
  };
}

export function createLoginFailureGuard(options: LoginFailureGuardOptions = {}): LoginFailureGuard {
  const windowMs = options.windowMs ?? WINDOW_MS;
  const emailLimit = options.emailLimit ?? FAILURES_PER_EMAIL;
  const emailIpLimit = options.emailIpLimit ?? FAILURES_PER_EMAIL_IP;
  const byEmail = createTracker(emailLimit, windowMs);
  const byEmailIp = createTracker(emailIpLimit, windowMs);

  function emailIpKey(email: string, ip: string): string {
    return `${email}\0${ip}`;
  }

  return {
    isLimited(email, ip) {
      return byEmail.isLimited(email) || byEmailIp.isLimited(emailIpKey(email, ip));
    },
    recordFailure(email, ip) {
      byEmail.record(email);
      byEmailIp.record(emailIpKey(email, ip));
    },
    clear(email, ip) {
      byEmail.clear(email);
      byEmailIp.clear(emailIpKey(email, ip));
    },
  };
}

export function noopLoginFailureGuard(): LoginFailureGuard {
  return {
    isLimited() {
      return false;
    },
    recordFailure() {},
    clear() {},
  };
}

export function requestIp(req: { ip?: string; socket?: { remoteAddress?: string } }): string {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

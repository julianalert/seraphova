/**
 * Simple in-memory rate limiter.
 * Works per serverless instance. For multi-instance production scale,
 * swap the store for Upstash Redis (drop-in replacement via @upstash/ratelimit).
 */

interface Entry {
  count:     number;
  resetAt:   number;
}

const store = new Map<string, Entry>();

// Prune expired entries every 5 minutes to avoid unbounded memory growth
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit:      number;
  /** Window duration in seconds */
  windowSecs: number;
}

export interface RateLimitResult {
  allowed:    boolean;
  remaining:  number;
  resetAt:    number;
}

export function rateLimit(
  key:    string,
  config: RateLimitConfig
): RateLimitResult {
  const now    = Date.now();
  const window = config.windowSecs * 1000;

  const existing = store.get(key);

  if (!existing || existing.resetAt < now) {
    const entry: Entry = { count: 1, resetAt: now + window };
    store.set(key, entry);
    return { allowed: true, remaining: config.limit - 1, resetAt: entry.resetAt };
  }

  existing.count++;

  if (existing.count > config.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  return {
    allowed:   true,
    remaining: config.limit - existing.count,
    resetAt:   existing.resetAt,
  };
}

/** Extract a stable IP key from a Next.js request */
export function getIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

/** Result of {@link RateLimiter.hit}. */
export interface RateLimitResult {
  readonly ok: boolean;
  /** Seconds until the window resets (for `Retry-After`). */
  readonly retryAfter: number;
}

/** A fixed-window limiter. */
export interface RateLimiter {
  /** Counts one request for `key` at time `now` (ms). */
  readonly hit: (key: string, now?: number) => RateLimitResult;
}

/**
 * Allows `limit` requests per `windowMs` for each key, in memory. Enough for
 * one server process; several instances need a shared store instead.
 */
export function createRateLimiter(limit: number, windowMs: number, maxKeys = 10_000): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>();
  return {
    hit(key, now = Date.now()) {
      let w = windows.get(key);
      if (!w || now - w.start >= windowMs) {
        if (windows.size >= maxKeys) {
          // Drop expired windows; if none expired, drop the oldest one.
          for (const [k, v] of windows) if (now - v.start >= windowMs) windows.delete(k);
          if (windows.size >= maxKeys) windows.delete(windows.keys().next().value ?? "");
        }
        w = { start: now, count: 0 };
        windows.set(key, w);
      }
      w.count++;
      return { ok: w.count <= limit, retryAfter: Math.ceil((w.start + windowMs - now) / 1000) };
    },
  };
}

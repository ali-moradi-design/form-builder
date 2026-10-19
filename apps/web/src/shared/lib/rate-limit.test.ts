import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("rate limiter", () => {
  it("allows the limit per window and key", () => {
    const limiter = createRateLimiter(2, 1000);
    expect(limiter.hit("a", 0).ok).toBe(true);
    expect(limiter.hit("a", 10).ok).toBe(true);
    expect(limiter.hit("a", 20)).toEqual({ ok: false, retryAfter: 1 });
    expect(limiter.hit("b", 20).ok).toBe(true);
    expect(limiter.hit("a", 1000).ok).toBe(true);
  });

  it("keeps memory bounded", () => {
    const limiter = createRateLimiter(1, 1000, 2);
    limiter.hit("a", 0);
    limiter.hit("b", 0);
    limiter.hit("c", 0);
    expect(limiter.hit("c", 1).ok).toBe(false);
  });
});

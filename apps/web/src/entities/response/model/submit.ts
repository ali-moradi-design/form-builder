import type { Db } from "@/shared/db";
import { createRateLimiter, type RateLimitResult } from "@/shared/lib";
import { acceptResponse, type AcceptResult } from "./accept";

/** Name of the hidden field that people never fill and bots often do. */
export const HONEYPOT = "_hp";

/** Submissions per address and form per minute. */
const limiter = createRateLimiter(Number(process.env.SUBMIT_RATE_LIMIT ?? 10), 60_000);

/** What a submission came with. */
export interface SubmissionInput {
  readonly slug: string;
  readonly values: unknown;
  readonly locale?: string | undefined;
  /** Value of the honeypot field; anything but empty marks a bot. */
  readonly honeypot?: unknown;
  /** Client address, for the rate limit. */
  readonly ip: string;
}

/** Result of {@link submit}. */
export type SubmitResult =
  | AcceptResult
  | { readonly ok: false; readonly reason: "rateLimited"; readonly retryAfter: number }
  | { readonly ok: true; readonly id: null; readonly version: null };

/**
 * The one way answers come in (hosted page and public API): rate limit per
 * address and form, honeypot check, then server validation.
 * A filled honeypot looks like success to the sender but stores nothing.
 */
export async function submit(db: Db, input: SubmissionInput): Promise<SubmitResult> {
  const limit: RateLimitResult = limiter.hit(`${input.ip}|${input.slug}`);
  if (!limit.ok) return { ok: false, reason: "rateLimited", retryAfter: limit.retryAfter };
  if (input.honeypot !== undefined && input.honeypot !== null && input.honeypot !== "") {
    return { ok: true, id: null, version: null };
  }
  return acceptResponse(db, input.slug, input.values, input.locale);
}

/** The client address from proxy headers (first hop), or "unknown". */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}

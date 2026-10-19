import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** A new random signing secret (`whsec_` + 32 bytes, base64url). */
export function newSecret(): string {
  return `whsec_${randomBytes(32).toString("base64url")}`;
}

/**
 * The signature header value for a delivery: HMAC-SHA256 of
 * `<timestamp>.<body>` with the secret, as `sha256=<hex>`.
 * Signing the timestamp lets receivers reject replays.
 */
export function sign(secret: string, timestamp: number, body: string): string {
  return `sha256=${createHmac("sha256", secret)
    .update(`${String(timestamp)}.${body}`)
    .digest("hex")}`;
}

/** Checks a signature in constant time (for receivers and tests). */
export function verify(
  secret: string,
  timestamp: number,
  body: string,
  signature: string,
): boolean {
  const expected = Buffer.from(sign(secret, timestamp, body));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

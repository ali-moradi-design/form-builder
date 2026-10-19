import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/** Why an address can't receive webhooks. */
export type UrlProblem = "invalid" | "protocol" | "private" | "unresolved";

function privateV4(ip: string): boolean {
  const [a = 0, b = 0] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

/** Loopback, private, link-local, multicast and other non-public addresses. */
export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) return privateV4(ip);
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return privateV4(v6.slice(7));
  return (
    v6 === "::" ||
    v6 === "::1" ||
    v6.startsWith("fc") ||
    v6.startsWith("fd") ||
    v6.startsWith("fe8") ||
    v6.startsWith("fe9") ||
    v6.startsWith("fea") ||
    v6.startsWith("feb") ||
    v6.startsWith("ff")
  );
}

/** Private addresses are allowed only when set (local development and tests). */
const allowPrivate = (): boolean => process.env.WEBHOOK_ALLOW_PRIVATE === "1";

/**
 * Checks that a webhook URL is https (http only for allowed private hosts)
 * and that its host resolves to public addresses only, so webhooks can't be
 * used to reach the server's own network. Run it when saving and again
 * before every delivery (DNS can change).
 */
export async function checkWebhookUrl(raw: string): Promise<UrlProblem | null> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "invalid";
  }
  if (url.username || url.password) return "invalid";
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (allowPrivate())
    return url.protocol === "https:" || url.protocol === "http:" ? null : "protocol";
  if (url.protocol !== "https:") return "protocol";
  let addresses: string[];
  try {
    addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map((a) => a.address);
  } catch {
    return "unresolved";
  }
  if (addresses.length === 0) return "unresolved";
  return addresses.some(isPrivateAddress) ? "private" : null;
}

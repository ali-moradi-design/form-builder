import { lookup, type LookupAddress, type LookupOptions } from "node:dns";
import { request as httpRequest, type RequestOptions } from "node:http";
import { request as httpsRequest } from "node:https";
import { isPrivateAddress } from "./guard";

type LookupCallback = (
  error: NodeJS.ErrnoException | null,
  address: string | LookupAddress[],
  family?: number,
) => void;

/**
 * DNS lookup for webhook connections that refuses private addresses. The check
 * runs on the very addresses the socket connects to, so a name that resolves
 * to a public address when the URL is checked and to an internal one a moment
 * later (DNS rebinding) is still refused.
 */
export function publicOnlyLookup(
  hostname: string,
  options: LookupOptions,
  callback: LookupCallback,
): void {
  lookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) {
      callback(error, []);
      return;
    }
    const allowPrivate = process.env.WEBHOOK_ALLOW_PRIVATE === "1";
    if (!allowPrivate && addresses.some((a) => isPrivateAddress(a.address))) {
      callback(Object.assign(new Error("blocked: private address"), { code: "EBLOCKED" }), []);
      return;
    }
    const [first] = addresses;
    if (options.all) callback(null, addresses);
    else if (first) callback(null, first.address, first.family);
    else callback(Object.assign(new Error("unresolved"), { code: "ENOTFOUND" }), []);
  });
}

/** What {@link postJson} reports, the part of a `fetch` response that delivery uses. */
export interface PostResult {
  readonly ok: boolean;
  readonly status: number;
}

/**
 * POSTs a body to a webhook URL without following redirects, connecting only
 * to public addresses. Shaped like `fetch` so delivery can swap it in tests.
 */
export function postJson(
  url: string,
  init: { headers: Record<string, string>; body: string; signal?: AbortSignal },
): Promise<PostResult> {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const options: RequestOptions = {
      method: "POST",
      headers: { ...init.headers, "Content-Length": String(Buffer.byteLength(init.body)) },
      lookup: publicOnlyLookup,
      signal: init.signal,
    };
    const send = target.protocol === "https:" ? httpsRequest : httpRequest;
    const req = send(target, options, (res) => {
      res.resume(); // The answer's body is not needed.
      const status = res.statusCode ?? 0;
      resolve({ ok: status >= 200 && status < 300, status });
    });
    req.on("error", reject);
    req.end(init.body);
  });
}

import { checkWebhookUrl } from "./guard";
import { postJson, type PostResult } from "./post";
import { sign } from "./sign";

/** Result of one HTTP attempt. */
export interface Attempt {
  readonly attempt: number;
  readonly ok: boolean;
  readonly status: number | null;
  readonly error: string | null;
  readonly durationMs: number;
}

/** Where and how to deliver. */
export interface Target {
  readonly url: string;
  readonly secret: string;
}

/** Options of {@link deliver}. */
export interface DeliverOptions {
  /** Waits before each retry, in ms. Default 1 s, 5 s, 25 s (four attempts). */
  readonly backoff?: readonly number[];
  readonly timeoutMs?: number;
  /** Called after every attempt (to log it). */
  readonly onAttempt?: (attempt: Attempt) => void | Promise<void>;
  /** Sends the request; by default {@link postJson} (public addresses only). */
  readonly fetch?: (
    url: string,
    init: { headers: Record<string, string>; body: string; signal?: AbortSignal },
  ) => Promise<PostResult>;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly now?: () => number;
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * POSTs a JSON event, signed, and retries on network errors, 429 and 5xx.
 * Never throws; returns the last attempt. No redirects are followed, so a
 * redirect can't lead to a private address.
 */
export async function deliver(
  target: Target,
  event: string,
  payload: unknown,
  options: DeliverOptions = {},
): Promise<Attempt> {
  const { backoff = [1000, 5000, 25_000], timeoutMs = 5000, onAttempt } = options;
  const doFetch = options.fetch ?? postJson;
  const sleep = options.sleep ?? wait;
  const now = options.now ?? Date.now;
  const body = JSON.stringify(payload);
  let last: Attempt = { attempt: 0, ok: false, status: null, error: "not sent", durationMs: 0 };
  for (let attempt = 1; attempt <= backoff.length + 1; attempt++) {
    const started = now();
    const problem = await checkWebhookUrl(target.url);
    if (problem) {
      last = { attempt, ok: false, status: null, error: `blocked: ${problem}`, durationMs: 0 };
      await onAttempt?.(last);
      return last;
    }
    const timestamp = Math.floor(now() / 1000);
    try {
      const response = await doFetch(target.url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "formweave-webhooks/1",
          "X-Formweave-Event": event,
          "X-Formweave-Timestamp": String(timestamp),
          "X-Formweave-Signature": sign(target.secret, timestamp, body),
        },
        body,
      });
      last = {
        attempt,
        ok: response.ok,
        status: response.status,
        error: response.ok ? null : `HTTP ${String(response.status)}`,
        durationMs: now() - started,
      };
    } catch (e) {
      last = {
        attempt,
        ok: false,
        status: null,
        error: e instanceof Error ? e.message : String(e),
        durationMs: now() - started,
      };
    }
    await onAttempt?.(last);
    const retry = !last.ok && (last.status === null || last.status === 429 || last.status >= 500);
    const delay = backoff[attempt - 1];
    if (!retry || delay === undefined) return last;
    await sleep(delay);
  }
  return last;
}

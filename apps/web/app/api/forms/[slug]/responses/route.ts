import { clientIp, HONEYPOT, submit } from "@/entities/response";
import { getDb } from "@/shared/db";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const MAX_BYTES = 64 * 1024;

const error = (
  status: number,
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
) => Response.json(body, { status, headers: { ...cors, ...headers } });

/** Preflight for browsers posting from other sites (embeds). */
export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: cors });
}

/**
 * POST /api/forms/<slug>/responses with JSON `{ "values": {…}, "locale": "en" }`.
 *
 * 201 `{ id, version }` · 404 unknown form · 413 body over 64 KB ·
 * 415 not JSON · 422 `{ issues }` · 429 too many submissions (`Retry-After`).
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return error(415, { error: "unsupportedMediaType" });
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BYTES) return error(413, { error: "tooLarge" });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return error(400, { error: "invalidJson" });
  }
  const input = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const result = await submit(await getDb(), {
    slug: (await params).slug,
    values: input.values,
    locale: typeof input.locale === "string" ? input.locale : undefined,
    honeypot: input[HONEYPOT],
    ip: clientIp(request.headers),
  });
  if (result.ok)
    return Response.json(
      { id: result.id, version: result.version },
      { status: 201, headers: cors },
    );
  switch (result.reason) {
    case "notFound":
      return error(404, { error: "notFound" });
    case "invalid":
      return error(422, { error: "invalid", issues: result.issues });
    case "rateLimited":
      return error(429, { error: "rateLimited" }, { "Retry-After": String(result.retryAfter) });
  }
}

import { clientIp, MAX_UPLOAD, receiveUpload } from "@/entities/response";
import { getDb } from "@/shared/db";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const reply = (
  status: number,
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
) => Response.json(body, { status, headers: { ...cors, ...headers } });

/** Preflight for browsers uploading from other sites (embeds). */
export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: cors });
}

/**
 * POST /api/forms/<slug>/uploads?field=<key> with `multipart/form-data` and
 * one `file` part.
 *
 * 201 `{ id, name, size, type }` · 404 unknown form or field · 413 too big ·
 * 415 not multipart or a type the field refuses · 429 too many uploads.
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!request.headers.get("content-type")?.includes("multipart/form-data"))
    return reply(415, { error: "unsupportedMediaType" });
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD + 64 * 1024) return reply(413, { error: "tooLarge" });
  const field = new URL(request.url).searchParams.get("field") ?? "";
  let part: FormDataEntryValue | null;
  try {
    part = (await request.formData()).get("file");
  } catch {
    return reply(400, { error: "invalidBody" });
  }
  if (!(part instanceof Blob)) return reply(400, { error: "noFile" });
  const db = await getDb();
  const result = await receiveUpload(db, {
    slug: (await params).slug,
    field,
    ip: clientIp(request.headers),
    name: part instanceof File ? part.name : "file",
    type: part.type,
    data: new Uint8Array(await part.arrayBuffer()),
  });
  if (result.ok) return reply(201, { ...result.file });
  switch (result.reason) {
    case "notFound":
      return reply(404, { error: "notFound" });
    case "tooLarge":
      return reply(413, { error: "tooLarge" });
    case "type":
      return reply(415, { error: "fileType" });
    case "rateLimited":
      return reply(
        429,
        { error: "rateLimited" },
        { "Retry-After": String(result.retryAfter ?? 60) },
      );
  }
}

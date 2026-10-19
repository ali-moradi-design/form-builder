import { getUser } from "@/shared/auth";
import { getDb, getUpload } from "@/shared/db";

/** Images that browsers can show without running anything. */
const INLINE = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

/** GET /forms/<id>/responses/files/<fileId>: a file of a response (owner only). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> },
) {
  const { id, fileId } = await params;
  const user = await getUser();
  const file = user ? await getUpload(await getDb(), user.id, id, fileId) : undefined;
  if (!file) return new Response("Not found", { status: 404 });
  const inline = INLINE.has(file.type);
  const name = encodeURIComponent(file.name);
  return new Response(new Uint8Array(file.data), {
    headers: {
      // Anything but plain images is a download, so it never runs in our origin.
      "Content-Type": inline ? file.type : "application/octet-stream",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${name}`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, no-store",
    },
  });
}

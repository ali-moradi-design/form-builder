import { getDb, getLiveForm } from "@/shared/db";

const cors = { "Access-Control-Allow-Origin": "*" };

/** GET /api/forms/<slug>: the live version of a published form. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const live = await getLiveForm(await getDb(), (await params).slug);
  if (!live) return Response.json({ error: "notFound" }, { status: 404, headers: cors });
  return Response.json(
    { version: live.version, document: live.document },
    { headers: { ...cors, "Cache-Control": "public, max-age=30, stale-while-revalidate=300" } },
  );
}

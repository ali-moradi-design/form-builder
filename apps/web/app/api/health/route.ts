import { sql } from "drizzle-orm";
import { getDb } from "@/shared/db";

/**
 * GET /api/health: 200 when the app can reach its database (migrations
 * applied), 503 otherwise. Used by the container healthcheck and the
 * smoke test after a deploy.
 */
export async function GET() {
  try {
    await (await getDb()).execute(sql`select 1`);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

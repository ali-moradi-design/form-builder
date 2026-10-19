import { createHash, timingSafeEqual } from "node:crypto";
import { resetDemo } from "@/features/session";
import { getDb } from "@/shared/db";

const digest = (value: string) => createHash("sha256").update(value).digest();

/**
 * POST /api/demo/reset with `Authorization: Bearer <DEMO_RESET_TOKEN>`:
 * puts the demo account back to its starting content. Called nightly by the
 * server's scheduler. Without the variable the route does not exist.
 */
export async function POST(request: Request) {
  const token = process.env.DEMO_RESET_TOKEN;
  if (!token) return Response.json({ error: "notFound" }, { status: 404 });
  const sent = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!timingSafeEqual(digest(sent), digest(token))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return Response.json(await resetDemo(await getDb()));
}

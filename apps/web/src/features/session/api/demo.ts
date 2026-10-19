"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/shared/auth";
import { getDb, listForms, tables } from "@/shared/db";
import { DEMO_EMAIL, seedDemo } from "./reset-demo";

// Public on purpose: the sign-in page says anyone can open the demo.
const DEMO = { name: "Demo", email: DEMO_EMAIL, password: "formweave-demo" };

/** Signs into the shared demo account, creating it with sample forms if needed. */
export async function signInDemo(): Promise<void> {
  const auth = await getAuth();
  const db = await getDb();
  const [existing] = await db
    .select({ id: tables.user.id })
    .from(tables.user)
    .where(eq(tables.user.email, DEMO.email));
  const result = existing
    ? await auth.api.signInEmail({ body: DEMO, headers: await headers() })
    : await auth.api.signUpEmail({ body: DEMO, headers: await headers() });
  if ((await listForms(db, result.user.id)).length === 0) {
    await seedDemo(db, result.user.id);
  }
  redirect("/forms");
}

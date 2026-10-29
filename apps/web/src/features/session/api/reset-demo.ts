import { eq } from "drizzle-orm";
import { eventTemplate, feedbackTemplate, jobTemplate } from "@/shared/config";
import { addResponse, createForm, getLiveForm, publishForm, tables, type Db } from "@/shared/db";

/** Email of the shared demo account. */
export const DEMO_EMAIL = "demo@formcanvas.dev";

const PLANS = ["free", "team", "enterprise"] as const;
const COLORS = ["#0f4c5c", "#e36414", "#fb8b24", "#9a031e", "#5f0f40"];
const FEATURES = ["builder", "logic", "export"];
const NAMES = ["Sara", "Ali", "Mina", "Reza", "Nora", "Omid", "Leila", "Kian", "Tara", "Arman"];
const COMMENTS = [
  "The builder is quick to learn.",
  "Please add more chart types.",
  "",
  "Logic rules saved me a lot of time.",
];

/**
 * A sample answer to the product feedback form. Deterministic, so every
 * reset shows the same summaries.
 */
export function sampleFeedback(n: number): Record<string, unknown> {
  const plan = PLANS[n % 3] ?? "free";
  const comment = COMMENTS[n % COMMENTS.length] ?? "";
  return {
    name: `${NAMES[n % NAMES.length] ?? "Guest"} ${String.fromCharCode(65 + (n % 26))}.`,
    ...(n % 2 === 0 ? { email: `person${String(n)}@example.com` } : {}),
    plan,
    ...(plan === "free" ? {} : { seats: 2 + ((n * 7) % 40) }),
    satisfaction: 3 + ((n * 5) % 3),
    colors: [COLORS[n % 5], COLORS[(n + 2) % 5]],
    recommend: 5 + ((n * 3) % 6),
    features: [FEATURES[n % 3], ...(n % 4 === 0 ? [FEATURES[(n + 1) % 3]] : [])],
    ...(comment ? { comment } : {}),
    contact: n % 3 === 0,
  };
}

/**
 * Fills the demo account with its starting content: the product feedback
 * form, published with sample responses, and two drafts from the gallery.
 */
export async function seedDemo(db: Db, ownerId: string, responses = 24): Promise<void> {
  const feedback = await createForm(db, ownerId, feedbackTemplate);
  const published = await publishForm(db, ownerId, feedback, "Product feedback");
  const live = published && (await getLiveForm(db, published.slug));
  if (live) {
    for (let n = 0; n < responses; n++) {
      await addResponse(db, {
        formId: feedback,
        versionId: live.versionId,
        data: sampleFeedback(n),
        locale: n % 4 === 3 ? "fa" : "en",
      });
    }
  }
  await createForm(db, ownerId, jobTemplate);
  await createForm(db, ownerId, eventTemplate);
}

/**
 * Puts the demo account back to its starting content: removes every form
 * (with versions, responses, uploads and webhooks), signs out every demo
 * session and seeds again. Does nothing when the account does not exist yet.
 */
export async function resetDemo(db: Db): Promise<{ readonly reset: boolean }> {
  const [demo] = await db
    .select({ id: tables.user.id })
    .from(tables.user)
    .where(eq(tables.user.email, DEMO_EMAIL));
  if (!demo) return { reset: false };
  await db.delete(tables.form).where(eq(tables.form.ownerId, demo.id));
  await db.delete(tables.session).where(eq(tables.session.userId, demo.id));
  await seedDemo(db, demo.id);
  return { reset: true };
}

/** Whether a form belongs to the shared demo account. */
export async function isDemoForm(db: Db, formId: string): Promise<boolean> {
  const [row] = await db
    .select({ email: tables.user.email })
    .from(tables.form)
    .innerJoin(tables.user, eq(tables.user.id, tables.form.ownerId))
    .where(eq(tables.form.id, formId));
  return row?.email === DEMO_EMAIL;
}

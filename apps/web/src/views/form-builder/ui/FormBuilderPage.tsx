import { notFound } from "next/navigation";
import { getUser } from "@/shared/auth";
import { getDb, getForm } from "@/shared/db";
import { FormBuilder } from "./FormBuilder";

/** Loads one of the signed-in user's forms into the builder. */
export async function FormBuilderPage({ id }: { id: string }) {
  const user = await getUser();
  const form = user ? await getForm(await getDb(), user.id, id) : undefined;
  if (!form) notFound();
  const live =
    form.slug && form.liveVersion !== null ? { slug: form.slug, version: form.liveVersion } : null;
  return <FormBuilder id={form.id} initial={form.draft} live={live} />;
}

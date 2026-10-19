import { FormBuilder } from "@/views/form-builder";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FormBuilder id={id} />;
}

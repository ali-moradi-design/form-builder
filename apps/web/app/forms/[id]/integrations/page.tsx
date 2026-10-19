import { IntegrationsPage } from "@/views/form-integrations";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <IntegrationsPage id={(await params).id} />;
}

import { AnalyticsPage } from "@/views/form-analytics";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string; days?: string }>;
}) {
  return <AnalyticsPage id={(await params).id} query={await searchParams} />;
}

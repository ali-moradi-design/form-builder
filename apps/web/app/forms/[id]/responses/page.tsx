import { ResponsesPage, type ResponsesQuery } from "@/views/form-responses";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<ResponsesQuery>;
}) {
  return <ResponsesPage id={(await params).id} query={await searchParams} />;
}

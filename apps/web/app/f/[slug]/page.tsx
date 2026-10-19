import type { Metadata } from "next";
import { hostedFormMetadata, HostedFormPage } from "@/views/hosted-form";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return hostedFormMetadata((await params).slug);
}

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  return <HostedFormPage slug={slug} query={await searchParams} />;
}

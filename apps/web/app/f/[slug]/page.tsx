import type { Metadata } from "next";
import { hostedFormMetadata, HostedFormPage } from "@/views/hosted-form";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return hostedFormMetadata((await params).slug);
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <HostedFormPage slug={slug} />;
}

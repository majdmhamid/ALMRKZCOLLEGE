import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentDetail } from "@/features/signing/components/editor/DocumentDetail";
import { adminContext } from "@/features/signing/server/context";
import { loadEditor } from "@/features/signing/server/services/editor";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await loadEditor(await adminContext(), id);
  return { title: data?.doc.title ?? "—" };
}

export default async function DocumentPage({ params }: Props) {
  const { id } = await params;
  const data = await loadEditor(await adminContext(), id);
  if (!data) notFound();
  return <DocumentDetail doc={data.doc} signatures={data.signatures} placements={data.placements} history={data.history} />;
}

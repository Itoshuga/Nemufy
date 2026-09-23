import { redirect } from "next/navigation";
export default async function LabelPage({
  params,
}: {
  params: Promise<{ labelId: string }>;
}) {
  const { labelId } = await params;
  redirect(`/studio/labels/${labelId}/overview`);
}

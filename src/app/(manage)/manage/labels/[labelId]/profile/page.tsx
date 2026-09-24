import { BackofficePage } from "@/components/manage/backoffice-page";
import { LabelProfileForm } from "@/components/studio/label-profile-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getLabelById } from "@/lib/firebase/firestore/repositories/labels";
import { can } from "@/lib/permissions/can";
import { requireLabelPermission } from "@/lib/permissions/server";

export default async function ManageLabelProfilePage({
  params,
}: {
  params: Promise<{ labelId: string }>;
}) {
  const { labelId } = await params;
  const { user } = await requireActiveUser();
  const [label, context] = await Promise.all([
    getLabelById(labelId),
    requireLabelPermission(user.uid, user.claims.admin, labelId, "label:view"),
  ]);
  if (!label) return null;
  return (
    <BackofficePage
      eyebrow="Label"
      title="Profile"
      description="Public identity and essential information for this label."
    >
      <div className="border-border bg-surface mt-8 rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{label.name}</h2>
          <StatusBadge status={label.status} />
        </div>
        <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-6">
          {label.description || "No description yet."}
        </p>
      </div>
      {can(context, "label:edit") ? (
        <LabelProfileForm
          labelId={labelId}
          initial={{
            name: label.name,
            description: label.description ?? "",
            websiteUrl: label.websiteUrl ?? "",
          }}
        />
      ) : null}
    </BackofficePage>
  );
}

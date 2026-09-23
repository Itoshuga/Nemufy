import { ManagementPageHeader } from "@/components/studio/page-header";
import { LabelProfileForm } from "@/components/studio/label-profile-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getLabelById } from "@/lib/firebase/firestore/repositories/labels";
import { can } from "@/lib/permissions/can";
import { requireLabelPermission } from "@/lib/permissions/server";

export default async function LabelSettingsPage({
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
    <div>
      <ManagementPageHeader
        eyebrow="Label"
        title="Label profile"
        description="Identity and lifecycle settings for the label. Immediate destructive deletion is intentionally unavailable."
      />
      <div className="border-border bg-surface mt-8 rounded-2xl border p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{label.name}</h2>
          <StatusBadge status={label.status} />
        </div>
        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-subtle text-xs uppercase">Slug</dt>
            <dd className="mt-1 text-sm">{label.slug}</dd>
          </div>
          <div>
            <dt className="text-subtle text-xs uppercase">Website</dt>
            <dd className="mt-1 text-sm">{label.websiteUrl ?? "Not set"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-subtle text-xs uppercase">Description</dt>
            <dd className="text-muted-foreground mt-1 text-sm">
              {label.description ?? "Not set"}
            </dd>
          </div>
        </dl>
      </div>
      {can(context, "label:edit") && (
        <LabelProfileForm
          labelId={labelId}
          initial={{
            name: label.name,
            description: label.description ?? "",
            websiteUrl: label.websiteUrl ?? "",
          }}
        />
      )}
    </div>
  );
}

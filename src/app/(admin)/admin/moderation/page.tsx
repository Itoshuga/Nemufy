import { ShieldAlert } from "lucide-react";
import { ManagementPageHeader } from "@/components/studio/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function AdminModerationPage() {
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Safety"
        title="Moderation"
        description="A protected home for future reports and policy workflows. No content is removed automatically."
      />
      <div className="mt-8">
        <EmptyState
          icon={ShieldAlert}
          title="No moderation queue yet"
          description="Account suspension and artist lifecycle controls are already available from their detail pages."
        />
      </div>
    </div>
  );
}

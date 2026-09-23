import { Settings } from "lucide-react";
import { ManagementPageHeader } from "@/components/studio/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function AdminSettingsPage() {
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Platform"
        title="Settings"
        description="Protected platform configuration. Secret values stay in the runtime environment, never in this UI."
      />
      <div className="mt-8">
        <EmptyState
          icon={Settings}
          title="No mutable platform settings"
          description="Firebase configuration, security rules and environment secrets remain deployment-managed."
        />
      </div>
    </div>
  );
}

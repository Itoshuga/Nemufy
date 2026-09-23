import { LayoutTemplate } from "lucide-react";
import { ManagementPageHeader } from "@/components/studio/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function AdminPlatformPage() {
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Platform"
        title="Editorial management"
        description="Reserved architecture for featured artists, homepage sections, editorial playlists and categories."
      />
      <div className="mt-8">
        <EmptyState
          icon={LayoutTemplate}
          title="Editorial tools are intentionally deferred"
          description="The route and security boundary are ready without introducing premature homepage management logic."
        />
      </div>
    </div>
  );
}

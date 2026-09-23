import { EmptyState } from "@/components/ui/empty-state";
import { Activity } from "lucide-react";

export default function StudioActivityPage() {
  return (
    <EmptyState
      icon={Activity}
      title="Activity is scoped to each context"
      description="Open an artist or label to review its operational activity. Audit-grade platform events remain in the Admin Panel."
    />
  );
}

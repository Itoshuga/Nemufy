import Link from "next/link";
import { ArrowRight, Inbox, Search } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { BackofficePage } from "@/components/manage/backoffice-page";
import { Button } from "@/components/ui/button";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import {
  applicationSubject,
  applicationTypeLabels,
} from "@/lib/applications/display";
import {
  getApplicationRelatedRecords,
  listApplicationsPage,
} from "@/lib/firebase/firestore/repositories/applications";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, ApplicationType } from "@/types/firestore";

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    type?: string;
    q?: string;
    cursor?: string;
  }>;
}) {
  const filters = await searchParams;
  const tab = ["pending", "waiting", "completed", "all"].includes(
    filters.tab ?? "",
  )
    ? (filters.tab as "pending" | "waiting" | "completed" | "all")
    : "pending";
  const type = isApplicationType(filters.type) ? filters.type : undefined;
  const page = await listApplicationsPage({
    statuses: statusesForTab(tab),
    type,
    cursor: filters.cursor,
  });
  const related = await getApplicationRelatedRecords(page.applications);
  const query = filters.q?.trim().toLowerCase() ?? "";
  const applications = page.applications.filter((application) => {
    const applicant = related.applicants.get(application.applicantUserId);
    const artist = application.artistId
      ? related.artists.get(application.artistId)
      : null;
    const haystack = [
      applicant?.displayName,
      applicant?.username,
      artist?.displayName,
      artist?.name,
      applicationSubject(application),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return !query || haystack.includes(query);
  });

  return (
    <BackofficePage
      eyebrow="Administration"
      title="Requests"
      description="Review creator access without exposing memberships or ownership internals."
    >
      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Request status">
        <RequestTab tab="pending" current={tab} label="Pending" />
        <RequestTab tab="waiting" current={tab} label="Waiting for user" />
        <RequestTab tab="completed" current={tab} label="Completed" />
        <RequestTab tab="all" current={tab} label="All" />
      </nav>

      <form className="mt-5 flex flex-wrap gap-2">
        <input type="hidden" name="tab" value={tab} />
        <label className="relative min-w-52 flex-1">
          <Search className="text-subtle absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            name="q"
            defaultValue={filters.q}
            className="manage-input pl-10"
            placeholder="Applicant, artist or label…"
          />
        </label>
        <select name="type" defaultValue={type ?? ""} className="manage-filter">
          <option value="">Type: All</option>
          <option value="artist_claim">Artist claim</option>
          <option value="artist_creation">New artist</option>
          <option value="label_creation">New label</option>
        </select>
        <Button variant="secondary">Apply</Button>
      </form>

      <div className="mt-5">
        {applications.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No requests here"
            description="Change the active filters or return later."
          />
        ) : (
          <DataTable
            label="Creator requests"
            columns={[
              "Applicant",
              "Request",
              "Target",
              "Status",
              "Submitted",
              "",
            ]}
          >
            {applications.map((application) => {
              const applicant = related.applicants.get(
                application.applicantUserId,
              );
              const artist = application.artistId
                ? related.artists.get(application.artistId)
                : null;
              return (
                <tr key={application.id}>
                  <DataCell>
                    <p className="font-medium">
                      {applicant?.displayName ??
                        applicant?.username ??
                        "Nemufy member"}
                    </p>
                    {applicant?.username ? (
                      <p className="text-subtle mt-1 text-xs">
                        @{applicant.username}
                      </p>
                    ) : null}
                  </DataCell>
                  <DataCell>{applicationTypeLabels[application.type]}</DataCell>
                  <DataCell>
                    {application.type === "artist_claim"
                      ? (artist?.displayName ?? artist?.name ?? "Artist")
                      : applicationSubject(application)}
                  </DataCell>
                  <DataCell>
                    <ApplicationStatusBadge status={application.status} />
                  </DataCell>
                  <DataCell>
                    {application.createdAt.toDate().toLocaleDateString()}
                  </DataCell>
                  <DataCell>
                    <Link
                      href={`/manage/admin/requests/${application.id}`}
                      className="text-primary inline-flex items-center gap-1 text-xs font-semibold"
                    >
                      Review <ArrowRight className="size-3" />
                    </Link>
                  </DataCell>
                </tr>
              );
            })}
          </DataTable>
        )}
      </div>

      {page.nextCursor ? (
        <div className="mt-5 flex justify-end">
          <Button asChild variant="secondary">
            <Link href={nextHref(filters, tab, page.nextCursor)}>
              Next page
            </Link>
          </Button>
        </div>
      ) : null}
    </BackofficePage>
  );
}

function RequestTab({
  tab,
  current,
  label,
}: {
  tab: string;
  current: string;
  label: string;
}) {
  return (
    <Link
      href={`/manage/admin/requests?tab=${tab}`}
      className={cn(
        "rounded-full border px-4 py-2 text-xs font-semibold",
        current === tab
          ? "border-primary/30 bg-primary/12 text-primary"
          : "border-border bg-surface text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

function statusesForTab(tab: string): ApplicationStatus[] | undefined {
  if (tab === "pending") return ["pending", "under_review"];
  if (tab === "waiting") return ["needs_information"];
  if (tab === "completed") return ["approved", "rejected", "cancelled"];
  return undefined;
}

function isApplicationType(value?: string): value is ApplicationType {
  return ["artist_claim", "artist_creation", "label_creation"].includes(
    value ?? "",
  );
}

function nextHref(
  filters: { tab?: string; type?: string; q?: string },
  tab: string,
  cursor: string,
) {
  const parameters = new URLSearchParams({ tab, cursor });
  if (filters.type) parameters.set("type", filters.type);
  if (filters.q) parameters.set("q", filters.q);
  return `/manage/admin/requests?${parameters}`;
}

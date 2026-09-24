import Link from "next/link";
import { ChevronRight, Search, Users } from "lucide-react";
import { BackofficePage } from "@/components/manage/backoffice-page";
import { Button } from "@/components/ui/button";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { listUsersPage } from "@/lib/firebase/firestore/repositories/users";
import { getMembershipAccessForUsers } from "@/lib/studio/contexts";

export default async function ManageAdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; cursor?: string }>;
}) {
  const filters = await searchParams;
  const page = await listUsersPage({
    pageToken: filters.cursor,
    maxResults: 50,
  });
  const access = await getMembershipAccessForUsers(
    page.users.map((user) => user.uid),
  );
  const query = filters.q?.trim().toLowerCase() ?? "";
  const users = page.users.filter((user) => {
    const userAccess = access.get(user.uid);
    const matchesSearch =
      !query ||
      [user.username, user.displayName, user.email].some((value) =>
        value?.toLowerCase().includes(query),
      );
    const matchesFilter =
      !filters.filter ||
      (filters.filter === "premium" && user.subscriptionPlan === "premium") ||
      (filters.filter === "artists" && userAccess?.hasArtistMembership) ||
      (filters.filter === "labels" && userAccess?.hasLabelMembership) ||
      (filters.filter === "admins" && user.isAdmin) ||
      (filters.filter === "suspended" &&
        (user.accountStatus === "suspended" || user.authDisabled));
    return matchesSearch && matchesFilter;
  });
  return (
    <BackofficePage
      eyebrow="Administration"
      title="Users"
      description="Account plan and platform access stay clearly separated."
    >
      <form className="mt-8 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search className="text-subtle absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Search users…"
            className="manage-input pl-10"
          />
        </label>
        <select
          name="filter"
          defaultValue={filters.filter ?? ""}
          className="manage-filter sm:w-44"
        >
          <option value="">All users</option>
          <option value="premium">Premium</option>
          <option value="artists">Artists</option>
          <option value="labels">Labels</option>
          <option value="admins">Admins</option>
          <option value="suspended">Suspended</option>
        </select>
        <Button variant="secondary">Search</Button>
      </form>
      <div className="mt-5">
        {users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description="Change the search or access filter."
          />
        ) : (
          <DataTable
            label="Users"
            columns={["User", "Account", "Access", "Status", "Joined", ""]}
          >
            {users.map((user) => {
              const userAccess = access.get(user.uid);
              const accessLabels = [
                "User",
                userAccess?.hasArtistMembership ? "Artist" : null,
                userAccess?.hasLabelMembership ? "Label" : null,
                user.isAdmin ? "Admin" : null,
              ].filter(Boolean);
              return (
                <tr key={user.uid}>
                  <DataCell>
                    <Link
                      href={`/manage/admin/users/${user.uid}`}
                      className="hover:text-primary font-medium"
                    >
                      {user.displayName ?? user.username ?? "Unnamed user"}
                    </Link>
                    <p className="text-subtle mt-1 text-xs">
                      {user.email ?? "No email"}
                    </p>
                  </DataCell>
                  <DataCell>
                    <span className="capitalize">{user.subscriptionPlan}</span>
                  </DataCell>
                  <DataCell>
                    <span className="text-xs">{accessLabels.join(", ")}</span>
                  </DataCell>
                  <DataCell>
                    <StatusBadge
                      status={
                        user.authDisabled ? "suspended" : user.accountStatus
                      }
                    />
                  </DataCell>
                  <DataCell>
                    {user.createdAt.toDate().toLocaleDateString()}
                  </DataCell>
                  <DataCell>
                    <Link
                      href={`/manage/admin/users/${user.uid}`}
                      aria-label={`Open ${user.displayName ?? "user"}`}
                    >
                      <ChevronRight className="text-subtle size-4" />
                    </Link>
                  </DataCell>
                </tr>
              );
            })}
          </DataTable>
        )}
      </div>
      {page.nextPageToken ? (
        <div className="mt-5 flex justify-end">
          <Button asChild variant="secondary">
            <Link href={nextUsersPageHref(filters, page.nextPageToken)}>
              Next page <ChevronRight />
            </Link>
          </Button>
        </div>
      ) : null}
    </BackofficePage>
  );
}

function nextUsersPageHref(
  filters: { q?: string; filter?: string },
  cursor: string,
) {
  const parameters = new URLSearchParams();
  if (filters.q) parameters.set("q", filters.q);
  if (filters.filter) parameters.set("filter", filters.filter);
  parameters.set("cursor", cursor);
  return `/manage/admin/users?${parameters}`;
}

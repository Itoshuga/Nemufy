import Link from "next/link";
import { Users } from "lucide-react";
import { ManagementPageHeader } from "@/components/studio/page-header";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { listUsers } from "@/lib/firebase/firestore/repositories/users";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const filters = await searchParams;
  const query = filters.q?.trim().toLowerCase() ?? "";
  const users = (await listUsers()).filter((user) => {
    const matchesSearch =
      !query ||
      [user.uid, user.username, user.displayName, user.email].some((value) =>
        value?.toLowerCase().includes(query),
      );
    const matchesFilter =
      !filters.filter ||
      (filters.filter === "premium"
        ? user.subscriptionPlan === "premium"
        : filters.filter === "suspended"
          ? user.accountStatus === "suspended"
          : user.capabilities[
              filters.filter as keyof typeof user.capabilities
            ]);
    return matchesSearch && matchesFilter;
  });
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Accounts"
        title="Users"
        description="Search identity data, inspect subscriptions and manage platform capabilities."
      />
      <form className="border-border bg-surface mt-8 grid gap-3 rounded-2xl border p-4 sm:grid-cols-[1fr_200px_auto]">
        <input
          name="q"
          defaultValue={filters.q}
          placeholder="Username, display name, email or UID"
          className="border-border bg-background rounded-xl border px-3 py-2.5 text-sm"
        />
        <select
          name="filter"
          defaultValue={filters.filter ?? ""}
          className="border-border bg-background rounded-xl border px-3 py-2.5 text-sm"
        >
          <option value="">All users</option>
          <option value="premium">Premium</option>
          <option value="artist">Artist capability</option>
          <option value="label">Label capability</option>
          <option value="admin">Admin</option>
          <option value="suspended">Suspended</option>
        </select>
        <button className="bg-primary text-primary-foreground rounded-full px-5 text-sm font-semibold">
          Search
        </button>
      </form>
      <div className="mt-6">
        {users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description="Change the search or capability filter."
          />
        ) : (
          <DataTable
            label="Users"
            columns={[
              "User",
              "Email",
              "Status",
              "Subscription",
              "Capabilities",
              "Created",
            ]}
          >
            {users.map((user) => (
              <tr key={user.uid}>
                <DataCell>
                  <Link
                    href={`/admin/users/${user.uid}`}
                    className="text-primary font-medium"
                  >
                    {user.displayName ?? user.username ?? "Unnamed user"}
                  </Link>
                  <p className="text-subtle mt-1 max-w-56 truncate text-xs">
                    {user.uid}
                  </p>
                </DataCell>
                <DataCell>{user.email ?? "—"}</DataCell>
                <DataCell>
                  <StatusBadge status={user.accountStatus} />
                </DataCell>
                <DataCell>
                  <StatusBadge status={user.subscriptionPlan} />
                </DataCell>
                <DataCell>
                  <span className="text-xs">
                    {Object.entries(user.capabilities)
                      .filter(([, enabled]) => enabled)
                      .map(([name]) => name)
                      .join(", ") || "user"}
                  </span>
                </DataCell>
                <DataCell>
                  {user.createdAt.toDate().toLocaleDateString()}
                </DataCell>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  );
}

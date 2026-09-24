import { BackofficePage } from "@/components/manage/backoffice-page";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { getAdminOverviewCounts } from "@/lib/firebase/firestore/repositories/admin-dashboard";
import { listCategories } from "@/lib/firebase/firestore/repositories/categories";

export default async function ManageAdminPlatformPage() {
  const [counts, categories] = await Promise.all([
    getAdminOverviewCounts(),
    listCategories(),
  ]);
  return (
    <BackofficePage
      eyebrow="Administration"
      title="Platform"
      description="Only platform data that Nemufy actually manages today."
    >
      <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="Categories" value={categories.length} />
        <Metric label="Published tracks" value={counts.publishedTracks} />
        <Metric label="Playlists" value={counts.playlists} />
      </div>
      <section className="mt-10 max-w-4xl">
        <h2 className="mb-4 font-semibold">Categories</h2>
        <DataTable
          label="Categories"
          columns={["Category", "Description", "Slug"]}
        >
          {categories.map((category) => (
            <tr key={category.id}>
              <DataCell>
                <p className="font-medium">{category.name}</p>
              </DataCell>
              <DataCell>
                <p className="text-muted-foreground max-w-lg text-xs">
                  {category.description}
                </p>
              </DataCell>
              <DataCell>{category.slug}</DataCell>
            </tr>
          ))}
        </DataTable>
      </section>
    </BackofficePage>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-border bg-surface rounded-2xl border p-5">
      <p className="font-display text-3xl font-semibold">{value}</p>
      <p className="text-subtle mt-2 text-[10px] font-semibold tracking-wide uppercase">
        {label}
      </p>
    </div>
  );
}

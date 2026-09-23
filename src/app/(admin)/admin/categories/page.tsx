import { Tags } from "lucide-react";
import { ManagementPageHeader } from "@/components/studio/page-header";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { listCategories } from "@/lib/firebase/firestore/repositories/categories";

export default async function AdminCategoriesPage() {
  const categories = await listCategories();
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Catalog"
        title="Categories"
        description="Read-only catalog taxonomy overview. Editorial mutation workflows belong to the prepared Platform area."
      />
      <div className="mt-8">
        {categories.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="No categories"
            description="Seed the development catalog or add the first editorial taxonomy through a future Platform workflow."
          />
        ) : (
          <DataTable
            label="Catalog categories"
            columns={["Category", "Slug", "Description"]}
          >
            {categories.map((category) => (
              <tr key={category.id}>
                <DataCell className="font-medium">{category.name}</DataCell>
                <DataCell>{category.slug}</DataCell>
                <DataCell>{category.description}</DataCell>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  );
}

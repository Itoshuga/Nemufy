import type { Metadata } from "next";
import { SearchExperience } from "@/components/search/search-experience";
import { getCatalog } from "@/data/catalog";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const q = (await searchParams).q;
  const initialQuery = Array.isArray(q) ? (q[0] ?? "") : (q ?? "");
  const catalog = await getCatalog();
  return (
    <div className="page-container">
      <div className="mb-8">
        <p className="text-primary mb-2 text-[11px] font-semibold tracking-[.18em] uppercase">
          Search & discover
        </p>
        <h1 className="font-display text-foreground text-4xl font-semibold tracking-[-.045em] sm:text-5xl">
          Find your sound
        </h1>
      </div>
      <SearchExperience initialQuery={initialQuery} catalog={catalog} />
    </div>
  );
}

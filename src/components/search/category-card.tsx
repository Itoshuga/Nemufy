import Link from "next/link";
import type { AsmrCategory } from "@/types/catalog";
import { CoverImage } from "@/components/media/cover-image";

export function CategoryCard({ category }: { category: AsmrCategory }) {
  return (
    <Link
      href={`/search?q=${encodeURIComponent(category.name)}`}
      className="group focus-visible:ring-ring relative isolate aspect-[1.5] overflow-hidden rounded-2xl border border-white/5 p-5 transition-transform outline-none hover:-translate-y-0.5 focus-visible:ring-2"
    >
      <CoverImage
        src={category.artwork}
        alt=""
        sizes="(max-width: 768px) 50vw, 260px"
        className="absolute inset-0 -z-10"
        imageClassName="transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
      <div className="flex h-full flex-col justify-end">
        <h3 className="text-lg font-semibold text-white">{category.name}</h3>
        <p className="mt-1 line-clamp-1 text-xs text-white/70">
          {category.description}
        </p>
      </div>
    </Link>
  );
}

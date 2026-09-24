import Link from "next/link";
import { Building2, Disc3, Shield } from "lucide-react";
import { BackofficePage } from "@/components/manage/backoffice-page";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getStudioContexts } from "@/lib/studio/contexts";

export default async function ManageHomePage() {
  const { user } = await requireActiveUser();
  const contexts = await getStudioContexts(user.uid);
  return (
    <BackofficePage
      eyebrow="Nemufy Backoffice"
      title="What are you managing?"
      description="Choose an artist, label or platform context. This selection changes the workspace—not your permissions."
    >
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {contexts.map((context) => {
          const Icon = context.type === "artist" ? Disc3 : Building2;
          return (
            <Link
              key={`${context.type}:${context.id}`}
              href={`/manage/${context.type}s/${context.id}`}
              className="border-border bg-surface hover:border-primary/40 hover:bg-surface-hover group rounded-2xl border p-5 transition-colors"
            >
              <span className="bg-primary/10 text-primary grid size-11 place-items-center rounded-xl">
                <Icon className="size-5" />
              </span>
              <p className="mt-5 font-semibold">{context.name}</p>
              <p className="text-subtle mt-1 text-xs capitalize">
                {context.type} · {context.role}
              </p>
            </Link>
          );
        })}
        {user.claims.admin ? (
          <Link
            href="/manage/admin"
            className="border-border bg-surface hover:border-primary/40 hover:bg-surface-hover group rounded-2xl border p-5 transition-colors"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-rose-400/10 text-rose-200">
              <Shield className="size-5" />
            </span>
            <p className="mt-5 font-semibold">Administration</p>
            <p className="text-subtle mt-1 text-xs">Nemufy · Global access</p>
          </Link>
        ) : null}
      </div>
    </BackofficePage>
  );
}

import Link from "next/link";
import { Building2, Disc3 } from "lucide-react";
import { CreateEntityForm } from "@/components/studio/create-entity-form";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getStudioContexts } from "@/lib/studio/contexts";

export default async function StudioHomePage() {
  const { user, profile } = await requireActiveUser();
  const contexts = await getStudioContexts(user.uid);
  return (
    <div>
      <p className="text-primary text-xs font-semibold tracking-[.16em] uppercase">
        Workspace
      </p>
      <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Choose what you manage
      </h1>
      <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6">
        A context selects an artist or label. Your membership still decides
        every action available inside it.
      </p>

      {contexts.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {contexts.map((context) => {
            const Icon = context.type === "artist" ? Disc3 : Building2;
            return (
              <Link
                key={`${context.type}:${context.id}`}
                href={`/studio/${context.type}s/${context.id}/overview`}
                className="border-border bg-surface hover:border-primary/45 hover:bg-surface-hover group rounded-2xl border p-5 transition-colors"
              >
                <div className="bg-primary/12 text-primary grid size-11 place-items-center rounded-xl">
                  <Icon className="size-5" />
                </div>
                <p className="mt-5 font-semibold">{context.name}</p>
                <p className="text-subtle mt-1 text-xs capitalize">
                  {context.type} · {context.role}
                </p>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="border-border bg-surface/60 mt-8 rounded-2xl border border-dashed p-8 text-center">
          <p className="font-semibold">No management context yet</p>
          <p className="text-muted-foreground mt-2 text-sm">
            Create the first entity allowed by your platform capabilities.
          </p>
        </div>
      )}

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {(profile.capabilities.artist || user.claims.admin) && (
          <CreateEntityForm type="artist" />
        )}
        {(profile.capabilities.label || user.claims.admin) && (
          <CreateEntityForm type="label" />
        )}
      </div>
    </div>
  );
}

import { SessionRefreshPanel } from "@/components/auth/session-refresh-panel";

export default async function RefreshSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; claim?: string }>;
}) {
  const parameters = await searchParams;
  const destination = sanitizeDestination(parameters.next);
  const requiredClaim = parameters.claim === "admin" ? "admin" : null;
  return (
    <SessionRefreshPanel
      destination={destination}
      requiredClaim={requiredClaim}
    />
  );
}

function sanitizeDestination(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function hasTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!origin || !configuredUrl) return false;

  try {
    return new URL(origin).origin === new URL(configuredUrl).origin;
  } catch {
    return false;
  }
}

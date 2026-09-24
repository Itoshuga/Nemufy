export function hasTrustedOrigin(request: Request) {
  const requestOrigin = parseOrigin(request.headers.get("origin"));
  if (!requestOrigin) return false;

  const trustedOrigins = new Set<string>();
  const requestUrl = parseUrl(request.url);
  if (requestUrl) trustedOrigins.add(requestUrl.origin);

  const forwardedHost = firstHeaderValue(
    request.headers.get("x-forwarded-host"),
  );
  const host = forwardedHost ?? firstHeaderValue(request.headers.get("host"));
  const forwardedProtocol = firstHeaderValue(
    request.headers.get("x-forwarded-proto"),
  );
  const protocol = forwardedProtocol ?? requestUrl?.protocol.replace(":", "");

  if (host && (protocol === "http" || protocol === "https")) {
    const forwardedOrigin = parseOrigin(`${protocol}://${host}`);
    if (forwardedOrigin) trustedOrigins.add(forwardedOrigin);
  }

  const configuredOrigin = parseOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (configuredOrigin) trustedOrigins.add(configuredOrigin);

  return trustedOrigins.has(requestOrigin);
}

function firstHeaderValue(value: string | null) {
  return value?.split(",", 1)[0]?.trim() || null;
}

function parseOrigin(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

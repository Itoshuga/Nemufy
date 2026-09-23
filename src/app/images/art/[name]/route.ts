const palettes = [
  ["#171a43", "#8978da", "#d8cfff"],
  ["#12343a", "#5fa6a0", "#d8f5e9"],
  ["#341b3b", "#b36aa3", "#f3c6dd"],
  ["#182d4a", "#5d8ab9", "#c9def2"],
  ["#3a261d", "#b77e5d", "#f4d0b4"],
  ["#20263f", "#6675a8", "#c7d0f0"],
  ["#3a1637", "#8d589a", "#e0bde7"],
] as const;

const hashName = (name: string) =>
  [...name].reduce((hash, character) => hash + character.charCodeAt(0), 0);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const hash = hashName(name);
  const palette = palettes[hash % palettes.length];
  const isBanner = name.startsWith("banner");
  const isAvatar = name.startsWith("avatar");
  const width = isBanner ? 1600 : 800;
  const height = isBanner ? 620 : 800;
  const label = name
    .replace(/\.svg$/, "")
    .replace(/^(avatar|banner|release|playlist|category)-/, "")
    .replaceAll("-", " ");
  const initials = label
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const safeLabel = label.replace(/[<>&'\"]/g, "");
  const artwork = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${palette[0]}"/>
          <stop offset="0.58" stop-color="${palette[1]}"/>
          <stop offset="1" stop-color="${palette[2]}"/>
        </linearGradient>
        <filter id="blur"><feGaussianBlur stdDeviation="42"/></filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <circle cx="${width * 0.76}" cy="${height * 0.22}" r="${height * 0.22}" fill="${palette[2]}" opacity=".22" filter="url(#blur)"/>
      <circle cx="${width * 0.18}" cy="${height * 0.78}" r="${height * 0.27}" fill="${palette[1]}" opacity=".28" filter="url(#blur)"/>
      <path d="M0 ${height * 0.68} Q ${width * 0.28} ${height * 0.52}, ${width * 0.54} ${height * 0.72} T ${width} ${height * 0.58} V ${height} H0Z" fill="${palette[0]}" opacity=".28"/>
      ${
        isAvatar
          ? `<circle cx="${width / 2}" cy="${height / 2}" r="${height * 0.27}" fill="none" stroke="white" stroke-opacity=".38" stroke-width="3"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="white" fill-opacity=".92" font-family="system-ui" font-size="${height * 0.18}" font-weight="500" letter-spacing="8">${initials}</text>`
          : `<text x="7%" y="88%" fill="white" fill-opacity=".78" font-family="system-ui" font-size="${Math.min(width, height) * 0.055}" font-weight="500" letter-spacing="4">${safeLabel.toUpperCase()}</text>`
      }
    </svg>`;

  return new Response(artwork, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

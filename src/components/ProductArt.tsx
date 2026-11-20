/**
 * Ilustración SVG generada por código para cada producto, según su categoría.
 * Se usa cuando el producto no tiene una imagen cargada.
 */
const PALETTES = [
  ["#3cf0ff", "#b26bff"],
  ["#00ffa3", "#3cf0ff"],
  ["#ff4fd8", "#7c5cff"],
  ["#ffb84f", "#ff4f7b"],
  ["#5c8dff", "#3cf0ff"],
  ["#c6ff3d", "#00d1a0"],
];

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function Shape({ category, c1, c2, gid }: { category: string; c1: string; c2: string; gid: string }) {
  const stroke = { stroke: `url(#${gid})`, strokeWidth: 3, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (category) {
    case "teclados":
      return (
        <g>
          <rect x="40" y="115" width="220" height="80" rx="14" {...stroke} />
          {Array.from({ length: 3 }).flatMap((_, r) =>
            Array.from({ length: 10 }).map((_, c) => (
              <rect key={`${r}-${c}`} x={52 + c * 20.5} y={127 + r * 18} width="15" height="13" rx="3" fill={c1} opacity={0.18 + ((r + c) % 4) * 0.12} />
            )),
          )}
          <rect x="95" y="181" width="110" height="7" rx="3" fill={c2} opacity="0.6" />
        </g>
      );
    case "mouses":
      return (
        <g>
          <path d="M150 70c-36 0-58 30-58 70v40c0 40 26 66 58 66s58-26 58-66v-40c0-40-22-70-58-70z" {...stroke} />
          <path d="M150 70v62M92 132h116" {...stroke} opacity="0.6" />
          <rect x="144" y="92" width="12" height="24" rx="6" fill={c1} />
          <path d="M100 200c14 18 86 18 100 0" stroke={c2} strokeWidth="6" fill="none" opacity="0.5" />
        </g>
      );
    case "auriculares":
      return (
        <g>
          <path d="M80 170v-28c0-42 31-74 70-74s70 32 70 74v28" {...stroke} />
          <rect x="62" y="158" width="44" height="66" rx="18" {...stroke} />
          <rect x="194" y="158" width="44" height="66" rx="18" {...stroke} />
          <rect x="72" y="172" width="24" height="38" rx="10" fill={c1} opacity="0.35" />
          <rect x="204" y="172" width="24" height="38" rx="10" fill={c2} opacity="0.35" />
        </g>
      );
    case "monitores":
      return (
        <g>
          <rect x="45" y="70" width="210" height="130" rx="10" {...stroke} />
          <rect x="57" y="82" width="186" height="106" rx="4" fill={c1} opacity="0.12" />
          <path d="M70 165l40-38 30 24 45-52 45 66" stroke={c2} strokeWidth="4" fill="none" strokeLinejoin="round" opacity="0.8" />
          <path d="M150 200v26M112 230h76" {...stroke} />
        </g>
      );
    case "streaming":
      return (
        <g>
          <rect x="120" y="60" width="60" height="110" rx="30" {...stroke} />
          {Array.from({ length: 5 }).map((_, i) => (
            <path key={i} d={`M128 ${84 + i * 15}h44`} stroke={c1} strokeWidth="3" opacity="0.4" />
          ))}
          <path d="M100 130v8c0 28 22 50 50 50s50-22 50-50v-8M150 188v32M118 228h64" {...stroke} />
          <circle cx="232" cy="78" r="8" fill={c2} opacity="0.85" />
        </g>
      );
    default:
      return (
        <g>
          <rect x="40" y="95" width="220" height="120" rx="18" {...stroke} />
          <rect x="52" y="107" width="196" height="96" rx="10" fill={c1} opacity="0.1" />
          <path d="M60 195c40-60 120-60 180-40" stroke={c2} strokeWidth="4" fill="none" opacity="0.7" />
          <circle cx="190" cy="150" r="20" {...stroke} />
        </g>
      );
  }
}

export function ProductArt({ seed, category, label }: { seed: string; category: string; label?: string }) {
  const [c1, c2] = PALETTES[hash(seed) % PALETTES.length];
  const gid = `p${hash(seed)}`;
  return (
    <svg viewBox="0 0 300 300" className="h-full w-full" role="img" aria-label={label ?? "Imagen del producto"}>
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="40" y1="60" x2="260" y2="240">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
        <radialGradient id={`${gid}-glow`} cx="0.5" cy="0.55" r="0.55">
          <stop offset="0" stopColor={c1} stopOpacity="0.28" />
          <stop offset="1" stopColor={c1} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="300" height="300" fill="#0b0e17" />
      <rect width="300" height="300" fill={`url(#${gid}-glow)`} />
      <g style={{ filter: `drop-shadow(0 0 10px ${c1}66)` }}>
        <Shape category={category} c1={c1} c2={c2} gid={gid} />
      </g>
    </svg>
  );
}

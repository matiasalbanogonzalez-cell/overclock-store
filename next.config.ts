import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // En GitHub Codespaces la página se abre desde *.app.github.dev a través de un proxy.
  // Sin esto, Next.js rechaza los formularios (Server Actions) por seguridad.
  ...(process.env.CODESPACES === "true" && {
    experimental: { serverActions: { allowedOrigins: ["*.app.github.dev", "localhost:3000"] } },
  }),
  images: {
    // Permite imágenes de productos cargadas por URL desde el panel de admin
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;

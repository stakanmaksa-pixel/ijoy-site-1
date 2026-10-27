import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone-сборка нужна для лёгкого production-образа в Docker
  // (см. Dockerfile) — копируется только необходимый рантайм, без node_modules.
  output: "standalone",
  // Next 16.3.1 gzip can stall streamed product pages under backpressure.
  // Keep responses uncompressed here; a future reverse proxy can compress them.
  compress: false,
};

export default nextConfig;

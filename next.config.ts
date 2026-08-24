import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone-сборка нужна для лёгкого production-образа в Docker
  // (см. Dockerfile) — копируется только необходимый рантайм, без node_modules.
  output: "standalone",
};

export default nextConfig;

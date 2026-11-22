import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client", "libsql"],
  // Migrations are read at runtime when a learner's database is first opened.
  outputFileTracingIncludes: { "/**": ["./drizzle/**/*"] },
  devIndicators: false,
};

export default nextConfig;

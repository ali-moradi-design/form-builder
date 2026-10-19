import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/shared/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // PGlite loads its WebAssembly files from its own folder, so it must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite"],
  // The repo keeps its own agent notes in CLAUDE.md.
  agentRules: false,
};

export default withNextIntl(nextConfig);

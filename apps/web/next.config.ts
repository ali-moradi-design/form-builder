import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/shared/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The repo keeps its own agent notes in CLAUDE.md.
  agentRules: false,
};

export default withNextIntl(nextConfig);

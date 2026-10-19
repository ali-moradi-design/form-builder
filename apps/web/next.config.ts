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
  headers() {
    return Promise.resolve([
      // Only published forms may be shown in frames on other sites (embeds);
      // the builder and the rest of the app may not (clickjacking).
      ...["/", "/:path((?!f/|embed\\.js$).*)"].map((source) => ({
        source,
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      })),
      {
        source: "/f/:slug*",
        headers: [{ key: "Content-Security-Policy", value: "frame-ancestors *" }],
      },
    ]);
  },
};

export default withNextIntl(nextConfig);

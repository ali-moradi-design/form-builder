import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/shared/i18n/request.ts");

// The JSON editor (Monaco) loads from jsDelivr. Forms may show https images
// (picture choice) and load option lists from https URLs.
const CDN = "https://cdn.jsdelivr.net";
const csp = (frames: string) =>
  [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${CDN}${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
    `style-src 'self' 'unsafe-inline' ${CDN}`,
    `font-src 'self' data: ${CDN}`,
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${frames}`,
  ].join("; ");

const common = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The server image holds only .next/standalone (scripts/standalone.mjs completes it).
  // The monorepo root is the tracing root, so the workspace packages are traced too.
  output: "standalone",
  outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)),
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
          ...common,
          { key: "Content-Security-Policy", value: csp("'self'") },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      })),
      {
        source: "/f/:slug*",
        headers: [...common, { key: "Content-Security-Policy", value: csp("*") }],
      },
    ]);
  },
};

export default withNextIntl(nextConfig);

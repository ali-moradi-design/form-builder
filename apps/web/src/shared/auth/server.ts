import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { getDb, tables } from "@/shared/db";

// Development only: production must set BETTER_AUTH_SECRET (Better Auth refuses to start otherwise).
const DEV_SECRET = "formcanvas-development-secret-not-for-production-use-0123456789";

async function createAuth() {
  const db = await getDb();
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: tables.user,
        session: tables.session,
        account: tables.account,
        verification: tables.verification,
      },
    }),
    secret:
      process.env.BETTER_AUTH_SECRET ??
      (process.env.NODE_ENV === "production" ? undefined : DEV_SECRET),
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: { enabled: true, minPasswordLength: 8, autoSignIn: true },
    telemetry: { enabled: false },
    // On by default in production; the end-to-end tests sign up many accounts from one address.
    rateLimit: {
      enabled: process.env.NODE_ENV === "production" && process.env.AUTH_RATE_LIMIT !== "off",
    },
    plugins: [nextCookies()],
  });
}

/** The Better Auth instance (created once per server process). */
export type Auth = Awaited<ReturnType<typeof createAuth>>;

const globalAuth = globalThis as unknown as { formcanvasAuth?: Promise<Auth> };

/** Returns the shared auth instance. */
export function getAuth(): Promise<Auth> {
  globalAuth.formcanvasAuth ??= createAuth();
  return globalAuth.formcanvasAuth;
}

/** The signed-in user of the current request, or `null`. */
export async function getUser(): Promise<{ id: string; name: string; email: string } | null> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  return session
    ? { id: session.user.id, name: session.user.name, email: session.user.email }
    : null;
}

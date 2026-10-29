// After `next build`: completes .next/standalone so it runs on its own
// (`node apps/web/server.js`). Next.js leaves public/ and .next/static out of
// it (see the Next.js docs for `output: "standalone"`), and the database
// migrations are read from disk at start (src/shared/db/client.ts).
import { cpSync } from "node:fs";
import { fileURLToPath } from "node:url";

const app = fileURLToPath(new URL("../", import.meta.url));
const target = `${app}.next/standalone/apps/web/`;
cpSync(`${app}public`, `${target}public`, { recursive: true });
cpSync(`${app}.next/static`, `${target}.next/static`, { recursive: true });
cpSync(`${app}drizzle`, `${target}drizzle`, { recursive: true });
console.log("standalone: public/, .next/static and drizzle/ copied");

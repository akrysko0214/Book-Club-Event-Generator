// Creates the tables Better Auth needs (user, session, account, verification)
// in the Neon database. Run with: npm run db:migrate
import { getMigrations } from "better-auth/db/migration";

const { auth } = await import("../src/lib/auth.ts");
const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(
  auth.options,
);

if (toBeCreated.length === 0 && toBeAdded.length === 0) {
  console.log("Database is already up to date.");
} else {
  await runMigrations();
  console.log(
    "Created tables:",
    toBeCreated.map((t) => t.table).join(", ") || "none",
  );
}

await auth.options.database.end();

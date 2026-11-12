// Creates the tables Better Auth needs (user, session, account, verification,
// subscription) plus the app's own book_pick and event_plan tables in the
// Neon database.
// Run with: npm run db:migrate
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

// Books the planner has chosen for each user, so it can avoid repeats.
const { db } = await import("../src/lib/auth.ts");
await db.query(`
  create table if not exists book_pick (
    id serial primary key,
    "userId" text not null references "user"(id) on delete cascade,
    title text not null,
    author text not null,
    "createdAt" timestamptz not null default now()
  )
`);
await db.query(
  `create index if not exists book_pick_user_idx on book_pick ("userId", "createdAt" desc)`,
);
console.log("book_pick table is ready.");

// Every event plan a user generates, for the My events page and invitations.
await db.query(`
  create table if not exists event_plan (
    id text primary key,
    "userId" text not null references "user"(id) on delete cascade,
    "bookTitle" text not null,
    "bookAuthor" text not null,
    "themeName" text not null,
    guests integer,
    venue text,
    "eventTime" text,
    "guestEmails" text[] not null default '{}',
    plan jsonb not null,
    "invitationsSentAt" timestamptz,
    "createdAt" timestamptz not null default now()
  )
`);
await db.query(
  `create index if not exists event_plan_user_idx on event_plan ("userId", "createdAt" desc)`,
);
console.log("event_plan table is ready.");

await db.end();

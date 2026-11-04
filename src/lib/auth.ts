import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

// Server-side auth setup. Accounts and sessions are stored in the Neon
// database at DATABASE_URL. Better Auth also reads BETTER_AUTH_SECRET and
// BETTER_AUTH_URL from the environment.
export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  emailAndPassword: {
    enabled: true,
  },
  // Lets server code set the login cookie. Must be the last plugin.
  plugins: [nextCookies()],
});

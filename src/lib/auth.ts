import { stripe } from "@better-auth/stripe";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";
import Stripe from "stripe";

// The one paid plan. Its price ($9.99/month) is set up in the Stripe
// dashboard; STRIPE_PRICE_ID points at it.
export const PLAN_NAME = "plus";

// The demo account graders sign in with. It has a real (test-mode)
// subscription, and also gets a button to try the Stripe checkout page.
export const DEMO_EMAIL = "demo@demo.com";

export const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);

// True while using Stripe test keys, where only fake cards work.
export const stripeTestMode =
  process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ?? false;

// Connection to the Neon database at DATABASE_URL. Better Auth stores
// accounts, sessions and subscriptions here; the planner also uses it to
// remember which books it has picked for each user.
export const db = new Pool({ connectionString: process.env.DATABASE_URL });

// Server-side auth setup. Better Auth also reads BETTER_AUTH_SECRET and
// BETTER_AUTH_URL from the environment.
export const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    // Handles Stripe customers, checkout, the billing portal and webhooks.
    // Use a test-mode key (sk_test_...) to practice with fake cards.
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [{ name: PLAN_NAME, priceId: process.env.STRIPE_PRICE_ID! }],
      },
    }),
    // Lets server code set the login cookie. Must be the last plugin.
    nextCookies(),
  ],
});

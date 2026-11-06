import { stripe } from "@better-auth/stripe";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";
import Stripe from "stripe";

// The one paid plan. Its price ($9.99/month) is set up in the Stripe
// dashboard; STRIPE_PRICE_ID points at it.
export const PLAN_NAME = "plus";

// Server-side auth setup. Accounts, sessions and subscriptions are stored in
// the Neon database at DATABASE_URL. Better Auth also reads
// BETTER_AUTH_SECRET and BETTER_AUTH_URL from the environment.
export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    // Handles Stripe customers, checkout, the billing portal and webhooks.
    // Use a test-mode key (sk_test_...) to practice with fake cards.
    stripe({
      stripeClient: new Stripe(process.env.STRIPE_SECRET_KEY!),
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

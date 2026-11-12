"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, DEMO_EMAIL, stripeClient, stripeTestMode } from "@/lib/auth";

// Opens a real Stripe Checkout page for the $9.99 plan so the demo account
// can see checkout working, even though it's already subscribed. Only for
// the demo account, and only in test mode, so no real card can be charged.
//
// The checkout uses a separate Stripe customer, so finishing it with a test
// card doesn't change the demo account's own subscription.
export async function startDemoCheckout() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.email !== DEMO_EMAIL || !stripeTestMode) {
    redirect("/account");
  }

  const siteUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const checkout = await stripeClient.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    customer_email: session.user.email,
    success_url: `${siteUrl}/account?demo_checkout=success`,
    cancel_url: `${siteUrl}/account`,
  });

  redirect(checkout.url!);
}

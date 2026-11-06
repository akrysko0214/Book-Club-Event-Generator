import { auth } from "@/lib/auth";

// True when the signed-in user has an active (or trialing) subscription.
// Checks our database, which Stripe keeps up to date.
export async function hasActiveSubscription(requestHeaders: Headers) {
  const subscriptions = await auth.api.listActiveSubscriptions({
    headers: requestHeaders,
  });
  return subscriptions.length > 0;
}

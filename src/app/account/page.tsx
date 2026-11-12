import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth, DEMO_EMAIL, stripeTestMode } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { DemoCheckoutCard, ManageBillingButton, SubscribeCard } from "./billing";
import EventPlanner from "./event-planner";
import SignOutButton from "./sign-out-button";

export const metadata: Metadata = { title: "Your account · Booked and Busy" };

export default function AccountPage() {
  return (
    <div className="flex flex-1 flex-col bg-amber-50 px-6 py-10 text-stone-900">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-amber-800">
          ← Booked and Busy
        </Link>
        {/* Reading the session happens per request, so it streams in here. */}
        <Suspense fallback={<p className="mt-4 text-stone-600">Loading your account…</p>}>
          <AccountDetails />
        </Suspense>
      </div>
    </div>
  );
}

async function AccountDetails() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    redirect("/sign-in");
  }

  const { user } = session;
  const subscribed = await hasActiveSubscription(requestHeaders);
  const showDemoCheckout = user.email === DEMO_EMAIL && stripeTestMode;

  return (
    <>
      <div className="mt-4 mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hi, {user.name}!</h1>
          <p className="mt-1 text-stone-600">You&apos;re signed in as {user.email}.</p>
        </div>
        <SignOutButton />
      </div>

      {subscribed ? (
        <>
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-white px-6 py-4 shadow-sm ring-1 ring-amber-100">
            <p className="text-stone-700">
              <span className="font-semibold text-stone-900">Book Club Plus</span> ·
              $9.99/month · Active
            </p>
            <ManageBillingButton />
          </div>
          {showDemoCheckout && <DemoCheckoutCard />}
          <EventPlanner />
        </>
      ) : (
        <SubscribeCard testMode={stripeTestMode} />
      )}
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth, DEMO_EMAIL, stripeTestMode } from "@/lib/auth";
import { listEvents } from "@/lib/events";
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
  const recentEvents = (await listEvents(user.id)).slice(0, 3);

  return (
    <>
      <div className="mt-4 mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hi, {user.name}!</h1>
          <p className="mt-1 text-stone-600">You&apos;re signed in as {user.email}.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/events"
            className="rounded-lg border border-stone-300 px-4 py-2 font-semibold hover:bg-stone-100"
          >
            My events
          </Link>
          <SignOutButton />
        </div>
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
          {recentEvents.length > 0 && (
            <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-amber-100">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-xl font-semibold">Your recent events</h2>
                <Link href="/events" className="text-sm font-semibold text-amber-800 underline">
                  See all
                </Link>
              </div>
              <ul className="mt-3 divide-y divide-stone-100">
                {recentEvents.map((event) => (
                  <li key={event.id}>
                    <Link href={`/events/${event.id}`} className="block py-2 hover:text-amber-800">
                      <span className="font-semibold">{event.plan.theme.name}</span>
                      <span className="text-stone-600"> · {event.plan.book.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <EventPlanner />
        </>
      ) : (
        <SubscribeCard testMode={stripeTestMode} />
      )}
    </>
  );
}

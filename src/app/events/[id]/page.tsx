import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import PlanResults from "@/app/account/plan-results";
import { auth, DEMO_EMAIL } from "@/lib/auth";
import { getEvent } from "@/lib/events";
import { isEmailConfigured } from "@/lib/mailer";

export const metadata: Metadata = { title: "Event plan · Booked and Busy" };

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="flex flex-1 flex-col bg-amber-50 px-6 py-10 text-stone-900">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/events" className="text-sm font-semibold text-amber-800">
          ← My events
        </Link>
        <div className="mt-4">
          {/* Reading the session happens per request, so it streams in here. */}
          <Suspense fallback={<p className="text-stone-600">Loading your event…</p>}>
            <EventDetails params={params} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function EventDetails({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }
  const { id } = await params;
  const event = await getEvent(session.user.id, id);
  if (!event) {
    notFound();
  }
  // The demo account's address isn't a real inbox, so it starts blank.
  const testEmailDefault = session.user.email === DEMO_EMAIL ? "" : session.user.email;
  return (
    <PlanResults
      event={event}
      emailReady={isEmailConfigured()}
      testEmailDefault={testEmailDefault}
    />
  );
}

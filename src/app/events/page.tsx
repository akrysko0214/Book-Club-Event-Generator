import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { formatEventTime } from "@/lib/event-format";
import { listEvents } from "@/lib/events";

export const metadata: Metadata = { title: "My events · Booked and Busy" };

export default function EventsPage() {
  return (
    <div className="flex flex-1 flex-col bg-amber-50 px-6 py-10 text-stone-900">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/account" className="text-sm font-semibold text-amber-800">
          ← Back to planner
        </Link>
        <h1 className="mt-4 text-3xl font-bold">My events</h1>
        <p className="mt-1 text-stone-600">Every event plan you&apos;ve generated.</p>
        {/* Reading the session happens per request, so it streams in here. */}
        <Suspense fallback={<p className="mt-6 text-stone-600">Loading your events…</p>}>
          <EventList />
        </Suspense>
      </div>
    </div>
  );
}

async function EventList() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }
  const events = await listEvents(session.user.id);

  if (!events.length) {
    return (
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-amber-100">
        <p className="text-stone-700">You haven&apos;t generated any events yet.</p>
        <Link
          href="/account"
          className="mt-4 inline-block rounded-lg bg-stone-900 px-5 py-2.5 font-semibold text-white hover:bg-stone-700"
        >
          Plan your first event
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-6 space-y-4">
      {events.map((event) => (
        <li key={event.id}>
          <Link
            href={`/events/${event.id}`}
            className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-amber-100 hover:ring-amber-300"
          >
            <p className="text-sm text-stone-500">
              Created{" "}
              {new Date(event.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="mt-1 text-xl font-semibold">{event.plan.theme.name}</p>
            <p className="text-stone-700">
              {event.plan.book.title} by {event.plan.book.author}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {event.eventTime && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
                  {formatEventTime(event.eventTime)}
                </span>
              )}
              {event.venue && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
                  {event.venue}
                </span>
              )}
              {event.invitationsSentAt ? (
                <span className="rounded-full bg-green-100 px-3 py-1 text-green-800">
                  Invitations sent
                </span>
              ) : event.guestEmails.length > 0 ? (
                <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">
                  Invitations not sent
                </span>
              ) : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

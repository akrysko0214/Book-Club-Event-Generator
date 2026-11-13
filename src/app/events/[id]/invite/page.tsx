import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { auth, DEMO_EMAIL } from "@/lib/auth";
import { getEvent } from "@/lib/events";
import { isEmailConfigured } from "@/lib/mailer";
import InviteEditor from "./invite-editor";

export const metadata: Metadata = { title: "Invitations · Booked and Busy" };

export default function InvitePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="flex flex-1 flex-col bg-amber-50 px-6 py-10 text-stone-900">
      <div className="mx-auto w-full max-w-3xl">
        {/* Reading the session happens per request, so it streams in here. */}
        <Suspense fallback={<p className="text-stone-600">Loading your invitation…</p>}>
          <InviteDetails params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function InviteDetails({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }
  const { id } = await params;
  const event = await getEvent(session.user.id, id);
  if (!event) {
    notFound();
  }

  return (
    <>
      <Link href={`/events/${event.id}`} className="text-sm font-semibold text-amber-800">
        ← Back to the event plan
      </Link>
      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-amber-800">
        Invitations
      </p>
      <h1 className="mt-1 text-3xl font-bold">{event.plan.theme.name}</h1>
      <p className="mt-1 mb-6 text-stone-600">
        {event.plan.book.title} by {event.plan.book.author}
      </p>
      <InviteEditor
        eventId={event.id}
        sentAt={event.invitationsSentAt}
        emailReady={isEmailConfigured()}
        initial={{
          eventTime: event.eventTime ?? "",
          venue: event.venue ?? "",
          guestEmails: event.guestEmails.join(", "),
          notes: "",
          subject: event.inviteSubject ?? "",
          body: event.inviteBody ?? "",
          // The demo account's address isn't a real inbox, so it starts blank.
          testEmail: session.user.email === DEMO_EMAIL ? "" : session.user.email,
        }}
      />
    </>
  );
}

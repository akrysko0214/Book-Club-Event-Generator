"use client";

import { useActionState } from "react";
import {
  sendInvitations,
  sendTestInvitation,
  type InviteState,
  type TestInviteState,
} from "./invitations";

function formatSentAt(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// The "Send invitations" button and "Send a test" form under the invitation
// preview.
export default function SendInvitations({
  eventId,
  guestEmails,
  sentAt,
  emailReady,
  testEmailDefault,
}: {
  eventId: string;
  guestEmails: string[];
  sentAt: string | null;
  emailReady: boolean;
  testEmailDefault: string;
}) {
  const [state, formAction, pending] = useActionState<InviteState>(
    () => sendInvitations(eventId),
    {},
  );
  const sentOn = state.sentAt ?? sentAt;

  if (!emailReady) {
    return (
      <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Email sending isn&apos;t set up yet, so invitations can&apos;t be sent.
      </p>
    );
  }

  return (
    <div className="mt-4">
      {!guestEmails.length ? (
        <p className="text-sm text-stone-600">
          Add guest emails when you plan an event, and we&apos;ll send this
          invitation for you.
        </p>
      ) : (
        <>
          <p className="text-sm text-stone-600">
            <span className="font-semibold">Guests:</span> {guestEmails.join(", ")}
          </p>
          {sentOn ? (
            <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
              Invitations sent to {guestEmails.length} guest
              {guestEmails.length === 1 ? "" : "s"} on {formatSentAt(sentOn)}. Replies
              will come to your email.
            </p>
          ) : (
            <form action={formAction}>
              <button
                type="submit"
                disabled={pending}
                className="mt-3 rounded-lg bg-stone-900 px-5 py-2.5 font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
              >
                {pending
                  ? "Sending…"
                  : `Send invitations to ${guestEmails.length} guest${guestEmails.length === 1 ? "" : "s"}`}
              </button>
            </form>
          )}
          {state.error && (
            <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}
        </>
      )}
      <TestInvitation eventId={eventId} defaultEmail={testEmailDefault} />
    </div>
  );
}

// Lets the host see exactly what guests will get before sending for real.
function TestInvitation({ eventId, defaultEmail }: { eventId: string; defaultEmail: string }) {
  const [state, formAction, pending] = useActionState<TestInviteState, FormData>(
    sendTestInvitation.bind(null, eventId),
    {},
  );

  return (
    <form action={formAction} className="mt-5 border-t border-stone-100 pt-4">
      <label htmlFor={`test-${eventId}`} className="block text-sm font-medium">
        Send a test invitation
      </label>
      <p className="text-xs text-stone-500">
        Get a copy marked &ldquo;[Test]&rdquo; to check how it looks. Your guests
        won&apos;t receive anything.
      </p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id={`test-${eventId}`}
          name="testEmail"
          type="email"
          required
          defaultValue={defaultEmail}
          placeholder="you@example.com"
          className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-stone-300 bg-white px-4 py-2 font-semibold hover:bg-stone-100 disabled:opacity-60"
        >
          {pending ? "Sending test…" : "Send test"}
        </button>
      </div>
      {state.sentTo && !pending && (
        <p className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          Test invitation sent to {state.sentTo}. ({state.remaining} test
          {state.remaining === 1 ? "" : "s"} left for this event.)
        </p>
      )}
      {state.error && !pending && (
        <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}

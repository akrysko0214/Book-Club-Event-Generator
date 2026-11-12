"use client";

import { useActionState } from "react";
import { sendInvitations, type InviteState } from "./invitations";

function formatSentAt(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// The "Send invitations" button under the invitation preview.
export default function SendInvitations({
  eventId,
  guestEmails,
  sentAt,
  emailReady,
}: {
  eventId: string;
  guestEmails: string[];
  sentAt: string | null;
  emailReady: boolean;
}) {
  const [state, formAction, pending] = useActionState<InviteState>(
    () => sendInvitations(eventId),
    {},
  );
  const sentOn = state.sentAt ?? sentAt;

  if (!guestEmails.length) {
    return (
      <p className="mt-4 text-sm text-stone-600">
        Add guest emails when you plan an event, and we&apos;ll send this
        invitation for you.
      </p>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-stone-600">
        <span className="font-semibold">Guests:</span> {guestEmails.join(", ")}
      </p>
      {sentOn ? (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          Invitations sent to {guestEmails.length} guest
          {guestEmails.length === 1 ? "" : "s"} on {formatSentAt(sentOn)}. Replies
          will come to your email.
        </p>
      ) : emailReady ? (
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
      ) : (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Email sending isn&apos;t set up yet, so invitations can&apos;t be sent.
        </p>
      )}
      {state.error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
    </div>
  );
}

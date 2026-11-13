"use client";

import { useActionState } from "react";
import {
  invitationAction,
  type InviteState,
  type InviteValues,
} from "@/app/account/invitations";

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200";
const primaryButton =
  "rounded-lg bg-stone-900 px-5 py-2.5 font-semibold text-white hover:bg-stone-700 disabled:opacity-60";
const secondaryButton =
  "rounded-lg border border-stone-300 bg-white px-4 py-2 font-semibold hover:bg-stone-100 disabled:opacity-60";

function countEmails(text: string) {
  return text.split(/[\s,;]+/).filter(Boolean).length;
}

function formatSentAt(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Step 1: event details and guests. Step 2: generate, edit, test and send the
// invitation. Every button saves what's on screen first.
export default function InviteEditor({
  eventId,
  initial,
  sentAt: initialSentAt,
  emailReady,
}: {
  eventId: string;
  initial: InviteValues;
  sentAt: string | null;
  emailReady: boolean;
}) {
  const [state, formAction, pending] = useActionState<InviteState, FormData>(
    invitationAction.bind(null, eventId),
    {},
  );
  const values = state.values ?? initial;
  const sentAt = state.sentAt ?? initialSentAt;
  const hasDraft = Boolean(values.subject || values.body);
  const guestCount = countEmails(values.guestEmails);

  if (sentAt) {
    return (
      <div className="space-y-6">
        <p className="rounded-2xl bg-green-50 px-6 py-4 text-green-800 ring-1 ring-green-200">
          Invitations sent to {guestCount} guest{guestCount === 1 ? "" : "s"} on{" "}
          {formatSentAt(sentAt)}. Replies will come to your email.
        </p>
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-amber-100">
          <h2 className="text-xl font-semibold">What your guests received</h2>
          <p className="mt-3 text-sm text-stone-500">Subject</p>
          <p className="font-semibold">{values.subject}</p>
          <div className="mt-4 whitespace-pre-line text-stone-700">{values.body}</div>
          <p className="mt-4 text-sm text-stone-600">
            <span className="font-semibold">Guests:</span> {values.guestEmails}
          </p>
        </section>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-amber-100">
        <h2 className="text-xl font-semibold">1. Event details and guests</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Date and time
            <input
              name="eventTime"
              type="datetime-local"
              defaultValue={values.eventTime}
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <label className="block text-sm font-medium">
            Where will it be held?
            <input
              name="venue"
              maxLength={150}
              defaultValue={values.venue}
              placeholder="e.g. my apartment, 12 Elm St."
              className={`mt-1 ${inputClass}`}
            />
          </label>
        </div>
        <label className="mt-4 block text-sm font-medium">
          Guest emails
          <textarea
            name="guestEmails"
            rows={2}
            defaultValue={values.guestEmails}
            placeholder="anna@example.com, adam@example.com"
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Notes for the invitation (optional)
          <textarea
            name="notes"
            rows={2}
            maxLength={500}
            defaultValue={values.notes}
            placeholder="e.g. bring a mug for the tea swap, costumes encouraged, street parking only"
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <button
          type="submit"
          name="intent"
          value="generate"
          disabled={pending}
          className={`mt-4 ${hasDraft ? secondaryButton : primaryButton}`}
        >
          {hasDraft ? "Write a new invitation" : "Generate invitation"}
        </button>
        {hasDraft && (
          <p className="mt-2 text-xs text-stone-500">
            Writing a new one replaces the text below.
          </p>
        )}
      </section>

      {hasDraft && (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-amber-100">
          <h2 className="text-xl font-semibold">2. Edit and send your invitation</h2>
          <label className="mt-4 block text-sm font-medium">
            Subject
            <input
              name="subject"
              maxLength={200}
              defaultValue={values.subject}
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <label className="mt-4 block text-sm font-medium">
            Message
            <textarea
              name="body"
              rows={12}
              maxLength={5000}
              defaultValue={values.body}
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <p className="mt-1 text-xs text-stone-500">
            &ldquo;Warmly,&rdquo; and your name are added at the end. Leave a blank
            line between paragraphs.
          </p>
          <button
            type="submit"
            name="intent"
            value="save"
            disabled={pending}
            className={`mt-4 ${secondaryButton}`}
          >
            Save changes
          </button>

          {emailReady ? (
            <>
              <div className="mt-6 border-t border-stone-100 pt-4">
                <label htmlFor="testEmail" className="block text-sm font-medium">
                  Send a test invitation
                </label>
                <p className="text-xs text-stone-500">
                  Get a copy marked &ldquo;[Test]&rdquo; to check how it looks.
                  Your guests won&apos;t receive anything.
                </p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    id="testEmail"
                    name="testEmail"
                    type="email"
                    defaultValue={values.testEmail}
                    placeholder="you@example.com"
                    className={`flex-1 ${inputClass}`}
                  />
                  <button
                    type="submit"
                    name="intent"
                    value="test"
                    disabled={pending}
                    className={secondaryButton}
                  >
                    Send test
                  </button>
                </div>
              </div>
              <div className="mt-6 border-t border-stone-100 pt-4">
                <button
                  type="submit"
                  name="intent"
                  value="send"
                  disabled={pending || guestCount === 0}
                  onClick={(e) => {
                    if (!window.confirm(`Send this invitation to ${guestCount} guest${guestCount === 1 ? "" : "s"}? You can only send once.`)) {
                      e.preventDefault();
                    }
                  }}
                  className={primaryButton}
                >
                  {guestCount
                    ? `Send to ${guestCount} guest${guestCount === 1 ? "" : "s"}`
                    : "Add guest emails to send"}
                </button>
                <p className="mt-2 text-xs text-stone-500">
                  Each guest gets their own email from invitations@getbookedandbusy.app,
                  and replies go to you. Invitations can only be sent once per event.
                </p>
              </div>
            </>
          ) : (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Email sending isn&apos;t set up yet, so invitations can&apos;t be sent.
            </p>
          )}
        </section>
      )}

      {pending && <p className="text-sm text-stone-600">Working on it…</p>}
      {state.message && !pending && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{state.message}</p>
      )}
      {state.error && !pending && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}

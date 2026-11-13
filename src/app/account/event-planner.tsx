"use client";

import Link from "next/link";
import { useActionState } from "react";
import { generateEventPlan, type PlanState } from "./actions";
import PlanResults from "./plan-results";

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200";

export default function EventPlanner({
  emailReady,
  testEmailDefault,
}: {
  emailReady: boolean;
  testEmailDefault: string;
}) {
  const [state, formAction, pending] = useActionState<PlanState, FormData>(
    generateEventPlan,
    {},
  );

  return (
    <div>
      <form action={formAction} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-amber-100">
        <label htmlFor="book" className="block text-lg font-semibold">
          What are you reading?
        </label>
        <p className="mt-1 text-sm text-stone-600">
          Enter a title (and author, if you like) or paste a short summary of
          the book. Not sure what to read? Click <strong>Choose a book for
          me</strong> or type &ldquo;choose a book for me&rdquo;, and add what
          you&apos;re in the mood for if you like. You&apos;ll get a different
          book each time.
        </p>
        <textarea
          id="book"
          name="book"
          required
          rows={3}
          maxLength={2000}
          defaultValue={state.values?.book}
          placeholder="e.g. The Night Circus by Erin Morgenstern, or a summary like: two young magicians are bound to a secret contest inside a mysterious traveling circus…"
          className={`mt-4 ${inputClass}`}
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-[10rem_1fr]">
          <label className="block text-sm font-medium">
            Number of guests
            <input
              name="guests"
              type="number"
              min={1}
              max={500}
              defaultValue={state.values?.guests}
              placeholder="e.g. 12"
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <label className="block text-sm font-medium">
            Where will it be held?
            <input
              name="venue"
              maxLength={150}
              defaultValue={state.values?.venue}
              placeholder="e.g. my apartment, library meeting room, backyard"
              className={`mt-1 ${inputClass}`}
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[16rem_1fr]">
          <label className="block text-sm font-medium">
            Date and time
            <input
              name="eventTime"
              type="datetime-local"
              defaultValue={state.values?.eventTime}
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <label className="block text-sm font-medium">
            Guest emails (for invitations)
            <textarea
              name="guestEmails"
              rows={2}
              defaultValue={state.values?.guestEmails}
              placeholder="anna@example.com, adam@example.com"
              className={`mt-1 ${inputClass}`}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-stone-500">
          All optional. The plan scales snacks, drinks, decorations and
          activities to fit, builds a schedule from your start time, and writes
          a themed invitation you can email to your guests.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            name="mode"
            value="plan"
            disabled={pending}
            className="rounded-lg bg-stone-900 px-5 py-2.5 font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
          >
            {pending ? "Planning…" : "Generate event"}
          </button>
          {/* formNoValidate lets this button work with the book box empty. */}
          <button
            type="submit"
            name="mode"
            value="choose"
            formNoValidate
            disabled={pending}
            className="rounded-lg border border-stone-300 bg-white px-5 py-2.5 font-semibold hover:bg-stone-100 disabled:opacity-60"
          >
            Choose a book for me
          </button>
        </div>
        {pending && (
          <p className="mt-3 text-sm text-stone-600">
            Creating your custom event. This can take up to a minute…
          </p>
        )}
        {state.error && !pending && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
      </form>

      {state.event && !pending && (
        <div className="mt-8">
          <p className="mb-4 text-sm text-stone-600">
            Saved to{" "}
            <Link href="/events" className="font-semibold text-amber-800 underline">
              My events
            </Link>
            .
          </p>
          <PlanResults
            event={state.event}
            emailReady={emailReady}
            testEmailDefault={testEmailDefault}
          />
        </div>
      )}
    </div>
  );
}

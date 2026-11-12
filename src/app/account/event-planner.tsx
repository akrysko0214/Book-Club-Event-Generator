"use client";

import { useActionState } from "react";
import {
  generateEventPlan,
  type EventPlan,
  type PlanState,
  type PlanValues,
} from "./actions";

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200";

export default function EventPlanner() {
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
          me</strong>, and add what you&apos;re in the mood for here if you like.
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
        <p className="mt-2 text-xs text-stone-500">
          Optional. The plan scales snacks, drinks, decorations and activities to fit.
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

      {state.plan && state.values && !pending && (
        <PlanResults plan={state.plan} values={state.values} />
      )}
    </div>
  );
}

function sizedFor({ guests, venue }: PlanValues) {
  const parts = [guests && `${guests} guests`, venue && `at ${venue}`].filter(Boolean);
  return parts.length ? `Sized for ${parts.join(" ")}` : "";
}

function PlanResults({ plan, values }: { plan: EventPlan; values: PlanValues }) {
  const sizeNote = sizedFor(values);
  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-2xl bg-amber-100 p-6">
        {sizeNote && <p className="mb-2 text-sm text-amber-900">{sizeNote}</p>}
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-900">
          Event plan for {plan.book.title} by {plan.book.author}
        </p>
        <h2 className="mt-2 text-3xl font-bold">{plan.theme.name}</h2>
        {plan.pickReason && (
          <p className="mt-3 rounded-lg bg-white/70 px-4 py-3 text-stone-700">
            <span className="font-semibold">Why we picked this book:</span>{" "}
            {plan.pickReason}
          </p>
        )}
        {plan.spoilers.theme && <SpoilerWarning />}
        <p className="mt-3 text-stone-700">{plan.theme.description}</p>
      </div>

      <Section title="Decorations" spoiler={plan.spoilers.theme}>
        <List items={plan.theme.decorations} />
      </Section>
      <Section title="Activities" spoiler={plan.spoilers.activities}>
        <Ideas items={plan.activities} />
      </Section>
      <div className="grid gap-6 sm:grid-cols-2">
        <Section title="Snacks" spoiler={plan.spoilers.snacks}>
          <Ideas items={plan.snacks} />
        </Section>
        <Section title="Drinks" spoiler={plan.spoilers.drinks}>
          <Ideas items={plan.drinks} />
        </Section>
      </div>
      <Section title="Hosting tips" spoiler={plan.spoilers.hostingTips}>
        <List items={plan.hostingTips} />
      </Section>
      <Section title="Discussion prompts" spoiler={plan.spoilers.discussionPrompts}>
        <ol className="list-decimal space-y-2 pl-5 text-stone-700">
          {plan.discussionPrompts.map((prompt) => (
            <li key={prompt}>{prompt}</li>
          ))}
        </ol>
      </Section>
      <Section title="If you enjoyed this book, read next">
        <ul className="space-y-3">
          {plan.readingList.map((book) => (
            <li key={book.title}>
              <p className="font-semibold">
                {book.title} <span className="font-normal text-stone-600">by {book.author}</span>
              </p>
              <p className="text-stone-700">{book.reason}</p>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Section({
  title,
  spoiler = false,
  children,
}: {
  title: string;
  spoiler?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-amber-100">
      <h3 className="mb-3 text-xl font-semibold">{title}</h3>
      {spoiler && <SpoilerWarning />}
      {children}
    </section>
  );
}

// Shown at the top of any section the AI marked as revealing plot points.
function SpoilerWarning() {
  return (
    <div role="note" className="mb-4 rounded-lg bg-rose-50 px-4 py-3 ring-1 ring-rose-200">
      <h4 className="font-bold uppercase tracking-wide text-rose-800">
        ⚠ Spoiler warning
      </h4>
      <p className="mt-1 text-sm text-rose-800">
        This section reveals major plot points. Skip it if you haven&apos;t
        finished the book.
      </p>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-stone-700">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function Ideas({ items }: { items: { name: string; description: string }[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.name}>
          <p className="font-semibold">{item.name}</p>
          <p className="text-stone-700">{item.description}</p>
        </li>
      ))}
    </ul>
  );
}

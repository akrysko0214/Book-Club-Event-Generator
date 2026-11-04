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
          What is your book club reading?
        </label>
        <p className="mt-1 text-sm text-stone-600">
          Enter a title (and author, if you like), and AI will plan your event.
        </p>
        <input
          id="book"
          name="book"
          required
          maxLength={200}
          defaultValue={state.values?.book}
          placeholder="e.g. The Night Circus by Erin Morgenstern"
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

        <button
          type="submit"
          disabled={pending}
          className="mt-4 w-full rounded-lg bg-stone-900 px-5 py-2.5 font-semibold text-white hover:bg-stone-700 disabled:opacity-60 sm:w-auto"
        >
          {pending ? "Planning…" : "Generate event"}
        </button>
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
        <p className="mt-3 text-stone-700">{plan.theme.description}</p>
      </div>

      <Section title="Decorations">
        <List items={plan.theme.decorations} />
      </Section>
      <Section title="Activities">
        <Ideas items={plan.activities} />
      </Section>
      <div className="grid gap-6 sm:grid-cols-2">
        <Section title="Snacks">
          <Ideas items={plan.snacks} />
        </Section>
        <Section title="Drinks">
          <Ideas items={plan.drinks} />
        </Section>
      </div>
      <Section title="Hosting tips">
        <List items={plan.hostingTips} />
      </Section>
      <Section title="Discussion prompts">
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-amber-100">
      <h3 className="mb-3 text-xl font-semibold">{title}</h3>
      {children}
    </section>
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

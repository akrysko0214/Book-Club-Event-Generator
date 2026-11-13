import Link from "next/link";
import { describeEvent } from "@/lib/event-format";
import type { SavedEvent } from "./actions";

// A full event plan. Used right after generating one and on the My events
// pages.
export default function PlanResults({ event }: { event: SavedEvent }) {
  const { plan } = event;
  const eventNote = describeEvent(event);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-amber-100 p-6">
        {eventNote && <p className="mb-2 text-sm text-amber-900">{eventNote}</p>}
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

      <InvitationsCard event={event} />

      <Section title="Schedule for the evening">
        <ol className="space-y-2">
          {plan.schedule.map((step) => (
            <li key={`${step.time}-${step.activity}`} className="flex gap-4">
              <span className="w-24 shrink-0 font-semibold text-amber-800">{step.time}</span>
              <span className="text-stone-700">{step.activity}</span>
            </li>
          ))}
        </ol>
      </Section>

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

// Invitations are their own step, on a separate page for each event.
function InvitationsCard({ event }: { event: SavedEvent }) {
  const status = event.invitationsSentAt
    ? `Sent to ${event.guestEmails.length} guest${event.guestEmails.length === 1 ? "" : "s"}.`
    : event.inviteSubject
      ? "You have a draft invitation ready to edit and send."
      : "Write a themed invitation with AI, edit it, and email it to your guests.";
  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-amber-100 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-xl font-semibold">Invitations</h3>
        <p className="mt-1 text-stone-600">{status}</p>
      </div>
      <Link
        href={`/events/${event.id}/invite`}
        className="shrink-0 rounded-lg bg-stone-900 px-5 py-2.5 text-center font-semibold text-white hover:bg-stone-700"
      >
        {event.invitationsSentAt
          ? "View invitation"
          : event.inviteSubject
            ? "Edit and send"
            : "Create invitations"}
      </Link>
    </section>
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

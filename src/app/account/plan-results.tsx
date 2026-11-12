import { describeEvent } from "@/lib/event-format";
import type { SavedEvent } from "./actions";
import SendInvitations from "./send-invitations";

// A full event plan. Used right after generating one and on the My events
// pages.
export default function PlanResults({
  event,
  emailReady,
}: {
  event: SavedEvent;
  emailReady: boolean;
}) {
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

      <Section title="Your invitation">
        <div className="rounded-xl bg-amber-50 p-5 ring-1 ring-amber-200">
          <p className="text-sm text-stone-500">Subject</p>
          <p className="font-semibold">{plan.invitation.subject}</p>
          <div className="mt-4 space-y-3 whitespace-pre-line text-stone-700">
            {plan.invitation.body}
          </div>
        </div>
        <SendInvitations
          eventId={event.id}
          guestEmails={event.guestEmails}
          sentAt={event.invitationsSentAt}
          emailReady={emailReady}
        />
      </Section>

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

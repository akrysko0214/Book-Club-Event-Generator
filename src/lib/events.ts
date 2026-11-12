import type { EventPlan, SavedEvent } from "@/app/account/actions";
import { db } from "@/lib/auth";

type EventRow = {
  id: string;
  plan: EventPlan;
  guests: number | null;
  venue: string | null;
  eventTime: string | null;
  guestEmails: string[];
  invitationsSentAt: Date | null;
  createdAt: Date;
};

function toSavedEvent(row: EventRow): SavedEvent & { createdAt: string } {
  return {
    id: row.id,
    plan: row.plan,
    guests: row.guests,
    venue: row.venue,
    eventTime: row.eventTime,
    guestEmails: row.guestEmails,
    invitationsSentAt: row.invitationsSentAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

// A user's saved events, newest first.
export async function listEvents(userId: string) {
  const result = await db.query<EventRow>(
    `select id, plan, guests, venue, "eventTime", "guestEmails", "invitationsSentAt", "createdAt"
     from event_plan where "userId" = $1 order by "createdAt" desc limit 100`,
    [userId],
  );
  return result.rows.map(toSavedEvent);
}

// One saved event, only if it belongs to this user.
export async function getEvent(userId: string, id: string) {
  const result = await db.query<EventRow>(
    `select id, plan, guests, venue, "eventTime", "guestEmails", "invitationsSentAt", "createdAt"
     from event_plan where "userId" = $1 and id = $2`,
    [userId, id],
  );
  return result.rows[0] ? toSavedEvent(result.rows[0]) : null;
}

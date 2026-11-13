import type { EventPlan, SavedEvent } from "@/app/account/actions";
import { db } from "@/lib/auth";

type EventRow = {
  id: string;
  // Plans made before invitations had their own page included one.
  plan: EventPlan & { invitation?: { subject: string; body: string } };
  guests: number | null;
  venue: string | null;
  eventTime: string | null;
  guestEmails: string[];
  invitationsSentAt: Date | null;
  inviteSubject: string | null;
  inviteBody: string | null;
  createdAt: Date;
};

const COLUMNS = `id, plan, guests, venue, "eventTime", "guestEmails", "invitationsSentAt",
  "inviteSubject", "inviteBody", "createdAt"`;

function toSavedEvent(row: EventRow): SavedEvent & { createdAt: string } {
  return {
    id: row.id,
    plan: row.plan,
    guests: row.guests,
    venue: row.venue,
    eventTime: row.eventTime,
    guestEmails: row.guestEmails,
    invitationsSentAt: row.invitationsSentAt?.toISOString() ?? null,
    inviteSubject: row.inviteSubject ?? row.plan.invitation?.subject ?? null,
    inviteBody: row.inviteBody ?? row.plan.invitation?.body ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

// A user's saved events, newest first.
export async function listEvents(userId: string) {
  const result = await db.query<EventRow>(
    `select ${COLUMNS} from event_plan where "userId" = $1 order by "createdAt" desc limit 100`,
    [userId],
  );
  return result.rows.map(toSavedEvent);
}

// One saved event, only if it belongs to this user.
export async function getEvent(userId: string, id: string) {
  const result = await db.query<EventRow>(
    `select ${COLUMNS} from event_plan where "userId" = $1 and id = $2`,
    [userId, id],
  );
  return result.rows[0] ? toSavedEvent(result.rows[0]) : null;
}

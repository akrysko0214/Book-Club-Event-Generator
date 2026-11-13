"use server";

import { headers } from "next/headers";
import { auth, db } from "@/lib/auth";
import { getEvent } from "@/lib/events";
import {
  createResend,
  describeEmailError,
  INVITATION_FROM,
  isEmailConfigured,
} from "@/lib/mailer";
import { hasActiveSubscription } from "@/lib/subscription";

export type InviteState = {
  sentTo?: number;
  sentAt?: string;
  error?: string;
};

export type TestInviteState = {
  sentTo?: string;
  remaining?: number;
  error?: string;
};

const MAX_TEST_INVITES = 5;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Server actions can be called directly, not just from our buttons, so every
// send checks here that the caller is signed in, subscribed, and owns the
// event.
async function authorize(eventId: string) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return { error: "Please sign in to send invitations." } as const;
  }
  if (!(await hasActiveSubscription(requestHeaders))) {
    return { error: "Subscribe to Book Club Plus to send invitations." } as const;
  }
  const event = await getEvent(session.user.id, eventId);
  if (!event) {
    return { error: "We couldn't find that event." } as const;
  }
  if (!isEmailConfigured()) {
    return { error: "Email sending isn't set up yet." } as const;
  }
  return { session, event } as const;
}

type Event = NonNullable<Awaited<ReturnType<typeof getEvent>>>;

// The themed invitation email. A test copy gets a note at the top and a
// "[Test]" subject so it's never mistaken for the real thing.
function buildInvitation(event: Event, host: string, test = false) {
  const { subject, body } = event.plan.invitation;
  const testNote = "This is a test invitation. Your guests haven't been sent anything yet.";
  const text = `${test ? `${testNote}\n\n` : ""}${body}\n\nWarmly,\n${host}\n\nPlanned with Booked and Busy`;
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => `<p style="margin:0 0 16px">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const testBanner = test
    ? `<p style="max-width:560px;margin:0 auto 16px;padding:12px 16px;border-radius:12px;background:#fef3c7;font:14px Arial,sans-serif;color:#92400e">${testNote}</p>`
    : "";
  const html = `
    <div style="background:#fffbeb;padding:32px 16px;font-family:Georgia,serif;color:#292524">
      ${testBanner}
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #fde68a">
        <p style="margin:0 0 8px;font:600 12px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#92400e">
          You're invited
        </p>
        <h1 style="margin:0 0 24px;font-size:28px">${escapeHtml(event.plan.theme.name)}</h1>
        ${paragraphs}
        <p style="margin:24px 0 0">Warmly,<br>${escapeHtml(host)}</p>
      </div>
      <p style="text-align:center;margin:16px 0 0;font:12px Arial,sans-serif;color:#78716c">
        Planned with Booked and Busy
      </p>
    </div>`;
  return { subject: test ? `[Test] ${subject}` : subject, text, html };
}

// Emails the event's themed invitation to each guest, one email per guest so
// guests don't see each other's addresses. Replies go to the host.
export async function sendInvitations(eventId: string): Promise<InviteState> {
  const result = await authorize(eventId);
  if ("error" in result) {
    return { error: result.error };
  }
  const { session, event } = result;
  if (!event.guestEmails.length) {
    return { error: "This event has no guest emails." };
  }

  // Claim the event before sending, so two clicks (or two tabs) can't send
  // the invitations twice.
  const claimed = await db.query(
    `update event_plan set "invitationsSentAt" = now()
     where id = $1 and "invitationsSentAt" is null returning "invitationsSentAt"`,
    [event.id],
  );
  if (!claimed.rowCount) {
    return { error: "Invitations for this event were already sent." };
  }
  const releaseClaim = () =>
    db.query(`update event_plan set "invitationsSentAt" = null where id = $1`, [event.id]);

  const host = session.user.name;
  const message = buildInvitation(event, host);
  try {
    // One batch request: by default Resend sends all of them or none.
    const { error } = await createResend().batch.send(
      event.guestEmails.map((guest) => ({
        from: INVITATION_FROM,
        to: [guest],
        replyTo: `${host} <${session.user.email}>`,
        ...message,
      })),
      // Resend ignores a repeat of this exact request for 24 hours.
      { idempotencyKey: `invitations-${event.id}` },
    );
    if (error) {
      console.error("Resend rejected the invitations:", error);
      await releaseClaim();
      return { error: describeEmailError(error) };
    }
  } catch (error) {
    console.error("Sending invitations failed:", error);
    await releaseClaim();
    return { error: "Something went wrong sending the invitations. Please try again." };
  }

  const sentAt = (claimed.rows[0].invitationsSentAt as Date).toISOString();
  return { sentTo: event.guestEmails.length, sentAt };
}

// Sends one test copy of the invitation to an address the host chooses,
// without touching the guest list. Limited per event to prevent misuse.
export async function sendTestInvitation(
  eventId: string,
  _previous: TestInviteState,
  formData: FormData,
): Promise<TestInviteState> {
  const result = await authorize(eventId);
  if ("error" in result) {
    return { error: result.error };
  }
  const { session, event } = result;

  const to = String(formData.get("testEmail") ?? "").trim().toLowerCase();
  if (!EMAIL_PATTERN.test(to)) {
    return { error: "Please enter a valid email address for the test." };
  }

  const counted = await db.query(
    `update event_plan set "testInvitesSent" = "testInvitesSent" + 1
     where id = $1 and "testInvitesSent" < $2 returning "testInvitesSent"`,
    [event.id, MAX_TEST_INVITES],
  );
  if (!counted.rowCount) {
    return { error: `You've used all ${MAX_TEST_INVITES} test invitations for this event.` };
  }
  const undoCount = () =>
    db.query(
      `update event_plan set "testInvitesSent" = "testInvitesSent" - 1 where id = $1`,
      [event.id],
    );

  const host = session.user.name;
  try {
    const { error } = await createResend().emails.send({
      from: INVITATION_FROM,
      to: [to],
      replyTo: `${host} <${session.user.email}>`,
      ...buildInvitation(event, host, true),
    });
    if (error) {
      console.error("Resend rejected the test invitation:", error);
      await undoCount();
      return { error: describeEmailError(error) };
    }
  } catch (error) {
    console.error("Sending the test invitation failed:", error);
    await undoCount();
    return { error: "Something went wrong sending the test. Please try again." };
  }

  return {
    sentTo: to,
    remaining: MAX_TEST_INVITES - (counted.rows[0].testInvitesSent as number),
  };
}

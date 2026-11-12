"use server";

import { headers } from "next/headers";
import { auth, db } from "@/lib/auth";
import { getEvent } from "@/lib/events";
import { createMailer, fromAddress, isEmailConfigured } from "@/lib/mailer";

export type InviteState = {
  sentTo?: number;
  sentAt?: string;
  error?: string;
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Emails the event's themed invitation to each guest, one email per guest so
// guests don't see each other's addresses. Replies go to the host.
export async function sendInvitations(eventId: string): Promise<InviteState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Please sign in to send invitations." };
  }
  const event = await getEvent(session.user.id, eventId);
  if (!event) {
    return { error: "We couldn't find that event." };
  }
  if (event.invitationsSentAt) {
    return { error: "Invitations for this event were already sent." };
  }
  if (!event.guestEmails.length) {
    return { error: "This event has no guest emails." };
  }
  if (!isEmailConfigured()) {
    return { error: "Email sending isn't set up yet." };
  }

  const host = session.user.name;
  const { subject, body } = event.plan.invitation;
  const text = `${body}\n\nWarmly,\n${host}\n\nPlanned with Booked and Busy`;
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => `<p style="margin:0 0 16px">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const html = `
    <div style="background:#fffbeb;padding:32px 16px;font-family:Georgia,serif;color:#292524">
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

  try {
    const mailer = createMailer();
    for (const guest of event.guestEmails) {
      await mailer.sendMail({
        from: fromAddress(),
        to: guest,
        replyTo: `${host} <${session.user.email}>`,
        subject,
        text,
        html,
      });
    }
  } catch (error) {
    console.error("Sending invitations failed:", error);
    return { error: "Something went wrong sending the invitations. Please try again." };
  }

  const sentAt = new Date().toISOString();
  await db.query(`update event_plan set "invitationsSentAt" = $1 where id = $2`, [
    sentAt,
    event.id,
  ]);
  return { sentTo: event.guestEmails.length, sentAt };
}

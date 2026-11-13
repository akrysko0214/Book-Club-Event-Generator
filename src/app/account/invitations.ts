"use server";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { headers } from "next/headers";
import { z } from "zod";
import { auth, db } from "@/lib/auth";
import { formatEventTime } from "@/lib/event-format";
import { getEvent } from "@/lib/events";
import {
  createResend,
  describeEmailError,
  INVITATION_FROM,
  isEmailConfigured,
} from "@/lib/mailer";
import { hasActiveSubscription } from "@/lib/subscription";

// Everything on the Invitations page form, kept as text so the form can show
// it again after each action.
export type InviteValues = {
  eventTime: string;
  venue: string;
  guestEmails: string;
  notes: string;
  subject: string;
  body: string;
  testEmail: string;
};

export type InviteState = {
  values?: InviteValues;
  error?: string;
  // A short confirmation, e.g. "Invitation saved."
  message?: string;
  sentAt?: string;
};

const MAX_INVITES = 50;
const MAX_TEST_INVITES = 5;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const InvitationSchema = z.object({ subject: z.string(), body: z.string() });

const INVITATION_PROMPT = `You write themed email invitations for book club events and book-inspired parties. Write in the voice of the host, warm and a little playful, matching the event's theme.

subject: short and inviting.
body: 2-3 short paragraphs in plain text (no markdown) that set the mood of the theme, give the date and time, the venue, and anything guests should bring or wear, and ask them to reply to let the host know if they can come. Work in the host's notes if there are any.

Never reveal plot spoilers, since guests may not have finished the book. If the date, time or venue isn't given, write "details to come" for it. Don't add a greeting name or a signature; the host's name is added for you.`;

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type Event = NonNullable<Awaited<ReturnType<typeof getEvent>>>;

// The themed invitation email. A test copy gets a note at the top and a
// "[Test]" subject so it's never mistaken for the real thing.
function buildInvitation(
  event: Event,
  host: string,
  { subject, body }: { subject: string; body: string },
  test = false,
) {
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

async function writeInvitation(event: Event, host: string, values: InviteValues) {
  const { plan } = event;
  const details = [
    `Event theme: ${plan.theme.name}`,
    `Theme description: ${plan.theme.description}`,
    `Book: ${plan.book.title} by ${plan.book.author}`,
    `Date and time: ${values.eventTime ? formatEventTime(values.eventTime) : "not given"}`,
    `Venue: ${values.venue || "not given"}`,
    `Number of guests: ${event.guests ?? "not given"}`,
    `Host's name: ${host}`,
    `Host's notes: ${values.notes || "none"}`,
  ].join("\n");

  // Reads the API key from the ANTHROPIC_API_KEY environment variable.
  const response = await new Anthropic().beta.messages.parse({
    model: "claude-sonnet-5-5",
    max_tokens: 4000,
    // If a safety check declines the request, Anthropic retries it on a
    // fallback model automatically.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(InvitationSchema) },
    system: INVITATION_PROMPT,
    messages: [{ role: "user", content: details }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    return null;
  }
  return response.parsed_output;
}

// Handles every button on the Invitations page: generate, save, send a test,
// and send to guests. Each one saves the details and text on screen first, so
// what gets sent is exactly what the host sees.
//
// Server actions can be called directly, not just from our buttons, so this
// checks that the caller is signed in, subscribed, and owns the event.
export async function invitationAction(
  eventId: string,
  _previous: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const values: InviteValues = {
    eventTime: String(formData.get("eventTime") ?? "").trim(),
    venue: String(formData.get("venue") ?? "").trim(),
    guestEmails: String(formData.get("guestEmails") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
    subject: String(formData.get("subject") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
    testEmail: String(formData.get("testEmail") ?? "").trim(),
  };
  const intent = String(formData.get("intent") ?? "save");

  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return { values, error: "Please sign in to work on invitations." };
  }
  if (!(await hasActiveSubscription(requestHeaders))) {
    return { values, error: "Subscribe to Book Club Plus to create invitations." };
  }
  const event = await getEvent(session.user.id, eventId);
  if (!event) {
    return { values, error: "We couldn't find that event." };
  }
  if (event.invitationsSentAt) {
    return { values, error: "Invitations for this event were already sent." };
  }

  // Check the event details.
  if (values.eventTime && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(values.eventTime)) {
    return { values, error: "Please pick a valid date and time." };
  }
  if (values.venue.length > 150) {
    return { values, error: "Please keep the venue under 150 characters." };
  }
  if (values.notes.length > 500) {
    return { values, error: "Please keep your notes under 500 characters." };
  }
  // Guest emails can be separated by commas, spaces or new lines.
  const guestEmails = [
    ...new Set(
      values.guestEmails
        .split(/[\s,;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  const badEmails = guestEmails.filter((email) => !EMAIL_PATTERN.test(email));
  if (badEmails.length) {
    return { values, error: `These don't look like email addresses: ${badEmails.join(", ")}` };
  }
  if (guestEmails.length > MAX_INVITES) {
    return { values, error: `You can invite up to ${MAX_INVITES} guests per event.` };
  }

  const host = session.user.name;

  if (intent === "generate") {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY is not set.");
      return { values, error: "The AI service isn't set up yet (missing API key)." };
    }
    try {
      const draft = await writeInvitation(event, host, values);
      if (!draft) {
        return { values, error: "Sorry, we couldn't write an invitation. Please try again." };
      }
      values.subject = draft.subject;
      values.body = draft.body;
    } catch (error) {
      console.error("Invitation generation failed:", error);
      return { values, error: "Something went wrong writing the invitation. Please try again." };
    }
  } else {
    // Saving or sending needs the invitation text.
    if (!values.subject || !values.body) {
      return { values, error: "Generate an invitation first, or write a subject and message." };
    }
    if (values.subject.length > 200) {
      return { values, error: "Please keep the subject under 200 characters." };
    }
    if (values.body.length > 5000) {
      return { values, error: "Please keep the message under 5,000 characters." };
    }
  }

  // Save the details and the invitation text.
  await db.query(
    `update event_plan set "eventTime" = $1, venue = $2, "guestEmails" = $3,
       "inviteSubject" = $4, "inviteBody" = $5
     where id = $6 and "userId" = $7`,
    [
      values.eventTime || null,
      values.venue || null,
      guestEmails,
      values.subject || null,
      values.body || null,
      event.id,
      session.user.id,
    ],
  );
  values.guestEmails = guestEmails.join(", ");

  if (intent === "generate") {
    return { values, message: "Invitation written. Edit it below, then send a test or send it." };
  }
  if (intent === "save") {
    return { values, message: "Invitation saved." };
  }

  if (!isEmailConfigured()) {
    return { values, error: "Email sending isn't set up yet." };
  }
  const text = { subject: values.subject, body: values.body };

  if (intent === "test") {
    const to = values.testEmail.toLowerCase();
    if (!EMAIL_PATTERN.test(to)) {
      return { values, error: "Please enter a valid email address for the test." };
    }
    // Limit test sends per event to prevent misuse.
    const counted = await db.query(
      `update event_plan set "testInvitesSent" = "testInvitesSent" + 1
       where id = $1 and "testInvitesSent" < $2 returning "testInvitesSent"`,
      [event.id, MAX_TEST_INVITES],
    );
    if (!counted.rowCount) {
      return { values, error: `You've used all ${MAX_TEST_INVITES} test invitations for this event.` };
    }
    const undoCount = () =>
      db.query(`update event_plan set "testInvitesSent" = "testInvitesSent" - 1 where id = $1`, [
        event.id,
      ]);
    try {
      const { error } = await createResend().emails.send({
        from: INVITATION_FROM,
        to: [to],
        replyTo: `${host} <${session.user.email}>`,
        ...buildInvitation(event, host, text, true),
      });
      if (error) {
        console.error("Resend rejected the test invitation:", error);
        await undoCount();
        return { values, error: describeEmailError(error) };
      }
    } catch (error) {
      console.error("Sending the test invitation failed:", error);
      await undoCount();
      return { values, error: "Something went wrong sending the test. Please try again." };
    }
    const left = MAX_TEST_INVITES - (counted.rows[0].testInvitesSent as number);
    return {
      values,
      message: `Test invitation sent to ${to}. (${left} test${left === 1 ? "" : "s"} left for this event.)`,
    };
  }

  if (intent === "send") {
    if (!guestEmails.length) {
      return { values, error: "Add at least one guest email first." };
    }
    // Claim the event before sending, so two clicks (or two tabs) can't send
    // the invitations twice.
    const claimed = await db.query(
      `update event_plan set "invitationsSentAt" = now()
       where id = $1 and "invitationsSentAt" is null returning "invitationsSentAt"`,
      [event.id],
    );
    if (!claimed.rowCount) {
      return { values, error: "Invitations for this event were already sent." };
    }
    const releaseClaim = () =>
      db.query(`update event_plan set "invitationsSentAt" = null where id = $1`, [event.id]);

    const message = buildInvitation(event, host, text);
    try {
      // One batch request, one email per guest so guests don't see each
      // other's addresses. By default Resend sends all of them or none.
      const { error } = await createResend().batch.send(
        guestEmails.map((guest) => ({
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
        return { values, error: describeEmailError(error) };
      }
    } catch (error) {
      console.error("Sending invitations failed:", error);
      await releaseClaim();
      return { values, error: "Something went wrong sending the invitations. Please try again." };
    }
    const sentAt = (claimed.rows[0].invitationsSentAt as Date).toISOString();
    return {
      values,
      sentAt,
      message: `Invitations sent to ${guestEmails.length} guest${guestEmails.length === 1 ? "" : "s"}. Replies will come to your email.`,
    };
  }

  return { values, error: "Unknown action." };
}

"use server";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { headers } from "next/headers";
import { z } from "zod";
import { auth, db } from "@/lib/auth";
import { formatEventTime } from "@/lib/event-format";
import { hasActiveSubscription } from "@/lib/subscription";

const Idea = z.object({
  name: z.string(),
  description: z.string(),
});

// The exact shape Claude must answer in. The SDK checks the reply against it.
const EventPlanSchema = z.object({
  book: z.object({ title: z.string(), author: z.string() }),
  // Why this book was picked, when the user asked us to choose one.
  pickReason: z.string().nullable(),
  theme: z.object({
    name: z.string(),
    description: z.string(),
    decorations: z.array(z.string()),
  }),
  activities: z.array(Idea),
  snacks: z.array(Idea),
  drinks: z.array(Idea),
  hostingTips: z.array(z.string()),
  discussionPrompts: z.array(z.string()),
  readingList: z.array(
    z.object({ title: z.string(), author: z.string(), reason: z.string() }),
  ),
  // A timed run of show for the evening.
  schedule: z.array(z.object({ time: z.string(), activity: z.string() })),
  // Which sections reveal major plot points, so the page can warn readers.
  spoilers: z.object({
    theme: z.boolean(),
    activities: z.boolean(),
    snacks: z.boolean(),
    drinks: z.boolean(),
    hostingTips: z.boolean(),
    discussionPrompts: z.boolean(),
  }),
});

export type EventPlan = z.infer<typeof EventPlanSchema>;

// What the user typed, kept as text so the form can show it again.
export type PlanValues = {
  book: string;
  guests: string;
  venue: string;
  eventTime: string;
};

// A saved plan plus the event details it was made for.
export type SavedEvent = {
  id: string;
  plan: EventPlan;
  guests: number | null;
  venue: string | null;
  eventTime: string | null;
  guestEmails: string[];
  invitationsSentAt: string | null;
  // The invitation draft from the Invitations page, if one was made.
  inviteSubject: string | null;
  inviteBody: string | null;
};

export type PlanState = {
  event?: SavedEvent;
  error?: string;
  values?: PlanValues;
};

const MAX_GUESTS = 500;
const MAX_BOOK_LENGTH = 2000;

const SYSTEM_PROMPT = `You plan themed events for book lovers and book clubs. Create an event inspired by one specific book: its setting, characters, era, mood and key moments.

The user describes the book in one of three ways:
- A title (and maybe an author): plan around that book.
- A summary of the book: work out which book it is if you can and use its real title and author. If it doesn't match a book you know, build the plan from the summary, use the title they mention or a short descriptive title, and set the author to "Unknown".
- They ask you to choose: pick a well-loved, widely available book that suits a group discussion and the event details. Treat anything they wrote as preferences (genre, mood, length, books they liked). Explain your pick in pickReason in 1-2 sentences. Set pickReason to null when you didn't choose the book.

Fit the whole plan to the number of guests and the venue you're given. Scale snack and drink amounts to the group, and say roughly how much to make or buy in each description (for example "about 3 dozen" or "2 gallons"). Choose activities that work for that group size, such as splitting a large group into small tables, and decorations that suit the venue's size and rules (for example, nothing that needs tape or an open flame in a library or rented room). If the guest count or venue is missing, assume about 8 guests in someone's home.

Include:
- book: the book's correct title and author (if the title is ambiguous, pick the best-known match)
- theme: a catchy theme name, a 2-3 sentence description, and 4-6 decoration ideas
- activities: 3-4 activities that tie directly to the book
- snacks: 4-5 snacks connected to the story, with one sentence on the connection and the amount to prepare
- drinks: 3-4 drinks connected to the story, with the amount to prepare; at least two must be non-alcoholic
- hostingTips: 3-5 practical tips for this group size and venue (seating, setup, timing, serving, budget)
- discussionPrompts: 8 thoughtful, open-ended questions; flag any major spoilers with "(Spoiler)" at the start
- readingList: 5 books readers who enjoyed this one would likely love, each with a one-sentence reason
- schedule: 6-9 steps for the evening, from guests arriving to wrapping up. If a start time is given, use clock times starting then (for example "7:00 PM"); otherwise use times relative to the start (for example "Start", "+20 min").
- spoilers: for each section, true if anything in it reveals a major plot point (a twist, the ending, a character's death or a big secret), otherwise false. Guests may not have finished the book, so mark it true whenever in doubt.

Keep ideas practical and budget-friendly. If you don't recognize the book, build the plan from what the title suggests and say so in the theme description.`;

// Genres to steer toward when the user lets us choose without preferences,
// so picks don't keep landing on the same few famous books.
const GENRES = [
  "literary fiction",
  "historical fiction",
  "cozy mystery",
  "thriller",
  "fantasy",
  "science fiction",
  "romance",
  "romantic comedy",
  "memoir",
  "narrative nonfiction",
  "classic novel",
  "magical realism",
  "gothic or horror",
  "contemporary fiction",
  "young adult",
  "graphic novel",
  "short story collection",
  "humorous fiction",
  "adventure",
  "translated fiction",
];

// Matches typed requests like "choose a book for me", "pick a book about
// dragons" or "surprise me". Anything after the request becomes preferences.
const CHOOSE_PATTERN =
  /^(?:please\s+)?(?:(?:can|could|would)\s+you\s+)?(?:please\s+)?(?:choose|pick|select|suggest|recommend)\s+(?:me\s+|us\s+)?(?:a|one|any)\s+(?:good\s+|great\s+)?book(?:\s+for\s+(?:me|us))?(.*)$/i;
const CHOOSE_SHORT = /^(?:please\s+)?(?:surprise\s+(?:me|us)|you\s+(?:choose|pick)|(?:choose|pick)\s+(?:for\s+)?(?:me|us))[\s.!]*$/i;

function parseChooseRequest(text: string) {
  if (CHOOSE_SHORT.test(text)) {
    return { choose: true, preferences: "" };
  }
  const match = text.match(CHOOSE_PATTERN);
  if (!match) {
    return { choose: false, preferences: "" };
  }
  const preferences = match[1]
    .replace(/^[\s,.:;!?-]+/, "")
    .replace(/\s*please[.!]*$/i, "")
    .trim();
  return { choose: true, preferences };
}

// Compares titles loosely ("The Hobbit" vs "hobbit").
function normalizeTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]/g, "");
}

async function getPastPicks(userId: string) {
  const result = await db.query<{ title: string; author: string }>(
    `select title, author from book_pick where "userId" = $1 order by "createdAt" desc limit 100`,
    [userId],
  );
  return result.rows;
}

function buildChooseRequest(
  preferences: string,
  pastPicks: { title: string; author: string }[],
) {
  const lines = ["Please choose a book for us."];
  if (preferences) {
    lines.push(`Our preferences: ${preferences}`);
  } else {
    const genre = GENRES[Math.floor(Math.random() * GENRES.length)];
    lines.push(`For variety, choose a ${genre} book this time.`);
  }
  if (pastPicks.length) {
    const list = pastPicks.map((pick) => `${pick.title} by ${pick.author}`).join("; ");
    lines.push(
      `We've already been given these books, so choose a different one: ${list}.`,
    );
  }
  return lines.join(" ");
}

export async function generateEventPlan(
  _previous: PlanState,
  formData: FormData,
): Promise<PlanState> {
  // Only signed-in subscribers can generate plans, which keeps API costs in
  // check. This check runs on the server, so it can't be skipped.
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return { error: "Please sign in to generate an event plan." };
  }
  if (!(await hasActiveSubscription(requestHeaders))) {
    return { error: "Subscribe to Book Club Plus to generate event plans." };
  }

  const values: PlanValues = {
    book: String(formData.get("book") ?? "").trim(),
    guests: String(formData.get("guests") ?? "").trim(),
    venue: String(formData.get("venue") ?? "").trim(),
    eventTime: String(formData.get("eventTime") ?? "").trim(),
  };

  // Typing "choose a book for me" works the same as clicking the button.
  const typed = parseChooseRequest(values.book);
  const choose = formData.get("mode") === "choose" || typed.choose;
  const preferences = typed.choose ? typed.preferences : values.book;

  if (!values.book && !choose) {
    return {
      values,
      error: "Enter a book title or summary, or click Choose a book for me.",
    };
  }
  if (values.book.length > MAX_BOOK_LENGTH) {
    return {
      values,
      error: `Please keep this under ${MAX_BOOK_LENGTH} characters.`,
    };
  }
  const guests = values.guests ? Number(values.guests) : null;
  if (guests !== null && (!Number.isInteger(guests) || guests < 1 || guests > MAX_GUESTS)) {
    return { values, error: `Please enter a number of guests from 1 to ${MAX_GUESTS}.` };
  }
  if (values.venue.length > 150) {
    return { values, error: "Please keep the venue under 150 characters." };
  }
  if (values.eventTime && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(values.eventTime)) {
    return { values, error: "Please pick a valid date and time." };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set.");
    return { values, error: "The AI service isn't set up yet (missing API key)." };
  }

  try {
    // Books we've already picked for this user, so we can avoid repeats.
    const pastPicks = choose ? await getPastPicks(session.user.id) : [];
    const pickedBefore = new Set(pastPicks.map((pick) => normalizeTitle(pick.title)));

    const bookLine = choose
      ? buildChooseRequest(preferences, pastPicks)
      : `The book we're reading (title or summary): ${values.book}`;
    const details = [
      `Number of guests: ${guests ?? "not given"}`,
      `Venue: ${values.venue || "not given"}`,
      `Date and time: ${values.eventTime ? formatEventTime(values.eventTime) : "not given"}`,
    ].join("\n");

    // Reads the API key from the ANTHROPIC_API_KEY environment variable.
    const client = new Anthropic();
    let plan: EventPlan | null = null;
    let avoid = "";
    // If Claude still picks a book it already chose, ask once more.
    for (let attempt = 0; attempt < 2 && !plan; attempt++) {
      const response = await client.beta.messages.parse({
        model: "claude-sonnet-5-5",
        max_tokens: 16000,
        // If a safety check declines the request, Anthropic retries it on a
        // fallback model automatically.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: {
          effort: "medium",
          format: betaZodOutputFormat(EventPlanSchema),
        },
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `${bookLine}${avoid}\n${details}` }],
      });

      if (response.stop_reason === "refusal" || !response.parsed_output) {
        return {
          values,
          error: "Sorry, we couldn't create a plan for that book. Try another title.",
        };
      }
      const result = response.parsed_output;
      if (choose && pickedBefore.has(normalizeTitle(result.book.title)) && attempt === 0) {
        avoid = ` Don't choose ${result.book.title}; it was already picked.`;
        continue;
      }
      plan = result;
    }
    if (!plan) {
      return { values, error: "Something went wrong creating your plan. Please try again." };
    }

    if (choose) {
      await db.query(
        `insert into book_pick ("userId", title, author) values ($1, $2, $3)`,
        [session.user.id, plan.book.title, plan.book.author],
      );
    }

    // Save the plan so it shows up on the My events page.
    const event: SavedEvent = {
      id: crypto.randomUUID(),
      plan,
      guests,
      venue: values.venue || null,
      eventTime: values.eventTime || null,
      guestEmails: [],
      invitationsSentAt: null,
      inviteSubject: null,
      inviteBody: null,
    };
    await db.query(
      `insert into event_plan (id, "userId", "bookTitle", "bookAuthor", "themeName", guests, venue, "eventTime", "guestEmails", plan)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        event.id,
        session.user.id,
        plan.book.title,
        plan.book.author,
        plan.theme.name,
        event.guests,
        event.venue,
        event.eventTime,
        event.guestEmails,
        JSON.stringify(plan),
      ],
    );
    return { values, event };
  } catch (error) {
    console.error("Event plan generation failed:", error);
    if (error instanceof Anthropic.AuthenticationError) {
      return { values, error: "The AI service isn't set up correctly (API key problem)." };
    }
    if (error instanceof Anthropic.RateLimitError) {
      return { values, error: "Lots of people are planning right now. Try again in a minute." };
    }
    return { values, error: "Something went wrong creating your plan. Please try again." };
  }
}

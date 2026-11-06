"use server";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/subscription";

const Idea = z.object({
  name: z.string(),
  description: z.string(),
});

// The exact shape Claude must answer in. The SDK checks the reply against it.
const EventPlanSchema = z.object({
  book: z.object({ title: z.string(), author: z.string() }),
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
});

export type EventPlan = z.infer<typeof EventPlanSchema>;

// What the user typed, kept as text so the form can show it again.
export type PlanValues = {
  book: string;
  guests: string;
  venue: string;
};

export type PlanState = {
  plan?: EventPlan;
  error?: string;
  values?: PlanValues;
};

const MAX_GUESTS = 500;

const SYSTEM_PROMPT = `You plan book club meetings. Given the book a club is currently reading, create a themed event inspired by that specific book: its setting, characters, era, mood and key moments.

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

Keep ideas practical and budget-friendly. If you don't recognize the book, build the plan from what the title suggests and say so in the theme description.`;

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
  };

  if (!values.book) {
    return { values, error: "Please enter the book your club is reading." };
  }
  if (values.book.length > 200) {
    return { values, error: "Please keep the book title under 200 characters." };
  }
  const guests = values.guests ? Number(values.guests) : null;
  if (guests !== null && (!Number.isInteger(guests) || guests < 1 || guests > MAX_GUESTS)) {
    return { values, error: `Please enter a number of guests from 1 to ${MAX_GUESTS}.` };
  }
  if (values.venue.length > 150) {
    return { values, error: "Please keep the venue under 150 characters." };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set.");
    return { values, error: "The AI service isn't set up yet (missing API key)." };
  }

  const request = [
    `Our book club is reading: ${values.book}`,
    `Number of guests: ${guests ?? "not given"}`,
    `Venue: ${values.venue || "not given"}`,
  ].join("\n");

  try {
    // Reads the API key from the ANTHROPIC_API_KEY environment variable.
    const client = new Anthropic();
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
      messages: [{ role: "user", content: request }],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return {
        values,
        error: "Sorry, we couldn't create a plan for that book. Try another title.",
      };
    }
    return { values, plan: response.parsed_output };
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

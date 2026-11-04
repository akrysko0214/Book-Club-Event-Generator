"use server";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";

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
  discussionPrompts: z.array(z.string()),
  readingList: z.array(
    z.object({ title: z.string(), author: z.string(), reason: z.string() }),
  ),
});

export type EventPlan = z.infer<typeof EventPlanSchema>;

export type PlanState = {
  plan?: EventPlan;
  error?: string;
  // The title the user typed, so the form can keep showing it.
  book?: string;
};

const SYSTEM_PROMPT = `You plan book club meetings. Given the book a club is currently reading, create a themed event inspired by that specific book: its setting, characters, era, mood and key moments.

Include:
- book: the book's correct title and author (if the title is ambiguous, pick the best-known match)
- theme: a catchy theme name, a 2-3 sentence description, and 4-6 decoration ideas
- activities: 3-4 activities that tie directly to the book
- snacks: 4-5 snacks connected to the story, with one sentence on the connection
- drinks: 3-4 drinks connected to the story; at least two must be non-alcoholic
- discussionPrompts: 8 thoughtful, open-ended questions; flag any major spoilers with "(Spoiler)" at the start
- readingList: 5 books readers who enjoyed this one would likely love, each with a one-sentence reason

Keep ideas practical for a home gathering on a modest budget. If you don't recognize the book, build the plan from what the title suggests and say so in the theme description.`;

export async function generateEventPlan(
  _previous: PlanState,
  formData: FormData,
): Promise<PlanState> {
  // Only signed-in users can generate plans, which keeps API costs in check.
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Please sign in to generate an event plan." };
  }

  const book = String(formData.get("book") ?? "").trim();
  if (!book) {
    return { error: "Please enter the book your club is reading." };
  }
  if (book.length > 200) {
    return { book, error: "Please keep the book title under 200 characters." };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set.");
    return { book, error: "The AI service isn't set up yet (missing API key)." };
  }

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
      messages: [
        { role: "user", content: `Our book club is reading: ${book}` },
      ],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return {
        book,
        error: "Sorry, we couldn't create a plan for that book. Try another title.",
      };
    }
    return { book, plan: response.parsed_output };
  } catch (error) {
    console.error("Event plan generation failed:", error);
    if (error instanceof Anthropic.AuthenticationError) {
      return { book, error: "The AI service isn't set up correctly (API key problem)." };
    }
    if (error instanceof Anthropic.RateLimitError) {
      return { book, error: "Lots of people are planning right now. Try again in a minute." };
    }
    return { book, error: "Something went wrong creating your plan. Please try again." };
  }
}

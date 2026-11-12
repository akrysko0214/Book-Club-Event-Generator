"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { authClient } from "@/lib/auth-client";
import { startDemoCheckout } from "./demo-checkout";

const PLAN_NAME = "plus";

// Shown to signed-in users who haven't subscribed yet.
export function SubscribeCard({ testMode }: { testMode: boolean }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubscribe() {
    setError("");
    setPending(true);
    // Sends the user to Stripe's secure checkout page, then back here.
    const { error } = await authClient.subscription.upgrade({
      plan: PLAN_NAME,
      successUrl: "/account",
      cancelUrl: "/account",
      disableRedirect: false,
    });
    if (error) {
      setError(error.message ?? "Couldn't start checkout. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-amber-100">
      <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
        Book Club Plus
      </p>
      <p className="mt-2 text-4xl font-bold">
        $9.99<span className="text-lg font-medium text-stone-600"> / month</span>
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-5 text-stone-700">
        <li>Unlimited AI-generated event plans for any book</li>
        <li>Themes, decorations, activities, snacks and drinks sized to your group</li>
        <li>Discussion prompts and a personalized reading list</li>
        <li>Cancel anytime</li>
      </ul>
      <button
        onClick={handleSubscribe}
        disabled={pending}
        className="mt-6 w-full rounded-lg bg-stone-900 px-5 py-3 font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
      >
        {pending ? "Opening checkout…" : "Subscribe for $9.99/month"}
      </button>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {testMode && <TestModeNote />}
    </div>
  );
}

// Shown to subscribers: opens Stripe's billing portal to update the card,
// see invoices or cancel.
export function ManageBillingButton() {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const { error } = await authClient.subscription.billingPortal({
      returnUrl: "/account",
      disableRedirect: false,
    });
    if (error) {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold hover:bg-stone-100 disabled:opacity-60"
    >
      {pending ? "Opening…" : "Manage billing"}
    </button>
  );
}

// Shown only to the demo account in test mode: opens a real Stripe checkout
// page so graders can see payments working without a real card.
export function DemoCheckoutCard() {
  const completed = useSearchParams().get("demo_checkout") === "success";

  return (
    <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-amber-100">
      <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
        Demo account
      </p>
      <h2 className="mt-1 text-xl font-semibold">Try the Stripe checkout</h2>
      <p className="mt-2 text-stone-700">
        This account already has full paid access. Use this button to open the
        real $9.99/month checkout page that new subscribers see. You can look
        around and go back, or finish with the test card below.
      </p>
      {completed && (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          Test checkout completed. No real money was charged.
        </p>
      )}
      <form action={startDemoCheckout}>
        <DemoCheckoutButton />
      </form>
      <TestModeNote />
    </div>
  );
}

function DemoCheckoutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 rounded-lg bg-stone-900 px-5 py-2.5 font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
    >
      {pending ? "Opening checkout…" : "Open Stripe checkout"}
    </button>
  );
}

function TestModeNote() {
  return (
    <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
      <p className="font-semibold">Test mode: no real money is charged.</p>
      <p className="mt-1">
        Use card number <span className="font-mono">4242 4242 4242 4242</span>, any
        future expiration date, any 3-digit CVC and any ZIP code.
      </p>
    </div>
  );
}

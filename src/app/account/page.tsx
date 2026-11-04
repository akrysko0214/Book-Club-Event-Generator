import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import EventPlanner from "./event-planner";
import SignOutButton from "./sign-out-button";

export const metadata: Metadata = { title: "Your account · Book Club Event Generator" };

export default function AccountPage() {
  return (
    <div className="flex flex-1 flex-col bg-amber-50 px-6 py-10 text-stone-900">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-amber-800">
          ← Book Club Event Generator
        </Link>
        {/* Reading the session happens per request, so it streams in here. */}
        <Suspense fallback={<p className="mt-4 text-stone-600">Loading your account…</p>}>
          <AccountDetails />
        </Suspense>
      </div>
    </div>
  );
}

async function AccountDetails() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  const { user } = session;
  return (
    <>
      <div className="mt-4 mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hi, {user.name}!</h1>
          <p className="mt-1 text-stone-600">You&apos;re signed in as {user.email}.</p>
        </div>
        <SignOutButton />
      </div>
      <EventPlanner />
    </>
  );
}

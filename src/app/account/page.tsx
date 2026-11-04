import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import SignOutButton from "./sign-out-button";

export const metadata: Metadata = { title: "Your account · Book Club Event Generator" };

export default function AccountPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-amber-50 px-6 py-16 text-stone-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-amber-100">
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
      <h1 className="mt-4 text-3xl font-bold">Hi, {user.name}!</h1>
      <p className="mt-2 text-stone-600">You&apos;re signed in as {user.email}.</p>
      <p className="mt-4 text-stone-600">
        Soon you&apos;ll be able to enter your club&apos;s current book here
        and get a custom event plan.
      </p>
      <div className="mt-6">
        <SignOutButton />
      </div>
    </>
  );
}

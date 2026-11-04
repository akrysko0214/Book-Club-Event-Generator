"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type Mode = "sign-in" | "sign-up";

const inputClass =
  "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200";

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const isSignUp = mode === "sign-up";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    const { error } = isSignUp
      ? await authClient.signUp.email({
          name: String(form.get("name")),
          email,
          password,
        })
      : await authClient.signIn.email({ email, password });

    if (error) {
      setError(error.message ?? "Something went wrong. Please try again.");
      setPending(false);
      return;
    }

    router.push("/account");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-amber-50 px-6 py-16 text-stone-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-amber-100">
        <Link href="/" className="text-sm font-semibold text-amber-800">
          ← Book Club Event Generator
        </Link>
        <h1 className="mt-4 text-3xl font-bold">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isSignUp && (
            <label className="block text-sm font-medium">
              Name
              <input name="name" required autoComplete="name" className={inputClass} />
            </label>
          )}
          <label className="block text-sm font-medium">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              className={inputClass}
            />
          </label>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-stone-900 px-4 py-2.5 font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
          >
            {pending ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-600">
          {isSignUp ? "Already have an account? " : "New here? "}
          <Link
            href={isSignUp ? "/sign-in" : "/sign-up"}
            className="font-semibold text-amber-800 underline"
          >
            {isSignUp ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </div>
  );
}

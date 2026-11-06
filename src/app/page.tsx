import Link from "next/link";

const features = [
  {
    title: "A custom event theme",
    text: "Get a theme, decorations and activities inspired by the world, characters and mood of your book.",
  },
  {
    title: "Snacks and discussion prompts",
    text: "Serve snacks that match the story and lead the conversation with thoughtful questions about the book.",
  },
  {
    title: "Your next reading list",
    text: "Discover books your group is likely to enjoy next if they loved this one.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-amber-50 text-stone-900">
      <header className="mx-auto flex w-full max-w-4xl justify-end gap-3 px-6 pt-6">
        <Link
          href="/sign-in"
          className="rounded-lg px-4 py-2 font-semibold hover:bg-amber-100"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className="rounded-lg bg-stone-900 px-4 py-2 font-semibold text-white hover:bg-stone-700"
        >
          Create account
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-6 py-16 text-center">
        <p className="mb-4 rounded-full bg-amber-200 px-4 py-1 text-sm font-semibold uppercase tracking-wide text-amber-900">
          AI-powered book club planning
        </p>

        <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
          Book Club Event Generator
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-700 sm:text-xl">
          Planning a book club shouldn&apos;t feel like homework. Just enter
          the book your club is reading now, and our AI creates a custom
          event built around it: a theme, activities, snacks, discussion
          prompts and more, all inspired by the story.
        </p>

        <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-700 sm:text-xl">
          You&apos;ll also get a personalized reading list of books to try
          next if your group enjoyed this one, so you can spend less time
          organizing and more time talking about books.
        </p>

        <div className="mt-14 grid w-full gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl bg-white p-6 text-left shadow-sm ring-1 ring-amber-100"
            >
              <h2 className="text-lg font-semibold">{feature.title}</h2>
              <p className="mt-2 text-stone-600">{feature.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-white px-8 py-6 shadow-sm ring-1 ring-amber-100">
          <p className="text-lg">
            <span className="font-bold">Book Club Plus</span>: unlimited event
            plans for <span className="font-bold">$9.99/month</span>. Cancel anytime.
          </p>
          <Link
            href="/sign-up"
            className="mt-4 inline-block rounded-lg bg-stone-900 px-5 py-2.5 font-semibold text-white hover:bg-stone-700"
          >
            Get started
          </Link>
        </div>
      </main>

      <footer className="border-t border-amber-200 bg-amber-100 px-6 py-10 text-center">
        <p className="text-base text-stone-600">Created by</p>
        <p className="mt-1 text-4xl font-bold text-stone-900 sm:text-5xl">
          Ava Krysko
        </p>
      </footer>
    </div>
  );
}

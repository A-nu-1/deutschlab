import Link from "next/link";

const features = [
  {
    title: "Grammar Library",
    german: "Grammatik",
    description:
      "Grammar rules, noun genders, verb forms, examples and exceptions.",
    icon: "📖",
    href: "/library",
    color: "purple",
    level: "A1–C1",
  },
  {
    title: "Smart Reader",
    german: "Leseassistent",
    description:
      "Read German texts with translations and grammar explanations.",
    icon: "📄",
    href: "/reader",
    color: "blue",
    level: "B1–C1",
  },
  {
    title: "Speaking Coach",
    german: "Sprechtrainer",
    description:
      "Speak, receive corrections, learn an ideal answer and practise.",
    icon: "🎙️",
    href: "/coach",
    color: "pink",
    level: "B1–C1",
  },
  {
    title: "My Materials",
    german: "Lernmaterialien",
    description:
      "Organize your PDFs, eBooks, images and personal notes.",
    icon: "📚",
    href: "/materials",
    color: "yellow",
    level: "A1–C1",
  },
  {
    title: "Vocabulary",
    german: "Wortschatz",
    description:
      "Learn words, expressions, noun genders and useful phrases.",
    icon: "🧠",
    href: "/vocabulary",
    color: "green",
    level: "B1–C1",
  },
  {
    title: "My Progress",
    german: "Lernfortschritt",
    description:
      "Track your vocabulary, grammar, speaking and daily practice.",
    icon: "📊",
    href: "/progress",
    color: "orange",
    level: "Mission C1",
  },
];

const colorClasses: Record<string, string> = {
  purple: "border-violet-500/25 hover:border-violet-400/60",
  blue: "border-blue-500/25 hover:border-blue-400/60",
  pink: "border-pink-500/25 hover:border-pink-400/60",
  yellow: "border-yellow-500/25 hover:border-yellow-400/60",
  green: "border-emerald-500/25 hover:border-emerald-400/60",
  orange: "border-orange-500/25 hover:border-orange-400/60",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#11131f] px-5 py-8 text-white md:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-violet-400">Deutsch</span>Lab
              <span className="ml-2">🇩🇪</span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Deine persönliche Deutschbibliothek
            </p>
          </div>

          <div className="rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
            B1 → C1 · Mission C1
          </div>
        </header>

        <section className="mb-12 rounded-3xl border border-white/10 bg-gradient-to-br from-[#242039] via-[#1a1d30] to-[#141c2a] p-7 md:p-10">
          <p className="mb-3 text-sm font-medium text-violet-300">
            Willkommen zurück! ✨
          </p>

          <h2 className="max-w-2xl text-3xl font-bold leading-tight md:text-5xl">
            Jeden Tag ein bisschen besser Deutsch sprechen.
          </h2>

          <p className="mt-4 max-w-2xl text-slate-300">
            Build your German knowledge, discover grammar rules, practise
            speaking and grow your personal language library.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/coach"
              className="rounded-xl bg-violet-500 px-5 py-3 font-medium text-white transition hover:bg-violet-400"
            >
              🎙️ Start Speaking
            </Link>

            <Link
              href="/library"
              className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 font-medium transition hover:bg-white/10"
            >
              📖 Open Library
            </Link>
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">My Learning Space</h2>
              <p className="mt-1 text-sm text-slate-400">
                Everything you need for your B1 to C1 journey.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className={`group rounded-2xl border bg-[#1c2030] p-6 transition hover:-translate-y-1 hover:bg-[#24293c] ${
                  colorClasses[feature.color]
                }`}
              >
                <div className="mb-5 flex items-start justify-between">
                  <span className="text-3xl">{feature.icon}</span>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
                    {feature.level}
                  </span>
                </div>

                <h3 className="text-xl font-semibold">{feature.title}</h3>

                <p className="mt-1 text-sm text-violet-300">
                  {feature.german}
                </p>

                <p className="mt-4 min-h-16 text-sm leading-relaxed text-slate-400">
                  {feature.description}
                </p>

                <div className="mt-4 text-sm font-medium text-slate-300 group-hover:text-white">
                  Explore →
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#1c2030] p-6">
          <h2 className="mb-4 text-lg font-semibold">
            🎨 Our German Gender Colors
          </h2>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-blue-500/10 p-4">
              <p className="text-xl font-bold text-blue-400">der Mann</p>
              <p className="mt-1 text-xs text-slate-400">Masculine</p>
            </div>

            <div className="rounded-xl bg-pink-500/10 p-4">
              <p className="text-xl font-bold text-pink-400">die Frau</p>
              <p className="mt-1 text-xs text-slate-400">Feminine</p>
            </div>

            <div className="rounded-xl bg-yellow-500/10 p-4">
              <p className="text-xl font-bold text-yellow-400">das Kind</p>
              <p className="mt-1 text-xs text-slate-400">Neuter</p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-7 text-slate-300">
            <span className="font-semibold text-blue-400">Der Mann</span>{" "}
            liest{" "}
            <span className="font-semibold text-pink-400">
              die Zeitung
            </span>
            , während{" "}
            <span className="font-semibold text-yellow-400">
              das Kind
            </span>{" "}
            spielt.
          </p>
        </section>

        <footer className="mt-10 text-center text-xs text-slate-500">
          DeutschLab · Your living German learning library 💜
        </footer>
      </div>
    </main>
  );
}
import { Link } from "react-router-dom";
import {
  BarChart3,
  Mail,
  Repeat,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { HeroVisual } from "./HeroVisual.js";

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Why believe.ai", href: "#why" },
  { label: "Use cases", href: "#use-cases" },
];

const FEATURES = [
  {
    Icon: Sparkles,
    title: "AI email writer",
    body: "Describe your goal, your audience, and a tone — get a subject line, body, and call to action you can edit.",
  },
  {
    Icon: Users,
    title: "Audience management",
    body: "Import a CSV with column mapping, automatic de-duplication, and invalid-address detection before you send.",
  },
  {
    Icon: BarChart3,
    title: "Performance you can read",
    body: "Opens, clicks, replies and bounce rate per campaign — plus an AI read on what actually worked.",
  },
];

const STEPS = [
  { n: "01", title: "Build your audience", body: "Import contacts, tag them, and segment who each campaign reaches." },
  { n: "02", title: "Write it with AI", body: "Generate the message, refine the tone, and approve every word yourself." },
  { n: "03", title: "Launch responsibly", body: "Sending limits, suppression lists, and automatic follow-ups built in." },
];

const USE_CASES = [
  "Job seekers",
  "Freelancers",
  "Sales teams",
  "Recruiters",
  "Founders",
  "Creators",
  "Agencies",
  "Students",
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-ink-900">
      <SiteHeader />

      {/* ---------- Hero ---------- */}
      <section className="canvas-band px-4 pb-24 pt-14 sm:px-6">
        <div className="mx-auto max-w-content text-center">
          <span className="inline-flex items-center gap-2 rounded-pill bg-white/70 px-3 py-1 text-xs font-medium text-ink-600 backdrop-blur dark:bg-ink-900/40 dark:text-ink-200">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" />
            AI-powered outreach
          </span>

          <h1 className="mx-auto mt-6 max-w-4xl text-display font-semibold text-ink-900 dark:text-white">
            Turn every message into an opportunity
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base text-ink-600 dark:text-ink-300">
            believe.ai helps you create personalized outreach, automate follow-ups, and understand what actually
            gets responses.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/signup">
              <Button size="lg">Start believing</Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="secondary">
                See how it works
              </Button>
            </a>
          </div>

          <div className="mt-16">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section id="product" className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-content">
          <div className="grid gap-10 md:grid-cols-2 md:items-end">
            <h2 className="text-headline font-semibold text-ink-900 dark:text-white">
              Smarter tools for
              <br />
              modern outreach
            </h2>
            <p className="text-sm leading-relaxed text-ink-500 dark:text-ink-400">
              Write, personalize, schedule and measure every message from one place — with guardrails that keep your
              sending reputation intact and your recipients respected.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {FEATURES.map(({ Icon, title, body }) => (
              <article key={title} className="rounded-card bg-ink-50 p-7 dark:bg-ink-800/60">
                <span className="icon-chip">
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Steps ---------- */}
      <section id="how-it-works" className="canvas-band px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-content text-center">
          <h2 className="mx-auto max-w-2xl text-headline font-semibold text-ink-900 dark:text-white">
            Three simple steps to get started
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-ink-600 dark:text-ink-300">
            From an empty account to your first personalized campaign in under ten minutes.
          </p>

          <div className="mt-14 grid gap-6 text-left md:grid-cols-3">
            {STEPS.map(({ n, title, body }) => (
              <article key={n} className="rounded-card bg-white p-7 shadow-card dark:bg-ink-800">
                <span className="text-sm font-semibold text-brand-500">{n}</span>
                <h3 className="mt-3 text-lg font-semibold text-ink-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Bento ---------- */}
      <section id="why" className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-content">
          <div className="grid gap-10 md:grid-cols-2 md:items-end">
            <h2 className="text-headline font-semibold text-ink-900 dark:text-white">Why choose believe.ai</h2>
            <p className="text-sm leading-relaxed text-ink-500 dark:text-ink-400">
              Personalization that references real context about you and your recipient — never invented facts — with
              follow-ups that stop the moment someone replies.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3 md:grid-rows-2">
            {/* Large stat tile */}
            <article className="flex flex-col justify-between rounded-card bg-ink-50 p-8 md:col-span-2 md:row-span-2 dark:bg-ink-800/60">
              <span className="inline-flex w-fit items-center gap-2 rounded-pill bg-white px-3 py-1 text-xs font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-200">
                <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                AI personalization
              </span>
              <div className="mt-10">
                <p className="text-[clamp(3rem,7vw,5rem)] font-semibold leading-none tracking-tighter text-ink-900 dark:text-white">
                  3&times;
                </p>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                  Faster to get a campaign out the door — write once, and let believe.ai tailor every message to the
                  person receiving it.
                </p>
              </div>
            </article>

            {/* Accent tile */}
            <article className="rounded-card bg-brand-500 p-7 text-white">
              <h3 className="text-lg font-semibold">Smart follow-ups</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                Sequence day 3, day 7, day 14 — and stop automatically the moment a reply lands.
              </p>
              <div className="mt-6 flex items-center gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-8 flex-1 rounded-lg ${i < 3 ? "bg-white/85" : "bg-white/30"}`}
                  />
                ))}
              </div>
            </article>

            {/* Providers tile */}
            <article className="rounded-card bg-ink-50 p-7 dark:bg-ink-800/60">
              <span className="icon-chip">
                <Mail className="h-4 w-4" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-ink-900 dark:text-white">Gmail &amp; Outlook</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                Send from the mailbox you already use. Tokens encrypted, never a password stored.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ---------- Use cases ---------- */}
      <section id="use-cases" className="canvas-band px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-content text-center">
          <h2 className="text-headline font-semibold text-ink-900 dark:text-white">Built for how you reach out</h2>
          <div className="mt-10 flex flex-wrap justify-center gap-2.5">
            {USE_CASES.map((useCase) => (
              <span
                key={useCase}
                className="rounded-pill bg-white px-5 py-2.5 text-sm text-ink-700 shadow-card dark:bg-ink-800 dark:text-ink-200"
              >
                {useCase}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-content">
          <div className="rounded-panel bg-ink-900 px-6 py-20 text-center dark:bg-ink-800">
            <h2 className="mx-auto max-w-2xl text-headline font-semibold text-white">
              Your next opportunity might be one email away
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-ink-300">
              Start free. Connect your mailbox, import your audience, and send something worth replying to.
            </p>
            <Link to="/signup" className="mt-8 inline-block">
              <Button size="lg" className="bg-white text-ink-900 hover:bg-ink-100">
                Start for free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="canvas-band px-4 pt-5 sm:px-6">
      <div className="mx-auto flex max-w-content items-center justify-between rounded-pill bg-white/80 px-5 py-3 backdrop-blur dark:bg-ink-900/60">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500">
            <Send className="h-3.5 w-3.5 text-white" />
          </span>
          <span className="text-base font-semibold tracking-tight text-ink-900 dark:text-white">believe.ai</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-ink-600 transition-colors hover:text-ink-900 dark:text-ink-300 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button size="sm" variant="secondary">
              Log in
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="sm">Sign up</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-ink-100 px-4 py-10 sm:px-6 dark:border-ink-800">
      <div className="mx-auto flex max-w-content flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500">
            <Send className="h-3 w-3 text-white" />
          </span>
          <span className="text-sm font-semibold text-ink-900 dark:text-white">believe.ai</span>
        </div>
        <p className="text-sm text-ink-400">Believe in your next opportunity.</p>
        <div className="flex items-center gap-2 text-xs text-ink-400">
          <Repeat className="h-3.5 w-3.5" />
          Follow-ups that know when to stop
        </div>
      </div>
    </footer>
  );
}

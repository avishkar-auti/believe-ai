import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  Lock,
  Mail,
  MessageCircle,
  Repeat,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { HeroVisual } from "./HeroVisual.js";
import { AnalyticsShowcase } from "./AnalyticsShowcase.js";
import { ThemeToggle } from "../../components/layout/ThemeToggle.js";
import { cn } from "../../lib/cn.js";

const HERO_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_105406_16f4600d-7a92-4292-b96e-b19156c7830a.mp4";

const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const heroItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Analytics", href: "#analytics" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Why believe.ai", href: "#why" },
  { label: "Use cases", href: "#use-cases" },
];

/** Generic scroll-reveal: fade + rise into place once, on first entering the viewport. */
const revealUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const revealStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const revealViewport = { once: true, margin: "-80px" } as const;

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

const WHY_TILES = [
  {
    Icon: ShieldCheck,
    title: "Sending guardrails",
    body: "Daily limits and suppression lists keep your sender reputation intact — no accidental spam blasts.",
  },
  {
    Icon: Lock,
    title: "Encrypted, never stored",
    body: "OAuth tokens are encrypted at rest. We never see or store your mailbox password.",
  },
  {
    Icon: MessageCircle,
    title: "We actually listen",
    body: "In-app feedback, right where you're working — no ticket portal, no waiting for a support email.",
  },
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
      <section className="canvas-band relative overflow-hidden px-4 pb-24 pt-14 sm:px-6">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={HERO_VIDEO_URL}
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-ink-900/25" />

        <motion.div
          className="relative mx-auto max-w-content text-center"
          initial="hidden"
          animate="show"
          variants={heroContainer}
        >
          <motion.span
            variants={heroItem}
            className="inline-flex items-center gap-2 rounded-pill bg-ink-900/40 px-3 py-1 text-xs font-medium text-ink-200 backdrop-blur"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
            </span>
            AI-powered outreach
          </motion.span>

          <motion.h1 variants={heroItem} className="mx-auto mt-6 max-w-4xl text-display font-semibold text-white">
            Turn every message into
            <br />
            an <span className="text-brand-400">opportunity</span>
          </motion.h1>

          <motion.p variants={heroItem} className="mx-auto mt-5 max-w-xl text-base text-ink-200">
            believe.ai helps you create personalized outreach, automate follow-ups, and understand what actually
            gets responses.
          </motion.p>

          <motion.div variants={heroItem} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/signup">
              <Button size="lg">Start believing</Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="secondary">
                See how it works
              </Button>
            </a>
          </motion.div>

          <motion.div variants={heroItem} className="mt-16">
            <HeroVisual />
          </motion.div>
        </motion.div>
      </section>

      {/* ---------- Marquee ---------- */}
      <div className="group overflow-hidden border-y border-ink-100 bg-white py-5 dark:border-ink-800 dark:bg-ink-900">
        <div className="flex w-max animate-marquee gap-3 group-hover:[animation-play-state:paused]">
          {[...USE_CASES, ...USE_CASES].map((useCase, i) => (
            <span
              key={`${useCase}-${i}`}
              className="shrink-0 rounded-pill border border-ink-100 bg-ink-50 px-5 py-2 text-sm text-ink-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:text-ink-900 dark:border-ink-800 dark:bg-ink-800/60 dark:text-ink-300 dark:hover:text-white"
            >
              {useCase}
            </span>
          ))}
        </div>
      </div>

      {/* ---------- Features ---------- */}
      <section id="product" className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-content">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={revealViewport}
            variants={revealUp}
            className="grid gap-10 md:grid-cols-2 md:items-end"
          >
            <h2 className="text-headline font-semibold text-ink-900 dark:text-white">
              Smarter tools for
              <br />
              modern outreach
            </h2>
            <p className="text-sm leading-relaxed text-ink-500 dark:text-ink-400">
              Write, personalize, schedule and measure every message from one place — with guardrails that keep your
              sending reputation intact and your recipients respected.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={revealViewport}
            variants={revealStagger}
            className="mt-14 grid gap-6 md:grid-cols-3"
          >
            {FEATURES.map(({ Icon, title, body }) => (
              <motion.article
                key={title}
                variants={revealUp}
                whileHover={{ y: -6, scale: 1.015 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 340, damping: 24 }}
                className="group rounded-card bg-ink-50 p-7 transition-shadow duration-300 hover:shadow-lift dark:bg-ink-800/60"
              >
                <span className="icon-chip transition-transform duration-300 group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{body}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------- Analytics showcase ---------- */}
      <section id="analytics" className="canvas-band px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-content">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={revealViewport}
            variants={revealUp}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-headline font-semibold text-ink-900 dark:text-white">Advanced analytics and reporting</h2>
            <p className="mx-auto mt-4 text-sm text-ink-600 dark:text-ink-300">
              See who you're reaching and what's working — updated as your campaigns run.
            </p>
          </motion.div>
          <div className="mt-14">
            <AnalyticsShowcase />
          </div>
        </div>
      </section>

      {/* ---------- Steps ---------- */}
      <section id="how-it-works" className="px-4 py-24 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
          variants={revealUp}
          className="mx-auto max-w-content text-center"
        >
          <h2 className="mx-auto max-w-2xl text-headline font-semibold text-ink-900 dark:text-white">
            Three simple steps to get started
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-ink-600 dark:text-ink-300">
            From an empty account to your first personalized campaign in under ten minutes.
          </p>

          <motion.div variants={revealStagger} className="mt-14 grid gap-6 text-left md:grid-cols-3">
            {STEPS.map(({ n, title, body }) => (
              <motion.article
                key={n}
                variants={revealUp}
                whileHover={{ y: -6, scale: 1.015 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 340, damping: 24 }}
                className="rounded-card bg-ink-50 p-7 shadow-card transition-shadow duration-300 hover:shadow-lift dark:bg-ink-800"
              >
                <span className="text-sm font-semibold text-brand-500">{n}</span>
                <h3 className="mt-3 text-lg font-semibold text-ink-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{body}</p>
              </motion.article>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ---------- Bento ---------- */}
      <section id="why" className="canvas-band px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-content">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={revealViewport}
            variants={revealUp}
            className="grid gap-10 md:grid-cols-2 md:items-end"
          >
            <h2 className="text-headline font-semibold text-ink-900 dark:text-white">Why choose believe.ai</h2>
            <p className="text-sm leading-relaxed text-ink-500 dark:text-ink-400">
              Personalization that references real context about you and your recipient — never invented facts — with
              follow-ups that stop the moment someone replies.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={revealViewport}
            variants={revealStagger}
            className="mt-14 grid gap-5 md:grid-cols-3 md:grid-rows-2"
          >
            {/* Large stat tile */}
            <motion.article
              variants={revealUp}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="flex flex-col justify-between rounded-card bg-white p-8 shadow-card transition-shadow duration-300 hover:shadow-lift md:col-span-2 md:row-span-2 dark:bg-ink-800"
            >
              <span className="inline-flex w-fit items-center gap-2 rounded-pill bg-ink-50 px-3 py-1 text-xs font-medium text-ink-600 dark:bg-ink-900 dark:text-ink-200">
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
            </motion.article>

            {/* Accent tile */}
            <motion.article
              variants={revealUp}
              whileHover={{ y: -6, scale: 1.015 }}
              transition={{ type: "spring", stiffness: 340, damping: 24 }}
              className="rounded-card bg-brand-500 p-7 text-white shadow-card transition-shadow duration-300 hover:shadow-lift"
            >
              <h3 className="text-lg font-semibold">Smart follow-ups</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                Sequence day 3, day 7, day 14 — and stop automatically the moment a reply lands.
              </p>
              <div className="mt-6 flex items-center gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <motion.span
                    key={i}
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={revealViewport}
                    transition={{ duration: 0.4, delay: 0.1 + i * 0.08, ease: "easeOut" }}
                    className={cn("h-8 flex-1 origin-bottom rounded-lg", i < 3 ? "bg-white/85" : "bg-white/30")}
                  />
                ))}
              </div>
            </motion.article>

            {/* Providers tile */}
            <motion.article
              variants={revealUp}
              whileHover={{ y: -6, scale: 1.015 }}
              transition={{ type: "spring", stiffness: 340, damping: 24 }}
              className="group rounded-card bg-white p-7 shadow-card transition-shadow duration-300 hover:shadow-lift dark:bg-ink-800"
            >
              <span className="icon-chip transition-transform duration-300 group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-white">
                <Mail className="h-4 w-4" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-ink-900 dark:text-white">Gmail &amp; Outlook</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                Send from the mailbox you already use. Tokens encrypted, never a password stored.
              </p>
            </motion.article>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={revealViewport}
            variants={revealStagger}
            className="mt-5 grid gap-5 md:grid-cols-3"
          >
            {WHY_TILES.map(({ Icon, title, body }) => (
              <motion.article
                key={title}
                variants={revealUp}
                whileHover={{ y: -6, scale: 1.015 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 340, damping: 24 }}
                className="group rounded-card border border-ink-100 bg-white p-7 shadow-card transition-shadow duration-300 hover:shadow-lift dark:border-ink-700 dark:bg-ink-800/60"
              >
                <span className="icon-chip transition-transform duration-300 group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{body}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------- Use cases ---------- */}
      <section id="use-cases" className="px-4 py-24 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
          variants={revealUp}
          className="mx-auto max-w-content text-center"
        >
          <h2 className="text-headline font-semibold text-ink-900 dark:text-white">Built for how you reach out</h2>
          <motion.div variants={revealStagger} className="mt-10 flex flex-wrap justify-center gap-2.5">
            {USE_CASES.map((useCase) => (
              <motion.span
                key={useCase}
                variants={revealUp}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="cursor-default rounded-pill bg-ink-50 px-5 py-2.5 text-sm text-ink-700 transition-colors duration-200 hover:bg-brand-500 hover:text-white dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-brand-500"
              >
                {useCase}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="px-4 py-24 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
          variants={revealUp}
          className="mx-auto max-w-content"
        >
          <div className="relative overflow-hidden rounded-panel bg-gradient-to-br from-brand-500 to-brand-700 px-6 py-20 text-center">
            <motion.div
              aria-hidden="true"
              animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            />
            <motion.div
              aria-hidden="true"
              animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-lime-400/20 blur-3xl"
            />
            <h2 className="relative mx-auto max-w-2xl text-headline font-semibold text-white">
              Your next opportunity might be one email away
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-sm text-white/80">
              Start free. Connect your mailbox, import your audience, and send something worth replying to.
            </p>
            <Link to="/signup" className="relative mt-8 inline-block">
              <Button size="lg" className="bg-white text-ink-900 hover:bg-white/90">
                Start for free
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 px-4 pt-5 sm:px-6">
      <div
        className={cn(
          "mx-auto flex max-w-content items-center justify-between rounded-pill px-5 backdrop-blur transition-all duration-300",
          scrolled
            ? "border border-ink-200/70 bg-white/90 py-2.5 shadow-card dark:border-ink-700 dark:bg-ink-900/85"
            : "border border-transparent bg-white/80 py-3 dark:bg-ink-900/60",
        )}
      >
        <Link to="/" className="flex items-center gap-2">
          <motion.span
            whileHover={{ rotate: -8, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500"
          >
            <Send className="h-3.5 w-3.5 text-white" />
          </motion.span>
          <span className="text-base font-semibold tracking-tight text-ink-900 dark:text-white">believe.ai</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group relative text-sm text-ink-600 transition-colors hover:text-ink-900 dark:text-ink-300 dark:hover:text-white"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-brand-500 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className="hidden md:block">
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

/** Static UX vocabulary for the canvas studio. Everything listed here maps to a
 * capability the existing backend really has (generate screen from a prompt,
 * edit a screen by instruction, move it, delete it) — no mode, chip or action
 * in this file promises something the API can't do. */

export const STARTER_PROMPTS = [
  "Create a modern portfolio for an AI engineer",
  "Design a fintech analytics dashboard",
  "Create a mobile habit tracking app",
  "Design a clean pricing page for a SaaS product",
];

/** The dashboard's "Start with an idea" cards — same prompts as
 * STARTER_PROMPTS, packaged with a category label and icon for the richer
 * card treatment. Kept as a separate, small, curated list (not "templates"
 * backed by real saved designs — no such concept exists in the backend) so
 * the copy never implies these are pre-built designs you're picking up,
 * only starting points for a real generation. */
export const QUICK_START_IDEAS = [
  { icon: "User", category: "Portfolio", prompt: "Personal portfolio for an AI engineer" },
  { icon: "BarChart3", category: "Dashboard", prompt: "Analytics dashboard for a fintech product" },
  { icon: "Smartphone", category: "Mobile App", prompt: "Modern habit tracking application" },
  { icon: "Rocket", category: "Landing Page", prompt: "SaaS product landing page" },
] as const;

/** "Explore ideas" section — a larger, categorized set of the same kind of
 * curated starting prompts as QUICK_START_IDEAS, not a real template
 * library (no templates model/endpoint exists yet — see designApi.ts). */
export const IDEA_CATEGORIES = ["All", "Landing Pages", "Dashboards", "Mobile Apps", "Portfolios", "E-commerce"] as const;

export const EXPLORE_IDEAS = [
  { name: "AI SaaS Dashboard", category: "Dashboards", prompt: "Analytics dashboard for an AI SaaS product, with usage charts and billing" },
  { name: "Developer Portfolio", category: "Portfolios", prompt: "Developer portfolio site with projects, skills, and a contact section" },
  { name: "Fintech Analytics", category: "Dashboards", prompt: "Fintech analytics dashboard tracking expenses, investments, and savings" },
  { name: "Mobile Finance App", category: "Mobile Apps", prompt: "Mobile personal finance app with account balances and spending breakdown" },
  { name: "Startup Landing Page", category: "Landing Pages", prompt: "Startup landing page with a hero, features grid, and pricing section" },
  { name: "E-commerce Store", category: "E-commerce", prompt: "E-commerce product listing and detail page for a furniture store" },
] as const;

/** Workflow modes — not AI models. The backend exposes a single generation
 * path, so these shape the prompt we send rather than pretending to switch model. */
export const WORKFLOW_MODES = [
  { value: "create", label: "Create", hint: "Generate a brand new screen" },
  { value: "refine", label: "Refine", hint: "Change the selected screen in place" },
  { value: "explore", label: "Explore", hint: "Branch variations beside the selection" },
] as const;

export type WorkflowMode = (typeof WORKFLOW_MODES)[number]["value"];

/** Contextual chips shown while exactly one screen is selected. Each becomes a
 * real edit instruction (refine) or a real variation prompt (explore). */
export const SELECTION_CHIPS = [
  "More minimal",
  "More premium",
  "More playful",
  "More professional",
  "Dark version",
  "Try another layout",
  "Different navigation",
  "Different typography",
];

export const MULTI_SELECTION_CHIPS = [
  "Make these dark mode",
  "Make typography consistent",
  "Use the same navigation style",
  "Tighten spacing across these",
];

/** Concise, honest status copy for the generation frame. These describe the
 * stage of the request, never model reasoning. */
export const GENERATION_STAGES = [
  "Reading your brief…",
  "Setting up the layout…",
  "Creating navigation…",
  "Building content hierarchy…",
  "Applying the design system…",
  "Finalising details…",
];

export const VARIATION_DIRECTIONS = ["Minimal", "Editorial", "Expressive"];

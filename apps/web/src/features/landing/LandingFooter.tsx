import { Link } from "react-router-dom";
import { Logo } from "../../components/ui/Logo.js";

interface FooterLink {
  label: string;
  to: string;
}

// Only real destinations. The brief's fuller footer (Company, Legal,
// Download, Social) is deliberately omitted here — believe.ai has no
// About/Careers/Privacy/Terms pages, no mobile apps, and no linked social
// accounts yet, and the brief itself says to include Download/Social only
// if those are real.
const PRODUCT_LINKS: FooterLink[] = [
  { label: "Overview", to: "/#product" },
  { label: "Career Hub", to: "/app/career-fit" },
  { label: "Outreach", to: "/app/campaigns" },
  { label: "Create", to: "/app/design-studio" },
  { label: "Learning", to: "/app/roadmaps" },
];

const RESOURCE_LINKS: FooterLink[] = [
  { label: "Community", to: "/app/community" },
  { label: "News", to: "/app/news" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-line bg-surface px-4 py-14 sm:px-6">
      <div className="mx-auto grid max-w-content gap-10 sm:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Logo size="md" />
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-fg-subtle">
            The AI workspace that helps you learn, build, prepare, connect, and grow.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">Product</p>
          <ul className="mt-3 space-y-2.5">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="text-[13px] text-fg-subtle transition-colors hover:text-fg">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">Resources</p>
          <ul className="mt-3 space-y-2.5">
            {RESOURCE_LINKS.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="text-[13px] text-fg-subtle transition-colors hover:text-fg">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-content border-t border-line pt-6">
        <p className="text-[12px] text-fg-subtle">Believe in your next opportunity.</p>
      </div>
    </footer>
  );
}

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import believeIcon from "../../assets/brand/believe-icon.png";

const SIZES = {
  sm: { icon: 22, text: "text-sm" },
  md: { icon: 26, text: "text-base" },
  lg: { icon: 30, text: "text-xl" },
  xl: { icon: 56, text: "text-3xl" },
} as const;

const Wordmark = ({ textClass }: { textClass: string }) => (
  <span className={`font-bold tracking-tight ${textClass}`}>
    <span className="text-fg">believe</span>
    <span className="text-accent">.</span>
    <span className="text-fg">ai</span>
  </span>
);

/** The one believe.ai brand mark — was independently duplicated across the
 * landing page and auth screens with slightly different sizing each time;
 * this is the single definition they all share. The icon is the finalized
 * brand asset (apps/web/src/assets/brand/believe-icon.png), not a
 * hand-drawn substitute — free-standing, no container, per the brand spec.
 * `layout="stacked"` puts the icon above the wordmark (splash/brand-page
 * use), centered per the spec's stacked-lockup guidance; the default
 * "horizontal" layout is what every screen in the app currently uses. */
export function Logo({
  size = "md",
  to = "/",
  showWordmark = true,
  layout = "horizontal",
}: {
  size?: keyof typeof SIZES;
  to?: string;
  showWordmark?: boolean;
  layout?: "horizontal" | "stacked";
}) {
  const s = SIZES[size];
  const icon = (
    <motion.img
      src={believeIcon}
      alt=""
      whileHover={{ y: -1, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.18 }}
      className="shrink-0"
      style={{ width: s.icon, height: s.icon }}
    />
  );

  if (layout === "stacked") {
    return (
      <Link to={to} className="flex flex-col items-center gap-3">
        {icon}
        {showWordmark && <Wordmark textClass={s.text} />}
      </Link>
    );
  }

  return (
    <Link to={to} className="flex items-center gap-2">
      {icon}
      {showWordmark && <Wordmark textClass={s.text} />}
    </Link>
  );
}

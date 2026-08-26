import { Link, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";
import { ThemeToggle } from "../../components/layout/ThemeToggle.js";

export function AuthLayout() {
  return (
    <div className="canvas-band relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="absolute left-4 top-4 flex items-center gap-2 sm:left-6 sm:top-6">
        <Link
          to="/"
          className="flex items-center gap-1.5 rounded-pill bg-white/70 px-3 py-1.5 text-xs font-medium text-ink-600 backdrop-blur transition-colors hover:text-ink-900 dark:bg-ink-900/40 dark:text-ink-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to home
        </Link>
      </div>
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <motion.span
              whileHover={{ rotate: -8, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500"
            >
              <Send className="h-4 w-4 text-white" />
            </motion.span>
            <span className="text-xl font-semibold tracking-tight text-ink-900 dark:text-white">believe.ai</span>
          </Link>
          <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">Believe in your next opportunity.</p>
        </div>
        <Outlet />
      </motion.div>
    </div>
  );
}

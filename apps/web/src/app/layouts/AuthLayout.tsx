import { Link, Outlet } from "react-router-dom";
import { Send } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="canvas-band flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <Send className="h-4 w-4 text-white" />
            </span>
            <span className="text-xl font-semibold tracking-tight text-ink-900 dark:text-white">believe.ai</span>
          </Link>
          <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">Believe in your next opportunity.</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

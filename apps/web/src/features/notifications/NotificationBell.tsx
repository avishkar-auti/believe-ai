import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn.js";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./notificationsApi.js";

export function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    // Notifications are created by the worker out-of-band, so there's
    // nothing to invalidate on — poll instead.
    refetchInterval: 30_000,
  });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  const readMutation = useMutation({ mutationFn: markNotificationRead, onSuccess: invalidate });
  const readAllMutation = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: invalidate });

  // Close on outside click so the panel doesn't stay stuck open while navigating.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const unread = data?.unread ?? 0;
  const items = data?.items ?? [];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-ink-600 transition-colors hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-medium text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg dark:border-ink-700 dark:bg-ink-800">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2.5 dark:border-ink-700">
            <span className="text-sm font-medium text-ink-900 dark:text-white">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => readAllMutation.mutate()}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-500 dark:text-ink-400">
              Nothing yet — we'll let you know when a campaign finishes.
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-ink-100 overflow-y-auto dark:divide-ink-700">
              {items.map((n) => {
                const content = (
                  <div className="flex gap-2">
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                    <div className={cn(!n.read || "pl-4")}>
                      <p className="text-sm font-medium text-ink-900 dark:text-white">{n.title}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">{n.body}</p>
                    </div>
                  </div>
                );

                return (
                  <li key={n.id} className="hover:bg-ink-50 dark:hover:bg-ink-700/50">
                    {n.link ? (
                      <Link
                        to={n.link}
                        className="block px-4 py-3"
                        onClick={() => {
                          if (!n.read) readMutation.mutate(n.id);
                          setOpen(false);
                        }}
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="block w-full px-4 py-3 text-left"
                        onClick={() => !n.read && readMutation.mutate(n.id)}
                      >
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

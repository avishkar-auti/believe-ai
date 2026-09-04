/**
 * The app's layering scale, as Tailwind class strings (not raw numbers) so
 * every consumer just spreads `className={Z.floatingNote}` etc. This codifies
 * the values already in use across the app (dropdowns at z-20/30, floating
 * notes at z-40, modals/drawers at z-50, confirm dialogs at z-[60], toasts at
 * z-[70]) rather than introducing a second, conflicting scale.
 */
export const Z = {
  /** In-page sticky bits: a table header, a section nav. */
  sticky: "z-10",
  /** A small inline overlay anchored to a trigger — a select, a tag picker. */
  dropdown: "z-20",
  /** A page-level menu/popover — the "···" note actions menu, filter popover. */
  menu: "z-30",
  /** Floating Note widgets — above normal page content, below anything modal. */
  floatingNote: "z-40",
  /** Command palette, side panels, non-critical modals. */
  overlay: "z-50",
  /** Confirmation dialogs — above whatever they're confirming. */
  confirmDialog: "z-[60]",
  /** Toasts — always on top, everything else can be mid-transition beneath them. */
  toast: "z-[70]",
} as const;

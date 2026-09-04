import { Search } from "lucide-react";
import { OPEN_COMMAND_PALETTE_EVENT } from "../../../features/search/CommandPalette.js";
import { Tooltip } from "../../ui/Tooltip.js";

function openPalette() {
  window.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE_EVENT));
}

/** Opens the app's real command palette — same event Topbar's own search
 * trigger dispatches. Never a standalone/fake search field. */
export function SidebarSearch({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="flex shrink-0 justify-center px-0 pb-2">
        <Tooltip label="Search" side="right">
          <button
            type="button"
            onClick={openPalette}
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-control text-fg-subtle transition-colors hover:bg-fg/[0.06] hover:text-fg"
          >
            <Search className="h-4 w-4" />
          </button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="shrink-0 px-3 pb-2">
      <button
        type="button"
        onClick={openPalette}
        className="flex w-full items-center gap-2 rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-fg-subtle transition-colors hover:border-line-strong hover:bg-surface-3"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        Search…
        <kbd className="ml-auto rounded-md bg-surface px-1.5 py-0.5 font-sans text-[10px] text-fg-subtle">⌘K</kbd>
      </button>
    </div>
  );
}

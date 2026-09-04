import { useState } from "react";
import type { PanelTab } from "./RoomSidePanel.js";

/** Convenience state hook so the page keeps a single source of panel truth. */
export function usePanelState(initial: PanelTab = "questions") {
  const [tab, setTab] = useState<PanelTab>(initial);
  const [open, setOpen] = useState(true);
  return { tab, setTab, open, setOpen };
}

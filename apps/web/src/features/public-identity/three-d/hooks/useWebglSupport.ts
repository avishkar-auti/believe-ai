import { useState } from "react";

function detectWebgl(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

/** Checked once per mount, not per frame — WebGL support doesn't change
 * mid-session. Used to gate the 3D experience vs. the CSS fallback. */
export function useWebglSupport() {
  const [supported] = useState(detectWebgl);
  return supported;
}

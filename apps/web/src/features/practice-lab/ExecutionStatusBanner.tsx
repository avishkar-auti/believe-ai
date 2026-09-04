import { CircleCheck, Info } from "lucide-react";
import { cn } from "../../lib/cn.js";

/** The one status banner for execution output — reused everywhere a
 * Run/Evaluate/Submit result renders. Tone follows `executed` (real Judge0
 * run vs. mock preview) so a user can always tell which one they got. */
export function ExecutionStatusBanner({ message, executed }: { message: string; executed: boolean }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-control border px-3.5 py-2.5 text-caption text-fg",
        executed ? "border-positive/30 bg-positive/10" : "border-caution/30 bg-caution/10",
      )}
    >
      {executed ? (
        <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-positive" />
      ) : (
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-caution" />
      )}
      <span>{message}</span>
    </div>
  );
}

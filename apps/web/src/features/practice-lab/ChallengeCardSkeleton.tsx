import { Skeleton } from "../../components/ui/Skeleton.js";

export function ChallengeCardSkeleton() {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-16 rounded-pill" />
      </div>
      <Skeleton className="mt-3 h-3.5 w-full" />
      <Skeleton className="mt-1.5 h-3.5 w-5/6" />
      <div className="mt-3 flex gap-1.5">
        <Skeleton className="h-4 w-14 rounded-pill" />
        <Skeleton className="h-4 w-16 rounded-pill" />
      </div>
      <Skeleton className="mt-4 h-3 w-1/2" />
    </div>
  );
}

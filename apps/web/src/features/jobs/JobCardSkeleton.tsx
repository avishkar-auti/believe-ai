import { Skeleton } from "../../components/ui/Skeleton.js";

export function JobCardSkeleton() {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-9 w-9 shrink-0 rounded-control" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-1.5 pt-1">
            <Skeleton className="h-5 w-14 rounded-pill" />
            <Skeleton className="h-5 w-14 rounded-pill" />
            <Skeleton className="h-5 w-10 rounded-pill" />
          </div>
        </div>
      </div>
    </div>
  );
}

import { Skeleton } from "../../components/ui/Skeleton.js";

export function PostSkeleton() {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="mt-4 h-4 w-2/3" />
      <div className="mt-2.5 space-y-1.5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-7 w-14 rounded-control" />
        <Skeleton className="h-7 w-20 rounded-control" />
      </div>
    </div>
  );
}

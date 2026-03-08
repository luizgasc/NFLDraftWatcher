import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LoadingSkeletonProps = {
  className?: string;
  rows?: number;
};

export function LoadingSkeleton({
  className,
  rows = 3,
}: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-5 w-36" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

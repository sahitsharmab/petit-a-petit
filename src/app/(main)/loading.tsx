import { Skeleton } from "@/components/ui/skeleton";

/** Shown instantly while a page's data loads, so taps never feel ignored. The nav stays usable. */
export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <Skeleton className="h-9 w-56" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-40 md:col-span-2" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
    </div>
  );
}

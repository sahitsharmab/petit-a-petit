import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-dvh" role="status" aria-label="Loading lesson">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink">
            <ArrowLeft className="size-4" /> Back
          </Link>
          <Skeleton className="h-2.5 flex-1 rounded-full" />
        </div>
      </header>
      <div className="mx-auto max-w-2xl space-y-5 px-4 pt-10 sm:px-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}

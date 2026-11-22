import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="space-y-3">
        <p className="font-display text-5xl font-semibold">Oups !</p>
        <p className="text-muted">We couldn&apos;t find that page.</p>
        <Button asChild><Link href="/">Back to today</Link></Button>
      </div>
    </div>
  );
}

"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Coffee, Home, KeyRound, Loader2, MapPinned, Stethoscope, Users, Wrench } from "lucide-react";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";

const ICONS = { coffee: Coffee, home: Home, key: KeyRound, map: MapPinned, stethoscope: Stethoscope, wrench: Wrench, briefcase: Briefcase, users: Users };

export function ScenarioCard({ id, title, subtitle, icon, register, recommended, done }: {
  id: string; title: string; subtitle: string; icon: keyof typeof ICONS; register: string; recommended: boolean; done: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const Icon = ICONS[icon];
  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ id: string }>("/api/conversations", { scenarioId: id });
      router.push(`/practice/session/${res.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };
  return (
    <button type="button" onClick={start} disabled={busy}
      className={cn("card group flex h-full flex-col items-start gap-3 p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-70", recommended && "ring-1 ring-primary/30")}>
      <div className="flex w-full items-start justify-between">
        <span className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary">{busy ? <Loader2 className="size-5 animate-spin" /> : <Icon className="size-5" />}</span>
        <span className="text-xs text-subtle">{register === "tu" ? "informal · tu" : "polite · vous"}</span>
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
      </div>
      <p className="mt-auto text-xs text-subtle">{done ? `Practised ${done}×` : recommended ? "Good fit for your level" : "Stretch goal"}</p>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </button>
  );
}

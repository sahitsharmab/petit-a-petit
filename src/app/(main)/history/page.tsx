import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MessagesSquare, Sparkles } from "lucide-react";
import { getDb } from "@/lib/db";
import { getHistory } from "@/lib/services/stats";
import { formatDateLong } from "@/lib/learning/dates";
import { getScenario } from "@/lib/content/scenarios";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pct } from "@/lib/utils";

export const metadata: Metadata = { title: "History" };
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const { lessons, conversations } = await getHistory(await getDb());
  const byDate = new Map<string, typeof lessons>();
  for (const l of lessons) byDate.set(l.date, [...(byDate.get(l.date) ?? []), l]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-[2.1rem] font-semibold leading-tight">History</h1>
        <p className="mt-1 text-muted">Revisit any past lesson — every exercise, your answers and the corrections.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section aria-label="Lessons" className="space-y-6">
          {lessons.length === 0 && (
            <div className="card p-8 text-center text-muted">No lessons yet. Your first lesson will appear here.</div>
          )}
          {[...byDate.entries()].map(([date, items]) => (
            <div key={date}>
              <h2 className="mb-2 text-sm font-medium text-muted">{formatDateLong(date)}</h2>
              <ul className="card divide-y divide-border">
                {items.map((l) => (
                  <li key={l.id}>
                    <Link href={`/history/${l.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2/50">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{l.title}</p>
                          {l.source !== "local" && <Sparkles className="size-3.5 text-primary" aria-label="AI-enhanced" />}
                        </div>
                        <p className="text-sm text-muted">
                          {l.kind === "daily" ? `Week ${l.week} · Day ${l.day}` : l.kind === "review" ? "Review session" : "Practice"}
                          {l.minutes ? ` · ${l.minutes} min` : ""}
                        </p>
                      </div>
                      {l.status === "completed" ? <Badge tone={l.score !== null && l.score >= 0.6 ? "success" : "warning"}>{l.score !== null ? pct(l.score) : "Done"}</Badge>
                        : l.status === "in_progress" ? <Badge tone="primary">In progress</Badge> : <Badge>Not started</Badge>}
                      <ChevronRight className="size-4 text-subtle" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <Card className="h-fit">
          <CardHeader><CardTitle className="flex items-center gap-2"><MessagesSquare className="size-4 text-subtle" /> Conversations</CardTitle></CardHeader>
          <CardContent>
            {conversations.length ? (
              <ul className="space-y-1">
                {conversations.map((c) => (
                  <li key={c.id}>
                    <Link href={`/practice/session/${c.id}`} className="-mx-2 flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm hover:bg-surface-2/60">
                      <span><span className="font-medium">{getScenario(c.scenarioId)?.title ?? c.scenarioId}</span><span className="block text-xs text-muted">{formatDateLong(c.studyDate)} · {c.mode === "ai" ? "AI partner" : "Guided"}</span></span>
                      <Badge tone={c.status === "completed" ? "success" : "primary"}>{c.status === "completed" ? "Done" : "Open"}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">No conversations yet. <Link className="text-primary hover:underline" href="/practice">Start one</Link>.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

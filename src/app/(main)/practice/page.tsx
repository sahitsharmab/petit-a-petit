import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { Bot, Route, Target } from "lucide-react";
import { getDb, schema } from "@/lib/db";
import { SCENARIOS } from "@/lib/content/scenarios";
import { ORDERED_SKILLS } from "@/lib/content/curriculum";
import { aiStatus } from "@/lib/ai/provider";
import { learnerLevel } from "@/lib/services/conversations";
import { getSettings } from "@/lib/services/stats";
import { loadProgress } from "@/lib/services/progress";
import { ScenarioCard } from "@/components/practice/scenario-card";
import { StartLessonButton } from "@/components/dashboard/start-lesson-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Practice" };
export const dynamic = "force-dynamic";

export default async function PracticePage() {
  const db = await getDb();
  const status = aiStatus();
  const settings = await getSettings(db);
  const aiOn = status.configured && settings.aiEnabled;
  const level = await learnerLevel(db);
  const counts = new Map((await db.select({ s: schema.conversationSessions.scenarioId, n: sql<number>`count(*)` }).from(schema.conversationSessions).groupBy(schema.conversationSessions.scenarioId).all()).map((r) => [r.s, Number(r.n)]));
  const progress = await loadProgress(db);
  const weak = ORDERED_SKILLS.filter((s) => (progress[s.id]?.attempts ?? 0) > 0 && s.category !== "review").sort((a, b) => (progress[a.id]!.mastery - progress[b.id]!.mastery)).slice(0, 4);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[2.1rem] font-semibold leading-tight">Practice</h1>
          <p className="mt-1 max-w-xl text-muted">Real situations from life in France. Reply by tapping a suggestion, typing freely, or speaking.</p>
        </div>
        <Badge tone={aiOn ? "primary" : "neutral"} className="px-3 py-1 text-sm">
          {aiOn ? <><Bot /> AI partner · {status.model}</> : <><Route /> Guided conversations</>}
        </Badge>
      </header>

      {!aiOn && (
        <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted">
          No AI provider is configured, so conversations follow guided scripts that understand free-typed replies and correct common mistakes.
          Add an Anthropic key or a local Ollama model (see Settings) for open-ended conversations.
        </p>
      )}

      <section aria-labelledby="scenarios">
        <h2 id="scenarios" className="mb-3 font-semibold">Situations <span className="text-sm font-normal text-muted">· your level: {level.cefr}</span></h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SCENARIOS.map((s) => (
            <ScenarioCard key={s.id} id={s.id} title={s.title} subtitle={s.subtitle} icon={s.icon} register={s.register} recommended={s.minWeek <= level.week + 1} done={counts.get(s.id) ?? 0} />
          ))}
        </div>
      </section>

      <Card>
        <CardHeader><div><CardTitle className="flex items-center gap-2"><Target className="size-4 text-subtle" /> Targeted practice</CardTitle><CardDescription>A focused drill on one topic — choose your weakest, or pick any from the roadmap.</CardDescription></div></CardHeader>
        <CardContent>
          {weak.length ? (
            <div className="flex flex-wrap gap-2">
              {weak.map((s) => <StartLessonButton key={s.id} label={`${s.short} · ${Math.round(progress[s.id]!.mastery * 100)}%`} practice={{ kind: "skill", skillId: s.id }} size="sm" variant="outline" showArrow={false} />)}
              <StartLessonButton label="Mixed review" practice={{ kind: "review" }} size="sm" variant="secondary" showArrow={false} />
            </div>
          ) : <p className="text-sm text-muted">Complete a lesson first — then your weakest topics show up here.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

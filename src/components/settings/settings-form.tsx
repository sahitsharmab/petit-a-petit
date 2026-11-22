"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, BellRing, Bot, Check, Download, Loader2, Upload, Volume2 } from "lucide-react";
import { api } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { useSpeech } from "@/components/speech/use-speech";
import type { AiStatus } from "@/lib/ai/provider";

interface Settings {
  displayName: string; dailyGoalMinutes: number; reminderEnabled: boolean; reminderTime: string; aiEnabled: boolean;
  showTranslations: boolean; speechRate: number; autoPlayAudio: boolean;
}

function Row({ label, description, children, htmlFor }: { label: string; description?: React.ReactNode; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-md">
        <label htmlFor={htmlFor} className="font-medium">{label}</label>
        {description && <div className="mt-0.5 text-sm text-muted">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsForm({ initial, ai }: { initial: Settings; ai: AiStatus }) {
  const router = useRouter();
  const [s, setS] = React.useState(initial);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [perm, setPerm] = React.useState<NotificationPermission | "unsupported">("default");
  const { speak, supported: ttsSupported, hasFrenchVoice } = useSpeech(s.speechRate);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => { setPerm("Notification" in window ? Notification.permission : "unsupported"); }, []);

  const save = (patch: Partial<Settings>) => {
    setS((prev) => ({ ...prev, ...patch }));
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await api("/api/settings", patch, "PUT");
        setSaved(true);
        setError(null);
        setTimeout(() => setSaved(false), 1500);
        router.refresh();
      } catch (e) { setError((e as Error).message); }
    }, 350);
  };

  const askPermission = async () => {
    if (!("Notification" in window)) return;
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") new Notification("Reminders are on", { body: `We'll nudge you at ${s.reminderTime} while the app is open.` });
  };

  return (
    <div className="space-y-6">
      <div className="h-5 text-sm" aria-live="polite">
        {saved && <span className="inline-flex items-center gap-1 text-success"><Check className="size-4" /> Saved</span>}
        {error && <span className="text-danger">{error}</span>}
      </div>

      <Card>
        <CardHeader><CardTitle>Profile & goals</CardTitle></CardHeader>
        <CardContent className="divide-y divide-border">
          <Row label="Your name" description="Used in greetings." htmlFor="name">
            <input id="name" value={s.displayName} maxLength={40} onChange={(e) => save({ displayName: e.target.value })} placeholder="e.g. Sam"
              className="h-10 w-56 rounded-xl border border-border bg-surface px-3 outline-none focus:border-primary" />
          </Row>
          <Row label="Daily goal" description="Shown as the reference line in your weekly activity.">
            <div role="radiogroup" aria-label="Daily goal" className="inline-flex rounded-xl bg-surface-2 p-1">
              {[10, 15, 20, 30].map((m) => (
                <button key={m} type="button" role="radio" aria-checked={s.dailyGoalMinutes === m} onClick={() => save({ dailyGoalMinutes: m })}
                  className={`rounded-lg px-3 py-1.5 text-sm ${s.dailyGoalMinutes === m ? "bg-surface shadow-soft" : "text-muted hover:text-ink"}`}>{m} min</button>
              ))}
            </div>
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><div><CardTitle className="flex items-center gap-2"><BellRing className="size-4 text-subtle" /> Daily reminder</CardTitle><CardDescription>Times are in Europe/Paris.</CardDescription></div></CardHeader>
        <CardContent className="divide-y divide-border">
          <Row label="Remind me to study" description="Shows a banner in the app after your study time, and a browser notification if allowed.">
            <Switch checked={s.reminderEnabled} onCheckedChange={(v) => save({ reminderEnabled: v })} aria-label="Enable daily reminder" />
          </Row>
          <Row label="Study time" htmlFor="time">
            <input id="time" type="time" value={s.reminderTime} onChange={(e) => e.target.value && save({ reminderTime: e.target.value })} disabled={!s.reminderEnabled}
              className="h-10 rounded-xl border border-border bg-surface px-3 outline-none focus:border-primary disabled:opacity-50" />
          </Row>
          <Row label="Browser notifications" description={
            perm === "unsupported" ? "This browser doesn't support notifications." :
            perm === "granted" ? "Allowed." : perm === "denied" ? "Blocked — change it in your browser's site settings." : "Not yet allowed."}>
            <Button variant="outline" size="sm" onClick={askPermission} disabled={perm !== "default" || !s.reminderEnabled}>Allow notifications</Button>
          </Row>
          <p className="pt-4 text-sm text-muted">
            <strong className="font-medium text-ink">Be aware:</strong> browser notifications only fire while a tab of this app is open (it can be in the background).
            They can&apos;t run when the browser or computer is closed — there&apos;s no hidden background service. For a guaranteed nudge, also set an alarm on your phone or a calendar event for {s.reminderTime}.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><div><CardTitle className="flex items-center gap-2"><Bot className="size-4 text-subtle" /> AI tutor</CardTitle><CardDescription>Optional. Everything works offline without it.</CardDescription></div></CardHeader>
        <CardContent className="divide-y divide-border">
          <Row label="Provider" description={ai.configured ? <>Connected: <span className="font-medium text-ink">{ai.provider}</span> · {ai.model}</> : ai.reason}>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${ai.configured ? "bg-success-soft text-success" : "bg-surface-2 text-muted"}`}>
              <span className={`size-1.5 rounded-full ${ai.configured ? "bg-success" : "bg-subtle"}`} /> {ai.configured ? "Available" : "Offline mode"}
            </span>
          </Row>
          <Row label="Use AI features" description="Fresh examples and exercises in new lessons, flexible checking of translations, open conversations and feedback.">
            <Switch checked={s.aiEnabled} disabled={!ai.configured} onCheckedChange={(v) => save({ aiEnabled: v })} aria-label="Use AI features" />
          </Row>
          {!ai.configured && (
            <div className="pt-4 text-sm text-muted">
              <p>To enable, create a <code className="rounded bg-surface-2 px-1">.env.local</code> file in the project folder and restart the app:</p>
              <pre className="mt-2 overflow-x-auto rounded-xl bg-surface-2 p-3 text-xs text-ink">{`# Anthropic (Claude)
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...

# or a local model with Ollama
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.1:8b`}</pre>
              <p className="mt-2">Keys stay on the server side of this app and are never sent to the browser.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Volume2 className="size-4 text-subtle" /> Audio & display</CardTitle></CardHeader>
        <CardContent className="divide-y divide-border">
          <Row label="Speaking speed" description={!ttsSupported ? "Speech isn't supported in this browser." : !hasFrenchVoice ? "No French voice found — install one in your OS speech settings for the best audio." : "Uses your browser's French voice."} htmlFor="rate">
            <div className="flex items-center gap-3">
              <input id="rate" type="range" min={0.6} max={1.2} step={0.05} value={s.speechRate} onChange={(e) => save({ speechRate: Number(e.target.value) })} className="w-36 accent-[var(--primary)]" />
              <span className="w-10 text-sm tabular-nums text-muted">{s.speechRate.toFixed(2)}×</span>
              <Button size="sm" variant="ghost" onClick={() => speak("Bonjour ! On apprend le français ensemble ?", s.speechRate)} disabled={!ttsSupported}>Test</Button>
            </div>
          </Row>
          <Row label="Play audio automatically" description="Read listening exercises and conversation replies aloud.">
            <Switch checked={s.autoPlayAudio} onCheckedChange={(v) => save({ autoPlayAudio: v })} aria-label="Play audio automatically" />
          </Row>
          <Row label="Show English translations" description="Default for dialogues and conversations (you can toggle it in each conversation).">
            <Switch checked={s.showTranslations} onCheckedChange={(v) => save({ showTranslations: v })} aria-label="Show English translations" />
          </Row>
          <Row label="Theme"><ThemeToggle /></Row>
        </CardContent>
      </Card>

      <DataCard />
    </div>
  );
}

function DataCard() {
  const router = useRouter();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [msg, setMsg] = React.useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [confirm, setConfirm] = React.useState("");

  const onFile = async (file: File) => {
    setBusy(true);
    setMsg(null);
    try {
      const json = JSON.parse(await file.text());
      // Validate first and show what the file contains before anything is replaced.
      const { preview } = await api<{ preview: Record<string, number> }>("/api/import?preview=1", json);
      const what = `${preview.generatedLessons} lessons, ${preview.lessonSessions} sessions and ${preview.exerciseAttempts} answers`;
      if (!window.confirm(`This backup contains ${what}.\n\nImporting replaces ALL current progress. A copy of your current progress is saved first in data/backups. Continue?`)) return;
      const res = await api<{ imported: Record<string, number>; safetyCopy?: string }>("/api/import", json);
      setMsg({
        tone: "ok",
        text: `Imported ${res.imported.generatedLessons ?? 0} lessons and ${res.imported.exerciseAttempts ?? 0} answers.${res.safetyCopy ? ` Your previous progress was saved as data/backups/${res.safetyCopy}.` : ""}`,
      });
      router.refresh();
    } catch (e) {
      setMsg({ tone: "err", text: e instanceof SyntaxError ? "That file isn't valid JSON." : (e as Error).message });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const reset = async () => {
    setBusy(true);
    try {
      await api("/api/reset", { confirm: "RESET" });
      window.location.href = "/";
    } catch (e) {
      setMsg({ tone: "err", text: (e as Error).message });
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader><div><CardTitle>Your data</CardTitle><CardDescription>Stored locally in <code>data/french.db</code> (SQLite). Nothing is sent anywhere unless you enable an AI provider.</CardDescription></div></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><a href="/api/export" download><Download /> Export progress (JSON)</a></Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Upload />} Import backup</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" aria-label="Backup file" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <Dialog>
            <DialogTrigger asChild><Button variant="ghost" className="text-danger hover:bg-danger-soft hover:text-danger"><AlertTriangle /> Reset progress</Button></DialogTrigger>
            <DialogContent title="Reset all progress?" description="This deletes every lesson, answer, conversation and mastery score. Export a backup first if you might want it back.">
              <label className="text-sm" htmlFor="confirm-reset">Type <strong>RESET</strong> to confirm</label>
              <input id="confirm-reset" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-border bg-surface px-3 outline-none focus:border-danger" />
              <div className="mt-4 flex justify-end"><Button variant="danger" disabled={confirm !== "RESET" || busy} onClick={reset}>Delete everything</Button></div>
            </DialogContent>
          </Dialog>
        </div>
        {msg && <p role="status" className={msg.tone === "ok" ? "text-sm text-success" : "text-sm text-danger"}>{msg.text}</p>}
      </CardContent>
    </Card>
  );
}

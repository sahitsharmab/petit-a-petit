"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Bot, KeyRound, Loader2 } from "lucide-react";
import { api } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ANTHROPIC_MODELS, type AiStatus } from "@/lib/ai/models";

const field = "h-10 rounded-xl border border-border bg-surface px-3 outline-none focus:border-primary";

/** The AI tutor settings: the learner's own Anthropic key (stored encrypted, never shown again) and the on/off switch. */
export function AiCard({ ai: initial, hosted, aiEnabled, onToggle }: {
  ai: AiStatus; hosted: boolean; aiEnabled: boolean; onToggle: (v: boolean) => void;
}) {
  const router = useRouter();
  const [ai, setAi] = React.useState(initial);
  const own = ai.source === "own";
  const [editing, setEditing] = React.useState(!own);
  const [key, setKey] = React.useState("");
  const [model, setModel] = React.useState(own && ai.model ? ai.model : ANTHROPIC_MODELS[0].id);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const run = async (fn: () => Promise<AiStatus>, done: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const next = await fn();
      setAi(next);
      setKey("");
      setEditing(next.source !== "own");
      setMsg({ tone: "ok", text: done });
      router.refresh();
    } catch (e) {
      setMsg({ tone: "err", text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };
  const saveKey = () => run(() => api<AiStatus>("/api/ai/key", { apiKey: key, model }, "PUT"), "Key checked and saved. AI features are on.");
  const saveModel = (m: string) => {
    setModel(m);
    void run(() => api<AiStatus>("/api/ai/key", { model: m }, "PUT"), "Model updated.");
  };
  const remove = () => {
    if (!window.confirm("Remove your API key? The app goes back to offline mode.")) return;
    void run(() => api<AiStatus>("/api/ai/key", undefined, "DELETE"), "Key removed.");
  };

  const statusPill = (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${ai.configured ? "bg-success-soft text-success" : "bg-surface-2 text-muted"}`}>
      <span className={`size-1.5 rounded-full ${ai.configured ? "bg-success" : "bg-subtle"}`} /> {ai.configured ? "Available" : "Offline mode"}
    </span>
  );

  return (
    <Card>
      <CardHeader><div><CardTitle className="flex items-center gap-2"><Bot className="size-4 text-subtle" /> AI tutor</CardTitle><CardDescription>Optional. Everything works offline without it.</CardDescription></div></CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md">
            <p className="font-medium">Provider</p>
            <p className="mt-0.5 text-sm text-muted">
              {own ? <>Your own Anthropic key <code className="rounded bg-surface-2 px-1">{ai.keyHint}</code> · {ANTHROPIC_MODELS.find((m) => m.id === ai.model)?.label ?? ai.model}</>
                : ai.source === "server" ? <>Using this site&apos;s shared setup: <span className="font-medium text-ink">{ai.provider}</span> · {ai.model}. You can add your own key instead.</>
                  : "No AI provider yet — running fully offline."}
            </p>
          </div>
          {statusPill}
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md">
            <label className="font-medium" htmlFor="ai-on">Use AI features</label>
            <p className="mt-0.5 text-sm text-muted">Fresh examples and exercises in new lessons, flexible checking of translations, open conversations and feedback.</p>
          </div>
          <Switch id="ai-on" checked={aiEnabled && ai.configured} disabled={!ai.configured} onCheckedChange={onToggle} aria-label="Use AI features" />
        </div>

        <div className="border-t border-border pt-4">
          <p className="flex items-center gap-2 font-medium"><KeyRound className="size-4 text-subtle" /> Your Anthropic API key</p>
          {ai.keyProblem && <p className="mt-1 text-sm text-warning">{ai.keyProblem}</p>}
          <p className="mt-0.5 text-sm text-muted">
            Only you use it, and usage is billed to your Anthropic account. It&apos;s checked with Anthropic, stored encrypted in your own data,
            never shown again, and never included in exports. Create one at <a className="text-primary underline-offset-4 hover:underline" href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">console.anthropic.com</a>.
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
            {editing ? (
              <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-…" autoComplete="off" spellCheck={false}
                aria-label="Anthropic API key" className={`${field} w-full font-mono text-sm`} />
            ) : (
              <div className={`${field} flex items-center font-mono text-sm text-muted`}>sk-ant-{ai.keyHint}</div>
            )}
            <select value={model} onChange={(e) => (own && !editing ? saveModel(e.target.value) : setModel(e.target.value))} disabled={busy}
              aria-label="Model" className={`${field} text-sm`}>
              {ANTHROPIC_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label} · {m.note}</option>)}
            </select>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {editing ? (
              <>
                <Button size="sm" onClick={saveKey} disabled={busy || !key.trim()}>{busy ? <Loader2 className="animate-spin" /> : null} Check &amp; save key</Button>
                {own && <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setKey(""); setMsg(null); }} disabled={busy}>Cancel</Button>}
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => { setEditing(true); setMsg(null); }} disabled={busy}>Replace key</Button>
                <Button size="sm" variant="ghost" className="text-danger hover:bg-danger-soft hover:text-danger" onClick={remove} disabled={busy}>Remove key</Button>
              </>
            )}
          </div>
          {msg && <p role="status" className={`mt-2 text-sm ${msg.tone === "ok" ? "text-success" : "text-danger"}`}>{msg.text}</p>}
          {!hosted && !own && (
            <p className="mt-3 text-xs text-muted">Running on your own computer? You can also use a local Ollama model: set <code className="rounded bg-surface-2 px-1">AI_PROVIDER=ollama</code> in <code className="rounded bg-surface-2 px-1">.env.local</code> and restart.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

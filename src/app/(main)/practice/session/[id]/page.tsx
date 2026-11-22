import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getScenario } from "@/lib/content/scenarios";
import { getConversation, isScriptFinished } from "@/lib/services/conversations";
import { getSettings } from "@/lib/services/stats";
import { HttpError } from "@/lib/services/sessions";
import { Chat } from "@/components/practice/chat";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  let conv;
  try {
    conv = getConversation(db, id);
  } catch (e) {
    if (e instanceof HttpError) notFound();
    throw e;
  }
  const sc = getScenario(conv.scenarioId);
  if (!sc) notFound();
  const s = getSettings(db);
  return (
    <Chat initial={conv} initialFinished={isScriptFinished(conv)}
      scenario={{ title: sc.title, goal: sc.goal, partner: sc.partner, vocabulary: sc.vocabulary }}
      settings={{ showTranslations: s.showTranslations, speechRate: s.speechRate, autoPlayAudio: s.autoPlayAudio }} />
  );
}

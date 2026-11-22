import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/services/stats";
import { aiStatus } from "@/lib/ai/provider";
import { SettingsForm } from "@/components/settings/settings-form";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const s = getSettings(getDb());
  return (
    <div className="mx-auto max-w-3xl space-y-2">
      <h1 className="font-display text-[2.1rem] font-semibold leading-tight">Settings</h1>
      <SettingsForm ai={aiStatus()} initial={{
        displayName: s.displayName, dailyGoalMinutes: s.dailyGoalMinutes, reminderEnabled: s.reminderEnabled, reminderTime: s.reminderTime,
        aiEnabled: s.aiEnabled, showTranslations: s.showTranslations, speechRate: s.speechRate, autoPlayAudio: s.autoPlayAudio,
      }} />
    </div>
  );
}

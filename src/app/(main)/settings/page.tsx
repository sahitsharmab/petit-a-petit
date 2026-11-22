import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { currentUser } from "@/lib/auth/current";
import { authEnabled } from "@/lib/auth/users";
import { getSettings } from "@/lib/services/stats";
import { aiStatus } from "@/lib/ai/provider";
import { SettingsForm } from "@/components/settings/settings-form";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await getSettings(await getDb());
  const user = authEnabled() ? await currentUser() : null;
  return (
    <div className="mx-auto max-w-3xl space-y-2">
      <h1 className="font-display text-[2.1rem] font-semibold leading-tight">Settings</h1>
      {user && (
        <div className="card flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <p className="text-muted">Signed in as <span className="font-medium text-ink">{user.name}</span>. Your progress is separate from other learners&apos;.</p>
          <SignOutButton />
        </div>
      )}
      <SettingsForm ai={aiStatus()} initial={{
        displayName: s.displayName, dailyGoalMinutes: s.dailyGoalMinutes, reminderEnabled: s.reminderEnabled, reminderTime: s.reminderTime,
        aiEnabled: s.aiEnabled, showTranslations: s.showTranslations, speechRate: s.speechRate, autoPlayAudio: s.autoPlayAudio,
      }} />
    </div>
  );
}

import { AppShell } from "@/components/shell/app-shell";
import { ReminderManager } from "@/components/reminders/reminder-manager";
import { getDb } from "@/lib/db";
import { getSettings, todayCard } from "@/lib/services/stats";

export const dynamic = "force-dynamic";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const db = getDb();
  const s = getSettings(db);
  const card = todayCard(db, new Date());
  return (
    <AppShell>
      <ReminderManager enabled={s.reminderEnabled} time={s.reminderTime} lessonDone={card.status === "completed"} />
      {children}
    </AppShell>
  );
}

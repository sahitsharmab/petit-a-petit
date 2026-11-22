import { AppShell } from "@/components/shell/app-shell";
import { ReminderManager } from "@/components/reminders/reminder-manager";
import { CourseProvider } from "@/components/course/course-context";
import { getDb } from "@/lib/db";
import { getSettings, todayCard } from "@/lib/services/stats";

export const dynamic = "force-dynamic";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const db = await getDb();
  const s = await getSettings(db);
  const card = await todayCard(db, new Date());
  return (
    <CourseProvider lang={db.lang}>
      <AppShell>
        <ReminderManager enabled={s.reminderEnabled} time={s.reminderTime} lessonDone={card.status === "completed"} />
        {children}
      </AppShell>
    </CourseProvider>
  );
}

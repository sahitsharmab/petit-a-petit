import { AppShell } from "@/components/shell/app-shell";
import { ReminderManager } from "@/components/reminders/reminder-manager";
import { CourseProvider } from "@/components/course/course-context";
import { MissingVoiceNotice } from "@/components/speech/missing-voice-notice";
import { getDb } from "@/lib/db";
import { getSettings, todayDone } from "@/lib/services/stats";

export const dynamic = "force-dynamic";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const db = await getDb();
  const [s, lessonDone] = await Promise.all([getSettings(db), todayDone(db)]);
  return (
    <CourseProvider lang={db.lang}>
      <AppShell>
        <ReminderManager enabled={s.reminderEnabled} time={s.reminderTime} lessonDone={lessonDone} />
        {children}
        <MissingVoiceNotice />
      </AppShell>
    </CourseProvider>
  );
}

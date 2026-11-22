"use client";
import * as React from "react";
import { LANG_META, type Lang, type LangMeta } from "@/lib/content/languages";

const CourseContext = React.createContext<LangMeta>(LANG_META.fr);

/** The signed-in learner's course language, for client components (speech, accents, lang attributes). */
export function CourseProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <CourseContext.Provider value={LANG_META[lang]}>{children}</CourseContext.Provider>;
}

export function useCourse(): LangMeta {
  return React.useContext(CourseContext);
}

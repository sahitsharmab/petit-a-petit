/**
 * The languages a learner can study. Safe to import from client components.
 * Each learner's database holds exactly one course; German skill ids start with "de-".
 */
export type Lang = "fr" | "de";

export const LANGS = ["fr", "de"] as const satisfies readonly Lang[];

export interface LangMeta {
  code: Lang;
  /** English name: "French". */
  name: string;
  /** Name in the language itself. */
  native: string;
  /** BCP 47 tag for speech synthesis / recognition and lang attributes. */
  speech: string;
  /** Characters offered on the on-screen accent bar. */
  accents: string[];
  accentsLabel: string;
  writePlaceholder: string;
  replyPlaceholder: string;
  congrats: string;
  reminder: string;
  testPhrase: string;
  welcomeBack: string;
  welcome: string;
  /** Little cheers used around the UI. */
  praise: { correct: string[]; almost: string[]; incorrect: string[]; wellDone: string; veryGood: string; bravo: string };
}

export const LANG_META: Record<Lang, LangMeta> = {
  fr: {
    code: "fr", name: "French", native: "français", speech: "fr-FR",
    accents: ["é", "è", "ê", "à", "â", "ç", "ù", "û", "ô", "î", "ï", "ë", "œ"], accentsLabel: "Insert accented letter",
    writePlaceholder: "Écrivez en français…", replyPlaceholder: "Répondez en français…",
    congrats: "Félicitations !", reminder: "C'est l'heure du français !",
    testPhrase: "Bonjour ! On apprend le français ensemble ?",
    welcomeBack: "Bon retour !", welcome: "Bienvenue !",
    praise: {
      correct: ["Parfait !", "Excellent !", "C'est ça !", "Très bien !", "Bravo !"], almost: ["Presque !", "So close!"], incorrect: ["Pas tout à fait", "Not quite"],
      wellDone: "Bien joué !", veryGood: "Très bien !", bravo: "Bravo !",
    },
  },
  de: {
    code: "de", name: "German", native: "Deutsch", speech: "de-DE",
    accents: ["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"], accentsLabel: "Insert umlaut or ß",
    writePlaceholder: "Schreib auf Deutsch…", replyPlaceholder: "Antworte auf Deutsch…",
    congrats: "Glückwunsch!", reminder: "Zeit für Deutsch!",
    testPhrase: "Hallo! Lernen wir zusammen Deutsch?",
    welcomeBack: "Willkommen zurück!", welcome: "Willkommen!",
    praise: {
      correct: ["Perfekt!", "Super!", "Genau!", "Sehr gut!", "Toll!"], almost: ["Fast!", "So close!"], incorrect: ["Nicht ganz", "Not quite"],
      wellDone: "Gut gemacht!", veryGood: "Sehr gut!", bravo: "Super!",
    },
  },
};

export function isLang(v: unknown): v is Lang {
  return v === "fr" || v === "de";
}

/** The course a skill (or a "skill:"/item key's skill id) belongs to. */
export function langOfSkill(skillId: string): Lang {
  return skillId.startsWith("de-") ? "de" : "fr";
}

/** Course-specific id of a shared curriculum slot, e.g. skillIdFor("de", "w12-review") → "de-w12-review". */
export function skillIdFor(lang: Lang, id: string): string {
  return lang === "fr" ? id : `${lang}-${id}`;
}

/** The skill id without its course prefix ("de-w12-review" → "w12-review"). */
export function baseSkillId(skillId: string): string {
  return skillId.replace(/^de-/, "");
}

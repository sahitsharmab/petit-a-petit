/** English meanings shown under the verbs in lesson tables (headers like "pouvoir", infinitive columns). */
export const VERB_MEANING: Record<string, string> = {
  // French
  parler: "to speak", être: "to be", avoir: "to have", aller: "to go", faire: "to do, to make",
  pouvoir: "can, to be able to", vouloir: "to want", devoir: "must, to have to",
  savoir: "to know (a fact)", voir: "to see", dire: "to say", mettre: "to put", boire: "to drink",
  lire: "to read", écrire: "to write", prendre: "to take", finir: "to finish", attendre: "to wait (for)",
  "se lever": "to get up",
  // German
  wohnen: "to live", sein: "to be", haben: "to have", gehen: "to go (on foot)",
  können: "can, to be able to", wollen: "to want", müssen: "must, to have to", möchten: "would like",
  dürfen: "may, to be allowed to", sollen: "should, to be supposed to",
  fahren: "to go (by vehicle), to drive", schlafen: "to sleep", essen: "to eat", sprechen: "to speak",
  nehmen: "to take", lesen: "to read", sehen: "to see", trinken: "to drink", schreiben: "to write",
  finden: "to find", helfen: "to help",
  aufstehen: "to get up", einkaufen: "to go shopping", anrufen: "to call (phone)", fernsehen: "to watch TV",
  anfangen: "to begin",
};

export const meaningOf = (word: string): string | undefined => VERB_MEANING[word.trim()];

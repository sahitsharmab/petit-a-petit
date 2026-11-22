import { describe, expect, it } from "vitest";
import { conjugate, englishClause, joinWithElision } from "@/lib/french/conjugate";
import { evaluateAnswer } from "@/lib/french/evaluate";
import { expandPattern, looseAnswer, normalizeAnswer, stripAccents, tokenize } from "@/lib/french/normalize";

describe("conjugation engine", () => {
  it.each([
    ["parler", "nous", "nous parlons"], ["parler", "tu", "tu parles"], ["parler", "ils", "ils parlent"],
    ["manger", "nous", "nous mangeons"], ["commencer", "nous", "nous commençons"], ["acheter", "je", "j'achète"],
    ["préférer", "elle", "elle préfère"], ["appeler", "ils", "ils appellent"], ["finir", "nous", "nous finissons"],
    ["attendre", "il", "il attend"], ["être", "vous", "vous êtes"], ["avoir", "je", "j'ai"], ["aller", "ils", "ils vont"],
    ["faire", "vous", "vous faites"], ["se lever", "je", "je me lève"], ["s'habiller", "nous", "nous nous habillons"],
    ["habiter", "je", "j'habite"], ["boire", "nous", "nous buvons"],
  ])("present: %s / %s → %s", (verb, subj, expected) => {
    expect(conjugate(verb, "present", subj as never).full).toBe(expected);
  });

  it("accepts alternative spellings", () => {
    expect(conjugate("payer", "present", "je").fulls).toEqual(["je paie", "je paye"]);
    expect(conjugate("connaître", "present", "il").fulls).toContain("il connait");
  });

  it("passé composé chooses the auxiliary and agrees with être", () => {
    expect(conjugate("manger", "passe_compose", "nous").full).toBe("nous avons mangé");
    expect(conjugate("aller", "passe_compose", "elle").full).toBe("elle est allée");
    expect(conjugate("partir", "passe_compose", "ils").full).toBe("ils sont partis");
    expect(conjugate("se lever", "passe_compose", "elles").full).toBe("elles se sont levées");
    expect(conjugate("aller", "passe_compose", "je").fulls).toEqual(["je suis allé", "je suis allée"]);
    expect(conjugate("faire", "passe_compose", "je").full).toBe("j'ai fait");
  });

  it("negation wraps the conjugated verb with elision", () => {
    expect(conjugate("aimer", "present", "je", { negative: true }).full).toBe("je n'aime pas");
    expect(conjugate("s'habiller", "present", "je", { negative: true }).full).toBe("je ne m'habille pas");
    expect(conjugate("aller", "passe_compose", "il", { negative: true }).full).toBe("il n'est pas allé");
    expect(conjugate("travailler", "futur_proche", "nous", { negative: true }).full).toBe("nous n'allons pas travailler");
  });

  it("futur proche keeps reflexive pronoun with the infinitive", () => {
    expect(conjugate("se coucher", "futur_proche", "tu").full).toBe("tu vas te coucher");
    expect(conjugate("s'habiller", "futur_proche", "je").full).toBe("je vais m'habiller");
  });

  it("renders English clauses", () => {
    expect(englishClause("parler", "present", "nous")).toBe("we speak");
    expect(englishClause("parler", "present", "il", { negative: true })).toBe("he doesn't speak");
    expect(englishClause("être", "present", "je")).toBe("I am");
    expect(englishClause("aller", "passe_compose", "elle")).toBe("she went");
    expect(englishClause("manger", "futur_proche", "ils")).toBe("they are going to eat");
  });

  it("joins with elision", () => {
    expect(joinWithElision(["je", "ne", "aime", "pas"])).toBe("je n'aime pas");
    expect(joinWithElision(["le", "hibou"])).toBe("le hibou"); // aspirated h
  });
});

describe("normalization (Unicode & accents)", () => {
  it("normalizes NFC/NFD, curly apostrophes, spacing and punctuation", () => {
    const nfd = "été"; // "été" decomposed
    expect(normalizeAnswer(nfd)).toBe("été");
    expect(normalizeAnswer("  J’aime   le café ! ")).toBe("j'aime le café");
    expect(normalizeAnswer("Parles - tu français ?")).toBe("parles-tu français");
    expect(normalizeAnswer("j' aime")).toBe("j'aime");
    expect(normalizeAnswer("« Bonjour » !")).toBe("bonjour");
  });
  it("strips accents and ligatures", () => {
    expect(stripAccents("élève cœur ça")).toBe("eleve coeur ca");
    expect(looseAnswer("Où êtes-vous ?")).toBe("ou etes-vous");
  });
  it("tokenizes elisions and inversion hyphens", () => {
    expect(tokenize("J'aime le café.")).toEqual(["j'", "aime", "le", "café"]);
    expect(tokenize("Parle-t-il anglais ?")).toEqual(["parle", "-t-il", "anglais"]);
  });
  it("expands answer patterns", () => {
    expect(expandPattern("Il fait (très) beau")).toEqual(["Il fait très beau", "Il fait beau"]);
    expect(expandPattern("[Je m'appelle|Mon nom est] Sam")).toEqual(["Je m'appelle Sam", "Mon nom est Sam"]);
  });
});

describe("answer evaluation", () => {
  it("accepts exact answers regardless of case and punctuation", () => {
    expect(evaluateAnswer({ answer: "nous parlons francais", accepted: ["Nous parlons français."] }).verdict).toBe("almost");
    expect(evaluateAnswer({ answer: "NOUS PARLONS FRANÇAIS", accepted: ["Nous parlons français."] }).verdict).toBe("correct");
  });
  it("accepts any listed alternative (word order, on/nous, question forms)", () => {
    const accepted = ["Est-ce que vous parlez anglais ?", "Vous parlez anglais ?", "Parlez-vous anglais ?"];
    for (const a of ["parlez-vous anglais", "Vous parlez anglais?", "est-ce que vous parlez anglais"]) {
      expect(evaluateAnswer({ answer: a, accepted }).verdict).toBe("correct");
    }
  });
  it("flags accent-only mistakes as 'almost'", () => {
    const r = evaluateAnswer({ answer: "il a mange", accepted: ["il a mangé"] });
    expect(r.verdict).toBe("almost");
    expect(r.mistakeTag).toBe("accents");
  });
  it("flags missing elision as 'almost'", () => {
    const r = evaluateAnswer({ answer: "je aime le café", accepted: ["j'aime le café"] });
    expect(r.verdict).toBe("almost");
    expect(r.mistakeTag).toBe("elision");
  });
  it("does not accept understandable but incorrect French", () => {
    expect(evaluateAnswer({ answer: "nous parle français", accepted: ["nous parlons français"] }).verdict).toBe("incorrect");
    expect(evaluateAnswer({ answer: "je suis mangé", accepted: ["j'ai mangé"] }).verdict).toBe("incorrect");
  });
  it("uses confusables for targeted explanations, even if accents would match", () => {
    const r = evaluateAnswer({
      answer: "parles", accepted: ["parlons"],
      confusables: [{ text: "parles", tag: "wrong-person", explanation: "« parles » is the tu form." }],
    });
    expect(r.verdict).toBe("incorrect");
    expect(r.mistakeTag).toBe("wrong-person");
    expect(r.note).toContain("tu form");
  });
  it("detects missing negation and returns a word diff", () => {
    const r = evaluateAnswer({ answer: "je parle français", accepted: ["je ne parle pas français"] });
    expect(r.mistakeTag).toBe("negation");
    expect(r.expectedMarks?.filter((m) => !m.ok).map((m) => m.token)).toEqual(["ne", "pas"]);
  });
  it("treats blank answers as incorrect", () => {
    expect(evaluateAnswer({ answer: "   ", accepted: ["oui"] }).verdict).toBe("incorrect");
  });
});

import type { SkillDef, WeekDef } from "./types";
import type { Lang } from "./languages";
import { DE_SKILLS, DE_WEEKS } from "./de/curriculum";
import { withMaterial } from "./fr-material";

export const WEEKS: WeekDef[] = [
  { number: 1, title: "First sentences", focus: "Subject pronouns, regular -ER verbs, basic sentences", cefr: "A1", description: "Who does what: je, tu, il, elle… and the most common verb pattern in French." },
  { number: 2, title: "The essential four", focus: "Être, avoir, aller, faire, everyday expressions", cefr: "A1", description: "The four verbs that hold French together, and the idioms built on them." },
  { number: 3, title: "Nouns & description", focus: "Articles, gender, plurals, adjective agreement", cefr: "A1", description: "Le or la? Un or une? Making words agree." },
  { number: 4, title: "Asking & saying no", focus: "Negation, questions, common prepositions", cefr: "A1", description: "Ne… pas, three ways to ask a question, and à / de / en / chez." },
  { number: 5, title: "Irregular verbs", focus: "Irregular present-tense verbs", cefr: "A1", description: "Pouvoir, vouloir, devoir, prendre, venir and friends — plus -IR and -RE verbs." },
  { number: 6, title: "Daily routines", focus: "Reflexive verbs, daily routines", cefr: "A1", description: "Je me lève, je me douche… and telling the time." },
  { number: 7, title: "Making plans", focus: "Futur proche, talking about plans", cefr: "A2", description: "Je vais + infinitive: the easiest future in French." },
  { number: 8, title: "Telling the past I", focus: "Passé composé with avoir", cefr: "A2", description: "J'ai mangé, j'ai fait, j'ai pris — talking about what happened." },
  { number: 9, title: "Telling the past II", focus: "Passé composé with être, time expressions", cefr: "A2", description: "Je suis allé(e), hier, il y a, depuis." },
  { number: 10, title: "Fluent combinations", focus: "Pronouns, practical sentence combinations", cefr: "A2", description: "Le / la / lui / y / en and connecting ideas with parce que, quand, mais." },
  { number: 11, title: "Real situations", focus: "Listening and situational conversation", cefr: "A2", description: "Train your ear and handle cafés, appointments and landlords." },
  { number: 12, title: "Course review", focus: "Comprehensive review and a mixed grammar and vocabulary check", cefr: "A2", description: "Consolidate everything and see which topics need another pass." },
];

/** French topics get their extra examples and tables from fr-material.ts. */
const S = (s: SkillDef): SkillDef => ({ ...s, explanation: withMaterial(s.id, s.explanation) });

export const SKILLS: SkillDef[] = [
  // ───────────────────────────── Week 1 ─────────────────────────────
  S({
    id: "w1-pronouns", week: 1, order: 1, title: "Subject pronouns", short: "Pronouns", cefr: "A1", category: "grammar",
    summary: "je, tu, il, elle, on, nous, vous, ils, elles — and when to use tu or vous.",
    objectives: ["Identify the right subject pronoun for a person or group", "Choose between tu and vous appropriately"],
    explanation: [
      {
        heading: "Who is doing the action?",
        body: "Every French verb needs a subject. When you don't name the person, you use a subject pronoun.",
        table: { headers: ["French", "English", "Notes"], rows: [["je (j')", "I", "becomes j' before a vowel: j'aime"], ["tu", "you", "one person you know well"], ["il / elle", "he / she (it)", "also for masculine / feminine things"], ["on", "we / one / people", "very common in speech for 'we'"], ["nous", "we", "more formal or written"], ["vous", "you", "polite singular, or any plural 'you'"], ["ils / elles", "they", "elles only if the whole group is feminine"]] },
      },
      {
        heading: "Tu or vous?",
        body: "Use tu with friends, family, children and people who invite you to. Use vous with strangers, landlords, shop staff, recruiters, doctors — and with any group of people.",
        examples: [{ fr: "Tu es prêt ?", en: "Are you ready? (to a friend)" }, { fr: "Vous êtes Madame Martin ?", en: "Are you Mrs Martin? (polite)" }],
      },
    ],
    tip: "A group of nine women and one man is « ils ». Elles is only for all-feminine groups.",
    practice: { types: ["multiple_choice", "fill_blank", "translation", "listening"] },
  }),
  S({
    id: "w1-er-present", week: 1, order: 2, title: "Regular -ER verbs (present)", short: "-ER verbs", cefr: "A1", category: "grammar",
    summary: "Parler, travailler, habiter: drop -er, add the ending.",
    objectives: ["Conjugate regular -ER verbs in the present", "Recognise that je/tu/il/ils forms sound the same"],
    explanation: [
      {
        heading: "One pattern for 90% of verbs",
        body: "Take the infinitive, remove -er to get the stem (parl-), then add the ending for the subject.",
        table: { headers: ["Subject", "Ending", "parler"], rows: [["je", "-e", "je parle"], ["tu", "-es", "tu parles"], ["il / elle / on", "-e", "il parle"], ["nous", "-ons", "nous parlons"], ["vous", "-ez", "vous parlez"], ["ils / elles", "-ent", "ils parlent"]] },
      },
      {
        heading: "Silent endings",
        body: "-e, -es and -ent are all silent: parle, parles and parlent sound identical. Only -ons and -ez are pronounced. That's why you must write the right ending even when you can't hear it.",
        examples: [{ fr: "J'habite à Lyon.", en: "I live in Lyon." }, { fr: "Nous travaillons ensemble.", en: "We work together." }],
      },
      {
        heading: "Small spelling adjustments",
        body: "Manger → nous mangeons (keep the soft g). Commencer → nous commençons. Acheter → j'achète. Préférer → je préfère. Appeler → j'appelle.",
      },
    ],
    tip: "Nous ends in -ons almost everywhere in French. Vous ends in -ez — except vous êtes, vous faites, vous dites.",
    practice: { conj: { verbs: ["parler", "travailler", "habiter", "aimer", "regarder", "écouter", "chercher", "étudier", "manger", "cuisiner", "jouer"], tense: "present" }, types: ["multiple_choice", "conjugation", "fill_blank", "translation", "listening"] },
  }),
  S({
    id: "w1-basic-sentences", week: 1, order: 3, title: "Building basic sentences", short: "Basic sentences", cefr: "A1", category: "grammar",
    summary: "Subject + verb + complement, greetings and introductions.",
    objectives: ["Build subject–verb–object sentences", "Greet people and introduce yourself"],
    explanation: [
      {
        heading: "The word order you already know",
        body: "Like English, basic French sentences follow Subject + Verb + Complement.",
        examples: [{ fr: "Je parle anglais.", en: "I speak English." }, { fr: "Marie travaille à Paris.", en: "Marie works in Paris." }],
      },
      {
        heading: "Introducing yourself",
        body: "Je m'appelle… (my name is), J'habite à… (I live in), Je suis anglais / anglaise (I'm English), Je travaille comme… (I work as).",
        examples: [{ fr: "Bonjour, je m'appelle Sam. J'habite à Lyon.", en: "Hello, my name is Sam. I live in Lyon." }],
      },
      {
        heading: "Greetings",
        body: "Bonjour (hello, daytime) · Bonsoir (good evening) · Salut (hi, informal) · Merci · S'il vous plaît / s'il te plaît · Au revoir · Bonne journée.",
      },
    ],
    practice: { types: ["sentence_builder", "multiple_choice", "translation", "listening", "dialogue"] },
  }),
  // ───────────────────────────── Week 2 ─────────────────────────────
  S({
    id: "w2-etre", week: 2, order: 1, title: "Être (to be)", short: "Être", cefr: "A1", category: "grammar",
    summary: "Je suis, tu es, il est… identity, nationality, descriptions, location.",
    objectives: ["Conjugate être in the present", "Describe yourself and others with être"],
    explanation: [
      { heading: "Conjugation", body: "Être is completely irregular — learn it as a song.", table: { headers: ["Subject", "être"], rows: [["je", "suis"], ["tu", "es"], ["il / elle / on", "est"], ["nous", "sommes"], ["vous", "êtes"], ["ils / elles", "sont"]] } },
      { heading: "Uses", body: "Nationality and profession take no article: Je suis anglais. Elle est infirmière. Descriptions: Il est fatigué. Location: Nous sommes à la maison.", examples: [{ fr: "Je suis à Paris.", en: "I'm in Paris." }, { fr: "Vous êtes très gentil.", en: "You are very kind." }] },
    ],
    tip: "Say « je suis professeur », not « je suis un professeur » — no article for jobs after être.",
    practice: { conj: { verbs: ["être"], tense: "present" }, types: ["multiple_choice", "conjugation", "fill_blank", "translation", "listening"] },
  }),
  S({
    id: "w2-avoir", week: 2, order: 2, title: "Avoir (to have)", short: "Avoir", cefr: "A1", category: "grammar",
    summary: "J'ai, tu as, il a… possession, age and il y a.",
    objectives: ["Conjugate avoir in the present", "Give your age and use il y a"],
    explanation: [
      { heading: "Conjugation", body: "Note the elision j'ai, and the liaison in nous_avons, vous_avez, ils_ont (the s sounds like z).", table: { headers: ["Subject", "avoir"], rows: [["je", "ai (j'ai)"], ["tu", "as"], ["il / elle / on", "a"], ["nous", "avons"], ["vous", "avez"], ["ils / elles", "ont"]] } },
      { heading: "Age uses avoir", body: "In French you HAVE years: J'ai trente ans (I'm 30). Never « je suis trente ».", examples: [{ fr: "J'ai un rendez-vous.", en: "I have an appointment." }, { fr: "Il y a un café ici.", en: "There is a café here." }] },
    ],
    tip: "Ils sont (they are) vs ils ont (they have): sont has an s-sound, ont has a z-sound liaison: « ils‿ont ».",
    practice: { conj: { verbs: ["avoir"], tense: "present" }, types: ["multiple_choice", "conjugation", "fill_blank", "translation", "listening"] },
  }),
  S({
    id: "w2-aller-faire", week: 2, order: 3, title: "Aller & faire", short: "Aller & faire", cefr: "A1", category: "grammar",
    summary: "Je vais, je fais — going places and doing things.",
    objectives: ["Conjugate aller and faire", "Use aller à + place and faire + activity"],
    explanation: [
      { heading: "Aller (to go)", body: "Je vais, tu vas, il va, nous allons, vous allez, ils vont. With places: aller à + city, au (à + le), à la, aux.", examples: [{ fr: "Je vais au travail.", en: "I'm going to work." }, { fr: "Nous allons à la gare.", en: "We are going to the station." }] },
      { heading: "Faire (to do / make)", body: "Je fais, tu fais, il fait, nous faisons, vous faites, ils font. Used for activities and weather.", examples: [{ fr: "Je fais les courses.", en: "I do the shopping." }, { fr: "Il fait beau.", en: "The weather is nice." }] },
    ],
    tip: "Vous faites — not « vous faisez ». Ils font — not « ils faisent ».",
    practice: { conj: { verbs: ["aller", "faire"], tense: "present" }, types: ["multiple_choice", "conjugation", "fill_blank", "translation", "listening"] },
  }),
  S({
    id: "w2-expressions", week: 2, order: 4, title: "Everyday expressions", short: "Expressions", cefr: "A1", category: "vocabulary",
    summary: "Avoir faim, il fait froid, ça va, j'ai besoin de…",
    objectives: ["Use common avoir / faire / être expressions", "Respond to everyday small talk"],
    explanation: [
      { heading: "Avoir expressions", body: "French uses avoir where English uses 'be': avoir faim (be hungry), avoir soif (thirsty), avoir froid / chaud (cold / hot), avoir peur (scared), avoir raison (right), avoir besoin de (need)." },
      { heading: "Weather with faire", body: "Il fait beau / chaud / froid / mauvais. But: il pleut (it's raining), il neige (it's snowing)." },
      { heading: "Small talk", body: "Ça va ? — Ça va bien, merci. Et toi ? / Et vous ? · Pas mal. · Comme ci, comme ça. · De rien. · Pas de problème.", examples: [{ fr: "J'ai besoin d'un café.", en: "I need a coffee." }] },
    ],
    practice: { types: ["multiple_choice", "fill_blank", "translation", "sentence_builder", "listening", "dialogue"] },
  }),
  // ───────────────────────────── Week 3 ─────────────────────────────
  S({
    id: "w3-articles", week: 3, order: 1, title: "Articles & gender", short: "Articles", cefr: "A1", category: "grammar",
    summary: "le / la / l' / les, un / une / des — every noun has a gender.",
    objectives: ["Choose definite and indefinite articles", "Learn nouns together with their gender"],
    explanation: [
      { heading: "Every noun is masculine or feminine", body: "Learn each noun with its article: le pain, la baguette. There are tendencies (-tion, -té, -ette are usually feminine; -ment, -age usually masculine) but always check." },
      { heading: "The articles", body: "", table: { headers: ["", "masculine", "feminine", "plural"], rows: [["the", "le (l')", "la (l')", "les"], ["a / some", "un", "une", "des"]] }, examples: [{ fr: "le café, la gare, l'appartement, les clés", en: "the coffee, the station, the apartment, the keys" }] },
      { heading: "Contractions with à and de", body: "à + le = au, à + les = aux; de + le = du, de + les = des. À la and de la don't change.", examples: [{ fr: "Je vais au marché.", en: "I'm going to the market." }, { fr: "Je parle du film.", en: "I'm talking about the film." }] },
    ],
    tip: "l' is used for both genders before a vowel: l'appartement (m), l'école (f).",
    practice: { types: ["multiple_choice", "fill_blank", "translation", "sentence_builder", "listening"] },
  }),
  S({
    id: "w3-plurals", week: 3, order: 2, title: "Plurals", short: "Plurals", cefr: "A1", category: "grammar",
    summary: "Add -s (usually silent): les livres, des amis — with a few special endings.",
    objectives: ["Form regular and common irregular plurals", "Make articles and verbs plural together"],
    explanation: [
      { heading: "Regular plural: add -s", body: "un livre → des livres. The -s is silent, so the article (le → les, un → des) tells you it's plural." },
      { heading: "Special endings", body: "-eau → -eaux (un gâteau, des gâteaux) · -al → -aux (un journal, des journaux) · -s, -x, -z don't change (un prix, des prix).", examples: [{ fr: "Les enfants jouent.", en: "The children are playing." }] },
    ],
    practice: { transform: undefined, types: ["multiple_choice", "transformation", "fill_blank", "translation"] },
  }),
  S({
    id: "w3-adjectives", week: 3, order: 3, title: "Adjective agreement", short: "Adjectives", cefr: "A1", category: "grammar",
    summary: "Adjectives agree in gender and number, and most go after the noun.",
    objectives: ["Make adjectives agree with nouns", "Place adjectives before or after the noun"],
    explanation: [
      { heading: "Agreement", body: "Add -e for feminine, -s for plural, -es for feminine plural: petit, petite, petits, petites. If it already ends in -e, no change for feminine: rouge.", table: { headers: ["", "sing.", "plural"], rows: [["masc.", "grand", "grands"], ["fem.", "grande", "grandes"]] } },
      { heading: "Common irregular feminines", body: "beau → belle, nouveau → nouvelle, vieux → vieille, bon → bonne, gentil → gentille, heureux → heureuse, cher → chère, blanc → blanche." },
      { heading: "Position", body: "Most adjectives follow the noun: une voiture rouge. Short common ones (BAGS: Beauty, Age, Goodness, Size) come before: un grand appartement, une petite cuisine, un bon restaurant.", examples: [{ fr: "un appartement lumineux", en: "a bright apartment" }, { fr: "une belle journée", en: "a beautiful day" }] },
    ],
    practice: { types: ["multiple_choice", "fill_blank", "sentence_builder", "translation"] },
  }),
  // ───────────────────────────── Week 4 ─────────────────────────────
  S({
    id: "w4-negation", week: 4, order: 1, title: "Negation: ne … pas", short: "Negation", cefr: "A1", category: "grammar",
    summary: "Wrap the verb: je ne parle pas. Plus pas de, ne… jamais, ne… plus.",
    objectives: ["Negate present-tense sentences", "Use pas de after negative verbs of quantity"],
    explanation: [
      { heading: "Two parts around the verb", body: "ne goes before the verb, pas right after it. ne becomes n' before a vowel.", examples: [{ fr: "Je ne travaille pas le lundi.", en: "I don't work on Mondays." }, { fr: "Il n'habite pas ici.", en: "He doesn't live here." }] },
      { heading: "un / une / des → de after a negative", body: "J'ai une voiture → Je n'ai pas de voiture. Il y a du pain → Il n'y a pas de pain. (But le/la/les stay: je n'aime pas le café.)" },
      { heading: "Other negatives", body: "ne … jamais (never), ne … plus (no longer / no more), ne … rien (nothing). In casual speech the ne is often dropped (« je sais pas ») — but write it." },
    ],
    practice: { conj: { verbs: ["parler", "travailler", "habiter", "aimer", "manger", "regarder", "être", "avoir", "aller", "faire"], tense: "present", negative: true }, transform: "negation", types: ["multiple_choice", "transformation", "fill_blank", "translation", "sentence_builder"] },
  }),
  S({
    id: "w4-questions", week: 4, order: 2, title: "Asking questions", short: "Questions", cefr: "A1", category: "grammar",
    summary: "Intonation, est-ce que, inversion — and question words.",
    objectives: ["Ask yes/no questions three ways", "Use où, quand, comment, combien, pourquoi, qu'est-ce que"],
    explanation: [
      { heading: "Three ways to ask", body: "1) Rising intonation: Tu parles français ? 2) Est-ce que: Est-ce que tu parles français ? 3) Inversion (formal): Parles-tu français ? All three are correct.", examples: [{ fr: "Est-ce qu'il travaille ici ?", en: "Does he work here?" }] },
      { heading: "Question words", body: "où (where) · quand (when) · comment (how) · combien (how much/many) · pourquoi (why) · qui (who) · qu'est-ce que (what) · quel / quelle (which / what).", examples: [{ fr: "Où est la gare ?", en: "Where is the station?" }, { fr: "Qu'est-ce que vous faites ?", en: "What do you do?" }, { fr: "Combien ça coûte ?", en: "How much does it cost?" }] },
      { heading: "Inversion detail", body: "If the verb ends in a vowel before il/elle/on, add -t-: Parle-t-il anglais ? A-t-elle un rendez-vous ?" },
    ],
    practice: { conj: { verbs: ["parler", "travailler", "habiter", "aimer", "être", "avoir", "aller"], tense: "present" }, transform: "question", types: ["multiple_choice", "transformation", "fill_blank", "translation", "sentence_builder"] },
  }),
  S({
    id: "w4-prepositions", week: 4, order: 3, title: "Common prepositions", short: "Prepositions", cefr: "A1", category: "grammar",
    summary: "à, de, en, au, chez, dans, sur, avec, pour.",
    objectives: ["Use à / en / au with cities and countries", "Use chez, dans, sur, avec"],
    explanation: [
      { heading: "Cities and countries", body: "à + city (à Paris) · en + feminine country (en France, en Espagne) · au + masculine country (au Canada, au Japon) · aux + plural (aux États-Unis).", examples: [{ fr: "J'habite en France, à Lyon.", en: "I live in France, in Lyon." }] },
      { heading: "Everyday prepositions", body: "chez (at someone's place): chez moi, chez le médecin · dans (in, inside) · sur (on) · sous (under) · avec (with) · pour (for) · à côté de (next to) · en face de (opposite).", examples: [{ fr: "Je suis chez le dentiste.", en: "I'm at the dentist's." }, { fr: "Les clés sont sur la table.", en: "The keys are on the table." }] },
      { heading: "Transport", body: "en bus, en train, en voiture, en métro — but à pied (on foot) and à vélo." },
    ],
    practice: { types: ["multiple_choice", "fill_blank", "translation", "sentence_builder", "listening"] },
  }),
  // ───────────────────────────── Week 5 ─────────────────────────────
  S({
    id: "w5-modals", week: 5, order: 1, title: "Pouvoir, vouloir, devoir", short: "Modal verbs", cefr: "A1", category: "grammar",
    summary: "Can, want, must — followed by an infinitive.",
    objectives: ["Conjugate pouvoir, vouloir, devoir", "Use modal + infinitive, and polite je voudrais"],
    explanation: [
      { heading: "Conjugations", body: "They share a pattern: a change in the nous/vous stem.", table: { headers: ["", "pouvoir", "vouloir", "devoir"], rows: [["je", "peux", "veux", "dois"], ["tu", "peux", "veux", "dois"], ["il/elle/on", "peut", "veut", "doit"], ["nous", "pouvons", "voulons", "devons"], ["vous", "pouvez", "voulez", "devez"], ["ils/elles", "peuvent", "veulent", "doivent"]] } },
      { heading: "What they mean", body: "Pouvoir = can, to be able to. It's also how you ask for permission or a favour. Vouloir = to want. Devoir = must, to have to.", examples: [
        { fr: "Je peux venir demain.", en: "I can come tomorrow." },
        { fr: "Tu peux m'aider ?", en: "Can you help me?" },
        { fr: "Il veut un café.", en: "He wants a coffee." },
        { fr: "Nous devons travailler.", en: "We have to work." },
      ] },
      { heading: "+ infinitive", body: "After pouvoir, vouloir or devoir, the next verb doesn't change: it stays in the infinitive (the dictionary form ending in -er, -ir or -re). Only the modal is conjugated. Tu peux venir, never « tu peux viens ».", examples: [
        { fr: "Tu peux venir ?", en: "Can you come?" },
        { fr: "Je dois partir.", en: "I have to leave." },
        { fr: "Nous voulons visiter Paris.", en: "We want to visit Paris." },
        { fr: "Est-ce que je peux payer par carte ?", en: "Can I pay by card?" },
      ] },
      { heading: "Saying no and asking", body: "Ne … pas goes around the modal, not the infinitive. To ask, raise your voice at the end, start with est-ce que, or (formal) swap the verb and pronoun: Pouvez-vous… ?", examples: [
        { fr: "Je ne peux pas venir.", en: "I can't come." },
        { fr: "Tu ne dois pas fumer ici.", en: "You mustn't smoke here." },
        { fr: "Est-ce que tu veux sortir ?", en: "Do you want to go out?" },
        { fr: "Pouvez-vous répéter, s'il vous plaît ?", en: "Can you repeat, please?" },
      ] },
      { heading: "Politeness", body: "Je voudrais (I would like) is softer than je veux. Use it in shops and cafés. Vouloir can also take a noun, like want in English.", examples: [
        { fr: "Je voudrais un café, s'il vous plaît.", en: "I'd like a coffee, please." },
        { fr: "Je voudrais réserver une table.", en: "I'd like to book a table." },
      ] },
    ],
    practice: { conj: { verbs: ["pouvoir", "vouloir", "devoir"], tense: "present" }, types: ["multiple_choice", "conjugation", "fill_blank", "translation", "listening"] },
  }),
  S({
    id: "w5-irregular", week: 5, order: 2, title: "Common irregular verbs", short: "Irregulars", cefr: "A1", category: "grammar",
    summary: "Prendre, venir, savoir, voir, dire, mettre, partir, sortir, boire, lire, écrire.",
    objectives: ["Conjugate high-frequency irregular verbs", "Notice families: prendre / apprendre / comprendre"],
    explanation: [
      { heading: "Learn them in families", body: "prendre → apprendre, comprendre (je prends, nous prenons, ils prennent). venir → revenir, devenir (je viens, nous venons, ils viennent). partir / sortir / dormir: drop the last consonant in the singular (je pars, je sors, je dors)." },
      { heading: "The others", body: "", table: { headers: ["", "je", "tu", "il / elle", "nous", "vous", "ils / elles"], rows: [["savoir", "sais", "sais", "sait", "savons", "savez", "savent"], ["voir", "vois", "vois", "voit", "voyons", "voyez", "voient"], ["dire", "dis", "dis", "dit", "disons", "dites", "disent"], ["mettre", "mets", "mets", "met", "mettons", "mettez", "mettent"], ["boire", "bois", "bois", "boit", "buvons", "buvez", "boivent"], ["lire", "lis", "lis", "lit", "lisons", "lisez", "lisent"], ["écrire", "écris", "écris", "écrit", "écrivons", "écrivez", "écrivent"]] }, examples: [{ fr: "Je prends le métro.", en: "I take the metro." }, { fr: "Vous dites ?", en: "Sorry, what did you say?" }] },
    ],
    tip: "Savoir = know a fact / how to. Connaître = know a person or place.",
    practice: { conj: { verbs: ["prendre", "venir", "comprendre", "savoir", "voir", "dire", "mettre", "partir", "sortir", "boire", "lire", "écrire", "dormir"], tense: "present" }, types: ["multiple_choice", "conjugation", "fill_blank", "translation", "listening"] },
  }),
  S({
    id: "w5-ir-re", week: 5, order: 3, title: "Regular -IR and -RE verbs", short: "-IR / -RE verbs", cefr: "A1", category: "grammar",
    summary: "Finir (je finis, nous finissons) and attendre (j'attends, il attend).",
    objectives: ["Conjugate regular -IR verbs like finir", "Conjugate regular -RE verbs like attendre"],
    explanation: [
      { heading: "-IR like finir", body: "", table: { headers: ["", "finir"], rows: [["je / tu", "finis"], ["il / elle", "finit"], ["nous", "finissons"], ["vous", "finissez"], ["ils / elles", "finissent"]] } },
      { heading: "-RE like attendre", body: "Drop -re; the il form has no ending.", table: { headers: ["", "attendre"], rows: [["je / tu", "attends"], ["il / elle", "attend"], ["nous", "attendons"], ["vous", "attendez"], ["ils / elles", "attendent"]] }, examples: [{ fr: "J'attends le bus.", en: "I'm waiting for the bus." }] },
    ],
    tip: "Attendre already contains 'for': j'attends le bus (not « pour le bus »).",
    practice: { conj: { verbs: ["finir", "choisir", "réussir", "attendre", "vendre", "répondre", "entendre", "perdre"], tense: "present" }, types: ["multiple_choice", "conjugation", "fill_blank", "translation"] },
  }),
  // ───────────────────────────── Week 6 ─────────────────────────────
  S({
    id: "w6-reflexive", week: 6, order: 1, title: "Reflexive verbs", short: "Reflexives", cefr: "A1", category: "grammar",
    summary: "Je me lève, tu te douches, nous nous habillons.",
    objectives: ["Conjugate reflexive verbs in the present", "Place the reflexive pronoun correctly in negatives"],
    explanation: [
      { heading: "The extra pronoun", body: "Reflexive verbs carry a pronoun that matches the subject.", table: { headers: ["Subject", "pronoun", "se lever"], rows: [["je", "me (m')", "je me lève"], ["tu", "te (t')", "tu te lèves"], ["il / elle / on", "se (s')", "il se lève"], ["nous", "nous", "nous nous levons"], ["vous", "vous", "vous vous levez"], ["ils / elles", "se (s')", "ils se lèvent"]] } },
      { heading: "Negative", body: "ne goes before the pronoun: Je ne me lève pas tôt. Elle ne s'habille pas.", examples: [{ fr: "Je m'appelle Sam.", en: "My name is Sam (lit. I call myself Sam)." }] },
    ],
    practice: { conj: { verbs: ["se lever", "se réveiller", "se coucher", "se laver", "s'habiller", "se doucher", "se promener", "se dépêcher", "se reposer", "s'amuser"], tense: "present" }, types: ["multiple_choice", "conjugation", "fill_blank", "translation", "sentence_builder", "listening"] },
  }),
  S({
    id: "w6-routine", week: 6, order: 2, title: "Daily routine & time", short: "Routine & time", cefr: "A1", category: "vocabulary",
    summary: "Quelle heure est-il ? Il est sept heures et demie.",
    objectives: ["Tell the time", "Describe your daily routine in sequence"],
    explanation: [
      { heading: "Telling the time", body: "Il est huit heures (8:00) · huit heures et quart (8:15) · huit heures et demie (8:30) · neuf heures moins le quart (8:45) · midi / minuit. Official times use 24h: quinze heures (3 pm)." },
      { heading: "Sequencing", body: "d'abord (first) · ensuite / puis (then) · après (after) · enfin (finally) · le matin / l'après-midi / le soir.", examples: [{ fr: "D'abord je me lève, ensuite je prends un café.", en: "First I get up, then I have a coffee." }] },
    ],
    practice: { types: ["multiple_choice", "fill_blank", "sentence_builder", "translation", "listening"] },
  }),
  // ───────────────────────────── Week 7 ─────────────────────────────
  S({
    id: "w7-futur-proche", week: 7, order: 1, title: "Futur proche", short: "Futur proche", cefr: "A2", category: "grammar",
    summary: "aller + infinitive: je vais travailler.",
    objectives: ["Form the futur proche", "Negate it and use it with reflexive verbs"],
    explanation: [
      { heading: "Formula", body: "Conjugated aller + infinitive. Only aller changes.", examples: [{ fr: "Je vais appeler le propriétaire.", en: "I'm going to call the landlord." }, { fr: "Nous allons déménager.", en: "We are going to move." }] },
      { heading: "Negative and reflexive", body: "Negation wraps aller: Je ne vais pas travailler demain. Reflexive pronouns go before the infinitive: Je vais me coucher." },
    ],
    practice: { conj: { verbs: ["parler", "travailler", "manger", "visiter", "appeler", "acheter", "faire", "prendre", "partir", "se coucher", "réserver", "déménager"], tense: "futur_proche" }, transform: "futur_proche", types: ["multiple_choice", "conjugation", "transformation", "fill_blank", "translation", "listening"] },
  }),
  S({
    id: "w7-plans", week: 7, order: 2, title: "Talking about plans", short: "Plans", cefr: "A2", category: "vocabulary",
    summary: "demain, ce week-end, la semaine prochaine, j'ai envie de…",
    objectives: ["Use future time expressions", "Make, accept and decline invitations"],
    explanation: [
      { heading: "Future time words", body: "demain (tomorrow) · ce soir (tonight) · ce week-end · la semaine prochaine · le mois prochain · dans deux jours (in two days)." },
      { heading: "Invitations", body: "Tu veux… ? / Ça te dit de… ? (Do you fancy…?) · Avec plaisir ! · Désolé(e), je ne peux pas. · On se retrouve où ? (Where shall we meet?)", examples: [{ fr: "Ça te dit d'aller au cinéma samedi ?", en: "Do you fancy going to the cinema on Saturday?" }] },
    ],
    practice: { types: ["multiple_choice", "fill_blank", "sentence_builder", "translation", "dialogue"] },
  }),
  // ───────────────────────────── Week 8 ─────────────────────────────
  S({
    id: "w8-pc-avoir", week: 8, order: 1, title: "Passé composé with avoir", short: "PC (avoir)", cefr: "A2", category: "grammar",
    summary: "avoir + past participle: j'ai parlé, tu as fini, il a attendu.",
    objectives: ["Form the passé composé with avoir", "Form regular past participles"],
    explanation: [
      { heading: "Formula", body: "Present of avoir + past participle. -er → -é (parlé), -ir → -i (fini), -re → -u (attendu).", examples: [{ fr: "J'ai mangé une crêpe.", en: "I ate a crêpe." }, { fr: "Nous avons attendu le bus.", en: "We waited for the bus." }] },
      { heading: "Negative", body: "ne … pas wraps avoir: Je n'ai pas mangé. Il n'a pas fini." },
      { heading: "Meaning", body: "It covers English 'I spoke', 'I have spoken' and 'I did speak' — completed actions." },
    ],
    tip: "Listen for the difference: je parle (present) vs j'ai parlé (past). The « ai » is the clue.",
    practice: { conj: { verbs: ["parler", "manger", "travailler", "regarder", "acheter", "trouver", "oublier", "finir", "choisir", "attendre", "vendre", "perdre", "réserver", "téléphoner"], tense: "passe_compose" }, transform: "passe_compose", types: ["multiple_choice", "conjugation", "transformation", "fill_blank", "translation", "listening"] },
  }),
  S({
    id: "w8-pc-irregular", week: 8, order: 2, title: "Irregular past participles", short: "Irregular PP", cefr: "A2", category: "grammar",
    summary: "fait, pris, eu, été, vu, dit, mis, bu, lu, écrit, pu, voulu, dû.",
    objectives: ["Use the most common irregular participles", "Talk about what you did"],
    explanation: [
      { heading: "Memorise these", body: "", table: { headers: ["infinitive", "participle", "example"], rows: [["faire", "fait", "j'ai fait"], ["prendre", "pris", "j'ai pris"], ["comprendre", "compris", "j'ai compris"], ["apprendre", "appris", "j'ai appris"], ["avoir", "eu", "j'ai eu"], ["être", "été", "j'ai été"], ["voir", "vu", "j'ai vu"], ["dire", "dit", "j'ai dit"], ["mettre", "mis", "j'ai mis"], ["boire", "bu", "j'ai bu"], ["lire", "lu", "j'ai lu"], ["écrire", "écrit", "j'ai écrit"], ["pouvoir", "pu", "j'ai pu"], ["vouloir", "voulu", "j'ai voulu"], ["devoir", "dû", "j'ai dû"]] } },
    ],
    practice: { conj: { verbs: ["faire", "prendre", "avoir", "être", "voir", "dire", "mettre", "boire", "lire", "écrire", "comprendre", "apprendre"], tense: "passe_compose" }, types: ["multiple_choice", "conjugation", "fill_blank", "translation", "listening"] },
  }),
  // ───────────────────────────── Week 9 ─────────────────────────────
  S({
    id: "w9-pc-etre", week: 9, order: 1, title: "Passé composé with être", short: "PC (être)", cefr: "A2", category: "grammar",
    summary: "Movement verbs and reflexives use être — and agree: elle est allée.",
    objectives: ["Choose être vs avoir as auxiliary", "Make the participle agree with the subject"],
    explanation: [
      { heading: "Which verbs?", body: "About 15 verbs of movement / change of state: aller, venir, arriver, partir, entrer, sortir, monter, descendre, rester, tomber, naître, mourir, devenir, revenir, rentrer — plus ALL reflexive verbs.", examples: [{ fr: "Je suis arrivé(e) à huit heures.", en: "I arrived at eight." }] },
      { heading: "Agreement", body: "With être, the participle agrees with the subject like an adjective.", table: { headers: ["", "aller"], rows: [["il", "est allé"], ["elle", "est allée"], ["ils", "sont allés"], ["elles", "sont allées"]] } },
      { heading: "Reflexives", body: "Je me suis levé(e). Elle s'est couchée tard. Nous nous sommes promenés." },
    ],
    tip: "Picture the 'House of être': you arrive, go in, go up the stairs, come down, go out, leave…",
    practice: { conj: { verbs: ["aller", "venir", "arriver", "partir", "rester", "sortir", "rentrer", "tomber", "descendre", "se lever", "se coucher", "se promener"], tense: "passe_compose" }, transform: "passe_compose", types: ["multiple_choice", "conjugation", "fill_blank", "transformation", "translation", "listening"] },
  }),
  S({
    id: "w9-time", week: 9, order: 2, title: "Time expressions", short: "Time words", cefr: "A2", category: "vocabulary",
    summary: "hier, il y a, depuis, pendant, la semaine dernière.",
    objectives: ["Situate events in the past", "Distinguish il y a, depuis and pendant"],
    explanation: [
      { heading: "Past markers", body: "hier (yesterday) · avant-hier · hier soir · la semaine dernière · l'année dernière · ce matin." },
      { heading: "il y a / depuis / pendant", body: "il y a + time = ago (Je suis arrivé il y a deux ans). depuis + time with PRESENT = since/for, still true (J'habite ici depuis deux ans). pendant = during / for a closed period (J'ai travaillé pendant trois heures).", examples: [{ fr: "J'apprends le français depuis six mois.", en: "I've been learning French for six months." }] },
    ],
    practice: { types: ["multiple_choice", "fill_blank", "translation", "sentence_builder"] },
  }),
  // ───────────────────────────── Week 10 ─────────────────────────────
  S({
    id: "w10-object-pronouns", week: 10, order: 1, title: "Object pronouns", short: "le / la / lui", cefr: "A2", category: "grammar",
    summary: "Je le vois, je lui parle — pronouns go before the verb.",
    objectives: ["Replace direct objects with le / la / les", "Replace à + person with lui / leur"],
    explanation: [
      { heading: "Direct objects", body: "le (him/it, m), la (her/it, f), l' before a vowel, les (them). They go BEFORE the conjugated verb.", examples: [{ fr: "Tu vois le bus ? — Oui, je le vois.", en: "Do you see the bus? — Yes, I see it." }] },
      { heading: "Indirect objects", body: "lui (to him / to her), leur (to them) replace à + person: Je parle à Marie → Je lui parle.", examples: [{ fr: "J'écris au propriétaire. → Je lui écris.", en: "I write to the landlord. → I write to him." }] },
      { heading: "With two verbs", body: "The pronoun goes before the infinitive it belongs to: Je vais l'appeler. Je peux lui parler ?" },
    ],
    practice: { types: ["multiple_choice", "fill_blank", "transformation", "sentence_builder", "translation"] },
  }),
  S({
    id: "w10-y-en", week: 10, order: 2, title: "Y and en", short: "Y & en", cefr: "A2", category: "grammar",
    summary: "J'y vais. J'en veux deux.",
    objectives: ["Replace places with y", "Replace quantities and de + noun with en"],
    explanation: [
      { heading: "y = there", body: "Replaces à / dans / chez + place: Tu vas à la gare ? — Oui, j'y vais. On y va ! (Let's go!)" },
      { heading: "en = some / of it", body: "Replaces du / de la / des + noun, or a quantity: Tu as des enfants ? — Oui, j'en ai deux. Il y a du pain ? — Non, il n'y en a pas.", examples: [{ fr: "Combien de baguettes ? — J'en voudrais trois.", en: "How many baguettes? — I'd like three (of them)." }] },
    ],
    practice: { types: ["multiple_choice", "fill_blank", "transformation", "translation"] },
  }),
  S({
    id: "w10-connectors", week: 10, order: 3, title: "Connecting ideas", short: "Connectors", cefr: "A2", category: "grammar",
    summary: "et, mais, parce que, donc, quand, si, alors.",
    objectives: ["Combine short sentences into longer ones", "Give reasons and consequences"],
    explanation: [
      { heading: "Connectors", body: "et (and) · mais (but) · ou (or) · parce que (because) · donc / alors (so) · quand (when) · si (if) · pourtant (yet).", examples: [{ fr: "Je ne viens pas parce que je suis malade.", en: "I'm not coming because I'm ill." }, { fr: "Si tu veux, on peut manger ensemble.", en: "If you want, we can eat together." }] },
      { heading: "Elision", body: "parce que → parce qu'il / parce qu'elle · si + il → s'il (but si elle)." },
    ],
    practice: { types: ["multiple_choice", "sentence_builder", "fill_blank", "translation"] },
  }),
  // ───────────────────────────── Week 11 ─────────────────────────────
  S({
    id: "w11-listening", week: 11, order: 1, title: "Listening comprehension", short: "Listening", cefr: "A2", category: "listening",
    summary: "Catch numbers, times and key words in natural speech.",
    objectives: ["Understand short spoken sentences", "Pick out times, prices and places"],
    explanation: [
      { heading: "Listening strategies", body: "Don't try to understand every word. Listen for the verb (who? when?), numbers, and question words. Replay as often as you need — that's how ears learn." },
      { heading: "Liaison and elision", body: "French links words: vous‿avez sounds like « vou-zavez », les‿enfants like « lé-zenfants ». Knowing this makes speech much easier to segment." },
    ],
    practice: { includeSkills: ["w1-er-present", "w2-etre", "w2-avoir", "w2-aller-faire", "w4-questions", "w5-modals", "w6-routine", "w7-futur-proche", "w8-pc-avoir", "w9-pc-etre"], types: ["listening", "listening", "multiple_choice", "dialogue"] },
  }),
  S({
    id: "w11-situations", week: 11, order: 2, title: "Real-life situations", short: "Situations", cefr: "A2", category: "conversation",
    summary: "Café, doctor, landlord, phone calls, recruiters.",
    objectives: ["Handle common service interactions", "Use polite formulas and ask for clarification"],
    explanation: [
      { heading: "Survival phrases", body: "Pardon, vous pouvez répéter ? · Plus lentement, s'il vous plaît. · Qu'est-ce que ça veut dire ? · Je voudrais… · Est-ce que c'est possible de… ? · Je vous remercie." },
      { heading: "Politeness register", body: "Always start with Bonjour (Madame / Monsieur). Use vous. Je voudrais and pourriez-vous are softer than je veux / pouvez-vous." },
    ],
    practice: { types: ["dialogue", "multiple_choice", "translation", "sentence_builder", "dialogue"] },
  }),
  // ───────────────────────────── Week 12 ─────────────────────────────
  S({
    id: "w12-review", week: 12, order: 1, title: "Comprehensive review", short: "Review", cefr: "A2", category: "review",
    summary: "Mixed practice across everything, targeting your weakest skills.",
    objectives: ["Consolidate weak areas", "Mix tenses accurately"],
    explanation: [
      { heading: "Mixing tenses", body: "Present for now and habits (je travaille), futur proche for plans (je vais travailler), passé composé for completed events (j'ai travaillé). Many sentences combine them: Hier j'ai travaillé, aujourd'hui je me repose, demain je vais sortir." },
    ],
    practice: { includeSkills: ["w1-er-present", "w2-etre", "w2-avoir", "w3-articles", "w3-adjectives", "w4-negation", "w4-questions", "w5-modals", "w6-reflexive", "w7-futur-proche", "w8-pc-avoir", "w9-pc-etre", "w10-object-pronouns"], types: ["multiple_choice", "fill_blank", "translation", "conjugation", "sentence_builder", "listening"] },
  }),
  S({
    // Id kept for saved progress. Not an A2 readiness claim: that needs a coverage plan plus
    // real listening and interaction tasks (audit F10).
    id: "w12-assessment", week: 12, order: 2, title: "Course review", short: "Course review", cefr: "A2", category: "review",
    summary: "A mixed grammar and vocabulary check drawn from weeks 1–10.",
    objectives: ["Check written grammar and vocabulary from the course", "Identify topics for continued practice"],
    explanation: [
      { heading: "How this works", body: "This review samples written grammar and vocabulary from weeks 1–10. Answer without hints where you can. Your result shows which topics are solid and which deserve another pass. It doesn't test listening or spontaneous conversation, so it isn't a measure of A2 level on its own." },
    ],
    practice: { includeSkills: ["w1-pronouns", "w1-er-present", "w2-etre", "w2-avoir", "w2-aller-faire", "w3-articles", "w3-adjectives", "w4-negation", "w4-questions", "w4-prepositions", "w5-modals", "w5-irregular", "w6-reflexive", "w7-futur-proche", "w8-pc-avoir", "w8-pc-irregular", "w9-pc-etre", "w9-time", "w10-object-pronouns", "w10-y-en"], types: ["multiple_choice", "fill_blank", "translation", "conjugation", "transformation", "listening"] },
  }),
];

/** Every skill of every course (German ids start with "de-"). */
export const SKILL_BY_ID: Record<string, SkillDef> = Object.fromEntries([...SKILLS, ...DE_SKILLS].map((s) => [s.id, s]));

export function getSkill(id: string): SkillDef {
  const s = SKILL_BY_ID[id];
  if (!s) throw new Error(`Unknown skill ${id}`);
  return s;
}

const order = (list: SkillDef[]) => [...list].sort((a, b) => a.week - b.week || a.order - b.order);

/** French skills in curriculum order. */
export const ORDERED_SKILLS = order(SKILLS);

const COURSES: Record<Lang, { weeks: WeekDef[]; skills: SkillDef[]; ordered: SkillDef[] }> = {
  fr: { weeks: WEEKS, skills: SKILLS, ordered: ORDERED_SKILLS },
  de: { weeks: DE_WEEKS, skills: DE_SKILLS, ordered: order(DE_SKILLS) },
};

export const courseWeeks = (lang: Lang = "fr") => COURSES[lang].weeks;
export const courseSkills = (lang: Lang = "fr") => COURSES[lang].skills;
/** A course's skills in curriculum order. */
export const orderedSkills = (lang: Lang = "fr") => COURSES[lang].ordered;

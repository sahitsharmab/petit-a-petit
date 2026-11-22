import type { SkillDef, WeekDef } from "../types";

/*
 * German course (A1 → A2), same shape as the French one: 12 weeks, week 11 listening and
 * situations, week 12 review. Skill ids start with "de-" and keep the French slot names
 * where the role is the same (de-w1-basic-sentences, de-w11-situations, de-w12-review…).
 * Conjugation practice comes from hand-written drills in the bank (no conjugation engine).
 */

export const DE_WEEKS: WeekDef[] = [
  { number: 1, title: "First sentences", focus: "Subject pronouns, regular verbs, basic sentences", cefr: "A1", description: "Who does what: ich, du, er, sie… the regular verb endings, and the verb-second rule." },
  { number: 2, title: "The essentials", focus: "Sein, haben, everyday expressions", cefr: "A1", description: "The two verbs that hold German together, plus the phrases you need every day." },
  { number: 3, title: "Nouns & the accusative", focus: "der / die / das, plurals, accusative", cefr: "A1", description: "Every noun has a gender — and the article changes when it's the object." },
  { number: 4, title: "Asking & saying no", focus: "nicht and kein, questions, common prepositions", cefr: "A1", description: "W-questions, yes/no questions, nicht vs kein, and in / nach / aus / mit." },
  { number: 5, title: "Strong verbs & modals", focus: "Stem-changing verbs, modal verbs", cefr: "A1", description: "Du fährst, er isst… and können, wollen, müssen with the infinitive at the end." },
  { number: 6, title: "Daily routines", focus: "Separable verbs, telling the time", cefr: "A1", description: "Ich stehe um sieben Uhr auf: separable verbs and the clock." },
  { number: 7, title: "Making plans", focus: "Talking about the future, invitations", cefr: "A2", description: "Present tense + time word, werden, and how to invite, accept and decline." },
  { number: 8, title: "Telling the past I", focus: "Perfekt with haben", cefr: "A2", description: "Ich habe gekauft, ich habe gegessen — talking about what happened." },
  { number: 9, title: "Telling the past II", focus: "Perfekt with sein, time expressions", cefr: "A2", description: "Ich bin gefahren, gestern, vor zwei Tagen, seit einem Jahr." },
  { number: 10, title: "Fluent combinations", focus: "Dative, word order, connectors", cefr: "A2", description: "Mit dem Bus, mir gefällt…, and weil / dass sending the verb to the end." },
  { number: 11, title: "Real situations", focus: "Listening and situational conversation", cefr: "A2", description: "Train your ear and handle cafés, appointments and landlords." },
  { number: 12, title: "Course review", focus: "Comprehensive review and a mixed grammar and vocabulary check", cefr: "A2", description: "Consolidate everything and see which topics need another pass." },
];

const S = (s: SkillDef) => s;

export const DE_SKILLS: SkillDef[] = [
  // ───────────────────────────── Week 1 ─────────────────────────────
  S({
    id: "de-w1-pronouns", week: 1, order: 1, title: "Subject pronouns", short: "Pronouns", cefr: "A1", category: "grammar",
    summary: "ich, du, er, sie, es, wir, ihr, sie, Sie — and when to say du or Sie.",
    objectives: ["Pick the right subject pronoun for a person or group", "Choose between du and Sie appropriately"],
    explanation: [
      {
        heading: "Who is doing the action?",
        body: "Every German verb needs a subject. When you don't name the person, you use a pronoun.",
        table: { headers: ["German", "English", "Notes"], rows: [["ich", "I", "lower case, unlike English 'I'"], ["du", "you", "one person you know well"], ["er / sie / es", "he / she / it", "also for masculine / feminine / neuter things"], ["wir", "we", ""], ["ihr", "you (plural)", "a group of friends or family"], ["sie", "they", "lower case"], ["Sie", "you (formal)", "always capitalised; singular or plural"]] },
      },
      {
        heading: "du or Sie?",
        body: "Use du with friends, family, children, and other students or young colleagues. Use Sie with strangers, landlords, shop staff, doctors and anyone you'd call Herr / Frau Müller. Sie takes the same verb form as sie (they).",
        examples: [{ fr: "Bist du müde?", en: "Are you tired? (to a friend)" }, { fr: "Sind Sie Frau Weber?", en: "Are you Mrs Weber? (polite)" }],
      },
    ],
    tip: "sie can mean she, they, or (as Sie) you. The verb ending and the capital letter tell you which: sie ist (she is), sie sind (they are), Sie sind (you are).",
    practice: { types: ["multiple_choice", "fill_blank", "translation", "listening"] },
  }),
  S({
    id: "de-w1-present", week: 1, order: 2, title: "Regular verbs (present)", short: "Present tense", cefr: "A1", category: "grammar",
    summary: "wohnen, lernen, arbeiten: drop -en, add the ending.",
    objectives: ["Conjugate regular verbs in the present", "Add the extra -e- in arbeitest, arbeitet"],
    explanation: [
      {
        heading: "Stem + ending",
        body: "Take the infinitive, remove -en to get the stem (wohn-), then add the ending for the subject.",
        table: { headers: ["Subject", "Ending", "wohnen"], rows: [["ich", "-e", "ich wohne"], ["du", "-st", "du wohnst"], ["er / sie / es", "-t", "er wohnt"], ["wir", "-en", "wir wohnen"], ["ihr", "-t", "ihr wohnt"], ["sie / Sie", "-en", "sie wohnen"]] },
      },
      {
        heading: "Stems ending in -t or -d",
        body: "Add an -e- before -st and -t so you can pronounce it: arbeiten → du arbeitest, er arbeitet. finden → du findest, er findet.",
        examples: [{ fr: "Ich wohne in Berlin.", en: "I live in Berlin." }, { fr: "Arbeitest du heute?", en: "Are you working today?" }],
      },
      {
        heading: "One present for everything",
        body: "German has no 'I am living' form: ich wohne = I live / I am living / I do live.",
      },
    ],
    tip: "wir, sie and Sie always share the infinitive form: wir wohnen, sie wohnen, Sie wohnen.",
    practice: { types: ["multiple_choice", "conjugation", "fill_blank", "translation", "listening"] },
  }),
  S({
    id: "de-w1-basic-sentences", week: 1, order: 3, title: "Building basic sentences", short: "Basic sentences", cefr: "A1", category: "grammar",
    summary: "The verb comes second. Greetings and introductions.",
    objectives: ["Put the verb in second position", "Greet people and introduce yourself"],
    explanation: [
      {
        heading: "Verb second",
        body: "In a German statement the conjugated verb is always the second element. If you start with something other than the subject, the subject moves after the verb.",
        examples: [{ fr: "Ich lerne heute Deutsch.", en: "I'm learning German today." }, { fr: "Heute lerne ich Deutsch.", en: "Today I'm learning German." }],
      },
      {
        heading: "Introducing yourself",
        body: "Ich heiße… / Mein Name ist… (my name is) · Ich komme aus… (I come from) · Ich wohne in… (I live in) · Ich bin… (I am…) · Ich arbeite als… (I work as).",
        examples: [{ fr: "Hallo, ich heiße Sam. Ich komme aus England.", en: "Hello, my name is Sam. I come from England." }],
      },
      {
        heading: "Greetings",
        body: "Guten Morgen · Guten Tag · Guten Abend · Hallo (informal) · Danke · Bitte · Tschüss (informal) · Auf Wiedersehen.",
      },
    ],
    tip: "Every noun is capitalised in German: das Haus, der Kaffee, die Arbeit.",
    practice: { types: ["sentence_builder", "multiple_choice", "translation", "listening", "dialogue"] },
  }),
  // ───────────────────────────── Week 2 ─────────────────────────────
  S({
    id: "de-w2-sein", week: 2, order: 1, title: "Sein (to be)", short: "Sein", cefr: "A1", category: "grammar",
    summary: "ich bin, du bist, er ist… identity, origin, jobs and descriptions.",
    objectives: ["Conjugate sein in the present", "Describe yourself and others with sein"],
    explanation: [
      { heading: "Conjugation", body: "Sein is completely irregular — learn it by heart.", table: { headers: ["Subject", "sein"], rows: [["ich", "bin"], ["du", "bist"], ["er / sie / es", "ist"], ["wir", "sind"], ["ihr", "seid"], ["sie / Sie", "sind"]] } },
      { heading: "Uses", body: "Jobs and nationalities take no article: Ich bin Lehrer. Sie ist Ärztin. Descriptions: Er ist müde. Origin and place: Wir sind in München.", examples: [{ fr: "Ich bin Engländerin.", en: "I'm English (woman)." }, { fr: "Sind Sie verheiratet?", en: "Are you married?" }] },
    ],
    tip: "Say « Ich bin Lehrerin », not « Ich bin eine Lehrerin » — no article for jobs.",
    practice: { types: ["multiple_choice", "conjugation", "fill_blank", "translation", "listening"] },
  }),
  S({
    id: "de-w2-haben", week: 2, order: 2, title: "Haben (to have)", short: "Haben", cefr: "A1", category: "grammar",
    summary: "ich habe, du hast, er hat… possession, appointments and es gibt.",
    objectives: ["Conjugate haben in the present", "Use es gibt for 'there is'"],
    explanation: [
      { heading: "Conjugation", body: "Watch du hast and er hat: the b disappears.", table: { headers: ["Subject", "haben"], rows: [["ich", "habe"], ["du", "hast"], ["er / sie / es", "hat"], ["wir", "haben"], ["ihr", "habt"], ["sie / Sie", "haben"]] } },
      { heading: "es gibt = there is / there are", body: "Es gibt + accusative: Es gibt einen Supermarkt hier. Es gibt keine Milch mehr.", examples: [{ fr: "Ich habe einen Termin.", en: "I have an appointment." }, { fr: "Gibt es hier ein Café?", en: "Is there a café here?" }] },
      { heading: "Age uses sein", body: "Unlike French, German uses sein for age: Ich bin dreißig (Jahre alt)." },
    ],
    practice: { types: ["multiple_choice", "conjugation", "fill_blank", "translation", "listening"] },
  }),
  S({
    id: "de-w2-expressions", week: 2, order: 3, title: "Everyday expressions", short: "Expressions", cefr: "A1", category: "vocabulary",
    summary: "Wie geht's?, Hunger haben, es ist kalt, ich hätte gern…",
    objectives: ["Use common haben / sein expressions", "Respond to everyday small talk"],
    explanation: [
      { heading: "With haben", body: "Hunger haben (be hungry) · Durst haben (thirsty) · Zeit haben (have time) · Lust haben (feel like it) · Recht haben (be right) · Angst haben (be scared)." },
      { heading: "Weather", body: "Es ist kalt / warm / heiß. Es regnet (it's raining). Es schneit (it's snowing). Die Sonne scheint." },
      { heading: "Small talk", body: "Wie geht's? — Gut, danke. Und dir? / Und Ihnen? · Nicht so gut. · Es geht. · Bitte schön. · Kein Problem. · Ich hätte gern… (I'd like…)", examples: [{ fr: "Ich habe Hunger.", en: "I'm hungry." }] },
    ],
    practice: { types: ["multiple_choice", "fill_blank", "translation", "sentence_builder", "listening", "dialogue"] },
  }),
  // ───────────────────────────── Week 3 ─────────────────────────────
  S({
    id: "de-w3-articles", week: 3, order: 1, title: "Articles & gender", short: "Articles", cefr: "A1", category: "grammar",
    summary: "der / die / das, ein / eine — every noun has a gender.",
    objectives: ["Choose definite and indefinite articles", "Learn nouns together with their gender"],
    explanation: [
      { heading: "Three genders", body: "Learn each noun with its article: der Tisch, die Lampe, das Buch. Tendencies help: -ung, -heit, -keit, -ion are feminine (die Wohnung); -chen is neuter (das Mädchen); days and months are masculine (der Montag)." },
      { heading: "The articles (nominative)", body: "", table: { headers: ["", "masculine", "feminine", "neuter", "plural"], rows: [["the", "der", "die", "das", "die"], ["a", "ein", "eine", "ein", "—"]] }, examples: [{ fr: "der Bahnhof, die Straße, das Haus, die Schlüssel", en: "the station, the street, the house, the keys" }] },
      { heading: "Pronouns follow gender", body: "Things take er / sie / es by grammatical gender: Der Tisch? Er ist neu. Die Lampe? Sie ist kaputt." },
    ],
    tip: "All plurals use die: der Tisch → die Tische, das Buch → die Bücher.",
    practice: { types: ["multiple_choice", "fill_blank", "translation", "sentence_builder", "listening"] },
  }),
  S({
    id: "de-w3-plurals", week: 3, order: 2, title: "Plurals", short: "Plurals", cefr: "A1", category: "grammar",
    summary: "-e, -er, -n, -s or no ending — often with an umlaut.",
    objectives: ["Form the most common plural patterns", "Make article and verb plural together"],
    explanation: [
      { heading: "Common patterns", body: "", table: { headers: ["pattern", "singular", "plural"], rows: [["-e", "der Tag", "die Tage"], ["umlaut + -e", "der Stuhl", "die Stühle"], ["-er (+ umlaut)", "das Buch", "die Bücher"], ["-n / -en", "die Frau", "die Frauen"], ["-s", "das Auto", "die Autos"], ["no change", "der Lehrer", "die Lehrer"]] } },
      { heading: "Learn the plural with the noun", body: "Dictionaries show it: Kind, das (-er) → die Kinder. Most feminine nouns add -(e)n.", examples: [{ fr: "Die Kinder spielen.", en: "The children are playing." }] },
    ],
    practice: { types: ["multiple_choice", "transformation", "fill_blank", "translation"] },
  }),
  S({
    id: "de-w3-accusative", week: 3, order: 3, title: "The accusative", short: "Accusative", cefr: "A1", category: "grammar",
    summary: "der → den, ein → einen: the direct object.",
    objectives: ["Change masculine articles in the accusative", "Use the accusative after haben, brauchen, möchten, es gibt"],
    explanation: [
      { heading: "Only masculine changes", body: "The direct object (what you have, buy, see, need) is in the accusative. Only the masculine article changes.", table: { headers: ["", "masc.", "fem.", "neuter", "plural"], rows: [["nominative", "der / ein", "die / eine", "das / ein", "die"], ["accusative", "den / einen", "die / eine", "das / ein", "die"]] } },
      { heading: "Typical verbs", body: "haben, brauchen, kaufen, möchten, sehen, suchen, nehmen, es gibt — all take an accusative object.", examples: [{ fr: "Ich brauche einen Schlüssel.", en: "I need a key." }, { fr: "Wir kaufen den Tisch.", en: "We're buying the table." }] },
      { heading: "Pronouns too", body: "ich → mich, du → dich, er → ihn: Ich sehe ihn. Kennst du mich?" },
    ],
    tip: "Ask « wen oder was? » (whom or what?) — the answer is the accusative.",
    practice: { types: ["multiple_choice", "fill_blank", "sentence_builder", "translation"] },
  }),
  // ───────────────────────────── Week 4 ─────────────────────────────
  S({
    id: "de-w4-negation", week: 4, order: 1, title: "Negation: nicht and kein", short: "Negation", cefr: "A1", category: "grammar",
    summary: "kein for nouns with ein or no article, nicht for everything else.",
    objectives: ["Choose between nicht and kein", "Put nicht in the right place"],
    explanation: [
      { heading: "kein = not a / no", body: "Use kein (keine, keinen…) instead of ein, or for nouns with no article: Ich habe ein Auto → Ich habe kein Auto. Ich trinke Kaffee → Ich trinke keinen Kaffee.", examples: [{ fr: "Wir haben keine Zeit.", en: "We don't have any time." }] },
      { heading: "nicht for the rest", body: "Verbs, adjectives, names and nouns with der / die / das: Ich arbeite nicht. Das ist nicht teuer. Ich finde den Schlüssel nicht.", examples: [{ fr: "Er kommt heute nicht.", en: "He isn't coming today." }] },
      { heading: "Where nicht goes", body: "At the end of a simple sentence (Ich verstehe das nicht), but before adjectives, places and separable prefixes (Es ist nicht weit. Ich wohne nicht in Berlin.)." },
    ],
    tip: "kein takes the same endings as ein: kein Hund, keine Katze, keinen Hund (accusative).",
    practice: { types: ["multiple_choice", "transformation", "fill_blank", "translation", "sentence_builder"] },
  }),
  S({
    id: "de-w4-questions", week: 4, order: 2, title: "Asking questions", short: "Questions", cefr: "A1", category: "grammar",
    summary: "Verb first for yes/no questions; W-words for everything else.",
    objectives: ["Ask yes/no questions with the verb first", "Use wo, wann, wie, was, wer, warum, woher, wohin"],
    explanation: [
      { heading: "Yes / no questions", body: "Put the verb first: Du wohnst hier. → Wohnst du hier? Sie sprechen Englisch. → Sprechen Sie Englisch?", examples: [{ fr: "Hast du Zeit?", en: "Do you have time?" }] },
      { heading: "W-questions", body: "W-word, then the verb, then the subject: Wo wohnst du? Wann kommt der Bus? Was machst du?", examples: [{ fr: "Woher kommen Sie?", en: "Where are you from?" }, { fr: "Wie viel kostet das?", en: "How much does that cost?" }] },
      { heading: "The W-words", body: "wo (where) · woher (from where) · wohin (where to) · wann (when) · wie (how) · wie viel (how much) · was (what) · wer (who) · warum (why) · welcher / welche / welches (which)." },
    ],
    practice: { types: ["multiple_choice", "transformation", "fill_blank", "translation", "sentence_builder"] },
  }),
  S({
    id: "de-w4-prepositions", week: 4, order: 3, title: "Common prepositions", short: "Prepositions", cefr: "A1", category: "grammar",
    summary: "in, nach, aus, mit, bei, zu, von, für.",
    objectives: ["Use nach / in / aus with places", "Use mit, bei, zu and für in everyday phrases"],
    explanation: [
      { heading: "Places", body: "nach + city or country (nach Berlin, nach Spanien) · in + place you're in (in Berlin, in der Stadt) · aus = from (Ich komme aus England) · zu = to a person or building (zum Arzt, zur Arbeit) · nach Hause (home) / zu Hause (at home).", examples: [{ fr: "Ich fahre morgen nach Hamburg.", en: "I'm going to Hamburg tomorrow." }] },
      { heading: "Everyday prepositions", body: "mit (with, by): mit dem Bus · bei (at someone's place / company): bei Freunden, bei Siemens · für (for): für dich · von (from, of): von meiner Mutter · um (at a time): um acht Uhr.", examples: [{ fr: "Ich wohne bei meiner Schwester.", en: "I'm staying at my sister's." }] },
      { heading: "Contractions", body: "zu dem → zum, zu der → zur, in dem → im, bei dem → beim, in das → ins." },
    ],
    practice: { types: ["multiple_choice", "fill_blank", "translation", "sentence_builder", "listening"] },
  }),
  // ───────────────────────────── Week 5 ─────────────────────────────
  S({
    id: "de-w5-modals", week: 5, order: 1, title: "Modal verbs", short: "Modal verbs", cefr: "A1", category: "grammar",
    summary: "können, wollen, müssen, möchten, dürfen — with the infinitive at the end.",
    objectives: ["Conjugate the main modal verbs", "Put the second verb at the end, and use polite ich möchte"],
    explanation: [
      { heading: "Conjugations", body: "ich and er/sie/es have the same form and no ending.", table: { headers: ["", "können", "wollen", "müssen", "möchten"], rows: [["ich", "kann", "will", "muss", "möchte"], ["du", "kannst", "willst", "musst", "möchtest"], ["er/sie/es", "kann", "will", "muss", "möchte"], ["wir", "können", "wollen", "müssen", "möchten"], ["ihr", "könnt", "wollt", "müsst", "möchtet"], ["sie/Sie", "können", "wollen", "müssen", "möchten"]] } },
      { heading: "The infinitive goes to the end", body: "The modal is in second position; the other verb waits at the end of the sentence: Ich kann heute nicht kommen. Wir müssen morgen früh aufstehen.", examples: [{ fr: "Kann ich mit Karte bezahlen?", en: "Can I pay by card?" }] },
      { heading: "Politeness", body: "Ich möchte (I'd like) is softer than ich will. In shops and cafés: Ich möchte einen Kaffee, bitte. Even more polite: Ich hätte gern einen Kaffee." },
    ],
    practice: { types: ["multiple_choice", "conjugation", "fill_blank", "translation", "listening"] },
  }),
  S({
    id: "de-w5-stem-change", week: 5, order: 2, title: "Stem-changing verbs", short: "Stem changes", cefr: "A1", category: "grammar",
    summary: "fahren → du fährst, essen → er isst, lesen → sie liest.",
    objectives: ["Conjugate common stem-changing verbs", "Know that only du and er/sie/es change"],
    explanation: [
      { heading: "Only du and er / sie / es change", body: "The endings stay regular; the vowel changes in the du and er/sie/es forms only.", table: { headers: ["change", "infinitive", "du", "er / sie / es"], rows: [["a → ä", "fahren", "fährst", "fährt"], ["a → ä", "schlafen", "schläfst", "schläft"], ["e → i", "essen", "isst", "isst"], ["e → i", "sprechen", "sprichst", "spricht"], ["e → i", "nehmen", "nimmst", "nimmt"], ["e → ie", "lesen", "liest", "liest"], ["e → ie", "sehen", "siehst", "sieht"]] } },
      { heading: "Everything else is regular", body: "ich fahre, wir fahren, ihr fahrt, sie fahren — no change.", examples: [{ fr: "Fährst du mit dem Zug?", en: "Are you going by train?" }, { fr: "Er spricht sehr gut Englisch.", en: "He speaks English very well." }] },
    ],
    tip: "nehmen is extra irregular: du nimmst, er nimmt (double m).",
    practice: { types: ["multiple_choice", "conjugation", "fill_blank", "translation", "listening"] },
  }),
  // ───────────────────────────── Week 6 ─────────────────────────────
  S({
    id: "de-w6-separable", week: 6, order: 1, title: "Separable verbs", short: "Separable verbs", cefr: "A1", category: "grammar",
    summary: "aufstehen → ich stehe auf: the prefix jumps to the end.",
    objectives: ["Split separable verbs in the present", "Recognise common prefixes: an-, auf-, aus-, ein-, mit-, fern-"],
    explanation: [
      { heading: "The prefix goes to the end", body: "In a normal sentence the verb part is in second position and the prefix goes to the very end.", table: { headers: ["infinitive", "sentence"], rows: [["aufstehen", "Ich stehe um sieben Uhr auf."], ["einkaufen", "Wir kaufen am Samstag ein."], ["anrufen", "Ich rufe dich morgen an."], ["fernsehen", "Er sieht jeden Abend fern."], ["anfangen", "Der Kurs fängt um neun an."]] } },
      { heading: "With a modal, it stays together", body: "Ich muss früh aufstehen. Kannst du mich anrufen?", examples: [{ fr: "Wann stehst du auf?", en: "When do you get up?" }] },
    ],
    tip: "The stress is on the prefix: AUFstehen, EINkaufen, ANrufen.",
    practice: { types: ["multiple_choice", "conjugation", "fill_blank", "translation", "sentence_builder", "listening"] },
  }),
  S({
    id: "de-w6-routine", week: 6, order: 2, title: "Daily routine & time", short: "Routine & time", cefr: "A1", category: "vocabulary",
    summary: "Wie spät ist es? Es ist halb acht.",
    objectives: ["Tell the time", "Describe your day in sequence"],
    explanation: [
      { heading: "Telling the time", body: "Es ist acht Uhr (8:00) · Viertel nach acht (8:15) · halb neun (8:30 — half TO nine!) · Viertel vor neun (8:45). Official times use 24h: fünfzehn Uhr dreißig (15:30). At a time: um acht Uhr." },
      { heading: "Sequencing", body: "zuerst (first) · dann (then) · danach (after that) · später (later) · am Morgen / am Nachmittag / am Abend. Remember verb second: Dann frühstücke ich.", examples: [{ fr: "Zuerst trinke ich einen Kaffee, dann gehe ich zur Arbeit.", en: "First I drink a coffee, then I go to work." }] },
    ],
    tip: "halb neun = 8:30, not 9:30. Think « half way to nine ».",
    practice: { types: ["multiple_choice", "fill_blank", "sentence_builder", "translation", "listening"] },
  }),
  // ───────────────────────────── Week 7 ─────────────────────────────
  S({
    id: "de-w7-future", week: 7, order: 1, title: "Talking about the future", short: "Future", cefr: "A2", category: "grammar",
    summary: "Morgen fahre ich… and werden + infinitive.",
    objectives: ["Use the present tense with a time word for plans", "Form the future with werden"],
    explanation: [
      { heading: "Present + time word", body: "Most of the time Germans use the present tense for the future: Morgen arbeite ich. Nächste Woche fahren wir nach Wien.", examples: [{ fr: "Am Samstag besuche ich meine Eltern.", en: "On Saturday I'm visiting my parents." }] },
      { heading: "werden + infinitive", body: "For predictions and promises: ich werde, du wirst, er wird, wir werden, ihr werdet, sie werden + infinitive at the end. Es wird regnen. Ich werde dich anrufen." },
    ],
    practice: { types: ["multiple_choice", "conjugation", "fill_blank", "translation", "listening"] },
  }),
  S({
    id: "de-w7-plans", week: 7, order: 2, title: "Talking about plans", short: "Plans", cefr: "A2", category: "vocabulary",
    summary: "morgen, am Wochenende, nächste Woche, hast du Lust…?",
    objectives: ["Use future time expressions", "Make, accept and decline invitations"],
    explanation: [
      { heading: "Future time words", body: "morgen · übermorgen · heute Abend · am Wochenende · nächste Woche · nächsten Monat · in zwei Tagen." },
      { heading: "Invitations", body: "Hast du Lust, … zu …? (Do you fancy…?) · Wollen wir…? · Gern! / Sehr gern! · Leider kann ich nicht. · Wann treffen wir uns? · Wo treffen wir uns?", examples: [{ fr: "Hast du Lust, am Samstag ins Kino zu gehen?", en: "Do you fancy going to the cinema on Saturday?" }] },
    ],
    practice: { types: ["multiple_choice", "fill_blank", "sentence_builder", "translation", "dialogue"] },
  }),
  // ───────────────────────────── Week 8 ─────────────────────────────
  S({
    id: "de-w8-perfekt-haben", week: 8, order: 1, title: "Perfekt with haben", short: "Perfekt (haben)", cefr: "A2", category: "grammar",
    summary: "haben + ge-…-t: ich habe gekauft, wir haben gespielt.",
    objectives: ["Form the Perfekt with haben", "Form regular participles (ge- + stem + -t)"],
    explanation: [
      { heading: "Formula", body: "haben in second position + past participle at the end. Regular participle: ge + stem + t (kaufen → gekauft, machen → gemacht, arbeiten → gearbeitet).", examples: [{ fr: "Ich habe ein Buch gekauft.", en: "I bought a book." }, { fr: "Wir haben lange gearbeitet.", en: "We worked for a long time." }] },
      { heading: "No ge- for some verbs", body: "Verbs ending in -ieren and verbs starting with be-, ver-, er- have no ge-: telefonieren → telefoniert, bezahlen → bezahlt, besuchen → besucht." },
      { heading: "Meaning", body: "In speech, the Perfekt covers English 'I bought', 'I have bought' and 'I did buy'." },
    ],
    tip: "Separable verbs put ge between prefix and stem: einkaufen → eingekauft.",
    practice: { types: ["multiple_choice", "conjugation", "transformation", "fill_blank", "translation", "listening"] },
  }),
  S({
    id: "de-w8-perfekt-irregular", week: 8, order: 2, title: "Irregular participles", short: "Irregular participles", cefr: "A2", category: "grammar",
    summary: "gegessen, getrunken, gesehen, gelesen, geschrieben, genommen…",
    objectives: ["Use the most common irregular participles with haben", "Talk about what you did"],
    explanation: [
      { heading: "Memorise these (-en participles)", body: "", table: { headers: ["infinitive", "participle", "example"], rows: [["essen", "gegessen", "ich habe gegessen"], ["trinken", "getrunken", "ich habe getrunken"], ["sehen", "gesehen", "ich habe gesehen"], ["lesen", "gelesen", "ich habe gelesen"], ["schreiben", "geschrieben", "ich habe geschrieben"], ["nehmen", "genommen", "ich habe genommen"], ["sprechen", "gesprochen", "ich habe gesprochen"], ["finden", "gefunden", "ich habe gefunden"], ["schlafen", "geschlafen", "ich habe geschlafen"], ["helfen", "geholfen", "ich habe geholfen"]] } },
      { heading: "Mixed ones", body: "bringen → gebracht, denken → gedacht, wissen → gewusst, kennen → gekannt." },
    ],
    practice: { types: ["multiple_choice", "conjugation", "fill_blank", "translation", "listening"] },
  }),
  // ───────────────────────────── Week 9 ─────────────────────────────
  S({
    id: "de-w9-perfekt-sein", week: 9, order: 1, title: "Perfekt with sein", short: "Perfekt (sein)", cefr: "A2", category: "grammar",
    summary: "Movement and change: ich bin gefahren, sie ist gekommen.",
    objectives: ["Choose sein vs haben as the auxiliary", "Use common sein participles"],
    explanation: [
      { heading: "Which verbs?", body: "Verbs of movement from A to B and change of state take sein: gehen (gegangen), fahren (gefahren), kommen (gekommen), fliegen (geflogen), laufen (gelaufen), aufstehen (aufgestanden), ankommen (angekommen), werden (geworden), plus bleiben (geblieben) and sein (gewesen).", examples: [{ fr: "Ich bin nach Berlin gefahren.", en: "I went to Berlin." }] },
      { heading: "Conjugate sein", body: "", table: { headers: ["", "gehen"], rows: [["ich", "bin gegangen"], ["du", "bist gegangen"], ["er / sie", "ist gegangen"], ["wir", "sind gegangen"], ["ihr", "seid gegangen"], ["sie / Sie", "sind gegangen"]] } },
      { heading: "No agreement", body: "Unlike French, the participle never changes: er ist gekommen, sie ist gekommen, sie sind gekommen." },
    ],
    tip: "If you could draw an arrow from A to B, it's probably sein.",
    practice: { types: ["multiple_choice", "conjugation", "fill_blank", "transformation", "translation", "listening"] },
  }),
  S({
    id: "de-w9-time", week: 9, order: 2, title: "Time expressions", short: "Time words", cefr: "A2", category: "vocabulary",
    summary: "gestern, vor zwei Tagen, seit einem Jahr, letzte Woche.",
    objectives: ["Situate events in the past", "Distinguish vor, seit and für"],
    explanation: [
      { heading: "Past markers", body: "gestern (yesterday) · vorgestern · gestern Abend · letzte Woche · letztes Jahr · heute Morgen." },
      { heading: "vor / seit / für", body: "vor + time = ago (Ich bin vor zwei Jahren gekommen). seit + time with the PRESENT = since/for, still true (Ich wohne seit zwei Jahren hier). für = for a planned period (Ich fahre für eine Woche nach Wien).", examples: [{ fr: "Ich lerne seit sechs Monaten Deutsch.", en: "I've been learning German for six months." }] },
    ],
    practice: { types: ["multiple_choice", "fill_blank", "translation", "sentence_builder"] },
  }),
  // ───────────────────────────── Week 10 ─────────────────────────────
  S({
    id: "de-w10-dative", week: 10, order: 1, title: "The dative", short: "Dative", cefr: "A2", category: "grammar",
    summary: "mit dem Bus, bei der Arbeit, mir gefällt, kannst du mir helfen?",
    objectives: ["Use dem / der / einem after mit, bei, zu, von, aus, nach, seit", "Use mir / dir with helfen, gefallen, gehören"],
    explanation: [
      { heading: "Dative articles", body: "", table: { headers: ["", "masc.", "fem.", "neuter", "plural"], rows: [["the", "dem", "der", "dem", "den (+n)"], ["a", "einem", "einer", "einem", "—"]] } },
      { heading: "After these prepositions", body: "aus, bei, mit, nach, seit, von, zu always take the dative: mit dem Zug, bei der Bank, nach dem Essen, seit einem Jahr.", examples: [{ fr: "Ich fahre mit dem Fahrrad zur Arbeit.", en: "I cycle to work." }] },
      { heading: "Dative pronouns", body: "mir (to me), dir (to you), ihm (to him), ihr (to her), uns, euch, ihnen / Ihnen. Verbs: helfen, gefallen, gehören, danken, schmecken.", examples: [{ fr: "Die Wohnung gefällt mir.", en: "I like the flat." }, { fr: "Kannst du mir helfen?", en: "Can you help me?" }] },
    ],
    practice: { types: ["multiple_choice", "fill_blank", "transformation", "sentence_builder", "translation"] },
  }),
  S({
    id: "de-w10-word-order", week: 10, order: 2, title: "Word order", short: "Word order", cefr: "A2", category: "grammar",
    summary: "Verb second, time before place, and the verb bracket.",
    objectives: ["Keep the verb second after a time word", "Order time – manner – place"],
    explanation: [
      { heading: "Starting with time", body: "Starting with a time or place is very common — the verb stays second and the subject follows: Morgen fahre ich nach Köln. Am Wochenende haben wir keine Zeit." },
      { heading: "Time – manner – place", body: "When several details pile up: time (wann?) before manner (wie?) before place (wo/wohin?): Ich fahre morgen mit dem Zug nach Köln.", examples: [{ fr: "Wir gehen heute Abend zusammen ins Kino.", en: "We're going to the cinema together this evening." }] },
      { heading: "The verb bracket", body: "Two-part verbs frame the sentence: modal … infinitive, haben/sein … participle, verb … prefix: Ich habe gestern lange gearbeitet." },
    ],
    practice: { types: ["multiple_choice", "sentence_builder", "transformation", "fill_blank", "translation"] },
  }),
  S({
    id: "de-w10-connectors", week: 10, order: 3, title: "Connecting ideas", short: "Connectors", cefr: "A2", category: "grammar",
    summary: "und, aber, oder, denn — and weil, dass, wenn send the verb to the end.",
    objectives: ["Join sentences with und, aber, oder, denn", "Put the verb at the end after weil, dass, wenn"],
    explanation: [
      { heading: "No change in word order", body: "und (and) · aber (but) · oder (or) · denn (because) · sondern (but rather): Ich bleibe zu Hause, denn ich bin krank." },
      { heading: "Verb to the end", body: "weil (because) · dass (that) · wenn (if / when) · ob (whether): Ich bleibe zu Hause, weil ich krank bin. Ich glaube, dass er heute kommt.", examples: [{ fr: "Ich komme nicht, weil ich arbeiten muss.", en: "I'm not coming because I have to work." }, { fr: "Wenn du willst, können wir zusammen essen.", en: "If you want, we can eat together." }] },
      { heading: "Comma", body: "German always puts a comma before weil, dass, wenn and ob." },
    ],
    practice: { types: ["multiple_choice", "sentence_builder", "fill_blank", "translation"] },
  }),
  // ───────────────────────────── Week 11 ─────────────────────────────
  S({
    id: "de-w11-listening", week: 11, order: 1, title: "Listening comprehension", short: "Listening", cefr: "A2", category: "listening",
    summary: "Catch numbers, times and key words in natural speech.",
    objectives: ["Understand short spoken sentences", "Pick out times, prices and places"],
    explanation: [
      { heading: "Listening strategies", body: "Don't try to understand every word. Listen for the verb (second position!), numbers and question words. Replay as often as you need — that's how ears learn." },
      { heading: "Numbers are back to front", body: "German says the units first: einundzwanzig (21) = one-and-twenty, fünfundvierzig (45) = five-and-forty. Practise hearing the last part first." },
    ],
    practice: { includeSkills: ["de-w1-present", "de-w2-sein", "de-w2-haben", "de-w4-questions", "de-w5-modals", "de-w6-routine", "de-w7-future", "de-w8-perfekt-haben", "de-w9-perfekt-sein"], types: ["listening", "listening", "multiple_choice", "dialogue"] },
  }),
  S({
    id: "de-w11-situations", week: 11, order: 2, title: "Real-life situations", short: "Situations", cefr: "A2", category: "conversation",
    summary: "Café, doctor, landlord, phone calls, recruiters.",
    objectives: ["Handle common service interactions", "Use polite formulas and ask for clarification"],
    explanation: [
      { heading: "Survival phrases", body: "Entschuldigung, können Sie das wiederholen? · Langsamer, bitte. · Was bedeutet das? · Ich hätte gern… · Ist es möglich, …? · Vielen Dank." },
      { heading: "Politeness register", body: "Start with Guten Tag and use Sie with strangers. Könnten Sie… and ich hätte gern are softer than können Sie / ich will." },
    ],
    practice: { types: ["dialogue", "multiple_choice", "translation", "sentence_builder", "dialogue"] },
  }),
  // ───────────────────────────── Week 12 ─────────────────────────────
  S({
    id: "de-w12-review", week: 12, order: 1, title: "Comprehensive review", short: "Review", cefr: "A2", category: "review",
    summary: "Mixed practice across everything, targeting your weakest skills.",
    objectives: ["Consolidate weak areas", "Mix tenses accurately"],
    explanation: [
      { heading: "Mixing tenses", body: "Present for now, habits and plans (ich arbeite, morgen arbeite ich), Perfekt for completed events (ich habe gearbeitet, ich bin gefahren). Many sentences combine them: Gestern habe ich gearbeitet, heute ruhe ich mich aus, morgen fahre ich weg." },
    ],
    practice: { includeSkills: ["de-w1-present", "de-w2-sein", "de-w2-haben", "de-w3-articles", "de-w3-accusative", "de-w4-negation", "de-w4-questions", "de-w5-modals", "de-w5-stem-change", "de-w6-separable", "de-w8-perfekt-haben", "de-w9-perfekt-sein", "de-w10-dative"], types: ["multiple_choice", "fill_blank", "translation", "conjugation", "sentence_builder", "listening"] },
  }),
  S({
    id: "de-w12-assessment", week: 12, order: 2, title: "Course review", short: "Course review", cefr: "A2", category: "review",
    summary: "A mixed grammar and vocabulary check drawn from weeks 1–10.",
    objectives: ["Check written grammar and vocabulary from the course", "Identify topics for continued practice"],
    explanation: [
      { heading: "How this works", body: "This review samples written grammar and vocabulary from weeks 1–10. Answer without hints where you can. Your result shows which topics are solid and which deserve another pass. It doesn't test listening or spontaneous conversation, so it isn't a measure of A2 level on its own." },
    ],
    practice: { includeSkills: ["de-w1-pronouns", "de-w1-present", "de-w2-sein", "de-w2-haben", "de-w3-articles", "de-w3-plurals", "de-w3-accusative", "de-w4-negation", "de-w4-questions", "de-w4-prepositions", "de-w5-modals", "de-w5-stem-change", "de-w6-separable", "de-w7-future", "de-w8-perfekt-haben", "de-w8-perfekt-irregular", "de-w9-perfekt-sein", "de-w9-time", "de-w10-dative", "de-w10-connectors"], types: ["multiple_choice", "fill_blank", "translation", "conjugation", "transformation", "listening"] },
  }),
];

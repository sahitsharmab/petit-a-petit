import type { BankSentence, DialogueItem, DrillItem, McqItem, SkillBank, TransformItem } from "../types";

/*
 * Hand-written German content. Field names follow the shared types: `fr` holds the German text.
 * Conjugation practice uses drills (verb + subject → accepted forms) instead of an engine.
 */

const s = (id: string, de: string, en: string, extra: Partial<BankSentence> = {}): BankSentence => ({ id, fr: de, en, ...extra });
const m = (id: string, prompt: string, options: string[], answer: number, explanation: string, extra: Partial<McqItem> = {}): McqItem => ({ id, prompt, options, answer, explanation, ...extra });
const t = (id: string, kind: string, from: string, to: string[], explanation: string): TransformItem => ({ id, kind, from, to, explanation });
const d = (id: string, context: string, them: [string, string], options: DialogueItem["options"]): DialogueItem => ({
  id, context, lines: [{ who: "them", fr: them[0], en: them[1] }], options,
});
const ok = (de: string, en: string, why: string) => ({ fr: de, en, correct: true, why });
const no = (de: string, en: string, why: string) => ({ fr: de, en, correct: false, why });
const dr = (id: string, verb: string, subject: string, answer: string[], en: string, form: string, explanation: string, extra: Partial<DrillItem> = {}): DrillItem =>
  ({ id, verb, subject, answer, en, form, explanation, ...extra });
const w = (text: string, why: string) => ({ text, why });

export const DE_BANK: Record<string, SkillBank> = {
  "de-w1-pronouns": {
    mcq: [
      m("p1", "___ wohnen in Berlin. (we)", ["Wir", "Ihr", "Sie"], 0, "wir = we, and the -en ending matches it.", { en: "We live in Berlin.", typeable: true }),
      m("p2", "Anna und Lisa? ___ sind im Büro.", ["Sie", "Ihr", "Wir"], 0, "A group you talk about is sie (they). It's capitalised here only because it starts the sentence.", { en: "They are at the office." }),
      m("p3", "To your landlord: « Sind ___ Herr Schmidt? »", ["du", "Sie", "ihr"], 1, "Use Sie with people you don't know personally, like a landlord.", { en: "Are you Mr Schmidt?" }),
      m("p4", "To a close friend: « Bist ___ müde? »", ["Sie", "du", "er"], 1, "Friends get du — and bist is the du form of sein.", { en: "Are you tired?" }),
      m("p5", "Der Zug? ___ ist spät.", ["Er", "Sie", "Es"], 0, "der Zug is masculine, so it is er.", { en: "It is late." }),
      m("p6", "Die Lampe? ___ ist kaputt.", ["Er", "Sie", "Es"], 1, "die Lampe is feminine, so it is sie.", { en: "It is broken." }),
      m("p7", "Das Auto? ___ ist neu.", ["Er", "Sie", "Es"], 2, "das Auto is neuter, so it is es.", { en: "It is new." }),
      m("p8", "To two friends: « Was macht ___ heute? »", ["ihr", "du", "Sie"], 0, "ihr = you (plural, informal) and takes the -t ending: ihr macht.", { en: "What are you doing today?", typeable: true }),
      m("p9", "___ heiße Tom. (I)", ["Ich", "Er", "Du"], 0, "ich = I. The -e ending belongs to ich.", { en: "My name is Tom.", typeable: true }),
    ],
    sentences: [
      s("p-s1", "Wir sind in Berlin.", "We are in Berlin."),
      s("p-s2", "Du bist mein Freund.", "You (informal) are my friend.", { alts: ["Du bist meine Freundin."] }),
      s("p-s3", "Sie wohnen in Hamburg.", "They live in Hamburg.", { distractors: ["wohnt"] }),
      s("p-s4", "Sind Sie Frau Wagner?", "Are you (formal) Mrs Wagner?", { distractors: ["Bist"] }),
      s("p-s5", "Ihr lernt Deutsch.", "You (plural) are learning German.", { distractors: ["lernen"] }),
      s("p-s6", "Er ist zu Hause.", "He is at home.", { distractors: ["Sie"] }),
    ],
    dialogues: [
      d("p-d1", "You meet your new neighbour, an older lady, on the stairs.", ["Guten Tag! Sind Sie der neue Nachbar?", "Hello! Are you the new neighbour?"], [
        ok("Ja, ich bin Ihr neuer Nachbar. Freut mich!", "Yes, I'm your new neighbour. Nice to meet you!", "ich bin for yourself, and Ihr (your, formal) matches her polite Sie."),
        no("Ja, du bist meine Nachbarin.", "Yes, you are my neighbour.", "That's about her, and du is too familiar here."),
        no("Ja, er ist der Nachbar.", "Yes, he is the neighbour.", "er ist talks about someone else."),
      ]),
    ],
  },

  "de-w1-present": {
    mcq: [
      m("e1", "Wir ___ Deutsch. (lernen)", ["lerne", "lernen", "lernt"], 1, "wir → -en: wir lernen.", { en: "We're learning German.", typeable: true }),
      m("e2", "Du ___ in München. (wohnen)", ["wohnst", "wohnt", "wohne"], 0, "du → -st: du wohnst.", { en: "You live in Munich.", typeable: true }),
      m("e3", "Er ___ heute. (arbeiten)", ["arbeitt", "arbeitet", "arbeiten"], 1, "Stem ending in -t: add -e- before the ending → er arbeitet.", { en: "He's working today.", typeable: true }),
      m("e4", "Ich ___ gern Tennis. (spielen)", ["spiele", "spielst", "spielt"], 0, "ich → -e: ich spiele.", { en: "I like playing tennis.", typeable: true }),
      m("e5", "Ihr ___ aus England. (kommen)", ["kommt", "kommen", "kommst"], 0, "ihr → -t: ihr kommt.", { en: "You (plural) come from England.", typeable: true }),
      m("e6", "Was ___ Sie beruflich? (machen)", ["machst", "macht", "machen"], 2, "Sie (formal you) takes the -en form, like wir and sie.", { en: "What do you do for a living?", typeable: true }),
    ],
    drills: [
      dr("d1", "wohnen", "ich", ["wohne"], "I live", "Präsens", "Regular verb: ich → -e → ich wohne.", { sentence: "Ich wohne in Berlin.", wrong: [w("wohnst", "wohnst is the du form. With ich: wohne."), w("wohnt", "wohnt is er/sie/es or ihr. With ich: wohne.")] }),
      dr("d2", "wohnen", "du", ["wohnst"], "you live", "Präsens · du (informal)", "du → -st → du wohnst.", { sentence: "Du wohnst in Köln.", wrong: [w("wohnt", "wohnt is er/sie/es or ihr. With du: wohnst."), w("wohne", "wohne is the ich form.")] }),
      dr("d3", "lernen", "er", ["lernt"], "he learns", "Präsens", "er/sie/es → -t → er lernt.", { sentence: "Er lernt Deutsch.", wrong: [w("lernst", "lernst is the du form."), w("lernen", "lernen is wir / sie / Sie.")] }),
      dr("d4", "spielen", "wir", ["spielen"], "we play", "Präsens", "wir → -en, the same as the infinitive → wir spielen.", { sentence: "Wir spielen Fußball.", wrong: [w("spielt", "spielt is er/sie/es or ihr.")] }),
      dr("d5", "kommen", "ihr", ["kommt"], "you (plural) come", "Präsens · ihr (you, plural)", "ihr → -t → ihr kommt.", { sentence: "Ihr kommt aus Spanien.", wrong: [w("kommen", "kommen is wir / sie / Sie. With ihr: kommt."), w("kommst", "kommst is the du form.")] }),
      dr("d6", "arbeiten", "du", ["arbeitest"], "you work", "Präsens · du (informal)", "The stem ends in -t, so add -e- before -st → du arbeitest.", { sentence: "Du arbeitest viel.", wrong: [w("arbeitst", "After a stem ending in -t add -e-: arbeitest.")] }),
      dr("d7", "arbeiten", "sie (she)", ["arbeitet"], "she works", "Präsens", "Stem ending in -t: add -e- before -t → sie arbeitet.", { sentence: "Sie arbeitet in einer Bank.", wrong: [w("arbeitt", "After a stem ending in -t add -e-: arbeitet."), w("arbeiten", "arbeiten is they / formal you. For she: arbeitet.")] }),
      dr("d8", "machen", "Sie (formal)", ["machen"], "you (formal) do", "Präsens · Sie (formal)", "Sie takes the -en form → Sie machen.", { sentence: "Was machen Sie heute?", wrong: [w("macht", "macht is er/sie/es or ihr. Formal Sie: machen."), w("machst", "machst is the informal du form.")] }),
      dr("d9", "trinken", "sie (they)", ["trinken"], "they drink", "Präsens", "sie (they) → -en → sie trinken.", { sentence: "Sie trinken Kaffee.", wrong: [w("trinkt", "trinkt is er/sie (she)/es or ihr. For they: trinken.")] }),
      dr("d10", "kaufen", "ich", ["kaufe"], "I buy", "Präsens", "ich → -e → ich kaufe.", { sentence: "Ich kaufe Brot.", wrong: [w("kaufst", "kaufst is the du form.")] }),
    ],
    sentences: [
      s("e-s1", "Ich lerne Deutsch.", "I'm learning German."),
      s("e-s2", "Wir wohnen in Berlin.", "We live in Berlin.", { distractors: ["wohnt"] }),
      s("e-s3", "Arbeitest du heute?", "Are you working today? (informal)", { distractors: ["Arbeitet"] }),
      s("e-s4", "Sie spielt gern Tennis.", "She likes playing tennis.", { distractors: ["spielst"] }),
      s("e-s5", "Ihr kommt aus England.", "You (plural) come from England.", { distractors: ["kommen"] }),
      s("e-s6", "Wo wohnen Sie?", "Where do you (formal) live?", { distractors: ["wohnst"] }),
      s("e-s7", "Er trinkt Kaffee.", "He drinks coffee.", { distractors: ["trinkst"] }),
    ],
  },

  "de-w1-basic-sentences": {
    mcq: [
      m("b1", "In the evening you greet someone with…", ["Guten Abend", "Gute Nacht", "Guten Morgen"], 0, "Guten Abend is the evening greeting. Gute Nacht is only for going to bed."),
      m("b2", "« My name is Sam » →", ["Ich heiße Sam.", "Ich bin heiße Sam.", "Mein heiße Sam."], 0, "heißen = to be called: ich heiße Sam. (Mein Name ist Sam also works.)"),
      m("b3", "Someone says « Danke! ». You reply:", ["Bitte!", "Hallo!", "Tschüss!"], 0, "Bitte (schön) = you're welcome."),
      m("b4", "Which word order is correct?", ["Heute lerne ich Deutsch.", "Heute ich lerne Deutsch.", "Ich heute lerne Deutsch."], 0, "The verb must be in second position: after Heute comes lerne, then ich."),
      m("b5", "« I come from England » →", ["Ich komme aus England.", "Ich komme von England.", "Ich bin aus England komme."], 0, "Origin uses aus: Ich komme aus England."),
      m("b6", "Informal goodbye to a friend:", ["Tschüss!", "Auf Wiedersehen, Frau Lang!", "Guten Tag!"], 0, "Tschüss is the friendly goodbye; Auf Wiedersehen is more formal."),
    ],
    sentences: [
      s("b-s1", "Ich heiße Sam.", "My name is Sam.", { alts: ["Mein Name ist Sam."], distractors: ["bin"] }),
      s("b-s2", "Ich komme aus England.", "I come from England.", { distractors: ["von"] }),
      s("b-s3", "Ich wohne in München.", "I live in Munich.", { distractors: ["nach"] }),
      s("b-s4", "Heute lerne ich Deutsch.", "Today I'm learning German.", { alts: ["Ich lerne heute Deutsch."], distractors: ["lernst"] }),
      s("b-s5", "Guten Morgen, wie geht es Ihnen?", "Good morning, how are you? (formal)", { alts: ["Guten Morgen, wie geht's Ihnen?"] }),
      s("b-s6", "Ich spreche Englisch und ein bisschen Deutsch.", "I speak English and a little German."),
    ],
    dialogues: [
      d("b-d1", "Morning, at the bakery counter.", ["Guten Morgen! Was darf es sein?", "Good morning! What can I get you?"], [
        ok("Guten Morgen! Zwei Brötchen, bitte.", "Good morning! Two bread rolls, please.", "Greeting back plus « bitte » — polite and natural."),
        no("Hallo! Gib mir zwei Brötchen.", "Hi! Give me two rolls.", "« Gib mir » is the du imperative and sounds abrupt with staff."),
        no("Guten Abend! Ich heiße Brötchen.", "Good evening! My name is bread roll.", "It's morning, and you aren't a bread roll."),
      ]),
    ],
  },

  "de-w2-sein": {
    mcq: [
      m("si1", "Ich ___ müde.", ["bin", "bist", "ist"], 0, "ich → bin.", { en: "I'm tired.", typeable: true }),
      m("si2", "Wir ___ zu Hause.", ["sind", "seid", "ist"], 0, "wir → sind.", { en: "We're at home.", typeable: true }),
      m("si3", "Ihr ___ sehr nett.", ["seid", "sind", "seit"], 0, "ihr → seid (not seit, which means 'since').", { en: "You (plural) are very nice.", typeable: true }),
      m("si4", "Du ___ Lehrerin?", ["bist", "bin", "ist"], 0, "du → bist.", { en: "You're a teacher?", typeable: true }),
      m("si5", "Sie ist ___.", ["eine Ärztin", "Ärztin", "die Ärztin"], 1, "No article for jobs after sein: Sie ist Ärztin.", { en: "She is a doctor." }),
      m("si6", "Das ___ mein Bruder.", ["ist", "sind", "bist"], 0, "das ist = this is / that is.", { en: "That's my brother.", typeable: true }),
    ],
    drills: [
      dr("d1", "sein", "ich", ["bin"], "I am", "Präsens", "sein is irregular: ich bin.", { sentence: "Ich bin müde.", wrong: [w("ist", "ist is er/sie/es."), w("bist", "bist is du.")] }),
      dr("d2", "sein", "du", ["bist"], "you are", "Präsens · du (informal)", "du bist.", { sentence: "Du bist sehr nett.", wrong: [w("bin", "bin is ich."), w("ist", "ist is er/sie/es.")] }),
      dr("d3", "sein", "er", ["ist"], "he is", "Präsens", "er / sie / es ist.", { sentence: "Er ist Arzt.", wrong: [w("sind", "sind is wir / sie / Sie.")] }),
      dr("d4", "sein", "wir", ["sind"], "we are", "Präsens", "wir sind.", { sentence: "Wir sind in Berlin.", wrong: [w("seid", "seid is ihr.")] }),
      dr("d5", "sein", "ihr", ["seid"], "you (plural) are", "Präsens · ihr (you, plural)", "ihr seid.", { sentence: "Ihr seid spät.", wrong: [w("sind", "sind is wir / sie / Sie. With ihr: seid."), w("seit", "seit (since) sounds the same but isn't a verb.")] }),
      dr("d6", "sein", "Sie (formal)", ["sind"], "you (formal) are", "Präsens · Sie (formal)", "Sie sind.", { sentence: "Sind Sie Herr Klein?", wrong: [w("bist", "bist is the informal du form.")] }),
    ],
    sentences: [
      s("si-s1", "Ich bin in Berlin für die Arbeit.", "I'm in Berlin for work."),
      s("si-s2", "Sie ist Ärztin.", "She is a doctor.", { distractors: ["eine"] }),
      s("si-s3", "Wir sind spät dran.", "We're running late.", { alts: ["Wir sind zu spät."] }),
      s("si-s4", "Sind Sie Herr Becker?", "Are you (formal) Mr Becker?", { distractors: ["Bist"] }),
      s("si-s5", "Das Restaurant ist am Montag geschlossen.", "The restaurant is closed on Mondays."),
    ],
    dialogues: [
      d("si-d1", "At the doctor's reception desk.", ["Guten Tag, sind Sie Frau Smith?", "Hello, are you Mrs Smith?"], [
        ok("Ja, das bin ich. Ich bin ein bisschen früh.", "Yes, that's me. I'm a little early.", "« Das bin ich » = that's me — perfect."),
        no("Ja, ich ist Frau Smith.", "Yes, I is Mrs Smith.", "ich goes with bin, not ist."),
        no("Ja, Sie sind Frau Smith.", "Yes, you are Mrs Smith.", "That repeats 'you are' — about yourself, say ich bin or das bin ich."),
      ]),
    ],
  },

  "de-w2-haben": {
    mcq: [
      m("h1", "Ich ___ einen Termin.", ["habe", "hast", "hat"], 0, "ich → habe.", { en: "I have an appointment.", typeable: true }),
      m("h2", "Du ___ einen Hund?", ["hast", "habst", "hat"], 0, "du → hast (the b disappears).", { en: "Do you have a dog?", typeable: true }),
      m("h3", "Sie ___ zwei Kinder. (she)", ["hat", "habt", "haben"], 0, "sie (she) → hat.", { en: "She has two children.", typeable: true }),
      m("h4", "Ihr ___ viel Zeit.", ["habt", "hat", "haben"], 0, "ihr → habt.", { en: "You (plural) have lots of time.", typeable: true }),
      m("h5", "___ hier ein Café?", ["Gibt es", "Hat es", "Ist es"], 0, "es gibt = there is / there are.", { en: "Is there a café here?" }),
      m("h6", "« I'm thirty » →", ["Ich bin dreißig.", "Ich habe dreißig.", "Ich habe dreißig Jahre."], 0, "German uses sein for age: Ich bin dreißig (Jahre alt)."),
    ],
    drills: [
      dr("d1", "haben", "ich", ["habe", "hab"], "I have", "Präsens", "ich habe (hab' in casual speech).", { sentence: "Ich habe Zeit.", wrong: [w("hat", "hat is er/sie/es."), w("hast", "hast is du.")] }),
      dr("d2", "haben", "du", ["hast"], "you have", "Präsens · du (informal)", "du hast — the b disappears.", { sentence: "Du hast recht.", wrong: [w("habst", "The b disappears: du hast."), w("hat", "hat is er/sie/es.")] }),
      dr("d3", "haben", "er", ["hat"], "he has", "Präsens", "er / sie / es hat.", { sentence: "Er hat ein Auto.", wrong: [w("habt", "habt is ihr."), w("hast", "hast is du.")] }),
      dr("d4", "haben", "wir", ["haben"], "we have", "Präsens", "wir haben.", { sentence: "Wir haben Hunger.", wrong: [w("habt", "habt is ihr.")] }),
      dr("d5", "haben", "ihr", ["habt"], "you (plural) have", "Präsens · ihr (you, plural)", "ihr habt.", { sentence: "Habt ihr Kinder?", wrong: [w("haben", "haben is wir / sie / Sie. With ihr: habt."), w("hat", "hat is er/sie/es.")] }),
      dr("d6", "haben", "sie (they)", ["haben"], "they have", "Präsens", "sie (they) haben.", { sentence: "Sie haben ein Haus.", wrong: [w("hat", "hat is she / he / it. For they: haben.")] }),
    ],
    sentences: [
      s("h-s1", "Ich habe einen Termin um zehn Uhr.", "I have an appointment at ten.", { distractors: ["bin"] }),
      s("h-s2", "Es gibt hier eine Bäckerei.", "There's a bakery here.", { alts: ["Hier gibt es eine Bäckerei."] }),
      s("h-s3", "Haben Sie ein Zimmer für heute Nacht?", "Do you (formal) have a room for tonight?"),
      s("h-s4", "Wir haben keine Zeit.", "We don't have any time.", { alts: ["Wir haben keine Zeit mehr."] }),
      s("h-s5", "Sie hat zwei Kinder.", "She has two children.", { distractors: ["ist"] }),
    ],
    dialogues: [
      d("h-d1", "Checking into a small hotel.", ["Guten Abend, haben Sie eine Reservierung?", "Good evening, do you have a booking?"], [
        ok("Ja, ich habe eine Reservierung auf den Namen Smith.", "Yes, I have a booking under the name Smith.", "haben for possession: ich habe eine Reservierung."),
        no("Ja, ich bin eine Reservierung.", "Yes, I am a booking.", "sein is for identity — you have a booking: ich habe."),
        no("Ja, es gibt Smith.", "Yes, there is Smith.", "Es gibt means 'there is' — not what you want here."),
      ]),
    ],
  },

  "de-w2-expressions": {
    mcq: [
      m("x1", "« I'm hungry » →", ["Ich habe Hunger.", "Ich bin Hunger.", "Ich mache Hunger."], 0, "German has hunger: Hunger haben. (Ich bin hungrig also exists.)"),
      m("x2", "« It's raining » →", ["Es regnet.", "Es ist Regen.", "Es macht Regen."], 0, "Weather verbs: es regnet, es schneit."),
      m("x3", "Wie geht's? — ___, danke!", ["Gut", "Bitte", "Tschüss"], 0, "Gut, danke = fine, thanks.", { typeable: true }),
      m("x4", "To a shopkeeper: « ___ gern ein Brot. »", ["Ich hätte", "Ich habe", "Ich bin"], 0, "Ich hätte gern… = I'd like… — the polite way to order."),
      m("x5", "« Do you have time? » (to a friend)", ["Hast du Zeit?", "Bist du Zeit?", "Machst du Zeit?"], 0, "Zeit haben = to have time."),
      m("x6", "Someone thanks you. You say:", ["Gern geschehen!", "Gute Besserung!", "Guten Appetit!"], 0, "Gern geschehen = you're welcome. Gute Besserung = get well soon."),
    ],
    sentences: [
      s("x-s1", "Ich habe Durst.", "I'm thirsty.", { distractors: ["bin"] }),
      s("x-s2", "Es ist heute sehr kalt.", "It's very cold today.", { alts: ["Heute ist es sehr kalt."] }),
      s("x-s3", "Ich hätte gern einen Kaffee, bitte.", "I'd like a coffee, please.", { alts: ["Ich möchte einen Kaffee, bitte."] }),
      s("x-s4", "Wie geht es dir?", "How are you? (informal)", { alts: ["Wie geht's dir?", "Wie geht's?"] }),
      s("x-s5", "Ich habe keine Lust.", "I don't feel like it."),
      s("x-s6", "Kein Problem!", "No problem!"),
    ],
    dialogues: [
      d("x-d1", "A colleague greets you on Monday morning.", ["Morgen! Wie geht's?", "Morning! How are you?"], [
        ok("Gut, danke! Und dir?", "Fine, thanks! And you?", "Natural reply, with « und dir? » for a colleague you say du to."),
        no("Ich habe gut, danke.", "I have good, thanks.", "Wie geht's? is answered with Gut / Es geht — not haben."),
        no("Gute Nacht!", "Good night!", "Gute Nacht is for going to bed."),
      ]),
    ],
  },

  "de-w3-articles": {
    mcq: [
      m("a1", "___ Bahnhof ist dort drüben.", ["Der", "Die", "Das"], 0, "Bahnhof is masculine: der Bahnhof.", { en: "The station is over there.", typeable: true }),
      m("a2", "___ Wohnung ist hell.", ["Der", "Die", "Das"], 1, "-ung nouns are feminine: die Wohnung.", { en: "The flat is bright.", typeable: true }),
      m("a3", "___ Mädchen spielt im Park.", ["Der", "Die", "Das"], 2, "-chen nouns are neuter: das Mädchen.", { en: "The girl is playing in the park.", typeable: true }),
      m("a4", "Das ist ___ Tisch.", ["ein", "eine", "einen"], 0, "Tisch is masculine; nominative ein.", { en: "That's a table.", typeable: true }),
      m("a5", "Das ist ___ Lampe.", ["ein", "eine", "einer"], 1, "Lampe is feminine: eine Lampe.", { en: "That's a lamp.", typeable: true }),
      m("a6", "Die Schlüssel? ___ sind auf dem Tisch.", ["Sie", "Er", "Es"], 0, "Plural nouns are sie (they).", { en: "The keys? They're on the table." }),
      m("a7", "Which article for « Montag »?", ["der", "die", "das"], 0, "Days, months and seasons are masculine: der Montag."),
    ],
    sentences: [
      s("a-s1", "Der Kaffee ist heiß.", "The coffee is hot.", { distractors: ["Das"] }),
      s("a-s2", "Die Straße ist sehr lang.", "The street is very long.", { distractors: ["Der"] }),
      s("a-s3", "Das Haus ist alt.", "The house is old.", { distractors: ["Die"] }),
      s("a-s4", "Das ist eine Bäckerei.", "That's a bakery.", { distractors: ["ein"] }),
      s("a-s5", "Wo ist der Bahnhof?", "Where is the station?", { distractors: ["das"] }),
      s("a-s6", "Die Zeitung liegt auf dem Tisch.", "The newspaper is on the table."),
    ],
  },

  "de-w3-plurals": {
    mcq: [
      m("pl1", "der Tag → die ___", ["Tage", "Tagen", "Tags"], 0, "Many masculine nouns add -e: die Tage.", { typeable: true }),
      m("pl2", "das Buch → die ___", ["Buchs", "Bücher", "Buche"], 1, "-er plural with umlaut: die Bücher.", { typeable: true }),
      m("pl3", "die Frau → die ___", ["Fraue", "Frauen", "Fraus"], 1, "Most feminine nouns add -(e)n: die Frauen.", { typeable: true }),
      m("pl4", "das Auto → die ___", ["Autos", "Auten", "Autoe"], 0, "Words ending in a vowel like -o often add -s: die Autos.", { typeable: true }),
      m("pl5", "der Lehrer → die ___", ["Lehrer", "Lehrern", "Lehrers"], 0, "Nouns in -er usually don't change: die Lehrer.", { typeable: true }),
      m("pl6", "das Kind → die ___", ["Kinde", "Kinder", "Kinds"], 1, "das Kind → die Kinder.", { typeable: true }),
    ],
    transforms: [
      t("tr1", "plural", "Der Stuhl ist neu.", ["Die Stühle sind neu."], "Stuhl → Stühle (umlaut + -e), and ist → sind."),
      t("tr2", "plural", "Das Kind spielt.", ["Die Kinder spielen."], "Kind → Kinder, and the verb becomes plural: spielen."),
      t("tr3", "plural", "Die Wohnung ist teuer.", ["Die Wohnungen sind teuer."], "-ung → -ungen; ist → sind."),
      t("tr4", "plural", "Das Buch ist interessant.", ["Die Bücher sind interessant."], "Buch → Bücher; das → die; ist → sind."),
      t("tr5", "plural", "Der Apfel ist rot.", ["Die Äpfel sind rot."], "Apfel → Äpfel (umlaut only)."),
    ],
    sentences: [
      s("pl-s1", "Die Kinder spielen im Garten.", "The children are playing in the garden.", { distractors: ["spielt"] }),
      s("pl-s2", "Ich habe zwei Brüder.", "I have two brothers.", { distractors: ["Bruder"] }),
      s("pl-s3", "Die Zimmer sind groß.", "The rooms are big.", { distractors: ["ist"] }),
      s("pl-s4", "Wir brauchen drei Stühle.", "We need three chairs."),
      s("pl-s5", "Die Äpfel kosten zwei Euro.", "The apples cost two euros."),
    ],
  },

  "de-w3-accusative": {
    mcq: [
      m("ak1", "Ich brauche ___ Schlüssel. (a)", ["ein", "einen", "eine"], 1, "Schlüssel is masculine; as the object it becomes einen.", { en: "I need a key.", typeable: true }),
      m("ak2", "Wir kaufen ___ Tisch. (the)", ["der", "den", "dem"], 1, "Masculine object: der → den.", { en: "We're buying the table.", typeable: true }),
      m("ak3", "Sie hat ___ Katze. (a)", ["eine", "einen", "ein"], 0, "Feminine doesn't change in the accusative: eine Katze.", { en: "She has a cat.", typeable: true }),
      m("ak4", "Ich sehe ___ Auto. (the)", ["das", "den", "der"], 0, "Neuter doesn't change in the accusative: das Auto.", { en: "I see the car.", typeable: true }),
      m("ak5", "Kennst du ___? (him)", ["er", "ihn", "ihm"], 1, "er → ihn in the accusative.", { en: "Do you know him?", typeable: true }),
      m("ak6", "Es gibt ___ Supermarkt hier.", ["ein", "einen", "einem"], 1, "es gibt takes the accusative: einen Supermarkt.", { en: "There's a supermarket here.", typeable: true }),
    ],
    sentences: [
      s("ak-s1", "Ich brauche einen Termin.", "I need an appointment.", { distractors: ["ein"] }),
      s("ak-s2", "Wir suchen den Bahnhof.", "We're looking for the station.", { distractors: ["der"] }),
      s("ak-s3", "Er trinkt einen Tee.", "He's drinking a tea.", { distractors: ["ein"] }),
      s("ak-s4", "Ich möchte eine Wohnung in Berlin.", "I'd like a flat in Berlin."),
      s("ak-s5", "Siehst du den Hund?", "Do you see the dog?", { distractors: ["der"] }),
      s("ak-s6", "Ich liebe dich.", "I love you."),
    ],
  },

  "de-w4-negation": {
    mcq: [
      m("n1", "Ich habe ___ Auto.", ["kein", "nicht", "keine"], 0, "Negating ein Auto → kein Auto (neuter).", { en: "I don't have a car.", typeable: true }),
      m("n2", "Er arbeitet heute ___.", ["kein", "nicht", "keinen"], 1, "Negating a verb → nicht.", { en: "He isn't working today.", typeable: true }),
      m("n3", "Wir haben ___ Zeit.", ["nicht", "keine", "kein"], 1, "Zeit (no article) is feminine → keine Zeit.", { en: "We don't have time.", typeable: true }),
      m("n4", "Das ist ___ teuer.", ["nicht", "kein", "keine"], 0, "Negating an adjective → nicht.", { en: "That isn't expensive.", typeable: true }),
      m("n5", "Ich trinke ___ Kaffee.", ["keinen", "kein", "nicht"], 0, "Kaffee is masculine and the object → keinen Kaffee.", { en: "I don't drink coffee.", typeable: true }),
      m("n6", "Ich finde den Schlüssel ___.", ["nicht", "kein", "keinen"], 0, "den Schlüssel has der/die/das → nicht, at the end.", { en: "I can't find the key.", typeable: true }),
    ],
    transforms: [
      t("tr1", "negation", "Ich habe einen Bruder.", ["Ich habe keinen Bruder."], "einen → keinen (masculine accusative)."),
      t("tr2", "negation", "Er kommt heute.", ["Er kommt heute nicht."], "Negating the action: nicht at the end."),
      t("tr3", "negation", "Das ist teuer.", ["Das ist nicht teuer."], "nicht goes before the adjective."),
      t("tr4", "negation", "Wir haben Zeit.", ["Wir haben keine Zeit."], "A noun with no article → kein (feminine: keine)."),
      t("tr5", "negation", "Ich wohne in Berlin.", ["Ich wohne nicht in Berlin."], "nicht goes before the place."),
      t("tr6", "negation", "Sie ist Lehrerin.", ["Sie ist keine Lehrerin."], "A job without article is negated with kein: keine Lehrerin."),
    ],
    sentences: [
      s("n-s1", "Ich verstehe das nicht.", "I don't understand that.", { distractors: ["kein"] }),
      s("n-s2", "Wir haben keine Kinder.", "We don't have children.", { distractors: ["nicht"] }),
      s("n-s3", "Das ist nicht weit.", "That's not far.", { distractors: ["kein"] }),
      s("n-s4", "Ich trinke keinen Alkohol.", "I don't drink alcohol."),
      s("n-s5", "Er arbeitet am Montag nicht.", "He doesn't work on Mondays.", { alts: ["Am Montag arbeitet er nicht."] }),
      s("n-s6", "Es gibt keine Milch mehr.", "There's no milk left."),
    ],
  },

  "de-w4-questions": {
    mcq: [
      m("q1", "___ wohnst du? — In Köln.", ["Wo", "Wann", "Wer"], 0, "wo = where.", { en: "Where do you live? — In Cologne.", typeable: true }),
      m("q2", "___ kommen Sie? — Aus Irland.", ["Wohin", "Woher", "Wo"], 1, "woher = where from.", { en: "Where are you from? — Ireland.", typeable: true }),
      m("q3", "___ kostet das?", ["Wie viel", "Wer", "Wo"], 0, "Wie viel kostet das? = How much does that cost?", { en: "How much does that cost?" }),
      m("q4", "Which is a correct yes/no question?", ["Sprechen Sie Englisch?", "Sie sprechen Englisch, ja?", "Englisch Sie sprechen?"], 0, "Verb first: Sprechen Sie Englisch? (The second one is a statement with « ja? ».)"),
      m("q5", "___ kommt der Bus? — Um acht.", ["Wann", "Warum", "Was"], 0, "wann = when.", { en: "When is the bus coming? — At eight.", typeable: true }),
      m("q6", "___ machst du am Wochenende?", ["Was", "Wer", "Wie"], 0, "was = what.", { en: "What are you doing at the weekend?", typeable: true }),
      m("q7", "___ ist das? — Meine Schwester.", ["Wer", "Was", "Wo"], 0, "wer = who.", { en: "Who is that? — My sister.", typeable: true }),
    ],
    transforms: [
      t("tr1", "question", "Du wohnst hier.", ["Wohnst du hier?"], "Yes/no question: the verb goes first."),
      t("tr2", "question", "Sie sprechen Deutsch.", ["Sprechen Sie Deutsch?"], "Verb first, then the subject."),
      t("tr3", "question", "Er hat Zeit.", ["Hat er Zeit?"], "Verb first: Hat er Zeit?"),
      t("tr4", "question", "Ihr kommt morgen.", ["Kommt ihr morgen?"], "Verb first: Kommt ihr morgen?"),
      t("tr5", "question", "Das Museum ist heute offen.", ["Ist das Museum heute offen?"], "Verb first, then the subject (das Museum)."),
    ],
    sentences: [
      s("q-s1", "Wo ist der Bahnhof?", "Where is the station?"),
      s("q-s2", "Woher kommst du?", "Where are you from? (informal)", { distractors: ["Wohin"] }),
      s("q-s3", "Wie viel kostet das?", "How much does that cost?", { alts: ["Was kostet das?"] }),
      s("q-s4", "Sprechen Sie Englisch?", "Do you (formal) speak English?"),
      s("q-s5", "Wann beginnt der Film?", "When does the film start?", { alts: ["Wann fängt der Film an?"] }),
      s("q-s6", "Warum lernst du Deutsch?", "Why are you learning German?", { distractors: ["lernt"] }),
    ],
  },

  "de-w4-prepositions": {
    mcq: [
      m("pr1", "Ich fahre morgen ___ Berlin.", ["nach", "in", "zu"], 0, "nach + city: nach Berlin.", { en: "I'm going to Berlin tomorrow.", typeable: true }),
      m("pr2", "Ich komme ___ Kanada.", ["aus", "von", "nach"], 0, "Origin: aus Kanada.", { en: "I come from Canada.", typeable: true }),
      m("pr3", "Ich gehe ___ Arzt.", ["zum", "nach", "in"], 0, "zu + a person: zu dem → zum Arzt.", { en: "I'm going to the doctor's.", typeable: true }),
      m("pr4", "Wir fahren ___ dem Bus.", ["mit", "bei", "von"], 0, "Transport: mit dem Bus, mit dem Zug.", { en: "We're going by bus.", typeable: true }),
      m("pr5", "Ich bin heute ___ Hause.", ["zu", "nach", "in"], 0, "zu Hause = at home; nach Hause = (going) home.", { en: "I'm at home today.", typeable: true }),
      m("pr6", "Das Geschenk ist ___ dich.", ["für", "mit", "zu"], 0, "für = for.", { en: "The present is for you.", typeable: true }),
      m("pr7", "Der Kurs beginnt ___ neun Uhr.", ["um", "am", "im"], 0, "Clock times use um: um neun Uhr.", { en: "The course starts at nine.", typeable: true }),
    ],
    sentences: [
      s("pr-s1", "Ich wohne in Deutschland, in Hamburg.", "I live in Germany, in Hamburg.", { distractors: ["nach"] }),
      s("pr-s2", "Ich gehe jetzt nach Hause.", "I'm going home now.", { alts: ["Jetzt gehe ich nach Hause."], distractors: ["zu"] }),
      s("pr-s3", "Ich fahre mit dem Zug zur Arbeit.", "I take the train to work.", { distractors: ["nach"] }),
      s("pr-s4", "Die Schlüssel sind auf dem Tisch.", "The keys are on the table."),
      s("pr-s5", "Wir treffen uns um acht Uhr.", "We're meeting at eight.", { distractors: ["am"] }),
      s("pr-s6", "Ich arbeite bei einer Bank.", "I work at a bank.", { distractors: ["mit"] }),
    ],
    dialogues: [
      d("pr-d1", "A passer-by sees you looking at a map.", ["Kann ich Ihnen helfen? Wohin möchten Sie?", "Can I help you? Where would you like to go?"], [
        ok("Ja, gern! Ich möchte zum Bahnhof.", "Yes, please! I'd like to go to the station.", "zu + dem → zum Bahnhof: going to a building."),
        no("Ja, ich möchte nach dem Bahnhof.", "Yes, I'd like to after the station.", "nach is for cities and countries. For a building: zum Bahnhof."),
        no("Ich komme aus dem Bahnhof.", "I come from the station.", "That says where you come from, not where you're going."),
      ]),
    ],
  },

  "de-w5-modals": {
    mcq: [
      m("mo1", "Ich ___ heute nicht kommen. (können)", ["kann", "kanne", "können"], 0, "ich kann — no ending for ich with modals.", { en: "I can't come today.", typeable: true }),
      m("mo2", "Du ___ früh aufstehen. (müssen)", ["musst", "muss", "müsst"], 0, "du musst.", { en: "You have to get up early.", typeable: true }),
      m("mo3", "___ ich mit Karte bezahlen?", ["Kann", "Kannst", "Können"], 0, "ich kann → question: Kann ich…?", { en: "Can I pay by card?", typeable: true }),
      m("mo4", "Ich ___ einen Kaffee, bitte.", ["möchte", "möchten", "will"], 0, "Ich möchte is the polite 'I'd like'. (Ich will sounds demanding.)", { en: "I'd like a coffee, please." }),
      m("mo5", "Wir wollen am Samstag ins Kino ___.", ["gehen", "gehe", "geht"], 0, "The second verb stays in the infinitive at the end.", { en: "We want to go to the cinema on Saturday.", typeable: true }),
      m("mo6", "Hier ___ man nicht rauchen. (dürfen)", ["darf", "dürft", "darfst"], 0, "man takes the er/sie/es form: man darf.", { en: "You can't smoke here.", typeable: true }),
    ],
    drills: [
      dr("d1", "können", "ich", ["kann"], "I can", "Präsens", "Modals have no ending for ich: ich kann.", { sentence: "Ich kann gut kochen.", wrong: [w("kanne", "No ending for ich with modals: ich kann."), w("können", "können is wir / sie / Sie.")] }),
      dr("d2", "können", "du", ["kannst"], "you can", "Präsens · du (informal)", "du kannst.", { sentence: "Kannst du mir helfen?", wrong: [w("kann", "kann is ich / er / sie / es.")] }),
      dr("d3", "müssen", "er", ["muss"], "he must", "Präsens", "er muss — the same as ich, no ending.", { sentence: "Er muss arbeiten.", wrong: [w("musst", "musst is du."), w("müsst", "müsst is ihr.")] }),
      dr("d4", "müssen", "wir", ["müssen"], "we must", "Präsens", "wir müssen — plural forms keep the umlaut.", { sentence: "Wir müssen jetzt gehen.", wrong: [w("mussen", "Plural forms keep the umlaut: müssen.")] }),
      dr("d5", "wollen", "ich", ["will"], "I want", "Präsens", "wollen changes in the singular: ich will.", { sentence: "Ich will nach Hause.", wrong: [w("wolle", "Singular forms use will: ich will.")] }),
      dr("d6", "wollen", "ihr", ["wollt"], "you (plural) want", "Präsens · ihr (you, plural)", "ihr wollt.", { sentence: "Wollt ihr mitkommen?", wrong: [w("will", "will is ich / er / sie / es."), w("wollen", "wollen is wir / sie / Sie.")] }),
      dr("d7", "möchten", "Sie (formal)", ["möchten"], "you (formal) would like", "Präsens · Sie (formal)", "Sie möchten.", { sentence: "Was möchten Sie trinken?", wrong: [w("möchtest", "möchtest is the informal du form.")] }),
      dr("d8", "möchten", "du", ["möchtest"], "you would like", "Präsens · du (informal)", "du möchtest.", { sentence: "Möchtest du ein Wasser?", wrong: [w("möchte", "möchte is ich / er / sie / es.")] }),
      dr("d9", "dürfen", "ich", ["darf"], "I may", "Präsens", "dürfen: ich darf (no umlaut in the singular).", { sentence: "Darf ich hier sitzen?", wrong: [w("dürfe", "Singular forms change the vowel: ich darf.")] }),
    ],
    sentences: [
      s("mo-s1", "Kann ich mit Karte bezahlen?", "Can I pay by card?"),
      s("mo-s2", "Ich muss morgen früh arbeiten.", "I have to work early tomorrow.", { alts: ["Morgen muss ich früh arbeiten."], distractors: ["arbeite"] }),
      s("mo-s3", "Wir wollen nach Italien fahren.", "We want to go to Italy.", { distractors: ["fährt"] }),
      s("mo-s4", "Ich möchte ein Zimmer reservieren.", "I'd like to book a room."),
      s("mo-s5", "Hier darf man nicht parken.", "You're not allowed to park here.", { alts: ["Man darf hier nicht parken."] }),
      s("mo-s6", "Kannst du mich morgen anrufen?", "Can you call me tomorrow?"),
    ],
    dialogues: [
      d("mo-d1", "In a café, the waiter comes over.", ["Guten Tag! Was möchten Sie?", "Hello! What would you like?"], [
        ok("Ich möchte einen Cappuccino, bitte.", "I'd like a cappuccino, please.", "Ich möchte + accusative — polite and correct."),
        no("Ich will Cappuccino. Schnell.", "I want cappuccino. Quickly.", "Ich will sounds demanding. Use ich möchte or ich hätte gern."),
        no("Ich möchte trinken einen Cappuccino.", "I'd like drink a cappuccino.", "The infinitive goes to the end: Ich möchte einen Cappuccino trinken."),
      ]),
    ],
  },

  "de-w5-stem-change": {
    mcq: [
      m("sc1", "Du ___ sehr schnell. (fahren)", ["fährst", "fahrst", "fahrt"], 0, "a → ä for du: du fährst.", { en: "You drive very fast.", typeable: true }),
      m("sc2", "Er ___ gern Pizza. (essen)", ["isst", "esst", "ist"], 0, "e → i: er isst (careful: ist = is).", { en: "He likes eating pizza.", typeable: true }),
      m("sc3", "Sie ___ ein Buch. (lesen, she)", ["liest", "lest", "lesen"], 0, "e → ie: sie liest.", { en: "She's reading a book.", typeable: true }),
      m("sc4", "___ du Deutsch? (sprechen)", ["Sprichst", "Sprechst", "Spricht"], 0, "e → i: du sprichst.", { en: "Do you speak German?", typeable: true }),
      m("sc5", "Wir ___ den Bus. (nehmen)", ["nehmen", "nimmt", "nimmst"], 0, "Only du and er/sie/es change. wir nehmen.", { en: "We're taking the bus.", typeable: true }),
      m("sc6", "Das Baby ___ noch. (schlafen)", ["schläft", "schlaft", "schlafen"], 0, "a → ä: es schläft.", { en: "The baby is still sleeping.", typeable: true }),
    ],
    drills: [
      dr("d1", "fahren", "du", ["fährst"], "you drive / go", "Präsens · du (informal)", "a → ä for du and er/sie/es: du fährst.", { sentence: "Du fährst nach Hamburg.", wrong: [w("fahrst", "fahren changes its vowel: du fährst.")] }),
      dr("d2", "fahren", "er", ["fährt"], "he drives / goes", "Präsens", "er fährt.", { sentence: "Er fährt mit dem Zug.", wrong: [w("fahrt", "fahrt is ihr. For er: fährt.")] }),
      dr("d3", "fahren", "wir", ["fahren"], "we drive / go", "Präsens", "No change for wir: wir fahren.", { sentence: "Wir fahren morgen.", wrong: [w("fähren", "Only du and er/sie/es change the vowel. wir fahren.")] }),
      dr("d4", "essen", "du", ["isst"], "you eat", "Präsens · du (informal)", "e → i, and s + st merge: du isst.", { sentence: "Du isst kein Fleisch.", wrong: [w("esst", "esst is ihr. For du: isst."), w("ist", "ist means 'is'. For du (essen): isst.")] }),
      dr("d5", "sprechen", "sie (she)", ["spricht"], "she speaks", "Präsens", "e → i: sie spricht.", { sentence: "Sie spricht drei Sprachen.", wrong: [w("sprecht", "sprecht is ihr. For she: spricht.")] }),
      dr("d6", "lesen", "er", ["liest"], "he reads", "Präsens", "e → ie: er liest.", { sentence: "Er liest die Zeitung.", wrong: [w("lest", "lest is ihr. For er: liest.")] }),
      dr("d7", "nehmen", "du", ["nimmst"], "you take", "Präsens · du (informal)", "nehmen is extra irregular: du nimmst.", { sentence: "Nimmst du den Bus?", wrong: [w("nehmst", "nehmen changes to nimm-: du nimmst."), w("nimst", "Double m: nimmst.")] }),
      dr("d8", "sehen", "er", ["sieht"], "he sees", "Präsens", "e → ie: er sieht.", { sentence: "Er sieht einen Film.", wrong: [w("seht", "seht is ihr. For er: sieht.")] }),
      dr("d9", "schlafen", "du", ["schläfst"], "you sleep", "Präsens · du (informal)", "a → ä: du schläfst.", { sentence: "Du schläfst zu wenig.", wrong: [w("schlafst", "schlafen changes its vowel: du schläfst.")] }),
      dr("d10", "nehmen", "ihr", ["nehmt"], "you (plural) take", "Präsens · ihr (you, plural)", "No change for ihr: ihr nehmt.", { sentence: "Nehmt ihr ein Taxi?", wrong: [w("nimmt", "nimmt is er/sie/es. For ihr: nehmt.")] }),
    ],
    sentences: [
      s("sc-s1", "Fährst du mit dem Auto?", "Are you going by car? (informal)", { distractors: ["Fahrst"] }),
      s("sc-s2", "Er spricht sehr gut Englisch.", "He speaks English very well.", { alts: ["Er spricht Englisch sehr gut."], distractors: ["sprecht"] }),
      s("sc-s3", "Sie liest jeden Abend.", "She reads every evening.", { alts: ["Jeden Abend liest sie."] }),
      s("sc-s4", "Isst du gern Fisch?", "Do you like eating fish?", { distractors: ["Esst"] }),
      s("sc-s5", "Ich nehme den Zug, und du nimmst den Bus.", "I'm taking the train, and you're taking the bus."),
      s("sc-s6", "Das Kind schläft schon.", "The child is already asleep."),
    ],
  },

  "de-w6-separable": {
    mcq: [
      m("sp1", "Ich stehe um sieben Uhr ___. (aufstehen)", ["auf", "an", "ein"], 0, "aufstehen → ich stehe … auf.", { en: "I get up at seven.", typeable: true }),
      m("sp2", "Wir ___ am Samstag ein. (einkaufen)", ["kaufen", "einkaufen", "kauft"], 0, "The verb part is second, the prefix goes to the end: wir kaufen … ein.", { en: "We go shopping on Saturday.", typeable: true }),
      m("sp3", "Which sentence is correct?", ["Ich rufe dich morgen an.", "Ich anrufe dich morgen.", "Ich rufe an dich morgen."], 0, "anrufen splits: rufe … an, with an at the very end."),
      m("sp4", "Ich muss morgen früh ___.", ["aufstehen", "stehe auf", "auf stehen"], 0, "With a modal, the separable verb stays together at the end: aufstehen.", { en: "I have to get up early tomorrow.", typeable: true }),
      m("sp5", "Wann ___ der Film an? (anfangen)", ["fängt", "fangt", "anfängt"], 0, "anfangen: es fängt … an (a → ä for er/sie/es).", { en: "When does the film start?", typeable: true }),
      m("sp6", "Er sieht jeden Abend ___. (fernsehen)", ["fern", "an", "auf"], 0, "fernsehen → er sieht … fern.", { en: "He watches TV every evening.", typeable: true }),
    ],
    drills: [
      dr("d1", "aufstehen", "ich", ["stehe auf"], "I get up", "Präsens · separable", "The prefix goes to the end: ich stehe … auf.", { sentence: "Ich stehe um sieben Uhr auf.", wrong: [w("aufstehe", "Separable verbs split: ich stehe auf."), w("stehst auf", "stehst is the du form.")] }),
      dr("d2", "aufstehen", "du", ["stehst auf"], "you get up", "Präsens · separable · du", "du stehst … auf.", { sentence: "Wann stehst du auf?", wrong: [w("aufstehst", "Separable verbs split: du stehst auf.")] }),
      dr("d3", "einkaufen", "wir", ["kaufen ein"], "we go shopping", "Präsens · separable", "wir kaufen … ein.", { sentence: "Wir kaufen am Samstag ein.", wrong: [w("einkaufen", "In a sentence it splits: wir kaufen ein.")] }),
      dr("d4", "anrufen", "ich", ["rufe an"], "I call", "Präsens · separable", "ich rufe … an.", { sentence: "Ich rufe dich morgen an.", wrong: [w("anrufe", "Separable verbs split: ich rufe an.")] }),
      dr("d5", "fernsehen", "er", ["sieht fern"], "he watches TV", "Präsens · separable", "sehen changes e → ie: er sieht … fern.", { sentence: "Er sieht jeden Abend fern.", wrong: [w("seht fern", "sehen changes for er: sieht fern."), w("fernsieht", "Separable verbs split: er sieht fern.")] }),
      dr("d6", "anfangen", "der Kurs", ["fängt an"], "the course starts", "Präsens · separable", "anfangen: es fängt … an (a → ä).", { sentence: "Der Kurs fängt um neun Uhr an.", wrong: [w("fangt an", "fangen changes for er/sie/es: fängt an."), w("anfängt", "Separable verbs split: fängt an.")] }),
      dr("d7", "mitkommen", "du", ["kommst mit"], "you come along", "Präsens · separable · du", "du kommst … mit.", { sentence: "Kommst du mit?", wrong: [w("mitkommst", "Separable verbs split: kommst mit.")] }),
      dr("d8", "ankommen", "der Zug", ["kommt an"], "the train arrives", "Präsens · separable", "es kommt … an.", { sentence: "Der Zug kommt um acht Uhr an.", wrong: [w("ankommt", "Separable verbs split: kommt an.")] }),
    ],
    sentences: [
      s("sp-s1", "Ich stehe jeden Tag um sechs Uhr auf.", "I get up at six every day.", { alts: ["Jeden Tag stehe ich um sechs Uhr auf."], distractors: ["aufstehe"] }),
      s("sp-s2", "Wann kommt der Zug an?", "When does the train arrive?"),
      s("sp-s3", "Ich rufe dich heute Abend an.", "I'll call you this evening.", { alts: ["Heute Abend rufe ich dich an."] }),
      s("sp-s4", "Wir kaufen im Supermarkt ein.", "We do our shopping at the supermarket."),
      s("sp-s5", "Kommst du mit ins Kino?", "Are you coming to the cinema with us?"),
      s("sp-s6", "Ich muss morgen früh aufstehen.", "I have to get up early tomorrow.", { alts: ["Morgen muss ich früh aufstehen."] }),
    ],
  },

  "de-w6-routine": {
    mcq: [
      m("r1", "8:30 →", ["halb neun", "halb acht", "acht Uhr halb"], 0, "halb neun = half way to nine = 8:30."),
      m("r2", "7:15 →", ["Viertel nach sieben", "Viertel vor sieben", "halb sieben"], 0, "Viertel nach = quarter past."),
      m("r3", "Zuerst dusche ich, ___ frühstücke ich.", ["dann", "denn", "aber"], 0, "dann = then (and the verb stays second after it).", { typeable: true }),
      m("r4", "Wie spät ist es? — Es ist ___ Uhr. (10:00)", ["zehn", "zehnte", "um zehn"], 0, "Es ist zehn Uhr.", { typeable: true }),
      m("r5", "Ich gehe ___ elf Uhr ins Bett.", ["um", "am", "im"], 0, "At a clock time: um.", { typeable: true }),
      m("r6", "Which order is correct?", ["Danach gehe ich zur Arbeit.", "Danach ich gehe zur Arbeit.", "Danach zur Arbeit ich gehe."], 0, "After danach the verb comes second: Danach gehe ich…"),
    ],
    sentences: [
      s("r-s1", "Es ist halb acht.", "It's half past seven."),
      s("r-s2", "Ich frühstücke um sieben Uhr.", "I have breakfast at seven.", { alts: ["Um sieben Uhr frühstücke ich."] }),
      s("r-s3", "Zuerst trinke ich einen Kaffee, dann gehe ich zur Arbeit.", "First I drink a coffee, then I go to work."),
      s("r-s4", "Am Abend koche ich.", "In the evening I cook.", { alts: ["Ich koche am Abend."] }),
      s("r-s5", "Wie spät ist es?", "What time is it?", { alts: ["Wie viel Uhr ist es?"] }),
      s("r-s6", "Ich arbeite von neun bis fünf.", "I work from nine to five.", { alts: ["Ich arbeite von neun bis siebzehn Uhr."] }),
    ],
  },

  "de-w7-future": {
    mcq: [
      m("f1", "Morgen ___ ich nach Wien.", ["fahre", "fahren", "gefahren"], 0, "Present tense + time word for plans: Morgen fahre ich…", { en: "Tomorrow I'm going to Vienna.", typeable: true }),
      m("f2", "Es ___ morgen regnen.", ["wird", "werdet", "werde"], 0, "es wird + infinitive.", { en: "It will rain tomorrow.", typeable: true }),
      m("f3", "Ich ___ dich anrufen.", ["werde", "wirst", "wird"], 0, "ich werde + infinitive at the end.", { en: "I'll call you.", typeable: true }),
      m("f4", "Du ___ das schaffen!", ["wirst", "wird", "werden"], 0, "du wirst.", { en: "You'll manage it!", typeable: true }),
      m("f5", "Which is correct?", ["Ich werde morgen arbeiten.", "Ich werde arbeiten morgen.", "Ich arbeiten werde morgen."], 0, "werde in second place, infinitive at the end."),
    ],
    drills: [
      dr("d1", "werden", "ich", ["werde"], "I will", "Präsens of werden (future helper)", "ich werde.", { sentence: "Ich werde dich anrufen.", wrong: [w("wird", "wird is er/sie/es."), w("wirst", "wirst is du.")] }),
      dr("d2", "werden", "du", ["wirst"], "you will", "Präsens of werden · du", "du wirst.", { sentence: "Du wirst das schaffen.", wrong: [w("wird", "wird is er/sie/es. For du: wirst."), w("werdest", "du wirst — irregular.")] }),
      dr("d3", "werden", "es", ["wird"], "it will", "Präsens of werden", "er / sie / es wird.", { sentence: "Es wird regnen.", wrong: [w("werdet", "werdet is ihr."), w("wirst", "wirst is du.")] }),
      dr("d4", "werden", "wir", ["werden"], "we will", "Präsens of werden", "wir werden.", { sentence: "Wir werden sehen.", wrong: [w("werdet", "werdet is ihr.")] }),
      dr("d5", "werden", "ihr", ["werdet"], "you (plural) will", "Präsens of werden · ihr", "ihr werdet.", { sentence: "Ihr werdet es lieben.", wrong: [w("werden", "werden is wir / sie / Sie. For ihr: werdet.")] }),
      dr("d6", "besuchen", "ich (morgen)", ["besuche"], "I'm visiting (tomorrow)", "Präsens for the future", "Plans use the present tense: Morgen besuche ich…", { sentence: "Morgen besuche ich meine Eltern.", wrong: [w("besuchst", "besuchst is du."), w("werde", "Just the present form: besuche.")] }),
    ],
    sentences: [
      s("f-s1", "Nächste Woche fahren wir nach Wien.", "Next week we're going to Vienna.", { alts: ["Wir fahren nächste Woche nach Wien."] }),
      s("f-s2", "Ich werde dich morgen anrufen.", "I'll call you tomorrow.", { alts: ["Ich rufe dich morgen an.", "Morgen rufe ich dich an."] }),
      s("f-s3", "Es wird heute Abend regnen.", "It's going to rain this evening.", { alts: ["Heute Abend wird es regnen."] }),
      s("f-s4", "Am Samstag besuche ich meine Eltern.", "On Saturday I'm visiting my parents.", { alts: ["Ich besuche am Samstag meine Eltern."] }),
      s("f-s5", "Morgen arbeite ich nicht.", "I'm not working tomorrow.", { alts: ["Ich arbeite morgen nicht."] }),
    ],
  },

  "de-w7-plans": {
    mcq: [
      m("pn1", "« Do you fancy going to the cinema? » →", ["Hast du Lust, ins Kino zu gehen?", "Bist du Lust, ins Kino gehen?", "Machst du Lust Kino?"], 0, "Lust haben, … zu + infinitive."),
      m("pn2", "Accepting an invitation:", ["Ja, gern!", "Leider nicht.", "Keine Ahnung."], 0, "Ja, gern! = Yes, I'd love to!"),
      m("pn3", "Politely declining:", ["Leider kann ich nicht.", "Nein, ich will nicht.", "Das ist langweilig."], 0, "Leider (unfortunately) softens the no."),
      m("pn4", "___ treffen wir uns? — Um acht.", ["Wann", "Wo", "Wer"], 0, "wann = when.", { typeable: true }),
      m("pn5", "Am ___ habe ich frei. (weekend)", ["Wochenende", "Woche", "Wochentag"], 0, "das Wochenende = the weekend: am Wochenende.", { typeable: true }),
      m("pn6", "« Shall we go for a coffee? » →", ["Wollen wir einen Kaffee trinken gehen?", "Wir wollen Kaffee gehen?", "Willst wir Kaffee?"], 0, "Wollen wir…? = Shall we…?"),
    ],
    sentences: [
      s("pn-s1", "Hast du am Wochenende Zeit?", "Are you free at the weekend?", { alts: ["Hast du Zeit am Wochenende?"] }),
      s("pn-s2", "Wollen wir ins Kino gehen?", "Shall we go to the cinema?"),
      s("pn-s3", "Leider kann ich am Freitag nicht.", "Unfortunately I can't on Friday.", { alts: ["Am Freitag kann ich leider nicht."] }),
      s("pn-s4", "Wo treffen wir uns?", "Where shall we meet?"),
      s("pn-s5", "Ja, sehr gern!", "Yes, I'd love to!", { alts: ["Ja, gern!"] }),
    ],
    dialogues: [
      d("pn-d1", "A friend messages you on Thursday.", ["Hast du Lust, am Samstag wandern zu gehen?", "Do you fancy going hiking on Saturday?"], [
        ok("Ja, gern! Wann treffen wir uns?", "Yes, I'd love to! When shall we meet?", "Accepts warmly and moves the plan forward."),
        no("Ja, ich habe Lust wandern.", "Yes, I have desire hiking.", "Not quite: « Ja, ich habe Lust! » or « Ja, gern! »."),
        no("Ich bin am Samstag gewandert.", "I hiked on Saturday.", "That's the past tense — the invitation is for this Saturday."),
      ]),
    ],
  },

  "de-w8-perfekt-haben": {
    mcq: [
      m("ph1", "Ich ___ ein Buch gekauft.", ["habe", "bin", "hat"], 0, "kaufen takes haben: ich habe gekauft.", { en: "I bought a book.", typeable: true }),
      m("ph2", "Wir haben Fußball ___. (spielen)", ["gespielt", "spielt", "gespielen"], 0, "Regular participle: ge + spiel + t.", { en: "We played football.", typeable: true }),
      m("ph3", "Hast du die Rechnung ___? (bezahlen)", ["bezahlt", "gebezahlt", "bezahlen"], 0, "be- verbs have no ge-: bezahlt.", { en: "Did you pay the bill?", typeable: true }),
      m("ph4", "Sie hat lange ___. (arbeiten)", ["gearbeitet", "gearbeitt", "arbeitet"], 0, "Stem ends in -t → extra -e-: gearbeitet.", { en: "She worked for a long time.", typeable: true }),
      m("ph5", "Ich habe gestern ___. (einkaufen)", ["eingekauft", "geeinkauft", "einkaufen"], 0, "Separable: ge goes between prefix and stem: eingekauft.", { en: "I went shopping yesterday.", typeable: true }),
      m("ph6", "Er hat mit seiner Mutter ___. (telefonieren)", ["telefoniert", "getelefoniert", "telefonieren"], 0, "-ieren verbs have no ge-: telefoniert.", { en: "He phoned his mother.", typeable: true }),
    ],
    drills: [
      dr("d1", "kaufen", "ich", ["habe gekauft", "hab gekauft"], "I bought", "Perfekt", "haben + ge-kauf-t → ich habe gekauft.", { sentence: "Ich habe Brot gekauft.", wrong: [w("bin gekauft", "kaufen takes haben, not sein."), w("habe gekaufen", "Regular participle ends in -t: gekauft.")] }),
      dr("d2", "machen", "du", ["hast gemacht"], "you did", "Perfekt · du", "du hast + gemacht.", { sentence: "Was hast du gemacht?", wrong: [w("hat gemacht", "hat is er/sie/es. For du: hast gemacht.")] }),
      dr("d3", "spielen", "wir", ["haben gespielt"], "we played", "Perfekt", "wir haben + gespielt.", { sentence: "Wir haben Tennis gespielt.", wrong: [w("sind gespielt", "spielen takes haben.")] }),
      dr("d4", "arbeiten", "sie (she)", ["hat gearbeitet"], "she worked", "Perfekt", "Stem ending in -t: gearbeitet. sie hat gearbeitet.", { sentence: "Sie hat viel gearbeitet.", wrong: [w("hat gearbeitt", "Add -e- after the t: gearbeitet.")] }),
      dr("d5", "bezahlen", "ich", ["habe bezahlt", "hab bezahlt"], "I paid", "Perfekt", "be- verbs take no ge-: ich habe bezahlt.", { sentence: "Ich habe schon bezahlt.", wrong: [w("habe gebezahlt", "No ge- with be- verbs: bezahlt.")] }),
      dr("d6", "einkaufen", "wir", ["haben eingekauft"], "we went shopping", "Perfekt · separable", "ge goes between the prefix and the stem: eingekauft.", { sentence: "Wir haben am Samstag eingekauft.", wrong: [w("haben geeinkauft", "ge goes inside: eingekauft.")] }),
      dr("d7", "telefonieren", "er", ["hat telefoniert"], "he phoned", "Perfekt", "-ieren verbs take no ge-: er hat telefoniert.", { sentence: "Er hat lange telefoniert.", wrong: [w("hat getelefoniert", "No ge- with -ieren verbs: telefoniert.")] }),
      dr("d8", "besuchen", "ihr", ["habt besucht"], "you (plural) visited", "Perfekt · ihr", "ihr habt + besucht (no ge-).", { sentence: "Habt ihr das Museum besucht?", wrong: [w("habt gebesucht", "No ge- with be- verbs: besucht."), w("haben besucht", "haben is wir / sie / Sie. For ihr: habt.")] }),
    ],
    transforms: [
      t("tr1", "Präsens → Perfekt", "Ich kaufe ein Brot.", ["Ich habe ein Brot gekauft."], "haben in second place, gekauft at the end."),
      t("tr2", "Präsens → Perfekt", "Wir spielen Karten.", ["Wir haben Karten gespielt."], "wir haben … gespielt."),
      t("tr3", "Präsens → Perfekt", "Er arbeitet bis sechs.", ["Er hat bis sechs gearbeitet."], "er hat … gearbeitet (extra -e- after the t)."),
      t("tr4", "Präsens → Perfekt", "Du bezahlst die Rechnung.", ["Du hast die Rechnung bezahlt."], "du hast … bezahlt (no ge- with be-)."),
      t("tr5", "Präsens → Perfekt", "Sie kauft am Samstag ein.", ["Sie hat am Samstag eingekauft."], "Separable: eingekauft at the end."),
    ],
    sentences: [
      s("ph-s1", "Ich habe gestern viel gearbeitet.", "I worked a lot yesterday.", { alts: ["Gestern habe ich viel gearbeitet."] }),
      s("ph-s2", "Wir haben ein neues Sofa gekauft.", "We bought a new sofa.", { distractors: ["sind"] }),
      s("ph-s3", "Hast du schon bezahlt?", "Have you paid already?", { distractors: ["gebezahlt"] }),
      s("ph-s4", "Sie hat ihre Freundin besucht.", "She visited her friend."),
      s("ph-s5", "Was habt ihr am Wochenende gemacht?", "What did you (plural) do at the weekend?"),
    ],
    dialogues: [
      d("ph-d1", "A colleague asks on Monday morning.", ["Und, was hast du am Wochenende gemacht?", "So, what did you do at the weekend?"], [
        ok("Ich habe meine Eltern besucht.", "I visited my parents.", "habe in second place, besucht (no ge-) at the end — perfect."),
        no("Ich bin meine Eltern besucht.", "I am visited my parents.", "besuchen takes haben: Ich habe … besucht."),
        no("Ich besuche meine Eltern am Wochenende.", "I'm visiting my parents at the weekend.", "That's the present/future — they asked about last weekend."),
      ]),
    ],
  },

  "de-w8-perfekt-irregular": {
    mcq: [
      m("pi1", "Ich habe schon ___. (essen)", ["gegessen", "geesst", "gegesst"], 0, "essen → gegessen.", { en: "I've already eaten.", typeable: true }),
      m("pi2", "Hast du den Film ___? (sehen)", ["gesehen", "gesieht", "geseht"], 0, "sehen → gesehen.", { en: "Have you seen the film?", typeable: true }),
      m("pi3", "Wir haben Wein ___. (trinken)", ["getrunken", "getrinkt", "getrankt"], 0, "trinken → getrunken.", { en: "We drank wine.", typeable: true }),
      m("pi4", "Er hat mir eine E-Mail ___. (schreiben)", ["geschrieben", "geschreibt", "geschriben"], 0, "schreiben → geschrieben.", { en: "He wrote me an email.", typeable: true }),
      m("pi5", "Ich habe den Schlüssel ___. (finden)", ["gefunden", "gefindet", "gefinden"], 0, "finden → gefunden.", { en: "I found the key.", typeable: true }),
      m("pi6", "Sie hat das Buch ___. (lesen)", ["gelesen", "geliest", "gelest"], 0, "lesen → gelesen.", { en: "She read the book.", typeable: true }),
      m("pi7", "Hast du an mich ___? (denken)", ["gedacht", "gedenkt", "gedenken"], 0, "Mixed verb: denken → gedacht.", { en: "Did you think of me?", typeable: true }),
    ],
    drills: [
      dr("d1", "essen", "ich", ["habe gegessen", "hab gegessen"], "I ate", "Perfekt", "essen → gegessen: ich habe gegessen.", { sentence: "Ich habe Pizza gegessen.", wrong: [w("habe geesst", "essen is irregular: gegessen.")] }),
      dr("d2", "trinken", "du", ["hast getrunken"], "you drank", "Perfekt · du", "trinken → getrunken.", { sentence: "Hast du genug getrunken?", wrong: [w("hast getrinkt", "trinken is irregular: getrunken.")] }),
      dr("d3", "sehen", "wir", ["haben gesehen"], "we saw", "Perfekt", "sehen → gesehen.", { sentence: "Wir haben einen Film gesehen.", wrong: [w("haben geseht", "sehen is irregular: gesehen.")] }),
      dr("d4", "lesen", "sie (she)", ["hat gelesen"], "she read", "Perfekt", "lesen → gelesen.", { sentence: "Sie hat das Buch gelesen.", wrong: [w("hat geliest", "lesen → gelesen.")] }),
      dr("d5", "schreiben", "er", ["hat geschrieben"], "he wrote", "Perfekt", "schreiben → geschrieben (ei → ie).", { sentence: "Er hat eine Nachricht geschrieben.", wrong: [w("hat geschreibt", "schreiben is irregular: geschrieben.")] }),
      dr("d6", "nehmen", "ich", ["habe genommen", "hab genommen"], "I took", "Perfekt", "nehmen → genommen.", { sentence: "Ich habe den Bus genommen.", wrong: [w("habe genehmt", "nehmen is irregular: genommen.")] }),
      dr("d7", "sprechen", "ihr", ["habt gesprochen"], "you (plural) spoke", "Perfekt · ihr", "sprechen → gesprochen.", { sentence: "Habt ihr mit ihm gesprochen?", wrong: [w("habt gesprecht", "sprechen is irregular: gesprochen.")] }),
      dr("d8", "finden", "du", ["hast gefunden"], "you found", "Perfekt · du", "finden → gefunden.", { sentence: "Hast du deine Brille gefunden?", wrong: [w("hast gefindet", "finden is irregular: gefunden.")] }),
    ],
    sentences: [
      s("pi-s1", "Ich habe heute noch nichts gegessen.", "I haven't eaten anything yet today."),
      s("pi-s2", "Hast du den Film gesehen?", "Have you seen the film?", { distractors: ["geseht"] }),
      s("pi-s3", "Wir haben lange miteinander gesprochen.", "We talked to each other for a long time."),
      s("pi-s4", "Er hat mir einen Brief geschrieben.", "He wrote me a letter."),
      s("pi-s5", "Ich habe gut geschlafen.", "I slept well.", { distractors: ["bin"] }),
    ],
  },

  "de-w9-perfekt-sein": {
    mcq: [
      m("ps1", "Ich ___ nach Berlin gefahren.", ["bin", "habe", "ist"], 0, "fahren (A → B) takes sein: ich bin gefahren.", { en: "I went to Berlin.", typeable: true }),
      m("ps2", "Sie ___ um acht Uhr gekommen. (she)", ["ist", "hat", "sind"], 0, "kommen takes sein: sie ist gekommen.", { en: "She came at eight.", typeable: true }),
      m("ps3", "Wir sind ins Kino ___. (gehen)", ["gegangen", "gegeht", "gegingen"], 0, "gehen → gegangen.", { en: "We went to the cinema.", typeable: true }),
      m("ps4", "Ich bin heute früh ___. (aufstehen)", ["aufgestanden", "aufgesteht", "geaufstanden"], 0, "aufstehen → aufgestanden (ge inside, sein).", { en: "I got up early today.", typeable: true }),
      m("ps5", "Wir ___ zu Hause geblieben.", ["sind", "haben", "seid"], 0, "bleiben takes sein: wir sind geblieben.", { en: "We stayed at home.", typeable: true }),
      m("ps6", "Ich ___ viel gearbeitet.", ["habe", "bin", "hat"], 0, "arbeiten is not movement: habe gearbeitet.", { en: "I worked a lot.", typeable: true }),
    ],
    drills: [
      dr("d1", "fahren", "ich", ["bin gefahren"], "I went / drove", "Perfekt · sein", "Movement: sein + gefahren.", { sentence: "Ich bin nach Hamburg gefahren.", wrong: [w("habe gefahren", "fahren (A → B) takes sein: bin gefahren."), w("bin gefahrt", "fahren → gefahren.")] }),
      dr("d2", "gehen", "du", ["bist gegangen"], "you went", "Perfekt · sein · du", "du bist + gegangen.", { sentence: "Bist du schon nach Hause gegangen?", wrong: [w("hast gegangen", "gehen takes sein."), w("bist gegeht", "gehen → gegangen.")] }),
      dr("d3", "kommen", "er", ["ist gekommen"], "he came", "Perfekt · sein", "er ist + gekommen.", { sentence: "Er ist spät gekommen.", wrong: [w("hat gekommen", "kommen takes sein.")] }),
      dr("d4", "fliegen", "wir", ["sind geflogen"], "we flew", "Perfekt · sein", "wir sind + geflogen.", { sentence: "Wir sind nach Rom geflogen.", wrong: [w("haben geflogen", "fliegen takes sein."), w("sind gefliegt", "fliegen → geflogen.")] }),
      dr("d5", "aufstehen", "sie (she)", ["ist aufgestanden"], "she got up", "Perfekt · sein · separable", "sie ist + aufgestanden.", { sentence: "Sie ist um sechs Uhr aufgestanden.", wrong: [w("hat aufgestanden", "aufstehen takes sein."), w("ist geaufstanden", "ge goes inside: aufgestanden.")] }),
      dr("d6", "bleiben", "ihr", ["seid geblieben"], "you (plural) stayed", "Perfekt · sein · ihr", "ihr seid + geblieben.", { sentence: "Seid ihr lange geblieben?", wrong: [w("habt geblieben", "bleiben takes sein."), w("sind geblieben", "sind is wir / sie / Sie. For ihr: seid.")] }),
      dr("d7", "ankommen", "der Zug", ["ist angekommen"], "the train arrived", "Perfekt · sein · separable", "er ist + angekommen.", { sentence: "Der Zug ist pünktlich angekommen.", wrong: [w("hat angekommen", "ankommen takes sein.")] }),
      dr("d8", "sein", "ich", ["bin gewesen"], "I was / have been", "Perfekt · sein", "sein → gewesen, with sein: ich bin gewesen.", { sentence: "Ich bin noch nie in Wien gewesen.", wrong: [w("habe gewesen", "sein takes sein: ich bin gewesen.")] }),
    ],
    transforms: [
      t("tr1", "Präsens → Perfekt", "Ich fahre nach München.", ["Ich bin nach München gefahren."], "fahren takes sein: bin … gefahren."),
      t("tr2", "Präsens → Perfekt", "Wir gehen ins Kino.", ["Wir sind ins Kino gegangen."], "gehen → sind … gegangen."),
      t("tr3", "Präsens → Perfekt", "Er kommt um acht.", ["Er ist um acht gekommen."], "kommen → ist … gekommen."),
      t("tr4", "Präsens → Perfekt", "Sie steht früh auf.", ["Sie ist früh aufgestanden."], "aufstehen → ist … aufgestanden."),
      t("tr5", "Präsens → Perfekt", "Ihr bleibt zu Hause.", ["Ihr seid zu Hause geblieben."], "bleiben → seid … geblieben."),
    ],
    sentences: [
      s("ps-s1", "Ich bin gestern nach Köln gefahren.", "I went to Cologne yesterday.", { alts: ["Gestern bin ich nach Köln gefahren."], distractors: ["habe"] }),
      s("ps-s2", "Sie ist um sieben Uhr aufgestanden.", "She got up at seven."),
      s("ps-s3", "Wir sind am Wochenende zu Hause geblieben.", "We stayed at home at the weekend.", { alts: ["Am Wochenende sind wir zu Hause geblieben."] }),
      s("ps-s4", "Bist du schon in Berlin gewesen?", "Have you ever been to Berlin?", { alts: ["Warst du schon in Berlin?"] }),
      s("ps-s5", "Der Zug ist zu spät angekommen.", "The train arrived late."),
    ],
  },

  "de-w9-time": {
    mcq: [
      m("tm1", "Ich bin ___ zwei Jahren nach Deutschland gekommen.", ["vor", "seit", "für"], 0, "vor + time = ago (finished).", { en: "I came to Germany two years ago.", typeable: true }),
      m("tm2", "Ich wohne ___ zwei Jahren hier.", ["seit", "vor", "für"], 0, "seit + present = still true: I've lived here for two years.", { en: "I've lived here for two years.", typeable: true }),
      m("tm3", "« Yesterday evening » →", ["gestern Abend", "heute Abend", "morgen Abend"], 0, "gestern = yesterday."),
      m("tm4", "« Last week » →", ["letzte Woche", "nächste Woche", "diese Woche"], 0, "letzte = last; nächste = next."),
      m("tm5", "Ich fahre ___ eine Woche nach Spanien.", ["für", "seit", "vor"], 0, "für = for a planned period.", { en: "I'm going to Spain for a week.", typeable: true }),
      m("tm6", "Wie lange lernst du schon Deutsch? — ___ sechs Monaten.", ["Seit", "Vor", "Für"], 0, "Still learning → seit.", { typeable: true }),
    ],
    sentences: [
      s("tm-s1", "Ich lerne seit sechs Monaten Deutsch.", "I've been learning German for six months.", { alts: ["Seit sechs Monaten lerne ich Deutsch."], distractors: ["vor"] }),
      s("tm-s2", "Ich bin vor drei Tagen angekommen.", "I arrived three days ago.", { alts: ["Vor drei Tagen bin ich angekommen."], distractors: ["seit"] }),
      s("tm-s3", "Letzte Woche war ich krank.", "Last week I was ill.", { alts: ["Ich war letzte Woche krank."] }),
      s("tm-s4", "Gestern Abend habe ich gekocht.", "Yesterday evening I cooked.", { alts: ["Ich habe gestern Abend gekocht."] }),
      s("tm-s5", "Wir wohnen seit einem Jahr in Berlin.", "We've lived in Berlin for a year.", { alts: ["Seit einem Jahr wohnen wir in Berlin."] }),
    ],
  },

  "de-w10-dative": {
    mcq: [
      m("dt1", "Ich fahre mit ___ Bus.", ["dem", "den", "der"], 0, "mit + dative; Bus is masculine → dem Bus.", { en: "I'm going by bus.", typeable: true }),
      m("dt2", "Sie arbeitet bei ___ Bank.", ["der", "die", "dem"], 0, "bei + dative; Bank is feminine → der Bank.", { en: "She works at a bank.", typeable: true }),
      m("dt3", "Kannst du ___ helfen? (me)", ["mir", "mich", "ich"], 0, "helfen takes the dative: mir.", { en: "Can you help me?", typeable: true }),
      m("dt4", "Die Wohnung gefällt ___. (me)", ["mir", "mich", "mein"], 0, "gefallen + dative: Die Wohnung gefällt mir = I like the flat.", { en: "I like the flat.", typeable: true }),
      m("dt5", "Nach ___ Essen gehen wir spazieren.", ["dem", "das", "den"], 0, "nach + dative; das Essen → dem Essen.", { en: "After the meal we go for a walk.", typeable: true }),
      m("dt6", "Das Buch gehört ___. (him)", ["ihm", "ihn", "er"], 0, "gehören + dative: ihm.", { en: "The book belongs to him.", typeable: true }),
    ],
    transforms: [
      t("tr1", "Use a pronoun", "Ich helfe meiner Mutter.", ["Ich helfe ihr."], "meiner Mutter (dative, feminine) → ihr."),
      t("tr2", "Use a pronoun", "Das Auto gehört meinem Bruder.", ["Das Auto gehört ihm."], "meinem Bruder (dative, masculine) → ihm."),
      t("tr3", "Add « mit dem Zug »", "Ich fahre nach Hamburg.", ["Ich fahre mit dem Zug nach Hamburg."], "Manner (wie?) comes before place (wohin?): mit dem Zug nach Hamburg."),
      t("tr4", "Use a pronoun", "Ich danke den Kindern.", ["Ich danke ihnen."], "den Kindern (dative plural) → ihnen."),
    ],
    sentences: [
      s("dt-s1", "Ich fahre mit dem Fahrrad zur Arbeit.", "I cycle to work.", { distractors: ["den"] }),
      s("dt-s2", "Kannst du mir helfen?", "Can you help me?", { distractors: ["mich"] }),
      s("dt-s3", "Die Stadt gefällt mir sehr.", "I really like the city.", { alts: ["Mir gefällt die Stadt sehr."] }),
      s("dt-s4", "Ich wohne bei meiner Schwester.", "I'm staying at my sister's.", { distractors: ["meine"] }),
      s("dt-s5", "Nach der Arbeit gehe ich einkaufen.", "After work I go shopping.", { alts: ["Ich gehe nach der Arbeit einkaufen."] }),
      s("dt-s6", "Das schmeckt mir nicht.", "I don't like the taste of that."),
    ],
  },

  "de-w10-word-order": {
    mcq: [
      m("wo1", "Which is correct?", ["Morgen fahre ich nach Köln.", "Morgen ich fahre nach Köln.", "Morgen nach Köln ich fahre."], 0, "Starting with Morgen: the verb is still second, then the subject."),
      m("wo2", "Which order is natural?", ["Ich fahre morgen mit dem Zug nach Köln.", "Ich fahre nach Köln mit dem Zug morgen.", "Ich fahre mit dem Zug morgen nach Köln."], 0, "Time – manner – place: morgen – mit dem Zug – nach Köln."),
      m("wo3", "Am Wochenende ___ wir keine Zeit.", ["haben", "wir haben", "hat"], 0, "Verb second: Am Wochenende haben wir…", { typeable: true }),
      m("wo4", "Ich habe gestern lange ___.", ["gearbeitet", "arbeite", "arbeiten"], 0, "Perfekt: the participle closes the sentence.", { typeable: true }),
      m("wo5", "Heute Abend ___ ich ins Kino.", ["gehe", "ich gehe", "gehen"], 0, "Verb second after Heute Abend.", { typeable: true }),
    ],
    transforms: [
      t("tr1", "Start with the time", "Ich fahre morgen nach Köln.", ["Morgen fahre ich nach Köln."], "Time first, then the verb, then the subject."),
      t("tr2", "Start with the time", "Wir haben am Montag frei.", ["Am Montag haben wir frei."], "Verb stays second: Am Montag haben wir frei."),
      t("tr3", "Start with the time", "Ich habe gestern gekocht.", ["Gestern habe ich gekocht."], "Gestern – habe – ich – gekocht."),
      t("tr4", "Start with the time", "Er arbeitet heute nicht.", ["Heute arbeitet er nicht."], "Heute – arbeitet – er – nicht."),
    ],
    sentences: [
      s("wo-s1", "Morgen fahre ich mit dem Zug nach Köln.", "Tomorrow I'm taking the train to Cologne.", { alts: ["Ich fahre morgen mit dem Zug nach Köln."] }),
      s("wo-s2", "Am Wochenende haben wir keine Zeit.", "We don't have time at the weekend.", { alts: ["Wir haben am Wochenende keine Zeit."] }),
      s("wo-s3", "Heute Abend gehen wir zusammen ins Kino.", "This evening we're going to the cinema together.", { alts: ["Wir gehen heute Abend zusammen ins Kino."] }),
      s("wo-s4", "Ich habe gestern lange gearbeitet.", "I worked late yesterday.", { alts: ["Gestern habe ich lange gearbeitet."] }),
      s("wo-s5", "Im Sommer fliegen wir nach Spanien.", "In summer we're flying to Spain.", { alts: ["Wir fliegen im Sommer nach Spanien."] }),
    ],
  },

  "de-w10-connectors": {
    mcq: [
      m("c1", "Ich bleibe zu Hause, ___ ich krank bin.", ["weil", "denn", "aber"], 0, "The verb is at the end (bin), so it must be weil.", { en: "I'm staying at home because I'm ill.", typeable: true }),
      m("c2", "Ich bleibe zu Hause, ___ ich bin krank.", ["denn", "weil", "dass"], 0, "Normal word order after the comma → denn.", { en: "I'm staying at home, because I'm ill.", typeable: true }),
      m("c3", "Ich glaube, dass er heute ___.", ["kommt", "kommt er", "er kommt"], 0, "After dass the verb goes to the end: dass er heute kommt."),
      m("c4", "___ du willst, können wir zusammen essen.", ["Wenn", "Weil", "Denn"], 0, "wenn = if.", { en: "If you want, we can eat together.", typeable: true }),
      m("c5", "Ich mag Kaffee, ___ ich trinke lieber Tee.", ["aber", "weil", "dass"], 0, "aber = but, normal word order.", { typeable: true }),
      m("c6", "Which is correct?", ["Ich komme nicht, weil ich arbeiten muss.", "Ich komme nicht, weil ich muss arbeiten.", "Ich komme nicht, weil muss ich arbeiten."], 0, "After weil the conjugated verb (muss) is last."),
    ],
    sentences: [
      s("c-s1", "Ich komme nicht, weil ich arbeiten muss.", "I'm not coming because I have to work.", { distractors: ["denn"] }),
      s("c-s2", "Ich glaube, dass er recht hat.", "I think that he's right.", { alts: ["Ich glaube, er hat recht."] }),
      s("c-s3", "Wenn es regnet, bleiben wir zu Hause.", "If it rains, we'll stay at home.", { alts: ["Wir bleiben zu Hause, wenn es regnet."] }),
      s("c-s4", "Ich bin müde, aber ich muss noch kochen.", "I'm tired, but I still have to cook."),
      s("c-s5", "Er lernt Deutsch, denn er wohnt in Berlin.", "He's learning German because he lives in Berlin.", { alts: ["Er lernt Deutsch, weil er in Berlin wohnt."] }),
    ],
  },

  "de-w11-listening": {
    mcq: [
      m("l1", "What time does the train leave?", ["8:45", "9:45", "8:15"], 0, "« Viertel vor neun » = 8:45.", { audio: "Der Zug fährt um Viertel vor neun." }),
      m("l2", "How much does it cost?", ["€24.50", "€42.50", "€24.15"], 0, "« vierundzwanzig Euro fünfzig »: units first — vier-und-zwanzig = 24.", { audio: "Das macht vierundzwanzig Euro fünfzig, bitte." }),
      m("l3", "Where does the speaker work?", ["At a hospital", "At a school", "At a bank"], 0, "« im Krankenhaus » = at the hospital.", { audio: "Ich arbeite seit drei Jahren im Krankenhaus." }),
      m("l4", "What is the problem?", ["The heating doesn't work", "The window is broken", "There is no water"], 0, "« Die Heizung funktioniert nicht » = the heating doesn't work.", { audio: "Die Heizung funktioniert seit gestern nicht." }),
      m("l5", "When is the appointment?", ["Thursday at 10:30", "Tuesday at 10:30", "Thursday at 9:30"], 0, "« Donnerstag um halb elf » = Thursday at 10:30 (half way to eleven).", { audio: "Ihr Termin ist am Donnerstag um halb elf." }),
      m("l6", "Where are they meeting?", ["In front of the cinema", "At the station", "At home"], 0, "« vor dem Kino » = in front of the cinema.", { audio: "Wir treffen uns um acht vor dem Kino." }),
    ],
    sentences: [
      s("l-s1", "Können Sie das bitte wiederholen?", "Could you repeat that, please?"),
      s("l-s2", "Der nächste Bus kommt in zehn Minuten.", "The next bus comes in ten minutes."),
      s("l-s3", "Die Apotheke ist gleich um die Ecke.", "The pharmacy is just around the corner."),
      s("l-s4", "Ich habe am Montag einen Termin beim Zahnarzt.", "I have a dentist's appointment on Monday.", { alts: ["Am Montag habe ich einen Termin beim Zahnarzt."] }),
      s("l-s5", "Wir sind gestern sehr spät nach Hause gekommen.", "We got home very late yesterday."),
    ],
    dialogues: [
      d("l-d1", "On the phone with a friend.", ["Ich bin ein bisschen spät dran. Ich komme in zwanzig Minuten.", "I'm running a bit late. I'll be there in twenty minutes."], [
        ok("Kein Problem, ich warte im Café.", "No problem, I'll wait in the café.", "You understood: they're late — a relaxed reply."),
        no("Super, du bist schon da!", "Great, you're already here!", "They said they're late (spät dran) and coming in twenty minutes."),
        no("Um zwanzig Uhr? Okay.", "At 8 pm? OK.", "« in zwanzig Minuten » = in twenty minutes, not at 20:00."),
      ]),
    ],
  },

  "de-w11-situations": {
    mcq: [
      m("st1", "You didn't understand. You say:", ["Entschuldigung, können Sie das wiederholen?", "Was ist los mit Ihnen?", "Ich verstehe alles."], 0, "Polite request to repeat."),
      m("st2", "Ordering politely in a restaurant:", ["Ich hätte gern die Suppe, bitte.", "Gib mir die Suppe.", "Suppe!"], 0, "Ich hätte gern… is the polite formula."),
      m("st3", "Asking for the bill:", ["Die Rechnung, bitte.", "Das Geld, bitte.", "Die Karte, danke."], 0, "Die Rechnung, bitte (or: Ich möchte bitte zahlen)."),
      m("st4", "Starting a call to your landlord:", ["Guten Tag, Herr Meier, hier ist Sam Taylor.", "Hallo Meier!", "Hey, was geht?"], 0, "Guten Tag + Herr/Frau + name, then introduce yourself."),
      m("st5", "« What does that mean? » →", ["Was bedeutet das?", "Was meint das?", "Wie heißt das?"], 0, "Was bedeutet das? = What does that mean?"),
    ],
    sentences: [
      s("st-s1", "Ich hätte gern einen Termin, bitte.", "I'd like an appointment, please.", { alts: ["Ich möchte gern einen Termin, bitte.", "Ich möchte einen Termin, bitte."] }),
      s("st-s2", "Können Sie bitte langsamer sprechen?", "Could you speak more slowly, please?", { alts: ["Können Sie bitte etwas langsamer sprechen?"] }),
      s("st-s3", "Ist es möglich, morgen zu kommen?", "Is it possible to come tomorrow?"),
      s("st-s4", "Vielen Dank für Ihre Hilfe.", "Thank you very much for your help."),
      s("st-s5", "Die Heizung funktioniert nicht.", "The heating isn't working.", { alts: ["Die Heizung geht nicht."] }),
    ],
    dialogues: [
      d("st-d1", "At the pharmacy.", ["Guten Tag, was kann ich für Sie tun?", "Hello, what can I do for you?"], [
        ok("Guten Tag, ich habe Kopfschmerzen. Haben Sie etwas dagegen?", "Hello, I have a headache. Do you have something for it?", "Clear, polite and uses Sie."),
        no("Hallo, gib mir Tabletten.", "Hi, give me pills.", "Too abrupt and uses du with a stranger."),
        no("Guten Tag, ich bin Kopfschmerzen.", "Hello, I am headache.", "Use haben: Ich habe Kopfschmerzen."),
      ]),
      d("st-d2", "The landlord calls about the broken heating.", ["Ich kann morgen um zehn einen Techniker schicken. Passt das?", "I can send a technician tomorrow at ten. Does that work?"], [
        ok("Ja, das passt gut. Vielen Dank!", "Yes, that works well. Thank you very much!", "Accepts politely."),
        no("Nein, ich habe keine Heizung.", "No, I don't have heating.", "That doesn't answer the question about the time."),
        no("Ja, ich bin morgen um zehn geschickt.", "Yes, I am sent tomorrow at ten.", "geschickt (sent) is about the technician, not you."),
      ]),
      d("st-d3", "A recruiter calls you.", ["Haben Sie nächste Woche Zeit für ein Vorstellungsgespräch?", "Do you have time for an interview next week?"], [
        ok("Ja, gern. Am Dienstag oder Mittwoch passt es mir gut.", "Yes, gladly. Tuesday or Wednesday suits me well.", "Gives availability politely."),
        no("Ja, ich hatte letzte Woche Zeit.", "Yes, I had time last week.", "They asked about next week."),
        no("Kein Zeit.", "No time.", "Too abrupt, and Zeit is feminine: keine Zeit."),
      ]),
    ],
  },
};

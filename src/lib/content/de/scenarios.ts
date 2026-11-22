import type { Scenario, ScriptNode, ScriptReply } from "../scenarios";

/*
 * German conversation scenarios (ids start with "de-"). `fr` fields hold the German text;
 * register "vous" = Sie (formal), "tu" = du (informal).
 */

const n = (id: string, de: string, en: string, replies: ScriptReply[]): ScriptNode => ({ id, them: { fr: de, en }, replies });
const r = (de: string, en: string, next: string | null, extra: Partial<ScriptReply> = {}): ScriptReply => ({ fr: de, en, next, ok: true, ...extra });

export const DE_SCENARIOS: Scenario[] = [
  {
    id: "de-cafe", title: "Ordering at a café", subtitle: "Order a drink and something to eat, then pay.", icon: "coffee",
    partner: "a friendly waiter at a café in Berlin", register: "vous", goal: "Order a drink and a snack, ask the price, and pay.", minWeek: 1,
    skills: ["de-w1-basic-sentences", "de-w5-modals", "de-w11-situations"],
    vocabulary: [{ fr: "ein Milchkaffee", en: "a milky coffee" }, { fr: "ein Stück Kuchen", en: "a piece of cake" }, { fr: "die Rechnung", en: "the bill" }, { fr: "mit Karte", en: "by card" }, { fr: "zum Mitnehmen / hier", en: "to take away / to eat in" }],
    start: "c1",
    nodes: {
      c1: n("c1", "Guten Tag! Was darf ich Ihnen bringen?", "Hello! What can I bring you?", [
        r("Guten Tag! Einen Milchkaffee, bitte.", "Hello! A milky coffee, please.", "c2", { keywords: ["milchkaffee", "kaffee"] }),
        r("Ich hätte gern einen Tee, bitte.", "I'd like a tea, please.", "c2", { keywords: ["tee", "hatte"] }),
        r("Gib mir einen Kaffee.", "Give me a coffee.", "c2", { ok: false, why: "« Gib mir » is the du form and sounds abrupt with a waiter. Say « Einen Kaffee, bitte » or « Ich hätte gern einen Kaffee ».", keywords: ["gib"] }),
      ]),
      c2: n("c2", "Sehr gern. Möchten Sie auch etwas essen? Ein Stück Kuchen vielleicht?", "Certainly. Would you like something to eat too? A piece of cake, perhaps?", [
        r("Ja, ein Stück Apfelkuchen, bitte.", "Yes, a piece of apple cake, please.", "c3", { keywords: ["kuchen", "apfelkuchen", "ja"] }),
        r("Nein, danke. Das ist alles.", "No, thanks. That's all.", "c3", { keywords: ["nein", "alles"] }),
        r("Ja, ich bin ein Kuchen.", "Yes, I am a cake.", "c3", { ok: false, why: "« Ich bin » means 'I am'. To accept, just say « Ja, ein Stück Kuchen, bitte »." }),
      ]),
      c3: n("c3", "Zum Hieressen oder zum Mitnehmen?", "To eat in or to take away?", [
        r("Zum Hieressen, bitte.", "To eat in, please.", "c4", { keywords: ["hieressen", "hier"] }),
        r("Zum Mitnehmen, danke.", "To take away, thanks.", "c4", { keywords: ["mitnehmen"] }),
      ]),
      c4: n("c4", "Alles klar. Das macht sieben Euro achtzig.", "All right. That's seven euros eighty.", [
        r("Kann ich mit Karte bezahlen?", "Can I pay by card?", "c5", { keywords: ["karte", "bezahlen"] }),
        r("Hier, bitte. Stimmt so!", "Here you go. Keep the change!", "c5", { keywords: ["stimmt", "bitte"] }),
        r("Kann ich mit Karte bezahle?", "Can I pays by card?", "c5", { ok: false, why: "After a modal verb, use the infinitive: « Kann ich mit Karte bezahlen? »", keywords: ["bezahle"] }),
      ]),
      c5: n("c5", "Natürlich. Danke schön und einen schönen Tag noch!", "Of course. Thank you and have a nice day!", []),
    },
  },
  {
    id: "de-neighbour", title: "Meeting a neighbour", subtitle: "Introduce yourself to the person next door.", icon: "home",
    partner: "a retired neighbour, Frau Krüger, who is curious and kind", register: "vous", goal: "Introduce yourself, say where you're from and what you do.", minWeek: 1,
    skills: ["de-w1-pronouns", "de-w1-basic-sentences", "de-w2-sein"],
    vocabulary: [{ fr: "Freut mich!", en: "nice to meet you" }, { fr: "der Nachbar / die Nachbarin", en: "the neighbour" }, { fr: "ich komme aus…", en: "I come from…" }, { fr: "ich arbeite als…", en: "I work as…" }, { fr: "das Haus", en: "the building / house" }],
    start: "n1",
    nodes: {
      n1: n("n1", "Guten Tag! Sind Sie der neue Nachbar aus dem dritten Stock?", "Hello! Are you the new neighbour on the third floor?", [
        r("Ja, guten Tag! Ich heiße Sam. Freut mich!", "Yes, hello! My name is Sam. Nice to meet you!", "n2", { keywords: ["heisse", "freut"] }),
        r("Ja, das bin ich. Ich wohne seit einer Woche hier.", "Yes, that's me. I've lived here for a week.", "n2", { keywords: ["wohne", "woche"] }),
        r("Ja, bist du die Nachbarin?", "Yes, are you the neighbour?", "n2", { ok: false, why: "With an older neighbour you've just met, use Sie: « Sind Sie die Nachbarin? »", keywords: ["bist"] }),
      ]),
      n2: n("n2", "Freut mich auch! Ich bin Frau Krüger. Woher kommen Sie?", "Nice to meet you too! I'm Mrs Krüger. Where are you from?", [
        r("Ich komme aus England, aus London.", "I come from England, from London.", "n3", { keywords: ["england", "london", "komme"] }),
        r("Ich bin Engländer, aber ich wohne jetzt in Deutschland.", "I'm English, but I live in Germany now.", "n3", { keywords: ["englander", "englanderin", "deutschland"] }),
        r("Ich komme von England.", "I come of England.", "n3", { ok: false, why: "For countries of origin use aus: « Ich komme aus England »." }),
      ]),
      n3: n("n3", "Ach, schön! Und was machen Sie beruflich?", "Oh, lovely! And what do you do for a living?", [
        r("Ich arbeite im Marketing.", "I work in marketing.", "n4", { keywords: ["arbeite", "marketing"] }),
        r("Ich suche gerade Arbeit.", "I'm looking for work at the moment.", "n4", { keywords: ["suche", "arbeit"] }),
        r("Ich bin ein Lehrer.", "I am a teacher.", "n4", { ok: false, why: "No article before a job: « Ich bin Lehrer »." }),
      ]),
      n4: n("n4", "Wenn Sie etwas brauchen, klingeln Sie einfach!", "If you need anything, just ring the bell!", [
        r("Das ist sehr nett, vielen Dank!", "That's very kind, thank you very much!", "n5", { keywords: ["nett", "danke"] }),
        r("Danke! Einen schönen Tag noch, Frau Krüger.", "Thanks! Have a nice day, Mrs Krüger.", "n5", { keywords: ["tag", "schonen"] }),
      ]),
      n5: n("n5", "Ihnen auch! Auf Wiedersehen!", "You too! Goodbye!", []),
    },
  },
  {
    id: "de-landlord", title: "Calling your landlord", subtitle: "Report a broken heater and arrange a repair.", icon: "key",
    partner: "Herr Neumann, a polite but busy landlord", register: "vous", goal: "Explain the problem, say since when, and agree on a time for the repair.", minWeek: 2,
    skills: ["de-w2-haben", "de-w4-negation", "de-w9-time", "de-w11-situations"],
    vocabulary: [{ fr: "die Heizung", en: "the heating" }, { fr: "funktioniert nicht", en: "doesn't work" }, { fr: "seit gestern", en: "since yesterday" }, { fr: "ein Techniker", en: "a technician" }, { fr: "Ich bin zu Hause.", en: "I'm at home." }],
    start: "l1",
    nodes: {
      l1: n("l1", "Neumann, hallo?", "Neumann speaking, hello?", [
        r("Guten Tag, Herr Neumann, hier ist Sam aus dem dritten Stock.", "Hello, Mr Neumann, this is Sam from the third floor.", "l2", { keywords: ["guten", "stock"] }),
        r("Guten Tag, ich bin Ihr Mieter in der Goethestraße.", "Hello, I'm your tenant on Goethestraße.", "l2", { keywords: ["mieter"] }),
        r("Hey Neumann!", "Hey Neumann!", "l2", { ok: false, why: "Too familiar for a landlord. Use « Guten Tag, Herr Neumann »." , keywords: ["hey"] }),
      ]),
      l2: n("l2", "Ah, guten Tag. Was gibt es?", "Ah, hello. What's up?", [
        r("Die Heizung funktioniert nicht.", "The heating isn't working.", "l3", { keywords: ["heizung", "funktioniert"] }),
        r("Ich habe ein Problem mit der Heizung.", "I have a problem with the heating.", "l3", { keywords: ["problem", "heizung"] }),
        r("Die Heizung funktioniert kein.", "The heating works no.", "l3", { ok: false, why: "Negating a verb needs nicht: « Die Heizung funktioniert nicht »." }),
      ]),
      l3: n("l3", "Oh, das tut mir leid. Seit wann?", "Oh, I'm sorry. Since when?", [
        r("Seit gestern Abend.", "Since yesterday evening.", "l4", { keywords: ["seit", "gestern"] }),
        r("Seit zwei Tagen. Es ist sehr kalt.", "For two days. It's very cold.", "l4", { keywords: ["tagen", "kalt"] }),
        r("Vor gestern.", "Ago yesterday.", "l4", { ok: false, why: "Use « seit gestern » (since yesterday). « vor » needs a duration: vor zwei Tagen." }),
      ]),
      l4: n("l4", "Ich rufe einen Techniker an. Sind Sie morgen Vormittag zu Hause?", "I'll call a technician. Are you at home tomorrow morning?", [
        r("Ja, ab neun Uhr bin ich zu Hause.", "Yes, I'm at home from nine o'clock.", "l5", { keywords: ["neun", "hause", "ja"] }),
        r("Nein, ich arbeite. Geht es morgen Nachmittag?", "No, I'm working. Would tomorrow afternoon work?", "l5", { keywords: ["nachmittag", "arbeite"] }),
      ]),
      l5: n("l5", "Gut, ich schicke Ihnen eine SMS. Schönen Abend noch!", "Good, I'll text you. Have a nice evening!", []),
    },
  },
  {
    id: "de-directions", title: "Asking for directions", subtitle: "Find the nearest U-Bahn station.", icon: "map",
    partner: "a helpful passer-by in Munich", register: "vous", goal: "Ask where something is, understand left/right, and check the distance.", minWeek: 3,
    skills: ["de-w4-questions", "de-w4-prepositions", "de-w11-listening"],
    vocabulary: [{ fr: "links / rechts", en: "left / right" }, { fr: "geradeaus", en: "straight on" }, { fr: "die U-Bahn-Station", en: "the underground station" }, { fr: "Ist das weit?", en: "is it far?" }, { fr: "zu Fuß", en: "on foot" }],
    start: "d1",
    nodes: {
      d1: n("d1", "Ja? Kann ich Ihnen helfen?", "Yes? Can I help you?", [
        r("Entschuldigung, wo ist die U-Bahn-Station, bitte?", "Excuse me, where is the underground station, please?", "d2", { keywords: ["wo", "u-bahn", "station"] }),
        r("Ich suche die U-Bahn.", "I'm looking for the underground.", "d2", { keywords: ["suche", "u-bahn"] }),
        r("Wo die U-Bahn ist?", "Where the underground is?", "d2", { ok: false, why: "Question word, then verb, then subject: « Wo ist die U-Bahn? »" }),
      ]),
      d2: n("d2", "Also, Sie gehen hier geradeaus und dann die zweite Straße links.", "So, you go straight on here and then take the second street on the left.", [
        r("Geradeaus und dann die zweite links. Ist das weit?", "Straight on and then the second on the left. Is it far?", "d3", { keywords: ["weit", "links"] }),
        r("Entschuldigung, können Sie das langsamer wiederholen?", "Sorry, can you repeat that more slowly?", "d2b", { keywords: ["wiederholen", "langsamer"] }),
      ]),
      d2b: n("d2b", "Natürlich. Geradeaus… dann… die zweite Straße… links.", "Of course. Straight on… then… the second street… on the left.", [
        r("Danke! Ist das weit?", "Thanks! Is it far?", "d3", { keywords: ["weit", "danke"] }),
      ]),
      d3: n("d3", "Nein, das sind nur fünf Minuten zu Fuß.", "No, it's only five minutes on foot.", [
        r("Super, vielen Dank!", "Great, thank you very much!", "d4", { keywords: ["danke"] }),
        r("Danke, schönen Tag noch!", "Thanks, have a nice day!", "d4", { keywords: ["tag"] }),
      ]),
      d4: n("d4", "Gern geschehen. Tschüss!", "You're welcome. Bye!", []),
    },
  },
  {
    id: "de-appointment", title: "Booking an appointment", subtitle: "Call the doctor's surgery for an appointment.", icon: "stethoscope",
    partner: "a receptionist at a GP practice (Arztpraxis)", register: "vous", goal: "Ask for an appointment, give your name, and agree on a day and time.", minWeek: 2,
    skills: ["de-w5-modals", "de-w6-routine", "de-w11-situations"],
    vocabulary: [{ fr: "einen Termin machen", en: "make an appointment" }, { fr: "der Arzt / die Ärztin", en: "the doctor" }, { fr: "Das passt mir.", en: "that suits me" }, { fr: "buchstabieren", en: "to spell" }, { fr: "die Versichertenkarte", en: "the health insurance card" }],
    start: "a1",
    nodes: {
      a1: n("a1", "Praxis Dr. Hoffmann, guten Tag!", "Dr Hoffmann's practice, hello!", [
        r("Guten Tag, ich möchte gern einen Termin machen.", "Hello, I'd like to make an appointment.", "a2", { keywords: ["termin", "mochte"] }),
        r("Guten Tag, kann ich diese Woche zum Arzt kommen?", "Hello, can I see the doctor this week?", "a2", { keywords: ["woche", "arzt"] }),
        r("Ich will den Arzt jetzt.", "I want the doctor now.", "a2", { ok: false, why: "Too abrupt. « Ich möchte gern einen Termin machen » is the polite phrase." }),
      ]),
      a2: n("a2", "Gern. Waren Sie schon einmal bei uns?", "Certainly. Have you been here before?", [
        r("Nein, das ist das erste Mal.", "No, this is the first time.", "a3", { keywords: ["erste", "nein"] }),
        r("Ja, mein Name ist Sam Taylor.", "Yes, my name is Sam Taylor.", "a3", { keywords: ["ja", "name"] }),
      ]),
      a3: n("a3", "Ich habe am Donnerstag um halb vier einen Termin frei. Passt Ihnen das?", "I have a slot on Thursday at half past three. Does that suit you?", [
        r("Ja, Donnerstag um halb vier passt gut.", "Yes, Thursday at half past three works well.", "a4", { keywords: ["donnerstag", "passt", "ja"] }),
        r("Nein, da arbeite ich. Haben Sie etwas am Vormittag?", "No, I'm working then. Do you have something in the morning?", "a3b", { keywords: ["vormittag", "arbeite"] }),
      ]),
      a3b: n("a3b", "Freitag um neun Uhr?", "Friday at nine?", [
        r("Ja, Freitag um neun passt mir.", "Yes, Friday at nine suits me.", "a4", { keywords: ["freitag", "passt", "ja"] }),
      ]),
      a4: n("a4", "Gut, ich trage Sie ein. Können Sie Ihren Namen buchstabieren?", "Good, I'll put you down. Can you spell your name?", [
        r("Natürlich: T-A-Y-L-O-R.", "Of course: T-A-Y-L-O-R.", "a5", { keywords: ["t-a-y", "taylor", "naturlich"] }),
        r("Ja, Taylor, T-A-Y-L-O-R. Danke!", "Yes, Taylor, T-A-Y-L-O-R. Thanks!", "a5", { keywords: ["taylor"] }),
      ]),
      a5: n("a5", "Danke. Bitte bringen Sie Ihre Versichertenkarte mit. Bis Freitag!", "Thank you. Please bring your insurance card. See you on Friday!", []),
    },
  },
  {
    id: "de-service", title: "Explaining a problem", subtitle: "Your internet router doesn't work — call customer service.", icon: "wrench",
    partner: "a customer-service agent for an internet provider", register: "vous", goal: "Describe the problem, answer questions and get a technician visit.", minWeek: 4,
    skills: ["de-w4-negation", "de-w8-perfekt-haben", "de-w9-time"],
    vocabulary: [{ fr: "der Router", en: "the router" }, { fr: "neu starten", en: "to restart" }, { fr: "ein Techniker", en: "a technician" }, { fr: "die Kundennummer", en: "the customer number" }, { fr: "Es geht immer noch nicht.", en: "it still doesn't work" }],
    start: "s1",
    nodes: {
      s1: n("s1", "Kundenservice, guten Tag. Wie kann ich Ihnen helfen?", "Customer service, hello. How can I help you?", [
        r("Guten Tag, mein Internet funktioniert nicht.", "Hello, my internet isn't working.", "s2", { keywords: ["internet", "funktioniert"] }),
        r("Guten Tag, ich habe ein Problem mit meinem Router.", "Hello, I have a problem with my router.", "s2", { keywords: ["problem", "router"] }),
      ]),
      s2: n("s2", "Okay. Haben Sie den Router schon neu gestartet?", "OK. Have you already restarted the router?", [
        r("Ja, ich habe ihn zweimal neu gestartet.", "Yes, I've restarted it twice.", "s3", { keywords: ["gestartet", "zweimal", "ja"] }),
        r("Nein, noch nicht.", "No, not yet.", "s2b", { keywords: ["nein", "noch"] }),
        r("Ja, ich bin den Router neu gestartet.", "Yes, I am restarted the router.", "s3", { ok: false, why: "starten takes haben in the Perfekt: « Ich habe ihn neu gestartet »." }),
      ]),
      s2b: n("s2b", "Ziehen Sie bitte den Stecker für dreißig Sekunden.", "Please unplug it for thirty seconds.", [
        r("So, gemacht… aber es geht immer noch nicht.", "There, done… but it still doesn't work.", "s3", { keywords: ["immer", "gemacht"] }),
      ]),
      s3: n("s3", "Verstehe. Seit wann haben Sie das Problem?", "I see. Since when have you had the problem?", [
        r("Seit Samstagmorgen.", "Since Saturday morning.", "s4", { keywords: ["seit", "samstag", "samstagmorgen"] }),
        r("Seit drei Tagen.", "For three days.", "s4", { keywords: ["tagen", "seit"] }),
      ]),
      s4: n("s4", "Ich schicke Ihnen am Dienstag zwischen acht und zwölf einen Techniker. Geht das?", "I'll send you a technician on Tuesday between eight and twelve. Is that OK?", [
        r("Ja, das geht. Vielen Dank.", "Yes, that's fine. Thank you very much.", "s5", { keywords: ["ja", "geht", "danke"] }),
        r("Am Dienstag bin ich nicht da. Geht es am Mittwoch?", "I'm not there on Tuesday. Is Wednesday possible?", "s5", { keywords: ["mittwoch"] }),
      ]),
      s5: n("s5", "Alles klar. Sie bekommen eine Bestätigung per E-Mail. Schönen Tag noch!", "All right. You'll get a confirmation by email. Have a nice day!", []),
    },
  },
  {
    id: "de-recruiter", title: "Talking to a recruiter", subtitle: "A first phone call about a job.", icon: "briefcase",
    partner: "a recruiter calling about a marketing job in Hamburg", register: "vous", goal: "Introduce yourself professionally, describe your experience and availability.", minWeek: 5,
    skills: ["de-w1-basic-sentences", "de-w9-time", "de-w7-future", "de-w10-connectors"],
    vocabulary: [{ fr: "die Stelle", en: "the position" }, { fr: "die Erfahrung", en: "experience" }, { fr: "seit fünf Jahren", en: "for five years" }, { fr: "Zeit haben", en: "to be available" }, { fr: "das Vorstellungsgespräch", en: "the job interview" }],
    start: "r1",
    nodes: {
      r1: n("r1", "Guten Tag, ich rufe wegen der Stelle im Marketing an. Haben Sie kurz Zeit?", "Hello, I'm calling about the marketing position. Do you have a moment?", [
        r("Ja, natürlich. Danke für Ihren Anruf.", "Yes, of course. Thank you for your call.", "r2", { keywords: ["ja", "naturlich", "anruf"] }),
        r("Ja, ich höre.", "Yes, I'm listening.", "r2", { keywords: ["hore"] }),
      ]),
      r2: n("r2", "Können Sie sich kurz vorstellen?", "Can you briefly introduce yourself?", [
        r("Ich heiße Sam. Ich arbeite seit fünf Jahren im Marketing.", "My name is Sam. I've worked in marketing for five years.", "r3", { keywords: ["arbeite", "seit", "jahren"] }),
        r("Ich bin Engländer, ich wohne in Hamburg und habe Erfahrung im Online-Marketing.", "I'm English, I live in Hamburg and I have experience in online marketing.", "r3", { keywords: ["erfahrung", "wohne"] }),
        r("Ich arbeite vor fünf Jahren im Marketing.", "I work ago five years in marketing.", "r3", { ok: false, why: "For something still true, use seit + present: « Ich arbeite seit fünf Jahren im Marketing »." }),
      ]),
      r3: n("r3", "Sehr gut. Und warum interessiert Sie die Stelle?", "Very good. And why are you interested in the position?", [
        r("Weil ich gern im Team arbeite und mein Deutsch verbessern möchte.", "Because I like working in a team and would like to improve my German.", "r4", { keywords: ["weil", "team", "verbessern"] }),
        r("Weil die Firma sehr innovativ ist.", "Because the company is very innovative.", "r4", { keywords: ["firma", "weil"] }),
      ]),
      r4: n("r4", "Hätten Sie nächste Woche Zeit für ein Vorstellungsgespräch?", "Would you have time for an interview next week?", [
        r("Ja, am Dienstag oder Donnerstag habe ich Zeit.", "Yes, I'm free on Tuesday or Thursday.", "r5", { keywords: ["dienstag", "donnerstag", "zeit"] }),
        r("Ja, gern. Welcher Tag passt Ihnen?", "Yes, gladly. Which day suits you?", "r5", { keywords: ["gern", "tag"] }),
      ]),
      r5: n("r5", "Perfekt, ich schicke Ihnen eine Einladung per E-Mail. Auf Wiederhören!", "Perfect, I'll send you an invitation by email. Goodbye!", []),
    },
  },
  {
    id: "de-friend", title: "Chatting with a friend", subtitle: "Make weekend plans with a German friend.", icon: "users",
    partner: "Jonas, a German friend (use du)", register: "tu", goal: "Talk about your week and make a plan for the weekend.", minWeek: 2,
    skills: ["de-w7-future", "de-w7-plans", "de-w8-perfekt-haben"],
    vocabulary: [{ fr: "Hast du Lust?", en: "do you fancy it?" }, { fr: "am Wochenende", en: "at the weekend" }, { fr: "wir treffen uns", en: "we meet up" }, { fr: "total müde", en: "really tired" }, { fr: "Klar!", en: "sure!" }],
    start: "f1",
    nodes: {
      f1: n("f1", "Hey! Wie geht's? Wie war deine Woche?", "Hey! How are you? How was your week?", [
        r("Hey! Gut, aber ich bin ein bisschen müde.", "Hey! Good, but I'm a bit tired.", "f2", { keywords: ["mude", "gut"] }),
        r("Super! Ich habe viel gearbeitet, aber es war gut.", "Great! I worked a lot, but it was good.", "f2", { keywords: ["gearbeitet", "super"] }),
        r("Guten Tag, Herr Jonas, mir geht es gut, danke.", "Good day, Mr Jonas, I'm well, thank you.", "f2", { ok: false, why: "Very formal for a friend! « Hey! Gut, und dir? » sounds natural." }),
      ]),
      f2: n("f2", "Was machst du am Wochenende?", "What are you doing at the weekend?", [
        r("Am Samstag ruhe ich mich aus. Und du?", "On Saturday I'm resting. And you?", "f3", { keywords: ["ruhe", "samstag"] }),
        r("Ich weiß noch nicht. Hast du eine Idee?", "I don't know yet. Do you have an idea?", "f3", { keywords: ["weiss", "idee"] }),
        r("Am Samstag ich ruhe mich aus.", "On Saturday I rest (wrong order).", "f3", { ok: false, why: "Verb second: « Am Samstag ruhe ich mich aus »." }),
      ]),
      f3: n("f3", "Hast du Lust, am Sonntagmorgen auf den Flohmarkt zu gehen?", "Do you fancy going to the flea market on Sunday morning?", [
        r("Klar! Um wie viel Uhr treffen wir uns?", "Sure! What time shall we meet?", "f4", { keywords: ["klar", "uhr", "treffen"] }),
        r("Ja, gern! Wo treffen wir uns?", "Yes, I'd love to! Where shall we meet?", "f4", { keywords: ["gern", "wo"] }),
        r("Tut mir leid, am Sonntag kann ich nicht.", "Sorry, I can't on Sunday.", "f4b", { keywords: ["leid", "kann"] }),
      ]),
      f4b: n("f4b", "Kein Problem! Samstagabend dann? Wir können zusammen essen.", "No problem! Saturday evening, then? We can eat together.", [
        r("Ja, Samstagabend ist perfekt!", "Yes, Saturday evening is perfect!", "f5", { keywords: ["samstagabend", "perfekt", "ja"] }),
      ]),
      f4: n("f4", "Gegen zehn vor der Bäckerei?", "Around ten in front of the bakery?", [
        r("Perfekt, bis Sonntag!", "Perfect, see you Sunday!", "f5", { keywords: ["perfekt", "sonntag"] }),
        r("Okay, bis Sonntag!", "OK, see you Sunday!", "f5", { keywords: ["okay"] }),
      ]),
      f5: n("f5", "Super, bis dann! Schönes Wochenende!", "Great, see you then! Have a nice weekend!", []),
    },
  },
];

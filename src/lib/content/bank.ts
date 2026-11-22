import type { BankSentence, DialogueItem, McqItem, SkillBank, TransformItem } from "./types";

/*
 * Hand-written, reviewed content. Generated drills (conjugations, frames)
 * come from the engine; these items cover everything that can't be generated
 * reliably: idioms, gender, prepositions, pronouns, situations.
 */

const s = (id: string, fr: string, en: string, extra: Partial<BankSentence> = {}): BankSentence => ({ id, fr, en, ...extra });
const m = (id: string, prompt: string, options: string[], answer: number, explanation: string, extra: Partial<McqItem> = {}): McqItem => ({ id, prompt, options, answer, explanation, ...extra });
const t = (id: string, kind: string, from: string, to: string[], explanation: string): TransformItem => ({ id, kind, from, to, explanation });
const d = (id: string, context: string, them: [string, string], options: DialogueItem["options"]): DialogueItem => ({
  id, context, lines: [{ who: "them", fr: them[0], en: them[1] }], options,
});
const ok = (fr: string, en: string, why: string) => ({ fr, en, correct: true, why });
const no = (fr: string, en: string, why: string) => ({ fr, en, correct: false, why });

export const BANK: Record<string, SkillBank> = {
  "w1-pronouns": {
    mcq: [
      m("p1", "___ parlons français.", ["Nous", "Vous", "Ils"], 0, "The ending -ons only goes with nous.", { en: "We speak French.", typeable: true }),
      m("p2", "Marie et Sophie ? ___ sont à la gare.", ["Ils", "Elles", "Nous"], 1, "An all-female group is elles.", { en: "They are at the station." }),
      m("p3", "Paul et Marie ? ___ travaillent ensemble.", ["Elles", "Ils", "On"], 1, "A mixed group is always ils — even with one man.", { en: "They work together." }),
      m("p4", "To your landlord: « ___ êtes Monsieur Dupont ? »", ["Tu", "Vous", "Il"], 1, "Use vous with people you don't know personally, like a landlord.", { en: "Are you Mr Dupont?" }),
      m("p5", "To a close friend: « ___ es prêt ? »", ["Vous", "Tu", "Il"], 1, "Friends get tu — and es is the tu form of être.", { en: "Are you ready?" }),
      m("p6", "___ aime le café. (I)", ["Je", "J'", "Jé"], 1, "Je becomes j' before a vowel or silent h: j'aime.", { en: "I like coffee." }),
      m("p7", "Le train ? ___ est en retard.", ["Elle", "Il", "On"], 1, "Le train is masculine, so it is il.", { en: "It is late." }),
      m("p8", "La voiture ? ___ est rouge.", ["Il", "Elle", "Ils"], 1, "La voiture is feminine, so it is elle.", { en: "It is red." }),
      m("p9", "In casual speech, « we » is very often…", ["on", "ils", "vous"], 0, "On + il-form verb (on parle) is the everyday way to say 'we'.", {}),
      m("p10", "___ habitez à Paris ?", ["Tu", "Vous", "Nous"], 1, "-ez is the vous ending.", { en: "Do you live in Paris?", typeable: true }),
    ],
    sentences: [
      s("p-s1", "Nous sommes à Paris.", "We are in Paris.", { alts: ["On est à Paris."] }),
      s("p-s2", "Tu es mon ami.", "You (informal) are my friend.", { alts: ["Tu es mon amie."] }),
      s("p-s3", "Elles habitent à Lyon.", "They (all women) live in Lyon.", { distractors: ["Ils"] }),
      s("p-s4", "Vous êtes Madame Martin ?", "Are you (formal) Mrs Martin?", { alts: ["Est-ce que vous êtes Madame Martin ?", "Êtes-vous Madame Martin ?"] }),
      s("p-s5", "On parle français ici.", "We speak French here.", { alts: ["Nous parlons français ici.", "Ici, on parle français.", "Ici, nous parlons français."] }),
      s("p-s6", "Il est à la maison.", "He is at home.", { distractors: ["Elle"] }),
    ],
    dialogues: [
      d("p-d1", "You meet your new neighbour, an older lady, on the stairs.", ["Bonjour ! Vous êtes le nouveau voisin ?", "Hello! Are you the new neighbour?"], [
        ok("Oui, je suis votre nouveau voisin. Enchanté !", "Yes, I'm your new neighbour. Nice to meet you!", "To talk about yourself use je suis, and votre matches her polite vous."),
        no("Oui, tu es ma voisine.", "Yes, you are my neighbour.", "Tu es means 'you are' — and tu is too familiar here."),
        no("Oui, il est le voisin.", "Yes, he is the neighbour.", "Il est talks about someone else."),
      ]),
    ],
  },

  "w1-er-present": {
    mcq: [
      m("e1", "Nous ___ français.", ["parle", "parlons", "parlez"], 1, "nous → -ons: nous parlons.", { en: "We speak French.", typeable: true }),
      m("e2", "Tu ___ à Paris ? (travailler)", ["travaille", "travailles", "travaillez"], 1, "tu → -es: tu travailles (the s is silent but must be written).", { en: "Do you work in Paris?", typeable: true }),
      m("e3", "Ils ___ la télé. (regarder)", ["regardent", "regardons", "regarde"], 0, "ils → -ent, which is silent: ils regardent.", { en: "They watch TV.", typeable: true }),
      m("e4", "Vous ___ à Lyon ? (habiter)", ["habitez", "habitons", "habite"], 0, "vous → -ez.", { en: "Do you live in Lyon?", typeable: true }),
      m("e5", "J'___ le café. (aimer)", ["aime", "aimes", "aimons"], 0, "je → -e, and je elides to j' before aime.", { en: "I like coffee.", typeable: true }),
      m("e6", "Nous ___ une pizza. (manger)", ["mangons", "mangeons", "mangez"], 1, "Keep the soft g sound: mangeons (g + e before o).", { en: "We're eating a pizza.", typeable: true }),
    ],
    sentences: [
      s("e-s1", "Je parle un peu français.", "I speak a little French."),
      s("e-s2", "Nous habitons à Lyon.", "We live in Lyon.", { alts: ["On habite à Lyon."], distractors: ["habitez"] }),
      s("e-s3", "Tu travailles aujourd'hui ?", "Are you working today? (informal)", { alts: ["Est-ce que tu travailles aujourd'hui ?", "Travailles-tu aujourd'hui ?"] }),
      s("e-s4", "Elle regarde un film.", "She is watching a film.", { distractors: ["regardes"] }),
      s("e-s5", "Ils mangent au restaurant.", "They eat at the restaurant.", { distractors: ["mange"] }),
      s("e-s6", "J'aime beaucoup Paris.", "I really like Paris.", { alts: ["J'adore Paris."] }),
      s("e-s7", "Vous cherchez un appartement ?", "Are you (formal) looking for an apartment?", { alts: ["Est-ce que vous cherchez un appartement ?", "Cherchez-vous un appartement ?"] }),
    ],
    dialogues: [
      d("e-d1", "A neighbour chats with you in the lift.", ["Tu habites ici depuis longtemps ?", "Have you lived here long?"], [
        ok("Non, j'habite ici depuis un mois.", "No, I've lived here for a month.", "j'habite — je + -e ending, elided before the h."),
        no("Non, tu habites ici.", "No, you live here.", "Tu habites is 'you live' — answer about yourself with j'habite."),
        no("Non, j'habitons ici.", "No, I live (wrong form) here.", "-ons only goes with nous."),
      ]),
    ],
  },

  "w1-basic-sentences": {
    mcq: [
      m("b1", "In the evening you greet someone with…", ["Bonsoir", "Bonjour ce soir", "Bonne nuit"], 0, "Bonsoir is the evening greeting. Bonne nuit is only for going to bed."),
      m("b2", "« My name is Sam » →", ["Je m'appelle Sam.", "Je suis appelle Sam.", "Mon appelle Sam."], 0, "S'appeler is reflexive: je m'appelle (literally 'I call myself')."),
      m("b3", "Someone says « Merci ! ». You reply:", ["De rien !", "Bonjour !", "Pardon !"], 0, "De rien = you're welcome."),
      m("b4", "Polite « please » to a shopkeeper:", ["s'il vous plaît", "s'il te plaît", "merci"], 0, "Use the vous form with strangers: s'il vous plaît."),
      m("b5", "Which word order is correct?", ["J'habite à Paris.", "À Paris habite je.", "Habite j'à Paris."], 0, "Subject + verb + complement, just like English."),
      m("b6", "« I'm English » (said by a woman) →", ["Je suis anglaise.", "Je suis une anglaise.", "J'ai anglaise."], 0, "Nationality after être: no article, and add -e for a woman. No capital letter for the adjective."),
    ],
    sentences: [
      s("b-s1", "Je m'appelle Sam.", "My name is Sam.", { alts: ["Moi, c'est Sam.", "Mon nom est Sam."], distractors: ["suis"] }),
      s("b-s2", "J'habite à Lyon.", "I live in Lyon.", { distractors: ["en"] }),
      s("b-s3", "Je suis anglais.", "I'm English.", { alts: ["Je suis anglaise."], distractors: ["un"] }),
      s("b-s4", "Je travaille dans un bureau.", "I work in an office.", { distractors: ["travailles"] }),
      s("b-s5", "Bonjour, ça va ?", "Hello, how are you?", { alts: ["Salut, ça va ?", "Bonjour, comment ça va ?"] }),
      s("b-s6", "Je parle anglais et un peu français.", "I speak English and a little French.", { alts: ["Je parle anglais et un peu de français."] }),
      s("b-s7", "Merci beaucoup, bonne journée !", "Thank you very much, have a good day!"),
      s("b-s8", "Le café est très bon.", "The coffee is very good.", { distractors: ["bien"] }),
    ],
    dialogues: [
      d("b-d1", "At a party, someone introduces themselves.", ["Salut ! Je m'appelle Léa. Et toi ?", "Hi! I'm Léa. And you?"], [
        ok("Salut Léa ! Moi, c'est Sam.", "Hi Léa! I'm Sam.", "Moi, c'est… is a natural, casual way to give your name."),
        no("Je suis appelle Sam.", "I am call Sam.", "Mixes être and appeler — say je m'appelle Sam."),
        no("Au revoir, Léa !", "Goodbye, Léa!", "That's goodbye — the conversation just started!"),
      ]),
      d("b-d2", "You walk into a bakery in the morning.", ["Bonjour Monsieur, qu'est-ce que vous désirez ?", "Hello sir, what would you like?"], [
        ok("Bonjour ! Une baguette, s'il vous plaît.", "Hello! A baguette, please.", "Greeting + item + s'il vous plaît is exactly right."),
        no("Salut ! Donne une baguette.", "Hi! Give a baguette.", "Too abrupt and informal for a shop — use bonjour and s'il vous plaît."),
        no("Bonsoir ! Je m'appelle baguette.", "Good evening! My name is baguette.", "It's morning, and you aren't a baguette."),
      ]),
    ],
  },

  "w2-etre": {
    mcq: [
      m("et1", "Je ___ fatigué.", ["suis", "es", "est"], 0, "je → suis.", { en: "I am tired.", typeable: true }),
      m("et2", "Nous ___ à la maison.", ["sommes", "êtes", "sont"], 0, "nous → sommes.", { en: "We are at home.", typeable: true }),
      m("et3", "Vous ___ très gentil.", ["êtes", "étez", "sont"], 0, "vous → êtes (irregular: not -ez).", { en: "You are very kind.", typeable: true }),
      m("et4", "Ils ___ anglais.", ["ont", "sont", "est"], 1, "sont = are. Ont = have — a classic confusion.", { en: "They are English.", typeable: true }),
      m("et5", "Elle est ___.", ["une infirmière", "infirmière", "la infirmière"], 1, "No article for professions after être: elle est infirmière.", { en: "She is a nurse." }),
    ],
    sentences: [
      s("et-s1", "Je suis à Paris pour le travail.", "I'm in Paris for work."),
      s("et-s2", "Elle est infirmière.", "She is a nurse.", { distractors: ["une"] }),
      s("et-s3", "Nous sommes en retard.", "We are late.", { alts: ["On est en retard."], distractors: ["avons"] }),
      s("et-s4", "Vous êtes Monsieur Dubois ?", "Are you (formal) Mr Dubois?", { alts: ["Est-ce que vous êtes Monsieur Dubois ?", "Êtes-vous Monsieur Dubois ?"] }),
      s("et-s5", "Le restaurant est fermé le lundi.", "The restaurant is closed on Mondays."),
    ],
    dialogues: [
      d("et-d1", "At the doctor's reception desk.", ["Bonjour, vous êtes Madame Smith ?", "Hello, are you Mrs Smith?"], [
        ok("Oui, c'est moi. Je suis un peu en avance.", "Yes, that's me. I'm a bit early.", "je suis + en avance (early) — perfect."),
        no("Oui, je es Madame Smith.", "Yes, I is Mrs Smith.", "je goes with suis, not es."),
        no("Oui, vous êtes Madame Smith.", "Yes, you are Mrs Smith.", "That repeats 'you are' — about yourself, say je suis or c'est moi."),
      ]),
    ],
  },

  "w2-avoir": {
    mcq: [
      m("av1", "J'___ trente ans.", ["ai", "suis", "as"], 0, "Age uses avoir: j'ai trente ans.", { en: "I'm thirty.", typeable: true }),
      m("av2", "Tu ___ un chien ?", ["a", "as", "ai"], 1, "tu → as.", { en: "Do you have a dog?", typeable: true }),
      m("av3", "Ils ___ deux enfants.", ["sont", "ont", "avont"], 1, "ils → ont (with a z-sound liaison: ils‿ont).", { en: "They have two children.", typeable: true }),
      m("av4", "Nous ___ un rendez-vous.", ["avons", "avez", "ont"], 0, "nous → avons.", { en: "We have an appointment.", typeable: true }),
      m("av5", "___ un café près d'ici ?", ["Il y a", "Il a", "Il est"], 0, "Il y a = there is / there are.", { en: "Is there a café near here?" }),
    ],
    sentences: [
      s("av-s1", "J'ai trente ans.", "I'm thirty (years old).", { distractors: ["suis"] }),
      s("av-s2", "Il y a une boulangerie ici.", "There is a bakery here.", { alts: ["Ici, il y a une boulangerie."] }),
      s("av-s3", "Vous avez une chambre pour ce soir ?", "Do you (formal) have a room for tonight?", { alts: ["Est-ce que vous avez une chambre pour ce soir ?", "Avez-vous une chambre pour ce soir ?"] }),
      s("av-s4", "Nous avons un rendez-vous à dix heures.", "We have an appointment at ten.", { alts: ["On a un rendez-vous à dix heures."] }),
      s("av-s5", "Elle a deux enfants.", "She has two children.", { distractors: ["est"] }),
    ],
    dialogues: [
      d("av-d1", "Checking into a small hotel.", ["Bonsoir, vous avez une réservation ?", "Good evening, do you have a booking?"], [
        ok("Oui, j'ai une réservation au nom de Smith.", "Yes, I have a booking under the name Smith.", "avoir for possession: j'ai une réservation."),
        no("Oui, je suis une réservation.", "Yes, I am a booking.", "être is for identity — you have a booking: j'ai."),
        no("Oui, il y a Smith.", "Yes, there is Smith.", "Il y a means 'there is' — not what you want here."),
      ]),
    ],
  },

  "w2-aller-faire": {
    mcq: [
      m("af1", "Je ___ au travail en bus.", ["vais", "vas", "va"], 0, "je → vais.", { en: "I go to work by bus.", typeable: true }),
      m("af2", "Vous ___ du sport ?", ["faisez", "faites", "font"], 1, "vous faites — irregular, never « faisez ».", { en: "Do you do sport?", typeable: true }),
      m("af3", "Ils ___ à la gare.", ["vont", "allent", "vais"], 0, "ils → vont.", { en: "They're going to the station.", typeable: true }),
      m("af4", "Il ___ beau aujourd'hui.", ["fait", "est", "va"], 0, "Weather uses faire: il fait beau.", { en: "The weather is nice today.", typeable: true }),
      m("af5", "Je vais ___ marché.", ["au", "à le", "à la"], 0, "à + le contracts to au.", { en: "I'm going to the market.", typeable: true }),
      m("af6", "Nous ___ les courses le samedi.", ["faisons", "faites", "fais"], 0, "nous → faisons.", { en: "We do the shopping on Saturdays.", typeable: true }),
    ],
    sentences: [
      s("af-s1", "Je vais au supermarché.", "I'm going to the supermarket.", { distractors: ["à le"] }),
      s("af-s2", "Il fait froid ce matin.", "It's cold this morning.", { alts: ["Ce matin, il fait froid."], distractors: ["est"] }),
      s("af-s3", "Qu'est-ce que tu fais ce soir ?", "What are you doing tonight?", { alts: ["Tu fais quoi ce soir ?", "Que fais-tu ce soir ?"] }),
      s("af-s4", "Nous allons à la plage.", "We are going to the beach.", { alts: ["On va à la plage."] }),
      s("af-s5", "Ils font les courses.", "They are doing the shopping.", { distractors: ["faisent"] }),
    ],
    dialogues: [
      d("af-d1", "You bump into a friend in the street.", ["Salut ! Tu vas où ?", "Hi! Where are you going?"], [
        ok("Je vais à la boulangerie. Et toi ?", "I'm going to the bakery. And you?", "aller for movement: je vais à la…"),
        no("Je fais à la boulangerie.", "I do to the bakery.", "faire = do/make. For going somewhere, use aller: je vais."),
        no("Tu vas à la boulangerie.", "You're going to the bakery.", "That's about your friend, not you."),
      ]),
    ],
  },

  "w2-expressions": {
    mcq: [
      m("x1", "« I'm hungry » →", ["J'ai faim.", "Je suis faim.", "Je fais faim."], 0, "French has hunger: avoir faim."),
      m("x2", "« It's raining » →", ["Il pleut.", "Il fait pluie.", "Il est pleut."], 0, "Rain has its own verb: il pleut."),
      m("x3", "« I need a taxi » →", ["J'ai besoin d'un taxi.", "Je suis besoin d'un taxi.", "J'ai besoin un taxi."], 0, "avoir besoin de + noun; de + un → d'un."),
      m("x4", "« Ça va ? » — the best answer:", ["Ça va bien, merci. Et toi ?", "Je vais à Paris.", "Il fait beau."], 0, "Answer the greeting and return the question."),
      m("x5", "« I'm cold » →", ["J'ai froid.", "Je suis froid.", "Il fait froid moi."], 0, "Your body feeling cold: avoir froid. (Je suis froid means 'I'm a cold person'!)"),
      m("x6", "« You're right » (formal) →", ["Vous avez raison.", "Vous êtes raison.", "Vous faites raison."], 0, "avoir raison = to be right."),
    ],
    sentences: [
      s("x-s1", "J'ai soif, je voudrais de l'eau.", "I'm thirsty, I'd like some water."),
      s("x-s2", "Il fait beau aujourd'hui.", "The weather is nice today.", { alts: ["Aujourd'hui, il fait beau."] }),
      s("x-s3", "J'ai besoin d'aide.", "I need help.", { distractors: ["suis"] }),
      s("x-s4", "Tu as raison.", "You're right. (informal)", { distractors: ["es"] }),
      s("x-s5", "Ça va très bien, merci.", "I'm very well, thanks."),
      s("x-s6", "J'ai peur des chiens.", "I'm scared of dogs."),
    ],
    dialogues: [
      d("x-d1", "A colleague notices you look tired.", ["Ça va ? Tu as l'air fatigué.", "Are you OK? You look tired."], [
        ok("Oui, j'ai sommeil. Je travaille beaucoup.", "Yes, I'm sleepy. I'm working a lot.", "avoir sommeil = to be sleepy."),
        no("Oui, je suis sommeil.", "Yes, I am sleep.", "Sleepiness takes avoir: j'ai sommeil."),
        no("Oui, il pleut.", "Yes, it's raining.", "That doesn't answer the question."),
      ]),
    ],
  },

  "w3-articles": {
    mcq: [
      m("a1", "___ pain", ["le", "la", "les"], 0, "Pain is masculine: le pain.", { en: "the bread", typeable: true }),
      m("a2", "___ baguette", ["le", "la", "l'"], 1, "Baguette is feminine: la baguette.", { en: "the baguette", typeable: true }),
      m("a3", "___ appartement", ["le", "la", "l'"], 2, "Before a vowel, le/la become l'.", { en: "the apartment", typeable: true }),
      m("a4", "Je voudrais ___ café. (a)", ["un", "une", "des"], 0, "Café is masculine: un café.", { en: "I'd like a coffee.", typeable: true }),
      m("a5", "J'ai ___ clés. (the)", ["le", "la", "les"], 2, "Plural 'the' is always les.", { en: "I have the keys.", typeable: true }),
      m("a6", "Je vais ___ boulangerie.", ["à la", "au", "à le"], 0, "Boulangerie is feminine: à la doesn't contract.", { en: "I'm going to the bakery." }),
      m("a7", "Je vais ___ cinéma.", ["au", "à le", "à la"], 0, "Cinéma is masculine: à + le → au.", { en: "I'm going to the cinema.", typeable: true }),
      m("a8", "C'est ___ voiture de Marie. (the)", ["le", "la", "un"], 1, "Voiture is feminine.", { en: "It's Marie's car.", typeable: true }),
      m("a9", "Il y a ___ problème. (a)", ["un", "une", "des"], 0, "Problème is masculine despite ending in -e.", { en: "There's a problem.", typeable: true }),
      m("a10", "Je parle ___ film. (about the)", ["du", "de le", "de la"], 0, "de + le contracts to du.", { en: "I'm talking about the film.", typeable: true }),
    ],
    sentences: [
      s("a-s1", "Je voudrais une baguette et un croissant.", "I'd like a baguette and a croissant.", { distractors: ["un", "une"] }),
      s("a-s2", "La gare est à côté de l'hôtel.", "The station is next to the hotel.", { distractors: ["le"] }),
      s("a-s3", "Les clés sont sur la table.", "The keys are on the table.", { distractors: ["le"] }),
      s("a-s4", "Il y a un problème avec la douche.", "There is a problem with the shower.", { distractors: ["une"] }),
      s("a-s5", "J'ai un rendez-vous chez le médecin.", "I have an appointment at the doctor's."),
      s("a-s6", "Je vais au marché le dimanche.", "I go to the market on Sundays.", { distractors: ["à"] }),
    ],
  },

  "w3-plurals": {
    mcq: [
      m("pl1", "un livre → des ___", ["livres", "livrees", "livre"], 0, "Regular plural: add a silent -s.", { typeable: true }),
      m("pl2", "un gâteau → des ___", ["gâteaus", "gâteaux", "gâteaues"], 1, "-eau → -eaux.", { typeable: true }),
      m("pl3", "un journal → des ___", ["journals", "journaux", "journales"], 1, "-al → -aux.", { typeable: true }),
      m("pl4", "un prix → des ___", ["prix", "prixs", "prixes"], 0, "Words ending in -s, -x, -z don't change.", { typeable: true }),
      m("pl5", "Les enfants ___ au parc. (jouer)", ["jouent", "joue", "jouons"], 0, "A plural subject takes the ils form: jouent.", { typeable: true }),
    ],
    transforms: [
      t("pl-t1", "singular → plural", "Le chat est noir.", ["Les chats sont noirs."], "Article, noun, verb and adjective all become plural."),
      t("pl-t2", "singular → plural", "La fille est contente.", ["Les filles sont contentes."], "contente → contentes (feminine plural)."),
      t("pl-t3", "singular → plural", "J'achète un gâteau.", ["J'achète des gâteaux."], "un → des, gâteau → gâteaux."),
      t("pl-t4", "singular → plural", "Il lit un journal.", ["Il lit des journaux."], "un journal → des journaux."),
      t("pl-t5", "singular → plural", "L'enfant joue dans le jardin.", ["Les enfants jouent dans le jardin."], "l'enfant → les enfants, joue → jouent."),
      t("pl-t6", "singular → plural", "Le bus est en retard.", ["Les bus sont en retard."], "Bus doesn't change in the plural; the article and verb show it."),
    ],
    sentences: [
      s("pl-s1", "Les enfants sont à l'école.", "The children are at school.", { distractors: ["est"] }),
      s("pl-s2", "J'achète des légumes au marché.", "I buy vegetables at the market."),
      s("pl-s3", "Les gâteaux sont délicieux.", "The cakes are delicious.", { distractors: ["gâteaus"] }),
    ],
  },

  "w3-adjectives": {
    mcq: [
      m("adj1", "une maison ___ (grand)", ["grand", "grande", "grands"], 1, "Feminine singular: add -e.", { en: "a big house", typeable: true }),
      m("adj2", "des voitures ___ (rouge)", ["rouge", "rouges", "rougées"], 1, "Rouge already ends in -e; just add -s for plural.", { en: "red cars", typeable: true }),
      m("adj3", "une ___ journée (beau)", ["beau", "belle", "belles"], 1, "beau → belle in the feminine.", { en: "a beautiful day", typeable: true }),
      m("adj4", "Which is natural?", ["un petit appartement", "un appartement petit", "un petite appartement"], 0, "Petit is a BAGS adjective (size): it goes before the noun."),
      m("adj5", "Elle est très ___. (gentil)", ["gentil", "gentile", "gentille"], 2, "gentil → gentille (double l).", { en: "She is very kind.", typeable: true }),
      m("adj6", "Les filles sont ___. (heureux)", ["heureux", "heureuses", "heureuxes"], 1, "-eux → -euse, plural -euses.", { en: "The girls are happy.", typeable: true }),
      m("adj7", "une voiture ___ (blanc)", ["blanc", "blanche", "blance"], 1, "blanc → blanche.", { en: "a white car", typeable: true }),
      m("adj8", "Which is correct?", ["une voiture noire", "une noire voiture", "une voiture noir"], 0, "Colours go after the noun and agree: noire."),
    ],
    sentences: [
      s("adj-s1", "C'est un grand appartement lumineux.", "It's a big bright apartment.", { distractors: ["grande"] }),
      s("adj-s2", "J'ai une petite voiture rouge.", "I have a small red car.", { distractors: ["petit", "rouges"] }),
      s("adj-s3", "Ma voisine est très gentille.", "My neighbour (f) is very kind.", { distractors: ["gentil"] }),
      s("adj-s4", "Les chambres sont grandes.", "The bedrooms are big.", { distractors: ["grands"] }),
      s("adj-s5", "C'est une belle journée.", "It's a beautiful day.", { distractors: ["beau"] }),
      s("adj-s6", "Nous avons un nouveau propriétaire.", "We have a new landlord.", { alts: ["On a un nouveau propriétaire."] }),
    ],
  },

  "w4-negation": {
    mcq: [
      m("n1", "Je ne parle ___ allemand.", ["pas", "rien", "non"], 0, "ne … pas wraps the verb.", { en: "I don't speak German.", typeable: true }),
      m("n2", "Il ___ habite pas ici.", ["ne", "n'", "non"], 1, "ne → n' before a vowel or silent h.", { en: "He doesn't live here.", typeable: true }),
      m("n3", "Je n'ai pas ___ voiture.", ["une", "de", "la"], 1, "After a negative, un/une/des become de.", { en: "I don't have a car.", typeable: true }),
      m("n4", "« I never eat meat » →", ["Je ne mange jamais de viande.", "Je mange ne jamais viande.", "Je ne jamais mange de viande."], 0, "ne … jamais wraps the verb like ne … pas."),
      m("n5", "« I don't live in Paris anymore » →", ["Je n'habite plus à Paris.", "Je ne habite plus à Paris.", "Je n'habite pas plus à Paris."], 0, "ne … plus = no longer; n' before habite."),
    ],
    transforms: [
      t("n-t1", "positive → negative", "J'ai une voiture.", ["Je n'ai pas de voiture."], "une → de after a negative."),
      t("n-t2", "positive → negative", "Il y a du pain.", ["Il n'y a pas de pain."], "du → de after a negative; ne goes before y."),
      t("n-t3", "positive → negative", "Je mange de la viande.", ["Je ne mange pas de viande."], "de la → de after a negative."),
      t("n-t4", "positive → negative", "Nous avons des enfants.", ["Nous n'avons pas d'enfants."], "des → de, which elides to d' before enfants."),
      t("n-t5", "positive → negative", "J'aime le fromage.", ["Je n'aime pas le fromage."], "Definite articles (le/la/les) don't change."),
      t("n-t6", "positive → negative", "Elle travaille le dimanche.", ["Elle ne travaille pas le dimanche."], "ne before the verb, pas after."),
    ],
    sentences: [
      s("n-s1", "Je ne comprends pas.", "I don't understand.", { distractors: ["non"] }),
      s("n-s2", "Il n'y a pas de lait.", "There's no milk.", { distractors: ["du"] }),
      s("n-s3", "Nous ne travaillons pas le dimanche.", "We don't work on Sundays.", { alts: ["On ne travaille pas le dimanche."] }),
      s("n-s4", "Je ne mange jamais de viande.", "I never eat meat.", { distractors: ["pas"] }),
      s("n-s5", "Elle n'habite plus ici.", "She doesn't live here anymore.", { distractors: ["ne"] }),
    ],
    dialogues: [
      d("n-d1", "At the supermarket checkout.", ["Vous avez la carte de fidélité ?", "Do you have the loyalty card?"], [
        ok("Non, je n'ai pas de carte.", "No, I don't have a card.", "Negative + de: je n'ai pas de carte."),
        no("Non, je n'ai pas une carte.", "No, I don't have one card.", "After a negative, une becomes de."),
        no("Non, je ai pas carte.", "No, I has not card.", "Needs elision (je n'ai) and de."),
      ]),
    ],
  },

  "w4-questions": {
    mcq: [
      m("q1", "___ est la gare ? (where)", ["Où", "Quand", "Comment"], 0, "où = where.", { en: "Where is the station?", typeable: true }),
      m("q2", "___ ça coûte ? (how much)", ["Combien", "Pourquoi", "Qui"], 0, "combien = how much / how many.", { en: "How much does it cost?", typeable: true }),
      m("q3", "Tu t'appelles ___ ? (what's your name)", ["comment", "quoi", "qui"], 0, "Literally 'you call yourself how?'", { en: "What's your name?", typeable: true }),
      m("q4", "Est-ce ___ elle travaille ici ?", ["que", "qu'", "quoi"], 1, "que elides before a vowel: est-ce qu'elle.", { en: "Does she work here?", typeable: true }),
      m("q5", "Which inversion is correct?", ["Parle-t-il anglais ?", "Parle-il anglais ?", "Il parle-t anglais ?"], 0, "Add -t- between two vowels: parle-t-il."),
      m("q6", "___ vous faites ? (what)", ["Qu'est-ce que", "Quoi est-ce", "Qui est-ce que"], 0, "qu'est-ce que = what (as object)."),
      m("q7", "___ heure est-il ?", ["Quelle", "Quel", "Quels"], 0, "Heure is feminine: quelle.", { typeable: true }),
    ],
    sentences: [
      s("q-s1", "Où est la pharmacie ?", "Where is the pharmacy?", { alts: ["La pharmacie est où ?"] }),
      s("q-s2", "Combien ça coûte ?", "How much does it cost?", { alts: ["Ça coûte combien ?", "Combien est-ce que ça coûte ?"] }),
      s("q-s3", "À quelle heure ouvre la banque ?", "What time does the bank open?", { alts: ["La banque ouvre à quelle heure ?", "À quelle heure est-ce que la banque ouvre ?", "À quelle heure la banque ouvre-t-elle ?"] }),
      s("q-s4", "Est-ce que vous parlez anglais ?", "Do you (formal) speak English?", { alts: ["Vous parlez anglais ?", "Parlez-vous anglais ?"] }),
      s("q-s5", "Pourquoi tu ne viens pas ?", "Why aren't you coming? (informal)", { alts: ["Pourquoi est-ce que tu ne viens pas ?", "Pourquoi ne viens-tu pas ?"] }),
      s("q-s6", "Qu'est-ce que tu fais ce week-end ?", "What are you doing this weekend? (informal)", { alts: ["Tu fais quoi ce week-end ?", "Que fais-tu ce week-end ?"] }),
    ],
    dialogues: [
      d("q-d1", "You're lost and a passer-by offers help.", ["Bonjour, je peux vous aider ?", "Hello, can I help you?"], [
        ok("Oui, merci ! Où est la gare, s'il vous plaît ?", "Yes, thanks! Where is the station, please?", "Question word + verb + subject, with politeness."),
        no("Oui, est la gare où ?", "Yes, is the station where?", "Put où first: Où est la gare ?"),
        no("Oui, quand est la gare ?", "Yes, when is the station?", "quand = when. You want où (where)."),
      ]),
    ],
  },

  "w4-prepositions": {
    mcq: [
      m("pr1", "J'habite ___ France.", ["en", "à", "au"], 0, "Feminine countries take en.", { en: "I live in France.", typeable: true }),
      m("pr2", "Il travaille ___ Paris.", ["à", "en", "au"], 0, "Cities take à.", { en: "He works in Paris.", typeable: true }),
      m("pr3", "Nous allons ___ Canada.", ["au", "en", "à"], 0, "Masculine countries take au.", { en: "We're going to Canada.", typeable: true }),
      m("pr4", "Je suis ___ le médecin. (at the doctor's)", ["chez", "à", "dans"], 0, "chez + person = at someone's place.", { typeable: true }),
      m("pr5", "Je vais au travail ___ pied.", ["à", "en", "par"], 0, "à pied (on foot), but en bus / en train.", { typeable: true }),
      m("pr6", "Je vais à Lyon ___ train.", ["en", "à", "par"], 0, "Vehicles you sit inside: en train, en voiture.", { typeable: true }),
      m("pr7", "Les clés sont ___ la table. (on)", ["sur", "sous", "chez"], 0, "sur = on, sous = under.", { typeable: true }),
      m("pr8", "Il habite ___ États-Unis.", ["aux", "en", "au"], 0, "Plural countries take aux.", { typeable: true }),
    ],
    sentences: [
      s("pr-s1", "J'habite en France, à Lyon.", "I live in France, in Lyon.", { distractors: ["au"] }),
      s("pr-s2", "Je vais chez le coiffeur.", "I'm going to the hairdresser's.", { distractors: ["au"] }),
      s("pr-s3", "Le chat est sous la table.", "The cat is under the table.", { distractors: ["sur"] }),
      s("pr-s4", "Je vais au bureau en métro.", "I go to the office by metro.", { distractors: ["à"] }),
      s("pr-s5", "La pharmacie est en face de la gare.", "The pharmacy is opposite the station."),
      s("pr-s6", "Je viens avec toi.", "I'm coming with you.", { distractors: ["tu"] }),
    ],
  },

  "w5-modals": {
    mcq: [
      m("md1", "Je ___ venir demain. (pouvoir)", ["peux", "peut", "pouvons"], 0, "je → peux.", { en: "I can come tomorrow.", typeable: true }),
      m("md2", "Ils ___ partir. (vouloir)", ["veulent", "voulent", "veut"], 0, "ils → veulent.", { en: "They want to leave.", typeable: true }),
      m("md3", "Nous ___ payer le loyer. (devoir)", ["devons", "doivons", "devez"], 0, "nous → devons.", { en: "We have to pay the rent.", typeable: true }),
      m("md4", "Polite order in a café:", ["Je voudrais un café, s'il vous plaît.", "Je veux café.", "Donne un café."], 0, "Je voudrais is the polite 'I would like'."),
      m("md5", "Tu peux ___ ?", ["venir", "viens", "venu"], 0, "After a modal, use the infinitive.", { en: "Can you come?", typeable: true }),
    ],
    sentences: [
      s("md-s1", "Est-ce que je peux payer par carte ?", "Can I pay by card?", { alts: ["Je peux payer par carte ?", "Puis-je payer par carte ?"] }),
      s("md-s2", "Je voudrais un café, s'il vous plaît.", "I'd like a coffee, please.", { distractors: ["veux"] }),
      s("md-s3", "Vous devez signer ici.", "You (formal) must sign here.", { distractors: ["signez"] }),
      s("md-s4", "Ils veulent visiter l'appartement.", "They want to visit the apartment.", { distractors: ["visitent"] }),
      s("md-s5", "On peut se tutoyer ?", "Can we use 'tu' with each other?", { alts: ["Est-ce qu'on peut se tutoyer ?"] }),
    ],
    dialogues: [
      d("md-d1", "An estate agent calls about a flat.", ["Vous voulez visiter l'appartement quand ?", "When do you want to visit the apartment?"], [
        ok("Je peux venir samedi matin.", "I can come on Saturday morning.", "pouvoir + infinitive: je peux venir."),
        no("Je peux viens samedi.", "I can comes Saturday.", "After peux, use the infinitive venir."),
        no("Je veux visiter hier.", "I want to visit yesterday.", "Hier means yesterday!"),
      ]),
    ],
  },

  "w5-irregular": {
    mcq: [
      m("ir1", "Je ___ le métro. (prendre)", ["prends", "prend", "prenons"], 0, "je → prends.", { en: "I take the metro.", typeable: true }),
      m("ir2", "Ils ___ demain. (venir)", ["viennent", "venent", "vient"], 0, "ils → viennent (double n).", { en: "They're coming tomorrow.", typeable: true }),
      m("ir3", "Vous ___ ? Pardon ? (dire)", ["dites", "disez", "dit"], 0, "vous dites — like vous faites and vous êtes.", { typeable: true }),
      m("ir4", "Nous ___ de l'eau. (boire)", ["buvons", "boivons", "boions"], 0, "nous → buvons.", { en: "We drink water.", typeable: true }),
      m("ir5", "Je ne ___ pas. (comprendre)", ["comprends", "comprend", "comprenons"], 0, "je → comprends, like prendre.", { en: "I don't understand.", typeable: true }),
      m("ir6", "« I know Paris well » →", ["Je connais bien Paris.", "Je sais bien Paris."], 0, "Places and people: connaître. Facts: savoir."),
    ],
    sentences: [
      s("ir-s1", "Je prends un café le matin.", "I have a coffee in the morning.", { alts: ["Le matin, je prends un café."] }),
      s("ir-s2", "Vous venez d'où ?", "Where are you (formal) from?", { alts: ["D'où venez-vous ?", "D'où est-ce que vous venez ?"] }),
      s("ir-s3", "Je ne sais pas.", "I don't know."),
      s("ir-s4", "Ils partent en vacances demain.", "They're leaving on holiday tomorrow.", { alts: ["Demain, ils partent en vacances."] }),
      s("ir-s5", "Elle lit le journal.", "She reads the newspaper.", { distractors: ["lis"] }),
      s("ir-s6", "Je comprends un peu.", "I understand a little.", { distractors: ["comprend"] }),
    ],
    dialogues: [
      d("ir-d1", "A friend invites you out.", ["Tu viens avec nous ce soir ?", "Are you coming with us tonight?"], [
        ok("Oui, je viens ! On part à quelle heure ?", "Yes, I'm coming! What time are we leaving?", "je viens + on part — both correct."),
        no("Oui, je viennent.", "Yes, I come (wrong form).", "viennent is the ils form; je viens."),
        no("Oui, je vais venu.", "Yes, I go come.", "Mixes tenses; say je viens or je vais venir."),
      ]),
    ],
  },

  "w5-ir-re": {
    mcq: [
      m("rr1", "Je ___ le travail à six heures. (finir)", ["finis", "finit", "finissons"], 0, "je → finis.", { typeable: true }),
      m("rr2", "Nous ___ un dessert. (choisir)", ["choisons", "choisissons", "choisissez"], 1, "-ir plurals add -iss-: choisissons.", { typeable: true }),
      m("rr3", "Il ___ le bus. (attendre)", ["attend", "attends", "attendt"], 0, "-re verbs: il form has no ending.", { typeable: true }),
      m("rr4", "Vous ___ au téléphone ? (répondre)", ["répondez", "répondissez", "répond"], 0, "vous → -ez.", { typeable: true }),
      m("rr5", "Ils ___ des fleurs. (vendre)", ["vendent", "vendissent", "vendons"], 0, "ils → -ent.", { typeable: true }),
    ],
    sentences: [
      s("rr-s1", "J'attends le bus.", "I'm waiting for the bus.", { distractors: ["pour"] }),
      s("rr-s2", "Le cours finit à midi.", "The class finishes at noon.", { distractors: ["finis"] }),
      s("rr-s3", "Ils vendent leur voiture.", "They are selling their car."),
      s("rr-s4", "Nous choisissons un restaurant.", "We are choosing a restaurant.", { alts: ["On choisit un restaurant."], distractors: ["choisons"] }),
    ],
  },

  "w6-reflexive": {
    mcq: [
      m("rf1", "Je ___ lève à sept heures.", ["me", "se", "te"], 0, "je → me.", { en: "I get up at seven.", typeable: true }),
      m("rf2", "Nous ___ habillons.", ["nous", "se", "vous"], 0, "nous → nous (nous nous habillons).", { en: "We get dressed.", typeable: true }),
      m("rf3", "Elle ___ couche tard.", ["se", "s'", "me"], 0, "elle → se.", { en: "She goes to bed late.", typeable: true }),
      m("rf4", "Tu ___ appelles comment ?", ["t'", "te", "s'"], 0, "te → t' before a vowel.", { en: "What's your name?", typeable: true }),
      m("rf5", "« I don't get up early » →", ["Je ne me lève pas tôt.", "Je me ne lève pas tôt.", "Je ne lève me pas tôt."], 0, "ne goes before the reflexive pronoun."),
    ],
    sentences: [
      s("rf-s1", "Je me lève à sept heures.", "I get up at seven.", { distractors: ["se"] }),
      s("rf-s2", "Elle se douche le soir.", "She showers in the evening.", { alts: ["Le soir, elle se douche."] }),
      s("rf-s3", "Nous nous promenons dans le parc.", "We go for a walk in the park.", { alts: ["On se promène dans le parc."] }),
      s("rf-s4", "Tu te couches tard ?", "Do you go to bed late? (informal)", { alts: ["Est-ce que tu te couches tard ?", "Te couches-tu tard ?"] }),
      s("rf-s5", "Je ne me réveille pas facilement.", "I don't wake up easily."),
    ],
    dialogues: [
      d("rf-d1", "Chatting about routines with a friend.", ["Tu te lèves à quelle heure le matin ?", "What time do you get up in the morning?"], [
        ok("Je me lève à sept heures.", "I get up at seven.", "me + lève: the pronoun matches je."),
        no("Je lève à sept heures.", "I raise at seven.", "Missing the reflexive pronoun: je me lève."),
        no("Tu te lèves à sept heures.", "You get up at seven.", "That's about your friend."),
      ]),
    ],
  },

  "w6-routine": {
    mcq: [
      m("rt1", "8:30 →", ["huit heures et demie", "huit heures et quart", "huit heures moins le quart"], 0, "et demie = half past."),
      m("rt2", "7:15 →", ["sept heures et quart", "sept heures quinze moins", "sept et quart heures"], 0, "et quart = quarter past."),
      m("rt3", "8:45 →", ["neuf heures moins le quart", "huit heures et demie", "neuf heures et quart"], 0, "moins le quart = quarter to (the next hour)."),
      m("rt4", "12:00 (noon) →", ["midi", "minuit", "douze heures du soir"], 0, "midi = noon, minuit = midnight."),
      m("rt5", "« Quelle heure est-il ? » means…", ["What time is it?", "How old are you?", "When is it?"], 0, "Literally 'what hour is it?'"),
      m("rt6", "« First… then… » →", ["d'abord… ensuite…", "enfin… d'abord…", "après… avant…"], 0, "d'abord, ensuite, puis, enfin sequence a routine."),
    ],
    sentences: [
      s("rt-s1", "Il est huit heures et demie.", "It's half past eight.", { distractors: ["quart"] }),
      s("rt-s2", "D'abord je prends une douche, ensuite je m'habille.", "First I take a shower, then I get dressed.", { alts: ["D'abord je me douche, ensuite je m'habille.", "D'abord je prends une douche, puis je m'habille."] }),
      s("rt-s3", "Le soir, je me couche à onze heures.", "In the evening, I go to bed at eleven.", { alts: ["Je me couche à onze heures le soir."] }),
      s("rt-s4", "Je prends le petit-déjeuner à sept heures.", "I have breakfast at seven.", { alts: ["Je prends mon petit-déjeuner à sept heures."] }),
      s("rt-s5", "Le rendez-vous est à quinze heures.", "The appointment is at 3 pm.", { alts: ["Le rendez-vous est à trois heures de l'après-midi."] }),
    ],
    dialogues: [
      d("rt-d1", "Booking a delivery slot by phone.", ["Vous êtes disponible à quelle heure ?", "What time are you available?"], [
        ok("Je suis disponible à quinze heures.", "I'm available at 3 pm.", "être disponible à + time."),
        no("Il est quinze heures.", "It is 3 pm.", "That tells the current time — not your availability."),
        no("Je suis quinze heures.", "I am 3 pm.", "Missing disponible à."),
      ]),
    ],
  },

  "w7-futur-proche": {
    mcq: [
      m("fp1", "Demain, je ___ travailler.", ["vais", "va", "allons"], 0, "je → vais + infinitive.", { en: "Tomorrow I'm going to work.", typeable: true }),
      m("fp2", "Nous allons ___ en mars. (déménager)", ["déménager", "déménageons", "déménagé"], 0, "Only aller is conjugated; the second verb stays infinitive.", { typeable: true }),
      m("fp3", "« I'm not going to come » →", ["Je ne vais pas venir.", "Je vais ne pas venir.", "Je ne vais venir pas."], 0, "ne … pas wraps aller."),
      m("fp4", "Ils ___ partir ce soir.", ["vont", "vais", "allez"], 0, "ils → vont.", { typeable: true }),
      m("fp5", "Je vais ___ coucher tôt.", ["me", "se", "te"], 0, "The reflexive pronoun still matches the subject: je vais me coucher.", { typeable: true }),
    ],
    sentences: [
      s("fp-s1", "Je vais appeler le propriétaire demain.", "I'm going to call the landlord tomorrow.", { alts: ["Demain, je vais appeler le propriétaire."], distractors: ["appelle"] }),
      s("fp-s2", "On va manger au restaurant ce soir.", "We're going to eat at the restaurant tonight.", { alts: ["Nous allons manger au restaurant ce soir.", "Ce soir, on va manger au restaurant.", "Ce soir, nous allons manger au restaurant."] }),
      s("fp-s3", "Elle va commencer un nouveau travail.", "She is going to start a new job.", { alts: ["Elle va commencer un nouvel emploi."] }),
      s("fp-s4", "Ils ne vont pas venir.", "They're not going to come.", { distractors: ["vont-pas"] }),
      s("fp-s5", "Je vais me reposer ce week-end.", "I'm going to rest this weekend.", { alts: ["Ce week-end, je vais me reposer."], distractors: ["se"] }),
    ],
  },

  "w7-plans": {
    mcq: [
      m("pn1", "« tomorrow » →", ["demain", "hier", "aujourd'hui"], 0, "hier = yesterday, aujourd'hui = today."),
      m("pn2", "« next week » →", ["la semaine prochaine", "la semaine dernière", "cette semaine passée"], 0, "prochain(e) = next, dernier/dernière = last."),
      m("pn3", "Accept an invitation warmly:", ["Avec plaisir !", "Pas du tout !", "De rien !"], 0, "Avec plaisir = with pleasure."),
      m("pn4", "« Do you fancy going to the cinema? » →", ["Ça te dit d'aller au cinéma ?", "Ça te dit aller cinéma ?", "Tu dis le cinéma ?"], 0, "Ça te dit de + infinitive (de → d' before aller)."),
      m("pn5", "Decline politely:", ["Désolé, je ne peux pas.", "Non, je ne veux pas toi.", "Je pas peux."], 0, "Désolé(e), je ne peux pas is polite and natural."),
      m("pn6", "« in two days » →", ["dans deux jours", "il y a deux jours", "depuis deux jours"], 0, "dans + time = in (the future)."),
    ],
    sentences: [
      s("pn-s1", "Ce week-end, je vais visiter Versailles.", "This weekend, I'm going to visit Versailles.", { alts: ["Je vais visiter Versailles ce week-end."] }),
      s("pn-s2", "Tu es libre samedi soir ?", "Are you free on Saturday evening?", { alts: ["Est-ce que tu es libre samedi soir ?", "Es-tu libre samedi soir ?"] }),
      s("pn-s3", "On se retrouve devant le cinéma ?", "Shall we meet in front of the cinema?"),
      s("pn-s4", "Désolé, je ne peux pas, je travaille.", "Sorry, I can't, I'm working.", { alts: ["Désolée, je ne peux pas, je travaille."] }),
      s("pn-s5", "La semaine prochaine, nous allons partir en vacances.", "Next week, we are going on holiday.", { alts: ["Nous allons partir en vacances la semaine prochaine.", "La semaine prochaine, on va partir en vacances."] }),
    ],
    dialogues: [
      d("pn-d1", "A friend suggests dinner.", ["Ça te dit de manger ensemble vendredi ?", "Do you fancy eating together on Friday?"], [
        ok("Avec plaisir ! On se retrouve où ?", "With pleasure! Where shall we meet?", "Accept + propose next step."),
        no("Oui, j'ai mangé vendredi.", "Yes, I ate on Friday.", "That's the past — the invitation is about the future."),
        no("De rien, vendredi.", "You're welcome, Friday.", "De rien answers a thank-you."),
      ]),
    ],
  },

  "w8-pc-avoir": {
    mcq: [
      m("pa1", "Hier, j'___ travaillé.", ["ai", "suis", "as"], 0, "Most verbs use avoir: j'ai travaillé.", { typeable: true }),
      m("pa2", "Nous avons ___ le bus. (attendre)", ["attendu", "attendé", "attendi"], 0, "-re → -u.", { typeable: true }),
      m("pa3", "Tu as ___ ? (finir)", ["fini", "finé", "finu"], 0, "-ir → -i.", { typeable: true }),
      m("pa4", "Ils ___ mangé au restaurant.", ["ont", "sont", "avons"], 0, "ils → ont + participle.", { typeable: true }),
      m("pa5", "« I didn't eat » →", ["Je n'ai pas mangé.", "Je n'ai mangé pas.", "Je ne pas ai mangé."], 0, "ne … pas wraps the auxiliary."),
    ],
    sentences: [
      s("pa-s1", "Hier soir, j'ai regardé un film.", "Last night I watched a film.", { alts: ["J'ai regardé un film hier soir."] }),
      s("pa-s2", "Nous avons trouvé un appartement.", "We found an apartment.", { alts: ["On a trouvé un appartement."], distractors: ["sommes"] }),
      s("pa-s3", "Tu as réservé une table ?", "Did you book a table?", { alts: ["Est-ce que tu as réservé une table ?", "As-tu réservé une table ?"] }),
      s("pa-s4", "Il n'a pas fini son travail.", "He didn't finish his work."),
      s("pa-s5", "J'ai oublié mes clés.", "I forgot my keys.", { distractors: ["oublie"] }),
    ],
    dialogues: [
      d("pa-d1", "Monday morning at work.", ["Tu as passé un bon week-end ?", "Did you have a good weekend?"], [
        ok("Oui, j'ai visité un musée et j'ai mangé avec des amis.", "Yes, I visited a museum and ate with friends.", "Two passé composé verbs with avoir."),
        no("Oui, je suis visité un musée.", "Yes, I am visited a museum.", "Visiter uses avoir: j'ai visité."),
        no("Oui, je visite demain.", "Yes, I visit tomorrow.", "The question is about the past."),
      ]),
    ],
  },

  "w8-pc-irregular": {
    mcq: [
      m("pi1", "J'ai ___ les courses. (faire)", ["fait", "faisé", "fai"], 0, "faire → fait.", { typeable: true }),
      m("pi2", "Tu as ___ le métro ? (prendre)", ["pris", "prendu", "prené"], 0, "prendre → pris.", { typeable: true }),
      m("pi3", "Nous avons ___ un film. (voir)", ["vu", "voyé", "voi"], 0, "voir → vu.", { typeable: true }),
      m("pi4", "Il a ___ un café. (boire)", ["bu", "boiru", "buvé"], 0, "boire → bu.", { typeable: true }),
      m("pi5", "Elle a ___ « bonjour ». (dire)", ["dit", "disé", "diu"], 0, "dire → dit.", { typeable: true }),
      m("pi6", "J'ai ___ attendre. (devoir)", ["dû", "devé", "du"], 0, "devoir → dû (with a circumflex, to distinguish it from du).", { typeable: true }),
    ],
    sentences: [
      s("pi-s1", "J'ai fait les courses ce matin.", "I did the shopping this morning.", { alts: ["Ce matin, j'ai fait les courses."] }),
      s("pi-s2", "Nous avons pris le train.", "We took the train.", { alts: ["On a pris le train."], distractors: ["prendu"] }),
      s("pi-s3", "Tu as vu le message ?", "Did you see the message?", { alts: ["Est-ce que tu as vu le message ?", "As-tu vu le message ?"] }),
      s("pi-s4", "J'ai eu un problème avec la banque.", "I had a problem with the bank."),
      s("pi-s5", "Elle a lu le contrat.", "She read the contract.", { distractors: ["lisé"] }),
      s("pi-s6", "Je n'ai pas compris.", "I didn't understand.", { distractors: ["comprendu"] }),
    ],
  },

  "w9-pc-etre": {
    mcq: [
      m("pe1", "Elle ___ allée au marché.", ["est", "a", "es"], 0, "Aller uses être.", { typeable: true }),
      m("pe2", "Ils sont ___ hier. (arriver)", ["arrivés", "arrivé", "arrivées"], 0, "Masculine plural subject → -s.", { typeable: true }),
      m("pe3", "Marie est ___ en retard. (arriver)", ["arrivée", "arrivé", "arrivés"], 0, "Feminine singular subject → -e.", { typeable: true }),
      m("pe4", "Nous ___ restés à la maison.", ["sommes", "avons", "sont"], 0, "Rester uses être.", { typeable: true }),
      m("pe5", "Je me suis ___ tôt. (se lever — a man speaking)", ["levé", "levée", "levés"], 0, "A man speaking: no agreement ending.", { typeable: true }),
      m("pe6", "Which verb takes être in the passé composé?", ["partir", "manger", "regarder"], 0, "Partir is a movement verb from the 'House of être'."),
      m("pe7", "Elles ___ sorties hier soir.", ["sont", "ont", "est"], 0, "Sortir uses être; elles → sont.", { typeable: true }),
    ],
    sentences: [
      s("pe-s1", "Je suis arrivé en France il y a un an.", "I arrived in France a year ago.", { alts: ["Je suis arrivée en France il y a un an."], distractors: ["ai"] }),
      s("pe-s2", "Elle est partie à huit heures.", "She left at eight.", { distractors: ["parti", "a"] }),
      s("pe-s3", "Nous sommes allés au cinéma.", "We went to the cinema.", { alts: ["Nous sommes allées au cinéma.", "On est allés au cinéma.", "On est allé au cinéma.", "On est allées au cinéma."] }),
      s("pe-s4", "Ils se sont levés tard.", "They got up late.", { distractors: ["ont"] }),
      s("pe-s5", "Tu es rentré à quelle heure ?", "What time did you get home? (to a man)", { alts: ["À quelle heure es-tu rentré ?", "À quelle heure tu es rentré ?", "À quelle heure est-ce que tu es rentré ?"] }),
    ],
    dialogues: [
      d("pe-d1", "A friend asks about your Saturday.", ["Qu'est-ce que tu as fait samedi ?", "What did you do on Saturday?"], [
        ok("Je suis allée au marché, puis je suis restée à la maison.", "I went to the market, then I stayed home.", "aller and rester take être (with -e for a woman)."),
        no("J'ai allé au marché.", "I have gone to the market.", "Aller takes être: je suis allé(e)."),
        no("Je vais au marché samedi.", "I'm going to the market on Saturday.", "That's the present/future, not what you did."),
      ]),
    ],
  },

  "w9-time": {
    mcq: [
      m("tm1", "« I arrived two years ago » →", ["Je suis arrivé il y a deux ans.", "Je suis arrivé depuis deux ans.", "Je suis arrivé pendant deux ans."], 0, "il y a + time = ago."),
      m("tm2", "« I've lived here for two years » (and still do) →", ["J'habite ici depuis deux ans.", "J'ai habité ici il y a deux ans.", "J'habite ici il y a deux ans."], 0, "depuis + present tense for something still true."),
      m("tm3", "« I worked for three hours » →", ["J'ai travaillé pendant trois heures.", "J'ai travaillé depuis trois heures.", "J'ai travaillé il y a trois heures."], 0, "pendant = for a finished period."),
      m("tm4", "« yesterday evening » →", ["hier soir", "demain soir", "ce soir"], 0, "hier = yesterday."),
      m("tm5", "« last week » →", ["la semaine dernière", "la semaine prochaine", "la dernière semaine prochaine"], 0, "dernier/dernière = last."),
    ],
    sentences: [
      s("tm-s1", "J'apprends le français depuis six mois.", "I've been learning French for six months.", { distractors: ["pendant"] }),
      s("tm-s2", "Hier, il a plu toute la journée.", "Yesterday it rained all day.", { alts: ["Il a plu toute la journée hier."] }),
      s("tm-s3", "Nous avons déménagé il y a trois semaines.", "We moved three weeks ago.", { alts: ["On a déménagé il y a trois semaines."], distractors: ["depuis"] }),
      s("tm-s4", "J'ai dormi pendant dix heures.", "I slept for ten hours.", { alts: ["J'ai dormi dix heures."] }),
      s("tm-s5", "La semaine dernière, je suis allé à Lyon.", "Last week I went to Lyon.", { alts: ["La semaine dernière, je suis allée à Lyon.", "Je suis allé à Lyon la semaine dernière.", "Je suis allée à Lyon la semaine dernière."] }),
    ],
  },

  "w10-object-pronouns": {
    mcq: [
      m("op1", "Tu vois le bus ? — Oui, je ___ vois.", ["le", "la", "lui"], 0, "le bus (m) → le.", { typeable: true }),
      m("op2", "Tu connais Marie ? — Oui, je ___ connais.", ["la", "le", "lui"], 0, "Marie is a direct object (f) → la.", { typeable: true }),
      m("op3", "Tu parles au propriétaire ? — Oui, je ___ parle.", ["lui", "le", "leur"], 0, "parler à + person → lui.", { typeable: true }),
      m("op4", "Tu écris à tes parents ? — Oui, je ___ écris.", ["leur", "les", "lui"], 0, "à + plural people → leur.", { typeable: true }),
      m("op5", "Tu aimes les croissants ? — Oui, je ___ aime.", ["les", "l'", "leur"], 0, "les croissants → les.", { typeable: true }),
      m("op6", "Je vais ___ appeler demain. (him)", ["l'", "le", "lui"], 0, "appeler takes a direct object; le → l' before a vowel.", { typeable: true }),
    ],
    transforms: [
      t("op-t1", "replace the object with a pronoun", "Je regarde la télé.", ["Je la regarde."], "la télé (f) → la, before the verb."),
      t("op-t2", "replace the object with a pronoun", "Il prend le bus.", ["Il le prend."], "le bus → le."),
      t("op-t3", "replace the object with a pronoun", "Nous aimons les enfants.", ["Nous les aimons."], "les enfants → les."),
      t("op-t4", "replace the object with a pronoun", "Je téléphone à ma mère.", ["Je lui téléphone."], "à + person → lui."),
      t("op-t5", "replace the object with a pronoun", "Elle parle aux voisins.", ["Elle leur parle."], "aux voisins → leur."),
      t("op-t6", "replace the object with a pronoun", "Je vais appeler le médecin.", ["Je vais l'appeler."], "The pronoun goes before the infinitive it belongs to."),
      t("op-t7", "replace the object with a pronoun", "Je ne vois pas la gare.", ["Je ne la vois pas."], "ne + pronoun + verb + pas."),
    ],
    sentences: [
      s("op-s1", "Je le vois demain.", "I'm seeing him tomorrow.", { alts: ["Demain, je le vois."], distractors: ["lui"] }),
      s("op-s2", "Je lui envoie un message.", "I'm sending him a message.", { distractors: ["le"] }),
      s("op-s3", "Tu peux m'aider ?", "Can you help me?", { alts: ["Est-ce que tu peux m'aider ?", "Peux-tu m'aider ?"] }),
      s("op-s4", "Je vais l'appeler ce soir.", "I'm going to call him tonight.", { alts: ["Ce soir, je vais l'appeler."] }),
    ],
  },

  "w10-y-en": {
    mcq: [
      m("ye1", "Tu vas à la gare ? — Oui, j'___ vais.", ["y", "en", "le"], 0, "y replaces à + place.", { typeable: true }),
      m("ye2", "Tu as des enfants ? — Oui, j'___ ai deux.", ["en", "y", "les"], 0, "en replaces a quantity of something.", { typeable: true }),
      m("ye3", "Il y a du pain ? — Non, il n'y ___ a pas.", ["en", "y", "le"], 0, "du pain → en.", { typeable: true }),
      m("ye4", "« Let's go! » →", ["On y va !", "On en va !", "On va y !"], 0, "A fixed expression with y."),
      m("ye5", "Tu veux du café ? — Oui, j'___ veux bien.", ["en", "y", "le"], 0, "du café → en.", { typeable: true }),
    ],
    transforms: [
      t("ye-t1", "replace with y or en", "Je vais à Paris.", ["J'y vais."], "à Paris → y."),
      t("ye-t2", "replace with y or en", "Nous habitons en France.", ["Nous y habitons."], "en France (a place) → y."),
      t("ye-t3", "replace with y or en", "Je voudrais trois croissants.", ["J'en voudrais trois."], "Keep the number, replace the noun with en."),
      t("ye-t4", "replace with y or en", "Elle mange du fromage.", ["Elle en mange."], "du fromage → en."),
      t("ye-t5", "replace with y or en", "Il n'a pas de voiture.", ["Il n'en a pas."], "de voiture → en; ne … pas surrounds en + verb."),
    ],
    sentences: [
      s("ye-s1", "J'y vais demain.", "I'm going there tomorrow.", { alts: ["Demain, j'y vais."] }),
      s("ye-s2", "J'en voudrais deux, s'il vous plaît.", "I'd like two (of them), please."),
      s("ye-s3", "Il n'y en a plus.", "There isn't any left."),
    ],
  },

  "w10-connectors": {
    mcq: [
      m("cn1", "Je reste à la maison ___ je suis malade.", ["parce que", "mais", "donc"], 0, "parce que gives a reason.", { typeable: true }),
      m("cn2", "Il pleut, ___ je prends un parapluie.", ["donc", "parce que", "mais"], 0, "donc gives a consequence.", { typeable: true }),
      m("cn3", "J'aime Paris, ___ c'est cher.", ["mais", "donc", "parce que"], 0, "mais introduces a contrast.", { typeable: true }),
      m("cn4", "___ il fait beau, on va au parc.", ["Quand", "Pourquoi", "Mais"], 0, "quand = when.", { typeable: true }),
      m("cn5", "parce que + il →", ["parce qu'il", "parce que il", "parce qu il"], 0, "que elides before a vowel."),
      m("cn6", "si + il →", ["s'il", "si il", "si'l"], 0, "si elides only before il/ils: s'il (but si elle)."),
    ],
    sentences: [
      s("cn-s1", "Je suis fatigué parce que je travaille beaucoup.", "I'm tired because I work a lot.", { alts: ["Je suis fatiguée parce que je travaille beaucoup."] }),
      s("cn-s2", "Quand j'ai le temps, je fais du sport.", "When I have time, I do sport.", { alts: ["Je fais du sport quand j'ai le temps."] }),
      s("cn-s3", "Si tu veux, on peut manger ensemble.", "If you want, we can eat together.", { alts: ["On peut manger ensemble si tu veux.", "Si tu veux, nous pouvons manger ensemble."] }),
      s("cn-s4", "Il pleut, donc nous restons à la maison.", "It's raining, so we're staying at home.", { alts: ["Il pleut, alors nous restons à la maison.", "Il pleut, donc on reste à la maison.", "Il pleut, alors on reste à la maison."] }),
      s("cn-s5", "J'aime mon quartier, mais il est bruyant.", "I like my neighbourhood, but it's noisy."),
    ],
  },

  "w11-listening": {
    mcq: [
      m("ls1", "When does the shop open?", ["9:30", "9:15", "10:30"], 0, "« neuf heures et demie » = 9:30.", { audio: "Le magasin ouvre à neuf heures et demie." }),
      m("ls2", "How much does it cost?", ["€22", "€12", "€20"], 0, "« vingt-deux euros » = €22.", { audio: "Ça coûte vingt-deux euros." }),
      m("ls3", "Where should you go?", ["Second street on the left", "Second street on the right", "First street on the left"], 0, "« deuxième » = second, « à gauche » = on the left.", { audio: "Prenez la deuxième rue à gauche." }),
      m("ls4", "What's the situation?", ["The doctor is away today", "The doctor is running late", "The office is closed tomorrow"], 0, "« absent aujourd'hui » = away today.", { audio: "Je suis désolé, le docteur est absent aujourd'hui." }),
      m("ls5", "How much is the rent?", ["€800 per month, charges included", "€800 per week", "€80 per month"], 0, "« huit cents euros par mois, charges comprises ».", { audio: "Le loyer est de huit cents euros par mois, charges comprises." }),
      m("ls6", "When does the parcel arrive?", ["Thursday, 10am–12pm", "Tuesday, 10am–12pm", "Thursday, 10pm–midnight"], 0, "« jeudi entre dix heures et midi ».", { audio: "Votre colis arrive jeudi entre dix heures et midi." }),
    ],
    sentences: [
      s("ls-s1", "Le train part à quinze heures dix.", "The train leaves at 3:10 pm."),
      s("ls-s2", "Ça fait douze euros cinquante.", "That's twelve euros fifty."),
      s("ls-s3", "La pharmacie est à droite, après la banque.", "The pharmacy is on the right, after the bank."),
      s("ls-s4", "Vous pouvez répéter, s'il vous plaît ?", "Can you repeat, please?", { alts: ["Pouvez-vous répéter, s'il vous plaît ?"] }),
      s("ls-s5", "Le rendez-vous est mardi à neuf heures.", "The appointment is on Tuesday at nine."),
      s("ls-s6", "Nous sommes fermés le dimanche.", "We are closed on Sundays."),
    ],
  },

  "w11-situations": {
    mcq: [
      m("si1", "Ask someone to repeat, politely:", ["Pardon, vous pouvez répéter ?", "Quoi ?", "Répète !"], 0, "Pardon + vous pouvez… is polite; « quoi ? » is rude to strangers."),
      m("si2", "To make an appointment:", ["Je voudrais prendre rendez-vous.", "Je voudrais faire rendez-vous.", "Je voudrais avoir un rendez-vous maintenant."], 0, "prendre rendez-vous is the fixed expression."),
      m("si3", "Answering the phone: « Hello? » →", ["Allô ?", "Salut ?", "Bonjour toi ?"], 0, "Allô is used only on the phone."),
      m("si4", "In a restaurant, « the bill, please » →", ["L'addition, s'il vous plaît.", "La facture, s'il te plaît.", "Le billet, s'il vous plaît."], 0, "l'addition in restaurants; une facture is an invoice."),
    ],
    sentences: [
      s("si-s1", "Je voudrais prendre rendez-vous, s'il vous plaît.", "I'd like to make an appointment, please.", { distractors: ["faire"] }),
      s("si-s2", "Il y a un problème avec le chauffage.", "There is a problem with the heating."),
      s("si-s3", "Vous pouvez parler plus lentement ?", "Can you speak more slowly?", { alts: ["Pouvez-vous parler plus lentement ?", "Est-ce que vous pouvez parler plus lentement ?"] }),
      s("si-s4", "L'addition, s'il vous plaît.", "The bill, please."),
      s("si-s5", "Je suis disponible lundi matin.", "I'm available on Monday morning."),
    ],
    dialogues: [
      d("si-d1", "At a café counter.", ["Bonjour, qu'est-ce que je vous sers ?", "Hello, what can I get you?"], [
        ok("Un café crème, s'il vous plaît.", "A white coffee, please.", "Item + s'il vous plaît — exactly what locals say."),
        no("Je sers un café.", "I serve a coffee.", "You're the customer, not the waiter!"),
        no("Tu me donnes un café.", "You give me a coffee.", "Too familiar with a stranger — use vous / s'il vous plaît."),
      ]),
      d("si-d2", "Calling a doctor's surgery.", ["Cabinet du docteur Martin, bonjour.", "Doctor Martin's surgery, hello."], [
        ok("Bonjour, je voudrais prendre rendez-vous, s'il vous plaît.", "Hello, I'd like to make an appointment, please.", "Polite and uses the fixed phrase prendre rendez-vous."),
        no("Bonjour, je veux le docteur maintenant.", "Hello, I want the doctor now.", "Too abrupt — je voudrais is softer."),
        no("Au revoir, docteur.", "Goodbye, doctor.", "That ends the call."),
      ]),
      d("si-d3", "You phone your landlord about a problem.", ["Allô ? Oui, c'est Monsieur Bernard.", "Hello? Yes, it's Mr Bernard."], [
        ok("Bonjour Monsieur, il y a un problème avec le chauffage.", "Hello sir, there's a problem with the heating.", "Polite greeting + il y a un problème avec…"),
        no("Salut Bernard, le chauffage est cassé, quoi.", "Hey Bernard, the heating's broken, like.", "Far too informal for a landlord."),
        no("Bonjour, je suis le chauffage.", "Hello, I am the heating.", "You're not the heating!"),
      ]),
      d("si-d4", "A recruiter starts a phone interview.", ["Pouvez-vous vous présenter en quelques mots ?", "Can you introduce yourself in a few words?"], [
        ok("Bien sûr. Je m'appelle Sam et je travaille dans le marketing depuis cinq ans.", "Of course. My name is Sam and I've worked in marketing for five years.", "Name + experience with depuis + present: very natural."),
        no("Oui, tu peux.", "Yes, you can.", "That doesn't introduce you — and tu is inappropriate."),
        no("Je présente moi.", "I present me.", "The reflexive is je me présente."),
      ]),
      d("si-d5", "A ticket inspector says something quickly.", ["Il faut valider le billet avant de monter.", "You must validate the ticket before boarding."], [
        ok("Pardon, vous pouvez répéter plus lentement ?", "Sorry, can you repeat more slowly?", "Asking for clarification politely is a key survival skill."),
        no("Oui, je valide hier.", "Yes, I validate yesterday.", "Mixes present with hier."),
        no("Je ne parle pas.", "I don't speak.", "Doesn't help — ask them to repeat."),
      ]),
    ],
  },
};

export function bankFor(skillId: string): SkillBank {
  return BANK[skillId] ?? {};
}

import type { Lang } from "./languages";
import { DE_SCENARIOS } from "./de/scenarios";

/**
 * Conversation scenarios. Each has a scripted branching path (works offline)
 * and a brief used when an AI partner is configured.
 * `fr` fields hold the course language's text; `register` "vous"/"tu" means formal/informal
 * (Sie/du in German).
 */
export interface ScriptReply {
  fr: string;
  en: string;
  next: string | null;
  /** false = understandable but flawed (too informal, grammar slip…) */
  ok?: boolean;
  why?: string;
  /** Extra words that identify this reply when the learner types freely. */
  keywords?: string[];
}

export interface ScriptNode {
  id: string;
  them: { fr: string; en: string };
  replies: ScriptReply[];
}

export interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  icon: "coffee" | "home" | "key" | "map" | "stethoscope" | "wrench" | "briefcase" | "users";
  partner: string;
  register: "vous" | "tu";
  goal: string;
  minWeek: number;
  skills: string[];
  vocabulary: { fr: string; en: string }[];
  start: string;
  nodes: Record<string, ScriptNode>;
}

const n = (id: string, fr: string, en: string, replies: ScriptReply[]): ScriptNode => ({ id, them: { fr, en }, replies });
const r = (fr: string, en: string, next: string | null, extra: Partial<ScriptReply> = {}): ScriptReply => ({ fr, en, next, ok: true, ...extra });

export const SCENARIOS: Scenario[] = [
  {
    id: "cafe", title: "Ordering at a café", subtitle: "Order a drink and something to eat, then pay.", icon: "coffee",
    partner: "a friendly waiter at a Parisian café", register: "vous", goal: "Order a drink and a snack, ask the price, and pay.", minWeek: 1,
    skills: ["w1-basic-sentences", "w5-modals", "w11-situations"],
    vocabulary: [{ fr: "un café crème", en: "a white coffee" }, { fr: "un croissant", en: "a croissant" }, { fr: "l'addition", en: "the bill" }, { fr: "par carte", en: "by card" }, { fr: "sur place / à emporter", en: "eat in / take away" }],
    start: "c1",
    nodes: {
      c1: n("c1", "Bonjour ! Qu'est-ce que je vous sers ?", "Hello! What can I get you?", [
        r("Bonjour ! Un café crème, s'il vous plaît.", "Hello! A white coffee, please.", "c2", { keywords: ["cafe", "creme"] }),
        r("Je voudrais un thé, s'il vous plaît.", "I'd like a tea, please.", "c2", { keywords: ["the", "voudrais"] }),
        r("Donne-moi un café.", "Give me a coffee.", "c2", { ok: false, why: "Donne-moi is the tu form and sounds abrupt with a waiter. Say « Un café, s'il vous plaît » or « Je voudrais un café ».", keywords: ["donne"] }),
      ]),
      c2: n("c2", "Très bien. Et avec ceci ? Un croissant, peut-être ?", "Very good. Anything else? A croissant, perhaps?", [
        r("Oui, un croissant, s'il vous plaît.", "Yes, a croissant, please.", "c3", { keywords: ["oui", "croissant"] }),
        r("Non merci, c'est tout.", "No thanks, that's all.", "c3", { keywords: ["non", "tout"] }),
        r("Oui, je suis un croissant.", "Yes, I am a croissant.", "c3", { ok: false, why: "« Je suis » means 'I am'. To accept, simply say « Oui, un croissant, s'il vous plaît »." }),
      ]),
      c3: n("c3", "C'est sur place ou à emporter ?", "Is it to eat in or take away?", [
        r("Sur place, s'il vous plaît.", "To eat in, please.", "c4", { keywords: ["place"] }),
        r("À emporter, merci.", "Take away, thanks.", "c4", { keywords: ["emporter"] }),
      ]),
      c4: n("c4", "Parfait. Ça fait six euros cinquante.", "Perfect. That's six euros fifty.", [
        r("Je peux payer par carte ?", "Can I pay by card?", "c5", { keywords: ["carte", "payer"] }),
        r("Voilà, merci beaucoup !", "Here you go, thank you very much!", "c5", { keywords: ["voila", "merci"] }),
        r("Je peux paye par carte ?", "Can I pays by card?", "c5", { ok: false, why: "After pouvoir, use the infinitive: « Je peux payer par carte ? »", keywords: ["paye"] }),
      ]),
      c5: n("c5", "Bien sûr. Merci, bonne journée !", "Of course. Thank you, have a good day!", []),
    },
  },
  {
    id: "neighbour", title: "Meeting a neighbour", subtitle: "Introduce yourself to the person next door.", icon: "home",
    partner: "a retired neighbour, Madame Leroy, who is curious and kind", register: "vous", goal: "Introduce yourself, say where you're from and what you do.", minWeek: 1,
    skills: ["w1-pronouns", "w1-basic-sentences", "w2-etre"],
    vocabulary: [{ fr: "enchanté(e)", en: "nice to meet you" }, { fr: "le voisin / la voisine", en: "the neighbour" }, { fr: "je viens de…", en: "I come from…" }, { fr: "je travaille comme…", en: "I work as…" }, { fr: "l'immeuble", en: "the building" }],
    start: "n1",
    nodes: {
      n1: n("n1", "Bonjour ! Vous êtes le nouveau voisin du troisième ?", "Hello! Are you the new neighbour on the third floor?", [
        r("Oui, bonjour ! Je m'appelle Sam. Enchanté !", "Yes, hello! My name is Sam. Nice to meet you!", "n2", { keywords: ["appelle", "enchante"] }),
        r("Oui, c'est moi. J'habite ici depuis une semaine.", "Yes, that's me. I've lived here for a week.", "n2", { keywords: ["habite", "semaine", "moi"] }),
        r("Oui, tu es la voisine ?", "Yes, are you the neighbour?", "n2", { ok: false, why: "With an older neighbour you've just met, use vous: « Vous êtes la voisine ? »", keywords: ["tu"] }),
      ]),
      n2: n("n2", "Enchantée ! Moi, c'est Madame Leroy. Vous venez d'où ?", "Nice to meet you! I'm Madame Leroy. Where are you from?", [
        r("Je viens d'Angleterre, de Londres.", "I'm from England, from London.", "n3", { keywords: ["angleterre", "londres", "viens"] }),
        r("Je suis anglais, mais j'habite en France maintenant.", "I'm English, but I live in France now.", "n3", { keywords: ["anglais", "anglaise", "france"] }),
        r("Je suis de Angleterre.", "I am from England.", "n3", { ok: false, why: "de elides before a vowel: « Je viens d'Angleterre »." }),
      ]),
      n3: n("n3", "Ah, très bien ! Et qu'est-ce que vous faites dans la vie ?", "Oh, lovely! And what do you do for a living?", [
        r("Je travaille dans le marketing.", "I work in marketing.", "n4", { keywords: ["travaille"] }),
        r("Je cherche du travail en ce moment.", "I'm looking for work at the moment.", "n4", { keywords: ["cherche", "travail"] }),
        r("Je suis un professeur.", "I am a teacher.", "n4", { ok: false, why: "No article before a profession after être: « Je suis professeur »." }),
      ]),
      n4: n("n4", "Si vous avez besoin de quelque chose, n'hésitez pas !", "If you need anything, don't hesitate!", [
        r("C'est très gentil, merci beaucoup !", "That's very kind, thank you very much!", "n5", { keywords: ["gentil", "merci"] }),
        r("Merci ! Bonne journée, Madame Leroy.", "Thanks! Have a good day, Madame Leroy.", "n5", { keywords: ["journee"] }),
      ]),
      n5: n("n5", "Bonne journée à vous aussi !", "Have a good day too!", []),
    },
  },
  {
    id: "landlord", title: "Calling your landlord", subtitle: "Report a broken heater and arrange a repair.", icon: "key",
    partner: "Monsieur Bernard, a polite but busy landlord", register: "vous", goal: "Explain the problem, say since when, and agree on a time for the repair.", minWeek: 2,
    skills: ["w2-avoir", "w4-negation", "w9-time", "w11-situations"],
    vocabulary: [{ fr: "le chauffage", en: "the heating" }, { fr: "ne marche pas", en: "doesn't work" }, { fr: "depuis hier", en: "since yesterday" }, { fr: "un réparateur", en: "a repair person" }, { fr: "je suis disponible", en: "I'm available" }],
    start: "l1",
    nodes: {
      l1: n("l1", "Allô, oui ? Monsieur Bernard à l'appareil.", "Hello? Mr Bernard speaking.", [
        r("Bonjour Monsieur, c'est Sam, du troisième étage.", "Hello sir, it's Sam, from the third floor.", "l2", { keywords: ["bonjour", "etage"] }),
        r("Bonjour, je suis votre locataire, rue Victor Hugo.", "Hello, I'm your tenant on rue Victor Hugo.", "l2", { keywords: ["locataire"] }),
        r("Salut Bernard !", "Hi Bernard!", "l2", { ok: false, why: "Too familiar for a landlord. Use « Bonjour Monsieur ».", keywords: ["salut"] }),
      ]),
      l2: n("l2", "Ah, bonjour. Qu'est-ce qui se passe ?", "Ah, hello. What's going on?", [
        r("Le chauffage ne marche pas.", "The heating isn't working.", "l3", { keywords: ["chauffage", "marche"] }),
        r("Il y a un problème avec le chauffage.", "There's a problem with the heating.", "l3", { keywords: ["probleme", "chauffage"] }),
        r("Le chauffage marche pas.", "The heating not working.", "l3", { ok: false, why: "In speech people drop « ne », but in a polite call keep it: « Le chauffage ne marche pas »." }),
      ]),
      l3: n("l3", "D'accord. Depuis quand ?", "OK. Since when?", [
        r("Depuis hier soir.", "Since last night.", "l4", { keywords: ["hier", "depuis"] }),
        r("Depuis deux jours. Il fait très froid.", "For two days. It's very cold.", "l4", { keywords: ["jours", "froid"] }),
        r("Il y a hier.", "Ago yesterday.", "l4", { ok: false, why: "Use « depuis hier » (since yesterday). « Il y a » needs a duration: il y a deux jours." }),
      ]),
      l4: n("l4", "Je vais appeler un réparateur. Vous êtes disponible demain matin ?", "I'll call a repair person. Are you available tomorrow morning?", [
        r("Oui, je suis disponible à partir de neuf heures.", "Yes, I'm available from nine o'clock.", "l5", { keywords: ["disponible", "heures"] }),
        r("Non, je travaille. Demain après-midi, c'est possible ?", "No, I'm working. Is tomorrow afternoon possible?", "l5", { keywords: ["apres-midi", "possible", "travaille"] }),
      ]),
      l5: n("l5", "Très bien, je vous confirme par SMS. Bonne soirée !", "Very good, I'll confirm by text. Have a good evening!", []),
    },
  },
  {
    id: "directions", title: "Asking for directions", subtitle: "Find the nearest metro station.", icon: "map",
    partner: "a helpful passer-by in Lyon", register: "vous", goal: "Ask where something is, understand left/right, and check the distance.", minWeek: 3,
    skills: ["w4-questions", "w4-prepositions", "w11-listening"],
    vocabulary: [{ fr: "à gauche / à droite", en: "on the left / on the right" }, { fr: "tout droit", en: "straight on" }, { fr: "la station de métro", en: "the metro station" }, { fr: "c'est loin ?", en: "is it far?" }, { fr: "à pied", en: "on foot" }],
    start: "d1",
    nodes: {
      d1: n("d1", "Oui ? Je peux vous aider ?", "Yes? Can I help you?", [
        r("Excusez-moi, où est la station de métro, s'il vous plaît ?", "Excuse me, where is the metro station, please?", "d2", { keywords: ["ou", "metro", "station"] }),
        r("Je cherche la station de métro.", "I'm looking for the metro station.", "d2", { keywords: ["cherche", "metro"] }),
        r("Où le métro est ?", "Where the metro is?", "d2", { ok: false, why: "Question word, then verb, then subject: « Où est le métro ? »" }),
      ]),
      d2: n("d2", "Alors, vous allez tout droit, puis vous prenez la deuxième rue à gauche.", "So, you go straight on, then take the second street on the left.", [
        r("Tout droit, puis la deuxième à gauche. C'est loin ?", "Straight on, then the second on the left. Is it far?", "d3", { keywords: ["loin", "gauche"] }),
        r("Pardon, vous pouvez répéter plus lentement ?", "Sorry, can you repeat more slowly?", "d2b", { keywords: ["repeter", "lentement"] }),
      ]),
      d2b: n("d2b", "Bien sûr. Tout droit… puis… la deuxième rue… à gauche.", "Of course. Straight on… then… the second street… on the left.", [
        r("Merci ! C'est loin ?", "Thanks! Is it far?", "d3", { keywords: ["loin", "merci"] }),
      ]),
      d3: n("d3", "Non, c'est à cinq minutes à pied.", "No, it's five minutes on foot.", [
        r("Super, merci beaucoup !", "Great, thank you very much!", "d4", { keywords: ["merci"] }),
        r("Merci, bonne journée !", "Thanks, have a good day!", "d4", { keywords: ["journee"] }),
      ]),
      d4: n("d4", "Je vous en prie. Bonne journée !", "You're welcome. Have a good day!", []),
    },
  },
  {
    id: "appointment", title: "Booking an appointment", subtitle: "Call the doctor's surgery for an appointment.", icon: "stethoscope",
    partner: "a receptionist at a GP surgery", register: "vous", goal: "Ask for an appointment, give your name, and agree on a day and time.", minWeek: 2,
    skills: ["w5-modals", "w6-routine", "w11-situations"],
    vocabulary: [{ fr: "prendre rendez-vous", en: "make an appointment" }, { fr: "le médecin", en: "the doctor" }, { fr: "un créneau", en: "a slot" }, { fr: "ça me convient", en: "that suits me" }, { fr: "épeler", en: "to spell" }],
    start: "a1",
    nodes: {
      a1: n("a1", "Cabinet médical, bonjour !", "Medical practice, hello!", [
        r("Bonjour, je voudrais prendre rendez-vous, s'il vous plaît.", "Hello, I'd like to make an appointment, please.", "a2", { keywords: ["rendez-vous", "voudrais"] }),
        r("Bonjour, est-ce que je peux voir le docteur cette semaine ?", "Hello, can I see the doctor this week?", "a2", { keywords: ["docteur", "semaine", "voir"] }),
        r("Je veux le docteur maintenant.", "I want the doctor now.", "a2", { ok: false, why: "Too abrupt. « Je voudrais prendre rendez-vous » is the polite fixed phrase." }),
      ]),
      a2: n("a2", "Oui, bien sûr. Vous êtes déjà patient ici ?", "Yes, of course. Are you already a patient here?", [
        r("Non, c'est la première fois.", "No, it's the first time.", "a3", { keywords: ["premiere", "non"] }),
        r("Oui, je m'appelle Sam Taylor.", "Yes, my name is Sam Taylor.", "a3", { keywords: ["oui", "appelle"] }),
      ]),
      a3: n("a3", "J'ai un créneau jeudi à quinze heures trente. Ça vous convient ?", "I have a slot on Thursday at 3:30 pm. Does that suit you?", [
        r("Oui, jeudi à quinze heures trente, c'est parfait.", "Yes, Thursday at 3:30 pm is perfect.", "a4", { keywords: ["jeudi", "parfait", "oui"] }),
        r("Non, je travaille. Vous avez quelque chose le matin ?", "No, I'm working. Do you have something in the morning?", "a3b", { keywords: ["matin", "travaille"] }),
      ]),
      a3b: n("a3b", "Vendredi à neuf heures, alors ?", "Friday at nine, then?", [
        r("Oui, vendredi à neuf heures, ça me convient.", "Yes, Friday at nine suits me.", "a4", { keywords: ["vendredi", "convient", "oui"] }),
      ]),
      a4: n("a4", "C'est noté. Vous pouvez épeler votre nom ?", "Noted. Can you spell your name?", [
        r("Bien sûr : T-A-Y-L-O-R.", "Of course: T-A-Y-L-O-R.", "a5", { keywords: ["t-a-y", "taylor", "sur"] }),
        r("Oui, Taylor, T-A-Y-L-O-R. Merci !", "Yes, Taylor, T-A-Y-L-O-R. Thanks!", "a5", { keywords: ["taylor"] }),
      ]),
      a5: n("a5", "Parfait, à bientôt !", "Perfect, see you soon!", []),
    },
  },
  {
    id: "service", title: "Explaining a problem", subtitle: "Your internet box doesn't work — call customer service.", icon: "wrench",
    partner: "a customer-service agent for an internet provider", register: "vous", goal: "Describe the problem, answer questions and get a technician visit.", minWeek: 4,
    skills: ["w4-negation", "w8-pc-avoir", "w9-time"],
    vocabulary: [{ fr: "la box", en: "the internet router" }, { fr: "redémarrer", en: "to restart" }, { fr: "un technicien", en: "a technician" }, { fr: "le numéro client", en: "the customer number" }, { fr: "ça ne marche toujours pas", en: "it still doesn't work" }],
    start: "s1",
    nodes: {
      s1: n("s1", "Service client, bonjour. Comment puis-je vous aider ?", "Customer service, hello. How can I help you?", [
        r("Bonjour, ma connexion internet ne marche pas.", "Hello, my internet connection isn't working.", "s2", { keywords: ["internet", "connexion", "marche"] }),
        r("Bonjour, j'ai un problème avec ma box.", "Hello, I have a problem with my router.", "s2", { keywords: ["probleme", "box"] }),
      ]),
      s2: n("s2", "D'accord. Vous avez déjà redémarré la box ?", "OK. Have you already restarted the router?", [
        r("Oui, j'ai redémarré la box deux fois.", "Yes, I've restarted the router twice.", "s3", { keywords: ["redemarre", "oui", "fois"] }),
        r("Non, pas encore.", "No, not yet.", "s2b", { keywords: ["non", "encore"] }),
        r("Oui, je suis redémarré la box.", "Yes, I am restarted the box.", "s3", { ok: false, why: "Redémarrer takes avoir in the passé composé: « J'ai redémarré »." }),
      ]),
      s2b: n("s2b", "Essayez de la débrancher pendant trente secondes, s'il vous plaît.", "Please try unplugging it for thirty seconds.", [
        r("Voilà, c'est fait… mais ça ne marche toujours pas.", "There, done… but it still doesn't work.", "s3", { keywords: ["toujours", "fait"] }),
      ]),
      s3: n("s3", "Je vois. Depuis quand avez-vous ce problème ?", "I see. Since when have you had this problem?", [
        r("Depuis samedi matin.", "Since Saturday morning.", "s4", { keywords: ["depuis", "samedi"] }),
        r("Depuis trois jours.", "For three days.", "s4", { keywords: ["jours", "depuis"] }),
      ]),
      s4: n("s4", "Je vous envoie un technicien mardi entre huit heures et midi. Ça vous va ?", "I'll send a technician on Tuesday between 8 and noon. Is that OK?", [
        r("Oui, ça me va. Merci beaucoup.", "Yes, that's fine. Thank you very much.", "s5", { keywords: ["oui", "va", "merci"] }),
        r("Mardi, je ne suis pas là. Mercredi, c'est possible ?", "I'm not there on Tuesday. Is Wednesday possible?", "s5", { keywords: ["mercredi", "possible"] }),
      ]),
      s5: n("s5", "C'est noté. Vous recevrez une confirmation par e-mail. Bonne journée !", "Noted. You'll receive a confirmation by email. Have a good day!", []),
    },
  },
  {
    id: "recruiter", title: "Talking to a recruiter", subtitle: "A first phone call about a job.", icon: "briefcase",
    partner: "a recruiter calling about a marketing job in Paris", register: "vous", goal: "Introduce yourself professionally, describe your experience and availability.", minWeek: 5,
    skills: ["w1-basic-sentences", "w9-time", "w7-futur-proche", "w10-connectors"],
    vocabulary: [{ fr: "le poste", en: "the position" }, { fr: "l'expérience", en: "experience" }, { fr: "depuis cinq ans", en: "for five years" }, { fr: "disponible", en: "available" }, { fr: "un entretien", en: "an interview" }],
    start: "r1",
    nodes: {
      r1: n("r1", "Bonjour, je vous appelle au sujet du poste de chargé de marketing. Vous avez un moment ?", "Hello, I'm calling about the marketing position. Do you have a moment?", [
        r("Oui, bien sûr. Merci de votre appel.", "Yes, of course. Thank you for calling.", "r2", { keywords: ["oui", "bien", "appel"] }),
        r("Oui, je vous écoute.", "Yes, I'm listening.", "r2", { keywords: ["ecoute"] }),
      ]),
      r2: n("r2", "Pouvez-vous vous présenter en quelques mots ?", "Can you introduce yourself in a few words?", [
        r("Je m'appelle Sam. Je travaille dans le marketing depuis cinq ans.", "My name is Sam. I've worked in marketing for five years.", "r3", { keywords: ["travaille", "depuis", "ans"] }),
        r("Je suis anglais, j'habite à Paris et j'ai de l'expérience en marketing digital.", "I'm English, I live in Paris and I have experience in digital marketing.", "r3", { keywords: ["experience", "habite"] }),
        r("Je travaille dans le marketing pendant cinq ans.", "I work in marketing during five years.", "r3", { ok: false, why: "For something still true, use depuis + present: « Je travaille dans le marketing depuis cinq ans »." }),
      ]),
      r3: n("r3", "Très bien. Et pourquoi ce poste vous intéresse ?", "Very good. And why does this position interest you?", [
        r("Parce que j'aime le travail en équipe et je veux progresser en français.", "Because I like teamwork and I want to improve my French.", "r4", { keywords: ["parce", "equipe", "progresser"] }),
        r("Parce que l'entreprise est innovante.", "Because the company is innovative.", "r4", { keywords: ["entreprise", "parce"] }),
      ]),
      r4: n("r4", "Vous seriez disponible pour un entretien la semaine prochaine ?", "Would you be available for an interview next week?", [
        r("Oui, je suis disponible mardi ou jeudi.", "Yes, I'm available on Tuesday or Thursday.", "r5", { keywords: ["disponible", "mardi", "jeudi"] }),
        r("Oui, avec plaisir. Quel jour vous convient ?", "Yes, with pleasure. Which day suits you?", "r5", { keywords: ["plaisir", "jour"] }),
      ]),
      r5: n("r5", "Parfait, je vous envoie une invitation par e-mail. Au revoir !", "Perfect, I'll send you an invitation by email. Goodbye!", []),
    },
  },
  {
    id: "friend", title: "Chatting with a friend", subtitle: "Make weekend plans with a French friend.", icon: "users",
    partner: "Léa, a French friend (use tu)", register: "tu", goal: "Talk about your week and make a plan for the weekend.", minWeek: 2,
    skills: ["w7-futur-proche", "w7-plans", "w8-pc-avoir"],
    vocabulary: [{ fr: "ça te dit ?", en: "do you fancy it?" }, { fr: "ce week-end", en: "this weekend" }, { fr: "on se retrouve", en: "we meet up" }, { fr: "crevé(e)", en: "exhausted (informal)" }, { fr: "carrément !", en: "totally!" }],
    start: "f1",
    nodes: {
      f1: n("f1", "Salut ! Ça va ? Ta semaine s'est bien passée ?", "Hi! How are you? Did your week go well?", [
        r("Salut ! Oui, ça va, mais je suis un peu fatigué.", "Hi! Yes, I'm fine, but I'm a bit tired.", "f2", { keywords: ["fatigue", "fatiguee", "ca va"] }),
        r("Super ! J'ai beaucoup travaillé, mais c'était bien.", "Great! I worked a lot, but it was good.", "f2", { keywords: ["travaille", "super"] }),
        r("Bonjour Madame, ça va bien, merci.", "Hello madam, I'm well, thank you.", "f2", { ok: false, why: "Very formal for a friend! « Salut ! Ça va bien, et toi ? » sounds natural." }),
      ]),
      f2: n("f2", "Tu fais quoi ce week-end ?", "What are you doing this weekend?", [
        r("Je vais me reposer samedi. Et toi ?", "I'm going to rest on Saturday. And you?", "f3", { keywords: ["reposer", "vais"] }),
        r("Je ne sais pas encore. Tu as une idée ?", "I don't know yet. Do you have an idea?", "f3", { keywords: ["sais", "idee"] }),
        r("Je vais reposer samedi.", "I'm going to rest (wrong form) on Saturday.", "f3", { ok: false, why: "Se reposer is reflexive: « Je vais me reposer »." }),
      ]),
      f3: n("f3", "Ça te dit d'aller au marché dimanche matin ?", "Do you fancy going to the market on Sunday morning?", [
        r("Carrément ! On se retrouve à quelle heure ?", "Totally! What time shall we meet?", "f4", { keywords: ["carrement", "heure", "retrouve"] }),
        r("Avec plaisir ! Où est-ce qu'on se retrouve ?", "With pleasure! Where shall we meet?", "f4", { keywords: ["plaisir", "ou"] }),
        r("Désolé, je ne peux pas dimanche.", "Sorry, I can't on Sunday.", "f4b", { keywords: ["desole", "peux"] }),
      ]),
      f4b: n("f4b", "Pas de souci ! Samedi soir, alors ? On peut manger ensemble.", "No worries! Saturday evening, then? We can eat together.", [
        r("Oui, samedi soir, c'est parfait !", "Yes, Saturday evening is perfect!", "f5", { keywords: ["samedi", "parfait", "oui"] }),
      ]),
      f4: n("f4", "Vers dix heures devant la boulangerie ?", "Around ten in front of the bakery?", [
        r("Parfait, à dimanche !", "Perfect, see you Sunday!", "f5", { keywords: ["parfait", "dimanche"] }),
        r("D'accord, à dimanche !", "OK, see you Sunday!", "f5", { keywords: ["accord"] }),
      ]),
      f5: n("f5", "Super, à bientôt ! Bisous !", "Great, see you soon! Hugs!", []),
    },
  },
];

/** A course's scenarios (French ids are bare, German ids start with "de-"). */
export function scenariosFor(lang: Lang = "fr"): Scenario[] {
  return lang === "de" ? DE_SCENARIOS : SCENARIOS;
}

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id) ?? DE_SCENARIOS.find((s) => s.id === id);
}

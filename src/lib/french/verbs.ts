/**
 * Verb lexicon. Every verb used by the exercise generators is defined here so
 * the conjugation engine can produce (and validate) any form.
 */

export type Aux = "avoir" | "etre";
export type VerbGroup = "er" | "ir" | "re" | "irregular";
export type StemChange = "e-grave" | "e-acute-grave" | "double-l" | "y-i";

export interface VerbDef {
  inf: string;
  /** English base form, e.g. "speak", "get up", "listen to". */
  en: string;
  /** English simple past. */
  enPast: string;
  group: VerbGroup;
  pp: string;
  aux: Aux;
  reflexive?: boolean;
  /** Six present forms (je, tu, il, nous, vous, ils) for irregular verbs. */
  present?: [string, string, string, string, string, string];
  /** Extra accepted spellings per person index (e.g. 1990 reform). */
  presentAlt?: Partial<Record<number, string[]>>;
  stemChange?: StemChange;
  /** English modal-like behaviour ("can", "must"). */
  enModal?: boolean;
}

const v = (d: VerbDef) => d;

export const VERBS: Record<string, VerbDef> = Object.fromEntries(
  [
    // --- regular -ER ---
    v({ inf: "parler", en: "speak", enPast: "spoke", group: "er", pp: "parlé", aux: "avoir" }),
    v({ inf: "travailler", en: "work", enPast: "worked", group: "er", pp: "travaillé", aux: "avoir" }),
    v({ inf: "habiter", en: "live", enPast: "lived", group: "er", pp: "habité", aux: "avoir" }),
    v({ inf: "aimer", en: "like", enPast: "liked", group: "er", pp: "aimé", aux: "avoir" }),
    v({ inf: "manger", en: "eat", enPast: "ate", group: "er", pp: "mangé", aux: "avoir" }),
    v({ inf: "regarder", en: "watch", enPast: "watched", group: "er", pp: "regardé", aux: "avoir" }),
    v({ inf: "écouter", en: "listen to", enPast: "listened to", group: "er", pp: "écouté", aux: "avoir" }),
    v({ inf: "chercher", en: "look for", enPast: "looked for", group: "er", pp: "cherché", aux: "avoir" }),
    v({ inf: "étudier", en: "study", enPast: "studied", group: "er", pp: "étudié", aux: "avoir" }),
    v({ inf: "cuisiner", en: "cook", enPast: "cooked", group: "er", pp: "cuisiné", aux: "avoir" }),
    v({ inf: "jouer", en: "play", enPast: "played", group: "er", pp: "joué", aux: "avoir" }),
    v({ inf: "donner", en: "give", enPast: "gave", group: "er", pp: "donné", aux: "avoir" }),
    v({ inf: "demander", en: "ask for", enPast: "asked for", group: "er", pp: "demandé", aux: "avoir" }),
    v({ inf: "visiter", en: "visit", enPast: "visited", group: "er", pp: "visité", aux: "avoir" }),
    v({ inf: "marcher", en: "walk", enPast: "walked", group: "er", pp: "marché", aux: "avoir" }),
    v({ inf: "fermer", en: "close", enPast: "closed", group: "er", pp: "fermé", aux: "avoir" }),
    v({ inf: "trouver", en: "find", enPast: "found", group: "er", pp: "trouvé", aux: "avoir" }),
    v({ inf: "oublier", en: "forget", enPast: "forgot", group: "er", pp: "oublié", aux: "avoir" }),
    v({ inf: "rencontrer", en: "meet", enPast: "met", group: "er", pp: "rencontré", aux: "avoir" }),
    v({ inf: "téléphoner", en: "call", enPast: "called", group: "er", pp: "téléphoné", aux: "avoir" }),
    v({ inf: "réserver", en: "book", enPast: "booked", group: "er", pp: "réservé", aux: "avoir" }),
    v({ inf: "louer", en: "rent", enPast: "rented", group: "er", pp: "loué", aux: "avoir" }),
    v({ inf: "commander", en: "order", enPast: "ordered", group: "er", pp: "commandé", aux: "avoir" }),
    v({ inf: "déménager", en: "move", enPast: "moved", group: "er", pp: "déménagé", aux: "avoir" }),
    v({ inf: "commencer", en: "start", enPast: "started", group: "er", pp: "commencé", aux: "avoir" }),
    v({ inf: "acheter", en: "buy", enPast: "bought", group: "er", pp: "acheté", aux: "avoir", stemChange: "e-grave" }),
    v({ inf: "préférer", en: "prefer", enPast: "preferred", group: "er", pp: "préféré", aux: "avoir", stemChange: "e-acute-grave" }),
    v({ inf: "appeler", en: "call", enPast: "called", group: "er", pp: "appelé", aux: "avoir", stemChange: "double-l" }),
    v({ inf: "payer", en: "pay", enPast: "paid", group: "er", pp: "payé", aux: "avoir", stemChange: "y-i" }),
    v({ inf: "arriver", en: "arrive", enPast: "arrived", group: "er", pp: "arrivé", aux: "etre" }),
    v({ inf: "rester", en: "stay", enPast: "stayed", group: "er", pp: "resté", aux: "etre" }),
    v({ inf: "entrer", en: "enter", enPast: "entered", group: "er", pp: "entré", aux: "etre" }),
    v({ inf: "rentrer", en: "go home", enPast: "went home", group: "er", pp: "rentré", aux: "etre" }),
    v({ inf: "tomber", en: "fall", enPast: "fell", group: "er", pp: "tombé", aux: "etre" }),
    v({ inf: "monter", en: "go up", enPast: "went up", group: "er", pp: "monté", aux: "etre" }),
    // --- reflexive -ER ---
    v({ inf: "se lever", en: "get up", enPast: "got up", group: "er", pp: "levé", aux: "etre", reflexive: true, stemChange: "e-grave" }),
    v({ inf: "se réveiller", en: "wake up", enPast: "woke up", group: "er", pp: "réveillé", aux: "etre", reflexive: true }),
    v({ inf: "se coucher", en: "go to bed", enPast: "went to bed", group: "er", pp: "couché", aux: "etre", reflexive: true }),
    v({ inf: "se laver", en: "wash", enPast: "washed", group: "er", pp: "lavé", aux: "etre", reflexive: true }),
    v({ inf: "s'habiller", en: "get dressed", enPast: "got dressed", group: "er", pp: "habillé", aux: "etre", reflexive: true }),
    v({ inf: "se doucher", en: "shower", enPast: "showered", group: "er", pp: "douché", aux: "etre", reflexive: true }),
    v({ inf: "se promener", en: "go for a walk", enPast: "went for a walk", group: "er", pp: "promené", aux: "etre", reflexive: true, stemChange: "e-grave" }),
    v({ inf: "se dépêcher", en: "hurry", enPast: "hurried", group: "er", pp: "dépêché", aux: "etre", reflexive: true }),
    v({ inf: "s'appeler", en: "be called", enPast: "was called", group: "er", pp: "appelé", aux: "etre", reflexive: true, stemChange: "double-l" }),
    v({ inf: "se reposer", en: "rest", enPast: "rested", group: "er", pp: "reposé", aux: "etre", reflexive: true }),
    v({ inf: "s'amuser", en: "have fun", enPast: "had fun", group: "er", pp: "amusé", aux: "etre", reflexive: true }),
    v({ inf: "se brosser", en: "brush", enPast: "brushed", group: "er", pp: "brossé", aux: "etre", reflexive: true }),
    // --- regular -IR / -RE ---
    v({ inf: "finir", en: "finish", enPast: "finished", group: "ir", pp: "fini", aux: "avoir" }),
    v({ inf: "choisir", en: "choose", enPast: "chose", group: "ir", pp: "choisi", aux: "avoir" }),
    v({ inf: "réussir", en: "pass", enPast: "passed", group: "ir", pp: "réussi", aux: "avoir" }),
    v({ inf: "attendre", en: "wait for", enPast: "waited for", group: "re", pp: "attendu", aux: "avoir" }),
    v({ inf: "vendre", en: "sell", enPast: "sold", group: "re", pp: "vendu", aux: "avoir" }),
    v({ inf: "répondre", en: "answer", enPast: "answered", group: "re", pp: "répondu", aux: "avoir" }),
    v({ inf: "entendre", en: "hear", enPast: "heard", group: "re", pp: "entendu", aux: "avoir" }),
    v({ inf: "perdre", en: "lose", enPast: "lost", group: "re", pp: "perdu", aux: "avoir" }),
    v({ inf: "descendre", en: "go down", enPast: "went down", group: "re", pp: "descendu", aux: "etre" }),
    // --- irregular ---
    v({ inf: "être", en: "be", enPast: "was", group: "irregular", pp: "été", aux: "avoir", present: ["suis", "es", "est", "sommes", "êtes", "sont"] }),
    v({ inf: "avoir", en: "have", enPast: "had", group: "irregular", pp: "eu", aux: "avoir", present: ["ai", "as", "a", "avons", "avez", "ont"] }),
    v({ inf: "aller", en: "go", enPast: "went", group: "irregular", pp: "allé", aux: "etre", present: ["vais", "vas", "va", "allons", "allez", "vont"] }),
    v({ inf: "faire", en: "do", enPast: "did", group: "irregular", pp: "fait", aux: "avoir", present: ["fais", "fais", "fait", "faisons", "faites", "font"] }),
    v({ inf: "pouvoir", en: "can", enPast: "could", group: "irregular", pp: "pu", aux: "avoir", enModal: true, present: ["peux", "peux", "peut", "pouvons", "pouvez", "peuvent"] }),
    v({ inf: "vouloir", en: "want", enPast: "wanted", group: "irregular", pp: "voulu", aux: "avoir", present: ["veux", "veux", "veut", "voulons", "voulez", "veulent"] }),
    v({ inf: "devoir", en: "have to", enPast: "had to", group: "irregular", pp: "dû", aux: "avoir", present: ["dois", "dois", "doit", "devons", "devez", "doivent"] }),
    v({ inf: "venir", en: "come", enPast: "came", group: "irregular", pp: "venu", aux: "etre", present: ["viens", "viens", "vient", "venons", "venez", "viennent"] }),
    v({ inf: "revenir", en: "come back", enPast: "came back", group: "irregular", pp: "revenu", aux: "etre", present: ["reviens", "reviens", "revient", "revenons", "revenez", "reviennent"] }),
    v({ inf: "devenir", en: "become", enPast: "became", group: "irregular", pp: "devenu", aux: "etre", present: ["deviens", "deviens", "devient", "devenons", "devenez", "deviennent"] }),
    v({ inf: "prendre", en: "take", enPast: "took", group: "irregular", pp: "pris", aux: "avoir", present: ["prends", "prends", "prend", "prenons", "prenez", "prennent"] }),
    v({ inf: "apprendre", en: "learn", enPast: "learned", group: "irregular", pp: "appris", aux: "avoir", present: ["apprends", "apprends", "apprend", "apprenons", "apprenez", "apprennent"] }),
    v({ inf: "comprendre", en: "understand", enPast: "understood", group: "irregular", pp: "compris", aux: "avoir", present: ["comprends", "comprends", "comprend", "comprenons", "comprenez", "comprennent"] }),
    v({ inf: "savoir", en: "know", enPast: "knew", group: "irregular", pp: "su", aux: "avoir", present: ["sais", "sais", "sait", "savons", "savez", "savent"] }),
    v({ inf: "connaître", en: "know", enPast: "knew", group: "irregular", pp: "connu", aux: "avoir", present: ["connais", "connais", "connaît", "connaissons", "connaissez", "connaissent"], presentAlt: { 2: ["connait"] } }),
    v({ inf: "voir", en: "see", enPast: "saw", group: "irregular", pp: "vu", aux: "avoir", present: ["vois", "vois", "voit", "voyons", "voyez", "voient"] }),
    v({ inf: "dire", en: "say", enPast: "said", group: "irregular", pp: "dit", aux: "avoir", present: ["dis", "dis", "dit", "disons", "dites", "disent"] }),
    v({ inf: "mettre", en: "put on", enPast: "put on", group: "irregular", pp: "mis", aux: "avoir", present: ["mets", "mets", "met", "mettons", "mettez", "mettent"] }),
    v({ inf: "partir", en: "leave", enPast: "left", group: "irregular", pp: "parti", aux: "etre", present: ["pars", "pars", "part", "partons", "partez", "partent"] }),
    v({ inf: "sortir", en: "go out", enPast: "went out", group: "irregular", pp: "sorti", aux: "etre", present: ["sors", "sors", "sort", "sortons", "sortez", "sortent"] }),
    v({ inf: "dormir", en: "sleep", enPast: "slept", group: "irregular", pp: "dormi", aux: "avoir", present: ["dors", "dors", "dort", "dormons", "dormez", "dorment"] }),
    v({ inf: "boire", en: "drink", enPast: "drank", group: "irregular", pp: "bu", aux: "avoir", present: ["bois", "bois", "boit", "buvons", "buvez", "boivent"] }),
    v({ inf: "lire", en: "read", enPast: "read", group: "irregular", pp: "lu", aux: "avoir", present: ["lis", "lis", "lit", "lisons", "lisez", "lisent"] }),
    v({ inf: "écrire", en: "write", enPast: "wrote", group: "irregular", pp: "écrit", aux: "avoir", present: ["écris", "écris", "écrit", "écrivons", "écrivez", "écrivent"] }),
    v({ inf: "naître", en: "be born", enPast: "was born", group: "irregular", pp: "né", aux: "etre", present: ["nais", "nais", "naît", "naissons", "naissez", "naissent"] }),
    v({ inf: "mourir", en: "die", enPast: "died", group: "irregular", pp: "mort", aux: "etre", present: ["meurs", "meurs", "meurt", "mourons", "mourez", "meurent"] }),
  ].map((d) => [d.inf, d]),
);

export function getVerb(inf: string): VerbDef {
  const verb = VERBS[inf];
  if (!verb) throw new Error(`Unknown verb: ${inf}`);
  return verb;
}

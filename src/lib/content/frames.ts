/**
 * Sentence frames: natural complements for each verb, with English.
 * "{a}" marks adjective/participle agreement with the subject.
 * Generators combine these with the conjugation engine for unlimited,
 * grammatically guaranteed sentences.
 */
export interface Frame {
  fr: string;
  en: string;
}

export const FRAMES: Record<string, Frame[]> = {
  parler: [{ fr: "français", en: "French" }, { fr: "avec la voisine", en: "with the neighbour" }, { fr: "au téléphone", en: "on the phone" }, { fr: "anglais", en: "English" }],
  travailler: [{ fr: "à Paris", en: "in Paris" }, { fr: "dans un bureau", en: "in an office" }, { fr: "ensemble", en: "together" }, { fr: "le samedi", en: "on Saturdays" }],
  habiter: [{ fr: "à Lyon", en: "in Lyon" }, { fr: "près de la gare", en: "near the station" }, { fr: "dans un petit appartement", en: "in a small apartment" }],
  aimer: [{ fr: "le café", en: "coffee" }, { fr: "la musique", en: "music" }, { fr: "le cinéma", en: "the cinema" }, { fr: "les croissants", en: "croissants" }],
  manger: [{ fr: "une pomme", en: "an apple" }, { fr: "au restaurant", en: "at the restaurant" }, { fr: "avec des amis", en: "with friends" }, { fr: "une crêpe", en: "a crêpe" }],
  regarder: [{ fr: "la télé", en: "TV" }, { fr: "un film", en: "a film" }, { fr: "les photos", en: "the photos" }],
  écouter: [{ fr: "la radio", en: "the radio" }, { fr: "le professeur", en: "the teacher" }, { fr: "un podcast", en: "a podcast" }],
  chercher: [{ fr: "un appartement", en: "an apartment" }, { fr: "les clés", en: "the keys" }, { fr: "du travail", en: "work" }],
  étudier: [{ fr: "le français", en: "French" }, { fr: "à la bibliothèque", en: "at the library" }],
  cuisiner: [{ fr: "le dîner", en: "dinner" }, { fr: "pour la famille", en: "for the family" }],
  jouer: [{ fr: "au tennis", en: "tennis" }, { fr: "avec les enfants", en: "with the children" }, { fr: "au football", en: "football" }],
  visiter: [{ fr: "le musée", en: "the museum" }, { fr: "la ville", en: "the city" }, { fr: "un appartement", en: "an apartment" }],
  appeler: [{ fr: "le médecin", en: "the doctor" }, { fr: "le propriétaire", en: "the landlord" }, { fr: "un taxi", en: "a taxi" }],
  acheter: [{ fr: "du pain", en: "bread" }, { fr: "une baguette", en: "a baguette" }, { fr: "des légumes", en: "vegetables" }, { fr: "un billet", en: "a ticket" }],
  réserver: [{ fr: "une table", en: "a table" }, { fr: "un billet de train", en: "a train ticket" }, { fr: "une chambre", en: "a room" }],
  déménager: [{ fr: "en mars", en: "in March" }, { fr: "à Bordeaux", en: "to Bordeaux" }],
  trouver: [{ fr: "un appartement", en: "an apartment" }, { fr: "les clés", en: "the keys" }, { fr: "un travail", en: "a job" }],
  oublier: [{ fr: "les clés", en: "the keys" }, { fr: "le rendez-vous", en: "the appointment" }, { fr: "le mot de passe", en: "the password" }],
  téléphoner: [{ fr: "au médecin", en: "the doctor" }, { fr: "à la banque", en: "the bank" }],
  être: [{ fr: "à Paris", en: "in Paris" }, { fr: "fatigué{a}", en: "tired" }, { fr: "content{a}", en: "happy" }, { fr: "en retard", en: "late" }, { fr: "à la maison", en: "at home" }],
  avoir: [{ fr: "un rendez-vous", en: "an appointment" }, { fr: "un chien", en: "a dog" }, { fr: "deux enfants", en: "two children" }, { fr: "une voiture", en: "a car" }],
  aller: [{ fr: "au marché", en: "to the market" }, { fr: "à la gare", en: "to the station" }, { fr: "au travail", en: "to work" }, { fr: "chez le médecin", en: "to the doctor's" }],
  faire: [{ fr: "les courses", en: "the shopping" }, { fr: "du sport", en: "sport" }, { fr: "la cuisine", en: "the cooking" }, { fr: "du yoga", en: "yoga" }],
  pouvoir: [{ fr: "venir", en: "come" }, { fr: "payer par carte", en: "pay by card" }, { fr: "parler plus lentement", en: "speak more slowly" }],
  vouloir: [{ fr: "partir", en: "to leave" }, { fr: "un café", en: "a coffee" }, { fr: "visiter Paris", en: "to visit Paris" }],
  devoir: [{ fr: "travailler", en: "work" }, { fr: "partir", en: "leave" }, { fr: "payer le loyer", en: "pay the rent" }],
  venir: [{ fr: "avec nous", en: "with us" }, { fr: "de Londres", en: "from London" }, { fr: "ce soir", en: "tonight" }],
  prendre: [{ fr: "le métro", en: "the metro" }, { fr: "un café", en: "a coffee" }, { fr: "le train", en: "the train" }],
  comprendre: [{ fr: "la question", en: "the question" }, { fr: "le français", en: "French" }],
  apprendre: [{ fr: "le français", en: "French" }, { fr: "la grammaire", en: "grammar" }],
  savoir: [{ fr: "la réponse", en: "the answer" }, { fr: "l'adresse", en: "the address" }],
  voir: [{ fr: "la mer", en: "the sea" }, { fr: "un film", en: "a film" }, { fr: "le médecin", en: "the doctor" }],
  dire: [{ fr: "bonjour", en: "hello" }, { fr: "la vérité", en: "the truth" }],
  mettre: [{ fr: "un manteau", en: "a coat" }, { fr: "une écharpe", en: "a scarf" }],
  partir: [{ fr: "en vacances", en: "on holiday" }, { fr: "à huit heures", en: "at eight" }],
  sortir: [{ fr: "ce soir", en: "tonight" }, { fr: "avec des amis", en: "with friends" }],
  boire: [{ fr: "un café", en: "a coffee" }, { fr: "de l'eau", en: "water" }, { fr: "du thé", en: "tea" }],
  lire: [{ fr: "le journal", en: "the newspaper" }, { fr: "un livre", en: "a book" }],
  écrire: [{ fr: "un e-mail", en: "an email" }, { fr: "une lettre", en: "a letter" }],
  dormir: [{ fr: "bien", en: "well" }, { fr: "huit heures", en: "eight hours" }],
  finir: [{ fr: "le travail", en: "work" }, { fr: "à six heures", en: "at six" }, { fr: "le livre", en: "the book" }],
  choisir: [{ fr: "un dessert", en: "a dessert" }, { fr: "la date", en: "the date" }],
  réussir: [{ fr: "l'examen", en: "the exam" }],
  attendre: [{ fr: "le bus", en: "the bus" }, { fr: "le train", en: "the train" }, { fr: "le médecin", en: "the doctor" }],
  vendre: [{ fr: "la voiture", en: "the car" }, { fr: "des fleurs", en: "flowers" }],
  répondre: [{ fr: "à la question", en: "the question" }, { fr: "au téléphone", en: "the phone" }],
  entendre: [{ fr: "la musique", en: "the music" }, { fr: "un bruit", en: "a noise" }],
  perdre: [{ fr: "les clés", en: "the keys" }, { fr: "le match", en: "the match" }],
  "se lever": [{ fr: "à sept heures", en: "at seven" }, { fr: "tôt", en: "early" }],
  "se réveiller": [{ fr: "tôt", en: "early" }, { fr: "à six heures", en: "at six" }],
  "se coucher": [{ fr: "tard", en: "late" }, { fr: "à minuit", en: "at midnight" }, { fr: "à onze heures", en: "at eleven" }],
  "se laver": [{ fr: "le matin", en: "in the morning" }],
  "s'habiller": [{ fr: "vite", en: "quickly" }, { fr: "le matin", en: "in the morning" }],
  "se doucher": [{ fr: "le matin", en: "in the morning" }, { fr: "le soir", en: "in the evening" }],
  "se promener": [{ fr: "dans le parc", en: "in the park" }, { fr: "le dimanche", en: "on Sundays" }],
  "se dépêcher": [{ fr: "le matin", en: "in the morning" }],
  "se reposer": [{ fr: "le dimanche", en: "on Sundays" }, { fr: "à la maison", en: "at home" }],
  "s'amuser": [{ fr: "avec les enfants", en: "with the children" }, { fr: "à la fête", en: "at the party" }],
  arriver: [{ fr: "à l'heure", en: "on time" }, { fr: "à la gare", en: "at the station" }],
  rester: [{ fr: "à la maison", en: "at home" }, { fr: "à Paris", en: "in Paris" }],
  rentrer: [{ fr: "tard", en: "late" }, { fr: "à minuit", en: "at midnight" }],
  tomber: [{ fr: "dans la rue", en: "in the street" }],
  descendre: [{ fr: "au rez-de-chaussée", en: "to the ground floor" }],
  monter: [{ fr: "au troisième étage", en: "to the third floor" }],
  entrer: [{ fr: "dans le magasin", en: "the shop" }],
};

/**
 * Convert a complement to its negative form: une pomme -> de pomme, de l'eau -> d'eau.
 * Determiners must match as whole words ("un" must not match the start of "une").
 */
export function negateComplement(fr: string): string {
  const m = fr.match(/^(?:(?:une|un|des|du|de la)\s+|de l')(\S.*)$/);
  if (!m) return fr;
  const rest = m[1];
  // No elision before y + vowel (pas de yoga). None of the frames start with an h aspiré.
  return /^[aeiouéèêàâîïôûh]/i.test(rest) ? `d'${rest}` : `de ${rest}`;
}

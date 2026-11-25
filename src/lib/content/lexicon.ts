import type { Lang } from "./languages";
import { langOfSkill } from "./languages";
import { getSkill } from "./curriculum";
import { FRAMES } from "./frames";
import type { Exercise, Gloss } from "./types";

/*
 * Word hints. Each line: target forms = English forms ; dictionary note (optional).
 * Forms are separated by "/". Content words only (nouns, adjectives, adverbs, set phrases):
 * conjugated verbs and grammar words are what the exercises test, so they never get a hint.
 */

const FR = `
ami/amis/amie/amies = friend/friends/friend/friends ; un ami, une amie
appartement/appartements = apartment/apartments/flat/flats ; un appartement
baguette = baguette ; une baguette
banque = bank ; la banque
beaucoup = a lot/lots/much/many
beau/belle/beaux/belles = beautiful/lovely/nice/handsome
bibliothèque = library ; la bibliothèque
billet/billets = ticket/tickets ; un billet
blanc/blanche/blancs/blanches = white
bon/bonne/bons/bonnes = good
boulangerie = bakery ; la boulangerie
bruit = noise ; un bruit
bruyant/bruyante = noisy
bureau = office/desk ; le bureau
carte = card/menu/map ; une carte
chambre/chambres = room/rooms/bedroom/bedrooms ; une chambre
chat/chats = cat/cats ; un chat
chauffage = heating ; le chauffage
cher/chère = expensive/dear
chien/chiens = dog/dogs ; un chien
clé/clés = key/keys ; une clé
coiffeur = hairdresser ; le coiffeur
content/contente/contents/contentes = happy/pleased/glad
cours = class/course/lesson/lessons ; un cours
courses = shopping/groceries ; les courses
cuisine = kitchen/cooking ; la cuisine
demain = tomorrow
déjeuner = lunch ; le déjeuner
dîner = dinner ; le dîner
délicieux/délicieuse = delicious
disponible = available/free
docteur = doctor ; le docteur
eau = water ; l'eau (f.)
école = school ; l'école (f.)
écharpe = scarf ; une écharpe
enfant/enfants = child/children/kids/kid ; un enfant
ensemble = together
étage = floor ; un étage
examen = exam ; un examen
facture = bill/invoice ; une facture
addition = bill/check ; l'addition (f.)
famille = family ; la famille
fatigué/fatiguée/fatigués/fatiguées = tired
fermé/fermée/fermés/fermées = closed/shut
fête = party ; une fête
fille/filles = girl/girls/daughter/daughters ; une fille
fleurs = flowers ; une fleur
fromage = cheese ; le fromage
froid/froide = cold
gare = station/train station ; la gare
gâteau/gâteaux = cake/cakes ; un gâteau
gentil/gentille/gentils = kind/nice
grand/grande/grands/grandes = big/tall/large
heure/heures = hour/hours/o'clock ; une heure
heureux/heureuse = happy
hier = yesterday
ici = here
jardin = garden ; le jardin
jamais = never
journal/journaux = newspaper/newspapers ; le journal
lait = milk ; le lait
légumes = vegetables ; un légume
lentement = slowly
lettre = letter ; une lettre
libre = free
livre/livres = book/books ; un livre
loyer = rent ; le loyer
magasin = shop/store ; un magasin
maintenant = now
maison = house/home ; la maison
malade = ill/sick
manteau = coat ; un manteau
marché = market ; le marché
matin = morning ; le matin
médecin = doctor ; le médecin
mer = sea ; la mer
métro = metro/underground/subway ; le métro
midi = noon/midday
minuit = midnight
mois = month/months ; le mois
mot/mots = word/words ; un mot
musée = museum ; le musée
musique = music ; la musique
noir/noire/noirs/noires = black
nouveau/nouvelle/nouveaux = new
nuit = night ; la nuit
pain = bread ; le pain
parapluie = umbrella ; un parapluie
parc = park ; le parc
parents = parents
petit/petite/petits/petites = small/little
pharmacie = pharmacy/chemist ; la pharmacie
plage = beach ; la plage
pluie = rain ; la pluie
pomme/pommes = apple/apples ; une pomme
prochain/prochaine = next
professeur = teacher ; le professeur
propriétaire = landlord/owner ; le/la propriétaire
quartier = neighbourhood/neighborhood/area ; le quartier
réponse = answer/reply ; une réponse
réservation = reservation/booking ; une réservation
rouge/rouges = red
rue = street ; la rue
semaine/semaines = week/weeks ; une semaine
ce soir = tonight/this evening
soir = evening ; le soir
supermarché = supermarket ; le supermarché
tard = late
télé = TV/television ; la télé
thé = tea ; le thé
tôt = early
travail = work/job ; le travail
très = very
vacances = holiday/holidays/vacation ; les vacances (f.)
viande = meat ; la viande
ville = city/town ; la ville
vite = quickly/fast
voisin/voisine/voisins = neighbour/neighbor/neighbours/neighbors ; un voisin, une voisine
voiture/voitures = car/cars ; une voiture
vérité = truth ; la vérité
rendez-vous = appointment/meeting ; un rendez-vous
rez-de-chaussée = ground floor ; le rez-de-chaussée
adresse = address ; l'adresse (f.)
aujourd'hui = today
d'abord = first/first of all
ensuite = then/next/afterwards
enfin = finally/at last
longtemps = a long time/long
quelques = a few/some
combien = how much/how many
pourquoi = why
parce que = because
bonjour = hello/good morning
bonsoir = good evening
merci = thank you/thanks
s'il vous plaît/s'il te plaît = please
désolé/désolée = sorry
enchanté/enchantée = nice to meet you/pleased to meet you
lundi = Monday
mardi = Tuesday
mercredi = Wednesday
jeudi = Thursday
vendredi = Friday
samedi = Saturday
dimanche = Sunday
deux = two
trois = three
cinq = five
six = six
sept = seven
huit = eight
neuf = nine
dix = ten
onze = eleven
douze = twelve
quinze = fifteen
trente = thirty
cinquante = fifty
`;

const DE = `
Guten Tag = hello/good afternoon
Guten Morgen = good morning
Guten Abend = good evening
Gute Nacht = good night
heute Abend = this evening/tonight
gestern Abend = yesterday evening/last night
Wie spät ist es = what time is it
Abend = evening ; der Abend
keine Ahnung = no idea
alles = everything/all
alt = old
Apfel/Äpfel = apple/apples ; der Apfel, die Äpfel
Apotheke = pharmacy/chemist ; die Apotheke
Guten Appetit = enjoy your meal
Arbeit = work/job ; die Arbeit
Arzt = doctor ; der Arzt
Ärztin = doctor ; die Ärztin
Auto/Autos = car/cars ; das Auto
Bahnhof = station/train station ; der Bahnhof
Bank = bank ; die Bank
Bäckerei = bakery ; die Bäckerei
Gute Besserung = get well soon
Bett = bed ; das Bett
ein bisschen = a bit/a little
Brief = letter ; der Brief
Brille = glasses ; die Brille
Brot = bread ; das Brot
Brötchen = roll/rolls/bread roll/bread rolls ; das Brötchen
Bruder/Brüder = brother/brothers ; der Bruder, die Brüder
Buch/Bücher = book/books ; das Buch, die Bücher
Büro = office ; das Büro
Montag = Monday
Dienstag = Tuesday
Mittwoch = Wednesday
Donnerstag = Thursday
Freitag = Friday
Samstag = Saturday
Sonntag = Sunday
Deutsch = German
Englisch = English
Deutschland = Germany
Spanien = Spain
Italien = Italy
Irland = Ireland
Köln = Cologne
München = Munich
Wien = Vienna
Rom = Rome
dort drüben = over there
dort = there
Durst = thirsty/thirst ; der Durst
Ecke = corner ; die Ecke
Eltern = parents ; die Eltern
Entschuldigung = sorry/excuse me
etwas = something
Fahrrad = bike/bicycle ; das Fahrrad
Fisch = fish ; der Fisch
Fleisch = meat ; das Fleisch
frei = free
Freund = friend/boyfriend ; der Freund
Freundin = friend/girlfriend ; die Freundin
früh = early
Fußball = football/soccer ; der Fußball
Garten = garden ; der Garten
Geld = money ; das Geld
genug = enough
Geschenk = present/gift ; das Geschenk
gestern = yesterday
groß = big/tall/large
Haus = house ; das Haus
zu Hause = at home
nach Hause = home
heiß = hot
Heizung = heating ; die Heizung
hell = bright/light
heute = today
hier = here
Hilfe = help ; die Hilfe
Hund = dog ; der Hund
Hunger = hungry/hunger ; der Hunger
interessant = interesting
Jahr/Jahre/Jahren = year/years/years ; das Jahr
jetzt = now
Kaffee = coffee ; der Kaffee
kalt = cold
kaputt = broken
Karte/Karten = card/cards/ticket/tickets/map/menu ; die Karte
Katze = cat ; die Katze
Kind/Kinder/Kindern = child/children/children/kids/kid ; das Kind, die Kinder
Kino = cinema/movies ; das Kino
klein = small/little
Kopfschmerzen = headache ; die Kopfschmerzen (pl.)
krank = ill/sick
Kurs = course/class ; der Kurs
Lampe = lamp ; die Lampe
langsamer = slower/more slowly
langweilig = boring
Lehrer = teacher ; der Lehrer
Lehrerin = teacher ; die Lehrerin
leider = unfortunately
Milch = milk ; die Milch
Minuten = minutes ; die Minute
morgen = tomorrow
Mutter = mother/mum ; die Mutter
Schwester = sister ; die Schwester
müde = tired
Nachbar = neighbour/neighbor ; der Nachbar
Nachbarin = neighbour/neighbor ; die Nachbarin
Nachricht = message ; die Nachricht
Nacht = night ; die Nacht
nett = nice/kind
neu/neue/neuer/neues = new
nie = never
offen = open
pünktlich = on time/punctual
Rechnung = bill/check ; die Rechnung
Regen = rain ; der Regen
Reservierung = reservation/booking ; die Reservierung
rot = red
Schlüssel = key/keys ; der Schlüssel
schnell = fast/quickly/quick
schon = already
sehr = very
spät = late
Stadt = city/town ; die Stadt
Straße = street/road ; die Straße
Stuhl/Stühle = chair/chairs ; der Stuhl, die Stühle
Suppe = soup ; die Suppe
Supermarkt = supermarket ; der Supermarkt
Tabletten = tablets/pills ; die Tablette
Tag/Tage = day/days ; der Tag
Tee = tea ; der Tee
Termin = appointment ; der Termin
teuer = expensive
Tisch = table ; der Tisch
Uhr = o'clock/clock/watch ; die Uhr
viel = a lot/much/lots
Viertel = quarter ; das Viertel
halb = half
Vorstellungsgespräch = job interview/interview ; das Vorstellungsgespräch
Wasser = water ; das Wasser
Wein = wine ; der Wein
weit = far
Wochenende = weekend ; das Wochenende
Woche = week ; die Woche
Wohnung/Wohnungen = flat/flats/apartment/apartments ; die Wohnung
Zahnarzt = dentist ; der Zahnarzt
Zeit = time ; die Zeit
Zeitung = newspaper ; die Zeitung
Zimmer = room ; das Zimmer
zuerst = first
Zug = train ; der Zug
zusammen = together
danke = thanks/thank you
bitte = please
Tschüss = bye
Auf Wiedersehen = goodbye
zwei = two
drei = three
fünf = five
sechs = six
sieben = seven
acht = eight
neun = nine
zehn = ten
elf = eleven
zwanzig = twenty
dreißig = thirty
`;

export interface LexEntry {
  key: string;
  target: string[];
  en: string[];
  note?: string;
}

function parse(lang: Lang, table: string): LexEntry[] {
  return table.trim().split("\n").map((line) => {
    const [pair, note] = line.split(" ; ");
    const [t, e] = pair.split(" = ");
    const target = t.split("/").map((s) => s.trim()).filter(Boolean);
    return { key: `${lang}:${(note ?? target[0]).toLowerCase()}`, target, en: e.split("/").map((s) => s.trim()).filter(Boolean), note: note?.trim() };
  });
}

/** French frame complements ("avec les enfants" = "with the children") are phrase hints too. */
function frameEntries(): LexEntry[] {
  const out = new Map<string, LexEntry>();
  for (const f of Object.values(FRAMES).flat()) {
    if (!f.en || out.has(f.fr)) continue;
    const base = f.fr.replace("{a}", "");
    const target = f.fr.includes("{a}") ? ["", "e", "s", "es"].map((x) => base + x) : [f.fr];
    out.set(f.fr, { key: `fr:${base.toLowerCase()}`, target, en: [f.en] });
  }
  return [...out.values()];
}

let lexicons: Record<Lang, LexEntry[]> | null = null;
export function lexicon(lang: Lang): LexEntry[] {
  lexicons ??= { fr: [...frameEntries(), ...parse("fr", FR)], de: parse("de", DE) };
  return lexicons[lang];
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Find a whole-word/phrase occurrence (case-insensitive); returns its position and exact text. */
function findForm(text: string, form: string): { index: number; text: string } | null {
  const m = new RegExp(`(?<![\\p{L}\\d])${esc(form)}(?![\\p{L}\\d])`, "iu").exec(text);
  return m ? { index: m.index, text: m[0] } : null;
}
function findAny(text: string, forms: string[]) {
  let best: { index: number; text: string } | null = null;
  for (const f of forms) {
    const m = findForm(text, f);
    if (m && (!best || m.text.length > best.text.length)) best = m;
  }
  return best;
}

/** Words a vocabulary topic teaches are what its exercises test: they get no hint there. */
const taught = new Map<string, string>();
function taughtText(skillId: string): string {
  let t = taught.get(skillId);
  if (t === undefined) {
    const s = getSkill(skillId);
    t = s.category !== "vocabulary" ? "" : s.explanation.map((x) =>
      [x.body, ...(x.table?.rows.flat() ?? []), ...(x.examples?.map((e) => e.fr) ?? [])].join(" ")).join(" ");
    taught.set(skillId, t);
  }
  return t;
}

const MAX_GLOSSES = 4;
const PATTERN = /\[([^\]|]*)\|[^\]]*\]/g; // accepted answers may hold "[a|b]" choices: keep the first

/**
 * Hints for the words in an exercise's prompt. English prompts (translate / build a sentence)
 * underline the English word and reveal the course-language word used in the answer.
 * Course-language prompts (fill in, choose, rewrite) underline the word and reveal its meaning.
 * Never hints the answer itself.
 */
export function glossesFor(ex: Exercise): Gloss[] {
  let lang: Lang;
  try { lang = langOfSkill(ex.skillId); } catch { return []; }
  const lex = lexicon(lang);
  const skip = taughtText(ex.skillId);
  const found: (Gloss & { index: number })[] = [];

  if (ex.type === "translation" || ex.type === "sentence_builder") {
    const answers = ex.accepted.map((a) => a.replace(PATTERN, "$1"));
    for (const e of lex) {
      if (skip && findAny(skip, e.target)) continue;
      const inPrompt = findAny(ex.prompt, e.en);
      if (!inPrompt) continue;
      const inAnswer = answers.map((a) => findAny(a, e.target)).find(Boolean);
      if (!inAnswer) continue;
      found.push({ key: e.key, span: inPrompt.text, meaning: inAnswer.text, note: noteFor(e, inAnswer.text), index: inPrompt.index });
    }
  } else if (ex.type === "fill_blank" || ex.type === "multiple_choice" || ex.type === "transformation") {
    if (ex.type === "multiple_choice" && !ex.prompt.includes("___")) return [];
    const text = ex.type === "fill_blank" && ex.blank ? `${ex.blank.before} ___ ${ex.blank.after}` : ex.prompt;
    const answers = ex.type === "multiple_choice" ? (ex.options ?? []) : ex.type === "fill_blank" ? ex.accepted : [];
    for (const e of lex) {
      if (skip && findAny(skip, e.target)) continue;
      if (answers.some((a) => findAny(a, e.target))) continue;
      const m = findAny(text, e.target);
      if (!m) continue;
      found.push({ key: e.key, span: m.text, meaning: meaningOf(e, m.text), note: noteFor(e, m.text), index: m.index });
    }
  } else {
    return [];
  }

  // Longest spans win; drop anything overlapping a chosen span, and words spelled the same in both languages.
  for (let i = found.length - 1; i >= 0; i--) if (found[i].span.toLowerCase() === found[i].meaning.toLowerCase()) found.splice(i, 1);
  found.sort((a, b) => b.span.length - a.span.length);
  const chosen: typeof found = [];
  for (const g of found) {
    if (chosen.length >= MAX_GLOSSES) break;
    if (chosen.some((c) => c.key === g.key || (g.index < c.index + c.span.length && c.index < g.index + g.span.length))) continue;
    chosen.push(g);
  }
  return chosen.sort((a, b) => a.index - b.index).map(({ key, span, meaning, note }) => (note ? { key, span, meaning, note } : { key, span, meaning }));
}

/**
 * Nouns (entries with a dictionary note) list their English forms in the same order as their
 * target forms, so "enfants" (2nd form) means "children" (2nd English form).
 */
function meaningOf(e: LexEntry, shown: string): string {
  if (!e.note) return e.en[0];
  const i = e.target.findIndex((t) => t.toLowerCase() === shown.toLowerCase());
  return e.en[i] ?? e.en[0];
}

function noteFor(e: LexEntry, shown: string): string | undefined {
  return e.note && e.note.toLowerCase() !== shown.toLowerCase() ? e.note : undefined;
}

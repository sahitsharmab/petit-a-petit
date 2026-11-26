import type { Lang } from "./languages";
import { langOfSkill } from "./languages";
import { getSkill } from "./curriculum";
import { FRAMES } from "./frames";
import { VERB_MEANING } from "./verb-meanings";
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
beaucoup = a lot/lots/much/many/really
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
lundi = Monday/Mondays
mardi = Tuesday/Tuesdays
mercredi = Wednesday/Wednesdays
jeudi = Thursday/Thursdays
vendredi = Friday/Fridays
samedi = Saturday/Saturdays
dimanche = Sunday/Sundays
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
quatre = four
aide = help ; l'aide (f.)
un peu = a little/a bit
journée = day ; la journée
toute la journée = all day
infirmière = nurse ; une infirmière
Monsieur = Mr ; Monsieur
Madame = Mrs ; Madame
problème = problem ; un problème
douche = shower ; la douche
hôtel = hotel ; un hôtel
à côté de = next to
en face de = opposite
devant = in front of
sous = under
lumineux/lumineuse = bright
contrat = contract ; un contrat
week-end = weekend ; le week-end
facilement = easily
petit-déjeuner = breakfast ; le petit-déjeuner
à droite = on the right
après = after
hier soir = last night
dernier/dernière = last
an/ans = year/years ; un an
temps = time/weather ; le temps
quelle heure = what time
bien = well
`;

/*
 * Verbs and expressions: "+ dictionary form = English forms = forms in the answer ; note".
 * The hint shows the dictionary form, never the conjugated answer. "parl*" matches any form
 * starting with "parl". English prompts only (in the course language the verb is usually the test).
 */
const FR_VERBS = `
+ avoir peur (de) = scared of/afraid of/scared/afraid/frightened = peur ; with avoir: j'ai peur de…
+ avoir soif = thirsty = soif ; with avoir: j'ai soif
+ avoir faim = hungry = faim ; with avoir: j'ai faim
+ avoir besoin de = need/needs/needed = besoin ; with avoir: j'ai besoin de…
+ avoir raison = right = raison ; with avoir: tu as raison
+ il fait beau = the weather is nice/weather is nice = beau
+ je voudrais = I'd like/would like = voudr* ; polite form of vouloir
+ prendre rendez-vous = make an appointment = prendre rendez-vous
+ prendre une douche = take a shower = douche
+ prendre le petit-déjeuner = have breakfast = petit-déjeuner
+ il y a … = ago = il y a ; before the time: il y a trois jours
+ depuis = for/since = depuis ; with the present tense: j'apprends depuis six mois
+ ne … plus = anymore/no longer/any left = plus
+ parler = speak/speaks/speaking/spoke/talk/talks/talking = parl*
+ habiter = live/lives/living/lived = habit*
+ travailler = work/works/working/worked = travaill*
+ regarder = watch/watches/watching/watched = regard*
+ manger = eat/eats/eating/ate/eaten = mang*
+ aimer = like/likes/love/loves = aim*
+ chercher = look for/looking for/looks for/looked for = cherch*
+ s'appeler = my name is/name = appel*/appell* ; je m'appelle = my name is
+ appeler = call/calls/calling/called = appel*/appell*
+ aller = go/goes/going/went/gone = vais/vas/va/allons/allez/vont/aller/allé*/ira*/iron*
+ faire = do/does/doing/did/done/make/makes/making/made = fais/fait/faisons/faites/font/faire
+ vouloir = want/wants/wanted = veux/veut/voulons/voulez/veulent/vouloir/voulu
+ pouvoir = can/can't/could = peux/peut/pouvons/pouvez/peuvent/pouvoir/pu
+ devoir = must/have to/has to = dois/doit/devons/devez/doivent/devoir
+ comprendre = understand/understands/understood = compr*
+ savoir = know/knows/knew = sais/sait/savons/savez/savent/savoir/su
+ prendre = take/takes/taking/took/taken = prend*/pren*/pris
+ venir = come/comes/coming/came = vien*/venons/venez/venir/venu*
+ partir = leave/leaves/leaving/left = part*
+ lire = read/reads/reading = lis/lit/lisons/lisez/lisent/lire/lu
+ attendre = wait/waits/waiting/waited = attend*
+ finir = finish/finishes/finished = fini*
+ vendre = sell/sells/selling/sold = vend*
+ choisir = choose/chooses/choosing/chose = chois*
+ se lever = get up/gets up/got up/getting up = lève*/lev*
+ se doucher = shower/showers/showered = douch*
+ se promener = go for a walk/walk = promè*/promen*
+ se coucher = go to bed/goes to bed/went to bed = couch*
+ se réveiller = wake up/wakes up/woke up = réveill*
+ s'habiller = get dressed/gets dressed/dressed = habill*
+ commencer = start/starts/begin/begins = commen*
+ se reposer = rest = repos*
+ visiter = visit/visits/visiting/visited = visit*
+ se retrouver = meet/meets/meeting = retrouv*
+ trouver = find/finds/found = trouv*
+ réserver = book/booked/reserve = réserv*
+ oublier = forget/forgot/forgotten = oubli*
+ voir = see/sees/seeing/saw/seen = vois/voit/voyons/voyez/voient/voir/vu
+ arriver = arrive/arrives/arrived = arriv*
+ rentrer = get home/got home/come home = rentr*
+ apprendre = learn/learns/learning/learnt/learned = appren*/appris
+ pleuvoir = rain/rains/rained/raining = pleut/plu
+ déménager = move/moved = déménag*
+ dormir = sleep/sleeps/slept = dor*
+ envoyer = send/sends/sending/sent = envo*
+ aider = help/helps/helped = aid*
+ rester = stay/stays/staying/stayed = reste/restes/restons/restez/restent/rester/resté*
+ acheter = buy/buys/bought = achè*/achet*
+ coûter = cost/costs = coût*
+ ouvrir = open/opens = ouvr*
+ payer = pay/pays/paid = pay*/pai*
+ signer = sign = sign*
+ répéter = repeat = répèt*/répét*
`;

const DE_VERBS = `
+ Durst haben = thirsty = Durst ; ich habe Durst
+ Hunger haben = hungry = Hunger ; ich habe Hunger
+ Lust haben = feel like = Lust ; ich habe (keine) Lust
+ recht haben = right = recht ; er hat recht
+ ich hätte gern = I'd like/would like = hätte gern ; polite: ich hätte gern einen Kaffee
+ möchten = I'd like/would like = möchte* ; ich möchte = I'd like
+ gern = like/likes/love to/I'd love to = gern ; after the verb: ich esse gern = I like eating
+ vor … = ago = vor ; before the time, with the dative: vor drei Tagen
+ seit = for/since = seit ; with the present tense: ich lerne seit sechs Monaten
+ mit dem Fahrrad fahren = cycle = Fahrrad
+ wohnen = live/lives/living/lived = wohn*/gewohnt
+ lernen = learn/learns/learning/learnt/learned = lern*/gelernt
+ arbeiten = work/works/working/worked = arbeit*/gearbeitet
+ spielen = play/plays/playing/played = spiel*/gespielt
+ kommen = come/comes/coming/came = komm*/kam*/gekommen
+ trinken = drink/drinks/drinking/drank = trink*/getrunken
+ heißen = my name is/name = heiß* ; ich heiße = my name is
+ sprechen = speak/speaks/speaking/talk/talked/spoke = sprech*/sprich*/gesprochen
+ brauchen = need/needs/needed = brauch*
+ suchen = look for/looking for/looks for = such*/gesucht
+ sehen = see/sees/saw/seen = seh*/sieh*/gesehen
+ lieben = love/loves = lieb*
+ verstehen = understand/understands/understood = versteh*/verstanden
+ kosten = cost/costs = kost*
+ beginnen = start/starts/begin/begins = beginn*/begonnen
+ gehen = go/goes/going/went = geh*/ging*/gegangen
+ fahren = go/goes/going/went/drive/take/taking/travel = fahr*/fähr*/gefahren ; for going by vehicle
+ nehmen = take/takes/taking/took = nehm*/nimm*/genommen
+ sich treffen = meet/meeting = treff*/getroffen
+ bezahlen = pay/pays/paid = bezahl*/zahl*
+ wollen = want/wants/wanted = will/willst/wollen/wollt/wollte*
+ reservieren = book/reserve = reservier*
+ dürfen = allowed/may = darf*/dürf*
+ parken = park = park*
+ anrufen = call/calls/calling/called = ruf*/anruf*/angerufen ; separable: ich rufe dich an
+ lesen = read/reads/reading = les*/lies*/gelesen
+ essen = eat/eats/eating/ate/eaten = ess*/iss*/gegessen
+ schlafen = sleep/sleeps/slept/asleep = schlaf*/schläf*/geschlafen
+ aufstehen = get up/gets up/got up/getting up = steh*/aufsteh*/aufgestanden ; separable: ich stehe um sechs auf
+ ankommen = arrive/arrives/arrived = komm*/ankomm*/angekommen ; separable: der Zug kommt an
+ einkaufen = do the shopping/do our shopping/go shopping/shopping = kauf*/einkauf* ; separable: ich kaufe ein
+ kaufen = buy/buys/bought = kauf*/gekauft
+ frühstücken = have breakfast = frühstück*
+ kochen = cook/cooks/cooking/cooked = koch*/gekocht
+ besuchen = visit/visits/visiting/visited = besuch*
+ bleiben = stay/stays/staying/stayed = bleib*/geblieben
+ schreiben = write/writes/wrote/written = schreib*/geschrieben
+ regnen = rain/rains/raining/rained = regn*/geregnet
+ fliegen = fly/flies/flying/flew = flieg*/geflogen
+ glauben = think/thinks/believe = glaub*
+ wiederholen = repeat = wiederhol*
+ helfen = help/helps/helped = helf*/hilf*/geholfen
+ funktionieren = working/work = funktionier* ; for machines and things
+ gefallen = like/likes = gefäll*/gefall* ; die Stadt gefällt mir = I like the city
+ schmecken = taste/like the taste = schmeck*
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
Montag = Monday/Mondays
Dienstag = Tuesday/Tuesdays
Mittwoch = Wednesday/Wednesdays
Donnerstag = Thursday/Thursdays
Freitag = Friday/Fridays
Samstag = Saturday/Saturdays
Sonntag = Sunday/Sundays
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
schon = already/ever
sehr = very
spät = late
Stadt = city/town ; die Stadt
Straße = street/road ; die Straße
Stuhl/Stühle = chair/chairs ; der Stuhl, die Stühle
Suppe = soup ; die Suppe
Supermarkt = supermarket ; der Supermarkt
Tabletten = tablets/pills ; die Tablette
Tag/Tage/Tagen = day/days/days ; der Tag
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
Zimmer = room/rooms ; das Zimmer
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
vier = four
vierzig = forty
Herr = Mr ; der Herr
Frau = Mrs ; die Frau
geschlossen = closed
heute Nacht = tonight
lang = long
lange = a long time/long
Alkohol = alcohol ; der Alkohol
jeden/jede/jedes = every
gut = well/good
noch nichts = nothing yet/anything yet
Sommer = summer ; der Sommer
nächste/nächsten/nächster = next
letzte/letzten = last
um die Ecke = around the corner
möglich = possible
Vielen Dank = thank you very much/thanks a lot
dann = then
Monat/Monate/Monaten = month/months/months ; der Monat
sehr gern = I'd love to
Kein Problem = no problem
spät dran = running late
miteinander = to each other/with each other
`;

export interface LexEntry {
  key: string;
  target: string[];
  en: string[];
  note?: string;
  /** Verbs and expressions: the dictionary form the hint shows instead of the answer's own words. */
  show?: string;
}

const list = (s: string) => s.split("/").map((x) => x.trim()).filter(Boolean);

function parse(lang: Lang, table: string): LexEntry[] {
  return table.trim().split("\n").map((line) => {
    const [pair, note] = line.split(" ; ");
    if (pair.startsWith("+ ")) {
      const [show, e, t] = pair.slice(2).split(" = ").map((x) => x.trim());
      return { key: `${lang}:${show.toLowerCase()}`, target: list(t), en: list(e), show, note: note?.trim() };
    }
    const [t, e] = pair.split(" = ");
    const target = list(t);
    return { key: `${lang}:${(note ?? target[0]).toLowerCase()}`, target, en: list(e), note: note?.trim() };
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
  // Plain words come first so they win ties ("work" the noun over "work" the verb).
  lexicons ??= { fr: [...frameEntries(), ...parse("fr", FR), ...parse("fr", FR_VERBS)], de: [...parse("de", DE), ...parse("de", DE_VERBS)] };
  return lexicons[lang];
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Find a whole-word/phrase occurrence (case-insensitive); "parl*" matches any word starting "parl". */
function findForm(text: string, form: string): { index: number; text: string } | null {
  const body = form.endsWith("*") ? `${esc(form.slice(0, -1))}\\p{L}*` : esc(form);
  const m = new RegExp(`(?<![\\p{L}\\d])${body}(?![\\p{L}\\d])`, "iu").exec(text);
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

const MAX_GLOSSES = 5;
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
      // Verbs and expressions show only the dictionary form, so even a topic's own words can be hinted.
      if (!e.show && skip && findAny(skip, e.target)) continue;
      const inPrompt = findAny(ex.prompt, e.en);
      if (!inPrompt) continue;
      const inAnswer = answers.map((a) => findAny(a, e.target)).find(Boolean);
      if (!inAnswer) continue;
      if (e.show) found.push({ key: e.key, span: inPrompt.text, meaning: e.show, note: e.note, index: inPrompt.index });
      else found.push({ key: e.key, span: inPrompt.text, meaning: inAnswer.text, note: noteFor(e, inAnswer.text), index: inPrompt.index });
    }
  } else if (ex.type === "fill_blank" || ex.type === "multiple_choice" || ex.type === "transformation") {
    if (ex.type === "multiple_choice" && !ex.prompt.includes("___")) return [];
    const text = ex.type === "fill_blank" && ex.blank ? `${ex.blank.before} ___ ${ex.blank.after}` : ex.prompt;
    const answers = ex.type === "multiple_choice" ? (ex.options ?? []) : ex.type === "fill_blank" ? ex.accepted : [];
    for (const e of lex) {
      if (e.show || (skip && findAny(skip, e.target))) continue;
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

export interface LessonWord { word: string; en: string }

const isInfinitive = (w: string, lang: Lang) => lang === "fr" ? /^(se |s')?\p{L}+(er|ir|re|oir)$/u.test(w) : /^\p{L}+(en|ern|eln)$/u.test(w);
/** Lower case without articles, so "un podcast" and "a podcast" count as the same word. */
const bare = (s: string) => s.toLowerCase().replace(/^(un |une |le |la |les |l'|der |die |das |ein |eine |a |an |the )/, "").trim();

/**
 * The words a lesson's exercises use, in dictionary form with their meaning ("venir — come"),
 * for the "Words in this lesson" list on the lesson page. Taken from the course-language
 * sentences (answers, audio, dialogue lines), most frequent first. `exclude` drops words the
 * page already explains (e.g. the verbs heading its conjugation table).
 */
export function lessonWords(exercises: Exercise[], lang: Lang, exclude: string[] = [], max = 18): LessonWord[] {
  const lex = lexicon(lang);
  const skip = new Set(exclude.map((x) => x.toLowerCase()));
  const seen = new Map<string, { w: LessonWord; n: number; first: number }>();
  let order = 0;
  for (const ex of exercises) {
    const texts = [ex.audioText, ...(ex.type === "listening" || ex.type === "multiple_choice" ? [] : [ex.accepted?.[0]]), ...(ex.lines?.map((l) => l.fr) ?? [])]
      .filter((t): t is string => !!t).map((t) => t.replace(PATTERN, "$1"));
    for (const text of texts) {
      const hits: { e: LexEntry; index: number; len: number }[] = [];
      for (const e of lex) {
        const m = findAny(text, e.target);
        if (m) hits.push({ e, index: m.index, len: m.text.length });
      }
      hits.sort((a, b) => b.len - a.len || Number(!!b.e.show) - Number(!!a.e.show)); // a tie goes to the verb entry
      const taken: typeof hits = [];
      for (const h of hits) if (!taken.some((t) => h.index < t.index + t.len && t.index < h.index + h.len)) taken.push(h);
      for (const { e } of taken) {
        const word = e.show ?? e.note ?? e.target[0]; // plain entries' notes are their dictionary form ("das Kind, die Kinder")
        const en = e.show ? VERB_MEANING[e.show] ?? (isInfinitive(e.show, lang) && !/^(to |I'd )/.test(e.en[0]) ? `to ${e.en[0]}` : e.en[0]) : e.en[0];
        if (!en || bare(word) === bare(en) || skip.has(word.toLowerCase())) continue;
        const cur = seen.get(e.key);
        if (cur) cur.n++;
        else seen.set(e.key, { w: { word, en }, n: 1, first: order++ });
      }
    }
  }
  // "visiter Paris" adds nothing when "visiter" is listed too.
  const all = [...seen.values()];
  const words = all.filter((x) => !all.some((y) => y !== x && x.w.word.toLowerCase().startsWith(y.w.word.toLowerCase() + " ")));
  return words.sort((a, b) => b.n - a.n || a.first - b.first).slice(0, max).sort((a, b) => a.first - b.first).map((x) => x.w);
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

import type { ExplanationSection } from "./types";

type Ex = { fr: string; en: string };
type Table = { headers: string[]; rows: string[][] };
/**
 * Extra material for the French lesson pages, merged into the topics in curriculum.ts.
 * `more` adds spoken examples to an existing section (found by heading); `table` / `body`
 * replace that section's own; `add` appends new sections at the end.
 */
export interface Material {
  patch?: Record<string, { more?: Ex[]; table?: Table; body?: string }>;
  add?: ExplanationSection[];
}

const t = (rows: [string, string][]): Table => ({ headers: ["French", "English"], rows });

export const FR_MATERIAL: Record<string, Material> = {
  // ───────────── Week 1 ─────────────
  "w1-pronouns": {
    patch: {
      "Who is doing the action?": { more: [
        { fr: "Je travaille à Lyon.", en: "I work in Lyon." },
        { fr: "Elle habite ici.", en: "She lives here." },
        { fr: "On mange ensemble ?", en: "Shall we eat together?" },
        { fr: "Ils parlent anglais.", en: "They speak English." },
        { fr: "Elles aiment le café.", en: "They (all women) like coffee." },
      ] },
      "Tu or vous?": { more: [
        { fr: "Tu habites où ?", en: "Where do you live? (friend)" },
        { fr: "Vous habitez où ?", en: "Where do you live? (polite, or to a group)" },
        { fr: "On peut se tutoyer ?", en: "Shall we say tu to each other?" },
      ] },
    },
  },
  "w1-er-present": {
    patch: {
      "One pattern for 90% of verbs": { more: [
        { fr: "Je parle un peu français.", en: "I speak a little French." },
        { fr: "Tu travailles demain ?", en: "Are you working tomorrow?" },
        { fr: "Il regarde la télé.", en: "He's watching TV." },
        { fr: "Vous cherchez un appartement ?", en: "Are you looking for a flat?" },
        { fr: "Elles écoutent la radio.", en: "They're listening to the radio." },
      ] },
      "Small spelling adjustments": { more: [
        { fr: "Nous mangeons à midi.", en: "We eat at noon." },
        { fr: "Nous commençons à neuf heures.", en: "We start at nine." },
        { fr: "J'achète du pain.", en: "I'm buying some bread." },
        { fr: "Je préfère le thé.", en: "I prefer tea." },
      ] },
    },
    add: [{ heading: "Common -ER verbs", body: "The French present also means 'I am doing': je parle = I speak / I'm speaking.", table: t([
      ["parler", "to speak"], ["travailler", "to work"], ["habiter", "to live (somewhere)"], ["aimer", "to like, to love"], ["regarder", "to watch"],
      ["écouter", "to listen to"], ["chercher", "to look for"], ["étudier", "to study"], ["manger", "to eat"], ["jouer", "to play"],
    ]) }],
  },
  "w1-basic-sentences": {
    patch: {
      "The word order you already know": { more: [
        { fr: "Nous aimons le cinéma.", en: "We like the cinema." },
        { fr: "Le bus arrive.", en: "The bus is coming." },
      ] },
      "Introducing yourself": { more: [
        { fr: "Je suis anglaise.", en: "I'm English. (woman)" },
        { fr: "Je travaille comme infirmière.", en: "I work as a nurse." },
        { fr: "Enchanté(e) !", en: "Nice to meet you!" },
      ] },
      "Greetings": { body: "Bonjour works all day; switch to bonsoir in the evening. Salut is only for friends.", table: t([
        ["Bonjour", "Hello / Good morning"], ["Bonsoir", "Good evening"], ["Salut", "Hi / Bye (informal)"], ["Merci", "Thank you"],
        ["S'il vous plaît", "Please (polite)"], ["S'il te plaît", "Please (to a friend)"], ["Au revoir", "Goodbye"], ["Bonne journée", "Have a nice day"],
        ["À bientôt", "See you soon"],
      ]) },
    },
  },
  // ───────────── Week 2 ─────────────
  "w2-etre": {
    patch: {
      "Uses": { more: [
        { fr: "Je suis anglais.", en: "I'm English." },
        { fr: "Elle est infirmière.", en: "She's a nurse." },
        { fr: "Nous sommes fatigués.", en: "We're tired." },
        { fr: "Ils sont à la maison.", en: "They're at home." },
        { fr: "C'est très bien.", en: "That's very good." },
        { fr: "Tu es prêt ?", en: "Are you ready?" },
      ] },
    },
    add: [{ heading: "C'est", body: "C'est (it is / this is) is être with ce. Use it to point at or comment on something.", examples: [
      { fr: "C'est mon appartement.", en: "This is my flat." },
      { fr: "C'est cher !", en: "It's expensive!" },
      { fr: "Ce n'est pas loin.", en: "It's not far." },
    ] }],
  },
  "w2-avoir": {
    patch: {
      "Age uses avoir": { more: [
        { fr: "J'ai trente ans.", en: "I'm thirty." },
        { fr: "Tu as quel âge ?", en: "How old are you?" },
        { fr: "Nous avons deux enfants.", en: "We have two children." },
        { fr: "Elle a une voiture.", en: "She has a car." },
        { fr: "Ils ont un chien.", en: "They have a dog." },
      ] },
    },
    add: [{ heading: "Il y a (there is / there are)", body: "Il y a never changes, for one thing or many. In questions: Est-ce qu'il y a… ?", examples: [
      { fr: "Il y a une pharmacie près d'ici ?", en: "Is there a pharmacy near here?" },
      { fr: "Il y a beaucoup de monde.", en: "There are a lot of people." },
      { fr: "Il n'y a pas de lait.", en: "There's no milk." },
    ] }],
  },
  "w2-aller-faire": {
    patch: {
      "Aller (to go)": { more: [
        { fr: "Tu vas où ?", en: "Where are you going?" },
        { fr: "Elle va à Paris.", en: "She's going to Paris." },
        { fr: "Vous allez au marché ?", en: "Are you going to the market?" },
        { fr: "Ils vont aux États-Unis.", en: "They're going to the United States." },
        { fr: "Comment ça va ?", en: "How are you? (lit. how is it going?)" },
      ] },
      "Faire (to do / make)": { more: [
        { fr: "Qu'est-ce que tu fais ?", en: "What are you doing?" },
        { fr: "Nous faisons du sport.", en: "We do sport." },
        { fr: "Vous faites la cuisine ?", en: "Do you cook?" },
        { fr: "Il fait froid aujourd'hui.", en: "It's cold today." },
      ] },
    },
  },
  "w2-expressions": {
    patch: {
      "Avoir expressions": { body: "French uses avoir (to have) where English uses 'to be'.", table: t([
        ["avoir faim", "to be hungry"], ["avoir soif", "to be thirsty"], ["avoir froid", "to be cold"], ["avoir chaud", "to be hot"],
        ["avoir peur (de)", "to be scared (of)"], ["avoir raison", "to be right"], ["avoir tort", "to be wrong"], ["avoir sommeil", "to be sleepy"],
        ["avoir besoin de", "to need"], ["avoir envie de", "to feel like"],
      ]) },
      "Weather with faire": { more: [
        { fr: "Il fait beau aujourd'hui.", en: "The weather is nice today." },
        { fr: "Il fait froid ce matin.", en: "It's cold this morning." },
        { fr: "Il pleut encore !", en: "It's raining again!" },
      ] },
      "Small talk": { more: [
        { fr: "Ça va ? — Ça va bien, merci. Et vous ?", en: "How are you? — Fine, thanks. And you?" },
        { fr: "Merci ! — De rien.", en: "Thanks! — You're welcome." },
        { fr: "Pas de problème.", en: "No problem." },
      ] },
    },
    add: [{ heading: "In sentences", body: "", examples: [
      { fr: "J'ai faim, on mange ?", en: "I'm hungry, shall we eat?" },
      { fr: "Tu as raison.", en: "You're right." },
      { fr: "J'ai peur des chiens.", en: "I'm scared of dogs." },
      { fr: "J'ai besoin d'aide.", en: "I need help." },
      { fr: "J'ai envie d'un thé.", en: "I feel like a tea." },
    ] }],
  },
  // ───────────── Week 3 ─────────────
  "w3-articles": {
    patch: {
      "Every noun is masculine or feminine": { more: [
        { fr: "le pain, la baguette", en: "the bread, the baguette" },
        { fr: "la station, la réservation", en: "the station, the booking (-tion: feminine)" },
        { fr: "le fromage, le logement", en: "the cheese, the housing (-age, -ment: masculine)" },
      ] },
      "The articles": { more: [
        { fr: "J'ai un frère et une sœur.", en: "I have a brother and a sister." },
        { fr: "Il y a des pommes.", en: "There are some apples." },
        { fr: "J'aime le chocolat.", en: "I like chocolate. (likes take le / la / les)" },
      ] },
      "Contractions with à and de": { more: [
        { fr: "Elle est à la gare.", en: "She's at the station." },
        { fr: "Nous allons aux toilettes.", en: "We're going to the toilets." },
        { fr: "C'est le livre des enfants.", en: "It's the children's book." },
      ] },
    },
    add: [{ heading: "Some: du, de la, des", body: "For an unknown amount of something (food, drink), use du / de la / de l' / des. English often says nothing at all.", examples: [
      { fr: "Je mange du pain.", en: "I eat (some) bread." },
      { fr: "Tu veux de la soupe ?", en: "Do you want some soup?" },
      { fr: "Je bois de l'eau.", en: "I drink water." },
    ] }],
  },
  "w3-plurals": {
    patch: {
      "Regular plural: add -s": { more: [
        { fr: "le livre → les livres", en: "the book → the books" },
        { fr: "une clé → des clés", en: "a key → some keys" },
        { fr: "mon ami → mes amis", en: "my friend → my friends" },
      ] },
      "Special endings": { more: [
        { fr: "un gâteau → des gâteaux", en: "a cake → cakes" },
        { fr: "un journal → des journaux", en: "a newspaper → newspapers" },
        { fr: "un prix → des prix", en: "a price → prices" },
        { fr: "un œil → des yeux", en: "an eye → eyes" },
      ] },
    },
    add: [{ heading: "Everything changes together", body: "Article, noun, adjective and verb all go plural. Listen for les / des and the verb: ils parlent sounds like il parle, but ils ont is different from il a.", examples: [
      { fr: "Le chat dort. → Les chats dorment.", en: "The cat is sleeping. → The cats are sleeping." },
      { fr: "La chambre est grande. → Les chambres sont grandes.", en: "The room is big. → The rooms are big." },
    ] }],
  },
  "w3-adjectives": {
    patch: {
      "Agreement": { more: [
        { fr: "un grand appartement", en: "a big flat" },
        { fr: "une grande maison", en: "a big house" },
        { fr: "des amis anglais", en: "English friends" },
        { fr: "des voitures rouges", en: "red cars" },
      ] },
      "Common irregular feminines": { table: { headers: ["masculine", "feminine", "English"], rows: [
        ["beau", "belle", "beautiful"], ["nouveau", "nouvelle", "new"], ["vieux", "vieille", "old"], ["bon", "bonne", "good"],
        ["gentil", "gentille", "kind"], ["heureux", "heureuse", "happy"], ["cher", "chère", "expensive, dear"], ["blanc", "blanche", "white"],
      ] } },
      "Position": { more: [
        { fr: "un bon restaurant", en: "a good restaurant" },
        { fr: "une petite cuisine", en: "a small kitchen" },
        { fr: "une voiture rouge", en: "a red car" },
        { fr: "un film intéressant", en: "an interesting film" },
      ] },
    },
  },
  // ───────────── Week 4 ─────────────
  "w4-negation": {
    patch: {
      "Two parts around the verb": { more: [
        { fr: "Je ne parle pas allemand.", en: "I don't speak German." },
        { fr: "Ce n'est pas grave.", en: "It doesn't matter." },
        { fr: "Nous ne sommes pas prêts.", en: "We're not ready." },
        { fr: "Tu n'aimes pas le fromage ?", en: "Don't you like cheese?" },
      ] },
      "un / une / des → de after a negative": { more: [
        { fr: "Je n'ai pas de voiture.", en: "I don't have a car." },
        { fr: "Il n'y a pas de pain.", en: "There's no bread." },
        { fr: "Je ne bois pas d'alcool.", en: "I don't drink alcohol." },
        { fr: "Je n'aime pas le café.", en: "I don't like coffee." },
      ] },
      "Other negatives": { more: [
        { fr: "Je ne mange jamais de viande.", en: "I never eat meat." },
        { fr: "Il n'habite plus à Paris.", en: "He doesn't live in Paris any more." },
        { fr: "Je ne comprends rien.", en: "I don't understand anything." },
        { fr: "Je sais pas.", en: "Dunno. (spoken, ne dropped)" },
      ] },
    },
  },
  "w4-questions": {
    patch: {
      "Three ways to ask": { more: [
        { fr: "Tu parles français ?", en: "Do you speak French? (voice goes up)" },
        { fr: "Est-ce que tu parles français ?", en: "Do you speak French?" },
        { fr: "Parlez-vous français ?", en: "Do you speak French? (formal)" },
      ] },
      "Question words": { body: "The question word usually comes first, often followed by est-ce que. In speech it can also go at the end: Tu habites où ?", table: t([
        ["où", "where"], ["quand", "when"], ["comment", "how"], ["combien", "how much, how many"], ["pourquoi", "why"],
        ["qui", "who"], ["qu'est-ce que", "what"], ["quel, quelle", "which, what"], ["à quelle heure", "at what time"],
      ]) },
      "Inversion detail": { more: [
        { fr: "Parle-t-il anglais ?", en: "Does he speak English?" },
        { fr: "A-t-elle un rendez-vous ?", en: "Does she have an appointment?" },
      ] },
    },
    add: [{ heading: "More questions", body: "", examples: [
      { fr: "Quand est-ce que tu pars ?", en: "When are you leaving?" },
      { fr: "Pourquoi tu ris ?", en: "Why are you laughing?" },
      { fr: "Comment tu t'appelles ?", en: "What's your name?" },
      { fr: "Quelle heure est-il ?", en: "What time is it?" },
      { fr: "Qui est-ce ?", en: "Who is it?" },
    ] }],
  },
  "w4-prepositions": {
    patch: {
      "Cities and countries": { more: [
        { fr: "Je vais à Bordeaux.", en: "I'm going to Bordeaux." },
        { fr: "Elle habite au Canada.", en: "She lives in Canada." },
        { fr: "Nous allons en Espagne.", en: "We're going to Spain." },
        { fr: "Il travaille aux États-Unis.", en: "He works in the United States." },
      ] },
      "Everyday prepositions": { table: t([
        ["chez", "at someone's place"], ["dans", "in, inside"], ["sur", "on"], ["sous", "under"], ["avec", "with"], ["pour", "for"],
        ["sans", "without"], ["devant", "in front of"], ["derrière", "behind"], ["à côté de", "next to"], ["en face de", "opposite"], ["près de", "near"],
      ]) },
      "Transport": { more: [
        { fr: "Je vais au travail en métro.", en: "I go to work by metro." },
        { fr: "On y va à pied ?", en: "Shall we walk there?" },
        { fr: "Elle vient à vélo.", en: "She's coming by bike." },
      ] },
    },
    add: [{ heading: "In sentences", body: "", examples: [
      { fr: "Le chat est sous le lit.", en: "The cat is under the bed." },
      { fr: "La pharmacie est à côté de la banque.", en: "The pharmacy is next to the bank." },
      { fr: "Je dîne chez des amis.", en: "I'm having dinner at friends'." },
      { fr: "Un café sans sucre, s'il vous plaît.", en: "A coffee without sugar, please." },
    ] }],
  },
  // ───────────── Week 5 ─────────────
  "w5-irregular": {
    patch: {
      "Learn them in families": { more: [
        { fr: "Je prends le bus.", en: "I take the bus." },
        { fr: "Nous apprenons le français.", en: "We're learning French." },
        { fr: "Tu comprends ?", en: "Do you understand?" },
        { fr: "Ils viennent ce soir.", en: "They're coming tonight." },
        { fr: "Je pars demain.", en: "I'm leaving tomorrow." },
        { fr: "Tu sors ce soir ?", en: "Are you going out tonight?" },
        { fr: "Il dort.", en: "He's sleeping." },
      ] },
      "The others": { more: [
        { fr: "Je sais nager.", en: "I can swim. (know how to)" },
        { fr: "Tu vois la tour ?", en: "Can you see the tower?" },
        { fr: "Je mets mon manteau.", en: "I'm putting on my coat." },
        { fr: "Nous buvons du thé.", en: "We drink tea." },
        { fr: "Elle lit un livre.", en: "She's reading a book." },
        { fr: "J'écris un e-mail.", en: "I'm writing an email." },
      ] },
    },
    add: [{ heading: "What they mean", body: "", table: t([
      ["prendre", "to take"], ["apprendre", "to learn"], ["comprendre", "to understand"], ["venir", "to come"], ["partir", "to leave"],
      ["sortir", "to go out"], ["dormir", "to sleep"], ["savoir", "to know (a fact, how to)"], ["connaître", "to know (a person, a place)"],
      ["voir", "to see"], ["dire", "to say"], ["mettre", "to put, to put on"], ["boire", "to drink"], ["lire", "to read"], ["écrire", "to write"],
    ]) }],
  },
  "w5-ir-re": {
    patch: {
      "-IR like finir": { body: "Many -ir verbs add -iss- in the plural. Drop -ir, then add -is, -is, -it, -issons, -issez, -issent.", more: [
        { fr: "Je finis à six heures.", en: "I finish at six." },
        { fr: "Nous choisissons le menu.", en: "We're choosing the set menu." },
        { fr: "Ils réussissent toujours.", en: "They always succeed." },
      ] },
      "-RE like attendre": { more: [
        { fr: "Il attend le train.", en: "He's waiting for the train." },
        { fr: "Vous vendez votre voiture ?", en: "Are you selling your car?" },
        { fr: "Je réponds tout de suite.", en: "I'll answer straight away." },
        { fr: "Tu entends ?", en: "Can you hear?" },
        { fr: "Je perds toujours mes clés.", en: "I always lose my keys." },
      ] },
    },
    add: [{ heading: "Common verbs", body: "", table: t([
      ["finir", "to finish"], ["choisir", "to choose"], ["réussir", "to succeed, to pass"], ["attendre", "to wait (for)"],
      ["vendre", "to sell"], ["répondre", "to answer"], ["entendre", "to hear"], ["perdre", "to lose"],
    ]) }],
  },
  // ───────────── Week 6 ─────────────
  "w6-reflexive": {
    patch: {
      "The extra pronoun": { more: [
        { fr: "Je me réveille à sept heures.", en: "I wake up at seven." },
        { fr: "Tu te couches tard.", en: "You go to bed late." },
        { fr: "Elle s'habille.", en: "She's getting dressed." },
        { fr: "Nous nous promenons.", en: "We're going for a walk." },
        { fr: "Vous vous dépêchez ?", en: "Are you hurrying?" },
      ] },
      "Negative": { more: [
        { fr: "Je ne me lève pas tôt.", en: "I don't get up early." },
        { fr: "Il ne se rase pas.", en: "He doesn't shave." },
      ] },
    },
    add: [{ heading: "Common reflexive verbs", body: "Many are about what you do to yourself, so English often just says 'get' or nothing.", table: t([
      ["se lever", "to get up"], ["se réveiller", "to wake up"], ["se coucher", "to go to bed"], ["se laver", "to wash"],
      ["s'habiller", "to get dressed"], ["se doucher", "to shower"], ["se promener", "to go for a walk"], ["se dépêcher", "to hurry"],
      ["se reposer", "to rest"], ["s'amuser", "to have fun"], ["s'appeler", "to be called"],
    ]) }],
  },
  "w6-routine": {
    patch: {
      "Telling the time": { body: "Il est … heures. Minutes after the hour are added; before the hour use moins (minus). Official times (trains, shops) use the 24-hour clock.", table: t([
        ["Il est huit heures.", "It's 8:00."], ["huit heures et quart", "8:15"], ["huit heures et demie", "8:30"], ["neuf heures moins le quart", "8:45"],
        ["neuf heures moins dix", "8:50"], ["midi", "noon"], ["minuit", "midnight"], ["quinze heures", "3 pm (15:00)"], ["Quelle heure est-il ?", "What time is it?"],
      ]) },
      "Sequencing": { table: t([
        ["d'abord", "first"], ["ensuite", "then, next"], ["puis", "then"], ["après", "after, afterwards"], ["enfin", "finally"],
        ["le matin", "in the morning"], ["l'après-midi", "in the afternoon"], ["le soir", "in the evening"],
      ]) },
    },
    add: [{ heading: "A day in French", body: "", examples: [
      { fr: "Je me lève à sept heures.", en: "I get up at seven." },
      { fr: "Je prends le petit-déjeuner.", en: "I have breakfast." },
      { fr: "Je pars au travail à huit heures et demie.", en: "I leave for work at half past eight." },
      { fr: "Le soir, je fais la cuisine.", en: "In the evening, I cook." },
      { fr: "Enfin, je me couche vers onze heures.", en: "Finally, I go to bed around eleven." },
    ] }],
  },
  // ───────────── Week 7 ─────────────
  "w7-futur-proche": {
    patch: {
      "Formula": { more: [
        { fr: "Tu vas venir ce soir ?", en: "Are you going to come tonight?" },
        { fr: "Il va pleuvoir.", en: "It's going to rain." },
        { fr: "Vous allez réserver ?", en: "Are you going to book?" },
        { fr: "Ils vont acheter une maison.", en: "They're going to buy a house." },
      ] },
      "Negative and reflexive": { more: [
        { fr: "Je ne vais pas travailler demain.", en: "I'm not going to work tomorrow." },
        { fr: "On ne va pas rester longtemps.", en: "We're not going to stay long." },
        { fr: "Je vais me coucher.", en: "I'm going to go to bed." },
        { fr: "Tu vas te reposer ?", en: "Are you going to rest?" },
      ] },
    },
  },
  "w7-plans": {
    patch: {
      "Future time words": { table: t([
        ["demain", "tomorrow"], ["après-demain", "the day after tomorrow"], ["ce soir", "tonight"], ["ce week-end", "this weekend"],
        ["la semaine prochaine", "next week"], ["le mois prochain", "next month"], ["l'année prochaine", "next year"], ["dans deux jours", "in two days"], ["bientôt", "soon"],
      ]) },
      "Invitations": { table: t([
        ["Tu veux… ?", "Do you want to…?"], ["Ça te dit de… ?", "Do you fancy…?"], ["Avec plaisir !", "With pleasure!"], ["Bonne idée !", "Good idea!"],
        ["Désolé(e), je ne peux pas.", "Sorry, I can't."], ["On se retrouve où ?", "Where shall we meet?"], ["À quelle heure ?", "What time?"],
      ]) },
    },
    add: [{ heading: "Making plans", body: "", examples: [
      { fr: "Tu veux dîner avec nous samedi ?", en: "Do you want to have dinner with us on Saturday?" },
      { fr: "Désolée, je travaille ce week-end.", en: "Sorry, I'm working this weekend." },
      { fr: "On se retrouve devant le cinéma ?", en: "Shall we meet in front of the cinema?" },
      { fr: "La semaine prochaine, je vais à Lyon.", en: "Next week, I'm going to Lyon." },
    ] }],
  },
  // ───────────── Week 8 ─────────────
  "w8-pc-avoir": {
    patch: {
      "Formula": { more: [
        { fr: "Tu as fini ?", en: "Have you finished?" },
        { fr: "Il a travaillé hier.", en: "He worked yesterday." },
        { fr: "Vous avez réservé ?", en: "Have you booked?" },
        { fr: "Ils ont vendu la maison.", en: "They sold the house." },
      ] },
      "Negative": { more: [
        { fr: "Je n'ai pas mangé.", en: "I haven't eaten." },
        { fr: "Elle n'a pas répondu.", en: "She didn't answer." },
      ] },
      "Meaning": { more: [
        { fr: "J'ai parlé avec le propriétaire.", en: "I spoke / have spoken with the landlord." },
        { fr: "On a regardé un film.", en: "We watched a film." },
      ] },
    },
  },
  "w8-pc-irregular": {
    add: [{ heading: "In sentences", body: "Same formula as regular verbs (avoir + participle); only the participle is irregular.", examples: [
      { fr: "J'ai fait les courses.", en: "I did the shopping." },
      { fr: "Tu as pris le train ?", en: "Did you take the train?" },
      { fr: "Il a eu un accident.", en: "He had an accident." },
      { fr: "Nous avons vu un bon film.", en: "We saw a good film." },
      { fr: "Qu'est-ce que tu as dit ?", en: "What did you say?" },
      { fr: "J'ai mis la clé sur la table.", en: "I put the key on the table." },
      { fr: "Elle a bu un café.", en: "She had a coffee." },
      { fr: "J'ai dû partir.", en: "I had to leave." },
      { fr: "Je n'ai pas compris.", en: "I didn't understand." },
    ] }],
  },
  // ───────────── Week 9 ─────────────
  "w9-pc-etre": {
    patch: {
      "Which verbs?": { more: [
        { fr: "Elle est partie ce matin.", en: "She left this morning." },
        { fr: "Nous sommes restés à la maison.", en: "We stayed at home." },
        { fr: "Il est tombé.", en: "He fell." },
        { fr: "Ils sont venus en train.", en: "They came by train." },
      ] },
      "Agreement": { more: [
        { fr: "Marie est allée à Paris.", en: "Marie went to Paris." },
        { fr: "Mes parents sont arrivés.", en: "My parents have arrived." },
        { fr: "Les filles sont sorties.", en: "The girls went out." },
      ] },
      "Reflexives": { more: [
        { fr: "Je me suis levé à six heures.", en: "I got up at six." },
        { fr: "Elle s'est couchée tard.", en: "She went to bed late." },
        { fr: "Nous nous sommes promenés.", en: "We went for a walk." },
      ] },
    },
  },
  "w9-time": {
    patch: {
      "Past markers": { table: t([
        ["hier", "yesterday"], ["avant-hier", "the day before yesterday"], ["hier soir", "last night, yesterday evening"], ["ce matin", "this morning"],
        ["la semaine dernière", "last week"], ["le mois dernier", "last month"], ["l'année dernière", "last year"], ["déjà", "already"],
      ]) },
      "il y a / depuis / pendant": { more: [
        { fr: "Je suis arrivé il y a deux ans.", en: "I arrived two years ago." },
        { fr: "J'habite ici depuis deux ans.", en: "I've lived here for two years (and still do)." },
        { fr: "J'ai travaillé pendant trois heures.", en: "I worked for three hours." },
        { fr: "Depuis quand tu es là ?", en: "Since when have you been here?" },
      ] },
    },
  },
  // ───────────── Week 10 ─────────────
  "w10-object-pronouns": {
    patch: {
      "Direct objects": { more: [
        { fr: "Tu connais Marie ? — Oui, je la connais.", en: "Do you know Marie? — Yes, I know her." },
        { fr: "Où sont les clés ? — Je les ai.", en: "Where are the keys? — I've got them." },
        { fr: "Je l'aime.", en: "I love him / her / it." },
        { fr: "Je ne le vois pas.", en: "I don't see it." },
      ] },
      "Indirect objects": { more: [
        { fr: "Je lui téléphone ce soir.", en: "I'm calling him / her tonight." },
        { fr: "Tu leur parles ?", en: "Are you talking to them?" },
        { fr: "Je ne lui dis rien.", en: "I'm not telling him / her anything." },
      ] },
      "With two verbs": { more: [
        { fr: "Je vais l'appeler.", en: "I'm going to call him / her." },
        { fr: "Je peux lui parler ?", en: "Can I talk to him / her?" },
        { fr: "Tu dois les acheter.", en: "You have to buy them." },
      ] },
    },
  },
  "w10-y-en": {
    patch: {
      "y = there": { more: [
        { fr: "Tu vas à la gare ? — Oui, j'y vais.", en: "Are you going to the station? — Yes, I'm going (there)." },
        { fr: "On y va !", en: "Let's go!" },
        { fr: "J'y suis depuis lundi.", en: "I've been there since Monday." },
        { fr: "Je n'y vais pas.", en: "I'm not going (there)." },
      ] },
      "en = some / of it": { more: [
        { fr: "Tu as des enfants ? — Oui, j'en ai deux.", en: "Do you have children? — Yes, I have two." },
        { fr: "Il y a du pain ? — Non, il n'y en a pas.", en: "Is there any bread? — No, there isn't any." },
        { fr: "Tu veux du café ? — Oui, j'en veux bien.", en: "Do you want some coffee? — Yes, I'd love some." },
      ] },
    },
  },
  "w10-connectors": {
    patch: {
      "Connectors": { table: t([
        ["et", "and"], ["mais", "but"], ["ou", "or"], ["parce que", "because"], ["donc", "so, therefore"], ["alors", "so, then"],
        ["quand", "when"], ["si", "if"], ["pourtant", "yet, however"],
      ]), more: [
        { fr: "Il pleut, donc je prends le bus.", en: "It's raining, so I'm taking the bus." },
        { fr: "C'est cher, mais c'est bon.", en: "It's expensive, but it's good." },
        { fr: "Quand je suis fatigué, je me couche tôt.", en: "When I'm tired, I go to bed early." },
        { fr: "Tu veux du thé ou du café ?", en: "Do you want tea or coffee?" },
      ] },
      "Elision": { more: [
        { fr: "Je reste parce qu'il pleut.", en: "I'm staying because it's raining." },
        { fr: "S'il fait beau, on sort.", en: "If the weather's nice, we'll go out." },
      ] },
    },
  },
  // ───────────── Weeks 11–12 ─────────────
  "w11-listening": {
    patch: {
      "Liaison and elision": { more: [
        { fr: "Vous avez des enfants ?", en: "Do you have children? (vou-zavez)" },
        { fr: "Les enfants sont à l'école.", en: "The children are at school. (lé-zenfants)" },
        { fr: "Ils ont un appartement.", en: "They have a flat. (il-zont)" },
        { fr: "C'est un petit hôtel.", en: "It's a small hotel. (sé-tun)" },
      ] },
    },
    add: [{ heading: "Numbers and times to catch", body: "", examples: [
      { fr: "Le train part à dix-sept heures quinze.", en: "The train leaves at 17:15." },
      { fr: "Ça fait vingt-quatre euros cinquante.", en: "That comes to €24.50." },
      { fr: "Le rendez-vous est mardi à quatorze heures.", en: "The appointment is on Tuesday at 2 pm." },
      { fr: "C'est au troisième étage.", en: "It's on the third floor." },
    ] }],
  },
  "w11-situations": {
    patch: {
      "Survival phrases": { table: t([
        ["Pardon, vous pouvez répéter ?", "Sorry, can you repeat that?"], ["Plus lentement, s'il vous plaît.", "More slowly, please."],
        ["Qu'est-ce que ça veut dire ?", "What does that mean?"], ["Je voudrais…", "I'd like…"], ["Est-ce que c'est possible de… ?", "Is it possible to…?"],
        ["Je ne comprends pas.", "I don't understand."], ["Je vous remercie.", "Thank you (formal)."], ["L'addition, s'il vous plaît.", "The bill, please."],
      ]) },
    },
    add: [{ heading: "At the café, the doctor's, on the phone", body: "", examples: [
      { fr: "Bonjour Madame, une table pour deux, s'il vous plaît.", en: "Hello, a table for two, please." },
      { fr: "Je voudrais prendre rendez-vous avec le docteur.", en: "I'd like to make an appointment with the doctor." },
      { fr: "J'ai mal à la tête depuis hier.", en: "I've had a headache since yesterday." },
      { fr: "Allô, bonjour, c'est Sam Taylor à l'appareil.", en: "Hello, this is Sam Taylor speaking." },
      { fr: "Le chauffage ne marche pas.", en: "The heating isn't working." },
      { fr: "Je peux payer par carte ?", en: "Can I pay by card?" },
    ] }],
  },
  "w12-review": {
    patch: {
      "Mixing tenses": { more: [
        { fr: "Hier j'ai travaillé, aujourd'hui je me repose, demain je vais sortir.", en: "Yesterday I worked, today I'm resting, tomorrow I'm going to go out." },
        { fr: "Je ne suis pas allé au travail hier parce que j'ai eu de la fièvre.", en: "I didn't go to work yesterday because I had a fever." },
        { fr: "Tu peux m'appeler quand tu arrives ?", en: "Can you call me when you arrive?" },
        { fr: "J'habite à Lyon depuis un an et je vais rester.", en: "I've lived in Lyon for a year and I'm going to stay." },
        { fr: "Ce week-end, on va voir des amis.", en: "This weekend, we're going to see friends." },
        { fr: "Elle est partie il y a dix minutes.", en: "She left ten minutes ago." },
      ] },
    },
  },
};

/** Apply the extra material to a topic's explanation. */
export function withMaterial(id: string, sections: ExplanationSection[]): ExplanationSection[] {
  const m = FR_MATERIAL[id];
  if (!m) return sections;
  const out = sections.map((s) => {
    const p = m.patch?.[s.heading];
    if (!p) return s;
    return { ...s, ...(p.body !== undefined && { body: p.body }), ...(p.table && { table: p.table }), ...(p.more && { examples: [...(s.examples ?? []), ...p.more] }) };
  });
  return [...out, ...(m.add ?? [])];
}

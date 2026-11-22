# petit à petit — a private French & German tutor

A local-first language learning app for English speakers, from A1 towards A2, with a full
**French** course and a full **German** course (each learner picks one at sign-up).
Open `http://127.0.0.1:3000` each evening: it knows what you learned yesterday, what you
struggled with, what's due for review and what comes next, and builds today's 15–20 minute
lesson from that.

*« Petit à petit, l'oiseau fait son nid. »* (Little by little, the bird builds its nest.)

**Why it exists.** Generic language apps optimise for streaks and gems. This one acts like a patient
private tutor: one structured 12-week course, lessons rebuilt every day from your own mistakes,
honest scoring, and everything stored on your own machine. It works fully offline; AI is optional.

**Highlights**

- **A daily lesson planned for you**, based on mastery, spaced repetition and yesterday's mistakes, with a one-line reason for each choice.
- **8 exercise types**, including listening, dictation and sentence building, all with instant feedback that explains the rule.
- **Two complete 12-week courses:** French (with a real conjugation engine, ~80 verbs and three tenses, generating unlimited practice) and German (cases, separable verbs, Perfekt, word order, hand-written drills; answer checking understands umlauts typed as ae/oe/ue and ß as ss).
- **Guided real-life conversations** (café, landlord, doctor…) that understand free typing, with an optional AI partner.
- **Honest progress:** the headline score counts only exact first answers; near-misses, hints and retries are reported separately.
- **Private by design:** SQLite on your disk, server bound to localhost, JSON backups with automatic safety copies.

| | |
|---|---|
| **Stack** | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · SQLite / Turso (libSQL + Drizzle ORM) · Zod |
| **Hosting** | Local (single learner) or Vercel + Turso with logins and one database per learner |
| **AI (optional)** | Each learner's own Anthropic key (encrypted) or a server-wide Claude / local Ollama setup, schema-validated with automatic local fallback |
| **Voice** | Browser Web Speech API (no key, no cloud service of ours) |
| **Quality** | 152 Vitest unit/integration tests · Playwright end-to-end test · ESLint · strict TypeScript |

## Quick start

Requires Node.js 20+ (tested on Node 22).

```bash
npm install
npm run build
npm start          # → http://127.0.0.1:3000
```

For development with hot reload use `npm run dev`. The SQLite database is created
automatically at `data/french.db` on first launch (migrations + curriculum seed run on boot).

Both commands listen on `127.0.0.1` only, so the app (and its import/reset endpoints) is not
reachable from other devices on your network. Importing a backup saves a copy of your current
progress in `data/backups/` first.

## Host it for two people (free: Vercel + Turso)

Run locally, the app has one learner and no login. Hosted, it has **accounts**: people sign up
on `/signup` with a username, a password and the language they want to learn (French or
German), and each account gets **its own database** (streak, lessons, mistakes, settings and
backups are never shared). The course can't be switched later; a second account can learn
the other language. Hosting uses two free
plans: [Vercel](https://vercel.com) (the app) and [Turso](https://turso.tech) (hosted SQLite).
Free plan limits change, so check the current terms when you sign up.

**1. Turso** (web dashboard, no CLI needed)
1. Sign up at turso.tech. Create one database called e.g. `petit-accounts` in the location
   closest to you (for France: a Western Europe region). It only stores accounts.
2. Copy its **URL** (`libsql://…turso.io`) and create a **token** for it (read & write, no expiry).
3. Note your **organization slug** (your account/org name, shown in the dashboard URL) and the
   **group** the database is in (usually `default`).
4. Create a **Platform API token** (account settings → API tokens). The app uses it to create
   each new learner's database at sign-up.

**2. Deploy on Vercel**
1. Sign up at vercel.com with GitHub and **Import** this repository. The framework is detected
   as Next.js; keep the default build settings.
2. Before the first deploy, add these **Environment Variables** (Production):

   | Name | Value |
   |---|---|
   | `SESSION_SECRET` | 32+ random characters: run `npm run session-secret` and paste the output |
   | `ACCOUNTS_DB_URL` | the accounts database URL from step 1 |
   | `ACCOUNTS_DB_TOKEN` | its token |
   | `TURSO_API_TOKEN` | the Platform API token |
   | `TURSO_ORG` | your organization slug |
   | `TURSO_GROUP` (optional) | only if your group isn't called `default` |

3. In **Settings → Functions**, set the function region next to your Turso region, so each
   database call is a short hop.
4. Deploy, open the URL, choose **Create an account**, and send the link to the other person so
   they can make theirs. Each new account's database (`pap-<username>-…`) appears in your Turso
   dashboard.
5. Once you both have accounts you can add `SIGNUPS=closed` and redeploy, so nobody else can
   sign up even if the link gets around.

**Moving existing progress:** on the local app, Settings → Export progress; then on the
hosted app, sign in and use Settings → Import. Hosted imports download a copy of the current
hosted progress to your device first, because there's no server disk. A backup only imports
into an account learning the same language.

**Good to know**
- The hosted app refuses to run without `SESSION_SECRET` and `ACCOUNTS_DB_URL`, so it can't be
  deployed without logins by accident.
- Sessions last 30 days. Changing `SESSION_SECRET` signs everyone out.
- Failed logins are rate-limited (8 per 15 minutes per client and server instance), and
  sign-ups to 5 per hour per client, since each one creates a database.
- AI is off until a learner adds their own Anthropic key in Settings → AI tutor (encrypted,
  billed to them, invisible to the other learner). No extra Vercel variable is needed: it's
  encrypted with a key derived from `SESSION_SECRET` (or `AI_KEY_SECRET` if you set one).
  Local Ollama models don't work on Vercel.
- Reminders work while a tab of the site is open, as before.
- Local accounts (for testing): set `ACCOUNTS_DB_URL=data/accounts.db` and a `SESSION_SECRET`
  in `.env.local`. Without Turso API settings, each account's data goes to `data/<username>.db`.
- Local single-learner mode is French; set `FRANCAIS_LANG=de` to run it with the German course
  (data in `data/de.db`).

## What's inside

| Area | What it does |
|---|---|
| **Today** (`/`) | Today's lesson (Week · Day), why it was chosen, streak, weekly minutes, curriculum progress, recently learned, what needs review, "since last time", resume. |
| **Lesson player** | One challenge at a time: multiple choice, fill-in-the-blank, sentence builder, translation, grammar transformation, conjugation, listening (dictation & comprehension) and dialogue. Instant feedback with explanation, rule, word-level correction, hint → retry → reveal, a retry round for missed items, keyboard support, accent bar, speech synthesis. State is saved after every step, so a refresh resumes exactly where you were. |
| **Learn** (`/learn`) | The 12-week roadmap (week 12 is a Course review of weeks 1–10); practise any skill or revise any week. |
| **Practice** (`/practice`) | 8 real-life conversations (café, neighbour, landlord, directions, doctor, customer service, recruiter, friend). Offline: guided branching scripts that understand free typing. With AI: an open conversation partner that adapts to your level. Hint / translate / explain, optional speech input, end-of-conversation feedback. |
| **Progress** (`/progress`) | Streak, minutes, sessions, lessons, heatmap, accuracy over time, weekly/monthly time, mastery by topic, common mistakes, slipping items, recommendations. Computed only from recorded activity. |
| **History** (`/history`) | Every past lesson with your answers, corrections and explanations; past conversations. |
| **Settings** | Name, daily goal, reminders, AI toggle and status, audio speed, translations, theme, **export/import JSON backup**, reset. |

## How lessons are chosen (deterministic, testable)

- **Mastery** per skill is an exponential moving average of first-attempt credit (correct = 1, accent slip = 0.6, with a hint ≤ 0.7, wrong = 0). It decays slowly after a week without practice.
- A topic is **passed** at ≥ 70% mastery after ≥ 6 answers, once it has been a lesson's main topic. Passing is sticky, so the frontier never jumps backwards. Topics take as many days as you need ("Week 2 · Day 4" is normal).
- **Consolidation:** if a passed topic slips below 45% with repeated recent mistakes, the next lesson is an extra-practice day on it before moving on.
- **Spaced repetition** (SM-2 style) runs for every item (individual verb forms such as « tu parles », sentences, questions) and for each skill: wrong → tomorrow, right → 1 → 3 → ~7 days … (max 60).
- **Warm-up** = yesterday's unresolved mistakes first, then due items (most overdue first), then weakest skills.
- **Targeted pattern review:** if « nous » endings are missed 2+ times in 14 days, the next warm-up leads with one missed form plus one fresh verb. The focus retires after two unaided correct answers on different verbs, at least one on a later day.
- **Honest scoring:** a lesson's headline accuracy counts only exact, unaided first answers. Almost-right, hinted, transcript-supported, fixed-on-retry and missed answers are shown separately, and the recap shows your original mistake next to the correction.
- **Breaks:** after ≥ 5 days away you get a "welcome back" lesson with a longer warm-up. Nothing resets.
- **Streaks are gentle:** a single missed day doesn't break them.
- All daily boundaries use **Europe/Paris**. Today's lesson is created once per Paris date and persisted. A lesson keeps the date it was assigned; the streak is credited on the Paris date you finish it.

## Voice

Audio uses the browser's built-in **Web Speech API**: no API key, no extra cost, and no audio sent
to any service run by this app.

- **Listening & dictation** use `speechSynthesis`, which picks the best French (`fr-FR`) voice installed on your system. Speed is set in Settings → Speaking speed, which also has a Test button. If no French voice is found, install one in your OS speech settings (on Windows: Settings → Time & language → Speech → Add voices → Français).
- **Speaking in Practice** uses `SpeechRecognition` (Chrome/Edge). Note that in Chrome and Edge the browser vendor performs recognition in its own cloud. Typing always works instead.
- Without speech support, listening exercises show the text, and that counts as supported (not unaided) listening.

Content comes from a reviewed curriculum (`src/lib/content/`), a conjugation engine
(`src/lib/french/`, ~80 verbs: regular, stem-changing, irregular, reflexive; présent, passé
composé with agreement, futur proche; negation and elision) and generators that combine them
with sentence frames. That gives effectively unlimited, grammatically guaranteed variation,
with recently used items avoided.

## Optional AI (Anthropic Claude or Ollama)

The app is fully usable without AI. The easiest way to turn it on is **Settings → AI tutor**:
each learner pastes their own Anthropic API key and picks a model (Opus 5.5, Sonnet 5.5 or
Haiku 5.5). The key is checked with Anthropic before it's saved, stored encrypted (AES-256-GCM)
in that learner's own database, never shown again (only its last 4 characters), never exported,
and used only for that learner, so each person's AI usage is billed to their own account. The
encryption secret comes from `AI_KEY_SECRET`, or `SESSION_SECRET` if that isn't set (locally
without either, a random one is created in `data/ai-secret.key`). Changing the secret means
learners re-enter their key.

Alternatively, the person running the server can set one shared provider in `.env.local`
(learners who saved their own key still use theirs):

```bash
# Claude
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
# ANTHROPIC_MODEL=claude-opus-5-5   (default; set e.g. claude-sonnet-5-5 or claude-haiku-5-5 to cut cost)
```

```bash
# or a local model via Ollama (https://ollama.com): `ollama pull llama3.1:8b`
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.1:8b
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

What AI adds:
- **Lesson enrichment:** a personal intro (mentioning recent struggles), fresh examples, and up to 2 exercises plus a dialogue merged into the locally assembled lesson.
- **Flexible translation checking:** if a free-form answer isn't in the accepted list, the AI judges whether it is *correct* French or German (it never accepts merely understandable answers).
- **Open conversations** with gentle corrections, suggestions, explanations and an end-of-conversation summary.

Safety rails: keys are read only on the server. Every AI output must pass a strict Zod schema plus
domain checks (topic, CEFR level, one blank, unique options, exactly one correct reply), with one
automatic repair attempt. Validated outputs are cached in SQLite. On any failure the app silently
uses local content. A lesson is generated once per day and never regenerated on reload.
Calls to Claude use low effort for snappy replies and the server-side refusal fallback.

## Reminders

Choose a study time (default 20:30, Paris time). While any tab of the app is open (even in the
background) you get an in-app banner and, if you allow it, a browser notification. Browsers can't
run notifications when the browser or computer is closed, so for a guaranteed nudge also set a
phone alarm or calendar event. The dashboard also shows a banner once your study time has passed.

## Data & backups

- Everything lives in `data/french.db` (SQLite, WAL). Override with `FRANCAIS_DB_PATH`.
- **Settings → Export progress** downloads a JSON backup. **Import** restores one in a single transaction (invalid files change nothing).
- `npm run db:migrate` applies migrations; `npm run db:reset -- --yes` deletes the database.
- Schema changes: edit `src/lib/db/schema.ts`, then `npm run db:generate`.

## Development

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm test            # Vitest unit/integration tests (engine, normalisation, mastery, SRS, planner, dates, sessions, AI validation & fallback, backup, conversations, content integrity)
npm run build && npm run test:e2e   # Playwright: complete a lesson (with a mid-lesson reload) and see updated progress
```

The e2e test uses its own database (`data/e2e.db`) on port 3100. If Playwright's browser isn't
installed locally, run `npx playwright install chromium` once.

### Structure

```
src/app/                 routes (pages + /api route handlers)
src/components/          UI: lesson player, practice chat, dashboard, charts, shadcn-style primitives
src/lib/french/          normalisation, conjugation engine, answer evaluation
src/lib/content/         curriculum, sentence bank, frames, scenarios, exercise generators, templates
src/lib/learning/        dates (Europe/Paris), mastery, SRS, streaks, planner, lesson assembly
src/lib/services/        DB-backed services: lessons, sessions, progress, stats, conversations, backup
src/lib/ai/              provider adapter (Anthropic / Ollama), Zod schemas, enrichment, judging
src/lib/db/              Drizzle schema, libSQL client (file or Turso), seed sync;  drizzle/ = SQL migrations
src/lib/auth/            accounts DB, sign-up (creates each learner's Turso DB), scrypt passwords, signed cookies;  src/proxy.ts = login gate
```

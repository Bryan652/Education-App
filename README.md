# Education App

One place for everything school: your schedule, subjects, notes, quiz cards, grades and an AI study chat. The goal is an open source app that students can use for free.

> **Status: early preview.** Google sign-in, subjects, grades, the schedule, notes, quiz cards, AI chat and Google Calendar sync all work with a real database. AI chat uses each student's own API key. With no setup, everything runs on sample data.

## Features

|  Feature   |                                What's there now                               |
| :--------: | :---------------------------------------------------------------------------: |
| Dashboard  |            Today's classes, cards due, deadlines, grades and notes            |
|  Subjects  |         Add, edit, archive and delete subjects, each with its own page        |
|  Schedule  | Week, month and list views; selecting a class opens that subject's quiz cards |
|  Google Calendar  |  Optional one-way sync of classes and deadlines into a calendar of their own  |
|   Notes    |        Rich text editor with autosave, search, filters and attachments        |
| Quiz cards |      Decks, a subject filter, study, practice and spaced repetition           |
|   Grades   |  Weighted categories, editable grading scales, averages and a weight warning  |
|  AI chat   |  Your own AI keys, a model picker, answers from your notes, cards from a note |
|  Settings  |         Profile, terms, grading scales, AI keys and Google connections        |
| Night mode |          Light by default, and remembers your choice on each device           |

## Getting started

You need [Node.js](https://nodejs.org) 22 or newer.

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>. No account is needed for this preview.

## Connect sign-in and the database

These steps turn on Google sign-in. Everything in them is free to start.

**1. Create a Supabase project**

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env.local`.
3. Fill in both values from **Project Settings > API Keys**. Never commit `.env.local`.

**2. Create the database tables**

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npm run db:push
```

**3. Set up Google sign-in**

1. In [Google Cloud](https://console.cloud.google.com), create a project and open **Google Auth Platform**.
2. Fill in **Branding**, and add yourself as a test user under **Audience**.
3. Under **Data Access**, add the `openid` scope.
4. Under **Clients**, create a **Web application** client.
5. Add `http://localhost:3000` under **Authorized JavaScript origins**.
6. Add `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` under **Authorized redirect URIs**.

**4. Connect Google to Supabase**

1. In Supabase, open **Authentication > Providers > Google**, turn it on, and paste the Client ID and Client Secret.
2. Under **Authentication > URL Configuration**, set **Site URL** to `http://localhost:3000`.
3. Add `http://localhost:3000/**` to **Redirect URLs**.

**5. Restart the app**

Stop `npm run dev` and start it again so it picks up `.env.local`. Every page now requires sign-in.

## Connect Google Calendar (optional)

Students can copy their classes, exams and deadlines into Google Calendar. Sync only goes one way, into a calendar the app makes called **Education App**, and the app can't see or change any other calendar. Skip this section and the option just says it isn't set up.

1. In Google Cloud, open **APIs & Services > Library** and enable the **Google Calendar API**.
2. In **Google Auth Platform > Data Access**, add the `.../auth/calendar.app.created` scope.
3. In the web client you made for sign-in, add `http://localhost:3000/api/google/callback` under **Authorized redirect URIs**.
4. In Supabase, copy a secret key from **Project Settings > API Keys > Secret keys**.
5. Fill in the Google section of `.env.example` in your env file, then restart `npm run dev`.

While the Google app is in **Testing**, only your test users can connect, and Google stops accepting the connection after 7 days. Settings then asks the student to connect again. Publishing the app with Calendar access needs Google's verification.

## Deploy

1. Push the code to GitHub, then import the repository at [vercel.com](https://vercel.com).
2. In Vercel, add the same two values from your env file under **Environment Variables**, using the **Config** type, then redeploy. They're public by design, and the app only picks them up at build time.
3. Add your Vercel URL to **Authorized JavaScript origins** in Google Cloud.
4. Add `https://YOUR_APP.vercel.app/**` to **Redirect URLs** in Supabase, and set **Site URL** to your Vercel URL. Keep `http://localhost:3000/**` so local sign-in still works.
5. For Google Calendar, add `https://YOUR_APP.vercel.app/api/google/callback` to the client's **Authorized redirect URIs**, and add the four Google Calendar values in Vercel marked **Sensitive**. Unlike the Supabase values, they're secrets and are read when the app runs.

## Commands

|      Command       |                 What it does                |
| :----------------: | :-----------------------------------------: |
|   `npm run dev`    |         Starts the local dev server         |
|  `npm run build`   |            Builds for production            |
|  `npm run start`   | Runs the production build after building it |
|   `npm run lint`   |            Checks the code style            |
|     `npm test`     |             Runs the unit tests             |
| `npm run db:push`  |     Applies database changes to Supabase    |
| `npm run db:types` |        Regenerates the database types       |

## Tech stack

|       Part      |            Using             |  Status |
| :-------------: | :--------------------------: | :-----: |
|    Framework    |     Next.js + TypeScript     |  In use |
|        UI       |   Tailwind CSS + shadcn/ui   |  In use |
|     Calendar    |         FullCalendar         |  In use |
|   Note editor   |            Tiptap            |  In use |
| Database, login | Supabase with Google sign-in |  In use |
|   Quiz timing   |           ts-fsrs            |  In use |
|    AI chatbot   | Each student's own API keys  |  In use |
|     Hosting     |            Vercel            | Planned |

## Project docs

- [Plan](PLANS/plan.md): the tech stack, open source goal, bring-your-own-key AI, linked features, grading systems, growth stages, build order and open questions
- [Database structure](PLANS/db-structure.md): every table and column
- [File structure](PLANS/file-structure.md): where each file goes

The sample data is in `src/lib/mock-data.ts`, and "today" is always November 4, 2026 when running with no setup.

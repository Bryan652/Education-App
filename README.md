# Education App

One place for everything school: your schedule, subjects, notes, quiz cards, grades and an AI study chat. The goal is an open source app that students can use for free.

> **Status: early preview.** Every main screen works with sample data, but nothing is saved yet. Google sign-in and the database are ready to connect, and the AI isn't built yet.

## Features

|  Feature   |                                 In the preview                                |
| :--------: | :---------------------------------------------------------------------------: |
| Dashboard  |            Today's classes, cards due, deadlines, grades and notes            |
|  Subjects  |            A page for each subject, with its grades and class times           |
|  Schedule  | Week, month and list views; selecting a class opens that subject's quiz cards |
|   Notes    |                      Rich text editor, search and filters                     |
| Quiz cards |                     Subject filter, card flip and ratings                     |
|   Grades   |   Weighted categories, a grading scale, GPA and a warning for wrong weights   |
|  AI chat   |           Past chats and sending messages, with a placeholder reply           |
|  Settings  |              Profile, terms, grading scale and Google connections             |

## Getting started

You need [Node.js](https://nodejs.org) 22 or newer.

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>. With no setup, the app runs on sample data with no login.

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

## Deploy

1. Push the code to GitHub, then import the repository at [vercel.com](https://vercel.com).
2. In Vercel, add the same two values from your env file under **Environment Variables**, using the **Config** type, then redeploy. They're public by design, and the app only picks them up at build time.
3. Add your Vercel URL to **Authorized JavaScript origins** in Google Cloud.
4. Add `https://YOUR_APP.vercel.app/**` to **Redirect URLs** in Supabase, and set **Site URL** to your Vercel URL. Keep `http://localhost:3000/**` so local sign-in still works.

## Commands

|      Command       |                 What it does                |
| :----------------: | :-----------------------------------------: |
|   `npm run dev`    |         Starts the local dev server         |
|  `npm run build`   |            Builds for production            |
|  `npm run start`   | Runs the production build after building it |
|   `npm run lint`   |            Checks the code style            |
| `npm run db:push`  |     Applies database changes to Supabase    |
| `npm run db:types` |        Regenerates the database types       |

## Tech stack

|       Part      |            Using             |  Status |
| :-------------: | :--------------------------: | :-----: |
|    Framework    |     Next.js + TypeScript     |  In use |
|        UI       |   Tailwind CSS + shadcn/ui   |  In use |
|     Calendar    |         FullCalendar         |  In use |
|   Note editor   |            Tiptap            |  In use |
| Database, login | Supabase with Google sign-in | Planned |
|   Quiz timing   |           ts-fsrs            | Planned |
|    AI chatbot   | Each student's own API keys  | Planned |
|     Hosting     |            Vercel            | Planned |

## Project docs

- [Plan](PLANS/plan.md): the tech stack, open source goal, bring-your-own-key AI, linked features, grading systems, growth stages, build order and open questions
- [Database structure](PLANS/db-structure.md): every table and column
- [File structure](PLANS/file-structure.md): where each file goes

The sample data is in `src/lib/mock-data.ts`, and "today" is always November 4, 2026 in the preview.

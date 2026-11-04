# Education App Plan

**Recommendation:** build one responsive web app with Next.js and Supabase. The features are mostly forms, lists and records tied to a user, so a separate backend isn't needed.

**Assumptions:** solo project, on a low budget, open source and free for other students to use.

## Tech stack

|       Need       |              Use               |                       Why                        |
| :--------------: | :----------------------------: | :----------------------------------------------: |
|  App framework   |      Next.js + TypeScript      |      Frontend and server routes in one repo      |
|        UI        |    Tailwind CSS + shadcn/ui    |        Ready-made forms, dialogs and tabs        |
|     Database     |      Supabase (Postgres)       |       Linked data, with row-level security       |
| Login and Google | Supabase Auth + Google sign-in |    Can request Google permissions at sign-in     |
|    Scheduling    |          FullCalendar          | Day, week and month views; can sync with Google  |
|      Notes       |             Tiptap             |    Rich text editor that saves notes as JSON     |
|    Quiz cards    |    Custom card UI + ts-fsrs    | Schedules reviews by how well you knew each card |
|      Grades      | TypeScript functions + Vitest  |       Keeps the calculations easy to test        |
|    AI chatbot    |  Each student's own API keys   |           AI costs the project nothing           |
|     Hosting      |             Vercel             |      Easy GitHub deploys, with a free tier       |

## Open source goal

The app will be open source and free, so students don't need to pay for premium software. Each student brings their own AI key, so the project doesn't pay for AI.

## AI: bring your own key

**Decision: yes.** Each student uses their own API key, so AI costs the project nothing.

- **Keys:** a Settings page lets students add several keys, name them, test them and delete them.
- **Models:** the chat has a picker that lists the models available from the selected key.
- **Direct calls:** the browser calls the provider directly, so there's no AI server route to pay for.
- **Limits:** when a key hits its limit, the chat says which key ran out and offers to switch.

### Provider support

Checked November 2026 by sending each provider a browser preflight request with no key. This shows the browser is allowed to call the provider, but it still needs testing with real keys in step 7.

|  Provider  | Browser check |                        Use                         |
| :--------: | :-----------: | :------------------------------------------------: |
|    Groq    |     Passed    |        Suggested first key, has a free plan        |
|   Gemini   |     Passed    |       Suggested second key, has a free plan        |
| OpenRouter |     Passed    |             Optional, has free models              |
|  Mistral   |     Passed    |                      Optional                      |
|   OpenAI   |     Passed    |                      Optional                      |
| Anthropic  |     Passed    |     Optional, needs its browser access header      |
|   Ollama   |   Not tested  | Optional, runs on the student's own PC with no key |

### Keeping keys safe

- Keys stay on the student's device. They never go in the database, and they're only sent to the provider they belong to.
- Anything running on the page could read a stored key, so the app has no ads, no third-party scripts and a strict Content Security Policy.
- Settings has a "Remove all keys" button and an option to forget keys when the tab closes, for shared computers.
- Settings reminds students to set a spending limit on any paid key.
- The chat shows which provider and which note it's sending data to.

## AI options and prices

These are the options students choose from for their own keys. Prices and limits checked November 2026. They change often, so confirm them on each provider's site. No hosted option is unlimited.

### Free plans

|        Option       | Price |                   Free limit                   |                 Main catch                 |
| :-----------------: | :---: | :--------------------------------------------: | :----------------------------------------: |
|   Groq (first key)  |   $0  |  30 requests/min, 1,000/day, 8,000 tokens/min  |    Long notes can hit the minute limit     |
| Gemini (second key) |   $0  |      Varies by model; shown in AI Studio       | Free content can improve Google's products |
|      OpenRouter     |   $0  | 20 requests/min, 50/day; 1,000 with 10 credits |    50 a day runs out quickly in a chat     |
|        Ollama       |   $0  |            Unlimited on your own PC            |       Only works while your PC is on       |

### Paid prices

Only needed if the free limits stop being enough. Prices are per 1M tokens.

|  Provider  |        Model         |   Input per 1M   |  Output per 1M   |                 Notes                 |
| :--------: | :------------------: | :--------------: | :--------------: | :-----------------------------------: |
|    Groq    |     gpt-oss-20b      |      $0.075      |      $0.30       |         Cheapest hosted model         |
|    Groq    |     gpt-oss-120b     |      $0.15       |      $0.60       |              Larger model             |
|   Gemini   |    3.1 Flash-Lite    |      $0.25       |      $1.50       |        Audio input costs $0.50        |
|   Gemini   |    3.5 Flash-Lite    |      $0.30       |      $2.50       |                                       |
|   Gemini   | 3.6 Flash, 3.8 Flash |      $0.75       |      $3.75       | Rises to $1.50 / $7.50 on Jan 1, 2027 |
| OpenRouter |     Paid models      | Provider's price | Provider's price |  Plus a 5.5% fee when buying credits  |
|   Ollama   |     Local models     |        $0        |        $0        |       Runs on your own hardware       |

### Notes

- Groq's limits come from its Developer plan table and a third-party roundup. Confirm the free plan's limits on the limits page in the Groq account. Groq also lists a limit of 200,000 tokens/day.
- Gemini's Google Search feature isn't included in its free tier. To search the web, the app would probably need a separate search API.

## Project structure

- [Database structure](db-structure.md)
- [File structure](file-structure.md)

## Linked features

Steps 4 and 6 connected these to real data. Neither needed a database change, because `class_meetings`, `events` and `decks` already have a `subject_id`.

### Schedule to quiz cards

Selecting a scheduled class or deadline opens the quiz cards for that subject. For example, selecting a Calculus II class opens `/decks?subject=calculus`, which shows only the Calculus II decks.

- Personal events with no subject don't link anywhere.
- If a subject has no decks yet, the page offers to create one or show all subjects.

### Subject filter on quiz cards

The quiz cards page has a filter with "All subjects" and one option per subject.

- The selected subject is stored in the URL, so reloading the page or sharing the link keeps it.
- "All subjects" lists the decks in the same order as the subjects.

## Grading systems

**Decision: yes.** Schools calculate grades differently, so students choose the system their school uses in Settings. Each subject can override that choice if needed.

|           System          |    Best grade   | Better direction |  Average called |
| :-----------------------: | :-------------: | :--------------: | :-------------: |
|        A to F (4.0)       |     A or 4.0    |  Higher number   |       GPA       |
| Philippine (1.00 to 5.00) |       1.00      |   Lower number   |       GWA       |
|         Percentage        |       100%      |  Higher number   |     Average     |
|           Custom          | Student chooses | Student chooses  | Student chooses |

- **Presets are starting points:** cutoffs differ even between schools in the same country, so students can edit any preset to match their handbook.
- **Switching is safe:** final grades are calculated from raw scores and never stored, so changing systems doesn't lose anything.
- **Direction matters everywhere:** "lower is better" must apply to passing and failing, grade colors and anything that compares grades.
- **Averages:** GPA and GWA use the same math, which is each grade point times its units, added up, then divided by the total units.
- **Base grades:** some schools start every score at a base, so with a base of 50, the percent is 50 + (score ÷ total × 50). Each scale can set a base, and the default is 0.
- **Mixed scales:** if subjects use different systems, the app leaves any subject outside the default system out of the average and says so.
- **Later:** lookup-table transmutation, for schools that convert scores with a fixed table instead of a formula.

Until a student adds a scale in Settings, the app uses A to F (4.0), so grades work from the start. A student's first scale becomes their default.

## If more students join

The app can start on free plans and only pay for more when real students are using it. These are rough estimates from November 2026 prices. They assume each student has 5 MB of data and 20 MB of files, and downloads 100 MB a month.

|        Stage         |      Students (rough)     |     Monthly cost    |                    What to do                   |
| :------------------: | :-----------------------: | :-----------------: | :---------------------------------------------: |
|    1. Free plans     | About 50 to a few hundred |          $0         | Limit uploads or use the student's Google Drive |
|    2. Paid plans     |     Up to about 1,600     |   About $25 to $45  |  Move to Supabase Pro, and Vercel Pro if needed |
| 3. Bigger paid plans |        About 5,000        |      About $70      | Fund it with donations, such as GitHub Sponsors |
|   4. Self-hosting    |         Any number        | Paid by each school |       Schools and clubs run their own copy      |

File storage and downloads run out first, not the number of students. The free plans reach a few hundred students only if files move off Supabase. Vercel Pro costs $20 a month.

Build these early, because they're harder to add later:

- **Limits per student:** cap upload sizes and storage so one person can't use up the shared quota.
- **Usage and spending alerts:** see limits coming, and set a hard spending cap so there's never a surprise bill. Vercel Pro has spend controls, but check what Supabase offers.
- **Data export:** students can take their notes and grades with them if the app ever has to pause.
- **Self-hosting instructions:** being open source makes this possible, but schools will only do it if setup is simple.

Risks and things to confirm:

- **Donations aren't guaranteed:** decide on a monthly amount you're comfortable covering. If costs reach it, pause new sign-ups instead of paying more.
- **Vercel's free plan is non-commercial:** check whether accepting donations is allowed.
- **Open source credits:** check whether Supabase or Vercel offer them. This hasn't been confirmed.

## Build order

Make subjects the core of the data model, with schedules, notes, cards and grades all linked to a subject.

1. **Foundation:** set up the project, Google login, database, deployment, and usage and spending alerts.
2. **Subjects:** add creating, editing and deleting subjects.
3. **Grades:** add weighted categories and selectable grading systems, including ones where a lower number is better.
4. **Schedule:** add classes and deadlines to the calendar, with links to each subject's quiz cards.
5. **Notes:** add the editor, search, and upload and storage limits.
6. **Quiz cards:** add decks, a subject filter, study mode and spaced repetition.
7. **AI chatbot:** add the key manager and model picker, then answer questions using the current note or subject. Optionally add "generate cards from this note".
8. **Google integration:** connect only the services that are needed.
9. **Ready to grow:** add data export and self-hosting instructions.

**Step 1 status:** done. Google sign-in works locally and on the deployed Vercel site with the real Supabase project. Pages show sample data until step 2. Alerts need nothing while on free plans with no payment card, so set them up when moving to a paid plan.

**Step 2 status:** the code is done and tested against a local stand-in for Supabase. It still needs `npm run db:push` on the real project, then the updated code deployed. Subjects and terms are real, including create, edit, archive, restore and delete.

**Steps 3, 4 and 5 status:** the code is done and tested against a full local copy of Supabase, including row-level security and Storage. Like step 2, it still needs `npm run db:push` on the real project, then the updated code deployed. AI chat keeps showing sample subjects until step 7.

- **Step 3:** categories, scores and grading scales are real, and each subject can choose its own scale. The profile form in Settings also became real, because step 4 needs the student's time zone.
- **Step 4:** class times and events are real. The browser fills in the student's time zone on their first visit, and they can change it in Settings. Selecting something on the calendar opens quiz cards, so events are edited from the list below the calendar.
- **Step 5:** notes save automatically as JSON, search matches the start of words, and attachments go straight from the browser to Storage. Each file can be up to 10 MB, and each student can store 50 MB, which Supabase enforces as well as the app. These limits can change, and the plan's cost estimates assume about 20 MB per student.

**Step 6 status:** the code is done and tested against a full local copy of Supabase. It still needs `npm run db:push` on the real project, then the updated code deployed. Decks, cards, the subject filter, study mode and spaced repetition are real. Reviews are scheduled in whole days, with "Again" repeating the card later in the same session. "Make cards" on a note stays a placeholder until step 7.

## Things to watch for

- **Google tokens:** Supabase doesn't refresh Google access tokens, so the app must store and refresh them itself to keep Calendar sync running.
- **Google OAuth limits:** in "Testing" status, the app is limited to 100 test users and refresh tokens expire after 7 days. Going public with Calendar or Classroom access requires Google's verification.
- **Free-tier limits:** Supabase can pause inactive free projects, and Vercel's free plan is for non-commercial use only. Check the current terms before relying on either.
- **AI limits:** students' free plans can run out or change, so the chat should explain what happened and offer another key.
- **AI privacy:** don't send sensitive information, especially to Gemini's free tier.
- **Search for the chatbot:** skip a vector database at first, because sending the current note as context is enough. To search all notes later, use Supabase's pgvector extension.

## Open questions

1. **Is a phone app needed?** Assumed no, since an installable web app (PWA) covers most of this. For an App Store or Play Store release, switch the frontend to Expo (React Native) and keep Supabase.
2. **What should "Google connection" include?** Suggested start: Google sign-in and Calendar. Classroom and Drive add more permission and verification work.
3. **Which open source license?** MIT lets anyone reuse the code, including in paid products. AGPL-3.0 requires anyone who hosts a changed version to share their code, which fits the goal of keeping it free.

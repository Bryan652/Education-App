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

- **Keys:** a Settings page lets students add several keys, name them, test them and delete them. With no key yet, the chat, Settings and "Make cards" all link to the free options.
- **Models:** the chat has a picker that lists the models available from the selected key.
- **Direct calls:** the browser calls the provider directly, so there's no AI server route to pay for.
- **Limits:** when a key hits its limit, the chat says which key ran out and offers to switch.

### Provider support

Checked November 2026 by sending each provider a browser preflight request with no key. This shows the browser is allowed to call the provider. Step 7 was tested against simulated provider replies, so it still needs trying with real keys.

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
- Anything running on the page could read a stored key, so the app has no ads, no third-party scripts apart from Vercel Analytics, and a Content Security Policy. Its `connect-src` means the page can only send data to this site, Supabase and the listed AI providers.
- The policy still allows inline scripts (`'unsafe-inline'`), which Next.js needs. The stricter nonce version would make every page render on demand, which rules out the static shells behind fast navigation. So `connect-src` is what limits a key leaking, and the app must keep avoiding third-party scripts and raw HTML.
- Settings has a "Remove all keys" button and an option to forget keys when the tab closes, for shared computers. Signing out also offers to remove them, ticked by default, so the next student can't use a paid key.
- Settings reminds students to set a spending limit on any paid key.
- Vercel Analytics only loads on Vercel, from the site's own address. It's Vercel's code, so it's trusted the same way as the hosting itself. Query strings are removed before anything is sent, because they can hold what a student searched for.
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

**Step 6 status:** the code is done and tested against a full local copy of Supabase. It still needs `npm run db:push` on the real project, then the updated code deployed. Decks, cards, the subject filter, study mode and spaced repetition are real. Reviews are scheduled in whole days, with "Again" repeating the card later in the same session. Students can also practice a deck's cards any time, which doesn't change their schedule or study history, so extra practice can't throw off the spacing. "Make cards" on a note stays a placeholder until step 7.

**Step 7 status:** the code is done and tested against a full local copy of Supabase, with provider replies simulated. It still needs `npm run db:push` on the real project, then the updated code deployed, then trying with a real key. Keys, the model picker, chat, and making cards from a note are real, and signed-in students no longer see any sample data. The app sends a limited amount of each note and chat, to stay within free plans, and tells the student when it's cut something.

**Step 8 status:** the code is done and unit tested, with Google's replies simulated. It still needs `npm run db:push` on the real project, the Google Cloud and env setup in the README, the updated code deployed, then trying with a real Google account. Google Calendar sync is real, and Settings no longer lists Classroom or Drive. See [Google Calendar sync](#google-calendar-sync).

## Google Calendar sync

**Decision: Calendar only, one way.** Google sign-in and Calendar are the only Google services connected. Classroom and Drive each need more permissions and Google's verification, so they wait until students ask for them.

- **One way:** the app copies classes, exams and deadlines into Google. Edits made in Google are replaced on the next sync, and each event's description says so. Two-way sync would need conflict handling, and isn't worth it yet.
- **Smallest permission:** the app asks for `calendar.app.created`, which only lets it make its own calendars and manage events in them. It makes one called Education App, and can't see or change the student's other calendars.
- **Separate from sign-in:** students connect Calendar from Settings, so signing in still asks only for name and email.
- **When it syncs:** after any save that changes the calendar, once the response has gone, so saving never waits for Google. Settings also has "Sync now". Each sync lists the app's events and sends only what changed.
- **Event IDs:** each Google event's ID comes from the app's own row ID, so two syncs at once can't make duplicates, and no `google_event_id` column is needed.
- **What's copied:** the same things as the app's calendar. Classes repeat weekly until their term ends, archived subjects are left out, and deadlines with no end time get 15 minutes.
- **Tokens:** the refresh token is encrypted with AES-256-GCM, using a key only the server has, and tied to the student's ID. Only server code can read `google_connections`.
- **Disconnecting:** revokes the app's access in Google and, unless the student unticks it, deletes the Education App calendar. Revoking also clears the sign-in consent, so Google asks again at the next sign-in.
- **Expired access:** if Google stops accepting the token, such as after 7 days while the Google app is in Testing, Settings asks the student to connect again.

## Speed

**Decision: yes.** Tab switching felt slow, at about 3 seconds on the deployed site, because each page ran 3 to 9 database queries on every visit.

- **Regions:** Supabase is in Seoul, and moving it would mean creating a new project. Vercel is set to Hong Kong and Singapore, so its functions run closer to the database. Each query's trip to the database is the biggest cost, so keep the two close.
- **Browser caching:** `staleTimes.dynamic` in `next.config.ts` keeps visited pages in browser memory for 5 minutes. Going back to a tab then makes no requests.
- **Measured locally:** with 120 ms added to each database call, going back to a tab went from about 830 ms to about 55 ms, and one lap of the tabs went from 31 queries to 0. The first visit to each tab is still a normal load.

How the cache stays correct:

- **Saves:** every Server Action calls `revalidatePath`, which clears the whole browser cache, so a student's own changes show straight away. Any new Server Action that changes data must do the same.
- **Other devices:** changes made elsewhere can take up to 5 minutes to appear, or until the page is reloaded. This also applies to other open tabs, including after signing out in one of them.
- **Privacy:** the cache is only in browser memory, never on the server or on disk. Signing out does a full page load, which empties it.
- **Experimental setting:** Next.js still labels `staleTimes` experimental. If it's ever removed, tabs get slower again but nothing breaks.

Ideas for later, if the first visit to a tab still feels slow:

- **Fewer queries:** combine each page's queries, or stop some from waiting on others.
- **Loading ahead of time:** `"use cache: private"` can fetch pages before they're clicked, but it means reworking every data function, and every save would fetch those pages again.
## Things to watch for

- **Google tokens:** Supabase doesn't refresh Google access tokens, so the app stores the refresh token itself and gets a new access token for each sync.
- **Token key:** changing `GOOGLE_TOKEN_ENCRYPTION_KEY` makes every stored token unreadable, so every student would have to connect Calendar again.
- **Google OAuth limits:** in "Testing" status, the app is limited to 100 test users and refresh tokens expire after 7 days. Going public with Calendar or Classroom access requires Google's verification.
- **Free-tier limits:** Supabase can pause inactive free projects, and Vercel's free plan is for non-commercial use only. Check the current terms before relying on either.
- **AI limits:** students' free plans can run out or change, so the chat should explain what happened and offer another key.
- **AI privacy:** don't send sensitive information, especially to Gemini's free tier.
- **Search for the chatbot:** skip a vector database at first, because sending the current note as context is enough. To search all notes later, use Supabase's pgvector extension.

## Open questions

1. **Is a phone app needed?** Assumed no, since an installable web app (PWA) covers most of this. For an App Store or Play Store release, switch the frontend to Expo (React Native) and keep Supabase.
2. **What should "Google connection" include?** Step 8 went with Google sign-in and Calendar. Should Classroom or Drive be added later? Both add more permission and verification work.
3. **Which open source license?** MIT lets anyone reuse the code, including in paid products. AGPL-3.0 requires anyone who hosts a changed version to share their code, which fits the goal of keeping it free.

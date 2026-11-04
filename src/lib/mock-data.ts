// Temporary sample data for the UI preview, and for pages that aren't on real data yet.
import type { GradeCategory, GradeItem } from "@/lib/grades/compute"

export const DEMO_TODAY = "2026-11-04"

export const profile = {
  name: "Alex Rivera",
  firstName: "Alex",
  email: "alex@example.com",
  timezone: "Asia/Manila",
}

export const term = {
  id: "term-1",
  name: "1st Semester 2026-2027",
  startDate: "2026-08-10",
  endDate: "2026-12-18",
}

export interface Subject {
  id: string
  name: string
  code: string
  instructor: string
  color: string
  units: number
}

export const subjects: Subject[] = [
  { id: "calculus", name: "Calculus II", code: "MATH 122", instructor: "Dr. Ramos", color: "#2f6fb0", units: 4 },
  { id: "biology", name: "General Biology", code: "BIO 101", instructor: "Prof. Lim", color: "#2b8a67", units: 3 },
  { id: "literature", name: "World Literature", code: "LIT 104", instructor: "Prof. Santos", color: "#8b4fa3", units: 3 },
  { id: "programming", name: "Intro to Programming", code: "CS 101", instructor: "Mr. Reyes", color: "#c4533a", units: 3 },
  { id: "history", name: "World History", code: "HIST 110", instructor: "Prof. Cruz", color: "#a97b12", units: 3 },
]

export function getSubject(id: string) {
  return subjects.find((subject) => subject.id === id)
}

export interface ClassMeeting {
  id: string
  subjectId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  location: string
}

function meetings(subjectId: string, days: number[], startTime: string, endTime: string, location: string) {
  return days.map<ClassMeeting>((dayOfWeek) => ({
    id: `${subjectId}-${dayOfWeek}`,
    subjectId,
    dayOfWeek,
    startTime,
    endTime,
    location,
  }))
}

export const classMeetings: ClassMeeting[] = [
  ...meetings("calculus", [1, 3, 5], "08:00", "09:30", "Science 204"),
  ...meetings("biology", [2, 4], "09:00", "10:30", "Lab B"),
  ...meetings("literature", [1, 3], "10:00", "11:30", "Humanities 12"),
  ...meetings("programming", [2, 4], "13:00", "14:30", "Computer Lab 3"),
  ...meetings("history", [3, 5], "13:00", "14:30", "Humanities 8"),
]

export type EventType = "exam" | "assignment" | "task" | "other"

export interface ScheduleEvent {
  id: string
  subjectId?: string
  title: string
  type: EventType
  startsAt: string
}

export const events: ScheduleEvent[] = [
  { id: "e1", subjectId: "literature", title: "Reading response", type: "assignment", startsAt: "2026-11-04T18:00" },
  { id: "e2", subjectId: "biology", title: "Lab report 3", type: "assignment", startsAt: "2026-11-05T17:00" },
  { id: "e3", subjectId: "calculus", title: "Quiz 4", type: "exam", startsAt: "2026-11-06T08:00" },
  { id: "e4", subjectId: "programming", title: "Project 2", type: "assignment", startsAt: "2026-11-09T17:00" },
  { id: "e5", title: "Enroll for next term", type: "task", startsAt: "2026-11-10T12:00" },
  { id: "e6", subjectId: "literature", title: "Essay draft", type: "assignment", startsAt: "2026-11-12T17:00" },
  { id: "e7", subjectId: "biology", title: "Midterm exam", type: "exam", startsAt: "2026-11-17T09:00" },
  { id: "e8", subjectId: "history", title: "Group presentation", type: "other", startsAt: "2026-11-20T13:00" },
]

export interface NoteFile {
  id: string
  fileName: string
  size: string
}

export interface Note {
  id: string
  subjectId: string
  title: string
  html: string
  updatedAt: string
  files: NoteFile[]
}

export const notes: Note[] = [
  {
    id: "integration-by-parts",
    subjectId: "calculus",
    title: "Integration by parts",
    updatedAt: "2026-11-03",
    files: [{ id: "f1", fileName: "integral-table.pdf", size: "240 KB" }],
    html: `<p>Use this when the integrand is a product of two different kinds of functions.</p>
<blockquote><p><strong>Formula:</strong> ∫u dv = uv − ∫v du</p></blockquote>
<h2>Choosing u</h2>
<p>Pick u using LIATE, taking whichever type comes first:</p>
<ol><li><p>Logarithmic</p></li><li><p>Inverse trigonometric</p></li><li><p>Algebraic</p></li><li><p>Trigonometric</p></li><li><p>Exponential</p></li></ol>
<h2>Worked example</h2>
<p>For ∫x eˣ dx, let u = x and dv = eˣ dx. Then du = dx and v = eˣ, which gives:</p>
<p><strong>x eˣ − eˣ + C</strong></p>`,
  },
  {
    id: "series-convergence",
    subjectId: "calculus",
    title: "Series convergence tests",
    updatedAt: "2026-10-29",
    files: [],
    html: `<p>Check the simplest test first.</p>
<h2>Tests to remember</h2>
<ul><li><p><strong>Divergence test:</strong> if the terms don't approach 0, the series diverges.</p></li><li><p><strong>p-series:</strong> Σ1/nᵖ converges when p &gt; 1.</p></li><li><p><strong>Ratio test:</strong> useful for factorials and exponentials.</p></li></ul>`,
  },
  {
    id: "cell-respiration",
    subjectId: "biology",
    title: "Cellular respiration",
    updatedAt: "2026-11-02",
    files: [],
    html: `<p>Cells break down glucose to make ATP in three main stages.</p>
<h2>Stages</h2>
<ol><li><p><strong>Glycolysis</strong> happens in the cytoplasm and has a net gain of 2 ATP.</p></li><li><p><strong>Krebs cycle</strong> happens in the mitochondrial matrix and produces NADH and FADH₂.</p></li><li><p><strong>Electron transport chain</strong> happens on the inner mitochondrial membrane and makes most of the ATP.</p></li></ol>
<blockquote><p>Oxygen is the final electron acceptor.</p></blockquote>`,
  },
  {
    id: "things-fall-apart",
    subjectId: "literature",
    title: "Things Fall Apart: themes",
    updatedAt: "2026-11-01",
    files: [],
    html: `<p>Notes for the essay draft on Chinua Achebe's novel.</p>
<h2>Themes</h2>
<ul><li><p>Tradition and change in Igbo society</p></li><li><p>Masculinity and Okonkwo's fear of weakness</p></li><li><p>The effects of colonialism</p></li></ul>`,
  },
  {
    id: "python-loops",
    subjectId: "programming",
    title: "Loops and conditions",
    updatedAt: "2026-10-30",
    files: [],
    html: `<p>A <code>for</code> loop repeats once for each item in a sequence.</p>
<pre><code>for score in [90, 72, 85]:
    if score &gt;= 75:
        print("pass")
    else:
        print("retake")</code></pre>
<p>Use <code>while</code> when you don't know how many repeats you need.</p>`,
  },
  {
    id: "french-revolution",
    subjectId: "history",
    title: "French Revolution timeline",
    updatedAt: "2026-10-27",
    files: [],
    html: `<h2>Key dates</h2>
<ul><li><p><strong>1789:</strong> Storming of the Bastille</p></li><li><p><strong>1792:</strong> France becomes a republic</p></li><li><p><strong>1799:</strong> Napoleon takes power in a coup</p></li></ul>`,
  },
]

export function getNote(id: string) {
  return notes.find((note) => note.id === id)
}

export function noteExcerpt(note: Note) {
  return note.html
    .replace(/<[^>]+>/g, " ")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/\s+/g, " ")
    .trim()
}

export interface QuizCard {
  id: string
  front: string
  back: string
  due: boolean
}

export interface Deck {
  id: string
  subjectId: string
  name: string
  cards: QuizCard[]
}

export const decks: Deck[] = [
  {
    id: "integration",
    subjectId: "calculus",
    name: "Integration techniques",
    cards: [
      { id: "c1", front: "What is the integration by parts formula?", back: "∫u dv = uv − ∫v du", due: true },
      { id: "c2", front: "What is ∫(1/x) dx?", back: "ln|x| + C", due: true },
      { id: "c3", front: "What is ∫sec²x dx?", back: "tan x + C", due: true },
      { id: "c4", front: "What is the derivative of arctan x?", back: "1 / (1 + x²)", due: true },
    ],
  },
  {
    id: "series-tests",
    subjectId: "calculus",
    name: "Series convergence",
    cards: [
      { id: "c5", front: "When does a p-series converge?", back: "When p > 1", due: true },
      { id: "c16", front: "What does the divergence test say?", back: "If the terms don't approach 0, the series diverges", due: true },
      { id: "c17", front: "When is the ratio test especially useful?", back: "With factorials and exponentials", due: false },
    ],
  },
  {
    id: "respiration",
    subjectId: "biology",
    name: "Cellular respiration",
    cards: [
      { id: "c6", front: "Where does glycolysis happen?", back: "In the cytoplasm", due: true },
      { id: "c7", front: "Where does the Krebs cycle happen?", back: "In the mitochondrial matrix", due: true },
      { id: "c8", front: "What is the net ATP gain from glycolysis?", back: "2 ATP", due: true },
      { id: "c9", front: "What is the final electron acceptor?", back: "Oxygen", due: false },
    ],
  },
  {
    id: "python-basics",
    subjectId: "programming",
    name: "Python basics",
    cards: [
      { id: "c10", front: "What is the difference between = and ==?", back: "= assigns a value, and == compares two values", due: true },
      { id: "c11", front: 'What does len("hello") return?', back: "5", due: false },
      { id: "c12", front: "Which can be changed after creation: a list or a tuple?", back: "A list", due: false },
    ],
  },
  {
    id: "revolution-dates",
    subjectId: "history",
    name: "French Revolution",
    cards: [
      { id: "c13", front: "When was the Bastille stormed?", back: "July 14, 1789", due: true },
      { id: "c14", front: "When did France become a republic?", back: "1792", due: false },
      { id: "c15", front: "When did Napoleon take power?", back: "1799", due: false },
    ],
  },
]

export function getDeck(id: string) {
  return decks.find((deck) => deck.id === id)
}

export function dueCount(deck: Deck) {
  return deck.cards.filter((card) => card.due).length
}

export const totalDue = decks.reduce((sum, deck) => sum + dueCount(deck), 0)

function item(id: string, name: string, score: number | null, maxScore: number, gradedOn?: string): GradeItem {
  return { id, name, score, maxScore, gradedOn }
}

export const gradeCategories: GradeCategory[] = [
  {
    id: "calc-quizzes",
    subjectId: "calculus",
    name: "Quizzes",
    weight: 30,
    items: [
      item("g1", "Quiz 1", 18, 20, "2026-09-04"),
      item("g2", "Quiz 2", 16, 20, "2026-09-25"),
      item("g3", "Quiz 3", 19, 20, "2026-10-16"),
      item("g4", "Quiz 4", null, 20),
    ],
  },
  {
    id: "calc-sets",
    subjectId: "calculus",
    name: "Problem sets",
    weight: 20,
    items: [item("g5", "Set 1", 46, 50, "2026-09-11"), item("g6", "Set 2", 44, 50, "2026-10-09")],
  },
  {
    id: "calc-midterm",
    subjectId: "calculus",
    name: "Midterm exam",
    weight: 25,
    items: [item("g7", "Midterm", 82, 100, "2026-10-02")],
  },
  { id: "calc-final", subjectId: "calculus", name: "Final exam", weight: 25, items: [item("g8", "Final", null, 100)] },
  {
    id: "bio-labs",
    subjectId: "biology",
    name: "Lab reports",
    weight: 30,
    items: [
      item("g9", "Report 1", 27, 30, "2026-09-17"),
      item("g10", "Report 2", 28, 30, "2026-10-15"),
      item("g11", "Report 3", null, 30),
    ],
  },
  {
    id: "bio-quizzes",
    subjectId: "biology",
    name: "Quizzes",
    weight: 20,
    items: [item("g12", "Quiz 1", 13, 15, "2026-09-08"), item("g13", "Quiz 2", 14, 15, "2026-10-06")],
  },
  {
    id: "bio-exams",
    subjectId: "biology",
    name: "Exams",
    weight: 50,
    items: [item("g14", "Midterm", null, 100), item("g15", "Final", null, 100)],
  },
  {
    id: "lit-essays",
    subjectId: "literature",
    name: "Essays",
    weight: 50,
    items: [item("g16", "Essay 1", 86, 100, "2026-09-28"), item("g17", "Essay 2", null, 100)],
  },
  {
    id: "lit-responses",
    subjectId: "literature",
    name: "Reading responses",
    weight: 20,
    items: [item("g18", "Response 1", 9, 10, "2026-09-07"), item("g19", "Response 2", 10, 10, "2026-10-05")],
  },
  { id: "lit-final", subjectId: "literature", name: "Final exam", weight: 30, items: [item("g20", "Final", null, 100)] },
  {
    id: "cs-projects",
    subjectId: "programming",
    name: "Projects",
    weight: 50,
    items: [item("g21", "Project 1", 95, 100, "2026-10-01"), item("g22", "Project 2", null, 100)],
  },
  {
    id: "cs-labs",
    subjectId: "programming",
    name: "Lab exercises",
    weight: 25,
    items: [item("g23", "Lab 1", 10, 10, "2026-09-03"), item("g24", "Lab 2", 9, 10, "2026-10-08")],
  },
  { id: "cs-final", subjectId: "programming", name: "Final exam", weight: 25, items: [item("g25", "Final", null, 100)] },
  // These weights add up to 90 on purpose, so the preview shows the weight warning.
  {
    id: "hist-essays",
    subjectId: "history",
    name: "Essays",
    weight: 40,
    items: [item("g26", "Essay 1", 78, 100, "2026-09-30")],
  },
  {
    id: "hist-exams",
    subjectId: "history",
    name: "Exams",
    weight: 40,
    items: [item("g27", "Midterm", 74, 100, "2026-10-07"), item("g28", "Final", null, 100)],
  },
  {
    id: "hist-participation",
    subjectId: "history",
    name: "Participation",
    weight: 10,
    items: [item("g29", "First half", 9, 10, "2026-10-09")],
  },
]

export function categoriesFor(subjectId: string) {
  return gradeCategories.filter((category) => category.subjectId === subjectId)
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

export interface ChatThread {
  id: string
  title: string
  subjectId?: string
  noteId?: string
  updatedAt: string
  messages: ChatMessage[]
}

export const chatThreads: ChatThread[] = [
  {
    id: "choosing-u",
    title: "How do I choose u?",
    subjectId: "calculus",
    noteId: "integration-by-parts",
    updatedAt: "2026-11-03",
    messages: [
      { id: "m1", role: "user", content: "How do I choose u for integration by parts?" },
      {
        id: "m2",
        role: "assistant",
        content:
          "Your note uses LIATE, which is a good starting point. Choose u from whichever type comes first: logarithmic, inverse trigonometric, algebraic, trigonometric or exponential.\n\nFor ∫x eˣ dx, x is algebraic and eˣ is exponential, so u = x.",
      },
      { id: "m3", role: "user", content: "Why does that make it easier?" },
      {
        id: "m4",
        role: "assistant",
        content:
          "The goal is to leave a simpler integral. Differentiating x gives 1, so the remaining integral is just ∫eˣ dx. If you chose u = eˣ instead, you'd get x²/2 in the new integral, which is harder.",
      },
    ],
  },
  {
    id: "krebs-output",
    title: "What does the Krebs cycle make?",
    subjectId: "biology",
    noteId: "cell-respiration",
    updatedAt: "2026-11-01",
    messages: [
      { id: "m5", role: "user", content: "What does one turn of the Krebs cycle produce?" },
      { id: "m6", role: "assistant", content: "One turn produces 3 NADH, 1 FADH₂, 1 ATP (or GTP) and 2 CO₂." },
    ],
  },
  {
    id: "essay-thesis",
    title: "Essay thesis ideas",
    subjectId: "literature",
    noteId: "things-fall-apart",
    updatedAt: "2026-10-30",
    messages: [
      { id: "m7", role: "user", content: "Can you help me narrow my essay topic?" },
      {
        id: "m8",
        role: "assistant",
        content:
          "From your notes, one focused angle is how Okonkwo's fear of weakness shapes the way he responds to change. What part of that interests you most?",
      },
    ],
  },
]

export function getThread(id: string) {
  return chatThreads.find((thread) => thread.id === id)
}

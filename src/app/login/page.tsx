import type { Metadata } from "next";
import { BookOpen, CalendarDays, GraduationCap, Layers } from "lucide-react";
import { GoogleSignIn } from "@/components/auth/google-sign-in";

export const metadata: Metadata = { title: "Sign in" };

const FEATURES = [
  { icon: CalendarDays, text: "See your classes and deadlines at a glance" },
  { icon: BookOpen, text: "Keep notes and grades with each subject" },
  { icon: Layers, text: "Review quiz cards when they're due" },
];

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GraduationCap className="size-5" aria-hidden />
          </span>
          <span className="font-heading text-lg font-semibold text-sidebar-accent-foreground">Education App</span>
        </div>
        <div>
          <h2 className="max-w-md font-heading text-5xl leading-[1.1] font-semibold text-sidebar-accent-foreground">
            Everything for school, in one place.
          </h2>
          <ul className="mt-10 flex flex-col gap-4">
            {FEATURES.map((feature) => (
              <li key={feature.text} className="flex items-center gap-3">
                <feature.icon className="size-5 shrink-0 text-sidebar-primary" aria-hidden />
                {feature.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm">Schedule · Subjects · Notes · Quiz cards · Grades · AI chat</p>
      </section>

      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <span className="mb-6 flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground lg:hidden">
            <GraduationCap className="size-6" aria-hidden />
          </span>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">Sign in to pick up where you left off.</p>
          <GoogleSignIn />
        </div>
      </main>
    </div>
  );
}

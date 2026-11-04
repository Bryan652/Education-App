import { Suspense } from "react";
import type { Metadata } from "next";
import { CalendarDays, FolderOpen, GraduationCap, LogIn } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PreviewButton } from "@/components/layout/preview-button";
import { GradingScalesSection } from "@/components/settings/grading-scales-section";
import { ProfileSection } from "@/components/settings/profile-section";
import { TermsSection } from "@/components/settings/terms-section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Settings" };

const GOOGLE_SERVICES = [
  { icon: LogIn, name: "Google sign-in", description: "Sign in to the app", status: isSupabaseConfigured ? "Connected" : "Sample" },
  { icon: CalendarDays, name: "Google Calendar", description: "Sync classes and deadlines", status: "Not connected" },
  { icon: GraduationCap, name: "Google Classroom", description: "Import courses and work", status: "Not connected" },
  { icon: FolderOpen, name: "Google Drive", description: "Attach files to notes", status: "Not connected" },
];

function SectionSkeleton({ label }: { label: string }) {
  return <div className="h-16 animate-pulse rounded-lg bg-muted" aria-label={label} />;
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<SectionSkeleton label="Loading profile" />}>
                <ProfileSection />
              </Suspense>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Terms</CardTitle>
              <CardDescription>Subjects and class times belong to a term.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Suspense fallback={<SectionSkeleton label="Loading terms" />}>
                <TermsSection />
              </Suspense>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Google connections</CardTitle>
              <CardDescription>Connect only the services you want to use.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col">
                {GOOGLE_SERVICES.map((service) => (
                  <li key={service.name} className="flex items-center gap-3 border-b py-3 first:pt-0 last:border-0 last:pb-0">
                    <service.icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                    {service.status !== "Not connected" ? (
                      <span className="text-sm text-muted-foreground">{service.status}</span>
                    ) : (
                      <PreviewButton variant="outline" size="lg" message="This is a preview, so Google isn't connected yet.">
                        Connect
                      </PreviewButton>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Grading scales</CardTitle>
            <CardDescription className="mt-1">
              Choose the system your school uses. Subjects use your default unless you pick another for them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<SectionSkeleton label="Loading grading scales" />}>
              <GradingScalesSection />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

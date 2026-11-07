import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { AiKeysSection } from "@/components/settings/ai-keys-section";
import { GoogleOutcomeNotice } from "@/components/settings/google-calendar-controls";
import { GoogleSection } from "@/components/settings/google-section";
import { GradingScalesSection } from "@/components/settings/grading-scales-section";
import { ProfileSection } from "@/components/settings/profile-section";
import { TermsSection } from "@/components/settings/terms-section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Settings" };

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

          <Card id="ai-keys" className="scroll-mt-20">
            <CardHeader>
              <CardTitle className="text-lg">AI keys</CardTitle>
              <CardDescription>
                Keys stay on this device, and are only sent to the provider they belong to. If you use a paid key, set a
                spending limit with that provider.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AiKeysSection />
            </CardContent>
          </Card>

          <Card id="google" className="scroll-mt-20">
            <CardHeader>
              <CardTitle className="text-lg">Google connections</CardTitle>
              <CardDescription>
                Calendar sync only goes one way, from the app to Google, and only reaches the calendar the app makes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<SectionSkeleton label="Loading Google connections" />}>
                <GoogleSection />
              </Suspense>
              <Suspense>
                <GoogleOutcomeNotice />
              </Suspense>
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

import type { Metadata } from "next";
import { CalendarDays, FolderOpen, GraduationCap, LogIn, Plus } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PageHeader } from "@/components/layout/page-header";
import { PreviewButton } from "@/components/layout/preview-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { gradingScale, profile, term } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings" };

const GOOGLE_SERVICES = [
  { icon: LogIn, name: "Google sign-in", description: "Sign in to the app", status: isSupabaseConfigured ? "Connected" : "Sample" },
  { icon: CalendarDays, name: "Google Calendar", description: "Sync classes and deadlines", status: "Not connected" },
  { icon: GraduationCap, name: "Google Classroom", description: "Import courses and work", status: "Not connected" },
  { icon: FolderOpen, name: "Google Drive", description: "Attach files to notes", status: "Not connected" },
];

const shortDate: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };

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
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue={profile.name} className="h-10" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="timezone">Time zone</Label>
                <Input id="timezone" defaultValue={profile.timezone} className="h-10" />
              </div>
              <div className="flex flex-wrap gap-2">
                <PreviewButton size="lg" className="w-fit px-4">Save changes</PreviewButton>
                <SignOutButton />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Terms</CardTitle>
              <CardDescription>Subjects and class times belong to a term.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="rounded-lg bg-muted px-3.5 py-3">
                <p className="text-sm font-medium">{term.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(term.startDate, shortDate)} – {formatDate(term.endDate, shortDate)}
                </p>
              </div>
              <PreviewButton variant="outline" size="lg" className="w-fit">
                <Plus aria-hidden />
                Add term
              </PreviewButton>
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
          <CardHeader className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Grading scale</CardTitle>
              <CardDescription className="mt-1">Used to turn percentages into grades.</CardDescription>
            </div>
            <PreviewButton variant="outline" size="lg">Edit</PreviewButton>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade</TableHead>
                  <TableHead className="text-right">Minimum</TableHead>
                  <TableHead className="text-right">Grade points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gradingScale.map((band) => (
                  <TableRow key={band.label}>
                    <TableCell className="font-medium">{band.label}</TableCell>
                    <TableCell className="text-right tabular-nums">{band.minPercent}%</TableCell>
                    <TableCell className="text-right tabular-nums">{band.gradePoint.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

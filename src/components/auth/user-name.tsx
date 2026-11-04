import { Suspense } from "react";
import { getProfileForLayout } from "@/lib/data/profile";

const nameClass = "min-h-5 truncate text-sm font-medium text-sidebar-accent-foreground";

async function LoadedName() {
  const profile = await getProfileForLayout();
  return <p className={nameClass}>{profile?.displayName || "Student"}</p>;
}

// Read on the server, so it updates along with everything else when the student edits their profile.
export function UserName() {
  return (
    <Suspense fallback={<p className={nameClass} />}>
      <LoadedName />
    </Suspense>
  );
}

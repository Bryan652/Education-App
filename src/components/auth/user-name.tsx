import { Suspense } from "react";
import { getProfile } from "@/lib/data/profile";

const nameClass = "min-h-5 truncate text-sm font-medium text-sidebar-accent-foreground";

async function LoadedName() {
  const { displayName } = await getProfile();
  return <p className={nameClass}>{displayName || "Student"}</p>;
}

// Read on the server, so it updates along with everything else when the student edits their profile.
export function UserName() {
  return (
    <Suspense fallback={<p className={nameClass} />}>
      <LoadedName />
    </Suspense>
  );
}

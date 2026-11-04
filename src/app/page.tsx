import { redirect } from "next/navigation";

// proxy.ts sends signed-out students to /login first. The sample-data preview has no login.
export default function Home() {
  redirect("/dashboard");
}

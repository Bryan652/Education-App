import { SignOutButton } from "@/components/auth/sign-out-button";
import { ProfileForm } from "@/components/settings/profile-form";
import { getProfile } from "@/lib/data/profile";

export async function ProfileSection() {
  const profile = await getProfile();

  // Worked out on the server and passed down, so both sides render the same list.
  const timezones = [...new Set([profile.timezone, "UTC", ...Intl.supportedValuesOf("timeZone")])].sort();

  return (
    <ProfileForm displayName={profile.displayName} timezone={profile.timezone} timezones={timezones}>
      <SignOutButton />
    </ProfileForm>
  );
}

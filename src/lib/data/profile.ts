import { cache } from "react";
import { connection } from "next/server";
import { DEMO_TODAY, profile as sampleProfile } from "@/lib/mock-data";
import { FALLBACK_TIMEZONE, nowIn } from "@/lib/schedule/time";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface Profile {
  displayName: string;
  firstName: string;
  timezone: string;
  // False until the browser has reported the student's time zone. See TimezoneSync.
  hasTimezone: boolean;
  defaultGradingScaleId: string | null;
}

// Many components on a page need this, and cache() makes them share one query per request.
export const getProfile = cache(async (): Promise<Profile> => {
  if (!isSupabaseConfigured) {
    return {
      displayName: sampleProfile.name,
      firstName: sampleProfile.firstName,
      timezone: sampleProfile.timezone,
      hasTimezone: true,
      defaultGradingScaleId: null,
    };
  }

  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, timezone, default_grading_scale_id")
    .maybeSingle();
  if (error) throw new Error(`Couldn't load your profile: ${error.message}`);

  const displayName = data?.display_name?.trim() ?? "";
  return {
    displayName,
    firstName: displayName.split(/\s+/)[0] ?? "",
    timezone: data?.timezone ?? FALLBACK_TIMEZONE,
    hasTimezone: Boolean(data?.timezone),
    defaultGradingScaleId: data?.default_grading_scale_id ?? null,
  };
});

/** The student's current date and time on their own clock. The preview always uses its fixed day. */
export async function getClock() {
  if (!isSupabaseConfigured) return { today: DEMO_TODAY, now: `${DEMO_TODAY}T09:00` };

  const { timezone } = await getProfile();
  const now = nowIn(timezone);
  return { today: now.slice(0, 10), now };
}

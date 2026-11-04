"use client";

import { useEffect, useState } from "react";
import { profile } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Row-level security only returns the signed-in student's own profile, so no ID is needed.
export function UserName() {
  const [name, setName] = useState(isSupabaseConfigured ? "" : profile.name);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    createClient()
      .from("profiles")
      .select("display_name")
      .maybeSingle()
      .then(({ data }) => setName(data?.display_name || "Student"));
  }, []);

  return <p className="min-h-5 truncate text-sm font-medium text-sidebar-accent-foreground">{name}</p>;
}

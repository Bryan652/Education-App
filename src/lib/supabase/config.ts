export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

// Without these values, the app runs as a preview on sample data with no login.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
  // Server-only (no NEXT_PUBLIC_ prefix) -- never sent to the browser.
  // Grants full admin access to Supabase Auth (list users, set any
  // password, etc.), so it's only ever read from Server Components/Actions.
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY || "",
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET || "invoice-application",
};

export function assertPublicSupabaseEnv() {
  if (!env.supabaseUrl || !env.supabasePublishableKey) {
    throw new Error("Missing Supabase URL or publishable key.");
  }
}

export function assertAdminSupabaseEnv() {
  if (!env.supabaseUrl || !env.supabaseSecretKey) {
    throw new Error("Missing Supabase URL or secret key (SUPABASE_SECRET_KEY).");
  }
}

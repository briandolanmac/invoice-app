export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET || "invoice-application",
};

export function assertPublicSupabaseEnv() {
  if (!env.supabaseUrl || !env.supabasePublishableKey) {
    throw new Error("Missing Supabase URL or publishable key.");
  }
}

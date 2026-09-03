import { createClient } from "@supabase/supabase-js";
import { assertAdminSupabaseEnv, env } from "@/lib/env";

/** Full-access Supabase client using the secret/service-role key -- can
 *  list every auth user and set any user's password directly, bypassing
 *  normal auth entirely. Only ever call this from Server Components or
 *  Server Actions -- never from a client component or an API route
 *  response that echoes env vars back to the browser. */
export function createAdminClient() {
  assertAdminSupabaseEnv();

  return createClient(env.supabaseUrl, env.supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

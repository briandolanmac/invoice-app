import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env, assertPublicSupabaseEnv } from "@/lib/env";

export async function createClient() {
  assertPublicSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always set cookies. Middleware can refresh sessions later.
        }
      },
    },
  });
}

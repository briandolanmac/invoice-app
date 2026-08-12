"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env, assertPublicSupabaseEnv } from "@/lib/env";

export function createClient() {
  assertPublicSupabaseEnv();

  return createBrowserClient(env.supabaseUrl, env.supabasePublishableKey);
}

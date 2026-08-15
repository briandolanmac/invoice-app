import { cache } from "react";
import { createClient } from "./server";

/** Every protected page redirect-guards itself with its own
 *  supabase.auth.getUser() call, and the root layout's HomeButton
 *  independently does the exact same check to decide whether to show the
 *  sign-out icon -- so a single navigation was firing that network call
 *  to Supabase's Auth API two or more times. React's cache() memoizes an
 *  async function per request: every caller within the same render gets
 *  the same in-flight/resolved result instead of triggering its own
 *  round-trip, as long as they all import this same function rather than
 *  calling supabase.auth.getUser() directly. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

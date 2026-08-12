import { cookies } from "next/headers";
import { DEV_AUTH_COOKIE, isLocalDevAuthEnabled } from "@/lib/dev-auth";

export async function hasDevSession() {
  if (!isLocalDevAuthEnabled()) {
    return false;
  }

  const cookieStore = await cookies();
  return cookieStore.get(DEV_AUTH_COOKIE)?.value === "1";
}

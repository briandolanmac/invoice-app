"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DEV_AUTH_COOKIE, isLocalDevAuthEnabled } from "@/lib/dev-auth";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export async function signInForLocalDev() {
  if (!isLocalDevAuthEnabled()) {
    redirect("/login?error=Dev%20mode%20is%20only%20available%20on%20localhost");
  }

  const cookieStore = await cookies();
  cookieStore.set(DEV_AUTH_COOKIE, "1", {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/",
    sameSite: "lax",
    secure: false,
  });

  redirect("/");
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(DEV_AUTH_COOKIE);

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

"use server";

import { redirect } from "next/navigation";
import { canAccessAdmin } from "@/lib/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/get-current-user";

export async function setUserPassword(formData: FormData) {
  // Real enforcement point -- the header icon and the page redirect are
  // just UX, this is what actually stops a blocked account from setting
  // a password if it somehow still gets a request through.
  const actingUser = await getCurrentUser();
  if (actingUser && !canAccessAdmin(actingUser.email)) {
    redirect("/");
  }

  const userId = String(formData.get("user_id") || "");
  const password = String(formData.get("password") || "");

  if (!userId) {
    redirect("/admin?error=Missing%20user");
  }
  if (password.length < 8) {
    redirect("/admin?error=Password%20must%20be%20at%20least%208%20characters");
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin?saved=1");
}

"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function setUserPassword(formData: FormData) {
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

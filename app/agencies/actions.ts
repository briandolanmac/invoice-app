"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createAgency(formData: FormData) {
  const name = String(formData.get("name") || "").trim();

  if (!name) {
    redirect("/agencies?error=Agency%20name%20is%20required");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("agencies").insert({
    name,
    customer_code: String(formData.get("customer_code") || "").trim() || null,
    billing_address: String(formData.get("billing_address") || "").trim() || null,
    contact_name: String(formData.get("contact_name") || "").trim() || null,
    contact_email: String(formData.get("contact_email") || "").trim() || null,
    payment_terms: String(formData.get("payment_terms") || "").trim() || "Due on receipt",
    default_invoice_prefix: String(formData.get("default_invoice_prefix") || "").trim() || "RD",
    notes: String(formData.get("notes") || "").trim() || null,
  });

  if (error) {
    redirect(`/agencies?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/agencies");
  redirect("/agencies");
}

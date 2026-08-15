"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addPreset(formData: FormData) {
  const agencyId = String(formData.get("agency_id") || "");
  const itemType = String(formData.get("item_type") || "") === "expense" ? "expense" : "service";
  const fieldName = itemType === "expense" ? "new_expense_description" : "new_service_description";
  const description = String(formData.get(fieldName) || "").trim();
  if (!agencyId || !description) return;

  const supabase = await createClient();
  await supabase.from("agency_line_item_presets").insert({
    agency_id: agencyId,
    description,
    item_type: itemType,
  });
  revalidatePath(`/agents/${agencyId}`);
}

export async function deletePreset(formData: FormData) {
  const id = String(formData.get("preset_id") || "");
  const agencyId = String(formData.get("agency_id") || "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("agency_line_item_presets").delete().eq("id", id);
  revalidatePath(`/agents/${agencyId}`);
}

export async function addContact(formData: FormData) {
  const agencyId = String(formData.get("agency_id") || "");
  const name = String(formData.get("new_contact_name") || "").trim();
  if (!agencyId || !name) return;

  const supabase = await createClient();
  await supabase.from("agency_contacts").insert({
    agency_id: agencyId,
    name,
    phone: String(formData.get("new_contact_phone") || "").trim() || null,
    email: String(formData.get("new_contact_email") || "").trim() || null,
  });
  revalidatePath(`/agents/${agencyId}`);
}

export async function deleteContact(formData: FormData) {
  const id = String(formData.get("contact_id") || "");
  const agencyId = String(formData.get("agency_id") || "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("agency_contacts").delete().eq("id", id);
  revalidatePath(`/agents/${agencyId}`);
}

/** Single save for the whole page -- contacts, service/expense presets,
 *  and agent details all update together from one form, one button. */
export async function updateAgentPage(formData: FormData) {
  const agencyId = String(formData.get("agency_id") || "");
  if (!agencyId) return;

  const supabase = await createClient();
  const updates: PromiseLike<unknown>[] = [];

  const contactIds = new Set<string>();
  for (const key of formData.keys()) {
    const match = key.match(/^name__(.+)$/);
    if (match) contactIds.add(match[1]);
  }
  for (const id of contactIds) {
    const name = String(formData.get(`name__${id}`) || "").trim();
    if (!name) continue;
    updates.push(
      supabase
        .from("agency_contacts")
        .update({
          name,
          phone: String(formData.get(`phone__${id}`) || "").trim() || null,
          email: String(formData.get(`email__${id}`) || "").trim() || null,
        })
        .eq("id", id)
    );
  }

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("description__")) continue;
    const id = key.slice("description__".length);
    const description = String(value).trim();
    if (!id || !description) continue;
    updates.push(supabase.from("agency_line_item_presets").update({ description }).eq("id", id));
  }

  updates.push(
    supabase
      .from("agencies")
      .update({
        default_invoice_prefix: String(formData.get("default_invoice_prefix") || "").trim() || null,
        payment_terms: String(formData.get("payment_terms") || "").trim() || null,
      })
      .eq("id", agencyId)
  );

  await Promise.all(updates);
  redirect(`/agents/${agencyId}?saved=1`);
}

export async function deleteAgency(formData: FormData) {
  const agencyId = String(formData.get("agency_id") || "");
  const supabase = await createClient();
  await supabase.from("agencies").delete().eq("id", agencyId);
  redirect("/agents");
}

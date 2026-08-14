"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addPreset(formData: FormData) {
  const agencyId = String(formData.get("agency_id") || "");
  const description = String(formData.get("description") || "").trim();
  if (!agencyId || !description) return;

  const supabase = await createClient();
  await supabase.from("agency_line_item_presets").insert({
    agency_id: agencyId,
    description,
  });
  revalidatePath(`/agents/${agencyId}`);
}

export async function updatePresets(formData: FormData) {
  const agencyId = String(formData.get("agency_id") || "");
  if (!agencyId) return;

  const supabase = await createClient();
  const updates = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("description__")) continue;
    const id = key.slice("description__".length);
    const description = String(value).trim();
    if (!id || !description) continue;
    updates.push(supabase.from("agency_line_item_presets").update({ description }).eq("id", id));
  }
  await Promise.all(updates);
  redirect(`/agents/${agencyId}?saved=1`);
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
  const name = String(formData.get("name") || "").trim();
  if (!agencyId || !name) return;

  const supabase = await createClient();
  await supabase.from("agency_contacts").insert({
    agency_id: agencyId,
    name,
    phone: String(formData.get("phone") || "").trim() || null,
    email: String(formData.get("email") || "").trim() || null,
  });
  revalidatePath(`/agents/${agencyId}`);
}

export async function updateContacts(formData: FormData) {
  const agencyId = String(formData.get("agency_id") || "");
  if (!agencyId) return;

  const supabase = await createClient();
  const ids = new Set<string>();
  for (const key of formData.keys()) {
    const match = key.match(/^name__(.+)$/);
    if (match) ids.add(match[1]);
  }

  const updates = Array.from(ids).flatMap((id) => {
    const name = String(formData.get(`name__${id}`) || "").trim();
    if (!name) return [];
    return [
      supabase
        .from("agency_contacts")
        .update({
          name,
          phone: String(formData.get(`phone__${id}`) || "").trim() || null,
          email: String(formData.get(`email__${id}`) || "").trim() || null,
        })
        .eq("id", id),
    ];
  });
  await Promise.all(updates);
  redirect(`/agents/${agencyId}?saved=1`);
}

export async function deleteContact(formData: FormData) {
  const id = String(formData.get("contact_id") || "");
  const agencyId = String(formData.get("agency_id") || "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("agency_contacts").delete().eq("id", id);
  revalidatePath(`/agents/${agencyId}`);
}

export async function updateAgencyDetails(formData: FormData) {
  const agencyId = String(formData.get("agency_id") || "");
  if (!agencyId) return;

  const supabase = await createClient();
  await supabase
    .from("agencies")
    .update({
      default_invoice_prefix: String(formData.get("default_invoice_prefix") || "").trim() || null,
      payment_terms: String(formData.get("payment_terms") || "").trim() || null,
    })
    .eq("id", agencyId);
  redirect(`/agents/${agencyId}?saved=1`);
}

export async function deleteAgency(formData: FormData) {
  const agencyId = String(formData.get("agency_id") || "");
  const supabase = await createClient();
  await supabase.from("agencies").delete().eq("id", agencyId);
  redirect("/agents");
}

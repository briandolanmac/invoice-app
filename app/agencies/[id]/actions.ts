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
  revalidatePath(`/agencies/${agencyId}`);
}

export async function updatePreset(formData: FormData) {
  const id = String(formData.get("preset_id") || "");
  const agencyId = String(formData.get("agency_id") || "");
  const description = String(formData.get("description") || "").trim();
  if (!id || !description) return;

  const supabase = await createClient();
  await supabase.from("agency_line_item_presets").update({ description }).eq("id", id);
  revalidatePath(`/agencies/${agencyId}`);
}

export async function deletePreset(formData: FormData) {
  const id = String(formData.get("preset_id") || "");
  const agencyId = String(formData.get("agency_id") || "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("agency_line_item_presets").delete().eq("id", id);
  revalidatePath(`/agencies/${agencyId}`);
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
  revalidatePath(`/agencies/${agencyId}`);
}

export async function updateContact(formData: FormData) {
  const id = String(formData.get("contact_id") || "");
  const agencyId = String(formData.get("agency_id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!id || !name) return;

  const supabase = await createClient();
  await supabase
    .from("agency_contacts")
    .update({
      name,
      phone: String(formData.get("phone") || "").trim() || null,
      email: String(formData.get("email") || "").trim() || null,
    })
    .eq("id", id);
  revalidatePath(`/agencies/${agencyId}`);
}

export async function deleteContact(formData: FormData) {
  const id = String(formData.get("contact_id") || "");
  const agencyId = String(formData.get("agency_id") || "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("agency_contacts").delete().eq("id", id);
  revalidatePath(`/agencies/${agencyId}`);
}

export async function deleteAgency(formData: FormData) {
  const agencyId = String(formData.get("agency_id") || "");
  const supabase = await createClient();
  await supabase.from("agencies").delete().eq("id", agencyId);
  redirect("/agencies");
}

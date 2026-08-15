"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { saveInvoicePdfToFiles } from "@/lib/saveInvoicePdf";
import { createClient } from "@/lib/supabase/server";

export async function copyInvoice(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") || "");
  const supabase = await createClient();

  const { data: original } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!original) {
    redirect("/invoices?error=Invoice%20not%20found");
  }

  const { data: items } = await supabase
    .from("invoice_line_items")
    .select("item_type, description, line_date, quantity, unit, unit_price, sort_order")
    .eq("invoice_id", invoiceId)
    .order("sort_order");

  const today = new Date().toISOString().slice(0, 10);
  const placeholderNumber = `${original.invoice_number}-COPY-${Date.now().toString().slice(-4)}`;

  const { data: copy, error } = await supabase
    .from("invoices")
    .insert({
      agency_id: original.agency_id,
      invoice_number: placeholderNumber,
      invoice_date: today,
      tour_group_name: original.tour_group_name,
      notes: original.notes,
      payment_instructions: original.payment_instructions,
      status: "draft",
      subtotal_amount: original.subtotal_amount,
      expense_amount: original.expense_amount,
      total_amount: original.total_amount,
      copied_from_invoice_id: original.id,
    })
    .select("id")
    .single();

  if (error || !copy) {
    redirect(`/invoices/${invoiceId}?error=${encodeURIComponent(error?.message || "Copy failed")}`);
  }

  if (items?.length) {
    await supabase.from("invoice_line_items").insert(
      items.map((item) => ({ ...item, invoice_id: copy.id }))
    );
  }

  redirect(`/invoices/${copy.id}/edit`);
}

export async function updateInvoiceStatus(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") || "");
  const status = String(formData.get("status") || "");
  if (!invoiceId || !status) return;

  const supabase = await createClient();
  await supabase.from("invoices").update({ status }).eq("id", invoiceId);
  if (status === "sent") {
    await saveInvoicePdfToFiles(supabase, invoiceId);
  }
  redirect(`/invoices/${invoiceId}?saved=1`);
}

export async function deleteInvoiceFile(formData: FormData) {
  const fileId = String(formData.get("file_id") || "");
  const invoiceId = String(formData.get("invoice_id") || "");
  const storageBucket = String(formData.get("storage_bucket") || "");
  const storagePath = String(formData.get("storage_path") || "");
  if (!fileId) return;

  const supabase = await createClient();
  if (storageBucket && storagePath) {
    await supabase.storage.from(storageBucket).remove([storagePath]);
  }
  await supabase.from("invoice_files").delete().eq("id", fileId);
  revalidatePath(`/invoices/${invoiceId}`);
}

export async function deleteInvoice(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") || "");
  const supabase = await createClient();
  await supabase.from("invoices").delete().eq("id", invoiceId);
  redirect("/invoices");
}

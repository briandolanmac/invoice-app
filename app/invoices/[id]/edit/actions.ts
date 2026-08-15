"use server";

import { redirect } from "next/navigation";
import { saveInvoicePdfToFiles } from "@/lib/saveInvoicePdf";
import { createClient } from "@/lib/supabase/server";
import { parseLineItems, totalsFor } from "@/lib/line-items";

export async function updateInvoice(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") || "");
  const invoiceNumber = String(formData.get("invoice_number") || "").trim();
  const agencyId = String(formData.get("agency_id") || "").trim();

  if (!invoiceNumber) {
    redirect(`/invoices/${invoiceId}/edit?error=Invoice%20number%20is%20required`);
  }
  if (!agencyId) {
    redirect(`/invoices/${invoiceId}/edit?error=Please%20choose%20an%20agent`);
  }

  const rows = parseLineItems(formData);
  const { subtotal, expenses, total } = totalsFor(rows);
  const status = String(formData.get("status") || "draft");
  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      agency_id: agencyId,
      invoice_number: invoiceNumber,
      invoice_date: String(formData.get("invoice_date") || "").trim() || undefined,
      tour_group_name: String(formData.get("tour_group_name") || "").trim() || null,
      status,
      notes: String(formData.get("notes") || "").trim() || null,
      payment_instructions: String(formData.get("payment_instructions") || "").trim() || null,
      subtotal_amount: subtotal,
      expense_amount: expenses,
      total_amount: total,
    })
    .eq("id", invoiceId);

  if (updateError) {
    redirect(`/invoices/${invoiceId}/edit?error=${encodeURIComponent(updateError.message)}`);
  }

  await supabase.from("invoice_line_items").delete().eq("invoice_id", invoiceId);
  if (rows.length > 0) {
    const { error: itemsError } = await supabase
      .from("invoice_line_items")
      .insert(rows.map((row) => ({ ...row, invoice_id: invoiceId })));
    if (itemsError) {
      redirect(`/invoices/${invoiceId}/edit?error=${encodeURIComponent(itemsError.message)}`);
    }
  }

  if (status === "sent") {
    await saveInvoicePdfToFiles(supabase, invoiceId);
  }

  redirect(`/invoices/${invoiceId}?saved=1`);
}

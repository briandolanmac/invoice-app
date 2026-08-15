"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseLineItems, totalsFor } from "@/lib/line-items";

export async function createInvoice(formData: FormData) {
  const invoiceNumber = String(formData.get("invoice_number") || "").trim();
  const agencyId = String(formData.get("agency_id") || "").trim();

  if (!invoiceNumber) {
    redirect("/invoices/new?error=Invoice%20number%20is%20required");
  }
  if (!agencyId) {
    redirect("/invoices/new?error=Please%20choose%20an%20agent");
  }

  const rows = parseLineItems(formData);
  const supabase = await createClient();

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      agency_id: agencyId,
      invoice_number: invoiceNumber,
      invoice_date: String(formData.get("invoice_date") || "").trim() || undefined,
      tour_group_name: String(formData.get("tour_group_name") || "").trim() || null,
      notes: String(formData.get("notes") || "").trim() || null,
      payment_instructions: String(formData.get("payment_instructions") || "").trim() || null,
    })
    .select("id")
    .single();

  if (invoiceError || !invoice) {
    redirect(`/invoices/new?error=${encodeURIComponent(invoiceError?.message || "Could not create invoice")}`);
  }

  if (rows.length > 0) {
    const { error: itemsError } = await supabase
      .from("invoice_line_items")
      .insert(rows.map((row) => ({ ...row, invoice_id: invoice.id })));

    if (itemsError) {
      redirect(`/invoices/new?error=${encodeURIComponent(itemsError.message)}`);
    }
  }

  const { subtotal, expenses, total } = totalsFor(rows);
  await supabase
    .from("invoices")
    .update({ subtotal_amount: subtotal, expense_amount: expenses, total_amount: total })
    .eq("id", invoice.id);

  redirect("/invoices?saved=1");
}

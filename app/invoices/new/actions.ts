"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const LINE_ITEM_ROWS = 6;
const VALID_TYPES = new Set(["service", "expense", "tip", "adjustment"]);

function num(value: FormDataEntryValue | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value !== "" ? parsed : fallback;
}

export async function createInvoice(formData: FormData) {
  const invoiceNumber = String(formData.get("invoice_number") || "").trim();
  const agencyId = String(formData.get("agency_id") || "").trim();

  if (!invoiceNumber) {
    redirect("/invoices/new?error=Invoice%20number%20is%20required");
  }
  if (!agencyId) {
    redirect("/invoices/new?error=Please%20choose%20an%20agency");
  }

  const rows: {
    item_type: string;
    description: string;
    quantity: number;
    unit: string | null;
    unit_price: number;
    sort_order: number;
  }[] = [];

  for (let i = 0; i < LINE_ITEM_ROWS; i++) {
    const description = String(formData.get(`line_desc_${i}`) || "").trim();
    if (!description) continue;

    const type = String(formData.get(`line_type_${i}`) || "service");
    rows.push({
      item_type: VALID_TYPES.has(type) ? type : "service",
      description,
      quantity: num(formData.get(`line_qty_${i}`), 1),
      unit: String(formData.get(`line_unit_${i}`) || "").trim() || null,
      unit_price: num(formData.get(`line_price_${i}`), 0),
      sort_order: i,
    });
  }

  const supabase = await createClient();

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      agency_id: agencyId,
      invoice_number: invoiceNumber,
      invoice_date: String(formData.get("invoice_date") || "").trim() || undefined,
      due_date: String(formData.get("due_date") || "").trim() || null,
      customer_reference: String(formData.get("customer_reference") || "").trim() || null,
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

  const subtotal = rows
    .filter((r) => r.item_type !== "expense")
    .reduce((sum, r) => sum + r.quantity * r.unit_price, 0);
  const expenses = rows
    .filter((r) => r.item_type === "expense")
    .reduce((sum, r) => sum + r.quantity * r.unit_price, 0);

  await supabase
    .from("invoices")
    .update({
      subtotal_amount: subtotal,
      expense_amount: expenses,
      total_amount: subtotal + expenses,
    })
    .eq("id", invoice.id);

  redirect("/invoices");
}

"use server";

import { renderToBuffer } from "@react-pdf/renderer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InvoicePdfDocument, { type PdfInvoiceData, type PdfLineItem } from "@/lib/InvoicePdf";

const BUCKET = "invoice-application";

export async function generatePdf(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") || "");
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, agencies(name, billing_address)")
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice) {
    redirect(`/invoices/${invoiceId}?error=Invoice%20not%20found`);
  }

  const { data: items } = await supabase
    .from("invoice_line_items")
    .select("item_type, description, line_date, quantity, unit_price, line_total")
    .eq("invoice_id", invoiceId)
    .order("sort_order");

  const agency = invoice.agencies as { name: string; billing_address: string | null } | null;

  const pdfData: PdfInvoiceData = {
    invoice_number: invoice.invoice_number,
    invoice_date: invoice.invoice_date,
    tour_group_name: invoice.tour_group_name,
    customer_reference: invoice.customer_reference,
    notes: invoice.notes,
    payment_instructions: invoice.payment_instructions,
    subtotal_amount: Number(invoice.subtotal_amount),
    expense_amount: Number(invoice.expense_amount),
    total_amount: Number(invoice.total_amount),
    agency: { name: agency?.name || "No agency", billing_address: agency?.billing_address || null },
    serviceItems: ((items || []).filter((i) => i.item_type !== "expense") as PdfLineItem[]),
    expenseItems: ((items || []).filter((i) => i.item_type === "expense") as PdfLineItem[]),
  };

  const buffer = await renderToBuffer(<InvoicePdfDocument invoice={pdfData} />);
  const storagePath = `generated/${invoiceId}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    redirect(`/invoices/${invoiceId}?error=${encodeURIComponent(uploadError.message)}`);
  }

  const { data: existingFile } = await supabase
    .from("invoice_files")
    .select("id")
    .eq("invoice_id", invoiceId)
    .eq("file_role", "generated_pdf")
    .maybeSingle();

  const fileName = `${invoice.invoice_number}.pdf`;
  if (existingFile) {
    await supabase
      .from("invoice_files")
      .update({ file_name: fileName, storage_path: storagePath })
      .eq("id", existingFile.id);
  } else {
    await supabase.from("invoice_files").insert({
      invoice_id: invoiceId,
      storage_bucket: BUCKET,
      storage_path: storagePath,
      file_name: fileName,
      file_type: "application/pdf",
      file_role: "generated_pdf",
    });
  }

  revalidatePath(`/invoices/${invoiceId}`);
  redirect(`/invoices/${invoiceId}?saved=1`);
}

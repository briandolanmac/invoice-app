import { renderToBuffer } from "@react-pdf/renderer";
import { buildInvoicePdfData } from "@/lib/buildInvoicePdfData";
import InvoicePdfDocument from "@/lib/InvoicePdf";
import type { ParsedLineItem } from "@/lib/line-items";
import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type InvoiceWithAgency = {
  invoice_number: string;
  invoice_date: string;
  tour_group_name: string | null;
  notes: string | null;
  payment_instructions: string | null;
  agencies: { name: string; billing_address: string | null } | null;
};

const BUCKET = "invoice-application";

/** Renders an invoice's current PDF and upserts it into the Files
 *  section (invoice_files, file_role=generated_pdf) -- used when an
 *  invoice is marked Sent, so a copy is captured automatically instead
 *  of relying on someone remembering to save one by hand. Swallows
 *  render/upload errors rather than throwing, since this always runs
 *  as a side effect of a status change that should succeed either way.
 *
 *  `prefetchedInvoice` lets a caller that just ran an UPDATE ... RETURNING
 *  on this same row pass it straight through instead of this function
 *  re-fetching it -- both current callers update the invoice's status
 *  immediately before calling this, so without it every "mark as sent"
 *  did an avoidable extra round trip re-reading the row it just wrote. */
export async function saveInvoicePdfToFiles(
  supabase: SupabaseClient,
  invoiceId: string,
  prefetchedInvoice?: InvoiceWithAgency | null
) {
  const [invoice, { data: items }] = await Promise.all([
    prefetchedInvoice !== undefined
      ? prefetchedInvoice
      : supabase
          .from("invoices")
          .select("*, agencies(name, billing_address)")
          .eq("id", invoiceId)
          .maybeSingle()
          .then((res) => res.data as InvoiceWithAgency | null),
    supabase
      .from("invoice_line_items")
      .select("item_type, description, line_date, quantity, unit_price")
      .eq("invoice_id", invoiceId)
      .order("sort_order"),
  ]);
  if (!invoice) return;

  const agency = invoice.agencies as { name: string; billing_address: string | null } | null;

  const rows: ParsedLineItem[] = (items || []).map((item, i) => ({
    item_type: item.item_type === "expense" ? "expense" : "service",
    description: item.description,
    line_date: item.line_date,
    quantity: Number(item.quantity),
    unit: null,
    unit_price: Number(item.unit_price),
    sort_order: i,
  }));

  const pdfData = buildInvoicePdfData(
    {
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date,
      tour_group_name: invoice.tour_group_name,
      notes: invoice.notes,
      payment_instructions: invoice.payment_instructions,
    },
    { name: agency?.name || "No agent", billing_address: agency?.billing_address || null },
    rows
  );

  let buffer: Buffer;
  try {
    buffer = await renderToBuffer(<InvoicePdfDocument invoice={pdfData} />);
  } catch {
    return;
  }

  const storagePath = `generated/${invoiceId}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: "application/pdf", upsert: true });
  if (uploadError) return;

  const fileName = `${invoice.invoice_number}.pdf`;
  const { data: existingFile } = await supabase
    .from("invoice_files")
    .select("id")
    .eq("invoice_id", invoiceId)
    .eq("file_role", "generated_pdf")
    .maybeSingle();

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
}

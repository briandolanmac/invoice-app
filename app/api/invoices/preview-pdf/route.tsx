import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { buildInvoicePdfData } from "@/lib/buildInvoicePdfData";
import InvoicePdfDocument from "@/lib/InvoicePdf";
import { parseLineItems } from "@/lib/line-items";
import { createClient } from "@/lib/supabase/server";

/** Renders a PDF from an UNSAVED New Invoice form's data, so the user can
 *  preview it before saving. Reuses the same field-parsing logic as
 *  createInvoice so the preview always matches what a save would produce. */
export async function POST(request: Request) {
  const formData = await request.formData();
  const agencyId = String(formData.get("agency_id") || "");

  const supabase = await createClient();
  const { data: agency } = await supabase
    .from("agencies")
    .select("name, billing_address")
    .eq("id", agencyId)
    .maybeSingle();

  const rows = parseLineItems(formData);
  const today = new Date().toISOString().slice(0, 10);

  const pdfData = buildInvoicePdfData(
    {
      invoice_number: String(formData.get("invoice_number") || "").trim() || "DRAFT",
      invoice_date: String(formData.get("invoice_date") || "").trim() || today,
      tour_group_name: String(formData.get("tour_group_name") || "").trim() || null,
      customer_reference: String(formData.get("customer_reference") || "").trim() || null,
      notes: String(formData.get("notes") || "").trim() || null,
      payment_instructions: String(formData.get("payment_instructions") || "").trim() || null,
    },
    { name: agency?.name || "No agent", billing_address: agency?.billing_address || null },
    rows
  );

  const buffer = await renderToBuffer(<InvoicePdfDocument invoice={pdfData} />);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Disposition": "inline",
      "Content-Type": "application/pdf",
    },
  });
}

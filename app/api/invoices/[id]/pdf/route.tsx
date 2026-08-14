import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { buildInvoicePdfData } from "@/lib/buildInvoicePdfData";
import InvoicePdfDocument from "@/lib/InvoicePdf";
import type { ParsedLineItem } from "@/lib/line-items";
import { createClient } from "@/lib/supabase/server";

/** Renders a saved invoice's PDF on demand -- the popup on the invoice
 *  detail page always shows the current DB data instead of relying on a
 *  possibly-stale generated file in storage. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, agencies(name, billing_address)")
    .eq("id", id)
    .maybeSingle();

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const { data: items } = await supabase
    .from("invoice_line_items")
    .select("item_type, description, line_date, quantity, unit_price")
    .eq("invoice_id", id)
    .order("sort_order");

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
      customer_reference: invoice.customer_reference,
      notes: invoice.notes,
      payment_instructions: invoice.payment_instructions,
    },
    { name: agency?.name || "No agency", billing_address: agency?.billing_address || null },
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

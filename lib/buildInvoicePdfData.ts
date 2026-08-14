import type { ParsedLineItem } from "@/lib/line-items";
import type { PdfInvoiceData, PdfLineItem } from "@/lib/InvoicePdf";

type InvoiceMeta = {
  invoice_number: string;
  invoice_date: string;
  tour_group_name: string | null;
  customer_reference: string | null;
  notes: string | null;
  payment_instructions: string | null;
};

type AgencyMeta = {
  name: string;
  billing_address: string | null;
};

export function buildInvoicePdfData(
  meta: InvoiceMeta,
  agency: AgencyMeta,
  rows: ParsedLineItem[]
): PdfInvoiceData {
  const toPdfItem = (row: ParsedLineItem): PdfLineItem => ({
    item_type: row.item_type,
    description: row.description,
    line_date: row.line_date,
    quantity: row.quantity,
    unit_price: row.unit_price,
    line_total: row.quantity * row.unit_price,
  });

  const serviceItems = rows.filter((row) => row.item_type !== "expense").map(toPdfItem);
  const expenseItems = rows.filter((row) => row.item_type === "expense").map(toPdfItem);
  const subtotal_amount = serviceItems.reduce((sum, item) => sum + item.line_total, 0);
  const expense_amount = expenseItems.reduce((sum, item) => sum + item.line_total, 0);

  return {
    invoice_number: meta.invoice_number,
    invoice_date: meta.invoice_date,
    tour_group_name: meta.tour_group_name,
    customer_reference: meta.customer_reference,
    notes: meta.notes,
    payment_instructions: meta.payment_instructions,
    subtotal_amount,
    expense_amount,
    total_amount: subtotal_amount + expense_amount,
    agency,
    serviceItems,
    expenseItems,
  };
}

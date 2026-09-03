import Link from "next/link";
import { redirect } from "next/navigation";
import PendingOverlay from "@/components/PendingOverlay";
import { hasDevSession } from "@/lib/dev-auth-server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/get-current-user";
import InvoiceFormFields from "../../InvoiceFormFields";
import type { LineItemRowData } from "../../LineItemsSection";
import { updateInvoice } from "./actions";

type AgencyOption = { id: string; name: string; default_invoice_prefix: string | null };
type PresetRow = { agency_id: string; description: string; item_type: string };
type InvoiceNumberRow = { agency_id: string | null; invoice_number: string };

type EditInvoicePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditInvoicePage({ params, searchParams }: EditInvoicePageProps) {
  const { id } = await params;
  const search = await searchParams;
  const usingDevSession = await hasDevSession();
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user && !usingDevSession) {
    redirect("/login");
  }
  if (usingDevSession) {
    redirect(`/invoices/${id}`);
  }

  const [{ data: invoice }, { data: agencies }, { data: presetRows }, { data: items }, { data: invoiceNumberRows }] =
    await Promise.all([
      supabase.from("invoices").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("agencies")
        .select("id, name, default_invoice_prefix")
        .eq("is_active", true)
        .order("name")
        .returns<AgencyOption[]>(),
      supabase
        .from("agency_line_item_presets")
        .select("agency_id, description, item_type")
        .order("sort_order")
        .returns<PresetRow[]>(),
      supabase
        .from("invoice_line_items")
        .select("item_type, description, line_date, quantity, unit_price")
        .eq("invoice_id", id)
        .order("sort_order"),
      supabase
        .from("invoices")
        .select("agency_id, invoice_number")
        .returns<InvoiceNumberRow[]>(),
    ]);

  if (!invoice) {
    return (
      <main className="page">
        <div className="shell">
          <Link className="button secondary" href="/invoices">← Invoices</Link>
          <section className="card" style={{ marginTop: 16, padding: 24 }}>
            <p className="muted" style={{ margin: 0 }}>No invoice found with that ID.</p>
          </section>
        </div>
      </main>
    );
  }

  const agencyServicePresets: Record<string, string[]> = {};
  const agencyExpensePresets: Record<string, string[]> = {};
  for (const row of presetRows || []) {
    const target = row.item_type === "expense" ? agencyExpensePresets : agencyServicePresets;
    (target[row.agency_id] ||= []).push(row.description);
  }

  // Same collision-safe suggestion the New Invoice form uses, powering the
  // "Generate" button next to the invoice number field here too.
  const allInvoiceNumbers = (invoiceNumberRows || []).map((row) => row.invoice_number);
  const agencyInvoiceNumbers: Record<string, string[]> = {};
  for (const agency of agencies || []) {
    if (!agency.default_invoice_prefix) continue;
    agencyInvoiceNumbers[agency.id] = allInvoiceNumbers.filter((n) =>
      n.startsWith(agency.default_invoice_prefix!)
    );
  }

  // Legacy 'tip'/'adjustment' item types (from the historical import, before
  // the service/expense-only redesign) fold into the Service group here --
  // matches how they actually appeared on the real invoices (within the
  // SERVICE CHARGES table, not called out separately).
  const toRow = (item: {
    description: string;
    line_date: string | null;
    quantity: number;
    unit_price: number;
  }): LineItemRowData => ({
    description: item.description,
    line_date: item.line_date || "",
    qty: String(item.quantity),
    price: String(item.unit_price),
  });

  const initialServiceRows: LineItemRowData[] = (items || [])
    .filter((item) => item.item_type !== "expense")
    .map(toRow);
  const initialExpenseRows: LineItemRowData[] = (items || [])
    .filter((item) => item.item_type === "expense")
    .map(toRow);

  return (
    <main className="page">
      <div className="shell">
        <form action={updateInvoice} className="grid" style={{ gap: 20 }}>
          <PendingOverlay />
          <input name="invoice_id" type="hidden" value={id} />

          <header
            style={{
              alignItems: "center",
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "space-between",
            }}
          >
            <div>
              <Link className="button secondary" href={`/invoices/${id}`}>
                ← {invoice.invoice_number}
              </Link>
              <h1 style={{ fontSize: 34, margin: "10px 0 0" }}>Edit invoice</h1>
            </div>
            <button className="button" type="submit">Save changes</button>
          </header>

          {search.error ? (
            <p style={{ color: "var(--danger)", fontWeight: 700, margin: 0 }}>{search.error}</p>
          ) : null}

          <InvoiceFormFields
            agencies={agencies || []}
            agencyExpensePresets={agencyExpensePresets}
            agencyInvoiceNumbers={agencyInvoiceNumbers}
            agencyServicePresets={agencyServicePresets}
            defaultAgencyId={invoice.agency_id}
            defaultInvoiceDate={invoice.invoice_date}
            defaultInvoiceNumber={invoice.invoice_number}
            defaultStatus={invoice.status}
            defaultTourGroupName={invoice.tour_group_name || ""}
            initialExpenseRows={initialExpenseRows}
            initialServiceRows={initialServiceRows}
            minRows={3}
          />

          <section className="card" style={{ display: "grid", gap: 14, padding: 24 }}>
            <h2 style={{ margin: 0 }}>Notes</h2>
            <label className="grid" style={{ gap: 6 }}>
              <span>Notes</span>
              <textarea defaultValue={invoice.notes || ""} name="notes" rows={3} style={inputStyle} />
            </label>
            <label className="grid" style={{ gap: 6 }}>
              <span>Payment instructions</span>
              <textarea
                defaultValue={invoice.payment_instructions || ""}
                name="payment_instructions"
                rows={2}
                style={inputStyle}
              />
            </label>
          </section>
        </form>
      </div>
    </main>
  );
}

const inputStyle = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontFamily: "inherit",
  padding: "12px 14px",
};

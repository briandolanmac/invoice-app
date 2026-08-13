import Link from "next/link";
import { redirect } from "next/navigation";
import { hasDevSession } from "@/lib/dev-auth-server";
import { createClient } from "@/lib/supabase/server";
import { createInvoice } from "./actions";

type AgencyOption = {
  id: string;
  name: string;
  default_invoice_prefix: string | null;
};

const LINE_ITEM_ROWS = 6;

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const usingDevSession = await hasDevSession();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !usingDevSession) {
    redirect("/login");
  }

  const { data: agencies } = usingDevSession
    ? { data: [] as AgencyOption[] }
    : await supabase
        .from("agencies")
        .select("id, name, default_invoice_prefix")
        .eq("is_active", true)
        .order("name")
        .returns<AgencyOption[]>();

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="page">
      <div className="shell">
        <header style={{ marginBottom: 24 }}>
          <Link className="muted" href="/invoices" style={{ textDecoration: "none" }}>← Invoices</Link>
          <h1 style={{ fontSize: 34, margin: "10px 0 0" }}>New invoice</h1>
        </header>

        {params.error ? (
          <p style={{ color: "var(--danger)", fontWeight: 700, marginBottom: 16 }}>
            {params.error}
          </p>
        ) : null}

        {!agencies?.length ? (
          <section className="card" style={{ padding: 24 }}>
            <p className="muted" style={{ margin: 0 }}>
              No agencies yet. <Link href="/agencies">Add one first</Link>, then come back here.
            </p>
          </section>
        ) : (
          <form action={createInvoice} className="grid" style={{ gap: 20 }}>
            <section className="card" style={{ display: "grid", gap: 14, padding: 24 }}>
              <h2 style={{ margin: 0 }}>Details</h2>
              <div style={{ display: "grid", gap: 14, gridTemplateColumns: "2fr 1fr" }}>
                <label className="grid" style={{ gap: 6 }}>
                  <span>Agency</span>
                  <select defaultValue="" name="agency_id" required style={inputStyle}>
                    <option disabled value="">Select an agency</option>
                    {agencies.map((agency) => (
                      <option key={agency.id} value={agency.id}>{agency.name}</option>
                    ))}
                  </select>
                </label>
                <label className="grid" style={{ gap: 6 }}>
                  <span>Invoice number</span>
                  <input
                    name="invoice_number"
                    placeholder="e.g. RD-2026-001"
                    required
                    style={inputStyle}
                    type="text"
                  />
                </label>
              </div>
              <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
                <label className="grid" style={{ gap: 6 }}>
                  <span>Invoice date</span>
                  <input defaultValue={today} name="invoice_date" style={inputStyle} type="date" />
                </label>
                <label className="grid" style={{ gap: 6 }}>
                  <span>Due date</span>
                  <input name="due_date" style={inputStyle} type="date" />
                </label>
              </div>
              <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
                <label className="grid" style={{ gap: 6 }}>
                  <span>Tour / group name</span>
                  <input name="tour_group_name" style={inputStyle} type="text" />
                </label>
                <label className="grid" style={{ gap: 6 }}>
                  <span>Customer reference</span>
                  <input name="customer_reference" style={inputStyle} type="text" />
                </label>
              </div>
            </section>

            <section className="card" style={{ display: "grid", gap: 14, padding: 24 }}>
              <h2 style={{ margin: 0 }}>Charges &amp; expenses</h2>
              <p className="muted" style={{ margin: 0 }}>
                Leave a row&apos;s description blank to skip it. Quantity defaults to 1, price to 0.
              </p>
              <div style={{ display: "grid", gap: 10 }}>
                <div
                  className="muted"
                  style={{
                    display: "grid",
                    fontSize: 13,
                    gridTemplateColumns: "110px 2fr 80px 90px 100px",
                    gap: 8,
                  }}
                >
                  <span>Type</span>
                  <span>Description</span>
                  <span>Qty</span>
                  <span>Unit</span>
                  <span>Unit price</span>
                </div>
                {Array.from({ length: LINE_ITEM_ROWS }).map((_, i) => (
                  <div
                    key={i}
                    style={{ display: "grid", gap: 8, gridTemplateColumns: "110px 2fr 80px 90px 100px" }}
                  >
                    <select defaultValue="service" name={`line_type_${i}`} style={inputStyle}>
                      <option value="service">Service</option>
                      <option value="expense">Expense</option>
                      <option value="tip">Tip</option>
                      <option value="adjustment">Adjustment</option>
                    </select>
                    <input name={`line_desc_${i}`} placeholder="Description" style={inputStyle} type="text" />
                    <input
                      defaultValue={1}
                      name={`line_qty_${i}`}
                      step="0.01"
                      style={inputStyle}
                      type="number"
                    />
                    <input name={`line_unit_${i}`} placeholder="hour" style={inputStyle} type="text" />
                    <input
                      name={`line_price_${i}`}
                      placeholder="0.00"
                      step="0.01"
                      style={inputStyle}
                      type="number"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="card" style={{ display: "grid", gap: 14, padding: 24 }}>
              <h2 style={{ margin: 0 }}>Notes</h2>
              <label className="grid" style={{ gap: 6 }}>
                <span>Notes</span>
                <textarea name="notes" rows={3} style={inputStyle} />
              </label>
              <label className="grid" style={{ gap: 6 }}>
                <span>Payment instructions</span>
                <textarea name="payment_instructions" rows={2} style={inputStyle} />
              </label>
            </section>

            <button className="button" style={{ justifySelf: "start" }} type="submit">
              Save invoice
            </button>
          </form>
        )}
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

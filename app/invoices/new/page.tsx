import Link from "next/link";
import { redirect } from "next/navigation";
import { hasDevSession } from "@/lib/dev-auth-server";
import { createClient } from "@/lib/supabase/server";
import { createInvoice } from "./actions";
import InvoiceFormFields from "../InvoiceFormFields";
import NewInvoicePreviewButton from "./NewInvoicePreviewButton";

type AgencyOption = { id: string; name: string };
type PresetRow = { agency_id: string; description: string };

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

  const [{ data: agencies }, { data: presetRows }] = usingDevSession
    ? [{ data: [] as AgencyOption[] }, { data: [] as PresetRow[] }]
    : await Promise.all([
        supabase
          .from("agencies")
          .select("id, name")
          .eq("is_active", true)
          .order("name")
          .returns<AgencyOption[]>(),
        supabase
          .from("agency_line_item_presets")
          .select("agency_id, description")
          .order("sort_order")
          .returns<PresetRow[]>(),
      ]);

  const agencyPresets: Record<string, string[]> = {};
  for (const row of presetRows || []) {
    (agencyPresets[row.agency_id] ||= []).push(row.description);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="page">
      <div className="shell">
        <header style={{ marginBottom: 24 }}>
          <Link className="button secondary" href="/invoices">← Invoices</Link>
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
          <form action={createInvoice} className="grid" id="new-invoice-form" style={{ gap: 20 }}>
            <InvoiceFormFields
              agencies={agencies}
              agencyPresets={agencyPresets}
              defaultInvoiceDate={today}
            />

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

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <button className="button" type="submit">
                Save invoice
              </button>
              <NewInvoicePreviewButton formId="new-invoice-form" />
            </div>
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

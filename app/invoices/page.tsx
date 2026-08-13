import Link from "next/link";
import { redirect } from "next/navigation";
import { hasDevSession } from "@/lib/dev-auth-server";
import { createClient } from "@/lib/supabase/server";

type InvoiceRow = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  status: string;
  total_amount: number | null;
  agencies: {
    name: string;
  } | null;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#667085",
  paid: "#0f766e",
  sent: "#b58a00",
  void: "#b42318",
};

export default async function InvoicesPage() {
  const usingDevSession = await hasDevSession();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !usingDevSession) {
    redirect("/login");
  }

  const { data: invoices } = usingDevSession
    ? { data: [] as InvoiceRow[] }
    : await supabase
        .from("invoices")
        .select("id, invoice_number, invoice_date, status, total_amount, agencies(name)")
        .order("invoice_date", { ascending: false })
        .returns<InvoiceRow[]>();

  return (
    <main className="page">
      <div className="shell">
        <header
          style={{
            alignItems: "center",
            display: "flex",
            gap: 16,
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <Link className="muted" href="/" style={{ textDecoration: "none" }}>← Home</Link>
            <h1 style={{ fontSize: 34, margin: "10px 0 0" }}>Invoices</h1>
          </div>
          <Link className="button" href="/invoices/new">New invoice</Link>
        </header>

        <section className="card" style={{ padding: 24 }}>
          {!invoices?.length ? (
            <p className="muted">No invoices yet. Create the first one to see it here.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {invoices.map((invoice) => (
                <Link
                  href={`/invoices/${invoice.id}`}
                  key={invoice.id}
                  style={{
                    alignItems: "center",
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    display: "flex",
                    gap: 14,
                    justifyContent: "space-between",
                    padding: 14,
                    textDecoration: "none",
                  }}
                >
                  <div style={{ display: "grid", gap: 4 }}>
                    <strong style={{ fontSize: 18 }}>{invoice.agencies?.name || "No agency"}</strong>
                    <span className="muted">
                      {invoice.invoice_number} · {invoice.invoice_date}
                    </span>
                  </div>
                  <div style={{ alignItems: "center", display: "flex", gap: 14 }}>
                    <span
                      style={{
                        color: STATUS_COLORS[invoice.status] || "var(--muted)",
                        fontWeight: 700,
                        textTransform: "capitalize",
                      }}
                    >
                      {invoice.status}
                    </span>
                    <strong>
                      {invoice.total_amount != null
                        ? `$${Number(invoice.total_amount).toFixed(2)}`
                        : "—"}
                    </strong>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

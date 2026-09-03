import Link from "next/link";
import { redirect } from "next/navigation";
import { hasDevSession } from "@/lib/dev-auth-server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/get-current-user";

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

export default async function HomePage() {
  const usingDevSession = await hasDevSession();
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user && !usingDevSession) {
    redirect("/login");
  }

  const { data: invoices } = usingDevSession
    ? { data: [] as InvoiceRow[] }
    : await supabase
        .from("invoices")
        .select("id, invoice_number, invoice_date, status, total_amount, agencies(name)")
        .order("invoice_date", { ascending: false })
        .limit(8)
        .returns<InvoiceRow[]>();

  return (
    <main className="page">
      <div className="shell">
        {usingDevSession ? (
          <p className="muted" style={{ margin: "0 0 20px" }}>
            Local dev mode is on. Supabase login is bypassed on this Mac only.
          </p>
        ) : null}

        <section
          className="card"
          style={{
            display: "grid",
            gap: 16,
            marginBottom: 20,
            padding: 24,
          }}
        >
          <div style={{ display: "grid", gap: 14, justifyItems: "center" }}>
            <Link
              className="button"
              href="/invoices/new"
              style={{ fontSize: 20, padding: "18px 56px" }}
            >
              New invoice
            </Link>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              <Link className="button secondary" href="/invoices">View invoices</Link>
              <Link className="button secondary" href="/agents">Agents</Link>
              <Link className="button secondary" href="/reports">Reports</Link>
            </div>
          </div>
        </section>

        <section className="card" style={{ padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>Recent invoices</h2>
          {!invoices?.length ? (
            <p className="muted">No invoices yet. The database is ready for its first draft.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {invoices.map((invoice) => (
                <Link
                  href={`/invoices/${invoice.id}`}
                  key={invoice.id}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    display: "grid",
                    gap: 4,
                    padding: 14,
                    textDecoration: "none",
                  }}
                >
                  <strong style={{ fontSize: 18 }}>{invoice.agencies?.name || "No agent"}</strong>
                  <span className="muted">
                    {invoice.invoice_number} · {invoice.invoice_date} · {invoice.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

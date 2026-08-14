import Link from "next/link";
import { redirect } from "next/navigation";
import { hasDevSession } from "@/lib/dev-auth-server";
import { createClient } from "@/lib/supabase/server";
import RevenueBarChart from "./RevenueBarChart";

type InvoiceRow = {
  invoice_date: string;
  total_amount: number | null;
};

export default async function ReportsPage() {
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
        .select("invoice_date, total_amount")
        .eq("status", "paid")
        .returns<InvoiceRow[]>();

  const byMonth = new Map<string, number>();
  for (const invoice of invoices || []) {
    const month = invoice.invoice_date.slice(0, 7);
    byMonth.set(month, (byMonth.get(month) || 0) + Number(invoice.total_amount || 0));
  }

  const monthlyRevenue = Array.from(byMonth.entries())
    .map(([month, amount]) => ({ amount, month }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const totalRevenue = monthlyRevenue.reduce((sum, m) => sum + m.amount, 0);

  const byYear = new Map<string, number>();
  for (const m of monthlyRevenue) {
    const year = m.month.slice(0, 4);
    byYear.set(year, (byYear.get(year) || 0) + m.amount);
  }
  const yearlyRevenue = Array.from(byYear.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  function formatMoney(amount: number) {
    return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
  }

  return (
    <main className="page">
      <div className="shell">
        <header style={{ marginBottom: 24 }}>
          <Link className="button secondary" href="/">← Home</Link>
          <h1 style={{ fontSize: 34, margin: "10px 0 0" }}>Reports</h1>
        </header>

        <section className="card" style={{ display: "grid", gap: 20, padding: 24 }}>
          <div>
            <h2 style={{ margin: 0 }}>Revenue by month</h2>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              Based on invoices marked paid, by invoice date.
            </p>
          </div>

          <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            <div>
              <p className="muted" style={{ margin: 0 }}>Total revenue</p>
              <strong style={{ fontSize: 32 }}>{formatMoney(totalRevenue)}</strong>
            </div>
            {yearlyRevenue.map(([year, amount]) => (
              <div key={year}>
                <p className="muted" style={{ margin: 0 }}>{year} revenue</p>
                <strong style={{ fontSize: 32 }}>{formatMoney(amount)}</strong>
              </div>
            ))}
          </div>

          <RevenueBarChart data={monthlyRevenue} />
        </section>
      </div>
    </main>
  );
}

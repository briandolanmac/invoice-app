import Link from "next/link";
import { redirect } from "next/navigation";
import { hasDevSession } from "@/lib/dev-auth-server";
import { createClient } from "@/lib/supabase/server";
import RevenueBarChart from "./RevenueBarChart";
import RevenuePieChart from "./RevenuePieChart";

type InvoiceRow = {
  invoice_date: string;
  total_amount: number | null;
  agency_id: string | null;
  agencies: { name: string } | null;
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
        .select("invoice_date, total_amount, agency_id, agencies(name)")
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
  const years = yearlyRevenue.map(([year]) => year);

  const agentTotals = new Map<string, { name: string; byYear: Record<string, number>; total: number }>();
  for (const invoice of invoices || []) {
    const agentId = invoice.agency_id || "none";
    const name = invoice.agencies?.name || "No agent";
    const year = invoice.invoice_date.slice(0, 4);
    const amount = Number(invoice.total_amount || 0);

    const entry = agentTotals.get(agentId) || { name, byYear: {}, total: 0 };
    entry.byYear[year] = (entry.byYear[year] || 0) + amount;
    entry.total += amount;
    agentTotals.set(agentId, entry);
  }
  const agentRevenue = Array.from(agentTotals.entries())
    .map(([agentId, entry]) => ({ agentId, ...entry }))
    .sort((a, b) => b.total - a.total);

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

        <section className="card" style={{ display: "grid", gap: 20, marginBottom: 20, padding: 24 }}>
          <div>
            <h2 style={{ margin: 0 }}>Revenue by month</h2>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              Based on invoices marked paid, by invoice date.
            </p>
          </div>

          <div className="revenue-stats">
            <div className="revenue-stat-total">
              <p className="muted" style={{ margin: 0 }}>Total revenue</p>
              <strong className="revenue-stat-value">{formatMoney(totalRevenue)}</strong>
            </div>
            <div className="revenue-stat-years">
              {yearlyRevenue.map(([year, amount]) => (
                <div className="revenue-stat-year" key={year}>
                  <p className="muted" style={{ margin: 0 }}>{year} revenue</p>
                  <strong className="revenue-stat-value">{formatMoney(amount)}</strong>
                </div>
              ))}
            </div>
          </div>

          <RevenueBarChart data={monthlyRevenue} />
        </section>

        <section className="card" style={{ display: "grid", gap: 20, padding: 24 }}>
          <div>
            <h2 style={{ margin: 0 }}>Revenue by agent</h2>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              Based on invoices marked paid, by invoice date.
            </p>
          </div>

          <RevenuePieChart agents={agentRevenue} years={years} />
        </section>
      </div>
    </main>
  );
}

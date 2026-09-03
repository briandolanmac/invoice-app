import Link from "next/link";
import { redirect } from "next/navigation";
import { hasDevSession } from "@/lib/dev-auth-server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/get-current-user";
import RevenueByMonthSection from "./RevenueByMonthSection";
import RevenuePieChart from "./RevenuePieChart";

type InvoiceRow = {
  id: string;
  invoice_date: string;
  total_amount: number | null;
  agency_id: string | null;
  agencies: { name: string } | null;
};

type LineItemRow = {
  invoice_id: string;
  line_date: string | null;
};

export default async function ReportsPage() {
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
        .select("id, invoice_date, total_amount, agency_id, agencies(name)")
        .eq("status", "paid")
        .returns<InvoiceRow[]>();

  const invoiceIds = (invoices || []).map((invoice) => invoice.id);
  const { data: lineItems } =
    usingDevSession || invoiceIds.length === 0
      ? { data: [] as LineItemRow[] }
      : await supabase
          .from("invoice_line_items")
          .select("invoice_id, line_date")
          .in("invoice_id", invoiceIds)
          .returns<LineItemRow[]>();

  // Almost every invoice's line items fall in one month, so we treat the
  // earliest dated line item as "when the work was done" for the whole
  // invoice, falling back to the invoice date when no line item has a date.
  const earliestWorkDateByInvoice = new Map<string, string>();
  for (const item of lineItems || []) {
    if (!item.line_date) continue;
    const current = earliestWorkDateByInvoice.get(item.invoice_id);
    if (!current || item.line_date < current) {
      earliestWorkDateByInvoice.set(item.invoice_id, item.line_date);
    }
  }

  function groupByMonth(dateFor: (invoice: InvoiceRow) => string) {
    const byMonth = new Map<string, { byAgent: Map<string, number>; total: number }>();
    for (const invoice of invoices || []) {
      const month = dateFor(invoice).slice(0, 7);
      const amount = Number(invoice.total_amount || 0);
      const agentId = invoice.agency_id || "none";

      const entry = byMonth.get(month) || { byAgent: new Map<string, number>(), total: 0 };
      entry.total += amount;
      entry.byAgent.set(agentId, (entry.byAgent.get(agentId) || 0) + amount);
      byMonth.set(month, entry);
    }
    const monthlyRevenue = Array.from(byMonth.entries())
      .map(([month, entry]) => ({
        amount: entry.total,
        byAgent: Array.from(entry.byAgent.entries()).map(([agentId, amount]) => ({ agentId, amount })),
        month,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const byYear = new Map<string, number>();
    for (const m of monthlyRevenue) {
      const year = m.month.slice(0, 4);
      byYear.set(year, (byYear.get(year) || 0) + m.amount);
    }
    const yearlyRevenue = Array.from(byYear.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    return { monthlyRevenue, yearlyRevenue };
  }

  const paidDateRevenue = groupByMonth((invoice) => invoice.invoice_date);
  const workDateRevenue = groupByMonth(
    (invoice) => earliestWorkDateByInvoice.get(invoice.id) || invoice.invoice_date
  );

  const totalRevenue = paidDateRevenue.monthlyRevenue.reduce((sum, m) => sum + m.amount, 0);

  const years = Array.from(new Set(paidDateRevenue.yearlyRevenue.map(([year]) => year))).sort();

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

  return (
    <main className="page">
      <div className="shell">
        <header style={{ marginBottom: 24 }}>
          <Link className="button secondary" href="/">← Home</Link>
          <h1 style={{ fontSize: 34, margin: "10px 0 0" }}>Reports</h1>
        </header>

        <RevenueByMonthSection
          agents={agentRevenue}
          paidDate={paidDateRevenue}
          totalRevenue={totalRevenue}
          workDate={workDateRevenue}
        />

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

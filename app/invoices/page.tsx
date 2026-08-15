import Link from "next/link";
import { redirect } from "next/navigation";
import { hasDevSession } from "@/lib/dev-auth-server";
import { createClient } from "@/lib/supabase/server";
import AgentFilterSelect from "./AgentFilterSelect";
import SavedToast from "./SavedToast";

type InvoiceRow = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  status: string;
  total_amount: number | null;
  agency_id: string | null;
  tour_group_name: string | null;
  notes: string | null;
  agencies: {
    name: string;
  } | null;
};

type AgentOption = { id: string; name: string };

const STATUS_COLORS: Record<string, string> = {
  draft: "#667085",
  paid: "#0f766e",
  sent: "#b58a00",
  void: "#b42318",
};

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string; q?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q || "").trim();
  const agentFilter = params.agent || "";
  const usingDevSession = await hasDevSession();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !usingDevSession) {
    redirect("/login");
  }

  const [{ data: invoices }, { data: agents }] = usingDevSession
    ? [{ data: [] as InvoiceRow[] }, { data: [] as AgentOption[] }]
    : await Promise.all([
        supabase
          .from("invoices")
          .select(
            "id, invoice_number, invoice_date, status, total_amount, agency_id, tour_group_name, notes, agencies(name)"
          )
          .order("invoice_date", { ascending: false })
          .returns<InvoiceRow[]>(),
        supabase
          .from("agencies")
          .select("id, name")
          .eq("is_active", true)
          .order("name")
          .returns<AgentOption[]>(),
      ]);

  let visibleInvoices = invoices || [];

  if (agentFilter) {
    visibleInvoices = visibleInvoices.filter((invoice) => invoice.agency_id === agentFilter);
  }

  if (query && visibleInvoices.length) {
    const { data: lineItems } = await supabase
      .from("invoice_line_items")
      .select("invoice_id, description")
      .in("invoice_id", visibleInvoices.map((invoice) => invoice.id));

    const descriptionsByInvoice = new Map<string, string[]>();
    for (const item of lineItems || []) {
      const list = descriptionsByInvoice.get(item.invoice_id) || [];
      list.push(item.description);
      descriptionsByInvoice.set(item.invoice_id, list);
    }

    const lowerQuery = query.toLowerCase();
    visibleInvoices = visibleInvoices.filter((invoice) => {
      const haystack = [
        invoice.invoice_number,
        invoice.agencies?.name,
        invoice.tour_group_name,
        invoice.notes,
        ...(descriptionsByInvoice.get(invoice.id) || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(lowerQuery);
    });
  }

  return (
    <main className="page">
      <SavedToast initialSaved={params.saved === "1"} />
      <div className="shell">
        <header
          style={{
            alignItems: "flex-start",
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <Link className="button secondary" href="/">← Home</Link>
            <h1 style={{ fontSize: 34, margin: "10px 0 0" }}>Invoices</h1>
          </div>
          <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 10 }}>
            <AgentFilterSelect agents={agents || []} currentQuery={query} value={agentFilter} />
            <form
              action="/invoices"
              method="get"
              style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8 }}
            >
              <input name="agent" type="hidden" value={agentFilter} />
              <input
                defaultValue={query}
                name="q"
                placeholder="Search invoices…"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 999,
                  flex: "1 1 160px",
                  fontFamily: "inherit",
                  minWidth: 0,
                  padding: "10px 16px",
                }}
                type="search"
              />
              <button className="button secondary" style={{ flexShrink: 0, padding: "10px 16px" }} type="submit">
                Search
              </button>
              {query ? (
                <Link
                  className="muted"
                  href={agentFilter ? `/invoices?agent=${agentFilter}` : "/invoices"}
                  style={{ textDecoration: "none" }}
                >
                  Clear
                </Link>
              ) : null}
            </form>
            <Link className="button" href="/invoices/new">New invoice</Link>
          </div>
        </header>

        <section className="card" style={{ padding: 24 }}>
          {!invoices?.length ? (
            <p className="muted">No invoices yet. Create the first one to see it here.</p>
          ) : !visibleInvoices.length ? (
            <p className="muted">
              {query ? `No invoices match "${query}".` : "No invoices for this agent."}
            </p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {visibleInvoices.map((invoice) => (
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
                    <strong style={{ fontSize: 18 }}>{invoice.agencies?.name || "No agent"}</strong>
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

import Link from "next/link";
import { redirect } from "next/navigation";
import { hasDevSession } from "@/lib/dev-auth-server";
import { createClient } from "@/lib/supabase/server";
import SavedToast from "../SavedToast";
import { copyInvoice, deleteInvoice } from "./actions";
import { DeleteInvoiceForm } from "./DangerActions";
import InvoiceDetailPdfButton from "./InvoiceDetailPdfButton";

type InvoiceDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

type LineItem = {
  id: string;
  item_type: string;
  description: string;
  line_date: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
  line_total: number;
};

type InvoiceFile = {
  id: string;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  file_role: string;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#667085",
  paid: "#0f766e",
  sent: "#b58a00",
  void: "#b42318",
};

const TYPE_LABELS: Record<string, string> = {
  service: "Service",
  expense: "Expense",
  tip: "Tip",
  adjustment: "Adjustment",
};

export default async function InvoiceDetailPage({ params, searchParams }: InvoiceDetailPageProps) {
  const { id } = await params;
  const search = await searchParams;
  const usingDevSession = await hasDevSession();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !usingDevSession) {
    redirect("/login");
  }

  if (usingDevSession) {
    return (
      <main className="page">
        <section className="shell card" style={{ padding: 24 }}>
          <p className="muted">Invoice detail isn&apos;t available in local dev mode.</p>
        </section>
      </main>
    );
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, agencies(name, billing_address, contact_name, contact_email)")
    .eq("id", id)
    .maybeSingle();

  if (!invoice) {
    return (
      <main className="page">
        <div className="shell">
          <Link className="muted" href="/invoices" style={{ textDecoration: "none" }}>← Invoices</Link>
          <section className="card" style={{ marginTop: 16, padding: 24 }}>
            <p className="muted" style={{ margin: 0 }}>No invoice found with that ID.</p>
          </section>
        </div>
      </main>
    );
  }

  const [{ data: items }, { data: files }] = await Promise.all([
    supabase
      .from("invoice_line_items")
      .select("id, item_type, description, line_date, quantity, unit, unit_price, line_total")
      .eq("invoice_id", id)
      .order("sort_order")
      .returns<LineItem[]>(),
    supabase
      .from("invoice_files")
      .select("id, storage_bucket, storage_path, file_name, file_role")
      .eq("invoice_id", id)
      .returns<InvoiceFile[]>(),
  ]);

  const fileLinks = await Promise.all(
    (files || []).map(async (file) => {
      const { data } = await supabase.storage
        .from(file.storage_bucket)
        .createSignedUrl(file.storage_path, 3600);
      return { ...file, url: data?.signedUrl || null };
    })
  );

  const agency = invoice.agencies as {
    name: string;
    billing_address: string | null;
    contact_email: string | null;
  } | null;

  return (
    <main className="page">
      <SavedToast initialSaved={search.saved === "1"} />
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
            <Link className="muted" href="/invoices" style={{ textDecoration: "none" }}>← Invoices</Link>
            <h1 style={{ fontSize: 34, margin: "10px 0 0" }}>{agency?.name || "No agency"}</h1>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              {invoice.invoice_number} · {invoice.invoice_date}
              {invoice.tour_group_name ? ` · ${invoice.tour_group_name}` : ""}
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link className="button secondary" href={`/invoices/${id}/edit`}>Edit</Link>
            <InvoiceDetailPdfButton
              agencyEmail={agency?.contact_email || null}
              buttonClassName="button"
              fileName={`${invoice.invoice_number}.pdf`}
              invoiceId={id}
            />
            <form action={copyInvoice}>
              <input name="invoice_id" type="hidden" value={id} />
              <button className="button secondary" type="submit">Copy as new</button>
            </form>
            <DeleteInvoiceForm action={deleteInvoice} invoiceId={id} />
          </div>
        </header>

        <section
          className="card"
          style={{ display: "grid", gap: 14, marginBottom: 20, padding: 24 }}
        >
          <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <div>
              <p className="muted" style={{ margin: 0 }}>Status</p>
              <strong
                style={{
                  color: STATUS_COLORS[invoice.status] || "var(--ink)",
                  textTransform: "capitalize",
                }}
              >
                {invoice.status}
              </strong>
            </div>
            <div>
              <p className="muted" style={{ margin: 0 }}>Due date</p>
              <strong>{invoice.due_date || "—"}</strong>
            </div>
            <div>
              <p className="muted" style={{ margin: 0 }}>Customer reference</p>
              <strong>{invoice.customer_reference || "—"}</strong>
            </div>
            <div>
              <p className="muted" style={{ margin: 0 }}>Billing address</p>
              <strong style={{ whiteSpace: "pre-line" }}>{agency?.billing_address || "—"}</strong>
            </div>
          </div>
        </section>

        <section className="card" style={{ marginBottom: 20, padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>Charges &amp; expenses</h2>
          {!items?.length ? (
            <p className="muted">No line items on this invoice.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    alignItems: "center",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    gap: 12,
                    justifyContent: "space-between",
                    paddingBottom: 10,
                  }}
                >
                  <div>
                    <span
                      className="muted"
                      style={{ fontSize: 12, textTransform: "uppercase" }}
                    >
                      {TYPE_LABELS[item.item_type] || item.item_type}
                      {item.line_date ? ` · ${item.line_date}` : ""}
                    </span>
                    <p style={{ margin: "2px 0 0" }}>{item.description}</p>
                    <span className="muted" style={{ fontSize: 13 }}>
                      {item.quantity} {item.unit || ""} × ${Number(item.unit_price).toFixed(2)}
                    </span>
                  </div>
                  <strong>${Number(item.line_total).toFixed(2)}</strong>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gap: 4, justifyItems: "end", marginTop: 16 }}>
            <span className="muted">Subtotal: ${Number(invoice.subtotal_amount).toFixed(2)}</span>
            <span className="muted">Expenses: ${Number(invoice.expense_amount).toFixed(2)}</span>
            <span style={{ fontSize: 20, fontWeight: 700 }}>
              Total: ${Number(invoice.total_amount).toFixed(2)}
            </span>
          </div>
        </section>

        {invoice.notes || invoice.payment_instructions ? (
          <section className="card" style={{ marginBottom: 20, padding: 24 }}>
            {invoice.notes ? (
              <>
                <h2 style={{ marginTop: 0 }}>Notes</h2>
                <p style={{ whiteSpace: "pre-line" }}>{invoice.notes}</p>
              </>
            ) : null}
            {invoice.payment_instructions ? (
              <>
                <h2>Payment instructions</h2>
                <p style={{ whiteSpace: "pre-line" }}>{invoice.payment_instructions}</p>
              </>
            ) : null}
          </section>
        ) : null}

        <section className="card" style={{ padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>Files</h2>
          {!fileLinks.length ? (
            <p className="muted" style={{ margin: 0 }}>
              No PDFs attached to this invoice yet.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {fileLinks.map((file) => (
                <div
                  key={file.id}
                  style={{
                    alignItems: "center",
                    display: "flex",
                    gap: 12,
                    justifyContent: "space-between",
                  }}
                >
                  <span>{file.file_name}</span>
                  {file.url ? (
                    <a className="button secondary" href={file.url} target="_blank" rel="noreferrer">
                      Download
                    </a>
                  ) : (
                    <span className="muted">Unavailable</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

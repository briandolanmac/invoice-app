import Link from "next/link";
import { redirect } from "next/navigation";
import { hasDevSession } from "@/lib/dev-auth-server";
import { createClient } from "@/lib/supabase/server";
import { createAgency } from "./actions";

type AgencyRow = {
  id: string;
  name: string;
  customer_code: string | null;
  billing_address: string | null;
  payment_terms: string | null;
  default_invoice_prefix: string | null;
};

export default async function AgenciesPage({
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
    ? { data: [] as AgencyRow[] }
    : await supabase
        .from("agencies")
        .select("id, name, customer_code, billing_address, payment_terms, default_invoice_prefix")
        .eq("is_active", true)
        .order("name")
        .returns<AgencyRow[]>();

  return (
    <main className="page">
      <div className="shell">
        <header style={{ marginBottom: 24 }}>
          <Link className="button secondary" href="/">← Home</Link>
          <h1 style={{ fontSize: 34, margin: "10px 0 0" }}>Agents</h1>
          <p className="muted" style={{ margin: "6px 0 0" }}>
            Reusable travel agent details for invoices.
          </p>
        </header>

        {params.error ? (
          <p style={{ color: "var(--danger)", fontWeight: 700, marginBottom: 16 }}>
            {params.error}
          </p>
        ) : null}

        <section className="card" style={{ marginBottom: 20, padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>Existing agents</h2>
          {!agencies?.length ? (
            <p className="muted">No agents yet — add the first one below.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {agencies.map((agency) => (
                <Link
                  href={`/agents/${agency.id}`}
                  key={agency.id}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    display: "grid",
                    gap: 4,
                    padding: 14,
                    textDecoration: "none",
                  }}
                >
                  <strong>
                    {agency.name}
                    {agency.customer_code ? ` (${agency.customer_code})` : ""}
                  </strong>
                  {agency.billing_address ? (
                    <span className="muted">{agency.billing_address}</span>
                  ) : null}
                  <span className="muted">
                    {agency.payment_terms} · Prefix {agency.default_invoice_prefix}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="card" style={{ padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>Add a new agent</h2>
          <form action={createAgency} className="grid" style={{ gap: 14 }}>
            <div style={{ display: "grid", gap: 14, gridTemplateColumns: "2fr 1fr" }}>
              <Field label="Agent name" name="name" required />
              <Field label="Customer code" name="customer_code" placeholder="e.g. JTB" />
            </div>
            <Field label="Billing address" name="billing_address" />
            <p className="muted" style={{ margin: 0 }}>
              Add contacts (with phone numbers) after saving, from the agent&apos;s own page.
            </p>
            <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
              <Field label="Payment terms" name="payment_terms" placeholder="Due on receipt" />
              <Field label="Invoice prefix" name="default_invoice_prefix" placeholder="RD" />
            </div>
            <Field label="Notes" name="notes" textarea />
            <button className="button" style={{ justifySelf: "start" }} type="submit">
              Save agent
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
  textarea,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  textarea?: boolean;
  type?: string;
}) {
  return (
    <label className="grid" style={{ gap: 6 }}>
      <span>{label}</span>
      {textarea ? (
        <textarea name={name} placeholder={placeholder} rows={3} style={inputStyle} />
      ) : (
        <input
          name={name}
          placeholder={placeholder}
          required={required}
          style={inputStyle}
          type={type}
        />
      )}
    </label>
  );
}

const inputStyle = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontFamily: "inherit",
  padding: "12px 14px",
};

import Link from "next/link";
import { redirect } from "next/navigation";
import { hasDevSession } from "@/lib/dev-auth-server";
import { createClient } from "@/lib/supabase/server";
import SavedToast from "../../invoices/SavedToast";
import {
  addContact,
  addPreset,
  deleteAgency,
  deleteContact,
  deletePreset,
  updateContacts,
  updatePresets,
} from "./actions";
import { DeleteAgencyForm } from "./DangerActions";

type AgencyDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

type Preset = {
  id: string;
  description: string;
};

type Contact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export default async function AgencyDetailPage({ params, searchParams }: AgencyDetailPageProps) {
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

  const [{ data: agency }, { data: presets }, { data: contacts }] = await Promise.all([
    supabase.from("agencies").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("agency_line_item_presets")
      .select("id, description")
      .eq("agency_id", id)
      .order("sort_order")
      .order("created_at")
      .returns<Preset[]>(),
    supabase
      .from("agency_contacts")
      .select("id, name, phone, email")
      .eq("agency_id", id)
      .order("sort_order")
      .order("created_at")
      .returns<Contact[]>(),
  ]);

  if (!agency) {
    return (
      <main className="page">
        <div className="shell">
          <Link className="button secondary" href="/agencies">← Agencies</Link>
          <section className="card" style={{ marginTop: 16, padding: 24 }}>
            <p className="muted" style={{ margin: 0 }}>No agency found with that ID.</p>
          </section>
        </div>
      </main>
    );
  }

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
            <Link className="button secondary" href="/agencies">← Agencies</Link>
            <h1 style={{ fontSize: 34, margin: "10px 0 0" }}>{agency.name}</h1>
            {agency.billing_address ? (
              <p className="muted" style={{ margin: "6px 0 0", whiteSpace: "pre-line" }}>
                {agency.billing_address}
              </p>
            ) : null}
          </div>
          <DeleteAgencyForm action={deleteAgency} agencyId={id} />
        </header>

        <section className="card" style={{ display: "grid", gap: 14, marginBottom: 20, padding: 24 }}>
          <h2 style={{ margin: 0 }}>Standard descriptions</h2>

          {!presets?.length ? (
            <p className="muted" style={{ margin: 0 }}>
              None configured yet — no dropdown will appear for this agency until you add one below.
            </p>
          ) : (
            <form action={updatePresets} style={{ display: "grid", gap: 8 }}>
              <input name="agency_id" type="hidden" value={id} />
              <div style={{ display: "grid", gap: 8 }}>
                {presets.map((preset) => (
                  <div key={preset.id} style={{ alignItems: "center", display: "flex", gap: 8 }}>
                    <input
                      defaultValue={preset.description}
                      name={`description__${preset.id}`}
                      style={{ ...inputStyle, flex: 1 }}
                      type="text"
                    />
                    <button
                      aria-label="Delete description"
                      className="button secondary"
                      formAction={deletePreset}
                      name="preset_id"
                      style={{ color: "var(--danger)", flexShrink: 0, padding: 10 }}
                      type="submit"
                      value={preset.id}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
              <button className="button secondary" style={{ justifySelf: "start" }} type="submit">
                Save changes
              </button>
            </form>
          )}

          <form action={addPreset} style={{ display: "grid", gap: 8 }}>
            <input name="agency_id" type="hidden" value={id} />
            <textarea
              name="description"
              placeholder="e.g. 1010 Statue of Liberty Tour + One World Observation"
              required
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <button className="button" style={{ justifySelf: "start" }} type="submit">
              + Add description
            </button>
          </form>
        </section>

        <section className="card" style={{ display: "grid", gap: 14, marginBottom: 20, padding: 24 }}>
          <h2 style={{ margin: 0 }}>Contacts</h2>
          <p className="muted" style={{ margin: 0 }}>
            People at {agency.name} — name, phone, and an optional email. Edit directly and save, or
            remove with the trash icon.
          </p>

          {!contacts?.length ? (
            <p className="muted" style={{ margin: 0 }}>No contacts added yet.</p>
          ) : (
            <form action={updateContacts} style={{ display: "grid", gap: 8 }}>
              <input name="agency_id" type="hidden" value={id} />
              <div style={{ display: "grid", gap: 8 }}>
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    style={{
                      alignItems: "center",
                      border: "1px solid var(--border)",
                      borderRadius: 14,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      padding: 10,
                    }}
                  >
                    <input
                      defaultValue={contact.name}
                      name={`name__${contact.id}`}
                      placeholder="Name"
                      style={{ ...inputStyle, flex: "2 1 160px", minWidth: 0 }}
                      type="text"
                    />
                    <input
                      defaultValue={contact.phone || ""}
                      name={`phone__${contact.id}`}
                      placeholder="Phone"
                      style={{ ...inputStyle, flex: "1 1 130px", minWidth: 0 }}
                      type="tel"
                    />
                    <input
                      defaultValue={contact.email || ""}
                      name={`email__${contact.id}`}
                      placeholder="Email (optional)"
                      style={{ ...inputStyle, flex: "2 1 160px", minWidth: 0 }}
                      type="email"
                    />
                    <button
                      aria-label="Delete contact"
                      className="button secondary"
                      formAction={deleteContact}
                      name="contact_id"
                      style={{ color: "var(--danger)", flexShrink: 0, padding: 10 }}
                      type="submit"
                      value={contact.id}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
              <button className="button secondary" style={{ justifySelf: "start" }} type="submit">
                Save changes
              </button>
            </form>
          )}

          <form
            action={addContact}
            style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8 }}
          >
            <input name="agency_id" type="hidden" value={id} />
            <input
              name="name"
              placeholder="Name"
              required
              style={{ ...inputStyle, flex: "2 1 160px", minWidth: 0 }}
              type="text"
            />
            <input
              name="phone"
              placeholder="Phone"
              style={{ ...inputStyle, flex: "1 1 130px", minWidth: 0 }}
              type="tel"
            />
            <input
              name="email"
              placeholder="Email (optional)"
              style={{ ...inputStyle, flex: "2 1 160px", minWidth: 0 }}
              type="email"
            />
            <button className="button" style={{ flexShrink: 0 }} type="submit">
              + Add contact
            </button>
          </form>
        </section>

        <section className="card" style={{ display: "grid", gap: 6, padding: 24 }}>
          <h2 style={{ margin: 0 }}>Details</h2>
          <span className="muted">
            {agency.payment_terms} · Invoice prefix {agency.default_invoice_prefix}
          </span>
        </section>
      </div>
    </main>
  );
}

function TrashIcon() {
  return (
    <svg fill="none" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 7h16M9 7V4h6v3m-8 0 1 13h10l1-13"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

const inputStyle = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontFamily: "inherit",
  padding: "10px 12px",
};

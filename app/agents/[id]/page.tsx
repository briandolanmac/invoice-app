import Link from "next/link";
import { redirect } from "next/navigation";
import { hasDevSession } from "@/lib/dev-auth-server";
import { createClient } from "@/lib/supabase/server";
import SavedToast from "../../invoices/SavedToast";
import PendingOverlay from "@/components/PendingOverlay";
import {
  addContact,
  addPreset,
  deleteAgency,
  deleteContact,
  deletePreset,
  updateAgentPage,
} from "./actions";
import { DeleteAgencyForm } from "./DangerActions";

type AgencyDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

type Preset = {
  id: string;
  description: string;
  item_type: string;
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
      .select("id, description, item_type")
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
          <Link className="button secondary" href="/agents">← Agents</Link>
          <section className="card" style={{ marginTop: 16, padding: 24 }}>
            <p className="muted" style={{ margin: 0 }}>No agent found with that ID.</p>
          </section>
        </div>
      </main>
    );
  }

  const servicePresets = (presets || []).filter((preset) => preset.item_type !== "expense");
  const expensePresets = (presets || []).filter((preset) => preset.item_type === "expense");

  return (
    <main className="page">
      <SavedToast initialSaved={search.saved === "1"} />
      <div className="shell">
        <form action={updateAgentPage}>
          <input name="agency_id" type="hidden" value={id} />

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
              <Link className="button secondary" href="/agents">← Agents</Link>
              <h1 style={{ fontSize: 34, margin: "10px 0 0" }}>{agency.name}</h1>
              {agency.billing_address ? (
                <p className="muted" style={{ margin: "6px 0 0", whiteSpace: "pre-line" }}>
                  {agency.billing_address}
                </p>
              ) : null}
            </div>
            <button className="button" type="submit">Save</button>
          </header>

          <section className="card" style={{ display: "grid", gap: 14, marginBottom: 20, padding: 24 }}>
            <h2 style={{ margin: 0 }}>Contacts</h2>

            {!contacts?.length ? (
              <p className="muted" style={{ margin: 0 }}>No contacts added yet.</p>
            ) : (
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
                      formNoValidate
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
            )}

            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8 }}>
              <input
                name="new_contact_name"
                placeholder="Name"
                style={{ ...inputStyle, flex: "2 1 160px", minWidth: 0 }}
                type="text"
              />
              <input
                name="new_contact_phone"
                placeholder="Phone"
                style={{ ...inputStyle, flex: "1 1 130px", minWidth: 0 }}
                type="tel"
              />
              <input
                name="new_contact_email"
                placeholder="Email (optional)"
                style={{ ...inputStyle, flex: "2 1 160px", minWidth: 0 }}
                type="email"
              />
              <button
                className="button"
                formAction={addContact}
                formNoValidate
                style={{ flexShrink: 0 }}
                type="submit"
              >
                + Add contact
              </button>
            </div>
          </section>

          <section className="card" style={{ display: "grid", gap: 24, marginBottom: 20, padding: 24 }}>
            <h2 style={{ margin: 0 }}>Standard descriptions</h2>
            <PresetGroup itemType="service" presets={servicePresets} />
            <PresetGroup itemType="expense" presets={expensePresets} />
          </section>

          <section className="card" style={{ display: "grid", gap: 14, marginBottom: 20, padding: 24 }}>
            <h2 style={{ margin: 0 }}>Details</h2>
            <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              <label className="grid" style={{ gap: 6 }}>
                <span>Payment terms</span>
                <input
                  defaultValue={agency.payment_terms || ""}
                  name="payment_terms"
                  style={inputStyle}
                  type="text"
                />
              </label>
              <label className="grid" style={{ gap: 6 }}>
                <span>Invoice prefix</span>
                <input
                  defaultValue={agency.default_invoice_prefix || ""}
                  name="default_invoice_prefix"
                  style={inputStyle}
                  type="text"
                />
              </label>
            </div>
          </section>

          <PendingOverlay />
        </form>

        <section className="card" style={{ display: "grid", gap: 6, padding: 24 }}>
          <h2 style={{ margin: 0 }}>Danger zone</h2>
          <p className="muted" style={{ margin: "0 0 12px" }}>
            Permanently delete this agent. This also removes its standard descriptions and contacts.
            Existing invoices keep their data but lose the agent link.
          </p>
          <DeleteAgencyForm action={deleteAgency} agencyId={id} />
        </section>
      </div>
    </main>
  );
}

function PresetGroup({ itemType, presets }: { itemType: "service" | "expense"; presets: Preset[] }) {
  const fieldName = itemType === "expense" ? "new_expense_description" : "new_service_description";

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <h3 style={{ margin: 0 }}>{itemType === "expense" ? "Expenses" : "Services"}</h3>

      {!presets.length ? (
        <p className="muted" style={{ margin: 0 }}>None yet.</p>
      ) : (
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
                formNoValidate
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
      )}

      <div style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 8 }}>
        <textarea
          name={fieldName}
          placeholder={
            itemType === "expense"
              ? "e.g. Tips at $5 per hour"
              : "e.g. 1010 Statue of Liberty Tour + One World Observation"
          }
          rows={2}
          style={{ ...inputStyle, flex: "1 1 240px", minWidth: 0, resize: "vertical" }}
        />
        <button
          className="button secondary"
          formAction={addPreset}
          formNoValidate
          name="item_type"
          style={{ flexShrink: 0 }}
          type="submit"
          value={itemType}
        >
          + Add {itemType === "expense" ? "expense" : "service"}
        </button>
      </div>
    </div>
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

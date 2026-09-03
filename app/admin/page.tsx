import Link from "next/link";
import { redirect } from "next/navigation";
import SavedToast from "../invoices/SavedToast";
import { canAccessAdmin } from "@/lib/admin-access";
import { hasDevSession } from "@/lib/dev-auth-server";
import { getCurrentUser } from "@/lib/supabase/get-current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { setUserPassword } from "./actions";

type AdminPageProps = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const search = await searchParams;
  const usingDevSession = await hasDevSession();
  const user = await getCurrentUser();

  if (!user && !usingDevSession) {
    redirect("/login");
  }
  // Not just hiding the header icon -- block direct navigation too.
  if (user && !canAccessAdmin(user.email)) {
    redirect("/");
  }

  let accounts: { id: string; email: string }[] = [];
  let loadError = "";

  if (!usingDevSession) {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.listUsers();
    if (error) {
      loadError = error.message;
    } else {
      accounts = data.users
        .map((u) => ({ id: u.id, email: u.email || "(no email on file)" }))
        .sort((a, b) => a.email.localeCompare(b.email));
    }
  }

  return (
    <main className="page">
      <div className="shell">
        <SavedToast initialSaved={search.saved === "1"} />

        <header style={{ marginBottom: 24 }}>
          <Link className="button secondary" href="/">← Home</Link>
          <h1 style={{ fontSize: 34, margin: "10px 0 0" }}>Admin</h1>
        </header>

        {search.error ? (
          <p style={{ color: "var(--danger)", fontWeight: 700, marginBottom: 16 }}>{search.error}</p>
        ) : null}

        <section className="card" style={{ display: "grid", gap: 20, padding: 24 }}>
          <div>
            <h2 style={{ margin: 0 }}>Accounts</h2>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              Set a new password for a sign-in account directly, no email link needed.
            </p>
          </div>

          {loadError ? (
            <p style={{ color: "var(--danger)", fontWeight: 700, margin: 0 }}>
              Could not load accounts: {loadError}
            </p>
          ) : usingDevSession ? (
            <p className="muted" style={{ margin: 0 }}>
              Account list isn&apos;t available in local dev mode.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {accounts.map((account) => (
                <form
                  action={setUserPassword}
                  key={account.id}
                  style={{
                    alignItems: "end",
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "1fr auto",
                    padding: 16,
                  }}
                >
                  <input name="user_id" type="hidden" value={account.id} />
                  <label className="grid" style={{ gap: 6, gridColumn: "1 / -1" }}>
                    <strong>{account.email}</strong>
                  </label>
                  <label className="grid" style={{ gap: 6 }}>
                    <span>New password</span>
                    <input
                      autoComplete="new-password"
                      minLength={8}
                      name="password"
                      placeholder="At least 8 characters"
                      required
                      style={inputStyle}
                      type="password"
                    />
                  </label>
                  <button className="button" type="submit">Set password</button>
                </form>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const inputStyle = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontFamily: "inherit",
  minWidth: 0,
  padding: "12px 14px",
  width: "100%",
};

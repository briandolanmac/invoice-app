import { isLocalDevAuthEnabled } from "@/lib/dev-auth";
import { signIn, signInForLocalDev } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const showLocalDevButton = isLocalDevAuthEnabled();

  return (
    <main className="page" style={{ display: "grid", placeItems: "center" }}>
      <section className="card" style={{ maxWidth: 440, padding: 28, width: "100%" }}>
        <p className="muted" style={{ margin: 0 }}>Rie Dolan</p>
        <h1 style={{ fontSize: 34, margin: "8px 0 10px" }}>Tour Invoices</h1>
        <p className="muted" style={{ lineHeight: 1.5, marginBottom: 28 }}>
          Sign in to create, copy, and download invoices.
        </p>

        {params.error ? (
          <p style={{ color: "var(--danger)", fontWeight: 700 }}>
            Sign-in failed: {params.error}
          </p>
        ) : null}

        <form action={signIn} className="grid">
          <label className="grid" style={{ gap: 6 }}>
            <span>Email</span>
            <input
              autoComplete="email"
              name="email"
              required
              style={inputStyle}
              type="email"
            />
          </label>
          <label className="grid" style={{ gap: 6 }}>
            <span>Password</span>
            <input
              autoComplete="current-password"
              name="password"
              required
              style={inputStyle}
              type="password"
            />
          </label>
          <button className="button" type="submit">Sign in</button>
        </form>

        {showLocalDevButton ? (
          <>
            <div
              className="muted"
              style={{
                alignItems: "center",
                display: "flex",
                gap: 12,
                margin: "22px 0",
              }}
            >
              <span style={{ borderTop: "1px solid var(--border)", flex: 1 }} />
              <span>Local prototype</span>
              <span style={{ borderTop: "1px solid var(--border)", flex: 1 }} />
            </div>

            <form action={signInForLocalDev}>
              <button className="button secondary" style={{ width: "100%" }} type="submit">
                Continue in dev mode
              </button>
            </form>
          </>
        ) : null}
      </section>
    </main>
  );
}

const inputStyle = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "12px 14px",
};

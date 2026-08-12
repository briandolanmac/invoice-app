import { updatePassword } from "./actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="page" style={{ display: "grid", placeItems: "center" }}>
      <section className="card" style={{ maxWidth: 440, padding: 28, width: "100%" }}>
        <p className="muted" style={{ margin: 0 }}>Rie Dolan</p>
        <h1 style={{ fontSize: 34, margin: "8px 0 10px" }}>Set a new password</h1>
        <p className="muted" style={{ lineHeight: 1.5, marginBottom: 28 }}>
          Enter a new password for the invoice app.
        </p>

        {params.error ? (
          <p style={{ color: "var(--danger)", fontWeight: 700 }}>
            Password reset failed: {params.error}
          </p>
        ) : null}

        <form action={updatePassword} className="grid">
          <label className="grid" style={{ gap: 6 }}>
            <span>New password</span>
            <input
              autoComplete="new-password"
              minLength={8}
              name="password"
              required
              style={inputStyle}
              type="password"
            />
          </label>
          <button className="button" type="submit">Save password</button>
        </form>
      </section>
    </main>
  );
}

const inputStyle = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "12px 14px",
};

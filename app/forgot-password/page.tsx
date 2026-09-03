"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <main className="page" style={{ display: "grid", placeItems: "center" }}>
      <section className="card" style={{ maxWidth: 440, padding: 28, width: "100%" }}>
        <h1 style={{ fontSize: 34, margin: "0 0 10px" }}>Reset password</h1>

        {status === "sent" ? (
          <>
            <p className="muted" style={{ lineHeight: 1.5, marginBottom: 28 }}>
              If an account exists for <strong>{email}</strong>, a reset link is on its way. Open it
              on this device to set a new password.
            </p>
            <Link className="button secondary" href="/login">← Back to sign in</Link>
          </>
        ) : (
          <>
            <p className="muted" style={{ lineHeight: 1.5, marginBottom: 28 }}>
              Enter your email and we&apos;ll send you a link to set a new password.
            </p>

            {status === "error" ? (
              <p style={{ color: "var(--danger)", fontWeight: 700 }}>
                Could not send reset link: {errorMessage}
              </p>
            ) : null}

            <form className="grid" onSubmit={handleSubmit}>
              <label className="grid" style={{ gap: 6 }}>
                <span>Email</span>
                <input
                  autoComplete="email"
                  name="email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                  type="email"
                  value={email}
                />
              </label>
              <button className="button" disabled={status === "sending"} type="submit">
                {status === "sending" ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <p style={{ marginTop: 18 }}>
              <Link href="/login">← Back to sign in</Link>
            </p>
          </>
        )}
      </section>
    </main>
  );
}

const inputStyle = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "12px 14px",
};

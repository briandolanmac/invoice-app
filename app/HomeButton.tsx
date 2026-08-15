import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { hasDevSession } from "@/lib/dev-auth-server";
import { createClient } from "@/lib/supabase/server";

function InvoiceIcon() {
  return (
    <svg fill="none" height="34" viewBox="0 0 24 24" width="34" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 3h12a1 1 0 0 1 1 1v16l-3-2-3 2-3-2-3 2-3-2V4a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M8 8h8M8 12h8M8 16h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg fill="none" height="22" viewBox="0 0 24 24" width="22" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

/**
 * Sticky top bar (not a floating overlay) so it always reserves its own
 * space in normal document flow -- a fixed-position floating circle was
 * tried first but overlapped page content on shorter pages (e.g. sat
 * directly on top of the login form's email field). Sticky guarantees it
 * never covers anything, on every page, at every viewport size.
 *
 * Grid with matching-width side columns keeps the logo visually centered
 * whether or not the sign-out button is present (e.g. on /login).
 */
export default async function HomeButton() {
  const usingDevSession = await hasDevSession();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user) || usingDevSession;

  return (
    <div
      style={{
        alignItems: "center",
        background: "var(--accent)",
        display: "grid",
        gridTemplateColumns: "40px 1fr 40px",
        padding: "14px 16px",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      <span />
      <Link
        aria-label="Home"
        href="/"
        style={{
          alignItems: "center",
          color: "white",
          display: "flex",
          fontSize: 26,
          fontWeight: 700,
          gap: 10,
          justifySelf: "center",
          textDecoration: "none",
        }}
      >
        <InvoiceIcon />
        Invoice App
      </Link>
      {isAuthenticated ? (
        <form action={signOut} style={{ justifySelf: "end" }}>
          <button
            aria-label="Sign out"
            style={{
              alignItems: "center",
              background: "transparent",
              border: 0,
              color: "white",
              cursor: "pointer",
              display: "flex",
              padding: 8,
            }}
            type="submit"
          >
            <SignOutIcon />
          </button>
        </form>
      ) : (
        <span />
      )}
    </div>
  );
}

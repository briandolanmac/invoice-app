import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/login/actions";
import { canAccessAdmin } from "@/lib/admin-access";
import { hasDevSession } from "@/lib/dev-auth-server";
import { getCurrentUser } from "@/lib/supabase/get-current-user";
import { getDisplayName } from "@/lib/user-display-name";

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

function AdminIcon() {
  return (
    <svg fill="none" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="15" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M11 12l9-9M17 6l3 3M14 9l2 2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

/** Split out from HomeButton so its Supabase auth check runs inside its
 *  own Suspense boundary instead of blocking the header (and the whole
 *  page shell, since HomeButton lives in the root layout above any
 *  route's own loading.tsx) on every single navigation. The icon streams
 *  in a beat after the header itself, rather than the header waiting on it. */
async function SignOutButton() {
  const usingDevSession = await hasDevSession();
  const user = await getCurrentUser();
  const isAuthenticated = Boolean(user) || usingDevSession;

  if (!isAuthenticated) return <span />;

  return (
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
  );
}

/** Mirrors SignOutButton -- its own async auth check inside its own
 *  Suspense boundary, so it doesn't block the header shell either. The
 *  underlying getCurrentUser() call is request-deduped (React cache()),
 *  so this doesn't cost a second Supabase round-trip alongside
 *  SignOutButton's own check. Combines the "Hi <name>" greeting and the
 *  admin icon since they share the same identity check and the same
 *  header slot. */
async function AccountBadge() {
  const usingDevSession = await hasDevSession();
  const user = await getCurrentUser();
  const isAuthenticated = Boolean(user) || usingDevSession;

  if (!isAuthenticated) return <span />;

  const name = getDisplayName(user?.email);
  const showAdminLink = user != null && canAccessAdmin(user.email);

  return (
    <div style={{ alignItems: "center", display: "flex", gap: 4, justifySelf: "start" }}>
      {name ? (
        <span style={{ color: "white", fontSize: 15, fontWeight: 700, whiteSpace: "nowrap" }}>
          Hi {name}
        </span>
      ) : null}
      {showAdminLink ? (
        <Link
          aria-label="Admin"
          href="/admin"
          style={{
            alignItems: "center",
            color: "white",
            display: "flex",
            padding: 8,
            textDecoration: "none",
          }}
        >
          <AdminIcon />
        </Link>
      ) : null}
    </div>
  );
}

/**
 * Sticky top bar (not a floating overlay) so it always reserves its own
 * space in normal document flow -- a fixed-position floating circle was
 * tried first but overlapped page content on shorter pages (e.g. sat
 * directly on top of the login form's email field). Sticky guarantees it
 * never covers anything, on every page, at every viewport size.
 *
 * Grid with matching-width side columns kept the logo visually centered
 * when both sides were icon-only, but the left column now sizes to its
 * content (auto) instead of a fixed 40px so "Hi <name>" can fit next to
 * the admin icon -- the logo is no longer perfectly centered on pages
 * where that greeting renders, which is an acceptable tradeoff.
 */
export default function HomeButton() {
  return (
    <div
      style={{
        alignItems: "center",
        background: "var(--accent)",
        display: "grid",
        gridTemplateColumns: "minmax(40px, auto) 1fr 40px",
        padding: "14px 16px",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      <Suspense fallback={<span />}>
        <AccountBadge />
      </Suspense>
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
      <Suspense fallback={<span />}>
        <SignOutButton />
      </Suspense>
    </div>
  );
}

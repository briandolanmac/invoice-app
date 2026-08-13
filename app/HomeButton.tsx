import Link from "next/link";

function InvoiceIcon() {
  return (
    <svg fill="none" height="32" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg">
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

/**
 * Sticky top bar (not a floating overlay) so it always reserves its own
 * space in normal document flow -- a fixed-position floating circle was
 * tried first but overlapped page content on shorter pages (e.g. sat
 * directly on top of the login form's email field). Sticky guarantees it
 * never covers anything, on every page, at every viewport size.
 */
export default function HomeButton() {
  return (
    <div
      style={{
        background: "var(--accent)",
        display: "flex",
        justifyContent: "center",
        padding: "14px 16px",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      <Link
        aria-label="Home"
        href="/"
        style={{
          alignItems: "center",
          color: "white",
          display: "flex",
          fontSize: 22,
          fontWeight: 700,
          gap: 10,
          textDecoration: "none",
        }}
      >
        <InvoiceIcon />
        Invoice App
      </Link>
    </div>
  );
}

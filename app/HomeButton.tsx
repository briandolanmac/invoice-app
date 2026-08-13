import Link from "next/link";

function InvoiceIcon() {
  return (
    <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
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

export default function HomeButton() {
  return (
    <Link
      aria-label="Home"
      href="/"
      style={{
        alignItems: "center",
        background: "var(--accent)",
        borderRadius: "999px",
        bottom: 20,
        boxShadow: "0 8px 20px rgb(214 51 108 / 35%)",
        color: "white",
        display: "flex",
        height: 52,
        justifyContent: "center",
        left: 20,
        position: "fixed",
        width: 52,
        zIndex: 1000,
      }}
    >
      <InvoiceIcon />
    </Link>
  );
}

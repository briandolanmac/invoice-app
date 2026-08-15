"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Contact = { id: string; name: string; phone: string | null; email: string | null };

const inputStyle = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontFamily: "inherit",
  padding: "10px 12px",
};

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

/** Delete is a direct call to the server action (not a form submission),
 *  so the row can hide itself the instant it's clicked instead of
 *  waiting on a network round-trip -- "tap the icon, the row disappears
 *  immediately" per Brian's ask. */
export default function ContactRow({
  agencyId,
  contact,
  deleteAction,
}: {
  agencyId: string;
  contact: Contact;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const [deleted, setDeleted] = useState(false);
  const router = useRouter();

  if (deleted) return null;

  function handleDelete() {
    setDeleted(true);
    const formData = new FormData();
    formData.set("contact_id", contact.id);
    formData.set("agency_id", agencyId);
    deleteAction(formData).then(() => router.refresh());
  }

  return (
    <div
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
        onClick={handleDelete}
        style={{ color: "var(--danger)", flexShrink: 0, padding: 10 }}
        type="button"
      >
        <TrashIcon />
      </button>
    </div>
  );
}

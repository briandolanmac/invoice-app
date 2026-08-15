"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const inputStyle = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontFamily: "inherit",
  padding: "10px 12px",
};

/** Calls addContact directly (not via formAction) -- same robust
 *  pattern as AddPresetRow. Still real named <input>s so the header's
 *  main Save button can pick up an abandoned draft too. */
export default function AddContactRow({
  addAction,
  agencyId,
}: {
  addAction: (formData: FormData) => Promise<void>;
  agencyId: string;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleAdd() {
    const name = nameRef.current?.value.trim() || "";
    if (!name || pending) return;

    setPending(true);
    const formData = new FormData();
    formData.set("agency_id", agencyId);
    formData.set("new_contact_name", name);
    formData.set("new_contact_phone", phoneRef.current?.value.trim() || "");
    formData.set("new_contact_email", emailRef.current?.value.trim() || "");
    try {
      await addAction(formData);
      if (nameRef.current) nameRef.current.value = "";
      if (phoneRef.current) phoneRef.current.value = "";
      if (emailRef.current) emailRef.current.value = "";
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8 }}>
      <input
        name="new_contact_name"
        placeholder="Name"
        ref={nameRef}
        style={{ ...inputStyle, flex: "2 1 160px", minWidth: 0 }}
        type="text"
      />
      <input
        name="new_contact_phone"
        placeholder="Phone"
        ref={phoneRef}
        style={{ ...inputStyle, flex: "1 1 130px", minWidth: 0 }}
        type="tel"
      />
      <input
        name="new_contact_email"
        placeholder="Email (optional)"
        ref={emailRef}
        style={{ ...inputStyle, flex: "2 1 160px", minWidth: 0 }}
        type="email"
      />
      <button className="button" disabled={pending} onClick={handleAdd} style={{ flexShrink: 0 }} type="button">
        + Add contact
      </button>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const inputStyle = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontFamily: "inherit",
  padding: "10px 12px",
};

/** Calls addPreset directly (not via formAction) -- the same robust
 *  pattern already proven for delete after the "add expense didn't
 *  stick" report. Still a real named <textarea> so the header's main
 *  Save button can pick up an abandoned draft too. */
export default function AddPresetRow({
  addAction,
  agencyId,
  itemType,
}: {
  addAction: (formData: FormData) => Promise<void>;
  agencyId: string;
  itemType: "service" | "expense";
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const fieldName = itemType === "expense" ? "new_expense_description" : "new_service_description";

  async function handleAdd() {
    const description = textareaRef.current?.value.trim() || "";
    if (!description || pending) return;

    setPending(true);
    const formData = new FormData();
    formData.set("agency_id", agencyId);
    formData.set("item_type", itemType);
    formData.set(fieldName, description);
    try {
      await addAction(formData);
      if (textareaRef.current) textareaRef.current.value = "";
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 8 }}>
      <textarea
        name={fieldName}
        placeholder={
          itemType === "expense"
            ? "e.g. Tips at $5 per hour"
            : "e.g. 1010 Statue of Liberty Tour + One World Observation"
        }
        ref={textareaRef}
        rows={2}
        style={{ ...inputStyle, flex: "1 1 240px", minWidth: 0, resize: "vertical" }}
      />
      <button
        className="button secondary"
        disabled={pending}
        onClick={handleAdd}
        style={{ flexShrink: 0 }}
        type="button"
      >
        + Add {itemType === "expense" ? "expense" : "service"}
      </button>
    </div>
  );
}

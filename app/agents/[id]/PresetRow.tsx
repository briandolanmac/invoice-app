"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Preset = { id: string; description: string; item_type: string };

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
export default function PresetRow({
  agencyId,
  deleteAction,
  preset,
}: {
  agencyId: string;
  deleteAction: (formData: FormData) => Promise<void>;
  preset: Preset;
}) {
  const [deleted, setDeleted] = useState(false);
  const router = useRouter();

  if (deleted) return null;

  function handleDelete() {
    setDeleted(true);
    const formData = new FormData();
    formData.set("preset_id", preset.id);
    formData.set("agency_id", agencyId);
    deleteAction(formData).then(() => router.refresh());
  }

  return (
    <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
      {/* textarea (not input) so an existing shortcut can be edited to
          span two lines, matching AddPresetRow's field -- lets a shortcut
          itself hold a combo like two bundled tour descriptions, picked
          as one line-item pick instead of appending presets one at a
          time on the invoice form. */}
      <textarea
        defaultValue={preset.description}
        name={`description__${preset.id}`}
        rows={2}
        style={{ ...inputStyle, flex: 1, resize: "vertical" }}
      />
      <button
        aria-label="Delete description"
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

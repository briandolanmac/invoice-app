"use client";

import PendingOverlay from "@/components/PendingOverlay";

const STATUS_COLORS: Record<string, string> = {
  draft: "#667085",
  paid: "#0f766e",
  sent: "#b58a00",
  void: "#b42318",
};

/** Quick status change right on the detail page -- previously the only
 *  way to flip draft -> sent was the full Edit form's Status dropdown,
 *  buried among every other field. Auto-submits on change. */
export default function InvoiceStatusSelect({
  action,
  invoiceId,
  status,
}: {
  action: (formData: FormData) => void;
  invoiceId: string;
  status: string;
}) {
  return (
    <form action={action}>
      <PendingOverlay />
      <input name="invoice_id" type="hidden" value={invoiceId} />
      <select
        defaultValue={status}
        name="status"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        style={{
          border: "1px solid var(--border)",
          borderRadius: 10,
          color: STATUS_COLORS[status] || "var(--ink)",
          fontFamily: "inherit",
          fontWeight: 700,
          padding: "6px 10px",
          textTransform: "capitalize",
        }}
      >
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="paid">Paid</option>
        <option value="void">Void</option>
      </select>
    </form>
  );
}

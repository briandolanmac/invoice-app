"use client";

export function DeleteInvoiceForm({
  action,
  invoiceId,
}: {
  action: (formData: FormData) => void;
  invoiceId: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this invoice permanently? This can't be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <input name="invoice_id" type="hidden" value={invoiceId} />
      <button className="button secondary" style={{ color: "var(--danger)" }} type="submit">
        Delete
      </button>
    </form>
  );
}

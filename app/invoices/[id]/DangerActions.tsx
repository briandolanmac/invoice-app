"use client";

export function DeleteFileForm({
  action,
  fileId,
  fileName,
  invoiceId,
  storageBucket,
  storagePath,
}: {
  action: (formData: FormData) => void;
  fileId: string;
  fileName: string;
  invoiceId: string;
  storageBucket: string;
  storagePath: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Delete "${fileName}"? This can't be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <input name="file_id" type="hidden" value={fileId} />
      <input name="invoice_id" type="hidden" value={invoiceId} />
      <input name="storage_bucket" type="hidden" value={storageBucket} />
      <input name="storage_path" type="hidden" value={storagePath} />
      <button
        aria-label={`Delete ${fileName}`}
        className="button secondary"
        style={{ color: "var(--danger)", flexShrink: 0, padding: 8 }}
        type="submit"
      >
        <TrashIcon />
      </button>
    </form>
  );
}

function TrashIcon() {
  return (
    <svg fill="none" height="16" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
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

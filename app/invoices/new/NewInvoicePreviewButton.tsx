"use client";

import PdfPreviewButton from "@/components/PdfPreviewButton";

/** Reads the CURRENT, possibly-unsaved state of the New Invoice form (by
 *  id) and posts it to the preview API, so "Preview PDF" always reflects
 *  what's on screen right now instead of whatever was last saved. */
export default function NewInvoicePreviewButton({ formId }: { formId: string }) {
  async function loadPdf() {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) throw new Error("Could not find the invoice form");

    const formData = new FormData(form);
    const res = await fetch("/api/invoices/preview-pdf", { body: formData, method: "POST" });
    if (!res.ok) throw new Error("Could not generate the PDF preview");
    return res.blob();
  }

  return (
    <PdfPreviewButton buttonLabel="Preview PDF" fileName="invoice-preview.pdf" loadPdf={loadPdf} />
  );
}

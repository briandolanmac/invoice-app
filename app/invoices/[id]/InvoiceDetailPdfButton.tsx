"use client";

import PdfPreviewButton from "@/components/PdfPreviewButton";

/** "View PDF" for a saved invoice -- always renders from current DB data
 *  via the API route, so it can never show a stale copy. */
export default function InvoiceDetailPdfButton({
  buttonClassName,
  fileName,
  invoiceId,
}: {
  buttonClassName?: string;
  fileName: string;
  invoiceId: string;
}) {
  async function loadPdf() {
    const res = await fetch(`/api/invoices/${invoiceId}/pdf`);
    if (!res.ok) throw new Error("Could not generate the PDF");
    return res.blob();
  }

  return (
    <PdfPreviewButton
      buttonClassName={buttonClassName}
      buttonLabel="View PDF"
      fileName={fileName}
      loadPdf={loadPdf}
    />
  );
}

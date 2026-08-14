"use client";

import { useEffect, useRef, useState } from "react";
import PdfCanvasViewer from "./PdfCanvasViewer";

/** Reusable "view a PDF in a popup" button + modal. Renders the PDF via
 *  pdf.js onto <canvas> instead of an <iframe> -- iOS Safari doesn't
 *  reliably render PDFs embedded in iframes, but canvas rendering works
 *  the same everywhere. Never opens a new tab/window. `loadPdf` is called
 *  fresh each time the popup opens, so callers can either fetch a saved
 *  file or generate one on the fly from live data. */
export default function PdfPreviewButton({
  buttonClassName = "button secondary",
  buttonLabel = "Preview PDF",
  fileName,
  loadPdf,
}: {
  buttonClassName?: string;
  buttonLabel?: string;
  fileName: string;
  loadPdf: () => Promise<Blob>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.canShare) return;
    try {
      const probe = new File([], "probe.pdf", { type: "application/pdf" });
      setCanShareFiles(navigator.canShare({ files: [probe] }));
    } catch {
      setCanShareFiles(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function handleOpen() {
    setOpen(true);
    setLoading(true);
    setError(null);
    setShareError(null);
    try {
      const pdfBlob = await loadPdf();
      setBlob(pdfBlob);
      setPdfUrl(URL.createObjectURL(pdfBlob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate PDF");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setBlob(null);
    setPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setError(null);
  }

  function handlePrint() {
    printFrameRef.current?.contentWindow?.print();
  }

  /** Replaces the plain "Download" link wherever the OS can actually
   *  attach the file (Web Share API with file support -- iOS/Android,
   *  most mobile browsers): opens the native share sheet (Save to Files,
   *  Mail, Messages, AirDrop, etc.) with the real PDF attached. Needed
   *  because <a download href="blob:..."> isn't reliably honored on iOS
   *  Safari -- it can just navigate to the raw PDF instead of saving it,
   *  stranding the user outside the app with no way back. */
  async function handleShare() {
    if (!blob) return;
    const file = new File([blob], fileName, { type: "application/pdf" });
    try {
      await navigator.share({ files: [file], title: fileName });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setShareError(err instanceof Error ? err.message : "Could not share PDF");
    }
  }

  return (
    <>
      <button className={buttonClassName} onClick={handleOpen} type="button">
        {buttonLabel}
      </button>

      {open ? (
        <div className="pdf-modal-overlay" onClick={handleClose}>
          <div className="pdf-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-modal-header">
              <strong>Invoice PDF</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {pdfUrl ? (
                  <>
                    {canShareFiles ? (
                      <button
                        className="button secondary"
                        onClick={handleShare}
                        style={{ padding: "8px 14px" }}
                        type="button"
                      >
                        Share
                      </button>
                    ) : null}
                    <button
                      className="button secondary"
                      onClick={handlePrint}
                      style={{ padding: "8px 14px" }}
                      type="button"
                    >
                      Print
                    </button>
                  </>
                ) : null}
                <button
                  aria-label="Close"
                  className="button secondary"
                  onClick={handleClose}
                  style={{ padding: "8px 14px" }}
                  type="button"
                >
                  Close
                </button>
              </div>
            </div>
            <div style={{ flex: 1, position: "relative" }}>
              {loading ? (
                <div
                  style={{
                    alignItems: "center",
                    display: "flex",
                    height: "100%",
                    justifyContent: "center",
                  }}
                >
                  <span className="muted">Generating PDF…</span>
                </div>
              ) : error ? (
                <div
                  style={{
                    alignItems: "center",
                    color: "var(--danger)",
                    display: "flex",
                    height: "100%",
                    justifyContent: "center",
                    padding: 20,
                    textAlign: "center",
                  }}
                >
                  {error}
                </div>
              ) : blob ? (
                <PdfCanvasViewer blob={blob} />
              ) : null}
              {shareError ? (
                <div
                  style={{
                    background: "var(--card)",
                    borderTop: "1px solid var(--border)",
                    bottom: 0,
                    color: "var(--danger)",
                    fontSize: 13,
                    left: 0,
                    padding: "8px 16px",
                    position: "absolute",
                    right: 0,
                    textAlign: "center",
                  }}
                >
                  {shareError}
                </div>
              ) : null}
            </div>
          </div>
          {pdfUrl ? (
            <iframe
              ref={printFrameRef}
              src={pdfUrl}
              style={{ border: 0, height: 0, position: "absolute", width: 0 }}
              tabIndex={-1}
              title="Invoice PDF (print)"
            />
          ) : null}
        </div>
      ) : null}
    </>
  );
}

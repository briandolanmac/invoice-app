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
  agencyEmail,
  buttonClassName = "button secondary",
  buttonLabel = "Preview PDF",
  fileName,
  loadPdf,
  showEmail = false,
}: {
  agencyEmail?: string | null;
  buttonClassName?: string;
  buttonLabel?: string;
  fileName: string;
  loadPdf: () => Promise<Blob>;
  showEmail?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  /** mailto: can never attach a file -- that's a browser sandbox
   *  restriction, not something fixable with different markup. Where the
   *  OS supports it (iOS/Android, most mobile browsers), the Web Share
   *  API opens the native share sheet (Mail, Messages, AirDrop, etc.)
   *  with the actual PDF attached. Falls back to the old mailto-only
   *  behavior on browsers that don't support sharing files. */
  async function handleShare() {
    if (!blob) return;
    const file = new File([blob], fileName, { type: "application/pdf" });
    try {
      await navigator.share({ files: [file], title: fileName });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      window.location.href = `mailto:${agencyEmail || ""}?subject=${encodeURIComponent(fileName)}`;
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
                    <a
                      className="button secondary"
                      download={fileName}
                      href={pdfUrl}
                      style={{ padding: "8px 14px" }}
                    >
                      Download
                    </a>
                    <button
                      className="button secondary"
                      onClick={handlePrint}
                      style={{ padding: "8px 14px" }}
                      type="button"
                    >
                      Print
                    </button>
                    {showEmail && canShareFiles ? (
                      <button
                        className="button secondary"
                        onClick={handleShare}
                        style={{ padding: "8px 14px" }}
                        type="button"
                      >
                        Share
                      </button>
                    ) : showEmail ? (
                      <a
                        className="button secondary"
                        href={`mailto:${agencyEmail || ""}?subject=${encodeURIComponent(
                          fileName
                        )}`}
                        style={{ padding: "8px 14px" }}
                      >
                        Email
                      </a>
                    ) : null}
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

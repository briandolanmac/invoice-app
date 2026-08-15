"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist";

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

/** iOS Safari doesn't reliably render PDFs embedded via <iframe>/<embed> --
 *  it commonly shows a blank frame. pdf.js sidesteps the native PDF viewer
 *  entirely by rasterizing pages onto <canvas>, so this renders the same
 *  way on every browser, mobile included. */
function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      return pdfjsLib;
    });
  }
  return pdfjsPromise;
}

export default function PdfCanvasViewer({ blob }: { blob: Blob }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: PDFDocumentLoadingTask | null = null;

    async function render() {
      const container = containerRef.current;
      if (!container) return;
      container.replaceChildren();
      setError(null);

      try {
        const pdfjsLib = await loadPdfjs();
        const arrayBuffer = await blob.arrayBuffer();
        if (cancelled) return;

        loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const doc: PDFDocumentProxy = await loadingTask.promise;
        if (cancelled) return;

        for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
          const page = await doc.getPage(pageNumber);
          if (cancelled) return;

          const unscaledViewport = page.getViewport({ scale: 1 });
          const targetWidth = container.clientWidth || 800;
          const viewport = page.getViewport({ scale: targetWidth / unscaledViewport.width });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.background = "white";
          canvas.style.borderRadius = "8px";
          canvas.style.boxShadow = "0 4px 14px rgb(58 31 46 / 15%)";
          canvas.style.display = "block";
          canvas.style.marginBottom = "16px";
          canvas.style.maxWidth = "100%";
          container.appendChild(canvas);

          const context = canvas.getContext("2d");
          if (!context) continue;
          await page.render({ canvas, canvasContext: context, viewport }).promise;
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not render PDF");
      }
    }

    render();

    return () => {
      cancelled = true;
      loadingTask?.destroy();
    };
  }, [blob]);

  if (error) {
    return (
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
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ background: "var(--background)", height: "100%", overflowY: "auto", padding: 16 }}
    />
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist";

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

/** pdfjs-dist 6.x calls the brand-new (2025) Map/WeakMap.prototype.getOrInsertComputed
 *  on its main-thread API layer (e.g. caching sendWithPromise results per method
 *  name). Browsers without that yet throw "is not a function" the moment any PDF
 *  is opened -- polyfill it before pdfjs-dist loads so this works everywhere. */
function ensureMapUpsertPolyfill() {
  for (const ctor of [Map, WeakMap]) {
    const proto = ctor.prototype as { getOrInsertComputed?: (key: unknown, cb: (key: unknown) => unknown) => unknown };
    if (typeof proto.getOrInsertComputed !== "function") {
      proto.getOrInsertComputed = function (this: Map<unknown, unknown>, key, callback) {
        if (this.has(key)) return this.get(key);
        const value = callback(key);
        this.set(key, value);
        return value;
      };
    }
  }
}

/** iOS Safari doesn't reliably render PDFs embedded via <iframe>/<embed> --
 *  it commonly shows a blank frame. pdf.js sidesteps the native PDF viewer
 *  entirely by rasterizing pages onto <canvas>, so this renders the same
 *  way on every browser, mobile included. */
function loadPdfjs() {
  if (!pdfjsPromise) {
    ensureMapUpsertPolyfill();
    pdfjsPromise = import("pdfjs-dist").then((pdfjsLib) => {
      const workerUrl = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();

      // The worker runs in its own JS realm, so the polyfill above never
      // reaches it, and the worker bundle uses the same new Map/WeakMap
      // method internally for its own parsing caches. Load it through a
      // tiny blob-hosted module that installs the polyfill first, then
      // imports the real worker script by its resolved URL.
      const shim = `
        for (const ctor of [Map, WeakMap]) {
          if (typeof ctor.prototype.getOrInsertComputed !== "function") {
            ctor.prototype.getOrInsertComputed = function (key, callback) {
              if (this.has(key)) return this.get(key);
              const value = callback(key);
              this.set(key, value);
              return value;
            };
          }
        }
        import(${JSON.stringify(workerUrl)});
      `;
      pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(
        new Blob([shim], { type: "text/javascript" })
      );
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

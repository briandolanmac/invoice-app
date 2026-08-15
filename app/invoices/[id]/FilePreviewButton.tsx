"use client";

import PdfPreviewButton from "@/components/PdfPreviewButton";

function FileIcon() {
  return (
    <svg
      fill="none"
      height="20"
      style={{ color: "var(--muted)", flexShrink: 0 }}
      viewBox="0 0 24 24"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-6-5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path d="M13 3v5h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

/** Files-list entry: opens in the same in-page popup as everywhere else
 *  in the app, never a new tab -- even though this file's URL is a real
 *  signed HTTPS link (not the blob: URL that caused the earlier iOS
 *  Safari "stranded outside the app" issue), Brian's ask is that every
 *  PDF view in the app uses the popup consistently, so there's never a
 *  "tap back in the browser" moment. */
export default function FilePreviewButton({ fileName, url }: { fileName: string; url: string }) {
  async function loadPdf() {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not load the file");
    return res.blob();
  }

  return (
    <PdfPreviewButton
      fileName={fileName}
      loadPdf={loadPdf}
      trigger={(onClick) => (
        <button
          onClick={onClick}
          style={{
            alignItems: "center",
            background: "none",
            border: 0,
            color: "inherit",
            cursor: "pointer",
            display: "flex",
            font: "inherit",
            gap: 10,
            minWidth: 0,
            padding: 0,
            textAlign: "left",
          }}
          type="button"
        >
          <FileIcon />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName}</span>
        </button>
      )}
    />
  );
}

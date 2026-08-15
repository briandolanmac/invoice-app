"use client";

import { useEffect, useRef, useState } from "react";

/** Sits inside the agent-detail form. Tracks whether any field has
 *  changed since load/last save, warns via the browser's native
 *  refresh/close prompt, and intercepts clicks on in-app links (which
 *  Next.js handles client-side, so beforeunload never fires for them)
 *  with a "save your changes?" modal instead of silently discarding
 *  edits. */
export default function UnsavedChangesGuard() {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [dirty, setDirty] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const form = anchorRef.current?.closest("form");
    if (!form) return;

    const markDirty = () => setDirty(true);
    const clearDirty = () => setDirty(false);
    form.addEventListener("input", markDirty);
    form.addEventListener("change", markDirty);
    form.addEventListener("submit", clearDirty);

    return () => {
      form.removeEventListener("input", markDirty);
      form.removeEventListener("change", markDirty);
      form.removeEventListener("submit", clearDirty);
    };
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    if (!dirty) return;

    function handleClick(e: MouseEvent) {
      const link = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank") return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      e.preventDefault();
      e.stopPropagation();
      setPendingHref(link.getAttribute("href"));
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [dirty]);

  function handleSaveAndLeave() {
    const form = anchorRef.current?.closest("form") as HTMLFormElement | null;
    if (!form) return;
    setSaving(true);
    setPendingHref(null);
    form.requestSubmit();
  }

  function handleDiscardAndLeave() {
    const href = pendingHref;
    setDirty(false);
    setPendingHref(null);
    if (href) window.location.href = href;
  }

  return (
    <span ref={anchorRef} style={{ display: "none" }}>
      {pendingHref ? (
        <div
          className="pdf-modal-overlay"
          onClick={() => setPendingHref(null)}
          role="dialog"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--card)",
              borderRadius: 20,
              display: "grid",
              gap: 16,
              height: "auto",
              maxWidth: 340,
              padding: 24,
              width: "90%",
            }}
          >
            <p style={{ margin: 0 }}>You have unsaved changes. Do you wish to save them?</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="button secondary" onClick={handleDiscardAndLeave} type="button">
                No
              </button>
              <button className="button" disabled={saving} onClick={handleSaveAndLeave} type="button">
                Yes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </span>
  );
}

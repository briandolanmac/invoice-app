"use client";

import { useFormStatus } from "react-dom";

/** Full-screen spinner shown while the enclosing <form> is submitting.
 *  Must be rendered INSIDE that form -- useFormStatus() reads the
 *  nearest parent form's pending state. Exists because redirecting back
 *  to the same route with a different search param (e.g. ?saved=1)
 *  doesn't reliably re-trigger that route's loading.tsx Suspense
 *  boundary, so a slow save could otherwise look like nothing happened. */
export default function PendingOverlay() {
  const { pending } = useFormStatus();
  if (!pending) return null;

  return (
    <div
      style={{
        alignItems: "center",
        background: "rgb(58 31 46 / 35%)",
        display: "flex",
        inset: 0,
        justifyContent: "center",
        position: "fixed",
        zIndex: 4000,
      }}
    >
      <div
        style={{
          animation: "pending-overlay-spin 0.8s linear infinite",
          border: "4px solid var(--accent-soft)",
          borderRadius: "50%",
          borderTopColor: "var(--accent)",
          height: 48,
          width: 48,
        }}
      />
      <style>{`
        @keyframes pending-overlay-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

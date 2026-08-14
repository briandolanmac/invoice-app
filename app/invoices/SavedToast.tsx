"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Shows a brief "Saved" confirmation, then clears itself and strips
 *  ?saved=1 from the URL. `initialSaved` is read server-side (the page
 *  already has searchParams) and passed in as a plain prop -- avoids
 *  useSearchParams()/Suspense entirely, so the toast is already known
 *  to be visible on first paint instead of discovering it after mount. */
export default function SavedToast({ initialSaved }: { initialSaved: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [visible, setVisible] = useState(initialSaved);

  useEffect(() => {
    if (!initialSaved) return;
    const timer = setTimeout(() => {
      setVisible(false);
      router.replace(pathname, { scroll: false });
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        alignItems: "center",
        background: "var(--accent)",
        borderRadius: 999,
        boxShadow: "0 10px 24px rgb(58 31 46 / 25%)",
        color: "white",
        display: "flex",
        fontWeight: 700,
        gap: 8,
        left: "50%",
        padding: "12px 22px",
        position: "fixed",
        top: 76,
        transform: "translateX(-50%)",
        zIndex: 2000,
      }}
    >
      Saved
    </div>
  );
}

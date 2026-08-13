"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/** Shows a brief "Saved" confirmation when the URL has ?saved=1, then
 *  clears itself and strips the param so it doesn't reappear on refresh. */
export default function SavedToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("saved") !== "1") return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("saved");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
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

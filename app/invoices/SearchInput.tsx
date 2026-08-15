"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** type="search" gives the browser a native "x" clear icon inside the
 *  input, but that icon just empties the DOM value -- it doesn't submit
 *  the surrounding form, so clearing it silently left the filtered list
 *  showing stale results with no way to get back to the full list short
 *  of a separate "Clear" link. Making this a controlled input lets us
 *  catch the value going empty (covers both the native "x" and manually
 *  backspacing it out) and navigate straight to the query-less URL. */
export default function SearchInput({
  agentFilter,
  defaultValue,
}: {
  agentFilter: string;
  defaultValue: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setValue(next);
    if (next === "") {
      router.push(agentFilter ? `/invoices?agent=${agentFilter}` : "/invoices");
    }
  }

  return (
    <input
      name="q"
      onChange={handleChange}
      placeholder="Search invoices…"
      style={{
        border: "1px solid var(--border)",
        borderRadius: 999,
        flex: "1 1 320px",
        fontFamily: "inherit",
        minWidth: 0,
        padding: "10px 16px",
      }}
      type="search"
      value={value}
    />
  );
}

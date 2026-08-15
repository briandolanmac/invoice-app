"use client";

import { useRouter } from "next/navigation";

type AgentOption = { id: string; name: string };

/** Selecting an agent filters the list immediately -- navigates with
 *  the ?agent= param set (preserving any active ?q= search) rather than
 *  needing a separate submit, matching "when I click on that, it will
 *  only list those." Reads currentQuery as a prop instead of
 *  useSearchParams() to avoid that hook's Suspense requirement. */
export default function AgentFilterSelect({
  agents,
  currentQuery,
  value,
}: {
  agents: AgentOption[];
  currentQuery: string;
  value: string;
}) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams();
    if (currentQuery) params.set("q", currentQuery);
    if (e.target.value) params.set("agent", e.target.value);
    const qs = params.toString();
    router.push(qs ? `/invoices?${qs}` : "/invoices");
  }

  return (
    <select
      defaultValue={value}
      onChange={handleChange}
      style={{
        border: "1px solid var(--border)",
        borderRadius: 999,
        fontFamily: "inherit",
        padding: "10px 16px",
      }}
    >
      <option value="">All agents</option>
      {agents.map((agent) => (
        <option key={agent.id} value={agent.id}>{agent.name}</option>
      ))}
    </select>
  );
}

"use client";

import { useState } from "react";
import RevenueBarChart from "./RevenueBarChart";

type AgentAmount = { agentId: string; amount: number };
type MonthlyRevenue = { amount: number; byAgent: AgentAmount[]; month: string };
type YearlyRevenue = [string, number][];
type RevenueView = { monthlyRevenue: MonthlyRevenue[]; yearlyRevenue: YearlyRevenue };
type Agent = { agentId: string; name: string; total: number };

type Mode = "paid" | "work";

const MODE_LABEL: Record<Mode, string> = { paid: "Paid date", work: "Work date" };
const DESCRIPTION = "Based on invoices marked Paid.";

function formatMoney(amount: number) {
  return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function RevenueByMonthSection({
  agents,
  totalRevenue,
  paidDate,
  workDate,
}: {
  agents: Agent[];
  totalRevenue: number;
  paidDate: RevenueView;
  workDate: RevenueView;
}) {
  const [mode, setMode] = useState<Mode>("paid");
  const view = mode === "paid" ? paidDate : workDate;

  return (
    <section className="card" style={{ display: "grid", gap: 20, marginBottom: 20, padding: 24 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Revenue by month</h2>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            {DESCRIPTION}
          </p>
        </div>

        <div className="segmented-toggle">
          {(Object.keys(MODE_LABEL) as Mode[]).map((option) => (
            <button
              aria-pressed={mode === option}
              key={option}
              onClick={() => setMode(option)}
              type="button"
            >
              {MODE_LABEL[option]}
            </button>
          ))}
        </div>
      </div>

      <div className="revenue-stats">
        <div className="revenue-stat-total">
          <p className="muted" style={{ margin: 0 }}>Total revenue</p>
          <strong className="revenue-stat-value">{formatMoney(totalRevenue)}</strong>
        </div>
        <div className="revenue-stat-years">
          {view.yearlyRevenue.map(([year, amount]) => (
            <div className="revenue-stat-year" key={year}>
              <p className="muted" style={{ margin: 0 }}>{year} revenue</p>
              <strong className="revenue-stat-value">{formatMoney(amount)}</strong>
            </div>
          ))}
        </div>
      </div>

      <RevenueBarChart agents={agents} data={view.monthlyRevenue} />
    </section>
  );
}

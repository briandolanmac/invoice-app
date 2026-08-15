"use client";

import { useState } from "react";

type AgentRevenue = {
  agentId: string;
  name: string;
  byYear: Record<string, number>;
  total: number;
};

/** Fixed categorical hue order (never cycled/reassigned by rank) --
 *  reused from the app's dataviz palette reference. A pie's wedges are
 *  all mutually adjacent, so direct series are capped at 5 and anything
 *  past that folds into a neutral "Other" slice rather than reusing or
 *  inventing colors. */
const SLICE_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"];
const OTHER_COLOR = "#94a3b8";
const MAX_DIRECT_SLICES = 5;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function wedgePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
}

function formatMoney(amount: number) {
  return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function RevenuePieChart({
  agents,
  years,
}: {
  agents: AgentRevenue[];
  years: string[];
}) {
  const [filter, setFilter] = useState<"total" | string>("total");

  const slices = agents
    .map((agent) => ({
      name: agent.name,
      value: filter === "total" ? agent.total : agent.byYear[filter] || 0,
    }))
    .filter((slice) => slice.value > 0)
    .sort((a, b) => b.value - a.value);

  const direct = slices.slice(0, MAX_DIRECT_SLICES);
  const rest = slices.slice(MAX_DIRECT_SLICES);
  const otherTotal = rest.reduce((sum, slice) => sum + slice.value, 0);

  const wedges = direct.map((slice, i) => ({ ...slice, color: SLICE_COLORS[i] }));
  if (otherTotal > 0) {
    wedges.push({ name: "Other", value: otherTotal, color: OTHER_COLOR });
  }

  const grandTotal = wedges.reduce((sum, w) => sum + w.value, 0);

  const size = 220;
  const radius = size / 2;
  const center = size / 2;

  let cursor = 0;
  const arcs = wedges.map((wedge) => {
    const fraction = grandTotal > 0 ? wedge.value / grandTotal : 0;
    const startAngle = cursor * 360;
    const endAngle = (cursor + fraction) * 360;
    cursor += fraction;
    return { ...wedge, endAngle, fraction, startAngle };
  });

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          className="button secondary"
          onClick={() => setFilter("total")}
          style={{
            background: filter === "total" ? "#f6c9e0" : undefined,
            padding: "8px 16px",
          }}
          type="button"
        >
          Total
        </button>
        {years.map((year) => (
          <button
            className="button secondary"
            key={year}
            onClick={() => setFilter(year)}
            style={{
              background: filter === year ? "#f6c9e0" : undefined,
              padding: "8px 16px",
            }}
            type="button"
          >
            {year}
          </button>
        ))}
      </div>

      {!grandTotal ? (
        <p className="muted" style={{ margin: 0 }}>No revenue for this period yet.</p>
      ) : (
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 28 }}>
          <svg height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
            {arcs.length === 1 ? (
              <circle cx={center} cy={center} fill={arcs[0].color} r={radius} />
            ) : (
              arcs.map((arc) => (
                <path
                  d={wedgePath(center, center, radius, arc.startAngle, arc.endAngle)}
                  fill={arc.color}
                  key={arc.name}
                  stroke="var(--card)"
                  strokeWidth={2}
                />
              ))
            )}
          </svg>

          <div style={{ display: "grid", gap: 8 }}>
            {arcs.map((arc) => (
              <div key={arc.name} style={{ alignItems: "center", display: "flex", gap: 10 }}>
                <span
                  style={{
                    background: arc.color,
                    borderRadius: 3,
                    flexShrink: 0,
                    height: 12,
                    width: 12,
                  }}
                />
                <span style={{ fontSize: 14 }}>
                  {arc.name} — {formatMoney(arc.value)} ({Math.round(arc.fraction * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

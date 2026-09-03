"use client";

import { useEffect, useRef } from "react";
import { buildAgentColorMap, MAX_DIRECT_SLICES, OTHER_COLOR } from "./agentColors";

type AgentAmount = { agentId: string; amount: number };
type MonthlyRevenue = { amount: number; byAgent: AgentAmount[]; month: string };
type Agent = { agentId: string; name: string; total: number };
type Segment = { agentId: string; amount: number; color: string; name: string };

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const OTHER_KEY = "__other__";

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  return `${MONTH_LABELS[Number(month) - 1]} ${year.slice(2)}`;
}

/** Picks a round step (never an arbitrary fraction of the max) so the
 *  y-axis lands on clean numbers, capped at ~5 gridlines. */
function niceStep(max: number) {
  const steps = [50, 100, 250, 500, 1000, 2000, 2500, 5000, 10000, 25000, 50000, 100000];
  for (const step of steps) {
    if (max / step <= 5) return step;
  }
  return Math.ceil(max / 5 / 100000) * 100000;
}

function rectPath(x: number, y: number, width: number, height: number) {
  if (height <= 0) return "";
  return `M${x},${y} h${width} v${height} h${-width} Z`;
}

function roundedTopRectPath(x: number, y: number, width: number, height: number, radius: number) {
  if (height <= 0) return "";
  const r = Math.min(radius, height, width / 2);
  return `M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`;
}

const BAND_WIDTH = 76;
const BAR_WIDTH = 24;
const PLOT_HEIGHT = 210;
const TOP_PADDING = 34;
const BOTTOM_PADDING = 40;
const LEFT_PADDING = 52;

export default function RevenueBarChart({ agents, data }: { agents: Agent[]; data: MonthlyRevenue[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Bars are laid out oldest-to-newest so the axis reads left-to-right
  // normally, but that means the most recent month is scrolled off the
  // right edge whenever the chart is wider than its container. Open
  // scrolled all the way to the newest bar instead -- older months are
  // still just a scroll away to the left.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [data]);

  if (!data.length) {
    return (
      <p className="muted" style={{ margin: 0 }}>
        No paid invoices yet — once some are marked paid, monthly revenue will show up here.
      </p>
    );
  }

  // Same rank-based colors/cap as the pie chart, so an agent's color is
  // consistent across both charts, and any agent past the top 5 folds into
  // one neutral "Other" stack segment instead of an ever-growing legend.
  const colorByAgentId = buildAgentColorMap(agents);
  const directAgents = agents.slice(0, MAX_DIRECT_SLICES);
  const directAgentIds = new Set(directAgents.map((a) => a.agentId));

  const series: { agentId: string; color: string; name: string }[] = directAgents.map((agent) => ({
    agentId: agent.agentId,
    color: colorByAgentId.get(agent.agentId)!,
    name: agent.name,
  }));
  const hasOtherAgents = agents.length > MAX_DIRECT_SLICES;
  if (hasOtherAgents) {
    series.push({ agentId: OTHER_KEY, color: OTHER_COLOR, name: "Other" });
  }

  const stackedData = data.map((d) => {
    const segments: Segment[] = series
      .map((s) => {
        const amount =
          s.agentId === OTHER_KEY
            ? d.byAgent.filter((a) => !directAgentIds.has(a.agentId)).reduce((sum, a) => sum + a.amount, 0)
            : d.byAgent.find((a) => a.agentId === s.agentId)?.amount || 0;
        return { agentId: s.agentId, amount, color: s.color, name: s.name };
      })
      .filter((s) => s.amount > 0);
    return { ...d, segments };
  });

  // Only show agents in the legend that actually appear in this view (e.g.
  // an agent with zero revenue in the selected date mode's visible months).
  const visibleAgentIds = new Set(stackedData.flatMap((d) => d.segments.map((s) => s.agentId)));
  const legend = series.filter((s) => visibleAgentIds.has(s.agentId));

  const maxAmount = Math.max(...data.map((d) => d.amount));
  const step = niceStep(Math.max(maxAmount, 1));
  const yMax = Math.max(step, Math.ceil(Math.max(maxAmount, 1) / step) * step);

  const ticks: number[] = [];
  for (let t = 0; t <= yMax; t += step) ticks.push(t);

  const chartWidth = LEFT_PADDING + data.length * BAND_WIDTH;
  const totalHeight = TOP_PADDING + PLOT_HEIGHT + BOTTOM_PADDING;
  const baselineY = TOP_PADDING + PLOT_HEIGHT;

  function heightFor(amount: number) {
    return (amount / yMax) * PLOT_HEIGHT;
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div ref={scrollRef} style={{ overflowX: "auto" }}>
        <svg
          aria-label="Revenue by month, by agent"
          height={totalHeight}
          role="img"
          style={{ display: "block" }}
          viewBox={`0 0 ${chartWidth} ${totalHeight}`}
          width={chartWidth}
        >
          {ticks.map((tick) => {
            const y = baselineY - heightFor(tick);
            return (
              <g key={tick}>
                <line stroke="var(--border)" strokeWidth={1} x1={LEFT_PADDING} x2={chartWidth} y1={y} y2={y} />
                <text fill="var(--muted)" fontSize={11} textAnchor="end" x={LEFT_PADDING - 10} y={y + 4}>
                  ${tick.toLocaleString()}
                </text>
              </g>
            );
          })}

          {stackedData.map((d, i) => {
            const bandX = LEFT_PADDING + i * BAND_WIDTH;
            const barX = bandX + (BAND_WIDTH - BAR_WIDTH) / 2;

            let cumulative = 0;
            const segmentBars = d.segments.map((segment, i) => {
              const segHeight = heightFor(segment.amount);
              const segY = baselineY - cumulative - segHeight;
              const isTop = i === d.segments.length - 1;
              cumulative += segHeight;
              const path = isTop
                ? roundedTopRectPath(barX, segY, BAR_WIDTH, segHeight, 4)
                : rectPath(barX, segY, BAR_WIDTH, segHeight);
              return <path d={path} fill={segment.color} key={segment.agentId} />;
            });

            const barTopY = baselineY - heightFor(d.amount);

            return (
              <g key={d.month}>
                {segmentBars}
                <text
                  fill="var(--ink)"
                  fontSize={11}
                  fontWeight={700}
                  textAnchor="middle"
                  x={barX + BAR_WIDTH / 2}
                  y={barTopY - 8}
                >
                  ${Math.round(d.amount).toLocaleString()}
                </text>
                <text
                  fill="var(--muted)"
                  fontSize={11}
                  textAnchor="middle"
                  x={barX + BAR_WIDTH / 2}
                  y={baselineY + 20}
                >
                  {formatMonthLabel(d.month)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {legend.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          {legend.map((s) => (
            <div key={s.agentId} style={{ alignItems: "center", display: "flex", gap: 6 }}>
              <span
                style={{ background: s.color, borderRadius: 3, flexShrink: 0, height: 10, width: 10 }}
              />
              <span style={{ fontSize: 13 }}>{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

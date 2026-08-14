type MonthlyRevenue = { month: string; amount: number };

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

function roundedTopBarPath(x: number, y: number, width: number, height: number, radius: number) {
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

export default function RevenueBarChart({ data }: { data: MonthlyRevenue[] }) {
  if (!data.length) {
    return (
      <p className="muted" style={{ margin: 0 }}>
        No paid invoices yet — once some are marked paid, monthly revenue will show up here.
      </p>
    );
  }

  const maxAmount = Math.max(...data.map((d) => d.amount));
  const step = niceStep(Math.max(maxAmount, 1));
  const yMax = Math.max(step, Math.ceil(Math.max(maxAmount, 1) / step) * step);

  const ticks: number[] = [];
  for (let t = 0; t <= yMax; t += step) ticks.push(t);

  const chartWidth = LEFT_PADDING + data.length * BAND_WIDTH;
  const totalHeight = TOP_PADDING + PLOT_HEIGHT + BOTTOM_PADDING;
  const baselineY = TOP_PADDING + PLOT_HEIGHT;

  function yFor(amount: number) {
    return baselineY - (amount / yMax) * PLOT_HEIGHT;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <svg
        aria-label="Revenue by month"
        height={totalHeight}
        role="img"
        style={{ display: "block" }}
        viewBox={`0 0 ${chartWidth} ${totalHeight}`}
        width={chartWidth}
      >
        {ticks.map((tick) => {
          const y = yFor(tick);
          return (
            <g key={tick}>
              <line stroke="var(--border)" strokeWidth={1} x1={LEFT_PADDING} x2={chartWidth} y1={y} y2={y} />
              <text fill="var(--muted)" fontSize={11} textAnchor="end" x={LEFT_PADDING - 10} y={y + 4}>
                ${tick.toLocaleString()}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const barHeight = (d.amount / yMax) * PLOT_HEIGHT;
          const bandX = LEFT_PADDING + i * BAND_WIDTH;
          const barX = bandX + (BAND_WIDTH - BAR_WIDTH) / 2;
          const barY = baselineY - barHeight;
          return (
            <g key={d.month}>
              <path d={roundedTopBarPath(barX, barY, BAR_WIDTH, barHeight, 4)} fill="var(--accent)" />
              <text
                fill="var(--ink)"
                fontSize={11}
                fontWeight={700}
                textAnchor="middle"
                x={barX + BAR_WIDTH / 2}
                y={barY - 8}
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
  );
}

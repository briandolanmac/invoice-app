/** Fixed hue order (never cycled/reassigned by rank), led by the app's own
 *  pink brand accent rather than a generic blue/orange categorical set, per
 *  Brian's ask to keep charts in the site's style. Direct series are capped
 *  at 5 and anything past that folds into a neutral "Other" bucket rather
 *  than reusing or inventing colors. Shared between the pie and bar charts
 *  so an agent's color always matches across both. */
export const SLICE_COLORS = ["#ec4899", "#f59e0b", "#14b8a6", "#8b5cf6", "#78716c"];
export const OTHER_COLOR = "#c9b3c0";
export const MAX_DIRECT_SLICES = 5;

/** Colors are assigned by an agent's rank in its OVERALL total (pass agents
 *  already sorted by total desc) and stay fixed regardless of which filter
 *  or date mode is active -- otherwise an agent could land on a different
 *  color just because its rank happened to differ for that slice of data. */
export function buildAgentColorMap(agentsSortedByTotalDesc: { agentId: string }[]) {
  const colorByAgentId = new Map<string, string>();
  agentsSortedByTotalDesc.forEach((agent, i) => {
    colorByAgentId.set(agent.agentId, i < MAX_DIRECT_SLICES ? SLICE_COLORS[i] : OTHER_COLOR);
  });
  return colorByAgentId;
}

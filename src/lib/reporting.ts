import { DESIGN_VERSION, type Session } from "./simulation";
export interface ReportFilters {
  participant: string;
  scenario: string;
  pool: string;
  task: string;
  seed: string;
  destination: string;
  legacy: boolean;
}
export const DEFAULT_FILTERS: ReportFilters = {
  participant: "",
  scenario: "",
  pool: "",
  task: "",
  seed: "",
  destination: "",
  legacy: false,
};
export function filterSessions(sessions: Session[], filters: ReportFilters) {
  return sessions.filter(
    (s) =>
      (filters.legacy || s.designVersion === DESIGN_VERSION) &&
      (!filters.participant || s.participant === filters.participant) &&
      (!filters.scenario || s.scenario === filters.scenario) &&
      (!filters.pool || s.pool === filters.pool) &&
      (!filters.task || s.task === filters.task) &&
      (!filters.seed || String(s.seed) === filters.seed) &&
      (!filters.destination || s.intendedDestination === filters.destination),
  );
}
export function comparisonWarnings(sessions: Session[]) {
  const completed = sessions.filter((s) => s.status === "completed");
  const warnings: string[] = [];
  if (new Set(completed.map((s) => s.pool)).size > 1)
    warnings.push(
      "Provider pools differ. Use the matched pool filter to compare the interfaces with the same ride options.",
    );
  if (new Set(completed.map((s) => s.designVersion || "original")).size > 1)
    warnings.push(
      "These results include different design versions. Keep versions separate when comparing interfaces.",
    );
  if (new Set(completed.map((s) => s.task)).size > 1)
    warnings.push(
      "More than one task is included. Filter by task for a focused comparison.",
    );
  return warnings;
}

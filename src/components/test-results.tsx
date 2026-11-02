"use client";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Download,
  ClipboardList,
  ChevronRight,
  X,
} from "lucide-react";
import {
  DEFAULT_FILTERS,
  comparisonWarnings,
  filterSessions,
} from "@/lib/reporting";
import {
  DESIGN_VERSION,
  TASK_LABELS,
  durationLabel,
  money,
  rideLabel,
  sessionsCsv,
  summarize,
  type Session,
} from "@/lib/simulation";
import { Dialog } from "./dialog";
const modeLabel = (mode: string) =>
  mode === "baseline" ? "Uber + Lyft" : "Aggregator";
const yesNo = (value: boolean | null | undefined) =>
  value == null ? "Not eligible" : value ? "Yes" : "No";
function download(sessions: Session[], format: "csv" | "json") {
  const body =
    format === "csv"
      ? sessionsCsv(sessions)
      : JSON.stringify(
          { schemaVersion: 2, exportedAt: new Date().toISOString(), sessions },
          null,
          2,
        );
  const url = URL.createObjectURL(
    new Blob([body], {
      type: format === "csv" ? "text/csv;charset=utf-8" : "application/json",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `rideshare-results-${Date.now()}.${format}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function TestResults({
  sessions,
  onBack,
}: {
  sessions: Session[];
  onBack: () => void;
}) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [detail, setDetail] = useState<Session | null>(null);
  const visible = useMemo(
    () => filterSessions(sessions, filters),
    [sessions, filters],
  );
  const baseline = summarize(visible, "baseline"),
    aggregate = summarize(visible, "aggregate");
  const completed = visible.filter((s) => s.status === "completed");
  const warnings = comparisonWarnings(visible);
  const options = (key: "participant" | "seed" | "intendedDestination") =>
    [
      ...new Set(sessions.map((s) => String(s[key] || "")).filter(Boolean)),
    ].sort();
  const metrics = [
    {
      title: "Clicks to book",
      key: "clicks" as const,
      unit: "clicks",
      description: "Average taps and clicks per completed booking.",
      format: (n: number) => n.toFixed(1),
    },
    {
      title: "Time to book",
      key: "seconds" as const,
      unit: "min:sec",
      description: "First app action to final confirmation, including waiting.",
      format: durationLabel,
    },
    {
      title: "Cheapest ride booked",
      key: "cheapestRate" as const,
      unit: "of completed",
      description: "Lowest fare in the full available pool; ties count.",
      format: (n: number) => `${Math.round(n)}%`,
    },
    {
      title: "Affordable EV / hybrid",
      key: "greenRate" as const,
      unit: "of eligible",
      description: "EV or hybrid booked at or below the cheapest gas fare.",
      format: (n: number) => `${Math.round(n)}%`,
    },
  ];
  return (
    <main className="results-page">
      <div className="page-heading">
        <div>
          <button className="text-button" onClick={onBack}>
            <ArrowLeft size={16} />
            Back to test
          </button>
          <h1>Test results</h1>
          <p>Compare mobile booking tasks across both experiences.</p>
        </div>
        <div className="export-actions">
          <button
            className="secondary"
            disabled={!visible.length}
            onClick={() => download(visible, "csv")}
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            className="secondary"
            disabled={!visible.length}
            onClick={() => download(visible, "json")}
          >
            JSON + events
          </button>
        </div>
      </div>
      <section className="results-filters" aria-label="Filter results">
        <label>
          Participant
          <select
            value={filters.participant}
            onChange={(e) =>
              setFilters({ ...filters, participant: e.target.value })
            }
          >
            <option value="">All participants</option>
            {options("participant").map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Task
          <select
            value={filters.task}
            onChange={(e) => setFilters({ ...filters, task: e.target.value })}
          >
            <option value="">All tasks</option>
            {Object.entries(TASK_LABELS).map(([key, value]) => (
              <option value={key} key={key}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Provider pool
          <select
            value={filters.pool}
            onChange={(e) => setFilters({ ...filters, pool: e.target.value })}
          >
            <option value="">All pools</option>
            <option value="matched">Uber + Lyft only</option>
            <option value="all">All four providers</option>
          </select>
        </label>
        <label>
          Scenario
          <select
            value={filters.scenario}
            onChange={(e) =>
              setFilters({ ...filters, scenario: e.target.value })
            }
          >
            <option value="">All scenarios</option>
            <option value="balanced">Typical fares</option>
            <option value="rush">Rush hour</option>
            <option value="green">Affordable EV / hybrid</option>
          </select>
        </label>
        <label>
          Seed
          <select
            value={filters.seed}
            onChange={(e) => setFilters({ ...filters, seed: e.target.value })}
          >
            <option value="">All seeds</option>
            {options("seed").map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Task destination
          <select
            value={filters.destination}
            onChange={(e) =>
              setFilters({ ...filters, destination: e.target.value })
            }
          >
            <option value="">All destinations</option>
            {options("intendedDestination").map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <div className="filter-footer">
          <label className="check-label">
            <input
              type="checkbox"
              checked={filters.legacy}
              onChange={(e) =>
                setFilters({ ...filters, legacy: e.target.checked })
              }
            />
            Include previous design
          </label>
          <button
            className="text-button"
            onClick={() => setFilters(DEFAULT_FILTERS)}
          >
            <X size={14} />
            Reset filters
          </button>
        </div>
      </section>
      <div className="results-counts">
        <strong>{visible.length} attempts</strong>
        <span>{completed.length} completed</span>
        <span>{visible.length - completed.length} abandoned</span>
        <span>Stored in this browser</span>
      </div>
      {warnings.map((w) => (
        <p className="notice" key={w}>
          {w}
        </p>
      ))}
      <section className="metric-grid" aria-label="Comparison metrics">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.key}>
            <h2>{metric.title}</h2>
            <div className="metric-comparison">
              {[
                { label: "Uber + Lyft", summary: baseline },
                { label: "Aggregator", summary: aggregate },
              ].map(({ label, summary }) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>
                    {summary[metric.key] === null
                      ? "—"
                      : metric.format(summary[metric.key]!)}
                  </strong>
                  <small>
                    {metric.unit} · n=
                    {metric.key === "greenRate"
                      ? summary.eligibleCount
                      : summary.count}
                  </small>
                </div>
              ))}
            </div>
            <p>{metric.description}</p>
          </article>
        ))}
      </section>
      <section className="sessions-panel">
        <div className="panel-heading">
          <h2>Session history</h2>
          <span>{visible.length} shown</span>
        </div>
        {!visible.length ? (
          <div className="results-empty">
            <ClipboardList size={32} />
            <h3>No matching sessions</h3>
            <p>Complete a task in either experience, or adjust your filters.</p>
            <button className="primary" onClick={onBack}>
              Run a test
            </button>
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <caption className="sr-only">
                Recorded sessions. Open an attempt to inspect the route, fare
                snapshot and events.
              </caption>
              <thead>
                <tr>
                  <th>Participant / time</th>
                  <th>Experience</th>
                  <th>Status</th>
                  <th>Clicks</th>
                  <th>Time</th>
                  <th>Cheapest</th>
                  <th>Affordable green</th>
                  <th>Task met</th>
                  <th>
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...visible].reverse().map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.participant || "Unnamed"}</strong>
                      <small>
                        {new Date(s.startedAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </small>
                    </td>
                    <td>
                      {modeLabel(s.mode)}
                      <small>
                        {s.pool === "matched" ? "2 providers" : "4 providers"} ·
                        seed {s.seed}
                      </small>
                    </td>
                    <td>
                      <span className={`status-tag ${s.status}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="numeric">{s.clicks}</td>
                    <td className="numeric">
                      {durationLabel(s.elapsedSeconds)}
                    </td>
                    <td>
                      {s.status === "completed" ? yesNo(s.bookedCheapest) : "—"}
                    </td>
                    <td>
                      {s.status === "completed" ? yesNo(s.choseGreen) : "—"}
                    </td>
                    <td>
                      {s.status === "completed" && s.taskSuccess != null
                        ? yesNo(s.taskSuccess)
                        : "—"}
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={`View session ${s.participant} ${s.id.slice(0, 8)}`}
                        onClick={() => setDetail(s)}
                      >
                        <ChevronRight size={19} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mobile-session-list">
          {[...visible].reverse().map((s) => (
            <button
              className="session-row"
              key={s.id}
              aria-label={`View session ${s.participant} ${s.id.slice(0, 8)}`}
              onClick={() => setDetail(s)}
            >
              <span className="session-row-heading">
                <strong>
                  {s.participant || "Unnamed"} · {modeLabel(s.mode)}
                </strong>
                <ChevronRight size={18} />
              </span>
              <span className="session-row-meta">
                <span className={`status-tag ${s.status}`}>{s.status}</span>
                <span>
                  {s.pool === "matched" ? "2" : "4"} providers · seed {s.seed}
                </span>
              </span>
              <span className="session-row-numbers">
                <span>
                  <b>{s.clicks}</b> clicks
                </span>
                <span>
                  <b>{durationLabel(s.elapsedSeconds)}</b> time
                </span>
                <span>
                  Task met:{" "}
                  <b>{s.taskSuccess == null ? "—" : yesNo(s.taskSuccess)}</b>
                </span>
              </span>
              <span className="session-row-outcomes">
                Cheapest:{" "}
                {s.status === "completed" ? yesNo(s.bookedCheapest) : "—"} ·
                Affordable green:{" "}
                {s.status === "completed" ? yesNo(s.choseGreen) : "—"}
              </span>
            </button>
          ))}
        </div>
      </section>
      <div className="results-notes">
        <h2>How to read these numbers</h2>
        <p>
          Booking metrics use completed attempts only. Abandoned attempts remain
          in the table and exports. The green metric includes only attempts
          where an EV or hybrid was offered at or below the cheapest gas fare;
          “—” means there is no eligible sample.
        </p>
        <p>
          Use the same seed, scenario, destination, task and provider pool for
          an interface comparison. Alternate which experience participants use
          first. The original 12-click baseline is a research hypothesis; this
          prototype records actual interactions.
        </p>
        <p>
          Results describe this simulation. Provider layouts are approximations,
          and fares, availability and tailpipe emissions are synthetic. Current
          design: {DESIGN_VERSION}.
        </p>
      </div>
      {detail && (
        <Dialog
          title="Session details"
          onClose={() => setDetail(null)}
          className="session-dialog"
        >
          <h2>Session details</h2>
          <p>
            {detail.participant} · {modeLabel(detail.mode)} · {detail.status}
          </p>
          <dl className="detail-grid">
            <div>
              <dt>Clicks</dt>
              <dd>{detail.clicks}</dd>
            </div>
            <div>
              <dt>Elapsed</dt>
              <dd>{durationLabel(detail.elapsedSeconds)}</dd>
            </div>
            <div>
              <dt>Booked ride</dt>
              <dd>
                {detail.selected
                  ? `${rideLabel(detail.selected)} · ${money(detail.selected.price)}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Task met</dt>
              <dd>
                {detail.taskSuccess == null ? "—" : yesNo(detail.taskSuccess)}
              </dd>
            </div>
            <div>
              <dt>Route</dt>
              <dd>
                {detail.pickup || "Not set"} → {detail.destination || "Not set"}
              </dd>
            </div>
            <div>
              <dt>Intended destination</dt>
              <dd>{detail.intendedDestination || "Not recorded"}</dd>
            </div>
            <div>
              <dt>Task</dt>
              <dd>{detail.task ? TASK_LABELS[detail.task] : "Not recorded"}</dd>
            </div>
            <div>
              <dt>Design / viewport</dt>
              <dd>
                {detail.designVersion || "original"}
                <br />
                {detail.viewport
                  ? `${detail.viewport.width} × ${detail.viewport.height}`
                  : "Not recorded"}
              </dd>
            </div>
          </dl>
          <h3>Fare snapshot</h3>
          <div className="snapshot-list">
            {detail.offers.map((o) => (
              <div key={o.id}>
                <strong>{rideLabel(o)}</strong>
                <span>
                  {money(o.price)} · {o.pickup} min · {o.powertrain}
                </span>
              </div>
            ))}
          </div>
          <h3>Event log</h3>
          <ol className="event-list full-log">
            {detail.events.map((e) => (
              <li key={e.n}>
                <span className="event-time">
                  {(e.atMs / 1000).toFixed(2)}s
                </span>
                <div>
                  <strong>{e.action.replaceAll("_", " ")}</strong>
                  <small>
                    {e.kind}
                    {e.provider ? ` · ${e.provider}` : ""}
                    {e.detail ? ` · ${e.detail}` : ""}
                  </small>
                </div>
              </li>
            ))}
          </ol>
        </Dialog>
      )}
    </main>
  );
}

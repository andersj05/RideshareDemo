"use client";

import { useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronDown,
  FlaskConical,
  MousePointer2,
  RefreshCw,
  Timer,
  Trash2,
} from "lucide-react";
import { Dialog } from "./dialog";
import {
  durationLabel,
  money,
  sessionsCsv,
  summarize,
  type Mode,
  type Session,
  type Settings,
  type StudyEvent,
} from "@/lib/simulation";

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ResearchLab({
  settings,
  sessions,
  events,
  elapsed,
  running,
  storageWarning,
  onApply,
  onClose,
  onClear,
  initialTab = "overview",
}: {
  settings: Settings;
  sessions: Session[];
  events: StudyEvent[];
  elapsed: number;
  running: boolean;
  storageWarning: boolean;
  onApply: (settings: Settings, mode: Mode) => void;
  onClose: () => void;
  onClear: () => void;
  initialTab?: "overview" | "sessions";
}) {
  const [draft, setDraft] = useState(settings);
  const [mode, setMode] = useState<Mode>("aggregate");
  const [tab, setTab] = useState<"overview" | "sessions" | "protocol">(
    initialTab,
  );
  const [inspect, setInspect] = useState<Session | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const summaries = {
    aggregate: summarize(sessions, "aggregate"),
    baseline: summarize(sessions, "baseline"),
  };
  const completed = sessions.filter((s) => s.status === "completed").length;
  const valid =
    draft.participant.trim().length > 0 &&
    Number.isSafeInteger(draft.seed) &&
    draft.seed >= 0 &&
    draft.seed <= 2147483647;
  return (
    <Dialog title="Research lab" onClose={onClose} className="research-dialog">
      <div className="lab-heading">
        <span className="eyebrow">
          <FlaskConical size={14} /> THE RESEARCH LAB
        </span>
        <h2>Less friction. Measured.</h2>
        <p>Observe the journey, then compare the experiences.</p>
      </div>
      <div className="lab-tabs" role="tablist" aria-label="Research views">
        {(["overview", "sessions", "protocol"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
          >
            {t === "overview"
              ? "Study setup"
              : t === "sessions"
                ? `Results (${completed})`
                : "Measurement guide"}
          </button>
        ))}
      </div>
      {storageWarning && (
        <p className="storage-warning">
          Browser storage is unavailable or contains unreadable data. Export
          your results before closing this page.
        </p>
      )}
      {tab === "overview" && (
        <div className="lab-overview">
          <section className="lab-config">
            <h3>Set up a test</h3>
            <p className="muted">
              Settings apply to the next session. Existing results are kept.
            </p>
            <div className="form-grid">
              <label>
                Participant ID
                <input
                  value={draft.participant}
                  maxLength={40}
                  onChange={(e) =>
                    setDraft({ ...draft, participant: e.target.value })
                  }
                  placeholder="P001"
                />
              </label>
              <label>
                Scenario seed
                <div className="seed-input">
                  <input
                    type="number"
                    min="0"
                    max="2147483647"
                    value={Number.isNaN(draft.seed) ? "" : draft.seed}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        seed:
                          e.target.value === "" ? NaN : Number(e.target.value),
                      })
                    }
                  />
                  <button
                    aria-label="Generate random seed"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        seed:
                          crypto.getRandomValues(new Uint32Array(1))[0] %
                          2147483647,
                      })
                    }
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </label>
            </div>
            <label className="full-label">
              Fare scenario
              <select
                value={draft.scenario}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    scenario: e.target.value as Settings["scenario"],
                  })
                }
              >
                <option value="balanced">Everyday city trip</option>
                <option value="rush">Rush hour · higher prices & waits</option>
                <option value="green">
                  Green opportunity · EV/hybrid at equal or lower cost
                </option>
              </select>
            </label>
            <label className="full-label">
              Aggregate provider pool
              <select
                value={draft.pool}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    pool: e.target.value as Settings["pool"],
                  })
                }
              >
                <option value="all">
                  Full experience · Uber, Lyft, Waymo, Curb
                </option>
                <option value="matched">
                  Controlled comparison · Uber + Lyft only
                </option>
              </select>
            </label>
            <div className="test-mode-options">
              <button
                className={mode === "aggregate" ? "selected" : ""}
                onClick={() => setMode("aggregate")}
              >
                <span>01</span>
                <strong>All together</strong>
                <small>The aggregate experience</small>
                {mode === "aggregate" && <Check size={16} />}
              </button>
              <button
                className={mode === "baseline" ? "selected" : ""}
                onClick={() => setMode("baseline")}
              >
                <span>02</span>
                <strong>App by app</strong>
                <small>The Uber + Lyft baseline</small>
                {mode === "baseline" && <Check size={16} />}
              </button>
            </div>
            <button
              className="primary-button"
              disabled={!valid}
              onClick={() =>
                onApply(
                  { ...draft, participant: draft.participant.trim() },
                  mode,
                )
              }
            >
              Start a fresh test <ArrowRight size={18} />
            </button>
            {running && (
              <p className="field-note">
                Starting a fresh test saves the current attempt as abandoned.
              </p>
            )}
          </section>
          <section className="lab-live">
            <div className="section-heading">
              <h3>Current session</h3>
              <span className={`status-pill ${running ? "recording" : ""}`}>
                <span />
                {running ? "Recording" : "Ready"}
              </span>
            </div>
            <div className="live-numbers">
              <div>
                <MousePointer2 size={18} />
                <strong>
                  {events.filter((e) => e.kind === "click").length}
                </strong>
                <small>clicks</small>
              </div>
              <div>
                <Timer size={18} />
                <strong>{durationLabel(elapsed)}</strong>
                <small>elapsed</small>
              </div>
            </div>
            <div className="live-log">
              {events.length ? (
                [...events]
                  .reverse()
                  .slice(0, 12)
                  .map((e) => (
                    <div key={e.n}>
                      <span>{durationLabel(e.atMs / 1000)}</span>
                      <p>{e.action.replaceAll("_", " ")}</p>
                      <small>{e.kind}</small>
                    </div>
                  ))
              ) : (
                <div className="log-empty">
                  <Activity size={25} />
                  <p>Your first interaction starts the clock.</p>
                  <small>
                    Research controls are excluded from click counts.
                  </small>
                </div>
              )}
            </div>
            <p className="field-note">
              Timing continues while this panel is open. Keep it closed during
              participant tasks.
            </p>
          </section>
        </div>
      )}
      {tab === "sessions" && (
        <div className="lab-results">
          <div className="results-heading">
            <div>
              <h3>Observed results</h3>
              <p className="muted">
                Completed sessions only ·{" "}
                {sessions.filter((s) => s.status === "abandoned").length}{" "}
                abandoned attempts
              </p>
            </div>
            <div className="export-actions">
              <button
                disabled={!sessions.length}
                onClick={() =>
                  download(
                    "fare-sessions.csv",
                    sessionsCsv(sessions),
                    "text/csv;charset=utf-8",
                  )
                }
              >
                <ArrowDownToLine size={15} />
                CSV
              </button>
              <button
                disabled={!sessions.length}
                onClick={() =>
                  download(
                    "fare-study.json",
                    JSON.stringify(
                      {
                        schemaVersion: 1,
                        exportedAt: new Date().toISOString(),
                        sessions,
                      },
                      null,
                      2,
                    ),
                    "application/json",
                  )
                }
              >
                <ArrowDownToLine size={15} />
                JSON + events
              </button>
            </div>
          </div>
          <div className="comparison-table">
            <div className="comparison-row heading">
              <span>MEASURE</span>
              <span>
                App by app <small>n = {summaries.baseline.count}</small>
              </span>
              <span>
                All together <small>n = {summaries.aggregate.count}</small>
              </span>
            </div>
            {[
              ["Average clicks", "clicks", ""],
              ["Average search time", "seconds", "s"],
              ["Cheapest ride booked", "cheapestRate", "%"],
              ["Affordable EV/hybrid chosen", "greenRate", "%"],
            ].map(([label, key, unit]) => (
              <div className="comparison-row" key={key}>
                <span>{label}</span>
                {(["baseline", "aggregate"] as const).map((m) => {
                  const val =
                    summaries[m][
                      key as "clicks" | "seconds" | "cheapestRate" | "greenRate"
                    ];
                  return (
                    <strong key={m}>
                      {val === null
                        ? "—"
                        : `${val.toFixed(key.includes("Rate") ? 0 : 1)}${unit}`}
                      {key === "greenRate" && (
                        <small>{summaries[m].eligibleCount} eligible</small>
                      )}
                    </strong>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="field-note">
            Descriptive totals across settings. For a fair comparison, use the
            same seed, route, scenario and matched provider pool; alternate test
            order.
          </p>
          {sessions.length ? (
            <>
              <div className="session-list">
                <div className="session-row session-head">
                  <span>PARTICIPANT / MODE</span>
                  <span>RIDE</span>
                  <span>CLICKS</span>
                  <span>TIME</span>
                  <span>OUTCOME</span>
                </div>
                {[...sessions].reverse().map((s) => (
                  <button
                    className={`session-row ${inspect?.id === s.id ? "selected" : ""}`}
                    key={s.id}
                    onClick={() => setInspect(inspect?.id === s.id ? null : s)}
                  >
                    <span>
                      <strong>{s.participant}</strong>
                      <small>
                        {s.mode === "aggregate" ? "All together" : "App by app"}{" "}
                        · seed {s.seed}
                      </small>
                    </span>
                    <span>
                      {s.selected
                        ? `${s.selected.provider} ${s.selected.name === s.selected.provider ? "" : s.selected.name}`
                        : "—"}
                      <small>
                        {s.selected ? money(s.selected.price) : "Not booked"}
                      </small>
                    </span>
                    <span>{s.clicks}</span>
                    <span>{durationLabel(s.elapsedSeconds)}</span>
                    <span className={s.bookedCheapest ? "success-text" : ""}>
                      {s.status === "abandoned"
                        ? "Abandoned"
                        : s.bookedCheapest
                          ? "Cheapest"
                          : "Booked"}
                      <ChevronDown size={13} />
                    </span>
                  </button>
                ))}
              </div>
              {inspect && (
                <div className="session-inspect">
                  <h4>{inspect.participant} · Session detail</h4>
                  <p>
                    {inspect.pickup || "No route recorded"} →{" "}
                    {inspect.destination || "—"}
                  </p>
                  <p className="field-note">
                    Scenario: {inspect.scenario} · Pool: {inspect.pool} ·
                    Started: {new Date(inspect.startedAt).toLocaleString()} ·{" "}
                    {inspect.id}
                  </p>
                  <div className="event-table">
                    {inspect.events.map((e) => (
                      <div key={e.n}>
                        <span>{(e.atMs / 1000).toFixed(1)}s</span>
                        <small>{e.kind}</small>
                        <span>
                          {e.action.replaceAll("_", " ")}
                          {e.detail && ` · ${e.detail}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="clear-data">
                <button onClick={() => setClearConfirm(!clearConfirm)}>
                  <Trash2 size={14} />
                  {clearConfirm ? "Keep results" : "Clear saved results"}
                </button>
                {clearConfirm && (
                  <button
                    className="danger"
                    onClick={() => {
                      onClear();
                      setInspect(null);
                      setClearConfirm(false);
                    }}
                  >
                    Permanently clear {sessions.length} sessions
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="no-sessions">
              <Activity size={30} />
              <h3>Your first result starts with a ride.</h3>
              <p>Complete either experience to see real measurements here.</p>
            </div>
          )}
        </div>
      )}
      {tab === "protocol" && (
        <div className="protocol">
          <div>
            <span className="eyebrow">A CONSISTENT TEST</span>
            <h3>Same trip. Two ways to get there.</h3>
            <p>
              Ask participants to find and book the cheapest ride from
              Patricia’s Green to the Ferry Building. Let them explore freely.
              In the baseline, they can move between apps at any point; they are
              never forced through a fixed click count.
            </p>
            <ol>
              <li>
                Choose a participant ID, seed and scenario. Use the{" "}
                <strong>matched provider pool</strong> for controlled
                comparisons.
              </li>
              <li>
                Run both experiences with the same route and settings. Alternate
                which experience participants see first.
              </li>
              <li>
                Close this panel before the first task action. Booking
                confirmation ends the timer.
              </li>
              <li>
                Export the CSV for analysis and JSON for complete quote
                snapshots and event logs.
              </li>
            </ol>
          </div>
          <div className="metric-definitions">
            <h3>What gets measured</h3>
            <p>
              <strong>Clicks.</strong> Every button, input or option activation
              inside the experience, including app switches, backtracking,
              filters and final confirmation. Text edits are logged separately;
              individual keystrokes and researcher controls are excluded.
            </p>
            <p>
              <strong>Time.</strong> Wall-clock time from the first task
              interaction to final provider confirmation. Background time and
              time in this panel are included. Reloaded attempts become
              abandoned at their last recorded event.
            </p>
            <p>
              <strong>Cheapest choice.</strong> The selected fare is compared
              with every available quote for that route in the session’s
              provider pool. All price ties qualify. Abandoned attempts are
              excluded.
            </p>
            <p>
              <strong>Affordable green choice.</strong> Only sessions with an
              EV/hybrid at or below the cheapest gas fare are eligible. A
              success means an EV/hybrid at that price or lower was booked. If
              no sessions qualify, the result is “—”.
            </p>
            <p>
              <strong>Simulation boundaries.</strong> Prices, wait times, routes
              and tailpipe CO₂ are fictional. EVs show zero tailpipe CO₂, not
              zero lifecycle emissions. These are functional recreations of
              selected booking patterns, not exact replicas of every app
              version. No real requests, payments or provider connections occur.
            </p>
            <p>
              <strong>Storage.</strong> Results stay in this browser on this
              device. No server collection or cross-device sync. Use participant
              codes, export regularly, and avoid entering real personal details.
            </p>
          </div>
        </div>
      )}
    </Dialog>
  );
}

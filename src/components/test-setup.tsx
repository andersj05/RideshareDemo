"use client";
import { Shuffle } from "lucide-react";
import {
  PLACES,
  TASK_LABELS,
  type Settings,
  type StudyEvent,
  durationLabel,
} from "@/lib/simulation";
export function TestSetup({
  settings,
  onChange,
  disabled = false,
}: {
  settings: Settings;
  onChange: (next: Settings) => void;
  disabled?: boolean;
}) {
  return (
    <div className="setup-fields">
      <label>
        Participant ID
        <input
          value={settings.participant}
          disabled={disabled}
          maxLength={40}
          onChange={(e) =>
            onChange({ ...settings, participant: e.target.value })
          }
        />
      </label>
      <label>
        Task
        <select
          disabled={disabled}
          value={settings.task || "cheapest"}
          onChange={(e) =>
            onChange({ ...settings, task: e.target.value as Settings["task"] })
          }
        >
          {Object.entries(TASK_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Destination
        <select
          disabled={disabled}
          value={settings.destinationId || "ferry"}
          onChange={(e) =>
            onChange({ ...settings, destinationId: e.target.value })
          }
        >
          {PLACES.filter((p) => p.id !== "hayes").map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Fare scenario
        <select
          disabled={disabled}
          value={settings.scenario}
          onChange={(e) =>
            onChange({
              ...settings,
              scenario: e.target.value as Settings["scenario"],
            })
          }
        >
          <option value="balanced">Typical fares</option>
          <option value="rush">Rush hour</option>
          <option value="green">Affordable EV / hybrid</option>
        </select>
      </label>
      <label>
        Aggregator providers
        <select
          disabled={disabled}
          value={settings.pool}
          onChange={(e) =>
            onChange({ ...settings, pool: e.target.value as Settings["pool"] })
          }
        >
          <option value="matched">Uber + Lyft (matched comparison)</option>
          <option value="all">Uber + Lyft + Waymo + Curb</option>
        </select>
      </label>
      <label>
        Random seed
        <div className="seed-input">
          <input
            type="number"
            min="1"
            max="999999"
            value={settings.seed}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                ...settings,
                seed: Math.max(
                  1,
                  Math.min(999999, Number(e.target.value) || 1),
                ),
              })
            }
          />
          <button
            className="icon-button"
            aria-label="Randomize fares"
            disabled={disabled}
            onClick={() =>
              onChange({
                ...settings,
                seed: Math.floor(Math.random() * 999999) + 1,
              })
            }
          >
            <Shuffle size={18} />
          </button>
        </div>
      </label>
      <p className="help-text">
        The same seed, scenario and route produce the same fares in both
        experiences.
      </p>
      {disabled && (
        <p className="help-text">End or reset this attempt to change setup.</p>
      )}
    </div>
  );
}
export function LiveMetrics({
  events,
  elapsed,
  running,
}: {
  events: StudyEvent[];
  elapsed: number;
  running: boolean;
}) {
  const clicks = events.filter((e) => e.kind === "click").length;
  return (
    <>
      <div className="panel-heading">
        <h2>Live observation</h2>
        <span className={`status-tag ${running ? "recording" : ""}`}>
          {running
            ? "Recording"
            : events.some((e) => e.action === "booking_confirmed")
              ? "Complete"
              : "Ready"}
        </span>
      </div>
      <div className="live-numbers">
        <div>
          <span>Clicks / taps</span>
          <strong>{clicks}</strong>
        </div>
        <div>
          <span>Elapsed time</span>
          <strong>{durationLabel(elapsed)}</strong>
        </div>
      </div>
      <p className="help-text">
        Starts with the first action in the phone. Ends when the booking is
        confirmed. Setup and researcher controls are excluded.
      </p>
      <h3>Recent actions</h3>
      {events.length ? (
        <ol className="event-list">
          {events
            .slice(-6)
            .reverse()
            .map((event) => (
              <li key={event.n}>
                <span className="event-time">
                  {(event.atMs / 1000).toFixed(1)}s
                </span>
                <div>
                  <strong>{event.action.replaceAll("_", " ")}</strong>
                  {event.provider && <small>{event.provider}</small>}
                  {event.detail && <small>{event.detail}</small>}
                </div>
              </li>
            ))}
        </ol>
      ) : (
        <div className="quiet-empty">
          No actions yet. Start the task in the phone.
        </div>
      )}
    </>
  );
}

"use client";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  BarChart3,
  BookOpen,
  FlaskConical,
  Play,
  RotateCcw,
  Settings2,
  Smartphone,
} from "lucide-react";
import {
  DEFAULT_PICKUP,
  DEFAULT_SETTINGS,
  PLACES,
  TASK_LABELS,
  availableOffers,
  generateOffers,
  type Mode,
  type Offer,
  type Place,
  type Priority,
  type Session,
  type Settings,
} from "@/lib/simulation";
import { useStudy } from "@/lib/use-study";
import { MobileAggregate, type AggregateStage } from "./mobile-aggregate";
import { MobileBaseline } from "./mobile-baseline";
import { BookingComplete, ProviderConfirmation } from "./mobile-shell";
import { TestSetup, LiveMetrics } from "./test-setup";
import { TestResults } from "./test-results";
import { Dialog } from "./dialog";

export default function TestLab() {
  const [settings, setSettings] = useState<Settings>({
    ...DEFAULT_SETTINGS,
    pool: "matched",
  });
  const [mode, setMode] = useState<Mode>("aggregate");
  const [page, setPage] = useState<"test" | "results">("test");
  const [modal, setModal] = useState<"setup" | "guide" | "observation" | null>(
    null,
  );
  const [participant, setParticipant] = useState(false);
  const [pickup, setPickup] = useState<Place | null>(DEFAULT_PICKUP);
  const [destination, setDestination] = useState<Place | null>(null);
  const [stage, setStage] = useState<AggregateStage>("search");
  const [priority, setPriority] = useState<Priority>("price");
  const [selected, setSelected] = useState<Offer | null>(null);
  const [greenOnly, setGreenOnly] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [receipt, setReceipt] = useState<Session | null>(null);
  const [iteration, setIteration] = useState(0);
  const [device, setDevice] = useState("390");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const study = useStudy(settings, mode);
  const taskDestination =
    PLACES.find((p) => p.id === (settings.destinationId || "ferry")) ||
    PLACES[1];
  const offers = availableOffers(
    generateOffers(
      settings,
      pickup || DEFAULT_PICKUP,
      destination || taskDestination,
    ),
    mode,
    settings.pool,
  );
  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    [],
  );
  function end(reason: string) {
    if (study.running)
      study.finish(
        "abandoned",
        pickup || DEFAULT_PICKUP,
        destination || taskDestination,
        offers,
        null,
        reason,
      );
  }
  function reset() {
    if (timeout.current) clearTimeout(timeout.current);
    study.resetView();
    setPickup(DEFAULT_PICKUP);
    setDestination(null);
    setStage("search");
    setSelected(null);
    setGreenOnly(false);
    setPriority("price");
    setHandoff(false);
    setReceipt(null);
    setIteration((n) => n + 1);
  }
  function newAttempt() {
    end("attempt_reset");
    reset();
  }
  function changeMode(next: Mode) {
    if (next === mode) return;
    end("experience_changed");
    reset();
    setMode(next);
  }
  function showResults() {
    end("left_test_for_results");
    reset();
    setPage("results");
  }
  function changeSettings(next: Settings) {
    end("setup_changed");
    reset();
    setSettings(next);
  }
  function capture(event: MouseEvent<HTMLDivElement>) {
    if (receipt || !study.ready) return;
    const target = (event.target as Element).closest<HTMLElement>(
      "button,input,select,[data-action]",
    );
    // Controlled checkboxes record in onChange; capture-time rendering can
    // restore their old checked value before React's change event runs.
    if (
      !target ||
      target.matches(":disabled") ||
      target.matches('input[type="checkbox"]') ||
      target.closest("[data-untracked]")
    )
      return;
    const provider =
      target.dataset.provider ||
      target.closest<HTMLElement>("[data-provider]")?.dataset.provider;
    study.record(
      target.dataset.action ||
        target.getAttribute("aria-label") ||
        "app_control",
      "click",
      target.dataset.detail,
      provider as Offer["provider"] | undefined,
    );
  }
  function confirm(
    offer: Offer,
    from = pickup || DEFAULT_PICKUP,
    to = destination || taskDestination,
  ) {
    const snapshot = availableOffers(
      generateOffers(settings, from, to),
      mode,
      settings.pool,
    );
    const result = study.finish(
      "completed",
      from,
      to,
      snapshot,
      offer,
      "booking_confirmed",
    );
    if (result) setReceipt(result);
  }
  function search() {
    if (!pickup || !destination || pickup.id === destination.id) return;
    setStage("loading");
    setSelected(null);
    timeout.current = setTimeout(() => {
      setStage("results");
      study.record("quotes_loaded", "system", String(offers.length));
    }, 650);
  }
  const task = (
    <>
      <strong>{TASK_LABELS[settings.task || "cheapest"]}</strong>
      <span>
        From {DEFAULT_PICKUP.name} to {taskDestination.name}.
      </span>
    </>
  );
  return (
    <div
      className={`lab ${page === "test" ? "run-active" : ""} ${participant ? "participant-view" : ""}`}
    >
      <header className="lab-header">
        <a
          className="lab-brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("test");
          }}
        >
          <FlaskConical size={22} />
          <span>Rideshare Test Lab</span>
          <small>Prototype</small>
        </a>
        {participant ? (
          <button
            className="secondary compact"
            onClick={() => setParticipant(false)}
          >
            Exit participant view
          </button>
        ) : (
          <nav aria-label="Lab navigation">
            <button
              className={page === "test" ? "active" : ""}
              onClick={() => setPage("test")}
            >
              <Smartphone size={17} />
              <span>Run test</span>
            </button>
            <button
              className={page === "results" ? "active" : ""}
              onClick={showResults}
            >
              <BarChart3 size={17} />
              <span>Results</span>
              <b>{study.sessions.length}</b>
            </button>
            <button aria-label="Study guide" onClick={() => setModal("guide")}>
              <BookOpen size={18} />
              <span className="guide-label">Guide</span>
            </button>
          </nav>
        )}
      </header>
      {study.storageWarning && (
        <p className="notice storage-notice" role="alert">
          Browser storage is unavailable. Export results before closing this
          page.
        </p>
      )}
      {page === "results" ? (
        <TestResults sessions={study.sessions} onBack={() => setPage("test")} />
      ) : (
        <main className="run-page">
          <div className="workspace-heading">
            <div>
              <h1>Run a mobile task</h1>
              <p>Choose an experience, hand over the phone, and observe.</p>
            </div>
            <button className="secondary" onClick={() => setParticipant(true)}>
              <Play size={16} />
              Participant view
            </button>
          </div>
          <div className="test-workspace">
            {!participant && (
              <aside className="setup-panel panel">
                <div className="panel-heading">
                  <h2>Test setup</h2>
                </div>
                <TestSetup
                  settings={settings}
                  onChange={changeSettings}
                  disabled={study.running}
                />
                <div className="panel-divider" />
                <label className="device-setting">
                  Phone viewport
                  <select
                    value={device}
                    disabled={study.running}
                    onChange={(e) => setDevice(e.target.value)}
                  >
                    <option value="375">375 × 667 · compact</option>
                    <option value="390">390 × 780 · standard</option>
                    <option value="430">430 × 850 · large</option>
                  </select>
                </label>
                <p className="help-text">
                  On a phone, the prototype uses the actual screen size.
                </p>
              </aside>
            )}
            <section className="test-stage" aria-label="Test experience">
              <div className="stage-toolbar">
                <div
                  className="experience-switch"
                  aria-label="Choose experience"
                >
                  <button
                    aria-pressed={mode === "baseline"}
                    onClick={() => changeMode("baseline")}
                  >
                    Uber + Lyft
                  </button>
                  <button
                    aria-pressed={mode === "aggregate"}
                    onClick={() => changeMode("aggregate")}
                  >
                    Aggregator
                  </button>
                </div>
                <button
                  className="icon-button"
                  aria-label={
                    study.running ? "End attempt and reset" : "Reset test"
                  }
                  title="Reset test"
                  onClick={newAttempt}
                >
                  <RotateCcw size={18} />
                </button>
                {!participant && (
                  <button
                    className="icon-button mobile-setup"
                    aria-label="Test setup"
                    onClick={() => setModal("setup")}
                  >
                    <Settings2 size={19} />
                  </button>
                )}
              </div>
              <div className="task-instruction">
                <span className="task-label">Your task</span>
                <div>{task}</div>
              </div>
              <div
                className="phone-preview"
                style={
                  {
                    "--device-width": `${device}px`,
                    "--device-height":
                      device === "375"
                        ? "667px"
                        : device === "430"
                          ? "850px"
                          : "780px",
                  } as React.CSSProperties
                }
              >
                <div className="phone-status" aria-hidden="true">
                  <strong>9:41</strong>
                  <span>●●● ▰</span>
                </div>
                <div
                  className="mobile-screen"
                  data-mobile-screen
                  onClickCapture={capture}
                >
                  {!study.ready ? (
                    <div className="loading-screen">Preparing test…</div>
                  ) : receipt ? (
                    <BookingComplete
                      session={receipt}
                      onNew={newAttempt}
                      onResults={showResults}
                      participant={participant}
                    />
                  ) : mode === "baseline" ? (
                    <MobileBaseline
                      key={iteration}
                      settings={settings}
                      taskDestination={taskDestination}
                      onInput={(value) =>
                        study.record("location_typed", "input", value)
                      }
                      onContext={(p, d) => {
                        setPickup(p);
                        setDestination(d);
                      }}
                      onConfirm={confirm}
                    />
                  ) : handoff && selected ? (
                    <ProviderConfirmation
                      offer={selected}
                      pickup={pickup || DEFAULT_PICKUP}
                      destination={destination || taskDestination}
                      handoff
                      onBack={() => setHandoff(false)}
                      onConfirm={() => confirm(selected)}
                    />
                  ) : (
                    <MobileAggregate
                      pickup={pickup}
                      destination={destination}
                      setPickup={setPickup}
                      setDestination={setDestination}
                      taskDestination={taskDestination}
                      stage={stage}
                      offers={offers}
                      priority={priority}
                      setPriority={setPriority}
                      selected={selected}
                      setSelected={setSelected}
                      greenOnly={greenOnly}
                      setGreenOnly={(value) => {
                        study.record(
                          "toggle_green_filter",
                          "click",
                          value ? "on" : "off",
                        );
                        setGreenOnly(value);
                        if (value && selected?.powertrain === "Gas")
                          setSelected(null);
                      }}
                      onSearch={search}
                      onEdit={() => {
                        setStage("search");
                        setSelected(null);
                      }}
                      onContinue={() => setHandoff(true)}
                      onInput={(value) =>
                        study.record("location_typed", "input", value)
                      }
                    />
                  )}
                </div>
                <div className="phone-home" aria-hidden="true">
                  <span />
                </div>
              </div>
              {!participant && (
                <div className="stage-caption">
                  <span>
                    {mode === "baseline"
                      ? "Separate apps · 2 providers"
                      : `One comparison · ${settings.pool === "matched" ? "2" : "4"} providers`}
                  </span>
                  <button
                    className="text-button mobile-observation"
                    onClick={() => setModal("observation")}
                  >
                    View live metrics
                  </button>
                </div>
              )}
            </section>
            {!participant && (
              <aside className="observation-panel">
                <div className="panel">
                  <LiveMetrics
                    events={study.events}
                    elapsed={study.elapsed}
                    running={study.running}
                  />
                </div>
                <div className="panel protocol-note">
                  <h2>For a fair comparison</h2>
                  <p>
                    Keep the task, seed, scenario and provider pool the same.
                    Alternate which experience each participant uses first.
                  </p>
                  <p>Use participant view to hide the metrics during a test.</p>
                  <button className="secondary" onClick={showResults}>
                    <BarChart3 size={16} />
                    Open results
                  </button>
                </div>
              </aside>
            )}
          </div>
        </main>
      )}
      {modal && (
        <Dialog
          title={
            modal === "setup"
              ? "Test setup"
              : modal === "guide"
                ? "Study guide"
                : "Live observation"
          }
          onClose={() => setModal(null)}
        >
          {modal === "setup" ? (
            <>
              <h2>Test setup</h2>
              <TestSetup
                settings={settings}
                onChange={changeSettings}
                disabled={study.running}
              />
              <button
                className="primary"
                onClick={() => {
                  setParticipant(true);
                  setModal(null);
                }}
              >
                Start participant view
              </button>
            </>
          ) : modal === "observation" ? (
            <LiveMetrics
              events={study.events}
              elapsed={study.elapsed}
              running={study.running}
            />
          ) : (
            <div className="guide-content">
              <h2>Study guide</h2>
              <p>
                This is a prototype lab for testing mobile ride-booking tasks.
                All providers, payments, fares, wait times and emissions are
                simulated.
              </p>
              <h3>Run a paired test</h3>
              <ol>
                <li>Enter an anonymous participant ID and choose a task.</li>
                <li>
                  Use the matched Uber + Lyft pool and the same seed, route and
                  scenario for both experiences.
                </li>
                <li>
                  Open participant view and ask them to complete the task
                  without coaching.
                </li>
                <li>
                  Switch experiences and repeat. Alternate the starting
                  experience between participants.
                </li>
                <li>
                  Open Results to compare and export the recorded attempts.
                </li>
              </ol>
              <h3>What gets measured</h3>
              <p>
                Clicks and taps on app controls count once, including app
                switches, input focus, sorting, destination choices and final
                confirmation. Text changes are recorded as input events, not
                additional clicks. Scrolling and researcher controls are
                excluded.
              </p>
              <p>
                Timing runs from the first app action through confirmation.
                Reloading, resetting or leaving an active task saves an
                abandoned attempt. A reload recovery uses the last recorded
                event time.
              </p>
              <h3>Prototype limits</h3>
              <p>
                Uber and Lyft screens reproduce common mobile interaction
                patterns, not an exact current release. There is no real
                routing, authentication, dynamic pricing or payment. CO₂
                estimates are fictional tailpipe values, not lifecycle
                emissions.
              </p>
              <p>
                Data stays in this browser. Export JSON for event logs and fare
                snapshots, or CSV for analysis. Use one active test tab at a
                time.
              </p>
            </div>
          )}
        </Dialog>
      )}
    </div>
  );
}

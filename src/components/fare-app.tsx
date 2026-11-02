"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronRight,
  CreditCard,
  FlaskConical,
  Leaf,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Aggregate, type AggregateStage } from "./aggregate";
import { Baseline } from "./baseline";
import { Dialog } from "./dialog";
import { ResearchLab } from "./research-lab";
import { FareLogo, ProviderMark, Vehicle } from "./visuals";
import {
  availableOffers,
  DEFAULT_DESTINATION,
  DEFAULT_PICKUP,
  DEFAULT_SETTINGS,
  durationLabel,
  generateOffers,
  money,
  sortOffers,
  type Mode,
  type Offer,
  type Place,
  type Priority,
  type Provider,
  type Session,
  type Settings,
} from "@/lib/simulation";
import { useStudy } from "@/lib/use-study";

export default function FareApp() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<Mode>("aggregate");
  const [pickup, setPickup] = useState<Place | null>(DEFAULT_PICKUP);
  const [destination, setDestination] = useState<Place | null>(null);
  const [stage, setStage] = useState<AggregateStage>("search");
  const [priority, setPriority] = useState<Priority>("price");
  const [greenOnly, setGreenOnly] = useState(false);
  const [selected, setSelected] = useState<Offer | null>(null);
  const [handoff, setHandoff] = useState(false);
  const [receipt, setReceipt] = useState<Session | null>(null);
  const [lab, setLab] = useState(false);
  const [labTab, setLabTab] = useState<"overview" | "sessions">("overview");
  const [trips, setTrips] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const study = useStudy(settings, mode);
  const offers = useMemo(
    () =>
      availableOffers(
        generateOffers(
          settings,
          pickup || DEFAULT_PICKUP,
          destination || DEFAULT_DESTINATION,
        ),
        mode,
        settings.pool,
      ),
    [settings, pickup, destination, mode],
  );

  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    },
    [],
  );
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [stage, mode]);
  function reset(nextMode: Mode = mode, nextSettings: Settings = settings) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    study.finish(
      "abandoned",
      pickup || DEFAULT_PICKUP,
      destination || DEFAULT_DESTINATION,
      offers,
      null,
      "test_reset",
    );
    setMode(nextMode);
    setSettings(nextSettings);
    setPickup(DEFAULT_PICKUP);
    setDestination(null);
    setStage("search");
    setSelected(null);
    setGreenOnly(false);
    setPriority("price");
    setHandoff(false);
    setReceipt(null);
    setEpoch((e) => e + 1);
    study.resetView();
  }
  function capture(event: MouseEvent<HTMLDivElement>) {
    if (receipt) return;
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      "button, input, select, [data-action]",
    );
    if (
      !target ||
      target.hasAttribute("disabled") ||
      target.closest("[data-untracked]")
    )
      return;
    const action =
      target.dataset.action ||
      target.getAttribute("aria-label")?.toLowerCase().replaceAll(" ", "_") ||
      "interface_action";
    study.record(
      action,
      "click",
      undefined,
      target.dataset.provider as Provider | undefined,
    );
  }
  function changeLocation(place: Place | null, isPickup: boolean) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setStage("search");
    setSelected(null);
    if (isPickup) setPickup(place);
    else setDestination(place);
  }
  function search() {
    if (!pickup || !destination || pickup.id === destination.id) return;
    setStage("loading");
    searchTimer.current = setTimeout(() => {
      setSelected(
        sortOffers(
          greenOnly ? offers.filter((o) => o.powertrain !== "Gas") : offers,
          priority,
        )[0],
      );
      setStage("results");
      study.record("quotes_presented", "system", `${offers.length} quotes`);
    }, 750);
  }
  function confirm(offer: Offer, from: Place, to: Place) {
    const snapshot = availableOffers(
      generateOffers(settings, from, to),
      mode,
      settings.pool,
    );
    const result = study.finish("completed", from, to, snapshot, offer);
    setPickup(from);
    setDestination(to);
    setHandoff(false);
    setReceipt(result);
  }
  const completed = study.sessions.filter((s) => s.status === "completed");
  return (
    <div className="app-shell">
      <header className="site-header">
        <button
          className="brand-button"
          aria-label="Fare home — start a new search"
          onClick={() => reset()}
        >
          <FareLogo />
          <span>A BETTER WAY THERE</span>
        </button>
        <nav className="experience-nav" aria-label="Testing experience">
          <button
            className={mode === "aggregate" ? "active" : ""}
            aria-pressed={mode === "aggregate"}
            onClick={() => {
              if (mode !== "aggregate") reset("aggregate");
            }}
          >
            <span>01</span>All together
          </button>
          <button
            className={mode === "baseline" ? "active" : ""}
            aria-pressed={mode === "baseline"}
            onClick={() => {
              if (mode !== "baseline") reset("baseline");
            }}
          >
            <span>02</span>App by app
          </button>
        </nav>
        <div className="header-actions">
          <button className="trips-button" onClick={() => setTrips(true)}>
            Your trips{completed.length > 0 && <span>{completed.length}</span>}
          </button>
          <span className="header-divider" />
          <button
            className="lab-button"
            aria-label="Research lab"
            onClick={() => {
              setLabTab("overview");
              setLab(true);
            }}
          >
            <FlaskConical size={16} />
            <span>Research lab</span>
            <span className="keyboard-hint">↗</span>
          </button>
        </div>
      </header>
      <div className="prototype-strip">
        <span>
          <span className="prototype-pill">PROTOTYPE</span> A real-feeling ride.
          Entirely simulated.
        </span>
        <span className="prototype-right">
          <span className="live-dot" />
          No payments. No real bookings.
        </span>
      </div>
      <div className="experience" onClickCapture={capture}>
        {mode === "aggregate" ? (
          <Aggregate
            key={epoch}
            pickup={pickup}
            destination={destination}
            setPickup={(p) => changeLocation(p, true)}
            setDestination={(p) => changeLocation(p, false)}
            stage={stage}
            offers={offers}
            priority={priority}
            setPriority={setPriority}
            selected={selected}
            setSelected={setSelected}
            greenOnly={greenOnly}
            setGreenOnly={(value) => {
              setGreenOnly(value);
              if (value && selected?.powertrain === "Gas")
                setSelected(
                  sortOffers(
                    offers.filter((o) => o.powertrain !== "Gas"),
                    priority,
                  )[0],
                );
            }}
            onSearch={search}
            onEdit={() => {
              setStage("search");
              setSelected(null);
            }}
            onContinue={() => {
              setHandoff(true);
              study.record("provider_handoff", "system", selected?.provider);
            }}
            onInput={(s) => study.record("location_text_changed", "input", s)}
            pool={settings.pool}
          />
        ) : (
          <Baseline
            key={epoch}
            settings={settings}
            onConfirm={confirm}
            onInput={(s) => study.record("location_text_changed", "input", s)}
            onContext={(p, d) => {
              setPickup(p);
              setDestination(d);
            }}
          />
        )}
        {handoff && selected && pickup && destination && (
          <Dialog
            title={`Confirm your ${selected.provider} ride`}
            onClose={() => {
              study.record("dismiss_handoff", "system");
              setHandoff(false);
            }}
            className={`handoff-dialog ${selected.provider.toLowerCase()}-handoff`}
          >
            <div className="handoff-breadcrumb">
              <FareLogo small />
              <ArrowRight size={16} />
              <ProviderMark provider={selected.provider} />
            </div>
            <div className="handoff-status">
              <CheckCheck size={15} />
              Your trip details are ready
            </div>
            <h2>
              One last tap.
              <br />
              Then you’re on your way.
            </h2>
            <p className="handoff-explainer">
              You’re in the simulated {selected.provider} confirmation.
              <br />
              Everything you chose on fare is already here.
            </p>
            <div className="handoff-ride">
              <div>
                <ProviderMark provider={selected.provider} />
                <strong>{selected.name}</strong>
                <span>
                  {selected.pickup} min away · {selected.powertrain}
                </span>
              </div>
              <Vehicle
                provider={selected.provider}
                electric={selected.powertrain === "EV"}
                large
              />
            </div>
            <div className="handoff-route">
              <div>
                <span className="route-node" />
                <span>
                  <small>PICKUP</small>
                  <strong>{pickup.name}</strong>
                  <p>{pickup.address}</p>
                </span>
              </div>
              <div>
                <span className="route-node square" />
                <span>
                  <small>DROP-OFF</small>
                  <strong>{destination.name}</strong>
                  <p>{destination.address}</p>
                </span>
              </div>
            </div>
            <div className="handoff-payment">
              <CreditCard size={19} />
              <span>
                Visa •••• 4242<small>Demo payment method</small>
              </span>
              <strong>{money(selected.price)}</strong>
            </div>
            <button
              className="provider-button"
              data-action="confirm_booking"
              data-provider={selected.provider}
              onClick={() => confirm(selected, pickup, destination)}
            >
              Confirm {selected.provider} ride
              <ArrowRight size={18} />
            </button>
            <p className="provider-demo-note">
              <ShieldCheck size={13} />
              Simulation only. No ride requested or payment taken.
            </p>
            <button
              className="handoff-back"
              data-action="back_to_comparison"
              onClick={() => setHandoff(false)}
            >
              <ArrowLeft size={14} />
              Back to comparison
            </button>
          </Dialog>
        )}
        {receipt && (
          <Dialog
            title="Ride confirmed"
            onClose={() => reset()}
            className="receipt-dialog"
          >
            <div className="receipt-check">
              <Check size={30} />
            </div>
            <span className="eyebrow">SIMULATION COMPLETE</span>
            <h2>
              Less searching.
              <br />
              More going.
            </h2>
            <p>
              Your {receipt.selected?.provider} ride is confirmed in the demo.
              <br />
              No real ride was requested.
            </p>
            <div className="receipt-ride">
              <ProviderMark provider={receipt.selected!.provider} />
              <span>{receipt.selected?.name}</span>
              <strong>{money(receipt.selected!.price)}</strong>
            </div>
            <div className="receipt-route">
              <MapPin size={17} />
              <span>
                {receipt.pickup}
                <ArrowRight size={14} />
                {receipt.destination}
              </span>
            </div>
            <div className="receipt-metrics">
              <div>
                <strong>{receipt.clicks}</strong>
                <span>clicks to book</span>
              </div>
              <div>
                <strong>{durationLabel(receipt.elapsedSeconds)}</strong>
                <span>search time</span>
              </div>
              <div>
                <strong>
                  {receipt.bookedCheapest ? (
                    <Check size={25} />
                  ) : (
                    money(receipt.premiumPaid || 0)
                  )}
                </strong>
                <span>
                  {receipt.bookedCheapest
                    ? "cheapest ride"
                    : "above lowest fare"}
                </span>
              </div>
            </div>
            <div className="saved-note">
              <CheckCheck size={14} />
              This session is saved in your research results.
            </div>
            <button
              className="primary-button"
              onClick={() =>
                reset(mode === "aggregate" ? "baseline" : "aggregate")
              }
            >
              Try {mode === "aggregate" ? "app by app" : "all together"}
              <ArrowRight size={18} />
            </button>
            <button
              className="receipt-secondary"
              onClick={() => {
                setReceipt(null);
                reset();
                setLabTab("sessions");
                setLab(true);
              }}
            >
              View research results
              <ChevronRight size={15} />
            </button>
          </Dialog>
        )}
      </div>
      <footer className="site-footer">
        <span>MADE FOR THE WAY YOU MOVE.</span>
        <span>
          San Francisco <span className="footer-dot">·</span> Research prototype
          v0.1 <span className="footer-dot">·</span> <Leaf size={12} /> A little
          lighter on the city.
        </span>
      </footer>
      {lab && (
        <ResearchLab
          initialTab={labTab}
          settings={settings}
          sessions={study.sessions}
          events={study.events}
          elapsed={study.elapsed}
          running={study.running}
          storageWarning={study.storageWarning}
          onApply={(s, m) => {
            reset(m, s);
            setLab(false);
          }}
          onClose={() => setLab(false)}
          onClear={study.clearHistory}
        />
      )}
      {trips && (
        <Dialog
          title="Your simulated trips"
          onClose={() => setTrips(false)}
          className="trips-dialog"
        >
          <span className="eyebrow">YOUR RECENT JOURNEYS</span>
          <h2>A few places you’ve been.</h2>
          <p className="muted">Simulated trips saved on this device.</p>
          {completed.length ? (
            <div className="trip-history">
              {[...completed].reverse().map((s) => (
                <div key={s.id}>
                  <ProviderMark provider={s.selected!.provider} />
                  <span>
                    <strong>{s.destination}</strong>
                    <small>
                      {s.pickup} · {new Date(s.finishedAt).toLocaleDateString()}
                    </small>
                  </span>
                  <b>{money(s.selected!.price)}</b>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-trips">
              <MapPin size={33} />
              <h3>Somewhere good is waiting.</h3>
              <p>Your first simulated ride will appear here.</p>
              <button
                className="primary-button"
                onClick={() => setTrips(false)}
              >
                Find a ride
                <ArrowRight size={17} />
              </button>
            </div>
          )}
        </Dialog>
      )}
      {study.storageWarning && !lab && (
        <div className="storage-toast" role="status">
          Results are in memory only. Export from Research lab before closing.
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Clock3,
  CreditCard,
  Grid2X2,
  Home,
  MapPin,
  Search,
  Signal,
  User,
  Wifi,
} from "lucide-react";
import {
  DEFAULT_PICKUP,
  PLACES,
  generateOffers,
  money,
  type Offer,
  type Place,
  type Provider,
  type Settings,
} from "@/lib/simulation";
import { PlaceField } from "./place-field";
import { CityMap, ProviderMark, Vehicle } from "./visuals";

type Brand = "Uber" | "Lyft";
type State = {
  stage: "home" | "search" | "rides" | "confirm" | "activity" | "account";
  pickup: Place | null;
  destination: Place | null;
  selected: Offer | null;
};
const initial = (): State => ({
  stage: "home",
  pickup: DEFAULT_PICKUP,
  destination: null,
  selected: null,
});

export function Baseline({
  settings,
  onConfirm,
  onInput,
  onContext,
}: {
  settings: Settings;
  onConfirm: (ride: Offer, pickup: Place, destination: Place) => void;
  onInput: (s: string) => void;
  onContext: (pickup: Place, destination: Place) => void;
}) {
  const [provider, setProvider] = useState<Brand | null>(null);
  const [apps, setApps] = useState<Record<Brand, State>>({
    Uber: initial(),
    Lyft: initial(),
  });
  const app = provider ? apps[provider] : null;
  function update(next: Partial<State>) {
    if (provider)
      setApps((prev) => ({
        ...prev,
        [provider]: { ...prev[provider], ...next },
      }));
  }
  const quotes =
    app?.pickup && app.destination
      ? generateOffers(settings, app.pickup, app.destination).filter(
          (o) => o.provider === provider,
        )
      : [];
  const isLyft = provider === "Lyft";
  return (
    <main className="baseline-layout">
      <div className="baseline-intro">
        <span className="eyebrow">
          <span className="tiny-line" /> THE APP-BY-APP EXPERIENCE
        </span>
        <h1>
          Same city.
          <br /> Your usual <span>way.</span>
        </h1>
        <p>
          Check a fare. Explore another app.
          <br /> Choose the ride that works for you.
        </p>
        <div className="baseline-task">
          <span className="eyebrow">TODAY’S TRIP</span>
          <div>
            <span className="mini-route">
              <i />
              <b />
              <i />
            </span>
            <p>
              <strong>Patricia’s Green</strong>
              <small>50 Fell St, Hayes Valley</small>
              <strong>Ferry Building</strong>
              <small>1 Ferry Building, Embarcadero</small>
            </p>
          </div>
          <span className="task-instruction">
            Find and book the lowest-priced ride.
          </span>
        </div>
        <p className="baseline-hint">
          <Grid2X2 size={17} /> Use “Switch apps” to compare. Each app remembers
          where you left off.
        </p>
        <div className="baseline-disclaimer">
          <span className="live-dot" /> Interactive simulations · No real
          bookings
        </div>
      </div>
      <div className="phone-stage">
        <div className="phone-stage-decoration" />
        <div className="phone-and-controls">
          <div className="phone-toolbar">
            <span>{provider ? `${provider} simulation` : "Your apps"}</span>
            {provider && (
              <button
                data-action="open_app_switcher"
                onClick={() => setProvider(null)}
              >
                <Grid2X2 size={14} />
                Switch apps
              </button>
            )}
          </div>
          <div className={`phone ${isLyft ? "lyft-phone" : "uber-phone"}`}>
            <div className="phone-status">
              <strong>9:41</strong>
              <span className="dynamic-island" />
              <span>
                <Signal size={13} />
                <Wifi size={13} />
                <span className="battery" />
              </span>
            </div>
            {!provider ? (
              <div className="app-launcher">
                <p>MONDAY, NOVEMBER 2</p>
                <h2>Let’s get going.</h2>
                <div className="app-icons">
                  {(["Uber", "Lyft"] as Brand[]).map((p) => (
                    <button
                      key={p}
                      data-action={`open_${p.toLowerCase()}`}
                      data-provider={p}
                      onClick={() => {
                        setProvider(p);
                        const a = apps[p];
                        if (a.pickup && a.destination)
                          onContext(a.pickup, a.destination);
                      }}
                    >
                      <span className={`app-icon ${p.toLowerCase()}`}>
                        <ProviderMark provider={p} />
                      </span>
                      <strong>{p}</strong>
                      <small>
                        {apps[p].stage === "home"
                          ? "Open app"
                          : "Pick up where you left off"}
                      </small>
                    </button>
                  ))}
                </div>
                <div className="launcher-task">
                  <MapPin size={22} />
                  <strong>Ferry Building</strong>
                  <p>Your next stop, however you get there.</p>
                </div>
                <span className="launcher-footer">
                  Your ride apps, in one test environment.
                </span>
              </div>
            ) : (
              app && (
                <>
                  {app.stage === "home" && (
                    <div className="provider-home">
                      <div className="provider-home-heading">
                        <ProviderMark provider={provider} />
                        <button
                          aria-label={`${provider} account`}
                          data-action="provider_account"
                          onClick={() => update({ stage: "account" })}
                        >
                          <User size={20} />
                        </button>
                      </div>
                      {isLyft ? (
                        <>
                          <h2>
                            Where are we
                            <br />
                            headed?
                          </h2>
                          <div className="lyft-home-map">
                            <CityMap
                              pickup={DEFAULT_PICKUP}
                              destination={PLACES[1]}
                              minimal
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <h2>
                            Go anywhere
                            <br />
                            with Uber
                          </h2>
                          <div className="uber-promo">
                            <div>
                              <strong>
                                Your next ride
                                <br />
                                is right here
                              </strong>
                              <span>
                                Let’s go <ArrowRight size={14} />
                              </span>
                            </div>
                            <Vehicle provider="Uber" large />
                          </div>
                        </>
                      )}
                      <button
                        className="provider-search"
                        data-action="open_destination_search"
                        onClick={() => update({ stage: "search" })}
                      >
                        <Search size={21} />
                        <strong>
                          {isLyft ? "Where are you going?" : "Where to?"}
                        </strong>
                        {!isLyft && (
                          <span>
                            <Clock3 size={13} />
                            Now
                            <ChevronDown size={11} />
                          </span>
                        )}
                      </button>
                      <div className="provider-recents">
                        {[PLACES[1], PLACES[2]].map((p) => (
                          <button
                            key={p.id}
                            data-action="provider_recent_destination"
                            onClick={() =>
                              update({ destination: p, stage: "search" })
                            }
                          >
                            <span>
                              <Clock3 size={18} />
                            </span>
                            <div>
                              <strong>{p.name}</strong>
                              <small>{p.address}</small>
                            </div>
                            <ChevronRight size={16} />
                          </button>
                        ))}
                      </div>
                      <div className="provider-home-bottom">
                        <button
                          className="active"
                          data-action="provider_home"
                          onClick={() => update({ stage: "home" })}
                        >
                          <Home size={21} />
                          Home
                        </button>
                        <button
                          data-action="provider_activity"
                          onClick={() => update({ stage: "activity" })}
                        >
                          <Clock3 size={21} />
                          Activity
                        </button>
                        <button
                          data-action="provider_account"
                          onClick={() => update({ stage: "account" })}
                        >
                          <User size={21} />
                          Account
                        </button>
                      </div>
                    </div>
                  )}
                  {app.stage === "search" && (
                    <div className="provider-search-page">
                      <button
                        className="provider-back"
                        aria-label="Back to app home"
                        data-action="provider_back_home"
                        onClick={() => update({ stage: "home" })}
                      >
                        <ArrowLeft size={23} />
                      </button>
                      <h2>
                        {isLyft ? "Where are you going?" : "Plan your ride"}
                      </h2>
                      <div className="provider-form">
                        <PlaceField
                          label="Pickup"
                          place={app.pickup}
                          onChange={(p) => update({ pickup: p })}
                          placeholder="Enter pickup"
                          onInput={onInput}
                        />
                        <PlaceField
                          label="Destination"
                          place={app.destination}
                          onChange={(p) => update({ destination: p })}
                          placeholder={
                            isLyft ? "Enter destination" : "Where to?"
                          }
                          destination
                          onInput={onInput}
                        />
                      </div>
                      <p className="provider-form-note">
                        <MapPin size={14} />
                        San Francisco, CA
                      </p>
                      <button
                        className="provider-button"
                        disabled={
                          !app.pickup ||
                          !app.destination ||
                          app.pickup.id === app.destination.id
                        }
                        data-action="provider_search_rides"
                        onClick={() => {
                          if (app.pickup && app.destination) {
                            onContext(app.pickup, app.destination);
                            update({ stage: "rides", selected: quotes[0] });
                          }
                        }}
                      >
                        {isLyft ? "See rides" : "See prices"}
                        <ArrowRight size={18} />
                      </button>
                      <div className="search-help">
                        <Clock3 size={19} />
                        <span>Your recent places appear as you type.</span>
                      </div>
                    </div>
                  )}
                  {(app.stage === "rides" || app.stage === "confirm") &&
                    app.pickup &&
                    app.destination && (
                      <div className="provider-rides-page">
                        <div className="provider-map">
                          <CityMap
                            pickup={app.pickup}
                            destination={app.destination}
                            minimal
                            active
                          />
                          <button
                            className="provider-back round"
                            aria-label="Edit provider trip"
                            data-action="provider_edit_trip"
                            onClick={() => update({ stage: "search" })}
                          >
                            <ArrowLeft size={20} />
                          </button>
                          <div className="provider-map-label">
                            <span>
                              {app.stage === "confirm"
                                ? "Pick up near"
                                : "Going to"}
                            </span>
                            <strong>
                              {app.stage === "confirm"
                                ? app.pickup.name
                                : app.destination.name}
                            </strong>
                          </div>
                        </div>
                        <div className="provider-bottom-sheet">
                          <span className="sheet-handle" />
                          <h2>
                            {app.stage === "confirm"
                              ? "Confirm your pickup"
                              : isLyft
                                ? "Choose your ride"
                                : "Choose a ride"}
                          </h2>
                          {app.stage === "rides" ? (
                            <>
                              <p className="provider-sheet-subtitle">
                                {isLyft
                                  ? "A ride for every way you go."
                                  : "Prices include estimated taxes and fees."}
                              </p>
                              <div className="provider-options">
                                {quotes.map((o) => (
                                  <button
                                    className={
                                      app.selected?.id === o.id
                                        ? "selected"
                                        : ""
                                    }
                                    key={o.id}
                                    data-action="provider_select_ride"
                                    data-provider={provider}
                                    onClick={() => update({ selected: o })}
                                  >
                                    <Vehicle
                                      provider={provider}
                                      electric={o.powertrain === "EV"}
                                    />
                                    <span>
                                      <strong>
                                        {o.name === provider
                                          ? provider
                                          : o.name === "Green"
                                            ? `${provider} Green`
                                            : o.name}
                                      </strong>
                                      <small>
                                        {o.pickup} min away · {o.duration} min
                                      </small>
                                      <small>
                                        {o.powertrain !== "Gas"
                                          ? `${o.powertrain} · Lower emissions`
                                          : o.description}
                                      </small>
                                    </span>
                                    <b>{money(o.price)}</b>
                                  </button>
                                ))}
                              </div>
                              <div className="provider-payment">
                                <CreditCard size={19} />
                                <span>Personal · Visa •••• 4242</span>
                                <ChevronRight size={16} />
                              </div>
                              <button
                                className="provider-button"
                                data-action="provider_choose_ride"
                                disabled={!app.selected}
                                onClick={() => update({ stage: "confirm" })}
                              >
                                {isLyft ? "Select" : "Choose"}{" "}
                                {app.selected?.name === "Green"
                                  ? `${provider} Green`
                                  : app.selected?.name}
                              </button>
                            </>
                          ) : (
                            <>
                              <p className="provider-sheet-subtitle">
                                {app.pickup.address}
                              </p>
                              <div className="pickup-confirm-details">
                                <MapPin size={22} />
                                <span>
                                  <strong>{app.pickup.name}</strong>
                                  <small>Your driver will meet you here</small>
                                </span>
                                <CheckPin />
                              </div>
                              <div className="provider-fare-line">
                                <span>{app.selected?.name}</span>
                                <strong>
                                  {app.selected && money(app.selected.price)}
                                </strong>
                              </div>
                              <div className="provider-payment">
                                <CreditCard size={18} />
                                <span>Visa •••• 4242 · Demo payment</span>
                              </div>
                              <button
                                className="provider-button"
                                data-action="confirm_booking"
                                data-provider={provider}
                                onClick={() => {
                                  if (
                                    app.selected &&
                                    app.pickup &&
                                    app.destination
                                  )
                                    onConfirm(
                                      app.selected,
                                      app.pickup,
                                      app.destination,
                                    );
                                }}
                              >
                                Confirm and request
                              </button>
                              <p className="provider-demo-note">
                                Simulation only. You won’t be charged.
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  {(app.stage === "activity" || app.stage === "account") && (
                    <div className="provider-secondary">
                      <button
                        className="provider-back"
                        aria-label="Back to app home"
                        data-action="provider_back_home"
                        onClick={() => update({ stage: "home" })}
                      >
                        <ArrowLeft size={22} />
                      </button>
                      <h2>
                        {app.stage === "activity" ? "Activity" : "Your account"}
                      </h2>
                      {app.stage === "activity" ? (
                        <>
                          <Clock3 size={38} />
                          <h3>No past rides yet</h3>
                          <p>
                            Your simulated bookings are saved in the Research
                            lab.
                          </p>
                        </>
                      ) : (
                        <>
                          <span className="demo-avatar">P</span>
                          <h3>Demo rider</h3>
                          <p>Personal account</p>
                          <div className="demo-account-row">
                            <CreditCard size={21} />
                            <span>
                              Visa ending in 4242
                              <small>Demo payment · No charges</small>
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )
            )}
            <div className="home-indicator" />
          </div>
          <div className="phone-caption">
            <span /> Selected booking flows recreated for research
          </div>
        </div>
      </div>
    </main>
  );
}
function CheckPin() {
  return <span className="check-pin">✓</span>;
}

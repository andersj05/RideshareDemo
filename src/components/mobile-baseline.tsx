"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Clock3,
  Home,
  MapPin,
  Search,
  User,
  Check,
} from "lucide-react";
import {
  DEFAULT_PICKUP,
  PLACES,
  availableOffers,
  generateOffers,
  money,
  type Offer,
  type Place,
  type Settings,
} from "@/lib/simulation";
import { PlaceField } from "./place-field";
import { MobileHeader, ProviderConfirmation, RideMap } from "./mobile-shell";
import { ProviderMark, Vehicle } from "./visuals";

type Brand = "Uber" | "Lyft";
type AppState = {
  stage: "home" | "search" | "loading" | "rides" | "confirm";
  pickup: Place | null;
  destination: Place | null;
  selected: Offer | null;
};
const initial = (): AppState => ({
  stage: "home",
  pickup: DEFAULT_PICKUP,
  destination: null,
  selected: null,
});

export function MobileBaseline({
  settings,
  taskDestination,
  onInput,
  onContext,
  onConfirm,
}: {
  settings: Settings;
  taskDestination: Place;
  onInput: (value: string) => void;
  onContext: (pickup: Place, destination: Place) => void;
  onConfirm: (offer: Offer, pickup: Place, destination: Place) => void;
}) {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [apps, setApps] = useState<Record<Brand, AppState>>({
    Uber: initial(),
    Lyft: initial(),
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function update(provider: Brand, patch: Partial<AppState>) {
    setApps((old) => ({ ...old, [provider]: { ...old[provider], ...patch } }));
  }
  function open(provider: Brand) {
    setBrand(provider);
    const app = apps[provider];
    if (app.pickup && app.destination) onContext(app.pickup, app.destination);
  }
  if (!brand)
    return (
      <section
        className="mobile-app app-launcher"
        aria-label="Rideshare app switcher"
      >
        <MobileHeader title="Rideshare apps" />
        <div className="app-scroll app-padding">
          <h2>Choose an app</h2>
          <p className="muted">Check fares and book a ride.</p>
          <div className="app-icons">
            {(["Uber", "Lyft"] as const).map((provider) => (
              <button
                key={provider}
                data-action="open_provider_app"
                data-provider={provider}
                onClick={() => open(provider)}
              >
                <span className={`app-icon ${provider.toLowerCase()}`}>
                  <ProviderMark provider={provider} />
                </span>
                <strong>{provider}</strong>
                {apps[provider].destination && <small>Trip saved</small>}
              </button>
            ))}
          </div>
          <div className="info-message">
            Use the Apps button to switch between Uber and Lyft. Each app keeps
            its own trip details.
          </div>
        </div>
        <p className="simulation-caption">Simulated apps · no real bookings</p>
      </section>
    );
  const state = apps[brand];
  const pickup = state.pickup || DEFAULT_PICKUP;
  const destination = state.destination || taskDestination;
  const offers = availableOffers(
    generateOffers(settings, pickup, destination),
    "baseline",
    "matched",
  ).filter((o) => o.provider === brand);
  const recent = [
    taskDestination,
    ...PLACES.filter(
      (p) => p.id !== taskDestination.id && p.id !== DEFAULT_PICKUP.id,
    ),
  ].slice(0, 3);
  function search() {
    if (
      !state.pickup ||
      !state.destination ||
      state.pickup.id === state.destination.id
    )
      return;
    onContext(state.pickup, state.destination);
    update(brand!, { stage: "loading", selected: null });
    timer.current = setTimeout(() => update(brand!, { stage: "rides" }), 650);
  }
  if (state.stage === "confirm" && state.selected)
    return (
      <div className="provider-container" data-provider={brand}>
        <ProviderConfirmation
          offer={state.selected}
          pickup={pickup}
          destination={destination}
          onBack={() => update(brand, { stage: "rides" })}
          onSwitch={() => setBrand(null)}
          onConfirm={() => onConfirm(state.selected!, pickup, destination)}
        />
      </div>
    );
  return (
    <section
      className={`mobile-app provider-${brand.toLowerCase()}`}
      data-provider={brand}
      aria-label={`${brand} prototype`}
    >
      <MobileHeader
        title={<ProviderMark provider={brand} />}
        back={
          state.stage !== "home"
            ? () =>
                update(brand, {
                  stage: state.stage === "rides" ? "search" : "home",
                })
            : undefined
        }
        switchApps={() => setBrand(null)}
      />
      {state.stage === "home" ? (
        <>
          <div className="app-scroll">
            <RideMap pickup={pickup} destination={taskDestination} />
            <div className="app-padding">
              <h2>
                {brand === "Uber" ? "Go anywhere" : "Where are you going?"}
              </h2>
              <button
                className="where-to"
                data-action="open_destination_search"
                onClick={() => update(brand, { stage: "search" })}
              >
                <Search size={22} />
                <strong>
                  {brand === "Uber" ? "Where to?" : "Search destination"}
                </strong>
                <ArrowRight size={20} />
              </button>
              <div className="saved-place">
                <Clock3 size={20} />
                <div>
                  <strong>{taskDestination.name}</strong>
                  <span>{taskDestination.address}</span>
                </div>
              </div>
              <h3>{brand === "Uber" ? "Suggestions" : "Your next ride"}</h3>
              <button
                className="ride-shortcut"
                data-action="open_ride_search"
                onClick={() => update(brand, { stage: "search" })}
              >
                <Vehicle />
                <span>Ride</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
          <div className="provider-nav">
            <span className="active">
              <Home size={21} />
              Home
            </span>
            <span>
              <Clock3 size={21} />
              Activity
            </span>
            <span>
              <User size={21} />
              Account
            </span>
          </div>
        </>
      ) : state.stage === "search" || state.stage === "loading" ? (
        <>
          <div className="app-scroll app-padding">
            <h2>{brand === "Uber" ? "Plan your ride" : "Where to?"}</h2>
            <div className="location-form">
              <PlaceField
                label="Pickup"
                place={state.pickup}
                placeholder="Pickup location"
                onChange={(p) => update(brand, { pickup: p })}
                onInput={onInput}
              />
              <PlaceField
                label="Destination"
                place={state.destination}
                placeholder="Enter destination"
                destination
                onChange={(p) => update(brand, { destination: p })}
                onInput={onInput}
              />
            </div>
            <div className="trip-meta">
              <Clock3 size={15} />
              Leave now <span>For me</span>
            </div>
            {state.pickup?.id === state.destination?.id &&
              state.destination && (
                <p className="field-error">Choose a different destination.</p>
              )}
            <h3>Recent destinations</h3>
            <div className="destination-list">
              {recent.map((p) => (
                <button
                  key={p.id}
                  data-action="choose_suggested_destination"
                  data-detail={p.name}
                  onClick={() => update(brand, { destination: p })}
                >
                  <MapPin size={20} />
                  <span>
                    <strong>{p.name}</strong>
                    <small>{p.address}</small>
                  </span>
                  <ArrowRight size={17} />
                </button>
              ))}
            </div>
          </div>
          <div className="app-bottom">
            <button
              className="primary provider-primary"
              disabled={
                !state.pickup ||
                !state.destination ||
                state.pickup.id === state.destination.id ||
                state.stage === "loading"
              }
              data-action="search_provider_rides"
              onClick={search}
            >
              {state.stage === "loading" ? "Finding rides…" : "See rides"}
            </button>
          </div>
        </>
      ) : (
        <>
          <RideMap pickup={pickup} destination={destination} />
          <div className="ride-list-heading">
            <h2>{brand === "Uber" ? "Choose a ride" : "Choose your ride"}</h2>
            <p>{destination.name}</p>
          </div>
          <div className="app-scroll quote-scroll">
            <div
              className="quote-list"
              role="radiogroup"
              aria-label={`${brand} rides`}
            >
              {offers.map((offer) => (
                <button
                  role="radio"
                  aria-checked={state.selected?.id === offer.id}
                  key={offer.id}
                  className={`quote-row ${state.selected?.id === offer.id ? "selected" : ""}`}
                  data-action="select_ride"
                  data-detail={offer.id}
                  onClick={() => update(brand, { selected: offer })}
                >
                  <Vehicle
                    provider={offer.provider}
                    electric={offer.powertrain === "EV"}
                  />
                  <span className="quote-body">
                    <span className="quote-heading">
                      <strong>{offer.name}</strong>
                      <strong>{money(offer.price)}</strong>
                    </span>
                    <span>
                      {offer.pickup} min away · {offer.seats} seats
                    </span>
                    <small>{offer.description}</small>
                    <small>
                      {offer.powertrain} · {offer.emissions.toFixed(2)} kg CO₂
                    </small>
                  </span>
                  <span className="radio-dot">
                    {state.selected?.id === offer.id && <Check size={12} />}
                  </span>
                </button>
              ))}
            </div>
            <p className="quote-footnote">
              Upfront fare includes estimated fees.
            </p>
          </div>
          <div className="app-bottom">
            <div className="payment-inline">
              Visa •••• 4242 <span>Personal</span>
            </div>
            <button
              className="primary provider-primary"
              disabled={!state.selected}
              data-action="request_provider_ride"
              onClick={() => update(brand, { stage: "confirm" })}
            >
              {state.selected
                ? `${brand === "Uber" ? "Choose" : "Select"} ${state.selected.name}`
                : "Select a ride"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

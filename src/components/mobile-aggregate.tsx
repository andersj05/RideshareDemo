"use client";
import { ArrowRight, Check, Clock3, Leaf, MapPin } from "lucide-react";
import { PlaceField } from "./place-field";
import { MobileHeader, RideMap } from "./mobile-shell";
import { Vehicle } from "./visuals";
import {
  DEFAULT_PICKUP,
  PLACES,
  money,
  rideLabel,
  sortOffers,
  type Offer,
  type Place,
  type Priority,
} from "@/lib/simulation";

export type AggregateStage = "search" | "loading" | "results";
export function MobileAggregate({
  pickup,
  destination,
  setPickup,
  setDestination,
  taskDestination,
  stage,
  offers,
  priority,
  setPriority,
  selected,
  setSelected,
  greenOnly,
  setGreenOnly,
  onSearch,
  onEdit,
  onContinue,
  onInput,
}: {
  pickup: Place | null;
  destination: Place | null;
  setPickup: (p: Place | null) => void;
  setDestination: (p: Place | null) => void;
  taskDestination: Place;
  stage: AggregateStage;
  offers: Offer[];
  priority: Priority;
  setPriority: (p: Priority) => void;
  selected: Offer | null;
  setSelected: (o: Offer) => void;
  greenOnly: boolean;
  setGreenOnly: (b: boolean) => void;
  onSearch: () => void;
  onEdit: () => void;
  onContinue: () => void;
  onInput: (s: string) => void;
}) {
  const visible = sortOffers(
    greenOnly ? offers.filter((o) => o.powertrain !== "Gas") : offers,
    priority,
  );
  const lowest = Math.min(...offers.map((o) => o.price));
  const fastest = Math.min(...offers.map((o) => o.pickup));
  const recent = [
    taskDestination,
    ...PLACES.filter((p) => p.id !== taskDestination.id && p.id !== "hayes"),
  ].slice(0, 3);
  return (
    <section
      className="mobile-app aggregator"
      aria-label="Aggregator prototype"
    >
      <MobileHeader
        title={stage === "results" ? "Choose a ride" : "Compare rides"}
        back={stage === "results" ? onEdit : undefined}
      />
      {stage !== "results" ? (
        <>
          <div className="app-scroll">
            <RideMap
              pickup={pickup || DEFAULT_PICKUP}
              destination={destination || taskDestination}
            />
            <div className="app-padding">
              <h2>Where to?</h2>
              <div className="location-form">
                <PlaceField
                  label="Pickup"
                  place={pickup}
                  onChange={setPickup}
                  placeholder="Enter pickup"
                  onInput={onInput}
                />
                <PlaceField
                  label="Destination"
                  place={destination}
                  onChange={setDestination}
                  placeholder="Enter destination"
                  destination
                  onInput={onInput}
                />
              </div>
              <div className="trip-meta">
                <Clock3 size={16} />
                Leave now<span>1–4 riders</span>
              </div>
              {pickup && destination && pickup.id === destination.id && (
                <p className="field-error">
                  Pickup and destination must be different.
                </p>
              )}
              <h3 className="list-label">Suggested destinations</h3>
              <div className="destination-list">
                {recent.map((p) => (
                  <button
                    key={p.id}
                    data-action="choose_suggested_destination"
                    data-detail={p.name}
                    onClick={() => setDestination(p)}
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
          </div>
          <div className="app-bottom">
            <button
              className="primary"
              data-action="compare_rides"
              disabled={
                !pickup ||
                !destination ||
                pickup.id === destination.id ||
                stage === "loading"
              }
              onClick={onSearch}
            >
              {stage === "loading" ? (
                <>
                  <span className="spinner" />
                  Finding rides…
                </>
              ) : (
                "Compare rides"
              )}
            </button>
            <p>
              {new Set(offers.map((o) => o.provider)).size} providers ·
              Simulated fares
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="comparison-controls">
            <button
              className="route-summary"
              data-action="edit_route"
              onClick={onEdit}
            >
              <MapPin size={18} />
              <span>
                <strong>{destination?.name}</strong>
                <small>From {pickup?.name}</small>
              </span>
              <span className="edit-label">Edit</span>
            </button>
            <div className="segmented" aria-label="Sort rides">
              {(
                [
                  { key: "price", text: "Price" },
                  { key: "pickup", text: "Pickup time" },
                  { key: "emissions", text: "CO₂" },
                ] as const
              ).map((p) => (
                <button
                  key={p.key}
                  aria-pressed={priority === p.key}
                  className={priority === p.key ? "active" : ""}
                  data-action={`sort_${p.key}`}
                  onClick={() => setPriority(p.key)}
                >
                  {p.text}
                </button>
              ))}
            </div>
            <div className="ride-filter">
              <span>{visible.length} rides available</span>
              <label>
                <input
                  type="checkbox"
                  checked={greenOnly}
                  data-action="toggle_green_filter"
                  onChange={(e) => setGreenOnly(e.target.checked)}
                />
                EV / hybrid only
              </label>
            </div>
          </div>
          <div className="app-scroll quote-scroll">
            <div
              className="quote-list"
              role="radiogroup"
              aria-label="Available rides"
            >
              {visible.map((o) => (
                <button
                  role="radio"
                  aria-checked={selected?.id === o.id}
                  className={`quote-row ${selected?.id === o.id ? "selected" : ""}`}
                  data-action="select_ride"
                  data-provider={o.provider}
                  data-detail={o.id}
                  key={o.id}
                  onClick={() => setSelected(o)}
                >
                  <Vehicle
                    provider={o.provider}
                    electric={o.powertrain === "EV"}
                  />
                  <span className="quote-body">
                    <span className="quote-heading">
                      <strong>{rideLabel(o)}</strong>
                      <b>{money(o.price)}</b>
                    </span>
                    <span className="quote-time">
                      {o.pickup} min pickup · {o.duration} min trip
                    </span>
                    <span className="quote-co2">
                      {o.powertrain !== "Gas" && <Leaf size={13} />}{" "}
                      {o.powertrain} · {o.emissions.toFixed(1)} kg CO₂
                    </span>
                    <span className="quote-badges">
                      {o.price === lowest && <span>Lowest price</span>}
                      {o.pickup === fastest && <span>Fastest</span>}
                      {o.emissions === 0 && <span>Zero tailpipe CO₂</span>}
                    </span>
                  </span>
                  <span className="radio-indicator">
                    {selected?.id === o.id && <Check size={12} />}
                  </span>
                </button>
              ))}
            </div>
            <p className="quote-footnote">
              Fares include simulated fees. CO₂ is a tailpipe estimate.
            </p>
          </div>
          <div className="app-bottom">
            <button
              className="primary"
              data-action="continue_to_provider"
              disabled={!selected}
              onClick={onContinue}
            >
              {selected
                ? `Continue with ${selected.provider} · ${money(selected.price)}`
                : "Select a ride"}
            </button>
            <p>Confirm once in the provider app.</p>
          </div>
        </>
      )}
    </section>
  );
}

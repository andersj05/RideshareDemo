"use client";

import {
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Leaf,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import {
  DEFAULT_DESTINATION,
  PLACES,
  money,
  routeInfo,
  sortOffers,
  type Offer,
  type Place,
  type Priority,
} from "@/lib/simulation";
import { PlaceField } from "./place-field";
import { CityMap, ProviderMark, Vehicle } from "./visuals";

export type AggregateStage = "search" | "loading" | "results";
export function Aggregate({
  pickup,
  destination,
  setPickup,
  setDestination,
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
  pool,
}: {
  pickup: Place | null;
  destination: Place | null;
  setPickup: (p: Place | null) => void;
  setDestination: (p: Place | null) => void;
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
  pool: "all" | "matched";
}) {
  const results = stage === "results";
  const visible = sortOffers(
    greenOnly ? offers.filter((o) => o.powertrain !== "Gas") : offers,
    priority,
  );
  const cheapest = Math.min(...offers.map((o) => o.price));
  const fastest = Math.min(...offers.map((o) => o.pickup));
  const cleanest = Math.min(...offers.map((o) => o.emissions));
  const info = pickup && destination ? routeInfo(pickup, destination) : null;
  const canSearch = !!pickup && !!destination && pickup.id !== destination.id;
  return (
    <main className={`aggregate-layout ${results ? "showing-results" : ""}`}>
      <section className="ride-panel" aria-label="Find a ride">
        <div className="panel-content">
          {!results ? (
            <>
              <div className="search-intro">
                <span className="eyebrow">
                  <span className="tiny-line" /> EVERY WAY, IN ONE PLACE
                </span>
                <h1>
                  A better way
                  <br />
                  to get <span>there.</span>
                </h1>
                <p>
                  Your ride. Your priorities.
                  <br />
                  All the options, without the app hopping.
                </p>
              </div>
              <div className="trip-form">
                <div className="route-fields">
                  <PlaceField
                    label="PICKUP"
                    place={pickup}
                    onChange={setPickup}
                    placeholder="Where from?"
                    onInput={onInput}
                  />
                  <div className="route-connector" />
                  <PlaceField
                    label="DESTINATION"
                    place={destination}
                    onChange={setDestination}
                    placeholder="Where are you headed?"
                    destination
                    onInput={onInput}
                  />
                  <button
                    className="swap-locations"
                    aria-label="Swap pickup and destination"
                    data-action="swap_locations"
                    onClick={() => {
                      setPickup(destination);
                      setDestination(pickup);
                    }}
                  >
                    <ArrowDownUp size={15} />
                  </button>
                </div>
                <div className="trip-context">
                  <span>
                    <Clock3 size={14} />
                    Leave now
                  </span>
                  <span>
                    <Users size={14} />
                    Up to 4 riders
                  </span>
                </div>
                <button
                  className="primary-button search-button"
                  data-action="compare_rides"
                  disabled={!canSearch || stage === "loading"}
                  onClick={onSearch}
                >
                  {stage === "loading" ? (
                    <>
                      <span className="spinner" />
                      Finding your best ride
                    </>
                  ) : (
                    <>
                      Compare rides <ArrowRight size={19} />
                    </>
                  )}
                </button>
                {pickup && destination && pickup.id === destination.id && (
                  <p className="field-error">
                    Choose a destination different from your pickup.
                  </p>
                )}
              </div>
              <div className="recent-places">
                <div className="section-heading">
                  <h3>Around the corner. Across the city.</h3>
                  <span>EXPLORE</span>
                </div>
                {[PLACES[1], PLACES[2], PLACES[3]].map((p, i) => (
                  <button
                    key={p.id}
                    data-action="choose_suggested_destination"
                    onClick={() => setDestination(p)}
                  >
                    <span className="place-icon">
                      {i === 2 ? (
                        <span className="plane-symbol">↗</span>
                      ) : i === 1 ? (
                        <Leaf size={18} />
                      ) : (
                        <MapPin size={18} />
                      )}
                    </span>
                    <span>
                      <strong>{p.name}</strong>
                      <small>{p.address}</small>
                    </span>
                    <ArrowRight size={16} />
                  </button>
                ))}
              </div>
              <div className="provider-footer">
                <p>ONE SEARCH. YOUR FAVORITE RIDES.</p>
                <div>
                  <ProviderMark provider="Uber" />
                  <ProviderMark provider="Lyft" />
                  {pool === "all" && (
                    <>
                      <ProviderMark provider="Waymo" />
                      <ProviderMark provider="Curb" />
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="results-top">
                <button
                  className="text-button"
                  data-action="edit_trip"
                  onClick={onEdit}
                >
                  <ArrowLeft size={16} />
                  Your trip
                </button>
                <span className="fresh-quotes">
                  <span className="live-dot" />
                  Fares ready
                </span>
              </div>
              <h1 className="results-title">
                One trip.
                <br /> <span>Every possibility.</span>
              </h1>
              <button
                className="compact-route"
                data-action="edit_route"
                onClick={onEdit}
              >
                <span className="mini-route">
                  <i />
                  <b />
                  <i />
                </span>
                <span>
                  <strong>{pickup?.name}</strong>
                  <strong>{destination?.name}</strong>
                </span>
                <span className="route-edit">
                  Edit <ChevronRight size={13} />
                </span>
              </button>
              <div className="priority-heading">
                <span>WHAT MATTERS TO YOU?</span>
                <span>{offers.length} rides</span>
              </div>
              <div className="priority-tabs" aria-label="Sort rides">
                {(
                  [
                    { key: "price", label: "Best price", icon: Sparkles },
                    { key: "pickup", label: "Fastest", icon: Zap },
                    { key: "emissions", label: "Greenest", icon: Leaf },
                  ] as const
                ).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    className={priority === key ? "active" : ""}
                    aria-pressed={priority === key}
                    data-action={`sort_${key}`}
                    onClick={() => setPriority(key)}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
              <div className="ride-list-heading">
                <span>YOUR OPTIONS</span>
                <button
                  className={`green-filter ${greenOnly ? "active" : ""}`}
                  aria-pressed={greenOnly}
                  data-action="toggle_green_filter"
                  onClick={() => setGreenOnly(!greenOnly)}
                >
                  <span className="mini-checkbox">
                    {greenOnly && <Check size={10} />}
                  </span>
                  EV & hybrid only
                </button>
              </div>
              <div className="ride-options" aria-label="Available rides">
                {visible.map((offer) => {
                  const isSelected = selected?.id === offer.id;
                  const badge =
                    offer.price === cheapest
                      ? "Best price"
                      : offer.pickup === fastest
                        ? "Fastest pickup"
                        : offer.emissions === cleanest
                          ? "Zero tailpipe CO₂"
                          : null;
                  return (
                    <button
                      className={`ride-option ${isSelected ? "selected" : ""}`}
                      key={offer.id}
                      aria-pressed={isSelected}
                      data-action="select_ride"
                      data-provider={offer.provider}
                      onClick={() => setSelected(offer)}
                    >
                      <span className="ride-vehicle">
                        <Vehicle
                          provider={offer.provider}
                          electric={offer.powertrain === "EV"}
                        />
                      </span>
                      <span className="ride-description">
                        <span className="ride-name">
                          {offer.name.startsWith(offer.provider)
                            ? offer.name
                            : `${offer.provider} ${offer.name.replace(`${offer.provider} `, "")}`}
                          <span className="powertrain">
                            {offer.powertrain !== "Gas" && <Leaf size={10} />}
                          </span>
                        </span>
                        <span className="ride-time">
                          {offer.pickup} min away <span>·</span>{" "}
                          {offer.duration} min trip
                        </span>
                        <span className="ride-emissions">
                          {offer.powertrain} <span>·</span>{" "}
                          {offer.emissions.toFixed(1)} kg CO₂
                        </span>
                        {badge && (
                          <span
                            className={`ride-badge ${badge === "Fastest pickup" ? "fastest" : ""}`}
                          >
                            {badge === "Best price" ? (
                              <Sparkles size={10} />
                            ) : badge === "Fastest pickup" ? (
                              <Zap size={10} />
                            ) : (
                              <Leaf size={10} />
                            )}{" "}
                            {badge}
                          </span>
                        )}
                        {offer.pickup === fastest &&
                          badge !== "Fastest pickup" && (
                            <span className="fastest-inline">
                              <Zap size={9} />
                              Fastest pickup
                            </span>
                          )}
                      </span>
                      <span className="ride-price">
                        <strong>{money(offer.price)}</strong>
                        <small>all-in fare</small>
                        <span className="selection-circle">
                          {isSelected && <Check size={11} />}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="emissions-note">
                <Leaf size={12} />
                CO₂ estimates reflect simulated tailpipe emissions.
              </p>
            </>
          )}
        </div>
        {results && (
          <div className="booking-bar">
            <div>
              <ShieldCheck size={15} />
              <span>Your trip details carry over. Just confirm.</span>
            </div>
            <button
              className="primary-button"
              data-action="continue_to_provider"
              disabled={!selected}
              onClick={onContinue}
            >
              Continue with {selected?.provider || "a ride"}
              <span>
                {selected && money(selected.price)} <ArrowRight size={17} />
              </span>
            </button>
          </div>
        )}
      </section>
      <section className="map-panel" aria-label="Trip map">
        <CityMap
          pickup={pickup || PLACES[0]}
          destination={destination || DEFAULT_DESTINATION}
          active={results}
        />
        {!results ? (
          <>
            <div className="map-story">
              <span className="map-story-kicker">
                LESS SEARCHING. MORE LIVING.
              </span>
              <h2>
                Good things
                <br />
                are a ride away<span>.</span>
              </h2>
              <p>Find the fare that feels right.</p>
              <span className="story-line" />
            </div>
            <div className="map-bottom-card">
              <span className="card-spark">
                <Sparkles size={21} />
              </span>
              <div>
                <strong>A little comparison goes a long way.</strong>
                <p>Price, pickup time, or a lighter footprint. You choose.</p>
              </div>
              <span className="card-counter">01 — 04</span>
            </div>
          </>
        ) : (
          <>
            <div className="trip-map-card">
              <span className="eyebrow">YOUR ROUTE</span>
              <strong>
                {pickup?.short}
                <ArrowRight size={18} />
                {destination?.short}
              </strong>
              <p>
                {info?.distance} miles <span>·</span> About {info?.duration} min{" "}
                <span>·</span> San Francisco
              </p>
            </div>
            <div className="selected-map-card">
              <div className="selected-map-header">
                <span>YOUR RIDE, YOUR CALL.</span>
                <Leaf size={17} />
              </div>
              {selected && (
                <>
                  <div className="selected-map-body">
                    <div>
                      <ProviderMark provider={selected.provider} />
                      <h3>{selected.name}</h3>
                      <p>{selected.description}</p>
                    </div>
                    <Vehicle
                      provider={selected.provider}
                      electric={selected.powertrain === "EV"}
                      large
                    />
                  </div>
                  <div className="selected-map-stats">
                    <div>
                      <strong>{money(selected.price)}</strong>
                      <span>Upfront price</span>
                    </div>
                    <div>
                      <strong>
                        {selected.pickup}
                        <small> min</small>
                      </strong>
                      <span>Pickup time</span>
                    </div>
                    <div>
                      <strong>
                        {selected.emissions.toFixed(1)}
                        <small> kg</small>
                      </strong>
                      <span>Tailpipe CO₂</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

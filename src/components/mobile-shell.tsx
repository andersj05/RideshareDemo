"use client";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Grid2X2,
  MapPin,
} from "lucide-react";
import { CityMap, ProviderMark, Vehicle } from "./visuals";
import {
  money,
  rideLabel,
  type Offer,
  type Place,
  type Session,
} from "@/lib/simulation";

export function MobileHeader({
  title,
  back,
  switchApps,
}: {
  title: React.ReactNode;
  back?: () => void;
  switchApps?: () => void;
}) {
  return (
    <div className="mobile-header">
      {back && (
        <button
          className="icon-button"
          aria-label="Back"
          data-action="back"
          onClick={back}
        >
          <ArrowLeft size={22} />
        </button>
      )}
      <div className="mobile-title">{title}</div>
      {switchApps && (
        <button
          className="switch-apps"
          data-action="open_app_switcher"
          onClick={switchApps}
        >
          <Grid2X2 size={18} />
          <span>Apps</span>
        </button>
      )}
    </div>
  );
}

export function RideMap({
  pickup,
  destination,
}: {
  pickup: Place;
  destination: Place;
}) {
  return (
    <div className="ride-map">
      <CityMap pickup={pickup} destination={destination} minimal active />
      <span className="map-note">Simulated map</span>
    </div>
  );
}

export function ProviderConfirmation({
  offer,
  pickup,
  destination,
  onBack,
  onConfirm,
  onSwitch,
  handoff = false,
}: {
  offer: Offer;
  pickup: Place;
  destination: Place;
  onBack: () => void;
  onConfirm: () => void;
  onSwitch?: () => void;
  handoff?: boolean;
}) {
  return (
    <section
      className={`mobile-app provider-${offer.provider.toLowerCase()}`}
      aria-label={`${offer.provider} confirmation`}
    >
      <MobileHeader
        title={<ProviderMark provider={offer.provider} />}
        back={onBack}
        switchApps={onSwitch}
      />
      <div className="app-scroll">
        <RideMap pickup={pickup} destination={destination} />
        <div className="app-padding">
          <h2>Confirm your ride</h2>
          {handoff && (
            <div className="info-message">
              <CheckCircle2 size={17} />
              Your trip details have been filled in.
            </div>
          )}
          <div className="confirmation-ride">
            <Vehicle
              provider={offer.provider}
              electric={offer.powertrain === "EV"}
            />
            <div>
              <strong>{rideLabel(offer)}</strong>
              <span>
                {offer.pickup} min away · {offer.seats} seats
              </span>
            </div>
            <strong>{money(offer.price)}</strong>
          </div>
          <div className="itinerary">
            <div>
              <span className="route-dot" />
              <div>
                <span>Pickup</span>
                <strong>{pickup.name}</strong>
                <small>{pickup.address}</small>
              </div>
            </div>
            <div>
              <span className="route-dot square" />
              <div>
                <span>Destination</span>
                <strong>{destination.name}</strong>
                <small>{destination.address}</small>
              </div>
            </div>
          </div>
          <div className="payment-row">
            <CreditCard size={20} />
            <div>
              <strong>Visa •••• 4242</strong>
              <span>Demo payment method</span>
            </div>
          </div>
        </div>
      </div>
      <div className="app-bottom">
        <button
          className="primary provider-primary"
          data-action="confirm_booking"
          data-provider={offer.provider}
          data-detail={offer.id}
          onClick={onConfirm}
        >
          Confirm request · {money(offer.price)}
        </button>
        <p>No real ride or payment will be made.</p>
      </div>
    </section>
  );
}

export function BookingComplete({
  session,
  onNew,
  onResults,
  participant,
}: {
  session: Session;
  onNew: () => void;
  onResults: () => void;
  participant: boolean;
}) {
  return (
    <section className="mobile-app" aria-label="Booking complete">
      <MobileHeader title="Booking complete" />
      <div className="app-scroll">
        <div className="completion">
          <CheckCircle2 size={48} />
          <h2>Ride confirmed</h2>
          <p>
            You’ve finished the task.
            <br />
            This was a simulated booking.
          </p>
          <div className="confirmation-ride">
            <Vehicle
              provider={session.selected!.provider}
              electric={session.selected!.powertrain === "EV"}
            />
            <div>
              <strong>{rideLabel(session.selected!)}</strong>
              <span>{session.selected!.pickup} min away</span>
            </div>
            <strong>{money(session.selected!.price)}</strong>
          </div>
          <div className="completion-route">
            <MapPin size={18} />
            <div>
              {session.pickup}
              <span>to {session.destination}</span>
            </div>
          </div>
          {!participant && (
            <div className="completion-summary">
              <div>
                <strong>{session.clicks}</strong>
                <span>Clicks</span>
              </div>
              <div>
                <strong>{session.elapsedSeconds.toFixed(1)}s</strong>
                <span>Time</span>
              </div>
              <div>
                <strong>{session.bookedCheapest ? "Yes" : "No"}</strong>
                <span>Cheapest fare</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="app-bottom">
        <button className="primary" onClick={onNew}>
          Next test
        </button>
        {!participant && (
          <button className="secondary full" onClick={onResults}>
            View session results
          </button>
        )}
        <p>Session saved on this device.</p>
      </div>
    </section>
  );
}

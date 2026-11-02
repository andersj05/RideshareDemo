"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpLeft, MapPin, Navigation, X } from "lucide-react";
import { DEFAULT_PICKUP, PLACES, type Place } from "@/lib/simulation";

export function PlaceField({
  label,
  place,
  onChange,
  placeholder,
  destination = false,
  onInput,
}: {
  label: string;
  place: Place | null;
  onChange: (place: Place | null) => void;
  placeholder: string;
  destination?: boolean;
  onInput?: (value: string) => void;
}) {
  const [query, setQuery] = useState(place?.name || "");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const preserveDraft = useRef(false);
  const id = useId();
  useEffect(() => {
    if (preserveDraft.current) {
      preserveDraft.current = false;
      return;
    }
    setQuery(place?.name || "");
  }, [place]);
  useEffect(() => {
    function outside(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  const search = query === place?.name ? "" : query;
  const matches = PLACES.filter((p) =>
    `${p.name} ${p.address}`.toLowerCase().includes(search.toLowerCase()),
  ).slice(0, 5);
  const custom: Place = {
    id: `custom-${query.trim().toLowerCase()}`,
    name: query.trim(),
    address: "Custom simulated location · San Francisco",
    short: query.trim().slice(0, 18),
    x: destination ? 650 : 300,
    y: destination ? 320 : 580,
  };
  const choices = matches.length
    ? matches
    : query.trim()
      ? [custom]
      : PLACES.slice(0, 5);
  function choose(p: Place) {
    onChange(p);
    setQuery(p.name);
    setOpen(false);
  }
  return (
    <div
      className={`place-field ${destination ? "destination" : "pickup"} ${open ? "focused" : ""}`}
      ref={ref}
    >
      <span className="route-node" />
      <div className="place-input-wrap">
        <label htmlFor={id}>{label}</label>
        <input
          ref={input}
          id={id}
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={open ? `${id}-option-${highlight}` : undefined}
          data-action={destination ? "destination_input" : "pickup_input"}
          onFocus={() => {
            setOpen(true);
            setHighlight(0);
            input.current?.select();
          }}
          onChange={(e) => {
            const value = e.target.value;
            if (place !== null) preserveDraft.current = true;
            onChange(null);
            setQuery(value);
            setOpen(true);
            setHighlight(0);
            onInput?.(value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setHighlight((n) => Math.min(n + 1, choices.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((n) => Math.max(0, n - 1));
            }
            if (e.key === "Enter" && open) {
              e.preventDefault();
              document.getElementById(`${id}-option-${highlight}`)?.click();
            }
          }}
        />
      </div>
      {query ? (
        <button
          className="field-clear"
          aria-label={`Clear ${label.toLowerCase()}`}
          data-action={`clear_${destination ? "destination" : "pickup"}`}
          onClick={() => {
            onChange(null);
            setQuery("");
            input.current?.focus();
          }}
        >
          <X size={15} />
        </button>
      ) : (
        !destination && (
          <button
            className="field-clear"
            aria-label="Use simulated current location"
            data-action="use_current_location"
            onClick={() => choose(DEFAULT_PICKUP)}
          >
            <Navigation size={16} />
          </button>
        )
      )}
      {open && (
        <div
          className="place-options"
          id={`${id}-list`}
          role="listbox"
          aria-label={`${label} suggestions`}
        >
          <div className="suggestion-label">
            {search ? "MATCHING PLACES" : "PLACES NEAR YOU"}
          </div>
          {choices.map((p, i) => (
            <button
              key={p.id}
              id={`${id}-option-${i}`}
              role="option"
              aria-selected={i === highlight}
              className={i === highlight ? "highlight" : ""}
              data-action={`select_${destination ? "destination" : "pickup"}`}
              data-detail={p.name}
              onClick={() => choose(p)}
            >
              <span className="suggestion-pin">
                <MapPin size={16} />
              </span>
              <span>
                <strong>{p.name}</strong>
                <small>{p.address}</small>
              </span>
              <ArrowUpLeft size={15} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

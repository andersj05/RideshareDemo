"use client";

import { useEffect, useRef, useState } from "react";
import {
  bookingMetrics,
  DESIGN_VERSION,
  DEFAULT_PICKUP,
  PLACES,
  taskSucceeded,
  type Mode,
  type Offer,
  type Place,
  type Session,
  type Settings,
  type StudyEvent,
} from "./simulation";

const HISTORY_KEY = "fare-study-v1";
const ACTIVE_KEY = "fare-active-v1";
interface Active {
  designVersion?: string;
  id: string;
  started: number;
  mode: Mode;
  settings: Settings;
  events: StudyEvent[];
  viewport?: { width: number; height: number };
}
export function useStudy(settings: Settings, mode: Mode) {
  const active = useRef<Active | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [storageWarning, setStorageWarning] = useState(false);
  const [ready, setReady] = useState(false);
  const saved = useRef<Session[]>([]);

  function saveHistory(next: Session[]) {
    saved.current = next;
    setSessions(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      setStorageWarning(true);
    }
  }

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      const valid: Session[] = Array.isArray(stored)
        ? stored.filter(
            (s) =>
              s &&
              typeof s.id === "string" &&
              Array.isArray(s.events) &&
              Array.isArray(s.offers) &&
              typeof s.clicks === "number" &&
              ["completed", "abandoned"].includes(s.status) &&
              ["aggregate", "baseline"].includes(s.mode),
          )
        : [];
      const unfinished = JSON.parse(
        localStorage.getItem(ACTIVE_KEY) || "null",
      ) as Active | null;
      if (
        unfinished &&
        typeof unfinished.id === "string" &&
        typeof unfinished.started === "number" &&
        unfinished.settings &&
        Array.isArray(unfinished.events) &&
        !valid.some((s) => s.id === unfinished.id)
      ) {
        const lastMs = unfinished.events.at(-1)?.atMs || 0;
        valid.push({
          id: unfinished.id,
          participant: unfinished.settings.participant,
          mode: unfinished.mode,
          seed: unfinished.settings.seed,
          scenario: unfinished.settings.scenario,
          pool:
            unfinished.mode === "baseline"
              ? "matched"
              : unfinished.settings.pool,
          startedAt: new Date(unfinished.started).toISOString(),
          finishedAt: new Date(unfinished.started + lastMs).toISOString(),
          status: "abandoned",
          clicks: unfinished.events.filter((e) => e.kind === "click").length,
          elapsedSeconds: lastMs / 1000,
          pickup: "",
          destination: "",
          selected: null,
          cheapestPrice: null,
          bookedCheapest: null,
          greenEligible: null,
          choseGreen: null,
          premiumPaid: null,
          offers: [],
          events: [
            ...unfinished.events,
            {
              n: unfinished.events.length + 1,
              kind: "system",
              action: "reload_recovered_as_abandoned",
              atMs: lastMs,
            },
          ],
          designVersion: unfinished.designVersion,
          task: unfinished.settings.task || "cheapest",
          taskSuccess: null,
          intendedDestination:
            PLACES.find((p) => p.id === unfinished.settings.destinationId)
              ?.name || "Ferry Building",
          viewport: unfinished.viewport,
        });
      }
      saved.current = valid;
      setSessions(valid);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(valid));
      localStorage.removeItem(ACTIVE_KEY);
    } catch {
      setStorageWarning(true);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (active.current)
        setElapsed((Date.now() - active.current.started) / 1000);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  function record(
    action: string,
    kind: StudyEvent["kind"] = "click",
    detail?: string,
    provider?: Offer["provider"],
  ) {
    if (!ready) return;
    if (!active.current) {
      if (kind === "system") return;
      active.current = {
        designVersion: DESIGN_VERSION,
        id:
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
                byte.toString(16).padStart(2, "0"),
              ).join(""),
        started: Date.now(),
        mode,
        settings: { ...settings },
        events: [],
        viewport: {
          width:
            document.querySelector("[data-mobile-screen]")?.clientWidth ||
            window.innerWidth,
          height:
            document.querySelector("[data-mobile-screen]")?.clientHeight ||
            window.innerHeight,
        },
      };
      setElapsed(0);
    }
    const run = active.current;
    const event: StudyEvent = {
      n: run.events.length + 1,
      kind,
      action,
      atMs: Date.now() - run.started,
      ...(detail ? { detail } : {}),
      ...(provider ? { provider } : {}),
    };
    run.events.push(event);
    setEvents([...run.events]);
    try {
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(run));
    } catch {
      setStorageWarning(true);
    }
  }

  function finish(
    status: Session["status"],
    pickup: Place,
    destination: Place,
    offers: Offer[],
    selected: Offer | null = null,
    reason?: string,
  ) {
    const run = active.current;
    if (!run) return null;
    if (reason) record(reason, "system");
    const seconds = (Date.now() - run.started) / 1000;
    const session: Session = {
      id: run.id,
      participant: run.settings.participant,
      mode: run.mode,
      seed: run.settings.seed,
      scenario: run.settings.scenario,
      pool: run.mode === "baseline" ? "matched" : run.settings.pool,
      startedAt: new Date(run.started).toISOString(),
      finishedAt: new Date().toISOString(),
      status,
      clicks: run.events.filter((e) => e.kind === "click").length,
      elapsedSeconds: Math.round(seconds * 100) / 100,
      pickup: pickup.name,
      destination: destination.name,
      selected,
      offers: [...offers],
      events: [...run.events],
      designVersion: DESIGN_VERSION,
      task: run.settings.task || "cheapest",
      intendedDestination:
        PLACES.find((p) => p.id === (run.settings.destinationId || "ferry"))
          ?.name || "Ferry Building",
      taskSuccess: selected
        ? pickup.id !== DEFAULT_PICKUP.id
          ? false
          : taskSucceeded(
              run.settings.task || "cheapest",
              selected,
              offers,
              run.settings.destinationId || "ferry",
              destination.id,
            )
        : null,
      viewport: run.viewport,
      ...(selected
        ? bookingMetrics(selected, offers)
        : {
            cheapestPrice: null,
            bookedCheapest: null,
            greenEligible: null,
            choseGreen: null,
            premiumPaid: null,
          }),
    };
    saveHistory([...saved.current, session]);
    active.current = null;
    setElapsed(seconds);
    try {
      localStorage.removeItem(ACTIVE_KEY);
    } catch {
      setStorageWarning(true);
    }
    return session;
  }
  function resetView() {
    setEvents([]);
    setElapsed(0);
  }
  function clearHistory() {
    saveHistory([]);
  }
  return {
    sessions,
    events,
    elapsed,
    record,
    finish,
    resetView,
    clearHistory,
    storageWarning,
    ready,
    running: !!active.current,
  };
}

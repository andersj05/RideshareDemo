export type Provider = "Uber" | "Lyft" | "Waymo" | "Curb";
export type Mode = "aggregate" | "baseline";
export type Powertrain = "Gas" | "Hybrid" | "EV";
export type Priority = "price" | "pickup" | "emissions";
export type Scenario = "balanced" | "rush" | "green";
export type Pool = "all" | "matched";
export type TaskGoal = "cheapest" | "fastest" | "green";
export const DESIGN_VERSION = "mobile-lab-v2";
export const TASK_LABELS: Record<TaskGoal, string> = {
  cheapest: "Book the lowest-priced ride",
  fastest: "Book the ride with the shortest pickup wait",
  green: "Book an EV or hybrid at or below the cheapest gas fare",
};

export interface Place {
  id: string;
  name: string;
  address: string;
  short: string;
  x: number;
  y: number;
}
export const PLACES: Place[] = [
  {
    id: "hayes",
    name: "Patricia’s Green",
    address: "50 Fell St, Hayes Valley",
    short: "Hayes Valley",
    x: 282,
    y: 548,
  },
  {
    id: "ferry",
    name: "Ferry Building",
    address: "1 Ferry Building, Embarcadero",
    short: "Embarcadero",
    x: 728,
    y: 260,
  },
  {
    id: "dolores",
    name: "Dolores Park",
    address: "Dolores St & 19th St",
    short: "Mission District",
    x: 210,
    y: 780,
  },
  {
    id: "sfo",
    name: "San Francisco Airport",
    address: "SFO · Domestic terminals",
    short: "SFO Airport",
    x: 590,
    y: 860,
  },
  {
    id: "union",
    name: "Union Square",
    address: "333 Post St, San Francisco",
    short: "Union Square",
    x: 537,
    y: 377,
  },
  {
    id: "caltrain",
    name: "San Francisco Caltrain",
    address: "700 4th St, San Francisco",
    short: "SoMa",
    x: 682,
    y: 688,
  },
];
export const DEFAULT_PICKUP = PLACES[0];
export const DEFAULT_DESTINATION = PLACES[1];

export interface Offer {
  id: string;
  provider: Provider;
  name: string;
  price: number;
  pickup: number;
  duration: number;
  emissions: number;
  powertrain: Powertrain;
  seats: number;
  description: string;
}
export interface Settings {
  participant: string;
  seed: number;
  scenario: Scenario;
  pool: Pool;
  task?: TaskGoal;
  destinationId?: string;
}
export const DEFAULT_SETTINGS: Settings = {
  participant: "P001",
  seed: 1842,
  scenario: "balanced",
  pool: "all",
  task: "cheapest",
  destinationId: "ferry",
};

function random(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let x = Math.imul(value ^ (value >>> 15), 1 | value);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(value: string) {
  return [...value].reduce(
    (n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) | 0,
    0,
  );
}
const cents = (n: number) => Math.round(n * 100) / 100;
export function routeInfo(pickup: Place, destination: Place) {
  const airport = [pickup.id, destination.id].includes("sfo");
  const distance = airport
    ? 13.8
    : Math.max(
        1.2,
        Math.hypot(pickup.x - destination.x, pickup.y - destination.y) / 160,
      );
  return {
    distance: Math.round(distance * 10) / 10,
    duration: airport ? 28 : Math.round(distance * 3.4 + 5),
  };
}
export function generateOffers(
  settings: Settings,
  pickup: Place,
  destination: Place,
): Offer[] {
  const rand = random(
    settings.seed + hash(`${pickup.id}:${destination.id}:${settings.scenario}`),
  );
  const { distance, duration } = routeInfo(pickup, destination);
  const base = 7.8 + distance * 2.15;
  const surge = settings.scenario === "rush" ? 1.5 : 1;
  const definitions: [Provider, string, Powertrain, number, string][] = [
    ["Uber", "UberX", "Gas", 0, "Everyday rides, just for you"],
    ["Lyft", "Lyft", "Gas", -0.5, "Your everyday ride"],
    ["Waymo", "Waymo One", "EV", 1.2, "All-electric. Fully autonomous."],
    ["Uber", "Green", "EV", 0.8, "An all-electric ride"],
    ["Lyft", "Green", "Hybrid", 0.4, "A lower-emission ride"],
    ["Curb", "Taxi", "Hybrid", 2.8, "A local cab, a familiar ride"],
  ];
  const offers = definitions.map(
    ([provider, name, powertrain, offset, description], i): Offer => ({
      id: `${provider.toLowerCase()}-${i}`,
      provider,
      name,
      powertrain,
      description,
      price: cents((base + offset + rand() * 6) * surge),
      pickup: 2 + Math.floor(rand() * (settings.scenario === "rush" ? 11 : 7)),
      duration: duration + Math.floor(rand() * 4),
      emissions:
        powertrain === "EV"
          ? 0
          : cents(distance * (powertrain === "Hybrid" ? 0.17 : 0.32)),
      seats: 4,
    }),
  );
  if (settings.scenario === "green") {
    const minGas = Math.min(
      ...offers.filter((o) => o.powertrain === "Gas").map((o) => o.price),
    );
    offers[3].price = minGas;
    offers[4].price = cents(minGas - 0.5);
  }
  return offers;
}
export function availableOffers(offers: Offer[], mode: Mode, pool: Pool) {
  return mode === "baseline" || pool === "matched"
    ? offers.filter((o) => o.provider === "Uber" || o.provider === "Lyft")
    : offers;
}
export function sortOffers(offers: Offer[], priority: Priority) {
  return [...offers].sort(
    (a, b) =>
      a[priority] - b[priority] ||
      a.price - b.price ||
      a.id.localeCompare(b.id),
  );
}
export const money = (value: number) => `$${value.toFixed(2)}`;
export function durationLabel(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}
export interface StudyEvent {
  n: number;
  kind: "click" | "input" | "system";
  action: string;
  atMs: number;
  provider?: Provider;
  detail?: string;
}
export interface Session {
  id: string;
  participant: string;
  mode: Mode;
  seed: number;
  scenario: Scenario;
  pool: Pool;
  startedAt: string;
  finishedAt: string;
  status: "completed" | "abandoned";
  clicks: number;
  elapsedSeconds: number;
  pickup: string;
  destination: string;
  selected: Offer | null;
  cheapestPrice: number | null;
  bookedCheapest: boolean | null;
  greenEligible: boolean | null;
  choseGreen: boolean | null;
  premiumPaid: number | null;
  offers: Offer[];
  events: StudyEvent[];
  designVersion?: string;
  task?: TaskGoal;
  taskSuccess?: boolean | null;
  intendedDestination?: string;
  viewport?: { width: number; height: number };
}
export function rideLabel(offer: Offer) {
  return offer.name.startsWith(offer.provider)
    ? offer.name
    : `${offer.provider} ${offer.name}`;
}
export function taskSucceeded(
  task: TaskGoal,
  selected: Offer,
  offers: Offer[],
  intended: string,
  actual: string,
) {
  if (intended !== actual) return false;
  if (task === "fastest")
    return selected.pickup === Math.min(...offers.map((o) => o.pickup));
  if (task === "green") return bookingMetrics(selected, offers).choseGreen;
  return bookingMetrics(selected, offers).bookedCheapest;
}
export function bookingMetrics(selected: Offer, offers: Offer[]) {
  const cheapestPrice = Math.min(...offers.map((o) => o.price));
  const gas = offers.filter((o) => o.powertrain === "Gas");
  const minGas = gas.length ? Math.min(...gas.map((o) => o.price)) : null;
  const greenEligible =
    minGas !== null &&
    offers.some((o) => o.powertrain !== "Gas" && o.price <= minGas);
  return {
    cheapestPrice,
    bookedCheapest: selected.price <= cheapestPrice + 0.001,
    greenEligible,
    choseGreen: greenEligible
      ? selected.powertrain !== "Gas" && selected.price <= minGas!
      : null,
    premiumPaid: cents(selected.price - cheapestPrice),
  };
}
export function summarize(sessions: Session[], mode: Mode) {
  const completed = sessions.filter(
    (s) => s.status === "completed" && s.mode === mode,
  );
  const eligible = completed.filter((s) => s.greenEligible);
  return {
    count: completed.length,
    clicks: completed.length
      ? completed.reduce((n, s) => n + s.clicks, 0) / completed.length
      : null,
    seconds: completed.length
      ? completed.reduce((n, s) => n + s.elapsedSeconds, 0) / completed.length
      : null,
    cheapestRate: completed.length
      ? (completed.filter((s) => s.bookedCheapest).length / completed.length) *
        100
      : null,
    greenRate: eligible.length
      ? (eligible.filter((s) => s.choseGreen).length / eligible.length) * 100
      : null,
    eligibleCount: eligible.length,
  };
}
export function sessionsCsv(sessions: Session[]) {
  const columns = [
    "id",
    "participant",
    "mode",
    "status",
    "seed",
    "scenario",
    "pool",
    "started_at",
    "finished_at",
    "clicks",
    "elapsed_seconds",
    "pickup",
    "destination",
    "provider",
    "ride",
    "price",
    "cheapest_price",
    "booked_cheapest",
    "green_eligible",
    "chose_affordable_green",
    "premium_paid",
    "design_version",
    "task",
    "task_success",
    "intended_destination",
    "viewport_width",
    "viewport_height",
  ];
  const rows = sessions.map((s) => [
    s.id,
    s.participant,
    s.mode,
    s.status,
    s.seed,
    s.scenario,
    s.pool,
    s.startedAt,
    s.finishedAt,
    s.clicks,
    s.elapsedSeconds,
    s.pickup,
    s.destination,
    s.selected?.provider,
    s.selected?.name,
    s.selected?.price,
    s.cheapestPrice,
    s.bookedCheapest,
    s.greenEligible,
    s.choseGreen,
    s.premiumPaid,
    s.designVersion,
    s.task,
    s.taskSuccess,
    s.intendedDestination,
    s.viewport?.width,
    s.viewport?.height,
  ]);
  const escape = (value: unknown) => {
    let str = value == null ? "" : String(value);
    if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
    return `"${str.replaceAll('"', '""')}"`;
  };
  return [columns, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\r\n");
}

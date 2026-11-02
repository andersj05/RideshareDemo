import assert from "node:assert/strict";
import test from "node:test";
import {
  availableOffers,
  bookingMetrics,
  DEFAULT_DESTINATION,
  DEFAULT_PICKUP,
  DEFAULT_SETTINGS,
  generateOffers,
  PLACES,
  sessionsCsv,
  sortOffers,
  summarize,
  DESIGN_VERSION,
  taskSucceeded,
  type Offer,
  type Session,
} from "../src/lib/simulation";
import {
  DEFAULT_FILTERS,
  comparisonWarnings,
  filterSessions,
} from "../src/lib/reporting";

const fares = () =>
  generateOffers(DEFAULT_SETTINGS, DEFAULT_PICKUP, DEFAULT_DESTINATION);
const offer = (
  id: string,
  price: number,
  powertrain: Offer["powertrain"] = "Gas",
): Offer => ({
  id,
  price,
  powertrain,
  provider: "Uber",
  name: id,
  pickup: 3,
  duration: 15,
  emissions: powertrain === "EV" ? 0 : 1,
  seats: 4,
  description: "Test fare",
});

test("the same seed, route and scenario produce identical quotes on repeat visits", () => {
  assert.deepEqual(fares(), fares());
  assert.notDeepEqual(
    fares(),
    generateOffers(
      { ...DEFAULT_SETTINGS, seed: 1843 },
      DEFAULT_PICKUP,
      DEFAULT_DESTINATION,
    ),
  );
  assert.notDeepEqual(
    fares(),
    generateOffers(DEFAULT_SETTINGS, DEFAULT_PICKUP, PLACES[3]),
  );
});
test("matched aggregate and baseline have identical eligible offers", () => {
  const offers = fares();
  assert.deepEqual(
    availableOffers(offers, "aggregate", "matched"),
    availableOffers(offers, "baseline", "all"),
  );
  assert.equal(availableOffers(offers, "baseline", "all").length, 4);
  assert.equal(
    new Set(availableOffers(offers, "aggregate", "all").map((o) => o.provider))
      .size,
    4,
  );
});
test("generated fares stay positive and green opportunity works across many seeds", () => {
  for (let seed = 0; seed < 100; seed++) {
    const offers = generateOffers(
      { ...DEFAULT_SETTINGS, seed, scenario: "green" },
      DEFAULT_PICKUP,
      DEFAULT_DESTINATION,
    );
    assert.ok(
      offers.every(
        (o) =>
          o.price > 0 &&
          Number.isFinite(o.price) &&
          o.pickup >= 2 &&
          o.emissions >= 0,
      ),
    );
    const gasMin = Math.min(
      ...offers.filter((o) => o.powertrain === "Gas").map((o) => o.price),
    );
    assert.ok(offers.some((o) => o.powertrain === "EV" && o.price === gasMin));
    assert.ok(
      offers.some((o) => o.powertrain === "Hybrid" && o.price < gasMin),
    );
  }
});
test("each sorting priority orders the corresponding metric without mutating quotes", () => {
  const offers = fares(),
    original = JSON.stringify(offers);
  for (const key of ["price", "pickup", "emissions"] as const) {
    const sorted = sortOffers(offers, key);
    assert.ok(sorted.every((o, i) => i === 0 || o[key] >= sorted[i - 1][key]));
  }
  assert.equal(JSON.stringify(offers), original);
});
test("cheapest choice recognizes ties and compares against unseen fares", () => {
  const offers = [offer("a", 12), offer("b", 12, "EV"), offer("c", 15)];
  assert.equal(bookingMetrics(offers[0], offers).bookedCheapest, true);
  assert.equal(bookingMetrics(offers[1], offers).bookedCheapest, true);
  assert.equal(bookingMetrics(offers[2], offers).bookedCheapest, false);
  assert.equal(bookingMetrics(offers[2], offers).premiumPaid, 3);
});
test("green eligibility uses cheapest gas, not an expensive gas alternative", () => {
  const offers = [
    offer("cheap-gas", 10),
    offer("expensive-gas", 25),
    offer("electric", 12, "EV"),
  ];
  assert.equal(bookingMetrics(offers[2], offers).greenEligible, false);
  assert.equal(bookingMetrics(offers[2], offers).choseGreen, null);
});
test("an affordable green opportunity counts only a qualifying EV or hybrid choice", () => {
  const offers = [
    offer("gas", 12),
    offer("hybrid", 11, "Hybrid"),
    offer("electric", 15, "EV"),
  ];
  assert.equal(bookingMetrics(offers[0], offers).greenEligible, true);
  assert.equal(bookingMetrics(offers[0], offers).choseGreen, false);
  assert.equal(bookingMetrics(offers[1], offers).choseGreen, true);
  assert.equal(bookingMetrics(offers[2], offers).choseGreen, false);
});
test("no gas comparison produces no eligible sustainability observation", () => {
  const offers = [offer("ev", 12, "EV")];
  assert.equal(bookingMetrics(offers[0], offers).greenEligible, false);
});
const session = (overrides: Partial<Session> = {}): Session => ({
  id: "test",
  participant: "P001",
  mode: "aggregate",
  seed: 1,
  scenario: "balanced",
  pool: "all",
  startedAt: "2026-11-02T12:00:00Z",
  finishedAt: "2026-11-02T12:00:30Z",
  status: "completed",
  clicks: 4,
  elapsedSeconds: 30,
  pickup: "A",
  destination: "B",
  selected: offer("x", 12),
  cheapestPrice: 12,
  bookedCheapest: true,
  greenEligible: false,
  choseGreen: null,
  premiumPaid: 0,
  offers: [],
  events: [],
  ...overrides,
});
test("summary excludes abandoned and other-mode sessions and uses eligible denominator", () => {
  const result = summarize(
    [
      session(),
      session({
        clicks: 8,
        elapsedSeconds: 50,
        greenEligible: true,
        choseGreen: true,
      }),
      session({ status: "abandoned", clicks: 100 }),
      session({ mode: "baseline", clicks: 100 }),
    ],
    "aggregate",
  );
  assert.equal(result.count, 2);
  assert.equal(result.clicks, 6);
  assert.equal(result.seconds, 40);
  assert.equal(result.greenRate, 100);
  assert.equal(result.eligibleCount, 1);
  assert.equal(summarize([], "aggregate").cheapestRate, null);
  assert.equal(summarize([session()], "aggregate").greenRate, null);
});
test("CSV preserves commas, quotes and newlines while escaping spreadsheet formulas", () => {
  const csv = sessionsCsv([
    session({ participant: "=SUM(1,2)", pickup: 'A, "B"\nC' }),
  ]);
  assert.ok(csv.includes('"\'=SUM(1,2)"'));
  assert.ok(csv.includes('"A, ""B""\nC"'));
  assert.ok(csv.startsWith('"id","participant","mode"'));
});

test("task completion requires the intended destination even when the fare is cheapest", () => {
  const offers = [offer("cheap", 10), offer("other", 15)];
  assert.equal(
    taskSucceeded("cheapest", offers[0], offers, "ferry", "dolores"),
    false,
  );
  assert.equal(
    taskSucceeded("cheapest", offers[0], offers, "ferry", "ferry"),
    true,
  );
  assert.equal(
    taskSucceeded("cheapest", offers[1], offers, "ferry", "ferry"),
    false,
  );
});
test("fastest task recognizes pickup ties and green task distinguishes unavailable opportunity", () => {
  const offers = [
    { ...offer("gas", 10), pickup: 2 },
    { ...offer("ev", 10, "EV"), pickup: 2 },
    { ...offer("slow", 14), pickup: 7 },
  ];
  assert.equal(
    taskSucceeded("fastest", offers[1], offers, "ferry", "ferry"),
    true,
  );
  assert.equal(
    taskSucceeded("fastest", offers[2], offers, "ferry", "ferry"),
    false,
  );
  assert.equal(
    taskSucceeded("green", offers[1], offers, "ferry", "ferry"),
    true,
  );
  assert.equal(
    taskSucceeded("green", offers[0], offers, "ferry", "ferry"),
    false,
  );
  assert.equal(
    taskSucceeded("green", offers[0], [offers[0]], "ferry", "ferry"),
    null,
  );
});
test("reports keep previous designs separate by default, including abandoned attempts", () => {
  const rows = [
    session({ id: "old" }),
    session({ id: "new", designVersion: DESIGN_VERSION }),
    session({
      id: "abandoned",
      designVersion: DESIGN_VERSION,
      status: "abandoned",
    }),
  ];
  assert.deepEqual(
    filterSessions(rows, DEFAULT_FILTERS).map((s) => s.id),
    ["new", "abandoned"],
  );
  assert.equal(
    filterSessions(rows, { ...DEFAULT_FILTERS, legacy: true }).length,
    3,
  );
});
test("report filters combine participant, seed, route, task, pool and scenario", () => {
  const target = session({
    designVersion: DESIGN_VERSION,
    participant: "P004",
    seed: 15,
    scenario: "green",
    pool: "matched",
    task: "green",
    intendedDestination: "Ferry Building",
  });
  const filters = {
    ...DEFAULT_FILTERS,
    participant: "P004",
    seed: "15",
    scenario: "green",
    pool: "matched",
    task: "green",
    destination: "Ferry Building",
  };
  const rows = [
    target,
    session({ ...target, participant: "P005" }),
    session({ ...target, seed: 16 }),
    session({ ...target, intendedDestination: "Dolores Park" }),
    session({ ...target, pool: "all" }),
    session({ ...target, task: "cheapest" }),
    session({ ...target, scenario: "balanced" }),
  ];
  assert.deepEqual(filterSessions(rows, filters), [target]);
});
test("comparison warnings expose mixed pool, design, task and viewport confounds", () => {
  const a = session({
    designVersion: DESIGN_VERSION,
    task: "cheapest",
    pool: "matched",
    viewport: { width: 390, height: 650 },
  });
  const b = session({
    task: "green",
    pool: "all",
    viewport: { width: 375, height: 500 },
  });
  assert.equal(comparisonWarnings([a, b]).length, 4);
  assert.deepEqual(comparisonWarnings([a, { ...b, status: "abandoned" }]), []);
});
test("CSV includes task, design and viewport metadata for reproducibility", () => {
  const csv = sessionsCsv([
    session({
      designVersion: DESIGN_VERSION,
      task: "fastest",
      taskSuccess: true,
      intendedDestination: "Ferry Building",
      viewport: { width: 390, height: 650 },
    }),
  ]);
  assert.ok(
    csv.includes(
      '"design_version","task","task_success","intended_destination","viewport_width","viewport_height"',
    ),
  );
  assert.ok(
    csv.endsWith(
      '"mobile-lab-v2","fastest","true","Ferry Building","390","650"',
    ),
  );
});

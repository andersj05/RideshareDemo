# Rideshare Test Lab

A Next.js / TypeScript prototype lounge for comparing **mobile** ride-booking tasks. Both experiences use the same phone viewport. All fares, availability, payments, maps and emissions are simulated; no accounts or API keys are required.

## Run

Requires Node.js 20.9+ and npm (validated with Node.js 24).

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). For production, run `npm run build` followed by `npm start`. To test on a phone on the same trusted network, use the development machine's LAN address on port 3000; browser storage is separate on each device/origin.

## Experiences

- **Uber + Lyft:** start with an app switcher, open a provider, enter a destination, inspect its fares, switch apps, and confirm a ride. Each provider retains its own route, selection and screen. Black Uber controls and purple Lyft controls follow familiar booking patterns.
- **Aggregator:** enter a route once, compare rides, sort by price/pickup/CO₂, optionally filter EV/hybrid choices, and continue to a provider confirmation with trip and demo payment prefilled.

The aggregator defaults to the matched Uber + Lyft pool for controlled comparisons. The four-provider option adds Waymo and Curb. Neither experience preselects a ride. Participants may backtrack, edit locations, or book without checking every provider.

The provider screens are approximations, **not pixel-exact copies of a current app release**. Booking is the interactive scope; account/activity navigation is decorative. Scheduling, authentication, live maps, promotions, real payments and external deep links are outside this prototype.

## Run a study

1. Enter an anonymous participant ID in **Test setup** (the sliders button on mobile).
2. Choose the cheapest, fastest-pickup, or affordable-EV/hybrid task and its destination. For the green task, use the **Affordable EV / hybrid** scenario to guarantee an eligible choice.
3. Choose a seed or randomize fares. Keep the seed, scenario, route, task, provider pool and screen size the same across paired attempts.
4. Open **Participant view** to hide researcher metrics. Ask the participant to complete the displayed task without coaching.
5. Switch experiences and repeat. Alternate which experience participants use first.
6. Open **Results** to compare metrics, filter sessions, inspect event logs and fare snapshots, or export the filtered data.

Desktop provides 375, 390 and 430 px phone presets. On a phone, the app fills the actual viewport, uses internal scrolling, and keeps booking actions at the bottom. Short screens reduce the map to preserve usable ride-list space.

## Metrics

| Metric                 | Definition                                                                                                                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Clicks to book         | Button/input/option activations inside the app through final confirmation. Includes switching, sorting, filtering and backtracking. Keyboard button activation counts. Text edits are separate events; scrolling and researcher controls do not count. |
| Time to book           | Wall-clock time from the first app action through confirmation, including loading, background time and researcher-panel time during an active attempt.                                                                                                 |
| Cheapest ride booked   | Share of completed attempts booking the minimum fare in that route's full available provider pool, including unseen offers. Ties qualify.                                                                                                              |
| Affordable EV / hybrid | Among completed attempts offering an EV/hybrid at or below the cheapest gas fare, the share choosing an EV/hybrid that meets that threshold. No eligible sample displays “—”, not 0%.                                                                  |
| Task met               | Selected ride satisfies the configured goal and the intended pickup and destination. An unavailable green opportunity has no task-success value.                                                                                                       |
| Abandoned attempts     | Resetting, switching experience, leaving for Results or reloading an active attempt saves an abandoned record. Reload recovery uses the last recorded event time. Abandoned attempts are shown/exported but excluded from booking averages and rates.  |

The results page shows sample denominators, completed/abandoned counts, six condition filters, and warnings about mixed pools, tasks, designs or viewport sizes. Current results default to design version `mobile-lab-v2`; earlier records are retained behind **Include previous design**.

The original 12-click baseline is a hypothesis, not a hardcoded result. QA clicks and durations are **not participant study findings**. No example observations are inserted by the app. If development checks exist in your browser, use participant filters to separate `QA-MOBILE` from real study participants.

CO₂ represents fictional **tailpipe** emissions, not lifecycle emissions. Seeded prices remain fixed for the same route and scenario. The results are descriptive; matched conditions and an appropriate study design are needed to draw comparisons.

## Data and exports

- Records stay in browser local storage. There is no server database, remote analytics, or cross-device sync.
- Use one active test tab and one origin throughout a study. `localhost`, `127.0.0.1`, and a LAN address have separate storage.
- Settings reset on reload; saved sessions keep their original settings. An unfinished session is recovered as abandoned.
- Export regularly. Private browsing, clearing site data or storage restrictions can remove results; storage failures show a warning.
- **CSV:** filtered session rows, counts, time, outcome, fare premium, task, design and viewport metadata; formula-like strings are escaped.
- **JSON + events:** schema version 2, export timestamp and filtered sessions with complete quote snapshots and ordered click/input/system logs.

## Development and verification

```sh
npm run typecheck
npm test
npm run build
```

The 16 unit tests cover deterministic generation, matched provider pools, affordable-green scenarios across seeds, sorting, ties, eligibility, denominators, abandonment exclusion, task goals, report filters, comparison warnings and export metadata/escaping.

Browser QA is documented in [TESTING.md](TESTING.md). The UI uses system fonts, Lucide icons and local SVG map/vehicle illustrations, with no runtime external asset or API dependency.

| File                                  | Responsibility                                                                    |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| `src/components/test-lab.tsx`         | Test orchestration, researcher controls, shared viewport and measurement boundary |
| `src/components/mobile-aggregate.tsx` | Route entry, comparison, sorting, filtering and selection                         |
| `src/components/mobile-baseline.tsx`  | Independent Uber/Lyft state and switching                                         |
| `src/components/mobile-shell.tsx`     | Shared header, simulated provider handoff and completion                          |
| `src/components/test-results.tsx`     | Comparison metrics, filters, session details and export                           |
| `src/lib/simulation.ts`               | Seeded fares, metric formulas, task outcomes and CSV                              |
| `src/lib/reporting.ts`                | Condition filtering and comparison warnings                                       |
| `src/lib/use-study.ts`                | Event capture, timing, persistence and reload recovery                            |

## References

Selected booking patterns were informed by [Uber's ride page](https://www.uber.com/us/en/ride/), [Lyft's request guide](https://help.lyft.com/hc/en-us/articles/213584098-How-to-Request-a-Ride), and [Lyft's upfront-pricing guide](https://help.lyft.com/hc/en-us/all/articles/115012925707-Ride-pricing-and-charges). Provider branding identifies simulations only; this project is not affiliated with these providers.

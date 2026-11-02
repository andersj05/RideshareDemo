# fare — rideshare research prototype

A local Next.js / TypeScript app for testing the effort of comparing rides across apps against a streamlined aggregate experience. All fares, vehicles, wait times, payments, routes and emissions are simulated. No accounts, API keys or provider connections are required.

## Run

Requires Node.js 20.9+ and npm. Tested with Node.js 24.

```sh
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000). For production mode:

```sh
npm run build
npm start
```

## Two experiences

- **All together:** choose locations, compare Uber, Lyft, Waymo and Curb, sort by fare/pickup/tailpipe CO₂, filter EV/hybrid options, select a ride, and enter a branded simulated provider confirmation with trip and demo payment prefilled. One final tap completes the booking.
- **App by app:** an app launcher opens distinct Uber and Lyft simulations. Each retains its own pickup, destination, screen and ride selection while participants switch apps. Search, autocomplete, recent destinations, ride selection, pickup confirmation, account and empty activity screens work. Participants can backtrack and book without being forced to inspect both apps.

The aggregate adapts between a desktop map/list composition and a mobile layout. The baseline retains a phone-shaped UI. Use the **same device and viewport** for both conditions. These are functional recreations of selected booking patterns, not pixel-exact copies of all real app versions. Scheduling, authentication, real-time mapping, promo codes, payments and real deep links are outside this prototype.

## Run a study

1. Open **Research lab → Study setup** and assign a participant code.
2. Choose a repeatable **seed** or generate a random seed. Scenarios include everyday travel, rush hour and an affordable EV/hybrid opportunity.
3. For a controlled A/B comparison, select **Uber + Lyft only** in the aggregate provider pool. The full four-provider experience remains available for exploratory tests.
4. Use the same seed, scenario, pickup and destination in both conditions. The suggested task is finding the cheapest ride from Patricia’s Green to the Ferry Building. Alternate test order between participants.
5. Start a fresh test, close the research panel, then let the participant act freely. The first interaction starts timing; provider confirmation ends it.
6. Inspect **Results**, expand a session for its event timeline, then export **CSV** and **JSON + events**.

The cited 12-step baseline is a hypothesis to investigate, not a hardcoded outcome. No example data is inserted into results. Development smoke tests are not participant observations.

## Measurement definitions

| Metric                      | Definition                                                                                                                                                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Clicks to book              | Button, input and option activations inside the experience through final confirmation, including switching, filters and backtracking. Keyboard activation of a button also counts. Text edits are separate events; keystrokes, scrolling and researcher controls do not count. |
| Search time                 | Wall-clock seconds from the first interaction through provider confirmation. Background time and time in the research panel are included.                                                                                                                                      |
| Cheapest ride booked        | Completed sessions whose selected fare equals the minimum quote in that route’s full session provider pool. Ties qualify, even if not all quotes were viewed.                                                                                                                  |
| Affordable EV/hybrid choice | Among sessions with an EV/hybrid at or below the cheapest gas fare, the share selecting an EV/hybrid meeting that threshold. No eligible observations displays “—”.                                                                                                            |
| Abandoned attempts          | Switching modes, starting over, or reloading an unfinished task saves an abandoned attempt. Reload recovery uses the last recorded event time. Abandoned attempts are exportable but excluded from completed-session averages and rates.                                       |

Results aggregate descriptively across settings; they are not a statistical causal comparison. Match settings when analyzing A/B differences. JSON includes complete quote snapshots, selected rides, seeds, pools, scenarios, timestamps and ordered event logs. CSV also includes the fare premium above the minimum.

CO₂ values represent fictional **tailpipe** emissions. Zero tailpipe CO₂ for an EV does not mean zero lifecycle emissions. Prices stay fixed within a seed/route/scenario so switching apps does not change the comparison.

## Data

Sessions stay in browser storage on this device. No remote analytics, database or cross-device sync is used. Use participant codes and avoid real personal information. Export regularly; private browsing, storage restrictions or clearing site data can remove results. Storage failures show an export warning.

Use one active test tab at a time. `localhost` and `127.0.0.1` have separate browser storage; use the same origin throughout a study. Research settings reset to defaults on page reload; completed records retain their original settings.

## Development

```sh
npm run typecheck
npm test
npm run build
```

Tests cover deterministic generation, matched pools, green-opportunity seeds, sorting, price ties, sustainability eligibility, summary denominators, abandoned sessions and CSV escaping.

| File                              | Responsibility                                                                      |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| `src/lib/simulation.ts`           | Seeded quotes, destinations, route estimates, metric formulas and CSV serialization |
| `src/lib/use-study.ts`            | Click/event recording, timing, persistence and abandoned-session recovery           |
| `src/components/fare-app.tsx`     | Modes, aggregate state, handoff and receipt                                         |
| `src/components/aggregate.tsx`    | Aggregate search, sorting, filtering and selection                                  |
| `src/components/baseline.tsx`     | Independent Uber/Lyft states and switching                                          |
| `src/components/research-lab.tsx` | Setup, results, event inspection and export                                         |
| `src/components/visuals.tsx`      | Vector map, cars and provider marks                                                 |

Fonts are bundled locally through `@fontsource-variable/dm-sans`. Map and vehicle illustrations are SVG. There are no runtime external asset or API dependencies.

## Booking-flow references

Selected interactions were informed by [Uber’s request-a-ride page](https://www.uber.com/us/en/ride/) and [Lyft’s request-a-ride guide](https://help.lyft.com/hc/en-us/articles/213584098-How-to-Request-a-Ride). Lyft’s guide describes destination search, ride selection and pickup confirmation. [Lyft’s pricing guide](https://help.lyft.com/hc/en-us/all/articles/115012925707-Ride-pricing-and-charges) describes upfront fare presentation. Provider branding identifies simulations only; this project is not affiliated with providers.

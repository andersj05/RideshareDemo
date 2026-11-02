# Verification log — mobile lab v2

Validated November 2, 2026 using Chrome browser automation, Node.js 24 and the local Next.js app. These are engineering smoke tests, not participant research results. Browser viewport emulation does not replace testing Safari/Chrome on physical phones, especially the software keyboard.

## Automated checks

- `npm test`: 16 passing tests for fare generation, matched pools, sorting, ties, sustainability eligibility, summary denominators, task outcomes, report filters, comparison warnings and CSV serialization.
- `npm run typecheck`: TypeScript validation.
- `npm run build`: production compilation and static page generation.

## Browser checks

| Check                         | Observed result                                                                                                                                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 390 × 844 aggregator booking  | Suggested destination → compare → select cheapest Lyft → provider handoff → confirm. Five measured clicks, including final confirmation.                                                                        |
| 375 × 667 baseline comparison | Open Uber → search → destination → fares → switch apps → Lyft → search → destination → fares → select → request → confirm. Twelve measured clicks. Each provider uses the same seeded prices as the aggregator. |
| Compact-phone layout          | Fixed bottom booking controls remain within the viewport. Ride lists and address content scroll internally. Compact maps shrink to preserve list space.                                                         |
| 320 × 568 layout              | No document-wide horizontal overflow on the test flow or Results. Booking action remains visible. Results use tappable session rows instead of a wide table.                                                    |
| Tablet / desktop              | Phone stays at its configured size. Tablet exposes live metrics through a dialog; desktop separates setup, test phone and observation panels.                                                                   |
| Autocomplete / keyboard       | Typing “Ferry” yields the matching destination; Enter selects it. Input edits are separate from click events. Escape closes the details dialog.                                                                 |
| Four-provider pool            | Six offers from Uber, Lyft, Waymo and Curb appear; CO₂ sorting and EV/hybrid filtering work.                                                                                                                    |
| Green outcome                 | On the green scenario, booking Uber Green at $14.67 qualifies against the $14.67 gas fare, while a $14.17 Lyft hybrid is cheaper. Results correctly show affordable-green Yes and cheapest No.                  |
| Participant view              | Setup, live metrics, Results navigation and completion metrics are hidden; task and booking remain available.                                                                                                   |
| Report filters                | Participant and task filters change the visible sessions and metric denominators. Previous-design records are excluded by default.                                                                              |
| Session details               | Click totals agree with ordered logs. Full pool, selected fare, task, design version and measured viewport are inspectable.                                                                                     |
| CSV / JSON downloads          | Exported two filtered QA sessions. CSV and JSON each contain two rows/sessions; schema version is 2. JSON click-event counts equal the displayed 5 and 12.                                                      |
| Reload recovery               | Reloading an active attempt creates exactly one abandoned record, preserves its original task/design/viewport and excludes it from completed metrics.                                                           |

## Issues caught and fixed during QA

- Flex alignment let the mobile phone content exceed the available height, hiding the bottom action. The mobile stage now stretches within its bounded parent.
- Capture-phase measurement restored a controlled checkbox before its change event. Checkbox clicks now record from the change handler and toggle correctly.
- An absolutely positioned screen-reader table label escaped the horizontal scroll container. The container now establishes its positioning context, and mobile session history uses a vertical list.
- Compact screens devoted too much space to maps. Height-based rules reduce or hide the map while preserving the booking action and list.

## Repeat a controlled comparison

Use the same participant ID, seed 1842, typical-fares scenario, Ferry Building destination, cheapest task, matched Uber + Lyft pool, viewport and participant-view setting. Run each experience once. Expected fares for this seed include Lyft $16.72, Lyft Green $18.33, Uber Green $20.03 and UberX $20.26. Actual click/time outcomes depend on the participant's actions; do not enforce the QA paths.

Use a new participant ID for real observations or filter out `QA-MOBILE`. QA timing includes automation and debugging pauses and must not be used to infer usability improvements. No QA sessions are seeded into the repository or added on app startup.

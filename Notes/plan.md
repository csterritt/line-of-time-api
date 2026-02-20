# Timeline Redesign Plan

## Features
- Events visible to all users (not just signed-in)
- Each event displayed next to its start date only
- Events with endTimestamp get a separate end row: italicized "End of X" or "Death of X"
- Vertically even spacing
- Multiple events on same date: date shown once, events stacked below

## Steps

- [ ] Add nullable `event_type` column to DB schema (`src/db/schema.ts`)
- [ ] Create migration SQL file (`drizzle/0001_add_event_type.sql`)
- [ ] Apply migration to local dev DB via wrangler
- [ ] Update `src/routes/time-info/event-utils.ts` — add `eventType` to EventResponse
- [ ] Update `src/validators/event-validator.ts` — accept optional `eventType`
- [ ] Update `src/routes/time-info/new-event.ts` — store `eventType`
- [ ] Update `src/routes/test/database.ts` — add `eventType` to seed events; add George Washington person event
- [ ] Update `line-of-time-fe/src/stores/event-store.ts` — add `eventType` to EventInput and EventResponse types
- [ ] Update `line-of-time-fe/src/components/NewEventView.vue` — pass `eventType` on create
- [ ] Redesign `line-of-time-fe/src/components/HomeView.vue`:
  - Load events for all users (call initializeEvents on mount always)
  - Compute sorted timeline rows (start + end entries)
  - Group by date: show date label once per group
  - Show end entries as italic "End of X" / "Death of X"
  - Keep filter controls + add-event button gated to signed-in users
- [ ] Update `e2e-tests/general/09-event-list-layout.spec.ts` — rewrite for new layout
- [ ] Update `e2e-tests/general/10-timeline-filter.spec.ts` — update changed testid refs
- [ ] Add `e2e-tests/general/11-public-events.spec.ts` — events visible without sign-in
- [ ] Start server with `npm run dev-open-sign-up`
- [ ] Run tests and fix failures.

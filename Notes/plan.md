# eventType Persistence Tests Plan

## Goal
Add tests to `e2e-tests/time-info/03-create-event.spec.ts` confirming that when an event is
created with a specific `eventType`, the value is returned in the creation response and
persisted (readable via GET).

## Tests to add

1. **creates event with eventType 'person'** — POST with `eventType: 'person'`, assert response `eventType === 'person'`
2. **creates event with eventType 'event'** — POST with `eventType: 'event'`, assert response `eventType === 'event'`
3. **eventType is persisted and readable via GET** — POST with `eventType: 'person'`, then GET the event by id, assert `eventType === 'person'`
4. **eventType defaults to null when omitted** — POST without `eventType`, assert response `eventType === null`

## Steps

- [ ] Add 4 tests to `e2e-tests/time-info/03-create-event.spec.ts`
- [ ] Run tests, fix any failures

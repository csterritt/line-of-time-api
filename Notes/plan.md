# Plan: Returning 409 Conflict for Existing Events

## Assumptions
- We are working in `src/routes/time-info/initial-search.ts`.
- `getEventByReferenceUrl` returns `Result<Event | null, Error>`, so checking `foundEvent != null` works but we should return 409.
- The frontend `line-of-time-fe/src/stores/event-store.ts` already handles errors by setting `errorMessage.value` to the string returned by the backend `error` property, so we might just need to verify it handles 409.

## The Plan
1. **Initial Search Route Update (`initial-search.ts`)**:
   - Change `return { error: 'Event found', status: 404 }` to `{ error: 'An event for this Wikipedia page already exists.', status: 409 }`.

2. **Frontend Notification (`event-store.ts` and components)**:
   - Ensure the frontend properly handles the error and notifies the user (it likely already displays `errorMessage.value`).

3. **E2E Tests (`e2e-tests/time-info/09-initial-search-conflict.spec.ts`)**:
   - Write a new test (or add to an existing initial search test) that:
     1. Creates an event with a specific Wikipedia URL.
     2. Calls `/time-info/initial-search` with the same Wikipedia page name.
     3. Verifies that the API returns a 409 status and the appropriate error message.
   - Run tests using `npx playwright test e2e-tests/time-info/09-initial-search-conflict.spec.ts -x` first to see it fail (Red).

4. **Implement Fix & Re-run Tests (Green)**:
   - Apply the change in `initial-search.ts`.
   - Run the test again to see it pass.

5. **Start Server**:
   - Run the server with `npm run dev-open-sign-up` to manually verify if needed.

## Pitfalls
- **Frontend Error Message Format**: The frontend `event-store.ts` assumes the server returns `{ error: 'string message' }`. If we change the structure, the frontend will break. We must keep `error` as a string.
- **Reference URL Formatting**: The `initial-search` creates a `probableUrl` using `encodeURIComponent(trimmedName)`. If the created event doesn't exactly match this format, the lookup will fail.

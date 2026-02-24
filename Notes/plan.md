# Plan: Rename `referenceUrls` to `referenceUrl`

## Assumptions
- We are using Drizzle ORM and a SQLite database. We'll need to generate and apply migrations after modifying `src/db/schema.ts`.
- `referenceUrl` should contain a single valid URL string.
- Existing database data will need to be handled, as adding a `unique` and `notNull` constraint might fail if existing rows have arrays, missing data, or duplicates.

## The Plan
1. **Database Schema Update**: 
   - Modify `src/db/schema.ts` to change `referenceUrls: text('reference_urls').notNull()` to `referenceUrl: text('reference_url').notNull().unique()`.
   - *This has been done.*
2. **Backend Code Updates**:
   - Update `src/validators/event-validator.ts` to validate a single URL string instead of an array.
   - Update `src/routes/time-info/event-utils.ts`, `src/routes/time-info/new-event.ts`, `src/routes/time-info/event.ts` and `src/routes/test/database.ts` to handle `referenceUrl` as a string instead of JSON array.
3. **Frontend Code Updates**:
   - Update `line-of-time-fe/src/stores/event-store.ts` types to use `referenceUrl: string` instead of `referenceUrls: string[]`.
   - Update `line-of-time-fe/src/components/NewEventView.vue` to send `referenceUrl: referenceUrl.value` instead of wrapping it in an array (`referenceUrls: [referenceUrl.value]`).
4. **Tests Update**:
   - Update existing e2e tests in `@e2e-tests` to provide/expect a single string `referenceUrl` rather than an array.
   - Add a new test to verify the uniqueness constraint of `referenceUrl`.
   - Run tests using `npx playwright test -x`.
5. **Server Run**:
   - Start the server using `npm run dev-open-sign-up` (as per rules).

## Pitfalls
- **Data Migration**: Making the column `unique` and `notNull` will fail during migration if there are existing rows with duplicate URLs, or if we don't properly transform existing JSON array strings to a single URL string.
- **Client Breakage**: Any API consumer or frontend component expecting `referenceUrls` as an array will break and needs to be updated to use the single string `referenceUrl`.

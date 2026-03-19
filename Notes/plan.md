# Plan: Add Admin-Only Event Edit Route + Frontend UI

## Assumptions
- `adminAccess` middleware already exists in `src/middleware/admin-access.ts`
- `updateEventById` already exists in `src/lib/db-access.ts`
- `validateEventInput` in `src/validators/event-validator.ts` can be reused for edit validation
- The edit route uses POST (not PUT) to a new path `/time-info/edit-event/:id`
- `isAdmin` is already in the user object returned by better-auth
- No database schema changes are required

## Backend Steps

### 1. Add EDIT_EVENT path to `src/constants.ts`
- Add `EDIT_EVENT: '/time-info/edit-event'` to `PATHS.TIME_INFO`

### 2. Create `src/routes/time-info/handle-edit-event.ts`
- POST `/:id` handler using `adminAccess` middleware
- Validates body with `validateEventInput`
- Calls `updateEventById` from db-access
- Returns updated event JSON

### 3. Register route in `src/index.ts`
- Import `editEventRouter`
- Add `app.route(PATHS.TIME_INFO.EDIT_EVENT, editEventRouter)`

### 4. Update `src/routes/auth/handle-user-signed-in.ts`
- Return `isAdmin: user.isAdmin` in the JSON response (for frontend)

## Frontend Steps

### 5. Update `user-info.ts` store
- Add `isAdmin` ref
- Populate from `/auth/user-signed-in` response

### 6. Add `editEvent` to `event-store.ts`
- POST to `/time-info/edit-event/:id` with event data
- Update `allEvents` on success

### 7. Create `EditEventView.vue`
- Form pre-populated with existing event data (year/month/day inputs)
- Submit calls `eventStore.editEvent`
- Only accessible when user is admin

### 8. Add pencil icon button to `TimelineDisplay.vue`
- Show only when `userInfo.isAdmin`
- Clicking navigates to `/edit-event/:id` route

### 9. Register `/edit-event/:id` route in `router/index.ts`

## Tests

### 10. E2E backend tests: `e2e-tests/time-info/11-edit-event.spec.ts`
- Admin can edit an event via POST
- Non-admin gets 403
- Unauthenticated gets redirected
- Returns 400 for invalid input
- Returns 404 for non-existent event

### 11. E2E frontend tests: `e2e-tests/admin/02-edit-event-ui.spec.ts`
- Admin sees pencil button on event rows
- Non-admin does not see pencil button
- Edit form is pre-populated with event data
- Successful edit redirects to home

## Potential Pitfalls
- The `handle-edit-event.ts` uses POST (not PUT) — distinct from existing PUT on `/time-info/event/:id`
- `isAdmin` must be exposed by `/auth/user-signed-in` for frontend to know
- Need to import `Pencil` icon from lucide-vue-next or use inline SVG (lucide may not be installed)

# Plan: Add Cancel Button to NewEventView.vue

## Task
Add a 'Cancel' button to the NewEventView.vue page that routes back to the main Timeline display page. It should be positioned next to the 'Create Event' and 'Search Again' buttons.

## Implementation Steps

### 1. Code Changes
- Add a Cancel button to the button group in NewEventView.vue (lines 318-330)
- Position it between "Create Event" and "Search Again" buttons
- Add click handler to navigate back to home page (`/`)
- Use consistent button styling (btn btn-secondary)
- Add proper data-testid attribute: `cancel-action`

### 2. Test Planning
- Add test for Cancel button visibility
- Add test for Cancel button navigation to home page
- Ensure existing tests still pass

### 3. Testing
- Run e2e tests to verify functionality
- Run unit tests to ensure no regressions

## Technical Details
- Router: Use `router.push('/')` to navigate to timeline
- Styling: Use DaisyUI button classes for consistency
- Testing: Follow existing test patterns in 04-new-event.spec.ts

## Assumptions
- Main Timeline display page is the home route (`/`)
- No database schema changes required
- Following existing UI patterns and conventions

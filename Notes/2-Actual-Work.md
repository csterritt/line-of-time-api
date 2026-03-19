## Add Admin-Only Back End Event Edit Route

We want to add a new backend route to support POST requests for editing existing events, restricted to admin users only.

### Step 1: Create Event Edit Handler

Create the handler for processing event edit requests:

**File: `src/routes/time-info/handle-edit-event.ts`**

This will use the new middleware `adminAccess` to make sure the user is an admin.

Follow the patterns used in other handlers like `handle-new-event.ts`.

### Step 2: Create Event Validator

Create a validator for edit event input data in `src/lib/event-validator.ts`.

Follow the patterns used in other validators in `event-validator.ts`.

### Step 3: Register Admin Routes

Follow the patterns used in other routes in `src/index.ts`.

## Update the Front End

We need to add a form to the front end to allow admins to edit events.

Follow the patterns used in NewEventView.vue and ensure the form is only visible to admins.

When the user is an admin, add a button to the row of the event list that will open the edit form
on that event. It should have a pencil icon.

Update the event-store.ts to include the edit event functionality, which will call the backend route.

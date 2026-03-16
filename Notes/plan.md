# Plan: Categorization Type Dropdown in NewEventView

## Goal
Replace the static type display in `NewEventView.vue` with an editable dropdown.
Options: person, one-time-event, bounded-event, other.
Exception: if categorization is 'redirect' (or 'disambiguation'), force 'other' and disable the dropdown.

## Assumptions
- No database schema changes needed (eventType field already accepts any string).
- 'disambiguation' is not in the current TypeScript union type but is handled gracefully via the initialization logic.
- The `handleSubmit` eventType logic should use the selected dropdown value, not the raw categorization type.

## Steps

### 1. Write tests first (Red)
- Create `src/tests/NewEventView.spec.ts` with unit tests covering:
  - Dropdown has exactly 4 options: person, one-time-event, bounded-event, other
  - Each valid type pre-selects the correct option and leaves dropdown enabled
  - 'redirect' categorization → 'other' pre-selected, dropdown disabled

### 2. Implement changes to NewEventView.vue (Green)
**Script:**
- Replace `categorizationType` computed with a `ref`, initialized from categorization:
  - 'redirect' or 'disambiguation' → 'other'
  - valid type (person/one-time-event/bounded-event/other) → use it
  - anything else → 'other'
- Add `isTypeChangeable` computed: false if raw categorization was 'redirect' or 'disambiguation'
- Update `handleSubmit` to derive `eventType` from `categorizationType.value`

**Template:**
- Replace `<div data-testid="type-display">` with `<select data-testid="type-select">` bound via `v-model`
- Options: person, one-time-event, bounded-event, other
- `:disabled="!isTypeChangeable"`

### 3. Run all tests and fix failures

### 4. Start server and notify

## Pitfalls
- The component's `startInputs`/`endInputs` are initialized once from the categorization on mount, not reactively tied to the dropdown selection. Changing the type dropdown does NOT re-compute date fields. This is intentional (user may have already filled in dates).
- `handleSubmit` currently sends `eventType: 'person' | 'event'` — after the change it still maps from the dropdown value ('person' → 'person', else → 'event').

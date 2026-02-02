# Plan: Enforce Unique User Names on Sign-Up

## Assumptions

- The database already has a unique constraint on `user.name` (confirmed in `src/db/schema.ts:16`)
- The goal is to **surface a user-friendly error** when a duplicate name is submitted, rather than showing a generic error
- Case-sensitivity: SQLite unique constraints are case-sensitive by default; assuming we want **case-insensitive** uniqueness (e.g., "Fred" and "fred" should conflict)
- The fix applies to all sign-up modes (open, gated, interest) that accept a name field

---

## Questions

1. **Case sensitivity**: Should "Fred" and "fred" be considered the same name? (I'm assuming yes)
2. **Error message**: Should we reveal that the name is taken, or use a vague message like email does for security? (I'm assuming we can reveal it since names aren't sensitive like emails)
3. **Gated sign-up**: Does gated sign-up also need this check, or just open sign-up?

---

## The Answer

Add duplicate name detection to the sign-up error handling flow:

1. Add `isDuplicateNameError()` helper alongside existing `isDuplicateEmailError()`
2. Update `handleSignUpResponseError()` and `handleSignUpApiError()` to detect and handle duplicate name errors
3. Add a user-friendly error message constant for duplicate names
4. Add e2e tests for the duplicate name scenario

---

## The Plan

### Step 1: Add error message constant to `src/constants.ts`

Add `NAME_ALREADY_EXISTS` message to `MESSAGES` object.

### Step 2: Add `isDuplicateNameError()` to `src/lib/sign-up-utils.ts`

Create a helper function similar to `isDuplicateEmailError()` that detects name constraint violations.

### Step 3: Update error handlers in `src/lib/sign-up-utils.ts`

Modify `handleSignUpResponseError()` and `handleSignUpApiError()` to:

- Check for duplicate name errors
- Return appropriate error redirect with the new message

### Step 4: (Optional) Add case-insensitive name check

If case-insensitive uniqueness is needed, add a pre-check query before calling better-auth sign-up API.

### Step 5: Create `e2e-tests/sign-up/02-duplicate-name-rejected.spec.ts`

Test cases:

- Sign up with a name that already exists → shows duplicate name error
- Sign up with same name different case (if case-insensitive) → shows duplicate name error
- Can still sign up with unique name after seeing error

---

## Pitfalls

- **Constraint error detection**: SQLite constraint errors may not explicitly mention "name" — need to check actual error message format from better-auth
- **Case sensitivity**: Database constraint is case-sensitive; need explicit LOWER() check if case-insensitive uniqueness is required
- **Race conditions**: Two users signing up with same name simultaneously — database constraint handles this, but error message detection must be robust
- **Gated sign-up**: May have different code paths that also need updating
- **Error message ambiguity**: Constraint errors from better-auth may not distinguish between email and name uniqueness violations

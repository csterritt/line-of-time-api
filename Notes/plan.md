# Plan: Implement Admin User Support

## Assumptions
- The `isAdmin` field already exists in the database schema (confirmed in schema.ts:21)
- No database schema changes are required
- Admin middleware will follow the same pattern as `signedInAccess` middleware
- Better-auth supports custom user data in sessions via `session.userData` configuration

## Implementation Steps

### 1. Create Admin Authorization Middleware
- Create `src/middleware/admin-access.ts`
- Check for authenticated user and session
- Verify `user.isAdmin` is true
- Return 403 Forbidden if not admin
- Set no-cache headers

### 2. Update Better-Auth Configuration
- Modify `src/lib/auth.ts` to include `isAdmin` in session userData
- Add `session.userData.include: ['isAdmin']` to the auth config
- This ensures the `isAdmin` field is available in the session context

### 3. Plan Tests
- Test admin middleware rejects non-admin users
- Test admin middleware allows admin users
- Test admin middleware redirects unauthenticated users
- Update any existing tests that may be affected

### 4. Implement and Run Tests
- Write tests following Red/Green TDD
- Ensure all e2e-tests pass
- Ensure all unit tests pass

## Potential Pitfalls
- Better-auth may require specific configuration format for userData
- Session caching may need to be cleared/refreshed after adding userData config
- Need to verify the user object structure returned by better-auth includes custom fields
- Admin routes will need to use this middleware (not implemented in this plan)

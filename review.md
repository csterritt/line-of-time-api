[x] 16. Duplicate/parallel validation systems
    Where:
    Auth forms use Valibot schemas (src/lib/validators.ts) (good).
    Event API uses manual validation (src/validators/event-validator.ts).
    Risk: Divergent behavior and duplicated logic.
    Recommendation: Consider migrating event validation to the same schema approach for consistency and better error shaping.

[x] 17. search.ts uses Buffer.byteLength (Cloudflare Workers compatibility)
    Where: src/routes/time-info/search.ts
    Risk: In Workers, Buffer is not always available depending on runtime/polyfills.
    Recommendation: Use new TextEncoder().encode(search).length instead of Buffer.byteLength.

[x] 18. parseEvent can throw if DB JSON strings are corrupted
    Where: src/routes/time-info/event-utils.ts
    Issue: JSON.parse(dbEvent.referenceUrls) and JSON.parse(dbEvent.relatedEventIds) can throw → request becomes 500.
    Recommendation: Defensive parsing with fallback to [], or validate DB contents on insert/update.

[x] 19. eventRouter.put and newEventRouter.post don’t handle invalid JSON bodies
    Where: src/routes/time-info/event.ts, src/routes/time-info/new-event.ts
    Issue: await c.req.json<EventInput>() will throw on invalid JSON; not caught → likely 500.
    Recommendation: Wrap JSON parsing in try/catch (like you already do in search.ts) and return 400.

[x] 20. handle-sign-up.ts redirects to sign-in on validation failure
    Where: src/routes/auth/handle-sign-up.ts lines ~41–47
    Issue: On invalid signup form input, it redirects to PATHS.AUTH.SIGN_IN, not back to signup.
    Impact: Bad UX; also potentially confuses flows and tests.
    Recommendation: Redirect back to PATHS.AUTH.SIGN_UP for signup validation errors.

[x] 21. Email code/token handling is inconsistent and has some security gaps
    Where:
    src/lib/email-service.ts uses fetch(EMAIL_SEND_URL) with Authorization: Bearer EMAIL_SEND_CODE but doesn’t check response.ok.
    src/lib/send-email.ts uses SMTP with secure: true unconditionally (may break with some SMTP configs) and logs recipients.
    Risks:
    Silent failures (fetch returns non-2xx but you treat it as success).
    Potentially sensitive logging (email addresses).
    Recommendation:
    Check response.ok; if not ok, treat as failure and surface appropriately.
    Reduce logging of user email addresses in production, or redact.

[x] 1) Security: XSS Vulnerability in Email Templates
   email-service.ts:156-166
The confirmationUrl and resetUrl are inserted directly into HTML without escaping:
html
<a href="${confirmationUrl}" ...>
While name is escaped with escapeHtml(), the URLs are not. A malicious URL could inject HTML/JavaScript.
Recommendation: Escape or validate URLs before inserting into HTML templates.

[x] 5. Incorrect HTTP Status Code for Created Resources
   new-event.ts:44
typescript
return c.json(parseEvent({...}), 200)
Should return 201 Created for POST that creates a new resource.

[x] 6. Potential SQL Injection in Search (Low Risk)
   search.ts:59
typescript
const searchPattern = `%${search}%`
While Drizzle parameterizes the query, the % and \_ characters in LIKE patterns are not escaped. A user could search for % to match everything.
Recommendation: Escape LIKE special characters: search.replace(/[%_]/g, '\\$&')

[x] 7. Unused Token Parameter
   email-service.ts:144
typescript
void token
The token parameter is explicitly voided in both email functions. Either use it or remove from the signature.

[x] 9. Inconsistent Error Handling in Event Routes
   new-event.ts:17
typescript
const body = await c.req.json<EventInput>()
No try-catch for JSON parsing. Compare with search.ts:30-34 which properly handles JSON parse errors.

[x] 10. Missing Input Length Validation for Events
    event-validator.ts
The validator doesn't limit:
name length
basicDescription length
longerDescription length
Number of referenceUrls
Number of relatedEventIds
This could lead to DoS or storage issues.

[ ] 13. Inconsistent Date Storage
    schema.ts
Auth tables use integer with mode: 'timestamp' for dates
Event table uses text for createdAt/updatedAt
NOTE: This is a design decision. Event dates use text (ISO strings) for readability and compatibility with JSON serialization. Auth dates use integer timestamps for better-auth compatibility. Both approaches are valid.

[x] 14. Test Assertions Using Wrong Method
    timestamp.test.ts:17-18
typescript
expect(result, { year: 1, month: 1, day: 1 })
This passes the expected value as a second argument (message), not as a comparison. Should be:
typescript
expect(result).toEqual({ year: 1, month: 1, day: 1 })
This is a bug - tests are not actually asserting correctly!

[x] 16. Magic Numbers
    search.ts:11-12
typescript
const SEARCH_MAX_BYTES = 50
const SEARCH_RESULTS_LIMIT = 200
Good that these are constants, but they should be in constants.ts for consistency.

[x] 18. Inconsistent Return Types
    signed-in-access.ts:18
Returns Response | void but the redirect always returns a Response. Consider explicit return type.

[ ] 54.
No negative tests for event timestamp validation (e.g., endTimestamp < startTimestamp)
NOTE: Validation logic has been added (point 58 fixed). Tests should be added to verify this behavior.

[x] 55.
Email service uses origin from request without validation
Forgot password uses new URL(c.req.url).origin and passes to redirectTo. If proxied or host header is spoofed, this can lead to reset links pointing to attacker origin (depends on Cloudflare Workers behavior). Use configured base URL or validate origin against allowlist.
Ref: @/Users/chris/.windsurf/worktrees/line-of-time-api/line-of-time-api-cd1cb6a6/src/routes/auth/handle-forgot-password.ts#152-165

[ ] 56.
Public route validation logic in validateCallbackUrl allows relative path without origin validation
It’s safe for open redirect prevention, but allows somepath via URL resolution to become /somepath (same origin). Tests cover this. If you want strict /-prefixed, reject somepath.
Ref: @/Users/chris/.windsurf/worktrees/line-of-time-api/line-of-time-api-cd1cb6a6/src/lib/url-validation.ts#19-55
NOTE: Current implementation is secure. Allowing 'somepath' to resolve to '/somepath' is acceptable behavior. If stricter validation is desired, this is a design decision.

[x] 57.
Error handling in sendOtpToUserViaEmail loses the root error: sendOtpToUserViaEmailActual throws Result.err(...) rather than returning a Result. The retry wrapper then catches a non-Error object, and the final error message can become [object Object] (losing details). This can break both observability and tests.
@src/lib/send-email.ts#73-113

[x] 58.
Event validation allows inverted ranges: validateEventInput validates types but doesn’t ensure endTimestamp >= startTimestamp. This allows logically invalid events to be stored.
@src/validators/event-validator.ts#42-50

[x] 59.
Runtime env guard only checks two variables: validateEnvBindings only checks BETTER_AUTH_SECRET and SIGN_UP_MODE even though other paths require additional bindings (e.g., email config). This leads to late failures at runtime.
@src/middleware/guard-sign-up-mode.ts#17-36

[x] 60.
E2E tests reference a non-existent /increment endpoint: These tests will fail or no longer validate real behavior. Consider updating to a real endpoint or remove them.
@e2e-tests/general/03-test-body-size-limit.spec.ts#9-139, @e2e-tests/general/04-test-secure-headers.spec.ts#28-82
FIXED: Updated tests to use real endpoints - /time-info/search for body size limit tests and /time-info/new-event for CSRF tests.

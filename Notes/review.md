Below is a review of src/ with findings ordered by severity. I cite the relevant code locations. I did not acknowledge any memories (none applied).

🔴 Critical / High Severity

Runtime environment validation logs only (app still starts)

validateEnvironmentVariables() only logs errors; it does not fail startup or block requests if required env vars are missing. This risks running in a broken state (missing secrets / email config).

Suggest: throw on invalid env or return non-200 at startup.
@src/index.ts#71-112

CSRF allowlist matches localhost/ALTERNATE_ORIGIN in production

Current CSRF origin check allows localhost/alternate origin, with production values commented. If this ships, CSRF will accept local origins in prod.
This is security risk if deployed without toggling.
@src/index.ts#122-151

Open redirect risk handled in one path but not globally
There’s a good validateCallbackUrl utility, but it isn’t used in handlers that accept callbacks (e.g., sign-in/forgot password flows are building redirect URLs from origin or path constants, which is safe). Ensure any user-provided redirect param goes through validation.
I didn’t find calls to validateCallbackUrl in reviewed handlers—verify unreviewed routes.
@src/lib/url-validation.ts#19-56

🟠 Medium Severity

createAuth includes localhost + alternate origin in trusted origins + baseURL
trustedOrigins and baseURL default to localhost and a dynamically built alternateOrigin. This is safe only for dev; if deployed without toggling, you weaken auth origin checks.
@src/lib/auth.ts#26-104

validateEventInput checks timestamps as strings but compares numbers
isValidTimestamp only verifies typeof value === 'string', but later compares numeric values via (data.endTimestamp as number) < (data.startTimestamp as number). This comparison is incorrect and will always be false for strings.
Risk: invalid date range passes validation.
@src/validators/event-validator.ts#19-60

Event routes build dates from strings without validation
newEvent/event convert new Date(body.startTimestamp) but validators accept any string. Invalid dates can become Invalid Date and produce NaN timestamps.
Should validate ISO date / parseable numeric timestamp before conversion.
@src/routes/time-info/new-event.ts#38-54
@src/routes/time-info/event.ts#57-73
@src/validators/event-validator.ts#19-60

checkNameExists uses SQL string interpolation with LOWER()
It uses sql\LOWER(${user.name}) = LOWER(${name})`. In Drizzle, ${name}is parameterized, but the raw template is still riskier thaneq(sqllower(...), sqllower(?))` patterns. This is probably safe, but a stricter pattern is recommended.
@src/lib/db-access.ts#134-144

sendEmail uses secure: true always
For port 587, secure: true is usually wrong; TLS should be false and upgraded via STARTTLS. This may cause delivery failures.
@src/lib/send-email.ts#42-51

Email test-mode detection may leak into prod
email-service considers NODE_ENV === 'development' or PLAYWRIGHT in isTestMode. If these are set in staging/prod, it will route to test SMTP and bypass actual email service.
@src/lib/email-service.ts#55-73

time-access test logic depends on cookies in non-prod
getCurrentTime uses a cookie delta to offset time, but it’s always active outside production. This can cause subtle bugs in dev/test but also if NODE_ENV is mis-set in production.
@src/lib/time-access.ts#16-48

🟡 Low Severity / Maintainability

Duplicate env validation in middleware and startup
validateEnvironmentVariables() in index.ts duplicates validateEnvBindings middleware but logs instead of enforcing. Consider single source of truth.
@src/index.ts#71-112
@src/middleware/guard-sign-up-mode.ts#27-51

Logging sensitive operational details
Multiple logs include raw error objects (including email errors and auth errors). This could leak PII / operational detail. Consider redacting or wrapping.
@src/lib/auth.ts#52-78
@src/routes/auth/handle-forgot-password.ts#83-94
@src/routes/profile/handle-change-password.ts#79-109

validateRequest error fallback for “Invalid type” is email-specific
For generic schema errors, it always maps to VALIDATION.EMAIL_INVALID, which may be misleading for other forms (change password, reset password, etc.).
@src/lib/validators.ts#220-239

Inconsistent body handling
Some routes use parseBody() (form data) while others expect JSON. This is fine, but it’s not always obvious for new endpoints. Consider documenting per route or standardizing.
@src/routes/auth/handle-reset-password.ts#30-45
@src/routes/time-info/search.ts#27-44
@src/routes/time-info/new-event.ts#22-33

redirectWithMessage uses cookie for empty message
It checks if (message.trim() !== ''), so empty messages are skipped, but many call sites pass empty string; consider explicit redirectWithMessage vs redirect.
@src/lib/redirects.tsx#18-27

Missing rate limiting on sign-in / sign-up
Forgot password is rate-limited; sign-in and sign-up are not. This is a common security best practice for auth endpoints.
@src/routes/auth/handle-sign-up.ts#33-128
@src/routes/auth/better-auth-response-interceptor.ts#268-305

✅ Positive Notes

CSRF is applied globally with an allowlist hook.
SQL injection mitigations appear in search with explicit escaping and parameterization.
Account delete and password change protect via signedInAccess.
Validation schemas are centralized via Valibot.
Most handlers are error wrapped with safe redirects instead of hard crashes.

Questions / Clarifications

Are time-info event reads meant to be public? If not, signedInAccess should guard them.
Is production deployment meant to replace all PRODUCTION:REMOVE stubs automatically? If not, this is a major config risk.
Are callbacks ever user-provided? If yes, I’d like to review those routes for validateCallbackUrl usage.

Suggested Next Steps (pick any)

Tighten production config: enforce env validation, remove dev origins, enforce secure cookie settings.
Fix event validator: validate timestamps as ISO/number, enforce logical ranges.
Add auth rate limiting to sign-in/sign-up endpoints.
If you want, I can propose fixes or implement any of the above.

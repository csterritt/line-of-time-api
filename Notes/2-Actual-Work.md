## Required Changes for Admin User Support

### 1. **Create Admin Authorization Middleware**

You'll need a new middleware file `src/middleware/admin-access.ts`:

```typescript
export const adminAccess = createMiddleware<{ Bindings: Bindings }>(
  async (c: Context, next): Promise<Response | void> => {
    const user = c.get('user')
    const session = c.get('session')

    if (!user || !session) {
      return redirectWithError(c, PATHS.AUTH.SIGN_IN, 'Admin access required')
    }

    if (!user.isAdmin) {
      return c.text('Admin access required', HTML_STATUS.FORBIDDEN)
    }

    setupNoCacheHeaders(c)
    await next()
  }
)
```

### 2. **Update Better-Auth Configuration**

In `src/lib/auth.ts`, modify the auth configuration to include admin role in the session:

```typescript
// Add after line 100
  advanced: {
    generateId: false, // Use default ID generation
    crossSubDomainCookies: false,
  },
  // Add user object to session
  session: {
    // ... existing config
    cookieCache: {
      enabled: true,
      maxAge: DURATIONS.FIVE_MINUTES_IN_SECONDS,
    },
    // Add user data to session
    userData: {
      include: ['isAdmin'],
    },
  },
```

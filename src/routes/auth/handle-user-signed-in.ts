/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Handle user-signed-in status check endpoint
 * @module routes/auth/handle-user-signed-in
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { PATHS, STANDARD_SECURE_HEADERS } from '../../constants'
import type { Bindings } from '../../local-types'

/**
 * GET endpoint to check if user is signed in
 * Returns JSON with user-signed-in status
 * Relies on better-auth middleware (c.get('user')) being set up
 */
export const handleUserSignedIn = (app: Hono<{ Bindings: Bindings }>): void => {
  app.get(
    PATHS.AUTH.USER_SIGNED_IN,
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c) => {
      try {
        const user = c.get('user')

        if (user !== null) {
          return c.json({
            'user-signed-in': true,
            name: user.name,
          })
        }

        return c.json({
          'user-signed-in': false,
        })
      } catch (error) {
        console.error('User-signed-in endpoint error:', error)
        return c.json({ error: 'Internal server error' }, { status: 500 })
      }
    }
  )
}

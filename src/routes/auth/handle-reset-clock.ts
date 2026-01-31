/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route handler for resetting the server clock (for testing).
 * @module routes/auth/handleResetClock
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { PATHS, STANDARD_SECURE_HEADERS } from '../../constants'
import { Bindings } from '../../local-types'
import { redirectWithMessage } from '../../lib/redirects'

/**
 * Attach the reset clock GET route to the app.
 * @param app - Hono app instance
 */
export const handleResetClock = (app: Hono<{ Bindings: Bindings }>): void => {
   } 

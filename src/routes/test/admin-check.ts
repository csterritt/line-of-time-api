/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Test endpoint for verifying admin middleware functionality
 * @module routes/test/admin-check
 */
import { Hono } from 'hono'
import type { Bindings } from '../../local-types'
import { adminAccess } from '../../middleware/admin-access'

export const testAdminCheckRouter = new Hono<{ Bindings: Bindings }>()

/**
 * Test endpoint that requires admin access
 * GET /test/admin-check
 */
testAdminCheckRouter.get('/', adminAccess, async (c) => {
  return c.json({
    success: true,
    message: 'Admin access granted',
    user: c.get('user'),
  })
})

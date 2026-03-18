/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Context } from 'hono'
import { createMiddleware } from 'hono/factory'

import { PATHS, HTML_STATUS } from '../constants'
import { redirectWithError } from '../lib/redirects'
import { Bindings } from '../local-types'
import { setupNoCacheHeaders } from '../lib/setup-no-cache-headers'

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

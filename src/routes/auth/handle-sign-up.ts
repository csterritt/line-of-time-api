/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { createAuth } from '../../lib/auth'
import { redirectWithError, redirectWithMessage } from '../../lib/redirects'
import { PATHS, STANDARD_SECURE_HEADERS, MESSAGES, COOKIES } from '../../constants'
import type { Bindings } from '../../local-types'
import { createDbClient } from '../../db/client'
import { validateRequest, SignUpFormSchema } from '../../lib/validators'
import {
  handleSignUpResponseError,
  handleSignUpApiError,
  getResponseStatus,
  updateAccountTimestampAfterSignUp,
  redirectToAwaitVerification,
} from '../../lib/sign-up-utils'
import { checkNameExists, getUserIdByEmail } from '../../lib/db-access'
import { addCookie } from '../../lib/cookie-support'

interface SignUpData {
  name: string
  email: string
  password: string
}

/**
 * Handle sign-up form submission with proper UX flow
 * Processes registration via better-auth and redirects to appropriate page
 */
export const handleSignUp = (app: Hono<{ Bindings: Bindings }>): void => {
  app.post(
    PATHS.AUTH.SIGN_UP,
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c) => {
      try {
        const body = await c.req.parseBody()
        const [ok, data, err] = validateRequest(body, SignUpFormSchema)

        if (!ok) {
          return redirectWithError(
            c,
            PATHS.AUTH.SIGN_UP,
            err || MESSAGES.INVALID_INPUT
          )
        }

        const { name, email, password } = data as SignUpData
        const dbClient = createDbClient(c.env.LINE_OF_TIME_DB)

        // Check if name already exists (case-insensitive)
        const nameExistsResult = await checkNameExists(dbClient, name)
        if (nameExistsResult.isErr) {
          console.error(
            'Error checking name existence:',
            nameExistsResult.error
          )
          return redirectWithError(
            c,
            PATHS.AUTH.SIGN_UP,
            MESSAGES.GENERIC_ERROR_TRY_AGAIN
          )
        }

        if (nameExistsResult.value) {
          return redirectWithError(
            c,
            PATHS.AUTH.SIGN_UP,
            MESSAGES.NAME_ALREADY_TAKEN
          )
        }

        // Check if email already exists (unverified duplicate)
        const emailExistsResult = await getUserIdByEmail(dbClient, email)
        if (emailExistsResult.isErr) {
          console.error(
            'Error checking email existence:',
            emailExistsResult.error
          )
          return redirectWithError(
            c,
            PATHS.AUTH.SIGN_UP,
            MESSAGES.GENERIC_ERROR_TRY_AGAIN
          )
        }

        if (emailExistsResult.value.length > 0) {
          addCookie(c, COOKIES.EMAIL_ENTERED, email)
          return redirectWithMessage(
            c,
            PATHS.AUTH.AWAIT_VERIFICATION,
            MESSAGES.ACCOUNT_ALREADY_EXISTS
          )
        }

        const auth = createAuth(c.env)

        try {
          const signUpResponse = await auth.api.signUpEmail({
            body: {
              name,
              email,
              password,
              callbackURL: `${PATHS.AUTH.SIGN_IN}/true`,
            },
          })

          if (!signUpResponse) {
            return redirectWithError(
              c,
              PATHS.AUTH.SIGN_IN,
              MESSAGES.GENERIC_ERROR_TRY_AGAIN
            )
          }

          const errorResponse = handleSignUpResponseError(
            c,
            signUpResponse,
            email,
            PATHS.AUTH.SIGN_IN
          )

          if (errorResponse) {
            return errorResponse
          }

          const responseStatus = getResponseStatus(signUpResponse)
          if (responseStatus !== null && responseStatus !== 200) {
            return redirectWithError(
              c,
              PATHS.AUTH.SIGN_IN,
              MESSAGES.GENERIC_ERROR_TRY_AGAIN
            )
          }

          await auth.api.sendVerificationEmail({
            body: {
              email,
              callbackURL: `${new URL(c.req.url).origin}${PATHS.AUTH.SIGN_IN}/true`,
            },
          })
        } catch (apiError: unknown) {
          return handleSignUpApiError(c, apiError, email, PATHS.AUTH.SIGN_IN)
        }

        await updateAccountTimestampAfterSignUp(dbClient, email)

        return redirectToAwaitVerification(c, email)
      } catch (error) {
        console.error('Sign-up error:', error)
        return redirectWithError(
          c,
          PATHS.AUTH.SIGN_IN,
          MESSAGES.REGISTRATION_GENERIC_ERROR
        )
      }
    }
  )
}

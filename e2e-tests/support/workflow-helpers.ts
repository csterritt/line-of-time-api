import { expect, Page } from '@playwright/test'
import {
  navigateToSignUp,
  navigateToGatedSignUp,
  navigateToInterestSignUp,
  navigateToHome,
  navigateToForgotPassword,
} from './navigation-helpers'
import {
  submitSignUpForm,
  submitGatedSignUpForm,
  submitInterestSignUpForm,
  submitSignInForm,
  submitForgotPasswordForm,
  UserCredentials,
} from './form-helpers'
import {
  verifyOnAwaitVerificationPage,
  verifyOnSignInPage,
  verifyOnTimelinePage,
  verifyOnWaitingForResetPage,
} from './page-verifiers'
import { startSignIn } from './auth-helpers'
import { verifyAlert } from './finders'
import { TEST_USERS, GATED_CODES, ERROR_MESSAGES, BASE_URLS } from './test-data'

/**
 * Workflow helpers for complete multi-step processes
 * Eliminates repeated complex workflows across tests
 */

/**
 * Complete sign-up workflow (navigate → fill → submit → verify redirect)
 */
export const completeSignUpFlow = async (
  page: Page,
  user: UserCredentials = TEST_USERS.NEW_USER
) => {
  await navigateToSignUp(page)
  await submitSignUpForm(page, user)
  await verifyOnAwaitVerificationPage(page)
}

/**
 * Complete gated sign-up workflow
 */
export const completeGatedSignUpFlow = async (
  page: Page,
  code: string = GATED_CODES.WELCOME,
  user: UserCredentials = TEST_USERS.GATED_USER
) => {
  await navigateToGatedSignUp(page)
  await submitGatedSignUpForm(page, { code, ...user })
  await verifyOnAwaitVerificationPage(page)
}

/**
 * Complete interest sign-up workflow (waitlist)
 */
export const completeInterestSignUpFlow = async (
  page: Page,
  email: string = TEST_USERS.INTERESTED_USER.email
) => {
  await navigateToInterestSignUp(page)
  await submitInterestSignUpForm(page, email)
  await verifyOnSignInPage(page)
  await verifyAlert(page, ERROR_MESSAGES.WAITLIST_SUCCESS)
}

/**
 * Complete sign-in workflow (navigate to home → sign-in → fill → submit → verify)
 */
export const completeSignInFlow = async (
  page: Page,
  user = TEST_USERS.KNOWN_USER
) => {
  await navigateToHome(page)
  await startSignIn(page)
  await submitSignInForm(page, user)
  await verifyOnTimelinePage(page)
  await expect(page.getByTestId('sign-out-action')).toBeVisible({
    timeout: 15000,
  })
}

const seededTimelineLoadAttempts = 3
const seededTimelineAttemptTimeoutMs = 5000
const seededTimelinePollDelayMs = 250

export const signInAndWaitForSeededTimeline = async (
  page: Page,
  expectedEventName: string = 'George Washington'
) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await submitSignInForm(page, TEST_USERS.KNOWN_USER)
  await page.waitForURL(/\/ui/)

  let lastError: unknown = null

  for (let attempt = 1; attempt <= seededTimelineLoadAttempts; attempt++) {
    const attemptDeadline = Date.now() + seededTimelineAttemptTimeoutMs

    while (Date.now() < attemptDeadline) {
      const signOutAction = page.getByTestId('sign-out-action')
      const filterControls = page.getByTestId('filter-controls')
      const eventList = page.getByTestId('event-list')
      const noEventsMessage = page.getByTestId('no-events-message')

      const hasSignedInChrome =
        (await signOutAction.count()) > 0 &&
        (await filterControls.count()) > 0

      if (hasSignedInChrome && (await eventList.count()) > 0) {
        const listText = await eventList.textContent()
        if (listText?.includes(expectedEventName)) {
          return
        }
      }

      if (
        hasSignedInChrome &&
        (await noEventsMessage.count()) > 0
      ) {
        break
      }

      await page.waitForTimeout(seededTimelinePollDelayMs)
    }

    lastError = new Error(`Seeded timeline did not load on attempt ${attempt}`)

    if (attempt === seededTimelineLoadAttempts) {
      break
    }

    await page.reload({ waitUntil: 'networkidle' })
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Seeded timeline events did not load')
 }

/**
 * Complete forgot password workflow
 */
export const completeForgotPasswordFlow = async (
  page: Page,
  email: string = TEST_USERS.KNOWN_USER.email
) => {
  await navigateToForgotPassword(page)
  await submitForgotPasswordForm(page, email)
  await verifyOnWaitingForResetPage(page)
  await verifyAlert(page, ERROR_MESSAGES.RESET_LINK_SENT)
}

/**
 * Test duplicate email scenario for sign-up
 */
export const testDuplicateSignUpFlow = async (
  page: Page,
  user: UserCredentials = TEST_USERS.DUPLICATE_USER
) => {
  // First sign-up
  await completeSignUpFlow(page, user)

  // Attempt duplicate sign-up
  await navigateToSignUp(page)
  await submitSignUpForm(page, user)
  await verifyOnAwaitVerificationPage(page)
  await verifyAlert(page, ERROR_MESSAGES.DUPLICATE_EMAIL)
}

/**
 * Test duplicate email scenario for gated sign-up
 */
export const testDuplicateGatedSignUpFlow = async (
  page: Page,
  firstCode: string = GATED_CODES.WELCOME,
  secondCode: string = GATED_CODES.BETA,
  user: UserCredentials = TEST_USERS.DUPLICATE_USER
) => {
  // First sign-up with first code
  await completeGatedSignUpFlow(page, firstCode, user)

  // Attempt duplicate sign-up with different code and different name
  await navigateToGatedSignUp(page)
  await submitGatedSignUpForm(page, {
    code: secondCode,
    email: user.email,
    password: user.password,
    name: user.name + ' 2',
  })
  await verifyOnAwaitVerificationPage(page)
  await verifyAlert(page, ERROR_MESSAGES.DUPLICATE_EMAIL)
}

/**
 * Test duplicate email scenario for interest sign-up (waitlist)
 */
export const testDuplicateInterestSignUpFlow = async (
  page: Page,
  email: string = TEST_USERS.DUPLICATE_USER.email
) => {
  // First submission
  await completeInterestSignUpFlow(page, email)

  // Attempt duplicate submission
  await navigateToInterestSignUp(page)
  await submitInterestSignUpForm(page, email)
  await verifyOnSignInPage(page)
  await verifyAlert(page, ERROR_MESSAGES.ALREADY_ON_WAITLIST)
}

/**
 * Complete sign-up then attempt unverified sign-in workflow
 */
export const signUpThenAttemptUnverifiedSignIn = async (
  page: Page,
  user: UserCredentials = TEST_USERS.NEW_USER
) => {
  // Complete sign-up
  await completeSignUpFlow(page, user)

  // Attempt to sign in before verification
  await navigateToHome(page)
  await startSignIn(page)
  await submitSignInForm(page, { email: user.email, password: user.password })
  await verifyAlert(page, ERROR_MESSAGES.EMAIL_NOT_VERIFIED)
}

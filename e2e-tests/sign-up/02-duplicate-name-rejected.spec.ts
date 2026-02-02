import { test, expect } from '@playwright/test'

import { testWithDatabase } from '../support/test-helpers'
import { skipIfNotMode } from '../support/mode-helpers'
import { navigateToSignUp } from '../support/navigation-helpers'
import { submitSignUpForm } from '../support/form-helpers'
import { verifyAlert } from '../support/finders'
import {
  verifyOnSignUpPage,
  verifyOnAwaitVerificationPage,
} from '../support/page-verifiers'
import { TEST_USERS } from '../support/test-data'

test(
  'rejects sign-up with duplicate name (exact match)',
  testWithDatabase(async ({ page }) => {
    await skipIfNotMode('OPEN_SIGN_UP')

    // First user signs up successfully
    await navigateToSignUp(page)
    await submitSignUpForm(page, TEST_USERS.NEW_USER)
    await verifyOnAwaitVerificationPage(page)

    // Second user attempts to sign up with same name but different email
    await navigateToSignUp(page)
    await submitSignUpForm(page, {
      name: TEST_USERS.NEW_USER.name,
      email: 'different-email@example.com',
      password: 'password123',
    })

    // Should stay on sign-up page with error message
    await verifyOnSignUpPage(page)
    await verifyAlert(
      page,
      'This name is already taken. Please choose a different name.'
    )
  })
)

test(
  'rejects sign-up with duplicate name (case-insensitive)',
  testWithDatabase(async ({ page }) => {
    await skipIfNotMode('OPEN_SIGN_UP')

    // First user signs up with name "Test User"
    await navigateToSignUp(page)
    await submitSignUpForm(page, TEST_USERS.NEW_USER)
    await verifyOnAwaitVerificationPage(page)

    // Second user attempts to sign up with "test user" (different case)
    await navigateToSignUp(page)
    await submitSignUpForm(page, {
      name: 'test user',
      email: 'another-email@example.com',
      password: 'password123',
    })

    // Should stay on sign-up page with error message
    await verifyOnSignUpPage(page)
    await verifyAlert(
      page,
      'This name is already taken. Please choose a different name.'
    )
  })
)

test(
  'allows sign-up with unique name after seeing duplicate error',
  testWithDatabase(async ({ page }) => {
    await skipIfNotMode('OPEN_SIGN_UP')

    // First user signs up
    await navigateToSignUp(page)
    await submitSignUpForm(page, TEST_USERS.NEW_USER)
    await verifyOnAwaitVerificationPage(page)

    // Second user attempts duplicate name
    await navigateToSignUp(page)
    await submitSignUpForm(page, {
      name: TEST_USERS.NEW_USER.name,
      email: 'unique-email@example.com',
      password: 'password123',
    })
    await verifyOnSignUpPage(page)
    await verifyAlert(
      page,
      'This name is already taken. Please choose a different name.'
    )

    // Second user tries again with unique name
    await submitSignUpForm(page, {
      name: 'Unique Name',
      email: 'unique-email@example.com',
      password: 'password123',
    })

    // Should succeed
    await verifyOnAwaitVerificationPage(page)
  })
)

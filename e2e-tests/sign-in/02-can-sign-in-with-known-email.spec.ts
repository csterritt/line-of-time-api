import { test, expect } from '@playwright/test'

import { startSignIn } from '../support/auth-helpers'
import { verifyOnTimelinePage } from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'
import { navigateToHome } from '../support/navigation-helpers'
import { submitSignInForm } from '../support/form-helpers'
import { TEST_USERS } from '../support/test-data'

test(
  'can sign in with known email',
  testWithDatabase(async ({ page }) => {
    // Navigate to startup page
    await navigateToHome(page)

    // Start the sign-in process
    await startSignIn(page)

    // Sign in with a known email from the seeded database
    await submitSignInForm(page, {
      email: TEST_USERS.KNOWN_USER.email,
      password: TEST_USERS.KNOWN_USER.password,
    })

    // Should be redirected to the UI page after successful sign-in
    await verifyOnTimelinePage(page)

    // Verify signed-in UI is visible (more stable than flash message timing)
    await expect(page.getByTestId('sign-out-action')).toBeVisible({
      timeout: 15000,
    })
  })
)

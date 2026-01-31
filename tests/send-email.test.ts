// ====================================
// Tests for send-email.ts
// To run this, cd to this directory and type 'bun test'
// ====================================

import { describe, it, expect } from 'bun:test'
import { sendOtpToUserViaEmail } from '../src/lib/send-email'
import type { Bindings } from '../src/local-types'

const mockEnv = {} as Bindings

describe('sendOtpToUserViaEmail', () => {
  it('sends email with correct content and OTP code', async () => {
    // Mock data
    const testEmail = 'test@example.com'
    const testOtp = '123456'
    let capturedArgs: any = null

    // Create mock email agent that captures arguments and returns successfully
    const mockEmailAgent = async (
      _env: Bindings,
      fromAddress: string,
      toAddress: string,
      subject: string,
      content: string
    ): Promise<void> => {
      capturedArgs = { fromAddress, toAddress, subject, content }
      return Promise.resolve()
    }

    // Call the function with our mock
    const result = await sendOtpToUserViaEmail(
      mockEnv,
      testEmail,
      testOtp,
      mockEmailAgent
    )

    // Verify result is successful
    expect(result.isOk).toBe(true)

    // Verify email was "sent" with correct parameters
    expect(capturedArgs).not.toBeNull()
    expect(capturedArgs?.fromAddress).toBe('noreply@cls.cloud')
    expect(capturedArgs?.toAddress).toBe(testEmail)
    expect(capturedArgs?.subject).toBe(
      'Your Line-of-Time project Verification Code'
    )

    // Verify email content contains the OTP
    expect(capturedArgs?.content.includes(`<strong>${testOtp}</strong>`)).toBe(
      true
    )
    expect(capturedArgs?.content.includes('<h1>Verification Code</h1>')).toBe(
      true
    )
    expect(
      capturedArgs?.content.includes('This code will expire in 15 minutes')
    ).toBe(true)
  })

  it('handles email sending failure', async () => {
    // Mock data
    const testEmail = 'test@example.com'
    const testOtp = '123456'

    // Create mock email agent that fails
    const mockFailingEmailAgent = async (): Promise<void> => {
      throw new Error('Email sending failed')
    }

    // Call the function with our failing mock
    const result = await sendOtpToUserViaEmail(
      mockEnv,
      testEmail,
      testOtp,
      mockFailingEmailAgent
    )

    // Verify result is an error
    expect(result.isErr).toBe(true)
    expect(result.error?.message).toContain('Email sending failed')
  })
})

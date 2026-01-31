/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export const generateToken = async () => {
  // Generate a random 6-digit code not starting with zero
  let sessionToken: string = ''
    sessionToken = String(Math.floor(100_000 + Math.random() * 900_000))

  return sessionToken
}

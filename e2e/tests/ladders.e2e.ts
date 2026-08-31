import { expect, test } from '@playwright/test'

import {
  compactOnly,
  expectNoSideScroll,
  expectTouchReady,
  hostRoom,
  joinRoom,
  seatOnTurn,
  secondSeat,
  startGame,
} from '../support/table'

/**
 * Snakes & Ladders: a die, a track, and a token per seat. The die is a three.js
 * one loaded with the table rather than with the app, so the first thing worth
 * proving is that it arrives at all.
 */
test.describe('Snakes and Ladders', () => {
  test('lays out the track and lets the seat on turn roll', async ({ page, browser }) => {
    const code = await hostRoom(page, 'ladders', 'Ada')
    const guest = await secondSeat(browser)

    try {
      await joinRoom(guest.page, 'ladders', code, 'Bo')
      await startGame(page, [guest.page])

      for (const seat of [page, guest.page]) {
        await expect(seat.locator('.game')).toBeVisible()
        await expect(seat.locator('.board')).toBeVisible()
        await expectNoSideScroll(seat)
      }

      const roller = await seatOnTurn([page, guest.page], /Your turn/)
      const waiting = roller === page ? guest.page : page

      // The button is on both screens; only one of them may press it.
      const roll = (seat: typeof page) => seat.getByRole('button', { name: 'Roll', exact: true })
      await expect(roll(roller)).toBeEnabled()
      await expect(roll(waiting)).toBeDisabled()

      await roll(roller).click()
      // The die tumbles, the token walks, and only then does the turn pass. The
      // budget is for the animation, not for the server, which settled the
      // throw before any of it started.
      await expect(waiting.locator('.topbar')).toContainText('Your turn', { timeout: 60_000 })
    } finally {
      await guest.close()
    }
  })

  test('keeps the roll within a thumb of the board on a phone', async ({ page, browser }) => {
    compactOnly()

    const code = await hostRoom(page, 'ladders', 'Ada')
    const guest = await secondSeat(browser)

    try {
      await joinRoom(guest.page, 'ladders', code, 'Bo')
      await startGame(page, [guest.page])
      await expectTouchReady(page)
    } finally {
      await guest.close()
    }
  })
})

import { expect, test } from '@playwright/test'

import {
  compactOnly,
  expectNoSideScroll,
  expectTouchReady,
  hostRoom,
  joinRoom,
  secondSeat,
  startGame,
} from '../support/table'

/**
 * Halli Galli: everyone watches one pile and races for the bell, so the bell is
 * the one control that has to be on every screen at once — not just the seat
 * whose turn it is to flip.
 */
test.describe('Halli Galli', () => {
  test('deals a table where every seat can reach the bell', async ({ page, browser }) => {
    const code = await hostRoom(page, 'halligalli', 'Ada')
    const guest = await secondSeat(browser)

    try {
      await joinRoom(guest.page, 'halligalli', code, 'Bo')
      await startGame(page, [guest.page])

      for (const seat of [page, guest.page]) {
        await expect(seat.locator('.game')).toBeVisible()
        await expect(seat.locator('.bell')).toBeVisible()
        await expectNoSideScroll(seat)
      }

      // The flip belongs to one seat at a time; the bell belongs to everyone. The
      // button is under both tables, so it is the live one that is counted.
      const live = await Promise.all(
        [page, guest.page].map((seat) => seat.getByRole('button', { name: 'Flip card' }).isEnabled()),
      )
      expect(live.filter(Boolean), 'exactly one seat may flip').toHaveLength(1)
    } finally {
      await guest.close()
    }
  })

  test('keeps the bell a thumb-sized target on a phone', async ({ page, browser }) => {
    compactOnly()

    const code = await hostRoom(page, 'halligalli', 'Ada')
    const guest = await secondSeat(browser)

    try {
      await joinRoom(guest.page, 'halligalli', code, 'Bo')
      await startGame(page, [guest.page])

      const bell = await page.locator('.bell').boundingBox()
      expect(bell).not.toBeNull()
      expect(bell!.height, 'the bell is the whole game on a phone').toBeGreaterThanOrEqual(44)
      await expectTouchReady(page)
    } finally {
      await guest.close()
    }
  })
})

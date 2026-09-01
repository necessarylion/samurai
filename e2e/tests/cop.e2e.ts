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
 * COP: one seat is the Cop and the rest hide behind doors, so the two windows
 * are asked different questions at the same moment — which is the thing worth
 * checking that no single-window test can.
 */
test.describe('COP', () => {
  test('sets one seat searching and the others hiding', async ({ page, browser }) => {
    const code = await hostRoom(page, 'cop', 'Ada')
    const guest = await secondSeat(browser)

    try {
      await joinRoom(guest.page, 'cop', code, 'Bo')
      await startGame(page, [guest.page])

      for (const seat of [page, guest.page]) {
        await expect(seat.locator('.game')).toBeVisible()
        await expect(seat.locator('.door').first()).toBeVisible()
        await expectNoSideScroll(seat)
      }

      // One of them is the Cop and the other is hiding from them. Both screens
      // name the Cop; only the Cop's own screen says it is them.
      const told = await Promise.all(
        [page, guest.page].map((seat) => seat.getByText(/You.re the Cop/).count()),
      )
      expect(told.filter((n) => n > 0), 'exactly one seat is the Cop').toHaveLength(1)

      const thief = told[0] > 0 ? guest.page : page
      await expect(thief.getByText('Choose a door to slip behind')).toBeVisible()
    } finally {
      await guest.close()
    }
  })

  test('keeps the doors tappable on a phone', async ({ page, browser }) => {
    compactOnly()

    const code = await hostRoom(page, 'cop', 'Ada')
    const guest = await secondSeat(browser)

    try {
      await joinRoom(guest.page, 'cop', code, 'Bo')
      await startGame(page, [guest.page])

      const door = await page.locator('.door').first().boundingBox()
      expect(door).not.toBeNull()
      expect(door!.height).toBeGreaterThanOrEqual(44)
      await expectTouchReady(page)
    } finally {
      await guest.close()
    }
  })
})

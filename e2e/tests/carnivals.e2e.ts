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
 * Carnivals: a betting game with a dealer drawn quietly and no shot clock, so
 * the table simply opens and waits. The cards a seat is shown are its own.
 */
test.describe('Carnivals', () => {
  test('opens a table with a bank and a hand for each seat', async ({ page, browser }) => {
    const code = await hostRoom(page, 'carnivals', 'Ada')
    const guest = await secondSeat(browser)

    try {
      await joinRoom(guest.page, 'carnivals', code, 'Bo')
      await startGame(page, [guest.page])

      for (const seat of [page, guest.page]) {
        await expect(seat.locator('.game')).toBeVisible()
        // One hand per seat at the table, so this is a row of them.
        await expect(seat.locator('.cards').first()).toBeVisible()
        // Each seat carries its own purse, so this is one per player too.
        await expect(seat.locator('.bank').first()).toBeVisible()
        await expectNoSideScroll(seat)
      }
    } finally {
      await guest.close()
    }
  })

  test('fits a phone', async ({ page, browser }) => {
    compactOnly()

    const code = await hostRoom(page, 'carnivals', 'Ada')
    const guest = await secondSeat(browser)

    try {
      await joinRoom(guest.page, 'carnivals', code, 'Bo')
      await startGame(page, [guest.page])
      await expectTouchReady(page)
    } finally {
      await guest.close()
    }
  })
})

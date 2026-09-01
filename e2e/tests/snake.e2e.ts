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
 * Snake: every seat moves at once rather than in turn, so there is no seat on
 * the clock to look for — the arena is simply live on both screens.
 */
test.describe('Snake', () => {
  test('opens one arena on every screen', async ({ page, browser }) => {
    const code = await hostRoom(page, 'snake', 'Ada')
    const guest = await secondSeat(browser)

    try {
      await joinRoom(guest.page, 'snake', code, 'Bo')
      await startGame(page, [guest.page])

      for (const seat of [page, guest.page]) {
        await expect(seat.locator('.game')).toBeVisible()
        await expect(seat.locator('.board-wrap .board')).toBeVisible()
        await expectNoSideScroll(seat)
      }
    } finally {
      await guest.close()
    }
  })

  test('gives the arena the screen on a phone', async ({ page, browser }) => {
    compactOnly()

    const code = await hostRoom(page, 'snake', 'Ada')
    const guest = await secondSeat(browser)

    try {
      await joinRoom(guest.page, 'snake', code, 'Bo')
      await startGame(page, [guest.page])

      const board = await page.locator('.board').boundingBox()
      const view = page.viewportSize()!
      expect(board).not.toBeNull()
      expect(board!.width).toBeLessThanOrEqual(view.width)
      // The arena is square, so whichever way the phone is held it is the
      // shorter side of the screen that limits it — half of that is the floor.
      const room = Math.min(view.width, view.height)
      expect(Math.max(board!.width, board!.height), 'the arena is what the screen is for')
        .toBeGreaterThan(room * 0.5)
      await expectTouchReady(page)
    } finally {
      await guest.close()
    }
  })
})

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
 * Samurai: the one game with a draft between the lobby and the table, and the
 * one whose board is an SVG that pans and zooms rather than a grid of elements.
 */
test.describe('Samurai', () => {
  test('two seats draft their hands and reach the board', async ({ page, browser }) => {
    const code = await hostRoom(page, 'samurai', 'Ada')
    const guest = await secondSeat(browser)

    try {
      await joinRoom(guest.page, 'samurai', code, 'Bo')
      await startGame(page, [guest.page])

      // Both seats draft at once: twenty tiles offered, five kept.
      for (const seat of [page, guest.page]) {
        await expect(seat.locator('.draft')).toBeVisible()
        await expect(seat.locator('.tile-btn')).toHaveCount(20)
        await seat.getByRole('button', { name: 'Choose for me' }).click()
        await expect(seat.locator('.tile-btn.picked')).toHaveCount(5)
        await seat.getByRole('button', { name: 'Confirm hand' }).click()
      }

      // The table proper: the board, and a hand to play off.
      for (const seat of [page, guest.page]) {
        await expect(seat.locator('.samurai.game')).toBeVisible()
        await expect(seat.locator('svg.board')).toBeVisible()
        await expect(seat.locator('.hand .tile-btn')).toHaveCount(5)
        await expectNoSideScroll(seat)
      }

      // Exactly one of them is on the clock, whichever seat won the opening.
      const onTurn = await page.locator('.topbar').getByText('Your turn').count()
      const theirs = await guest.page.locator('.topbar').getByText('Your turn').count()
      expect(onTurn + theirs).toBe(1)
    } finally {
      await guest.close()
    }
  })

  test('the panel is a sheet on a phone, and the board keeps the screen', async ({
    page,
    browser,
  }) => {
    compactOnly()

    const code = await hostRoom(page, 'samurai', 'Ada')
    const guest = await secondSeat(browser)

    try {
      await joinRoom(guest.page, 'samurai', code, 'Bo')
      await startGame(page, [guest.page])
      for (const seat of [page, guest.page]) {
        await seat.getByRole('button', { name: 'Choose for me' }).click()
        await seat.getByRole('button', { name: 'Confirm hand' }).click()
      }

      // The players and the log are away until asked for.
      await expect(page.locator('#game-sidebar')).toHaveCount(0)
      await page.locator('.sidebar-handle').click()
      await expect(page.locator('#game-sidebar.sheet')).toBeVisible()

      // Tapping beside the sheet puts it back.
      // Near the top: the middle of the scrim is behind the sheet itself.
      await page.locator('.sheet-scrim').click({ position: { x: 5, y: 5 } })
      await expect(page.locator('#game-sidebar')).toHaveCount(0)

      // The ticker stands in for the log the sheet took away.
      await expect(page.locator('.ticker')).toBeVisible()
      await expectTouchReady(page)
    } finally {
      await guest.close()
    }
  })
})

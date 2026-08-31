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
 * Coup: the game that hides the most. What a seat may do is computed per viewer
 * on the server, so the two windows are deliberately checked against each
 * other — the seat off turn must not be offered an action.
 */
test.describe('Coup', () => {
  test('deals two influence to each seat and offers the actions to one', async ({
    page,
    browser,
  }) => {
    const code = await hostRoom(page, 'coup', 'Ada')
    const guest = await secondSeat(browser)

    try {
      await joinRoom(guest.page, 'coup', code, 'Bo')
      await startGame(page, [guest.page])

      for (const seat of [page, guest.page]) {
        await expect(seat.locator('.game')).toBeVisible()
        await expect(seat.locator('.court')).toBeVisible()
        await expectNoSideScroll(seat)
      }

      const actor = await seatOnTurn([page, guest.page], /Your turn/)
      const waiting = actor === page ? guest.page : page

      const income = actor.getByRole('button', { name: 'Income', exact: true })
      await expect(income).toBeEnabled()
      await expect(waiting.getByRole('button', { name: 'Income', exact: true })).toHaveCount(0)

      // Income is the one action nobody may challenge or block, so it settles
      // on its own and the turn passes.
      await income.click()
      await expect(waiting.locator('.topbar')).toContainText('Your turn')
    } finally {
      await guest.close()
    }
  })

  test('fits a phone, hands and all', async ({ page, browser }) => {
    compactOnly()

    const code = await hostRoom(page, 'coup', 'Ada')
    const guest = await secondSeat(browser)

    try {
      await joinRoom(guest.page, 'coup', code, 'Bo')
      await startGame(page, [guest.page])
      // One hand per seat around the ring; your own is the first of them.
      await expect(page.locator('.cards').first()).toBeVisible()
      await expectTouchReady(page)
    } finally {
      await guest.close()
    }
  })
})

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
 * Monopoly: forty spaces on an 11x11 ring, two dice in the middle, and a table
 * that reorganises itself completely below 960px.
 */
test.describe('Monopoly', () => {
  test('the board is dealt whole and the seat on turn can throw', async ({ page, browser }) => {
    const code = await hostRoom(page, 'monopoly', 'Ada')
    const guest = await secondSeat(browser)

    try {
      await joinRoom(guest.page, 'monopoly', code, 'Bo')
      await startGame(page, [guest.page])

      for (const seat of [page, guest.page]) {
        await expect(seat.locator('.board .space')).toHaveCount(40)
        await expect(seat.locator('.centre-panel .dice')).toBeVisible()
        await expectNoSideScroll(seat)
      }

      // Only one seat is offered the throw, and it is the one on turn.
      const thrower = await seatOnTurn([page, guest.page], /Your turn/)
      const waiting = thrower === page ? guest.page : page
      await expect(waiting.getByRole('button', { name: 'Throw the dice' })).toHaveCount(0)

      await thrower.getByRole('button', { name: 'Throw the dice' }).click()
      // Two dice, two seconds of tumbling and then a walk round the board, with
      // three.js loading cold the first time a context sees it. The budget is
      // for that, not for the server.
      await expect(thrower.locator('.topbar')).toContainText(/threw \d and \d/, { timeout: 60_000 })
    } finally {
      await guest.close()
    }
  })

  test('a phone gets the board, the action and three tabs', async ({ page, browser }) => {
    compactOnly(960)

    const code = await hostRoom(page, 'monopoly', 'Ada')
    const guest = await secondSeat(browser)

    try {
      await joinRoom(guest.page, 'monopoly', code, 'Bo')
      await startGame(page, [guest.page])

      // Every seat and its cash, above the board.
      await expect(page.locator('.now .now-seat')).toHaveCount(2)
      await expect(page.locator('.now-seat.current')).toHaveCount(1)

      // The prompt has left the middle of the board for the bar beneath it.
      await expect(page.locator('.actions-slot .prompt')).toBeVisible()
      await expect(page.locator('.centre-panel .prompt')).toHaveCount(0)

      // The two side columns, behind three tabs.
      const tabs = page.locator('.tabs .tab')
      await expect(tabs).toHaveCount(3)
      await tabs.nth(1).click()
      await expect(page.locator('.manage.open')).toBeVisible()
      // Near the top of the scrim: its centre is under the open sheet once the
      // sheet has finished sliding up, and a click there is intercepted.
      await page.locator('.sheet-scrim').click({ position: { x: 5, y: 5 } })
      // Hidden, not merely un-opened: the sheet takes a fifth of a second to
      // slide back down, and until it has it is still over the bottom of the
      // board — where the next tap is aimed.
      await expect(page.locator('.manage')).toBeHidden()

      // A tap on a space opens the card a desktop opens on hover.
      await page.locator('.board .space').nth(1).click()
      await expect(page.locator('.detail-sheet')).toBeVisible()
      await page.locator('.detail-scrim').click({ position: { x: 5, y: 5 } })
      await expect(page.locator('.detail-sheet')).toHaveCount(0)

      await expectTouchReady(page)
    } finally {
      await guest.close()
    }
  })

  test('the board keeps its square whatever the screen', async ({ page, browser }) => {
    const code = await hostRoom(page, 'monopoly', 'Ada')
    const guest = await secondSeat(browser)

    try {
      await joinRoom(guest.page, 'monopoly', code, 'Bo')
      await startGame(page, [guest.page])

      const box = await page.locator('.board').boundingBox()
      expect(box).not.toBeNull()
      expect(Math.abs(box!.width - box!.height), 'the board is square').toBeLessThan(2)
      // And it is inside the window, not spilling out of it.
      expect(box!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
    } finally {
      await guest.close()
    }
  })
})

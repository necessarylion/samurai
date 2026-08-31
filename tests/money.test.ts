import { describe, expect, it } from 'vitest'

import { money } from '../shared/money'
import { GO_SALARY, SPACES, START_CASH, priceOf } from '../shared/monopoly'

/**
 * The engine's figures are Monopoly's own ladder and never change — this is
 * only how they are read. The point of the unit is that a board of technology
 * companies should not be priced like a 1930s street.
 */
describe('money on screen', () => {
  it('writes every figure in billions, however large', () => {
    expect(money(60)).toBe('$60B')
    expect(money(400)).toBe('$400B')
    // Deliberately not $1T: a panel mixing units makes the reader convert
    // between them to see which of two players is ahead.
    expect(money(1000)).toBe('$1,000B')
    expect(money(1500)).toBe('$1,500B')
    expect(money(12000)).toBe('$12,000B')
  })

  it('handles nothing, and a debt owed', () => {
    expect(money(0)).toBe('$0')
    expect(money(-300)).toBe('-$300B')
  })

  it('never renders a figure the board could not fit', () => {
    // Every price, the salary and the starting purse are drawn in a space a few
    // characters wide, so none of them may spill into a long decimal.
    const shown = [
      money(START_CASH),
      money(GO_SALARY),
      ...SPACES.map((_, i) => money(priceOf(i))),
    ]
    for (const text of shown) expect(text.length).toBeLessThanOrEqual(7)
    // The largest figure a table can hold is every purse at once, and even that
    // has to fit the player panel.
    expect(money(START_CASH * 8).length).toBeLessThanOrEqual(9)
  })

  it('keeps the board in the order the ladder puts it', () => {
    // The unit must not reorder anything: the cheapest company still reads
    // cheapest and the dearest still reads dearest.
    const streets = SPACES.map((s, i) => ({ s, i })).filter((x) => x.s.kind === 'street')
    const cheapest = streets[0]
    const dearest = streets[streets.length - 1]
    expect(priceOf(cheapest.i)).toBeLessThan(priceOf(dearest.i))
    expect(money(priceOf(cheapest.i))).toBe('$60B')
    expect(money(priceOf(dearest.i))).toBe('$400B')
  })
})

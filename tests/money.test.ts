import { describe, expect, it } from 'vitest'

import { money } from '../src/game/money'
import { GO_SALARY, SPACES, START_CASH, priceOf } from '../shared/monopoly'

/**
 * The engine's figures are Monopoly's own ladder and never change — this is
 * only how they are read. The point of the unit is that a board of technology
 * companies should not be priced like a 1930s street.
 */
describe('money on screen', () => {
  it('writes billions below a thousand and trillions above it', () => {
    expect(money(60)).toBe('$60B')
    expect(money(400)).toBe('$400B')
    expect(money(1000)).toBe('$1T')
    expect(money(1500)).toBe('$1.5T')
    expect(money(4000)).toBe('$4T')
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

/**
 * How Monopoly's money is written on screen.
 *
 * The engine's figures are the classic property ladder — 60 through 400 for the
 * board, 1500 to start — and they stay exactly that, because every rent table,
 * mortgage value and house cost is balanced against them. Changing a single one
 * would change the game. What changes is only how they are *read*: a board of
 * technology companies priced at "60" reads like a 1930s street rather than a
 * market cap, so the same numbers are shown in billions.
 *
 * That puts the board in the right ballpark and, more to the point, in the
 * right order: Snap at $60B and Apple at $400B is roughly how the two compare,
 * where "60" and "400" said nothing at all. It is deliberately not exact — the
 * ladder is Monopoly's, and the game matters more than the accountancy.
 */

/** A figure as it appears on screen: `$60B`, `$1.5T`, `$0`. */
export function money(amount: number): string {
  if (!Number.isFinite(amount) || amount === 0) return '$0'
  const sign = amount < 0 ? '-' : ''
  const n = Math.abs(amount)
  if (n < 1000) return `${sign}$${n}B`
  const trillions = n / 1000
  // A round trillion loses the decimal; $1.5T keeps it. Anything past one place
  // is noise at the size these are drawn.
  return `${sign}$${trillions % 1 === 0 ? trillions : trillions.toFixed(1)}T`
}

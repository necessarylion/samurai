/**
 * How Monopoly's money is written — on screen and in the play log alike.
 *
 * This sits in `shared/` rather than beside the client's other display helpers
 * because the engine writes the log and the card texts, and a board reading
 * "$180B" beside a log reading "buys Netflix for 180" is two units for one
 * currency.
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
 *
 * Everything is in billions, including the large ones: a table showing $810B
 * beside $1.2T asks the reader to convert between two units to see which is
 * bigger, which is exactly the comparison a player makes most often. One unit
 * throughout, with a separator for the long figures, keeps them lined up.
 */

/** A figure as it appears on screen: `$60B`, `$1,500B`, `$0`. */
export function money(amount: number): string {
  if (!Number.isFinite(amount) || amount === 0) return '$0'
  const sign = amount < 0 ? '-' : ''
  return `${sign}$${Math.abs(amount).toLocaleString('en-GB')}B`
}

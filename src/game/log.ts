import type { PlayerColour } from '@shared/types'

/**
 * Reading a log line back through the table.
 *
 * Engines write a seat as `#id`, because `shared/` has no idea what anyone is
 * called. Two things on screen word the same entry — the play log in the
 * sidebar and the move ticker beside the board on a narrow screen — so the
 * substitution lives here rather than in whichever of them was written first.
 */

export interface LogSeat {
  id: number
  name: string
  colour: PlayerColour
}

export function seatOf(players: readonly LogSeat[], id: number | null): LogSeat | null {
  if (id === null) return null
  return players.find((p) => p.id === id) ?? null
}

/** The entry's text with every `#id` swapped for that seat's name. */
export function wordEntry(text: string, players: readonly LogSeat[]): string {
  return text.replace(/#(\d+)/g, (whole, id: string) => seatOf(players, Number(id))?.name ?? whole)
}

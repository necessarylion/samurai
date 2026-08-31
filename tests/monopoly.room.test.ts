import { describe, expect, it } from 'vitest'

import { DEFAULT_OPTIONS } from '../shared/engine'
import type { MonopolyClientState } from '../shared/protocol'
import { HOUSE_SUPPLY, START_CASH, groupSpaces, priceOf } from '../shared/monopoly'
import { Room, type RoomSnapshot } from '../server/rooms'

/** A started two-player Monopoly room. */
function room(turnSeconds = 0, seats = 2): Room {
  const r = new Room('MONO')
  r.options = { ...DEFAULT_OPTIONS, kind: 'monopoly', diceStart: false, turnSeconds }
  const names = ['Ada', 'Bo', 'Cy']
  for (let i = 0; i < seats; i++) r.addSeat(`token-${i}`, names[i])
  r.start()
  r.monopoly!.state.current = 0
  return r
}

const view = (r: Room, token: string) => r['stateFor'](token) as MonopolyClientState

describe('a Monopoly room', () => {
  it('deals a monopoly engine, not a Samurai one, from the option', () => {
    const r = room()
    expect(r.monopoly).not.toBeNull()
    expect(r.game).toBeNull()
    expect(r.started).toBe(true)
  })

  it('sends the whole board — cash and ownership are public here', () => {
    const r = room()
    const state = view(r, 'token-0')
    expect(state.kind).toBe('monopoly')
    expect(state.phase).toBe('play')
    expect(state.you).toBe(0)
    expect(state.players.map((p) => p.cash)).toEqual([START_CASH, START_CASH])
    expect(state.owners).toHaveLength(40)
    expect(state.bank.houses).toBe(HOUSE_SUPPLY)
    // The deck order is the one thing that stays here; only its size travels.
    expect(state.decks.chance).toBeGreaterThan(0)
    expect(state).not.toHaveProperty('chance.0')
  })

  it('works out each viewer’s affordances rather than making them derive them', () => {
    const r = room()
    expect(view(r, 'token-0').can.roll).toBe(true)
    expect(view(r, 'token-1').can.roll).toBe(false)
    // A spectator is offered nothing at all.
    expect(view(r, 'nobody').can.roll).toBe(false)
    expect(view(r, 'nobody').you).toBeNull()
  })

  it('offers the build button only to a seat that may actually build', () => {
    const r = room()
    const spaces = groupSpaces('brown')
    r.monopoly!.state.owners[spaces[0]] = 0
    expect(view(r, 'token-0').can.build).toEqual([])
    // Only the full group unlocks it, which is the engine's rule, not the view's.
    r.monopoly!.state.owners[spaces[1]] = 0
    expect(view(r, 'token-0').can.build).toEqual(spaces)
    expect(view(r, 'token-1').can.build).toEqual([])
  })

  it('keeps a trade offer between the two seats it is between', () => {
    const r = room(0, 3)
    r.monopoly!.state.owners[1] = 0
    expect(r.monopoly!.offerTrade(0, 1, { spaces: [1], cash: 0 }, { spaces: [], cash: 60 }).ok).toBe(
      true,
    )
    const offerer = view(r, 'token-0').pending
    const partner = view(r, 'token-1').pending
    const bystander = view(r, 'token-2').pending
    expect(offerer).toMatchObject({ step: 'trade', give: { spaces: [1], cash: 0 } })
    expect(partner).toMatchObject({ step: 'trade', want: { spaces: [], cash: 60 } })
    // The rest of the table sees that the two of them are talking, not the terms.
    expect(bystander).toMatchObject({ step: 'trade', from: 0, to: 1 })
    expect(bystander).toMatchObject({ give: { spaces: [], cash: 0 }, want: { spaces: [], cash: 0 } })
    expect(view(r, 'token-1').can.trade).toBe(true)
    expect(view(r, 'token-2').can.trade).toBe(false)
  })

  it('reflects a purchase and survives a snapshot round-trip', () => {
    const r = room()
    const mp = r.monopoly!
    mp.state.players[0].pos = 0
    mp.state.pending = [{ step: 'buy', player: 0, space: 3 }]
    expect(view(r, 'token-0').can.buy).toBe(3)
    mp.buy(0)
    expect(view(r, 'token-0').owners[3]).toBe(0)
    expect(view(r, 'token-0').players[0].cash).toBe(START_CASH - priceOf(3))

    const back = Room.fromSnapshot(JSON.parse(JSON.stringify(r.toSnapshot())) as RoomSnapshot)
    expect(back.monopoly!.state).toEqual(mp.state)
    expect(back.game).toBeNull()
  })

  it('runs the shot clock on the table, re-armed as the decision moves seats', () => {
    const r = room(30)
    r.syncTurnTimer(1000)
    expect(r.turnDeadline).toBe(31_000)
    expect(view(r, 'token-0').turnMsLeft).not.toBeNull()

    // An auction is a decision the roller does not own, so it gets its own period
    // rather than inheriting whatever was left of theirs.
    r.monopoly!.state.pending = [{ step: 'auction', space: 3, high: 0, highBidder: null, passed: [] }]
    r.syncTurnTimer(5000)
    expect(r.turnDeadline).toBe(35_000)
  })

  it('freezes the clock while the table is paused', () => {
    const r = room(30)
    r.syncTurnTimer(1000)
    r.monopoly!.pause(0)
    r.syncTurnTimer(6000)
    expect(r.turnMsLeft(6000)).toBe(r.turnMsLeft(9000))
    expect(r.paused).toBe(true)
  })

  it('deals a fresh game on rematch once it is over', () => {
    const r = room()
    r.monopoly!.state.phase = 'over'
    r.monopoly!.state.result = { winner: 0, standings: [0, 1], reason: 'test' }
    for (const seat of r.seats) seat.connected = true
    expect(r.rematch()).toBeNull()
    expect(r.monopoly!.state.phase).toBe('play')
    expect(r.monopoly!.state.players.every((p) => p.cash === START_CASH)).toBe(true)
  })

  it('clears the engine when the host abandons the game', () => {
    const r = room()
    for (const seat of r.seats) seat.connected = true
    expect(r.abandon()).toBeNull()
    expect(r.monopoly).toBeNull()
    expect(r.started).toBe(false)
    expect(view(r, 'token-0').phase).toBe('lobby')
  })
})

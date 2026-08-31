// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'

import SpaceDetail from '../src/components/monopoly/SpaceDetail.vue'
import { DEFAULT_OPTIONS } from '../shared/engine'
import { HOTEL, SPACES, groupSpaces, mortgageValue, priceOf } from '../shared/monopoly'
import type { MonopolyClientState } from '../shared/protocol'
import { Room } from '../server/rooms'
import { useGameStore } from '../src/stores/game'

/**
 * The hover card is the only place the game says what a space charges, and what
 * it would charge if it were built on. Getting a rung wrong would quietly
 * mislead every decision a player makes.
 */
function room(): Room {
  const r = new Room('TEST')
  r.options = { ...DEFAULT_OPTIONS, kind: 'monopoly', diceStart: false }
  r.addSeat('token-a', 'Ada')
  r.addSeat('token-b', 'Bo')
  r.start()
  r.monopoly!.state.current = 0
  return r
}

const view = (r: Room, token: string) => r['stateFor'](token) as MonopolyClientState

function card(r: Room, n: number, token = 'token-a') {
  const store = useGameStore()
  store.monopoly = view(r, token)
  return mount(SpaceDetail, { props: { n } })
}

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})

describe('the space detail card', () => {
  it('names the sector the colour band stands for', () => {
    const r = room()
    const cyan = groupSpaces('cyan')[0]
    expect(card(r, cyan).text()).toContain('Consumer apps')
    // A data centre is in no sector, so it claims none.
    expect(card(r, 5).text()).not.toContain('Consumer apps')
  })

  it('lays out the whole rent ladder, not just what it charges today', () => {
    const r = room()
    const n = groupSpaces('cyan')[0]
    const street = SPACES[n]
    if (street.kind !== 'street') throw new Error('expected a company')
    const text = card(r, n).text()
    expect(text).toContain(`$${street.rent[0]}B`)
    expect(text).toContain(`$${street.rent[0] * 2}B`)
    for (const rung of [1, 2, 3, 4, HOTEL]) expect(text).toContain(`$${street.rent[rung]}B`)
    expect(text).toContain(`$${priceOf(n)}B`)
    expect(text).toContain(`$${mortgageValue(n)}B`)
  })

  it('marks the rung the space is actually on', () => {
    const r = room()
    const [a, b, c] = groupSpaces('cyan')
    const street = SPACES[a]
    if (street.kind !== 'street') throw new Error('expected a company')

    // Unowned: the bare rung.
    expect(card(r, a).find('.rung.on dd').text()).toBe(`$${street.rent[0]}B`)

    // A whole sector doubles a bare rent, and that is the rung it moves to.
    for (const i of [a, b, c]) r.monopoly!.state.owners[i] = 0
    expect(card(r, a).find('.rung.on dd').text()).toBe(`$${street.rent[0] * 2}B`)

    // Built on, it is the office rung.
    r.monopoly!.state.houses[a] = 3
    expect(card(r, a).find('.rung.on dd').text()).toBe(`$${street.rent[3]}B`)

    // Mortgaged, it charges nothing, so no rung is claimed as current.
    r.monopoly!.state.houses[a] = 0
    r.monopoly!.state.mortgaged[a] = true
    const dead = card(r, a)
    expect(dead.findAll('.rung.on')).toHaveLength(0)
    expect(dead.text()).toContain('Mortgaged')
  })

  it('scales a data centre by how many the owner holds', () => {
    const r = room()
    const stations = SPACES.map((s, i) => ({ s, i }))
      .filter((x) => x.s.kind === 'station')
      .map((x) => x.i)
    r.monopoly!.state.owners[stations[0]] = 0
    r.monopoly!.state.owners[stations[1]] = 0
    const marked = card(r, stations[0]).find('.rung.on')
    expect(marked.text()).toContain('2 of 4')
    expect(marked.text()).toContain('$50B')
  })

  it('says a utility charges a multiple of the throw, not a figure', () => {
    const r = room()
    const utility = SPACES.findIndex((s) => s.kind === 'utility')
    r.monopoly!.state.owners[utility] = 0
    const text = card(r, utility).text()
    expect(text).toContain('4× the throw')
    expect(text).toContain('10× the throw')
    expect(card(r, utility).find('.rung.on').text()).toContain('4×')
  })

  it('explains the spaces that charge no rent at all', () => {
    const r = room()
    expect(card(r, 0).text()).toContain('every time you pass')
    expect(card(r, 20).text()).toContain('Nothing happens here')
    expect(card(r, 30).text()).toContain('do not collect the IPO')
    // A tax says what it costs, which the board space itself does not show.
    expect(card(r, 4).text()).toContain('$200B')
  })

  it('says whose it is, and calls your own yours', () => {
    const r = room()
    const n = groupSpaces('cyan')[0]
    expect(card(r, n).text()).toContain('Unowned')
    r.monopoly!.state.owners[n] = 1
    expect(card(r, n).text()).toContain('Bo')
    r.monopoly!.state.owners[n] = 0
    expect(card(r, n).text()).toContain('Yours')
  })
})

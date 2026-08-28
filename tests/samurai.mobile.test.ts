// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import GameScreen from '../src/components/samurai/GameScreen.vue'
import { DEFAULT_OPTIONS } from '../shared/engine'
import { Room } from '../server/rooms'
import type { ClientState } from '../shared/protocol'
import { legalPlacements } from '../shared/rules'
import { tileFromId } from '../shared/tiles'
import { useGameStore } from '../src/stores/game'

/**
 * What the table does when it does not have a desktop's width. The layout
 * itself is CSS, which jsdom does not compute — so what is asserted here is the
 * one decision the component actually makes: whether the players-and-log panel
 * is a column beside the board or a sheet summoned over it, and whether the
 * things a capture flies to are still on screen either way.
 */

const sfor = (r: Room, token: string): ClientState => r['stateFor'](token) as ClientState

/** A started two-handed room, seat 0 on turn, rendered as seat 0 sees it. */
function seated() {
  const r = new Room('TEST')
  r.addSeat('token-a', 'Takeda')
  r.addSeat('token-b', 'Uesugi')
  r.options = { ...DEFAULT_OPTIONS, randomHands: true }
  r.start()
  r.game!.state.first = 0
  r.game!.state.current = 0
  const game = useGameStore()
  game.state = sfor(r, 'token-a')
  return game
}

/** Rotating, resizing the window, or opening the phone's keyboard. */
async function resizeTo(width: number) {
  window.innerWidth = width
  window.dispatchEvent(new Event('resize'))
  await nextTick()
}

/** Play a placeable tile for whoever is on the clock and end their turn. */
function playATurn(r: Room): string {
  const engine = r.game!
  const seat = engine.state.current
  const tile = engine.state.players[seat].hand
    .map(tileFromId)
    .find(
      (t) => t.kind !== 'switch' && t.kind !== 'move' && legalPlacements(engine.view, t).length > 0,
    )!
  const space = legalPlacements(engine.view, tile)[0]
  engine.playTile(seat, tile.id, space)
  engine.endTurn(seat)
  return space
}

/**
 * jsdom computes no layout, so the board measures nothing and never zooms. A
 * phone-sized box is what makes the view answer the ticker at all.
 */
const realRect = Element.prototype.getBoundingClientRect

function sizeEverything(width: number, height: number) {
  Element.prototype.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      width,
      height,
      right: width,
      bottom: height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect
}

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})

afterEach(() => {
  Element.prototype.getBoundingClientRect = realRect
  delete (document as { fullscreenEnabled?: boolean }).fullscreenEnabled
})

/** A browser that has a fullscreen mode to give, which jsdom does not. */
function withFullscreenApi() {
  const requestFullscreen = vi.fn(() => Promise.resolve())
  Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true })
  document.documentElement.requestFullscreen = requestFullscreen as never
  return requestFullscreen
}

describe('the table on a narrow screen', () => {
  it('keeps the panel beside the board when there is width for it', async () => {
    window.innerWidth = 1200
    seated()
    await nextTick()

    const wrapper = mount(GameScreen)
    expect(wrapper.find('.layout').classes()).not.toContain('narrow')
    expect(wrapper.find('#game-sidebar').exists()).toBe(true)
    // Nothing is covered, so nothing is dimmed.
    expect(wrapper.find('.sheet-scrim').exists()).toBe(false)
  })

  it('starts with the panel away and opens it as a sheet over the board', async () => {
    window.innerWidth = 390
    seated()
    await nextTick()

    const wrapper = mount(GameScreen)
    expect(wrapper.find('.layout').classes()).toContain('narrow')
    expect(wrapper.find('#game-sidebar').exists()).toBe(false)

    await wrapper.find('.sidebar-handle').trigger('click')
    expect(wrapper.find('#game-sidebar').classes()).toContain('sheet')

    // A tap beside the sheet puts it away again.
    await wrapper.find('.sheet-scrim').trigger('click')
    expect(wrapper.find('#game-sidebar').exists()).toBe(false)
  })

  it('puts the sheet away when the screen narrows, and brings the column back', async () => {
    window.innerWidth = 1200
    seated()
    await nextTick()

    const wrapper = mount(GameScreen)
    expect(wrapper.find('#game-sidebar').exists()).toBe(true)

    // Rotated into portrait: an open sheet would cover the board it annotates.
    await resizeTo(390)
    expect(wrapper.find('.layout').classes()).toContain('narrow')
    expect(wrapper.find('#game-sidebar').exists()).toBe(false)

    await resizeTo(1200)
    expect(wrapper.find('.layout').classes()).not.toContain('narrow')
    expect(wrapper.find('#game-sidebar').exists()).toBe(true)

    wrapper.unmount()
    // The listener goes with the component; a resize afterwards must not throw.
    window.dispatchEvent(new Event('resize'))
  })

  it('keeps the topbar tallies, which a capture flies to while the sheet is shut', async () => {
    window.innerWidth = 320
    seated()
    await nextTick()

    const wrapper = mount(GameScreen)
    expect(wrapper.find('[data-caste="buddha"]').exists()).toBe(true)
    expect(wrapper.find('[data-caste="rice"]').exists()).toBe(true)
    expect(wrapper.find('[data-caste="castle"]').exists()).toBe(true)
  })

  it('still offers the whole turn — hand, actions and the board — at 320px', async () => {
    window.innerWidth = 320
    seated()
    await nextTick()

    const wrapper = mount(GameScreen)
    expect(wrapper.find('.board').exists()).toBe(true)
    expect(wrapper.findAll('.tile-btn').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.hand-actions .btn').length).toBeGreaterThan(0)
    // The board's own controls come with it, whatever the width.
    expect(wrapper.findAll('.zoom-btn').length).toBe(3)
  })
})

/*
 * With the panel shut — which is how a phone spends most of a game — nothing on
 * screen said an opponent had moved, and the mark their tile leaves on the hex
 * is a few pixels wide at the zoom the board opens at. The ticker is the answer
 * to both halves of that.
 */
describe('the move ticker', () => {
  it('is not on a screen with room for the log beside the board', async () => {
    window.innerWidth = 1200
    seated()
    await nextTick()

    expect(mount(GameScreen).find('.ticker').exists()).toBe(false)
  })

  it('says what another player just did, and opens the log when tapped', async () => {
    window.innerWidth = 390
    const r = new Room('TICK')
    r.addSeat('token-a', 'Takeda')
    r.addSeat('token-b', 'Uesugi')
    r.options = { ...DEFAULT_OPTIONS, randomHands: true }
    r.start()
    r.game!.state.first = 0
    r.game!.state.current = 0

    const game = useGameStore()
    game.state = sfor(r, 'token-b') // watching as the seat that is not on turn
    await nextTick()

    const wrapper = mount(GameScreen)
    // The log is never empty at a started table: the engine opens it itself.
    expect(wrapper.find('.ticker').text()).toContain('game begins')

    playATurn(r)
    game.state = sfor(r, 'token-b')
    await nextTick()
    expect(wrapper.find('.ticker').text()).toContain('Takeda')

    // The line is the way into the panel the log actually lives in.
    expect(wrapper.find('#game-sidebar').exists()).toBe(false)
    await wrapper.find('.ticker .line').trigger('click')
    expect(wrapper.find('#game-sidebar').exists()).toBe(true)
  })

  it('takes the board to the tile another player put down', async () => {
    window.innerWidth = 390
    sizeEverything(320, 360)
    const r = new Room('TICK')
    r.addSeat('token-a', 'Takeda')
    r.addSeat('token-b', 'Uesugi')
    r.options = { ...DEFAULT_OPTIONS, randomHands: true }
    r.start()
    r.game!.state.first = 0
    r.game!.state.current = 0

    const game = useGameStore()
    game.state = sfor(r, 'token-b')
    await nextTick()

    const wrapper = mount(GameScreen)
    playATurn(r)
    game.state = sfor(r, 'token-b')
    await nextTick()

    const before = wrapper.find('.board').element.getAttribute('viewBox')
    await wrapper.find('.ticker .locate').trigger('click')
    const after = wrapper.find('.board').element.getAttribute('viewBox')

    expect(after).not.toBe(before)
    // Zoomed in on it, not merely panned: the view is narrower than it was.
    expect(Number(after!.split(' ')[2])).toBeLessThan(Number(before!.split(' ')[2]))
  })

  it('strikes the tile it found, and takes the mark away again', async () => {
    vi.useFakeTimers()
    try {
      window.innerWidth = 390
      sizeEverything(320, 360)
      const r = new Room('TICK')
      r.addSeat('token-a', 'Takeda')
      r.addSeat('token-b', 'Uesugi')
      r.options = { ...DEFAULT_OPTIONS, randomHands: true }
      r.start()
      r.game!.state.first = 0
      r.game!.state.current = 0

      const game = useGameStore()
      game.state = sfor(r, 'token-b')
      await nextTick()

      const wrapper = mount(GameScreen)
      const space = playATurn(r)
      game.state = sfor(r, 'token-b')
      await nextTick()

      // Pointing the board at a tile is only half of it — nothing on the board
      // says which of several marked hexes is the one just asked for.
      expect(wrapper.find('.found').exists()).toBe(false)
      await wrapper.find('.ticker .locate').trigger('click')

      const marks = wrapper.findAll('.found')
      expect(marks).toHaveLength(1)
      // On the hex the ticker pointed at, not on some other one.
      expect(marks[0].find('.found-ring').attributes('d')).toBe(
        wrapper.find(`[data-space="${space}"]`).attributes('d'),
      )

      // It says which tile; it is not a state the board is left in.
      vi.advanceTimersByTime(4000)
      await nextTick()
      expect(wrapper.find('.found').exists()).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('offers nothing to find when the newest tile is your own', async () => {
    window.innerWidth = 390
    const r = new Room('TICK')
    r.addSeat('token-a', 'Takeda')
    r.addSeat('token-b', 'Uesugi')
    r.options = { ...DEFAULT_OPTIONS, randomHands: true }
    r.start()
    r.game!.state.first = 0
    r.game!.state.current = 0

    const game = useGameStore()
    playATurn(r) // seat 0 plays; seat 0 is the one watching
    game.state = sfor(r, 'token-a')
    await nextTick()

    const wrapper = mount(GameScreen)
    expect(wrapper.find('.ticker').exists()).toBe(true)
    expect(wrapper.find('.ticker .locate').exists()).toBe(false)
  })
})

/*
 * A player's own score. The seat rows carry it, but on a phone those are behind
 * the sheet, so the hand bar — everything else that is yours — carries it too.
 */
describe('what you have claimed', () => {
  it('counts your own captures by caste, whatever the table shows others', async () => {
    window.innerWidth = 390
    const r = new Room('CLAIM')
    r.addSeat('token-a', 'Takeda')
    r.addSeat('token-b', 'Uesugi')
    r.options = { ...DEFAULT_OPTIONS, randomHands: true, openInformation: false }
    r.start()

    const game = useGameStore()
    // The server always sends a seat its own captures, closed table or not.
    game.state = { ...sfor(r, 'token-a'), captured: ['buddha', 'buddha', 'rice'] }
    await nextTick()

    const wrapper = mount(GameScreen)
    const count = (caste: string) =>
      wrapper.find(`.claimed [data-claimed="${caste}"]`).text()

    expect(count('buddha')).toBe('2')
    expect(count('rice')).toBe('1')
    expect(count('castle')).toBe('0')
  })

  it('is there from the first turn, before anything has been taken', async () => {
    window.innerWidth = 390
    seated()
    await nextTick()

    const wrapper = mount(GameScreen)
    expect(wrapper.findAll('.claimed [data-claimed]')).toHaveLength(3)
    expect(wrapper.find('.claimed [data-claimed="buddha"]').text()).toBe('0')
  })
})

/*
 * A phone spends a strip of a short screen on the address bar, and this is the
 * only thing in the app that can ask for it back.
 */
describe('taking the whole screen', () => {
  it('offers it where the browser has one to give, and asks for the document', async () => {
    const requestFullscreen = withFullscreenApi()
    window.innerWidth = 390
    seated()
    await nextTick()

    const wrapper = mount(GameScreen)
    const button = wrapper.find('.zoom-btn.fullscreen')
    expect(button.exists()).toBe(true)

    await button.trigger('click')
    // The document, not the board: fullscreening the board alone would take the
    // hand and the turn away along with the browser's chrome.
    expect(requestFullscreen).toHaveBeenCalledTimes(1)
    expect(requestFullscreen.mock.instances[0]).toBe(document.documentElement)
  })

  it('says nothing at all where the browser has no fullscreen — an iPhone', async () => {
    window.innerWidth = 390
    seated()
    await nextTick()

    // jsdom, like Safari on a phone, offers no `fullscreenEnabled`.
    expect(mount(GameScreen).find('.zoom-btn.fullscreen').exists()).toBe(false)
  })
})

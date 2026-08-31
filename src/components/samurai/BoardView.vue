<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import GameIcon from '../common/GameIcon.vue'
import TileGlyph from './TileGlyph.vue'
import { flyGhost } from '@/composables/useFlight'
import { useFullscreen } from '@/composables/useFullscreen'
import { usePanZoom, type Bounds } from '@/composables/usePanZoom'
import { CASTE_COLOURS, PLAYER_COLOURS } from '@shared/colours'
import { hexCentre, hexPolygon, hexRoundedPath, type Point } from '@shared/hex'
import type { PieceRef } from '@shared/rules'
import { SETTLEMENT_CAPACITY, type PlayerColour, type Space } from '@shared/types'
import { t } from '@/i18n'
import { useGameStore } from '@/stores/game'

const game = useGameStore()

/* A view control like the zoom, so it lives with them rather than in the topbar
   — which on a phone has no room for a fourth button. Shown only on a touch
   screen (see the stylesheet), where the browser's chrome is worth reclaiming
   and there is no F11 to do it with. */
const fullscreen = useFullscreen()

const HEX = 34 // circumradius in SVG units
const PAD = HEX * 1.2

interface Cell {
  space: Space
  centre: Point
  outline: string
  full: string
}

const cells = computed<Cell[]>(() =>
  game.board.order.map((id) => {
    const space = game.board.spaces[id]
    const centre = hexCentre(space.q, space.r, HEX)
    return {
      space,
      centre,
      outline: hexRoundedPath(centre, HEX * 0.985),
      full: hexPolygon(centre, HEX),
    }
  }),
)

/** The full extent of the board, in SVG units. */
const bounds = computed<Bounds>(() => {
  if (!cells.value.length) return { x: 0, y: 0, width: 100, height: 100 }
  const xs = cells.value.map((c) => c.centre.x)
  const ys = cells.value.map((c) => c.centre.y)
  const x = Math.min(...xs) - PAD
  const y = Math.min(...ys) - PAD
  return { x, y, width: Math.max(...xs) + PAD - x, height: Math.max(...ys) + PAD - y }
})

/*
 * A pointy-top hex is √3 circumradii across, so a whole board fitted into a
 * phone draws each one at a dozen pixels or so — readable, but not something a
 * fingertip can land on. The view opens zoomed far enough to make a hex
 * tappable and no further than the cap, past which a six-player board would
 * open showing one corner of itself. A roomy window meets the floor at the
 * plain fit and so opens exactly as it always has.
 */
const MIN_HEX_PX = 30
const OPEN_ZOOM_CAP = 1.8
/** Big enough to read the tile that was played, not just find the hex. */
const SHOW_HEX_PX = 58

const frame = ref<HTMLElement | null>(null)
const {
  viewBox,
  zoom,
  dragging,
  canZoomIn,
  canZoomOut,
  reset,
  focusOn,
  zoomIn,
  zoomOut,
  handlers,
  onClickCapture,
} = usePanZoom(frame, bounds, {
  minUnitPx: MIN_HEX_PX / (HEX * Math.sqrt(3)),
  maxOpenZoom: OPEN_ZOOM_CAP,
})

/**
 * The hex the ticker last sent the board to, and how many times it has been
 * asked. Bringing a space into view is only half the answer — the board looks
 * much the same wherever it is pointed, and the seat's own mark on the hex is
 * one of several on screen. So the tile is struck with a ring of its own for a
 * few seconds, which is what makes it the one thing being pointed at.
 *
 * The count is what lets the same space be found twice over: remounting the
 * mark is what restarts its animation, and Vue will not remount an element
 * whose key has not changed.
 */
const FOUND_MS = 3600
const found = ref<string | null>(null)
const foundCount = ref(0)
let foundTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Bring one space into view and mark it. Called from the move ticker on a
 * narrow screen, where a tile played on the far side of the board is something
 * the player would otherwise have to go hunting for.
 */
function showSpace(spaceId: string) {
  const space = game.board.spaces[spaceId]
  if (!space) return
  focusOn(hexCentre(space.q, space.r, HEX), SHOW_HEX_PX / (HEX * Math.sqrt(3)))
  found.value = spaceId
  foundCount.value++
  if (foundTimer) clearTimeout(foundTimer)
  foundTimer = setTimeout(() => (found.value = null), FOUND_MS)
}

onUnmounted(() => {
  if (foundTimer) clearTimeout(foundTimer)
})

defineExpose({ showSpace })

const pieces = computed(() => game.state?.pieces ?? {})
const placed = computed(() => game.state?.placed ?? {})

const highlighted = computed(() => new Set(game.highlightedSpaces))
const selectable = computed(
  () => new Set(game.selectablePieces.map((p: PieceRef) => `${p.spaceId}:${p.index}`)),
)
const chosenFirst = computed(() =>
  game.interaction.mode === 'switch-second'
    ? `${game.interaction.first.spaceId}:${game.interaction.first.index}`
    : null,
)
const justPlaced = computed(() => new Set(game.state?.placedThisTurn ?? []))

/*
 * The tiles of the move being made, or of the last one made if the player on
 * the clock has not placed yet — so everyone at the table can see where the
 * tile went, in the colour of whoever put it there.
 */
const freshlyPlaced = computed(() => {
  const state = game.state
  if (!state || state.phase !== 'play') return new Set<string>()
  const ids = state.placedThisTurn.length ? state.placedThisTurn : state.lastPlaced
  return new Set(ids.filter((id) => id in placed.value))
})

/*
 * Where every other player last placed — one mark per opponent, standing until
 * that same opponent moves again. Deliberately not tied to the lap of the
 * table: a mark that cleared on the viewer's own turn vanished every time play
 * came back round. The turn that just ended is in here too, under the brighter
 * mark that will shortly fade off it.
 */
const earlierPlaced = computed(() => {
  const state = game.state
  if (!state || state.phase !== 'play') return new Set<string>()
  return new Set(state.othersLastPlaced.filter((id) => id in placed.value))
})

/** Offsets for laying out a settlement's caste pieces inside its hex. */
function pieceSlots(count: number): Point[] {
  if (count <= 1) return [{ x: 0, y: 2 }]
  if (count === 2) {
    return [
      { x: -HEX * 0.4, y: 2 },
      { x: HEX * 0.4, y: 2 },
    ]
  }
  return [
    { x: -HEX * 0.44, y: -HEX * 0.16 },
    { x: HEX * 0.44, y: -HEX * 0.16 },
    { x: 0, y: HEX * 0.44 },
  ]
}

/** Small roof marks showing how many buildings a settlement has. */
function buildingSlots(count: number): Point[] {
  const step = HEX * 0.36
  const start = -((count - 1) / 2) * step
  return Array.from({ length: count }, (_, i) => ({ x: start + i * step, y: -HEX * 0.55 }))
}

function ownerColour(spaceId: string): PlayerColour {
  const tile = placed.value[spaceId]
  return game.players.find((p) => p.id === tile?.owner)?.colour ?? 'gold'
}

/*
 * A wave delay derived from the hex's own coordinates, so the halo sweeps
 * across the board instead of every target flashing in lockstep.
 */
function haloDelay(space: Space, index = 0): string {
  return `${(((((space.q + space.r + index) % 5) + 5) % 5) * 0.11).toFixed(2)}s`
}

/*
 * Hand to board. The rects have to be taken before the click is sent: the
 * server's answer empties the hand slot the tile flew out of, and the tile
 * itself only exists on the board once that answer lands.
 *
 * A tile glyph is a hexagon of 0.83 of the hex it sits in, so it covers a shade
 * over four fifths of the hex's own width when it gets there.
 */
const TILE_OF_HEX = 0.83

function placeOn(spaceId: string) {
  const act = game.interaction
  const placing = act.mode === 'place' && game.highlightedSpaces.includes(spaceId)
  game.clickSpace(spaceId)
  if (!placing) return
  flyGhost({
    from: document.querySelector(`[data-tile="${act.tileId}"] svg`),
    to: frame.value?.querySelector(`[data-space="${spaceId}"]`) ?? null,
    endFit: TILE_OF_HEX,
  })
}

function isSurroundedNow(space: Space): boolean {
  return (
    space.kind === 'settlement' &&
    space.landNeighbours.length > 0 &&
    space.landNeighbours.every((id) => id in placed.value)
  )
}
</script>

<template>
  <div ref="frame" class="board-wrap">
    <svg
      class="board"
      :class="{ dragging }"
      :viewBox="viewBox"
      role="img"
      :aria-label="t('board.label')"
      v-bind="handlers"
      @click.capture="onClickCapture"
    >
      <defs>
        <filter id="tile-drop" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.4" flood-color="#3a2a18" flood-opacity="0.35" />
        </filter>
        <radialGradient id="target-glow">
          <stop offset="0%" stop-color="#dcf3c4" stop-opacity="0.95" />
          <stop offset="55%" stop-color="#9ed37c" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#9ed37c" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!--
        Sharp, full-size hexes tile without a seam, so they colour the gaps the
        rounded corners leave. Drawn as one layer under every hex, or a
        neighbour's underlay would cover the rounded outline's stroke.
      -->
      <polygon
        v-for="cell in cells"
        :key="`u${cell.space.id}`"
        :points="cell.full"
        :class="['hex-under', `hex-${cell.space.kind}`]"
      />

      <g v-for="cell in cells" :key="cell.space.id">
        <!-- terrain -->
        <path
          :d="cell.outline"
          :data-space="cell.space.id"
          :class="[
            'hex',
            `hex-${cell.space.kind}`,
            {
              'hex-target': highlighted.has(cell.space.id),
              'hex-surrounded': isSurroundedNow(cell.space),
            },
          ]"
          @click="placeOn(cell.space.id)"
        />

        <!-- a light that swells out of a target hex; decoration, so no clicks -->
        <template v-if="highlighted.has(cell.space.id)">
          <circle
            :cx="cell.centre.x"
            :cy="cell.centre.y"
            :r="HEX"
            class="hex-glow"
            fill="url(#target-glow)"
            :style="{ animationDelay: haloDelay(cell.space) }"
          />
          <path
            :d="cell.outline"
            class="hex-halo"
            :style="{ animationDelay: haloDelay(cell.space) }"
          />
        </template>

        <!-- settlement furniture -->
        <template v-if="cell.space.kind === 'settlement'">
          <GameIcon
            v-for="(slot, i) in buildingSlots(SETTLEMENT_CAPACITY[cell.space.settlement!])"
            :key="`b${i}`"
            inline
            name="building"
            :size="HEX * 0.34"
            :x="cell.centre.x + slot.x"
            :y="cell.centre.y + slot.y"
            class="building"
            :class="{ 'building-edo': cell.space.settlement === 'edo' }"
          />

          <g
            v-for="(caste, index) in pieces[cell.space.id] ?? []"
            :key="`p${index}`"
            :class="[
              'piece',
              {
                'piece-selectable': selectable.has(`${cell.space.id}:${index}`),
                'piece-chosen': chosenFirst === `${cell.space.id}:${index}`,
              },
            ]"
            @click="game.clickPiece({ spaceId: cell.space.id, index })"
          >
            <circle
              :cx="cell.centre.x + pieceSlots((pieces[cell.space.id] ?? []).length)[index].x"
              :cy="cell.centre.y + pieceSlots((pieces[cell.space.id] ?? []).length)[index].y"
              :r="HEX * 0.34"
              class="piece-disc"
              :style="{
                '--disc-fill': CASTE_COLOURS[caste].fill,
                '--disc-ink': CASTE_COLOURS[caste].ink,
              }"
            />
            <GameIcon
              inline
              :name="caste"
              :size="HEX * 0.63"
              :x="cell.centre.x + pieceSlots((pieces[cell.space.id] ?? []).length)[index].x"
              :y="cell.centre.y + pieceSlots((pieces[cell.space.id] ?? []).length)[index].y"
            />
            <!-- light growing off the disc edge, so the caste colour stays readable -->
            <circle
              :cx="cell.centre.x + pieceSlots((pieces[cell.space.id] ?? []).length)[index].x"
              :cy="cell.centre.y + pieceSlots((pieces[cell.space.id] ?? []).length)[index].y"
              :r="HEX * 0.34"
              class="piece-halo"
              :style="{ animationDelay: haloDelay(cell.space, index) }"
            />
          </g>
        </template>

        <!-- plays since your own turn ended; decoration, so no clicks -->
        <path
          v-if="earlierPlaced.has(cell.space.id)"
          :d="cell.outline"
          class="tile-earlier"
          :style="{
            '--mark': PLAYER_COLOURS[ownerColour(cell.space.id)].fill,
            animationDelay: haloDelay(cell.space),
          }"
        />

        <!-- where the last tile went; decoration, so no clicks -->
        <path
          v-if="freshlyPlaced.has(cell.space.id)"
          :d="cell.outline"
          class="tile-mark"
          :style="{ '--mark': PLAYER_COLOURS[ownerColour(cell.space.id)].fill }"
        />

        <!-- placed tile -->
        <g
          v-if="placed[cell.space.id]"
          filter="url(#tile-drop)"
          :class="['tile', { 'tile-fresh': justPlaced.has(cell.space.id) }]"
        >
          <TileGlyph
            :tile="game.tiles[placed[cell.space.id].tileId]"
            :colour="ownerColour(cell.space.id)"
            :size="HEX * 0.83"
            :x="cell.centre.x"
            :y="cell.centre.y"
          />
        </g>

        <!--
          The tile the ticker was asked to find. Drawn last so it rings the tile
          rather than sitting under it, and keyed on the count so asking twice
          strikes it twice. Decoration, so no clicks.
        -->
        <g v-if="found === cell.space.id" :key="`found${foundCount}`" class="found">
          <path :d="cell.outline" class="found-ring" />
          <path :d="cell.outline" class="found-ripple" />
        </g>
      </g>
    </svg>

    <div class="zoom-controls">
      <button
        class="zoom-btn"
        :disabled="!canZoomIn"
        :title="t('board.zoomIn')"
        :aria-label="t('board.zoomIn')"
        @click="zoomIn"
      >
        +
      </button>
      <button
        class="zoom-btn"
        :disabled="!canZoomOut"
        :title="t('board.zoomOut')"
        :aria-label="t('board.zoomOut')"
        @click="zoomOut"
      >
        &minus;
      </button>
      <button
        class="zoom-btn reset"
        :disabled="!canZoomOut"
        :title="t('board.fit')"
        :aria-label="t('board.fit')"
        @click="reset"
      >
        {{ t('board.fitShort') }}
      </button>

      <!-- Absent where the browser has no fullscreen to give — an iPhone, most
           of all, where Safari keeps the API for video. -->
      <button
        v-if="fullscreen.supported"
        class="zoom-btn fullscreen"
        :title="fullscreen.active.value ? t('board.exitFullscreen') : t('board.fullscreen')"
        :aria-label="fullscreen.active.value ? t('board.exitFullscreen') : t('board.fullscreen')"
        :aria-pressed="fullscreen.active.value"
        @click="fullscreen.toggle()"
      >
        <!-- Corners pointing out to go, and in to come back. Drawn rather than
             set, so it needs nothing of whatever font the phone has. -->
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path v-if="!fullscreen.active.value" d="M4 9V4h5 M15 4h5v5 M20 15v5h-5 M9 20H4v-5" />
          <path v-else d="M9 4v5H4 M20 9h-5V4 M15 20v-5h5 M4 15h5v5" />
        </svg>
      </button>
    </div>
    <p v-if="zoom > 1.02" class="zoom-badge tiny">{{ Math.round(zoom * 100) }}%</p>
  </div>
</template>

<style scoped>
.board-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  height: 100%;
  padding: 0.5rem;
  overflow: hidden;
}

.board {
  width: 100%;
  height: 100%;
  max-height: 100%;
  cursor: grab;
  /* Own every gesture on the board: the page must not scroll or pinch under it. */
  touch-action: none;
}

.board.dragging {
  cursor: grabbing;
}

.zoom-controls {
  position: absolute;
  right: 0.7rem;
  bottom: 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.zoom-btn {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  border: 1px solid rgba(140, 118, 84, 0.5);
  background: rgba(255, 252, 245, 0.92);
  color: var(--ink);
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1;
  box-shadow: var(--shadow);
  transition: background 0.12s ease;
}

.zoom-btn.reset {
  font-size: 0.72rem;
  font-family: var(--font-display);
  letter-spacing: 0.04em;
}

/* Off on a pointer device, which has the browser's own fullscreen key and a
   window whose chrome is nothing like as expensive as a phone's. */
.zoom-btn.fullscreen {
  display: none;
}

.zoom-btn.fullscreen svg {
  width: 1.15rem;
  height: 1.15rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@media (pointer: coarse) {
  .zoom-btn.fullscreen {
    display: flex;
  }
}

.zoom-btn:hover:not(:disabled) {
  background: #fff;
}

.zoom-btn:disabled {
  opacity: 0.4;
}

.zoom-badge {
  position: absolute;
  left: 0.7rem;
  bottom: 0.7rem;
  margin: 0;
  padding: 0.15rem 0.45rem;
  border-radius: 5px;
  background: rgba(255, 252, 245, 0.85);
  border: 1px solid rgba(140, 118, 84, 0.35);
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}

.hex {
  stroke: rgba(122, 100, 70, 0.45);
  stroke-width: 1.2;
  transition: fill 0.15s ease;
}

.hex-sea {
  fill: var(--sea);
}

.hex-land {
  fill: var(--land);
}

.hex-settlement {
  fill: var(--settlement);
  stroke: rgba(110, 86, 54, 0.85);
  stroke-width: 2.4;
}

.hex-surrounded {
  fill: #f6dfb4;
}

.hex-target {
  fill: #cbe6b8;
  stroke: #4d7a35;
  stroke-width: 2.6;
  cursor: pointer;
}

.hex-target:hover {
  fill: #b7dea0;
}

/*
 * Both layers scale about the hex's own centre, which needs `fill-box` —
 * an SVG transform-origin is otherwise the user-space origin, far off-board.
 */
.hex-under {
  stroke: none;
  pointer-events: none;
}

.hex-glow,
.hex-halo {
  pointer-events: none;
  transform-box: fill-box;
  transform-origin: center;
}

.hex-glow {
  animation: glow-swell 2.2s ease-in-out infinite;
}

.hex-halo {
  fill: none;
  stroke: #7fc45c;
  stroke-width: 2.2;
  animation: halo-grow 2.2s ease-out infinite;
}

/* The soft light breathing inside the hex. */
@keyframes glow-swell {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.62);
  }
  50% {
    opacity: 0.85;
    transform: scale(1);
  }
}

/* A ring that grows past the hex edge and fades, like a ripple of light. */
@keyframes halo-grow {
  0% {
    stroke-opacity: 0;
    transform: scale(0.7);
  }
  30% {
    stroke-opacity: 0.85;
  }
  100% {
    stroke-opacity: 0;
    transform: scale(1.35);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hex-glow,
  .hex-halo,
  .piece-selectable .piece-halo,
  .piece-chosen .piece-halo {
    animation: none;
  }

  .hex-glow {
    opacity: 0.6;
  }

  /* No breathing, but the mark still says its piece and goes after five. */
  .tile-mark {
    stroke-opacity: 0.9;
    animation: mark-fade 5s ease-out forwards;
  }

  .hex-halo,
  .piece-selectable .piece-halo,
  .piece-chosen .piece-halo {
    stroke-opacity: 0.8;
  }

  /* No blink, but the wash still marks the hex. */
  .tile-earlier {
    animation: none;
  }
}

/*
 * Only the hex itself and the caste pieces answer to a click. Everything drawn
 * over a hex is decoration and has to let the click through to the hex beneath
 * — a placed tile covers almost the whole space, so without this the only part
 * of an occupied hex that could be clicked was the thin ring around its edge,
 * and picking up a tile with a move tile was all but impossible.
 */
.tile,
.building {
  pointer-events: none;
}

.building {
  color: rgba(104, 80, 48, 0.9);
}

.building-edo {
  color: var(--vermillion);
}

/* The caste colour is the only thing separating the three pieces at this size,
   so every state below changes the ring and leaves the fill alone. */
.piece-disc {
  fill: var(--disc-fill);
  stroke: var(--disc-ink);
  stroke-width: 1.1;
}

.piece-selectable {
  cursor: pointer;
}

.piece-selectable .piece-disc {
  stroke: #2f6b34;
  stroke-width: 2.6;
}

.piece-selectable:hover .piece-disc {
  stroke-width: 3.4;
}

.piece-chosen .piece-disc {
  stroke: var(--vermillion);
  stroke-width: 3;
}

/* Dormant until the switch tile asks for a piece; then it grows like the hex halo. */
.piece-halo {
  fill: none;
  stroke: none;
  stroke-width: 2;
  pointer-events: none;
  transform-box: fill-box;
  transform-origin: center;
}

.piece-selectable .piece-halo {
  stroke: #4f9c46;
  animation: piece-halo-grow 2.2s ease-out infinite;
}

.piece-chosen .piece-halo {
  stroke: var(--vermillion);
  animation: piece-halo-grow 1.5s ease-out infinite;
}

/* Starts at the disc edge so it never washes over the caste colour. */
@keyframes piece-halo-grow {
  0% {
    stroke-opacity: 0;
    transform: scale(1);
  }
  30% {
    stroke-opacity: 0.8;
  }
  100% {
    stroke-opacity: 0;
    transform: scale(1.55);
  }
}

/*
 * The rest of the lap: the same colour as the fresh mark, and washed across the
 * whole hex so it carries at the zoom the board opens at, where a ring alone is
 * a hairline. The stroke stays narrower than the fresh mark's 3.4 so it sits
 * entirely under it and is simply revealed when that fades.
 *
 * It blinks, slowly and out of step with its neighbours (`haloDelay`), so five
 * of them at once read as several separate moves rather than one strobe. The
 * blink never leaves, since the mark stands until your own next turn closes.
 */
.tile-earlier {
  fill: var(--mark);
  fill-opacity: 0.22;
  stroke: var(--mark);
  stroke-width: 2.8;
  stroke-opacity: 0.5;
  pointer-events: none;
  filter: drop-shadow(0 0 2px var(--mark));
  animation: earlier-blink 2.4s ease-in-out infinite;
}

@keyframes earlier-blink {
  0%,
  100% {
    fill-opacity: 0.1;
    stroke-opacity: 0.3;
  }
  50% {
    fill-opacity: 0.34;
    stroke-opacity: 0.85;
  }
}

/*
 * A ring in the placing player's colour, breathing so it reads from across the
 * room, and gone five seconds later — long enough to say which move is the
 * newest, after which the steady ring underneath is what the hex is left
 * wearing.
 * It stays inside the hex: a ring that grew past the edge would sit over the
 * neighbouring tiles and look like it marked them too.
 *
 * The element is created the moment the tile lands and is never re-rendered
 * while it stands, so the countdown starts once, on the placement itself.
 */
.tile-mark {
  fill: none;
  stroke: var(--mark);
  stroke-width: 3.4;
  pointer-events: none;
  filter: drop-shadow(0 0 3px var(--mark));
  /* Three breaths and out, so nothing is left animating behind the fade. */
  animation: mark-pulse 1.6s ease-in-out 3, mark-fade 5s ease-out forwards;
}

@keyframes mark-pulse {
  0%,
  100% {
    stroke-opacity: 0.45;
  }
  50% {
    stroke-opacity: 1;
  }
}

/* Holds full strength, then leaves in the last second of the five. */
@keyframes mark-fade {
  0%,
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

/*
 * The answer to "where is it?" — struck in the vermillion this design uses for
 * whatever it is asking you to look at, and quite unlike the seat-coloured
 * marks underneath it or the green of a space you may play on. It rings the
 * hex rather than washing over it, so the tile it is pointing at stays
 * readable, and it goes after a few seconds: it says which tile, it is not a
 * state the board is in.
 */
.found {
  pointer-events: none;
}

.found-ring {
  fill: none;
  stroke: var(--vermillion);
  stroke-width: 3.6;
  filter: drop-shadow(0 0 3px var(--vermillion));
  animation: found-beat 0.9s ease-in-out 3, mark-fade 3.6s ease-out forwards;
}

/* One ripple off the hex's own edge, the way a target hex swells — enough to
   catch the eye arriving at a board that has just jumped. */
.found-ripple {
  fill: none;
  stroke: var(--vermillion);
  stroke-width: 2.4;
  transform-box: fill-box;
  transform-origin: center;
  animation: found-ripple 1.1s ease-out 2;
}

@keyframes found-beat {
  0%,
  100% {
    stroke-opacity: 0.55;
  }
  50% {
    stroke-opacity: 1;
  }
}

@keyframes found-ripple {
  0% {
    stroke-opacity: 0.9;
    transform: scale(1);
  }
  100% {
    stroke-opacity: 0;
    transform: scale(1.5);
  }
}

/* Its own block rather than the one further up: these have to be read after the
   rules they answer, or the animations above simply win on source order. */
@media (prefers-reduced-motion: reduce) {
  /* The ring still says which tile, and still leaves when it has said it. */
  .found-ring {
    stroke-opacity: 1;
    animation: mark-fade 3.6s ease-out forwards;
  }

  .found-ripple {
    display: none;
  }
}

.tile-fresh {
  animation: drop-in 0.28s ease-out;
}

@keyframes drop-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- touch and narrow screens --------------------------------------------- */

/* Every gesture on a phone lands on the board, so the board's own controls have
   to be big enough to hit without pinching it by accident on the way. */
@media (pointer: coarse) {
  .zoom-btn {
    width: 2.6rem;
    height: 2.6rem;
    font-size: 1.25rem;
  }

  .zoom-btn.reset {
    font-size: 0.78rem;
  }
}

/* The frame gives its padding back to the board, which is the whole screen here. */
@media (max-width: 900px) {
  .board-wrap {
    padding: 0.3rem;
  }

  .zoom-controls {
    right: 0.45rem;
    bottom: 0.45rem;
  }

  .zoom-badge {
    left: 0.45rem;
    bottom: 0.45rem;
  }
}
</style>

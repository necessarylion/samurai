<script setup lang="ts">
import { computed } from 'vue'
import { PLAYER_COLOURS } from '@shared/colours'
import { hexRoundedPath } from '@shared/hex'
import type { PlayerColour } from '@shared/types'
import { PLAYER_BACKGROUNDS } from '@/game/backgrounds'

/**
 * A seat's playing piece: the miniature Samurai tile — the same rounded hex,
 * the same photographed cloth, the same ink border and pale bevel — so a seat
 * looks the same at every table in the app.
 *
 * Snakes & Ladders draws this same tile inline rather than using this
 * component, because its token lives inside the board's own SVG coordinate
 * system and is transformed and animated there. This is the standalone form,
 * for the tables laid out in HTML rather than SVG.
 */
const props = withDefaults(
  defineProps<{
    colour: PlayerColour
    /** Rendered size in pixels. */
    size?: number
    /** The seat on turn, which pulses a warm halo the way Ladders' does. */
    current?: boolean
    /** Names the piece for a screen reader and on hover. */
    label?: string
  }>(),
  { size: 16, current: false, label: '' },
)

/** A pointy-top hex of radius 10 is 17.32 wide and 20 tall — the tile's box. */
const W = 17.32
const H = 20
const CENTRE = { x: W / 2, y: H / 2 }
const R = 9.2

const face = hexRoundedPath(CENTRE, R * 0.97)
const bevel = hexRoundedPath(CENTRE, R * 0.875)

const ink = computed(() => PLAYER_COLOURS[props.colour].ink)
const fill = computed(() => PLAYER_COLOURS[props.colour].fill)
const cloth = computed(() => PLAYER_BACKGROUNDS[props.colour])
/** Unique per colour, so two tokens of a colour share one pattern definition. */
const clothId = computed(() => `seat-cloth-${props.colour}`)
</script>

<template>
  <svg
    class="seat-token"
    :class="{ current }"
    :viewBox="`0 0 ${W} ${H}`"
    :width="size"
    :height="(size * H) / W"
    role="img"
    :aria-label="label || colour"
  >
    <title v-if="label">{{ label }}</title>
    <defs>
      <pattern :id="clothId" patternUnits="userSpaceOnUse" :width="W" :height="H">
        <rect :width="W" :height="H" :fill="fill" />
        <image :href="cloth" :width="W" :height="H" preserveAspectRatio="xMidYMid slice" />
      </pattern>
    </defs>

    <!-- A tile with some depth: a contact shadow, a darker extruded base, then
         the cloth face with its ink border and pale bevel. -->
    <ellipse class="shadow" :cx="CENTRE.x + 0.2" :cy="CENTRE.y + 8.4" rx="6.4" ry="2.2" />
    <circle v-if="current" class="glow" :cx="CENTRE.x" :cy="CENTRE.y" :r="R * 1.28" />
    <path :d="face" :fill="ink" transform="translate(0 1.1)" />
    <path class="face" :d="face" :fill="`url(#${clothId})`" :stroke="ink" />
    <path :d="bevel" fill="none" stroke="#fffaf0" stroke-opacity="0.45" stroke-width="0.42" />
  </svg>
</template>

<style scoped>
.seat-token {
  display: block;
  overflow: visible;
}

.seat-token path {
  stroke-width: 0.7;
  stroke-linejoin: round;
}

.shadow {
  fill: rgba(0, 0, 0, 0.3);
}

/* Opacity only: animating a filter re-rasterises the whole board every frame. */
.glow {
  fill: rgba(178, 58, 44, 0.55);
  animation: token-glow 1.6s ease-in-out infinite;
}

@keyframes token-glow {
  0%,
  100% {
    opacity: 0.25;
  }
  50% {
    opacity: 0.7;
  }
}

@media (prefers-reduced-motion: reduce) {
  .glow {
    animation: none;
    opacity: 0.45;
  }
}
</style>

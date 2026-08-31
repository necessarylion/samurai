<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { PLAYER_COLOURS } from '@shared/colours'
import { seatOf, wordEntry } from '@/game/log'
import { t } from '@/i18n'
import { useGameStore } from '@/stores/game'

/**
 * What just happened, for a screen with no room for the play log.
 *
 * On a phone the players-and-log panel is a sheet that stays shut for most of
 * the game, so an opponent could take a turn — or a piece — with nothing on
 * screen saying so. This is the one line of it that is always there: the line
 * itself opens the panel, and the button beside it takes the board to the
 * newest tile somebody else played, which at the zoom a phone opens at is a few
 * pixels across and may not be on screen at all.
 */
const emit = defineEmits<{ open: []; locate: [spaceId: string] }>()

const game = useGameStore()

const latest = computed(() => {
  const log = game.state?.log ?? []
  return log.length ? log[log.length - 1] : null
})

/** Null for a line the engine wrote about nobody in particular. */
const who = computed(() => seatOf(game.players, latest.value?.player ?? null))

const line = computed(() =>
  latest.value ? wordEntry(latest.value.text, game.players) : t('log.empty'),
)

/**
 * The newest tile on the board that the viewer did not place: the turn that has
 * just ended first, then the standing mark of every other seat. Your own move
 * is never the answer — you know where you put it.
 */
const elsewhere = computed(() => {
  const state = game.state
  if (!state) return null
  const ids = [...state.lastPlaced, ...state.othersLastPlaced]
  return ids.find((id) => state.placed[id] && state.placed[id].owner !== game.you) ?? null
})

/*
 * The line is read out of the corner of the eye, so it says when it is new.
 * Watching the length rather than the entry: the log only ever grows, and the
 * first value seen is a baseline, so arriving at a table mid-game does not
 * flash a move that happened before anyone got here.
 */
const FLASH_MS = 1800
const fresh = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

watch(
  () => (game.state?.log ?? []).length,
  (next, previous) => {
    if (previous === undefined || next <= previous) return
    if (timer) clearTimeout(timer)
    fresh.value = true
    timer = setTimeout(() => (fresh.value = false), FLASH_MS)
  },
)

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <div class="ticker" :class="{ fresh }">
    <button
      type="button"
      class="line"
      :title="t('ticker.open')"
      :aria-label="t('ticker.open')"
      @click="emit('open')"
    >
      <span
        class="seat"
        :style="{ background: who ? PLAYER_COLOURS[who.colour].ink : 'var(--ink-faint)' }"
      />
      <span class="what" aria-live="polite">
        <strong v-if="who">{{ who.name }}</strong
        >{{ who ? ' ' : '' }}{{ line }}
      </span>
    </button>

    <!-- Only when there is a tile of someone else's to go to. -->
    <button
      v-if="elsewhere"
      type="button"
      class="locate"
      :title="t('ticker.locate')"
      :aria-label="t('ticker.locate')"
      @click="emit('locate', elsewhere)"
    >
      <span aria-hidden="true">◎</span>
    </button>
  </div>
</template>

<style scoped>
/* A rule and a line of text, in the same ink every other division on this
   screen is drawn in — it reads as part of the board's frame rather than as a
   notification sitting on top of it. */
.ticker {
  display: flex;
  align-items: stretch;
  gap: 0.3rem;
  flex: none;
  min-width: 0;
  padding: 0 clamp(0.6rem, 3vw, 1.5rem) 0 0;
  border-top: 1px solid rgba(160, 137, 102, 0.35);
  background: rgba(255, 253, 248, 0.5);
}

.line {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex: 1 1 auto;
  min-width: 0;
  padding: 0.4rem clamp(0.6rem, 3vw, 1.5rem);
  border: 0;
  background: transparent;
  font: inherit;
  text-align: left;
  color: var(--ink-soft);
  touch-action: manipulation;
}

.seat {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  flex: none;
}

/* One line, always: the whole point is that it costs the board a fixed strip. */
.what {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.82rem;
}

.what strong {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.85em;
  color: var(--ink);
}

.locate {
  flex: none;
  width: 2.3rem;
  border: 1px solid rgba(140, 118, 84, 0.45);
  border-radius: 7px;
  margin: 0.25rem 0;
  background: rgba(255, 252, 245, 0.85);
  color: var(--ink-soft);
  font-size: 1rem;
  line-height: 1;
  touch-action: manipulation;
}

.locate:hover {
  color: var(--ink);
}

/* A wash in the vermillion the round counter flashes in, so a move landing
   while the eye is on the board still registers. */
.ticker.fresh {
  animation: ticker-flash 1.8s ease-out;
}

@keyframes ticker-flash {
  0% {
    background: rgba(178, 58, 44, 0.22);
  }
  100% {
    background: rgba(255, 253, 248, 0.5);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ticker.fresh {
    animation: none;
    background: rgba(178, 58, 44, 0.1);
  }
}
</style>

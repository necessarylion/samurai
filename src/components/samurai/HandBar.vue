<script setup lang="ts">
import { computed } from 'vue'
import GameIcon from '../common/GameIcon.vue'
import TileGlyph from './TileGlyph.vue'
import { CASTE_COLOURS } from '@shared/colours'
import { CASTES, type Caste } from '@shared/types'
import { castePiece, t, tileKindLabel, tileTitle } from '@/i18n'
import { useGameStore } from '@/stores/game'

const game = useGameStore()

const SIZE = 30

/**
 * What this player has taken so far, by caste. It is in the seat rows of the
 * players panel too — but on a narrow screen that panel is a sheet that is shut
 * for most of the game, and a player's own score is not something to have to go
 * looking for. Laid out only there; see the stylesheet.
 *
 * The server always sends the viewer their own captures, whatever the table's
 * information setting, so this is never a leak.
 */
const claimed = computed(() => {
  const counts: Record<Caste, number> = { buddha: 0, rice: 0, castle: 0 }
  for (const caste of game.state?.captured ?? []) counts[caste]++
  return counts
})
const playable = computed(() => new Set(game.playableTileIds))
const selectedId = computed(() =>
  'tileId' in game.interaction ? game.interaction.tileId : null,
)

const prompt = computed(() => {
  if (!game.isMyTurn) {
    return game.activePlayer
      ? t('hand.waitingFor', { name: game.activePlayer.name })
      : t('hand.waiting')
  }
  switch (game.interaction.mode) {
    case 'place':
      return t('hand.prompt.place')
    case 'switch-first':
      return t('hand.prompt.switchFirst')
    case 'switch-second':
      return t('hand.prompt.switchSecond')
    case 'move-pick':
      return t('hand.prompt.movePick')
    case 'move-destination':
      return t('hand.prompt.moveDestination')
    default:
      if (game.mustPlace) return t('hand.prompt.mustPlace')
      return t('hand.prompt.done')
  }
})
</script>

<template>
  <div class="hand">
    <div class="hand-head">
      <div>
        <span class="hand-title">{{ t('hand.title') }}</span>
        <span class="tiny muted"> {{ t('hand.stackLeft', { count: game.me?.stackCount ?? 0 }) }}</span>
      </div>

      <!-- Your own score, for a screen with the players panel shut. -->
      <ul class="claimed" :aria-label="t('hand.claimed')">
        <li class="tiny muted claimed-label">{{ t('hand.claimed') }}</li>
        <li
          v-for="caste in CASTES"
          :key="caste"
          :data-claimed="caste"
          :title="castePiece(caste)"
          :aria-label="`${castePiece(caste)}: ${claimed[caste]}`"
        >
          <span
            class="caste-disc"
            :style="{
              background: CASTE_COLOURS[caste].fill,
              borderColor: CASTE_COLOURS[caste].ink,
            }"
          >
            <GameIcon :name="caste" :size="12" />
          </span>
          <strong>{{ claimed[caste] }}</strong>
        </li>
      </ul>

      <p class="prompt tiny">{{ prompt }}</p>
    </div>

    <div class="tiles">
      <button
        v-for="tile in game.hand"
        :key="tile.id"
        class="tile-btn"
        :data-tile="tile.id"
        :class="{
          selected: selectedId === tile.id,
          unplayable: !playable.has(tile.id),
        }"
        :disabled="!playable.has(tile.id)"
        :title="tileTitle(tile)"
        @click="game.selectTile(tile.id)"
      >
        <svg :width="SIZE * 1.9" :height="SIZE * 2.1" :viewBox="`0 0 ${SIZE * 1.9} ${SIZE * 2.1}`">
          <TileGlyph
            :tile="tile"
            :colour="game.me?.colour ?? 'gold'"
            :size="SIZE"
            :x="SIZE * 0.95"
            :y="SIZE * 1.05"
          />
        </svg>
        <span class="tile-name tiny muted">{{ tileKindLabel(tile) }}</span>
      </button>
      <p v-if="!game.hand.length" class="muted tiny empty">{{ t('hand.empty') }}</p>
    </div>

    <div class="hand-actions">
      <button
        v-if="game.interaction.mode !== 'idle'"
        class="btn ghost small"
        @click="game.cancelInteraction()"
      >
        {{ t('hand.cancel') }}
      </button>
      <button
        v-if="game.canUndo"
        class="btn ghost small"
        :title="t('hand.undo.hint')"
        @click="game.undoPlacement()"
      >
        {{ t('hand.undo') }}
      </button>
      <button
        v-if="game.canRedraw"
        class="btn ghost small"
        :title="t('hand.redraw.hint')"
        @click="game.redrawHand()"
      >
        {{ t('hand.redraw') }}
      </button>
      <button class="btn" :disabled="!game.canEndTurn" @click="game.endTurn()">
        {{ t('hand.endTurn') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.hand {
  font-family: var(--font-body);
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.7rem clamp(0.9rem, 2vw, 1.5rem);
  border-top: 1px solid rgba(160, 137, 102, 0.35);
  flex-wrap: wrap;
}

/* The title and the tile names carry the display face down here; the stack
   count and the prompt are read mid-turn, so they stay body text. */
.hand-head {
  min-width: 12rem;
  flex: 1 1 12rem;
}

.hand-title {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 600;
}

.prompt {
  margin: 0.15rem 0 0;
  color: var(--ink-soft);
}

/* Off on a wide screen, where the players panel is a column beside the board
   and already carries this seat's captures. Turned on with the rest of the
   narrow layout below. */
.claimed {
  display: none;
  align-items: center;
  gap: 0.45rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.claimed li {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.claimed-label {
  letter-spacing: 0.02em;
}

.claimed strong {
  font-family: var(--font-display);
  font-size: 0.82rem;
}

/* The disc a piece sits on, on the board and in the topbar tallies. */
.caste-disc {
  display: grid;
  place-items: center;
  width: 1.05rem;
  height: 1.05rem;
  border-radius: 50%;
  border: 1px solid;
  flex: none;
}

.tiles {
  display: flex;
  gap: 0.3rem;
  align-items: center;
  flex-wrap: wrap;
}

.tile-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 0;
  background: transparent;
  padding: 2px;
  border-radius: 8px;
  line-height: 0;
  transition: transform 0.12s ease, background 0.12s ease;
}

/* A lift that answers the pointer. Guarded, because a touch browser leaves the
   hover on the last tile tapped and it would sit raised for the rest of the
   turn — the selected state below is what marks a tile on a phone. */
@media (hover: hover) {
  .tile-btn:hover:not(:disabled) {
    transform: translateY(-3px);
  }
}

.tile-btn.selected {
  background: rgba(178, 58, 44, 0.18);
  box-shadow: inset 0 0 0 2px var(--vermillion);
  transform: translateY(-3px);
}

.tile-btn.unplayable {
  opacity: 0.35;
  filter: grayscale(0.6);
}

/* Kept on one line: Burmese has no spaces to wrap at, so a narrow hand widens
   the buttons a little and `.tiles` wraps, rather than breaking mid-syllable. */
.tile-name {
  font-family: var(--font-display);
  line-height: 1.1;
  white-space: nowrap;
  font-size: 0.68rem;
}

.hand-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

.empty {
  margin: 0 0.5rem;
}

/* --- narrow screens ------------------------------------------------------- */

/*
 * Three full-width rows rather than one row wrapping into five: the prompt
 * beside the title, the hand as a strip that scrolls sideways however many
 * tiles are in it, and the actions across the foot where a thumb is. Holding
 * the tiles to a single row is what stops the hand eating the board.
 */
@media (max-width: 900px) {
  .hand {
    gap: 0.35rem 0.6rem;
    padding: 0.5rem clamp(0.6rem, 3vw, 1.5rem);
  }

  .hand-head {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.1rem 0.5rem;
    flex: 1 1 100%;
    min-width: 0;
  }

  .prompt {
    margin: 0;
    /* After the claim, on its own line if the two will not share one. */
    flex: 1 1 100%;
  }

  .claimed {
    display: flex;
  }

  .tiles {
    flex: 1 1 100%;
    flex-wrap: nowrap;
    justify-content: flex-start;
    overflow-x: auto;
    scrollbar-width: thin;
    /* Room for the lift a selected tile takes, which the scroll box would clip. */
    padding: 3px 0;
  }

  .tile-btn {
    flex: none;
  }

  .hand-actions {
    flex: 1 1 100%;
    margin-left: 0;
  }

  /* On a phone these are the only buttons in the game; they get the full width. */
  .hand-actions .btn {
    flex: 1 1 auto;
  }
}

/* Rotated, it is height that is short, so the tiles give back a little of their
   art — they stay well over the 44px a fingertip needs. */
@media (max-width: 900px) and (max-height: 30rem) {
  .hand {
    padding-top: 0.35rem;
    padding-bottom: 0.35rem;
  }

  .tile-btn svg {
    width: 2.75rem;
    height: 3.05rem;
  }
}
</style>

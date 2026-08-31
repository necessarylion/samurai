<script setup lang="ts">
import { computed, ref } from 'vue'
import { SPACES } from '@shared/monopoly'
import { t } from '@/i18n'
import { useGameStore } from '@/stores/game'

/**
 * Putting an offer together. Both sides are picked from what each seat actually
 * owns, read off the board state rather than typed, so the only offer this can
 * build is one the engine would already accept — the exception being buildings,
 * which it refuses, and which the panel simply leaves out of the lists.
 */
const emit = defineEmits<{ close: [] }>()
const game = useGameStore()

const partners = computed(() => game.mpTradePartners)
const partner = ref<number | null>(partners.value[0] ?? null)

const give = ref<number[]>([])
const want = ref<number[]>([])
const giveCash = ref(0)
const wantCash = ref(0)

/** What a seat can put up: theirs, and with nothing built anywhere in the group. */
function offerable(seat: number | null): number[] {
  const s = game.monopoly
  if (!s || seat === null) return []
  return s.owners
    .map((owner, n) => ({ owner, n }))
    .filter(({ owner, n }) => {
      if (owner !== seat) return false
      const space = SPACES[n]
      if (space.kind !== 'street') return true
      return !SPACES.some((o, i) => o.kind === 'street' && o.group === space.group && s.houses[i] > 0)
    })
    .map(({ n }) => n)
}

const mine = computed(() => offerable(game.you))
const theirs = computed(() => offerable(partner.value))

const myCash = computed(() => game.mpYou?.cash ?? 0)
const theirCash = computed(
  () => game.mpPlayers.find((p) => p.id === partner.value)?.cash ?? 0,
)

/** Templates unwrap refs, so the side is named rather than handed over. */
function toggle(side: 'give' | 'want', n: number) {
  const list = side === 'give' ? give : want
  const at = list.value.indexOf(n)
  if (at === -1) list.value.push(n)
  else list.value.splice(at, 1)
}

const valid = computed(
  () =>
    partner.value !== null &&
    (give.value.length > 0 || want.value.length > 0 || giveCash.value > 0 || wantCash.value > 0) &&
    giveCash.value >= 0 &&
    wantCash.value >= 0 &&
    giveCash.value <= myCash.value &&
    wantCash.value <= theirCash.value,
)

function send() {
  if (!valid.value || partner.value === null) return
  game.mpOfferTrade(
    partner.value,
    { spaces: [...give.value], cash: giveCash.value },
    { spaces: [...want.value], cash: wantCash.value },
  )
  emit('close')
}
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <div class="dialog" role="dialog" aria-modal="true">
      <h2>{{ t('monopoly.trade.title') }}</h2>

      <label class="row">
        <span class="tiny muted">{{ t('monopoly.trade.with') }}</span>
        <select v-model.number="partner" class="select">
          <option v-for="id in partners" :key="id" :value="id">
            {{ game.mpPlayers.find((p) => p.id === id)?.name }}
          </option>
        </select>
      </label>

      <div class="sides">
        <section>
          <h3>{{ t('monopoly.trade.youGive') }}</h3>
          <ul class="picks">
            <li v-for="n in mine" :key="n">
              <label>
                <input type="checkbox" :checked="give.includes(n)" @change="toggle('give', n)" />
                <span>{{ SPACES[n].name }}</span>
              </label>
            </li>
          </ul>
          <label class="row">
            <span class="tiny muted">{{ t('monopoly.trade.cash') }}</span>
            <input v-model.number="giveCash" type="number" min="0" :max="myCash" class="num" />
          </label>
        </section>

        <section>
          <h3>{{ t('monopoly.trade.youWant') }}</h3>
          <ul class="picks">
            <li v-for="n in theirs" :key="n">
              <label>
                <input type="checkbox" :checked="want.includes(n)" @change="toggle('want', n)" />
                <span>{{ SPACES[n].name }}</span>
              </label>
            </li>
          </ul>
          <label class="row">
            <span class="tiny muted">{{ t('monopoly.trade.cash') }}</span>
            <input v-model.number="wantCash" type="number" min="0" :max="theirCash" class="num" />
          </label>
        </section>
      </div>

      <div class="actions">
        <button class="btn" :disabled="!valid" @click="send()">{{ t('monopoly.trade.send') }}</button>
        <button class="btn ghost" @click="emit('close')">{{ t('monopoly.trade.cancel') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(28, 22, 19, 0.5);
  z-index: 50;
}

.dialog {
  width: min(38rem, 100%);
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.1rem 1.25rem 1.25rem;
  border-radius: 12px;
  border: 1px solid var(--gold-line);
  background: var(--paper);
  box-shadow: var(--shadow-lg);
}

h2 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
}

h3 {
  margin: 0 0 0.35rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--ink-faint);
}

.row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.select,
.num {
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--gold-line);
  background: var(--paper);
  font: inherit;
}

.num {
  width: 7rem;
  font-variant-numeric: tabular-nums;
}

.sides {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.picks {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 12rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.picks label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.1rem;
}

/* The offer is built on a phone the same way it is built on a desktop — one
   column instead of two, and the whole of it inside the viewport. `dvh` and the
   insets because this is fixed, and so sits outside the safe area the app takes
   for every screen laid out in the ordinary flow. */
@media (max-width: 46rem) {
  .backdrop {
    align-items: flex-end;
    padding: max(0.5rem, env(safe-area-inset-top)) max(0.5rem, env(safe-area-inset-right))
      max(0.5rem, env(safe-area-inset-bottom)) max(0.5rem, env(safe-area-inset-left));
  }

  .dialog {
    width: 100%;
    max-height: 92dvh;
    padding: 0.9rem;
  }

  .sides {
    gap: 0.7rem;
    margin-top: 0.7rem;
  }

  /* Each list keeps its own scroll, so a player holding twenty companies cannot
     push the offer's own buttons off the bottom of the sheet. */
  .picks {
    max-height: 9rem;
  }

  /* Room for a fingertip on what is a row of checkboxes. */
  .picks label {
    padding: 0.25rem 0;
    font-size: 0.9rem;
  }

  .select,
  .num {
    min-height: 2.5rem;
  }

  .actions {
    margin-top: 0.9rem;
  }

  .actions .btn {
    flex: 1 1 auto;
    min-height: 2.75rem;
  }
}
</style>

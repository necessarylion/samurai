<script setup lang="ts">
import { computed } from 'vue'
import GameIcon from '../common/GameIcon.vue'
import CompanyLogo from './CompanyLogo.vue'
import {
  GO_SALARY,
  HOTEL,
  SPACES,
  STATION_RENT,
  UTILITY_MULTIPLIER,
  countKind,
  groupSpaces,
  mortgageValue,
  priceOf,
} from '@shared/monopoly'
import { money } from '@shared/money'
import { t } from '@/i18n'
import { useGameStore } from '@/stores/game'

/**
 * Everything about one space, for the hover card. The point of it is the rent
 * ladder: a player deciding whether to buy, expand or accept a trade is asking
 * "what does this charge, and what would it charge if I built?" — a question
 * the board could not answer at all before.
 *
 * The row the space is actually on is marked, so the current rent is read
 * rather than worked out.
 */
const props = defineProps<{ n: number; band?: string | null }>()

const game = useGameStore()
const state = computed(() => game.monopoly)
const space = computed(() => SPACES[props.n])

const owner = computed(() => state.value?.owners[props.n] ?? null)
const ownerName = computed(() =>
  owner.value === null ? null : (game.mpPlayers.find((p) => p.id === owner.value)?.name ?? null),
)
const mine = computed(() => owner.value !== null && owner.value === game.you)
const houses = computed(() => state.value?.houses[props.n] ?? 0)
const mortgaged = computed(() => state.value?.mortgaged[props.n] ?? false)

/** Whether the owner holds the whole sector — what doubles a bare rent. */
const wholeSet = computed(() => {
  const s = state.value
  const sp = space.value
  if (!s || owner.value === null || sp.kind !== 'street') return false
  return groupSpaces(sp.group).every((i) => s.owners[i] === owner.value)
})

interface Row {
  label: string
  value: string
  /** The rung this space is actually on right now. */
  on: boolean
}

/**
 * The whole ladder, so a player can see what expanding would be worth rather
 * than only what the space charges today.
 */
const rows = computed<Row[]>(() => {
  const s = state.value
  const sp = space.value
  if (!s) return []

  if (sp.kind === 'street') {
    const bare = houses.value === 0 && !wholeSet.value
    const doubled = houses.value === 0 && wholeSet.value
    return [
      { label: t('monopoly.detail.rentBare'), value: money(sp.rent[0]), on: bare },
      { label: t('monopoly.detail.rentSet'), value: money(sp.rent[0] * 2), on: doubled },
      ...[1, 2, 3, 4].map((n) => ({
        label: n === 1 ? t('monopoly.detail.rentOffice') : t('monopoly.detail.rentOffices', { n }),
        value: money(sp.rent[n]),
        on: houses.value === n,
      })),
      { label: t('monopoly.detail.rentHQ'), value: money(sp.rent[HOTEL]), on: houses.value === HOTEL },
    ]
  }

  if (sp.kind === 'station') {
    const held = owner.value === null ? 0 : countKind(s, owner.value, 'station')
    return [1, 2, 3, 4].map((n) => ({
      label: t('monopoly.detail.stations', { n }),
      value: money(STATION_RENT[n]),
      on: held === n,
    }))
  }

  if (sp.kind === 'utility') {
    const held = owner.value === null ? 0 : countKind(s, owner.value, 'utility')
    return [1, 2].map((n) => ({
      label: n === 1 ? t('monopoly.detail.utilityOne') : t('monopoly.detail.utilityBoth'),
      value: t('monopoly.detail.times', { n: UTILITY_MULTIPLIER[n] }),
      on: held === n,
    }))
  }

  return []
})

/** For the spaces that charge no rent, one line saying what they do instead. */
const blurb = computed(() => {
  const sp = space.value
  switch (sp.kind) {
    case 'go':
      return t('monopoly.detail.go', { amount: money(GO_SALARY) })
    case 'jail':
      return t('monopoly.detail.jail')
    case 'parking':
      return t('monopoly.detail.parking')
    case 'goToJail':
      return t('monopoly.detail.goToJail')
    case 'chance':
      return t('monopoly.detail.chance')
    case 'chest':
      return t('monopoly.detail.chest')
    case 'tax':
      return t('monopoly.detail.tax', { amount: money(sp.amount) })
    default:
      return null
  }
})

const sector = computed(() =>
  space.value.kind === 'street'
    ? t(`monopoly.sector.${space.value.group}` as 'monopoly.sector.brown')
    : null,
)
</script>

<template>
  <div class="detail" :style="{ '--band': band ?? 'var(--ink-faint)' }">
    <header class="detail-head">
      <CompanyLogo v-if="space.kind === 'street'" class="detail-logo" :name="space.name" />
      <GameIcon
        v-else-if="space.kind === 'station'"
        class="detail-glyph"
        name="monopoly.station"
        :size="20"
      />
      <GameIcon
        v-else-if="space.kind === 'utility'"
        class="detail-glyph"
        name="monopoly.utility"
        :size="20"
      />
      <div class="detail-title">
        <span class="detail-name">{{ space.name }}</span>
        <span v-if="sector" class="detail-sector">
          <i class="swatch"></i>{{ sector }}
        </span>
      </div>
      <span v-if="priceOf(n)" class="detail-price">{{ money(priceOf(n)) }}</span>
    </header>

    <p v-if="blurb" class="detail-blurb">{{ blurb }}</p>

    <p class="detail-owner">
      <template v-if="mortgaged">{{ t('monopoly.manage.mortgaged') }}</template>
      <template v-else-if="mine">{{ t('monopoly.detail.youOwn') }}</template>
      <template v-else-if="ownerName">{{ t('monopoly.space.owner', { name: ownerName }) }}</template>
      <template v-else-if="priceOf(n)">{{ t('monopoly.space.bank') }}</template>
    </p>

    <!-- The ladder. The rung it is on now is marked, so the rent a player would
         actually pay is read off rather than worked out. -->
    <dl v-if="rows.length" class="ladder" :class="{ dim: mortgaged }">
      <div v-for="row in rows" :key="row.label" class="rung" :class="{ on: row.on && !mortgaged }">
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
      </div>
    </dl>

    <p v-if="space.kind === 'street'" class="detail-foot">
      {{ t('monopoly.detail.officeCost', { amount: money(space.houseCost) }) }}
    </p>
    <p v-if="priceOf(n)" class="detail-foot">
      {{ t('monopoly.detail.mortgageValue', { amount: money(mortgageValue(n)) }) }}
    </p>
  </div>
</template>

<style scoped>
.detail {
  width: 15rem;
  padding: 0.6rem 0.7rem;
  border-radius: 10px;
  border: 1px solid var(--gold-line);
  border-top: 4px solid var(--band);
  background: var(--paper);
  box-shadow: var(--shadow-lg);
  text-align: left;
  font-size: 0.78rem;
  line-height: 1.35;
  color: var(--ink);
}

.detail-head {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.detail-logo,
.detail-glyph {
  width: 1.5rem;
  height: 1.5rem;
  flex: none;
  display: grid;
  place-items: center;
  color: var(--ink-soft);
}

.detail-title {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.detail-name {
  font-weight: 700;
  font-size: 0.9rem;
}

/* The colour band, finally named — the stripe on the board says only "these
   three go together", never which three or why. */
.detail-sector {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.68rem;
  color: var(--ink-faint);
}

.swatch {
  width: 7px;
  height: 7px;
  border-radius: 2px;
  background: var(--band);
  flex: none;
}

.detail-price {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  flex: none;
}

.detail-blurb {
  margin: 0.4rem 0 0;
  color: var(--ink-soft);
}

.detail-owner {
  margin: 0.3rem 0 0;
  font-size: 0.72rem;
  color: var(--ink-soft);
}

.ladder {
  margin: 0.45rem 0 0;
  border-top: 1px solid var(--gold-line);
}

.ladder.dim {
  opacity: 0.55;
}

.rung {
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.1rem 0.25rem;
  border-radius: 4px;
}

.rung dt {
  color: var(--ink-soft);
}

.rung dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}

/* Where the space stands right now. */
.rung.on {
  background: var(--band);
  color: #fffdf8;
  font-weight: 700;
}

.rung.on dt {
  color: #fffdf8;
}

.detail-foot {
  margin: 0.3rem 0 0;
  font-size: 0.7rem;
  color: var(--ink-faint);
}
</style>

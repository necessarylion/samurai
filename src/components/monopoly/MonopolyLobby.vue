<script setup lang="ts">
import { computed } from 'vue'
import LobbySplit from '../common/LobbySplit.vue'
import { GO_SALARY, JAIL_FINE } from '@shared/monopoly'
import { MIN_PLAYERS, maxPlayersFor } from '@shared/types'
import { t } from '@/i18n'
import { useGameStore } from '@/stores/game'

const maxSeats = maxPlayersFor('monopoly')
const game = useGameStore()

const seats = computed(() => game.mpPlayers)
const canStart = computed(() => game.isHost && seats.value.length >= MIN_PLAYERS)
</script>

<template>
  <LobbySplit
    kind="monopoly"
    :code="game.monopoly?.code ?? ''"
    :host-id="game.monopoly?.hostId"
    :seats="seats"
    :max-seats="maxSeats"
  >
    <h2>{{ t('monopoly.lobby.how') }}</h2>
    <ol class="rules">
      <li>{{ t('monopoly.rule.roll', { salary: GO_SALARY }) }}</li>
      <li>{{ t('monopoly.rule.buy') }}</li>
      <li>{{ t('monopoly.rule.rent') }}</li>
      <li>{{ t('monopoly.rule.build') }}</li>
      <li>{{ t('monopoly.rule.jail', { fine: JAIL_FINE }) }}</li>
      <li>{{ t('monopoly.rule.money') }}</li>
      <li>{{ t('monopoly.rule.win') }}</li>
    </ol>

    <button class="btn wide" :disabled="!canStart" @click="game.startGame()">
      {{ game.isHost ? t('lobby.start') : t('lobby.waitingHost') }}
    </button>
    <p v-if="game.isHost && seats.length < MIN_PLAYERS" class="tiny muted centre">
      {{ t('lobby.needTwo') }}
    </p>
  </LobbySplit>
</template>

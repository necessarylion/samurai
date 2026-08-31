<script setup lang="ts">
import { computed } from 'vue'
import { companyLogo } from '@/game/companies'

/**
 * One company's logo, drawn as a real element on the board space rather than a
 * background wash — a logo at half opacity behind text stops reading as the
 * logo. The markup comes from `companies.ts`, which is our own static table and
 * never anything a player typed, so `v-html` here carries no untrusted input.
 */
const props = defineProps<{ name: string }>()

const logo = computed(() => companyLogo(props.name))
</script>

<template>
  <svg
    v-if="logo"
    class="company-logo"
    viewBox="0 0 100 100"
    role="img"
    :aria-label="name"
    v-html="logo.svg"
  />
</template>

<style scoped>
.company-logo {
  display: block;
  width: 100%;
  height: 100%;
  /* The logos are drawn at their own proportions, so they are fitted rather
     than stretched — a squashed roundel is a different mark. */
  object-fit: contain;
}
</style>

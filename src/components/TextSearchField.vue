<script setup lang="ts">
import { t } from '@/i18n'

const query = defineModel<string>({ required: true })
</script>

<template>
    <label class="text-search-field">
        <span>{{ t('search') }}</span>
        <input v-model="query" type="search" :placeholder="t('searchDictionaryPlaceholder')" />
    </label>
</template>

<style scoped>
.text-search-field {
    display: grid;
    max-width: 32rem;
    gap: 0.4rem;
    color: var(--muted);
    font-weight: 600;

    input {
        width: 100%;
    }
}
</style>

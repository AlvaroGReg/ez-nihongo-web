<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import DictionaryLevelFilter from '@/components/dictionary/DictionaryLevelFilter.vue'
import VocabularyCard from '@/components/dictionary/VocabularyCard.vue'
import { t } from '@/i18n'
import { loadLocalCatalog, type CatalogEntry } from '@/services/vocabulary'
import type { JlptLevel } from '@/types/domain'

const selectedLevels = ref<JlptLevel[]>([5, 4, 3, 2, 1])
const catalog = ref<CatalogEntry[]>([])
const loadError = ref(false)

const visibleEntries = computed(() =>
    catalog.value
        .filter((entry) => selectedLevels.value.includes(entry.level))
        .sort((left, right) => right.level - left.level),
)

onMounted(async () => {
    try {
        catalog.value = await loadLocalCatalog()
    } catch {
        loadError.value = true
    }
})
</script>

<template>
    <div class="catalog-dictionary">
        <DictionaryLevelFilter v-model="selectedLevels" />
        <p v-if="loadError" class="load-error" role="alert">{{ t('providerCatalogError') }}</p>
        <p v-else-if="visibleEntries.length === 0" class="empty-state">
            {{ t('dictionaryNoEntries') }}
        </p>
        <ul v-else class="card-grid">
            <li v-for="entry in visibleEntries" :key="entry.contentId ?? `${entry.level}-${entry.word}-${entry.furigana}`">
                <VocabularyCard :entry="entry" />
            </li>
        </ul>
    </div>
</template>

<style scoped>
.catalog-dictionary {
    display: grid;
    gap: 1rem;

    .card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
        gap: 0.75rem;
        margin: 0;
        padding: 0;
        list-style: none;
    }
}

.load-error {
    margin: 0;
    color: var(--muted);
}

.empty-state {
    margin: 0;
    color: var(--muted);
}
</style>

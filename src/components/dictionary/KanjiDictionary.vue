<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import DictionaryLevelFilter from '@/components/dictionary/DictionaryLevelFilter.vue'
import KanjiCard from '@/components/dictionary/KanjiCard.vue'
import KanjiDetailsDialog from '@/components/dictionary/KanjiDetailsDialog.vue'
import { t } from '@/i18n'
import { loadKanjiCatalog, type KanjiRecord } from '@/services/kanji'
import type { JlptLevel } from '@/types/domain'

const levels: JlptLevel[] = [1, 2, 3, 4, 5]
const selectedLevels = ref<JlptLevel[]>([5, 4, 3, 2, 1])
const catalog = ref<KanjiRecord[]>([])
const selectedKanji = ref<KanjiRecord | null>(null)
const loadError = ref(false)

const visibleEntries = computed(() =>
    catalog.value
        .filter((entry) => selectedLevels.value.includes(entry.jlpt))
        .sort((left, right) => right.jlpt - left.jlpt),
)
const untranslatedLevels = computed(() =>
    selectedLevels.value
        .filter((level) => level <= 3)
        .sort((left, right) => right - left)
        .map((level) => `N${level}`),
)

onMounted(async () => {
    try {
        catalog.value = (await Promise.all(levels.map((level) => loadKanjiCatalog(level)))).flat()
    } catch {
        loadError.value = true
    }
})
</script>

<template>
    <div class="catalog-dictionary">
        <DictionaryLevelFilter v-model="selectedLevels" />
        <p
            class="translation-notice"
            :class="{ 'translation-notice-hidden': untranslatedLevels.length === 0 }"
            role="status"
            :aria-hidden="untranslatedLevels.length === 0"
        >
            <template v-if="untranslatedLevels.length > 0">
                {{ t('kanjiSpanishUnavailable', { levels: untranslatedLevels.join(', ') }) }}
            </template>
            <span v-else aria-hidden="true">&nbsp;</span>
        </p>
        <p v-if="loadError" class="load-error" role="alert">{{ t('providerCatalogError') }}</p>
        <p v-else-if="visibleEntries.length === 0" class="empty-state">
            {{ t('dictionaryNoEntries') }}
        </p>
        <ul v-else class="card-grid">
            <li v-for="entry in visibleEntries" :key="entry.id">
                <KanjiCard :entry="entry" @open="selectedKanji = $event" />
            </li>
        </ul>
        <KanjiDetailsDialog :entry="selectedKanji" @close="selectedKanji = null" />
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

.translation-notice {
    display: flex;
    min-height: 3rem;
    box-sizing: border-box;
    align-items: center;
    margin: 0;
    padding: 0.75rem 0.9rem;
    border-inline-start: 3px solid var(--selected-text);
    border-radius: 0.4rem;
    background: var(--selected-background);
    color: var(--text);
    font-size: 0.9rem;
}

.translation-notice-hidden {
    visibility: hidden;
}

@media (width <= 800px) {
    .translation-notice {
        min-height: 5rem;
    }
}

@media (width <= 480px) {
    .translation-notice {
        min-height: 6rem;
    }
}
</style>

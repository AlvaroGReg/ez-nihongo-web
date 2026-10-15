<script setup lang="ts">
import { ref } from 'vue'

import KanaDictionary from '@/components/dictionary/KanaDictionary.vue'
import { t } from '@/i18n'

type DictionaryTab = 'kana' | 'vocabulary' | 'kanji'

const activeTab = ref<DictionaryTab>('kana')

const tabs: Array<{ id: DictionaryTab; label: string }> = [
    { id: 'kana', label: 'dictionaryKana' },
    { id: 'vocabulary', label: 'dictionaryVocabulary' },
    { id: 'kanji', label: 'dictionaryKanji' },
]
</script>

<template>
    <main class="page-shell dictionary-page">
        <header class="dictionary-header">
            <p class="eyebrow">{{ t('dictionary') }}</p>
            <h1>{{ t('dictionary') }}</h1>
            <p class="dictionary-description">{{ t('dictionaryDescription') }}</p>
        </header>

        <div class="dictionary-tabs" role="tablist" :aria-label="t('dictionary')">
            <button
                v-for="tab in tabs"
                :key="tab.id"
                :id="`dictionary-tab-${tab.id}`"
                class="dictionary-tab"
                :class="{ 'dictionary-tab-active': activeTab === tab.id }"
                type="button"
                role="tab"
                :aria-selected="activeTab === tab.id"
                :aria-controls="`dictionary-panel-${tab.id}`"
                @click="activeTab = tab.id"
            >
                {{ t(tab.label) }}
            </button>
        </div>

        <section
            v-if="activeTab === 'kana'"
            id="dictionary-panel-kana"
            class="dictionary-panel"
            role="tabpanel"
            aria-labelledby="dictionary-tab-kana"
        >
            <p class="panel-description">{{ t('kanaDictionaryDescription') }}</p>
            <KanaDictionary />
        </section>
        <section
            v-else
            :id="`dictionary-panel-${activeTab}`"
            class="dictionary-panel coming-soon-panel"
            role="tabpanel"
            :aria-labelledby="`dictionary-tab-${activeTab}`"
        >
            <h2>{{ t(activeTab === 'vocabulary' ? 'dictionaryVocabulary' : 'dictionaryKanji') }}</h2>
            <p>{{ t('dictionaryComingSoon') }}</p>
        </section>
    </main>
</template>

<style scoped>
.dictionary-page {
    min-width: 0;
    padding-top: 2rem;
}

.dictionary-header {
    min-width: 0;
    margin-bottom: 1.5rem;
}

.dictionary-header h1 {
    margin-bottom: 0.6rem;
    font-size: clamp(2rem, 6vw, 3rem);
}

.dictionary-description,
.panel-description,
.coming-soon-panel p {
    color: var(--muted);
}

.dictionary-tabs {
    display: flex;
    min-width: 0;
    gap: 0.4rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border);
}

.dictionary-tab {
    flex: 0 0 auto;
    padding: 0.8rem 1.1rem;
    border: 0;
    border-bottom: 3px solid transparent;
    border-radius: 0.6rem 0.6rem 0 0;
    background: transparent;
    color: var(--muted);
    font-weight: 700;
}

.dictionary-tab:hover {
    background: var(--secondary-background);
    color: var(--text);
}

.dictionary-tab-active {
    border-bottom-color: #5167c7;
    color: var(--selected-text);
}

.dictionary-panel {
    min-width: 0;
    padding-top: 1.5rem;
}

.panel-description {
    margin-bottom: 1.5rem;
}

.coming-soon-panel {
    min-height: 12rem;
    padding: 2rem;
    border: 1px solid var(--border);
    border-radius: 1rem;
    background: var(--surface);
}

.coming-soon-panel h2 {
    margin-bottom: 0.6rem;
}

.coming-soon-panel p {
    margin-bottom: 0;
}
</style>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import VocabularyProgressTable from '@/components/progress/VocabularyProgressTable.vue'
import ExerciseProgressTable from '@/components/progress/ExerciseProgressTable.vue'
import { createVocabularyContentId } from '@/services/content'
import { t } from '@/i18n'
import { getVocabularyAttempts, type VocabularyAttempt } from '@/services/vocabularyProgress'
import { loadLocalCatalog, type CatalogEntry } from '@/services/vocabulary'
import { loadHistory } from '@/services/storage'
import { auth } from '@/stores/auth'
import type { AttemptEvent, ContentType } from '@/types/domain'

const attempts = ref<VocabularyAttempt[]>([])
const catalog = ref<CatalogEntry[]>([])
const isLoading = ref(true)
const loadError = ref(false)
const localHistory = ref(loadHistory())
type ProgressTab = 'kana' | 'vocabulary' | 'kanji'
const activeTab = ref<ProgressTab>('vocabulary')
const catalogById = computed(
    () =>
        new Map(
            catalog.value.map((entry) => [
                entry.contentId ?? createVocabularyContentId(entry.word, entry.furigana),
                entry,
            ]),
        ),
)
const rows = computed(() =>
    attempts.value.map((attempt) => ({
        attempt,
        entry: catalogById.value.get(attempt.contentId),
    })),
)
function localRows(contentType: Extract<ContentType, 'kana' | 'kanji'>) {
    return localHistory.value.flatMap((result) => {
        if (result.config.contentType !== contentType) return []
        return (result.attempts ?? []).map((attempt: AttemptEvent) => ({
            attempt,
            label:
                result.questions.find((question) => question.contentId === attempt.contentId)?.word ??
                attempt.contentId,
        }))
    })
}

onMounted(async () => {
    localHistory.value = loadHistory()
    if (!auth.state.accessToken) {
        isLoading.value = false
        return
    }

    try {
        const [loadedCatalog, firstPage] = await Promise.all([
            loadLocalCatalog(),
            getVocabularyAttempts(0, 200),
        ])
        catalog.value = loadedCatalog
        attempts.value = firstPage.attempts

        for (let offset = firstPage.attempts.length; offset < firstPage.total; offset += 200) {
            const page = await getVocabularyAttempts(offset, 200)
            attempts.value.push(...page.attempts)
        }
    } catch {
        loadError.value = true
    } finally {
        isLoading.value = false
    }
})
</script>

<template>
    <main class="page-shell progress-page">
        <section class="progress-card" aria-labelledby="progress-title">
            <h1 id="progress-title">{{ t('progressTitle') }}</h1>
            <p class="progress-description">{{ t('allProgressDescription') }}</p>

            <div class="progress-tabs" role="tablist" :aria-label="t('exerciseType')">
                <button
                    v-for="tab in (['kana', 'vocabulary', 'kanji'] as const)"
                    :id="`progress-tab-${tab}`"
                    :key="tab"
                    class="progress-tab"
                    :class="{ 'progress-tab-active': activeTab === tab }"
                    type="button"
                    role="tab"
                    :aria-selected="activeTab === tab"
                    :aria-controls="`progress-panel-${tab}`"
                    @click="activeTab = tab"
                >
                    {{ t(tab === 'vocabulary' ? 'vocabularyExercise' : `${tab}Exercise`) }}
                </button>
            </div>

            <section
                v-if="activeTab === 'vocabulary'"
                id="progress-panel-vocabulary"
                class="progress-panel"
                role="tabpanel"
                aria-labelledby="progress-tab-vocabulary"
            >
                <p v-if="!auth.state.accessToken" class="progress-message">
                    {{ t('loginOrRegister') }}
                    <RouterLink to="/auth">{{ t('login') }}</RouterLink>
                </p>
                <p v-else-if="isLoading" class="progress-message" role="status">
                    {{ t('loadingProgress') }}
                </p>
                <p v-else-if="loadError" class="progress-message" role="alert">
                    {{ t('progressLoadError') }}
                </p>
                <VocabularyProgressTable v-else :rows="rows" />
            </section>
            <section
                v-else-if="activeTab === 'kanji'"
                id="progress-panel-kanji"
                class="progress-panel"
                role="tabpanel"
                aria-labelledby="progress-tab-kanji"
            >
                <ExerciseProgressTable
                    :title="t('kanjiExercise')"
                    :empty-message="t('noKanjiProgress')"
                    :rows="localRows('kanji')"
                />
            </section>
            <section
                v-else
                id="progress-panel-kana"
                class="progress-panel"
                role="tabpanel"
                aria-labelledby="progress-tab-kana"
            >
                <ExerciseProgressTable
                    :title="t('kanaExercise')"
                    :empty-message="t('noKanaProgress')"
                    :rows="localRows('kana')"
                />
            </section>

            <RouterLink class="progress-home-link" to="/">{{ t('backHome') }}</RouterLink>
        </section>
    </main>
</template>

<style scoped>
.progress-page {
    display: grid;
    justify-items: center;
    padding-block: 2rem;
}

.progress-card {
    display: grid;
    align-content: start;
    gap: 1rem;
    width: 100%;
    max-width: 64rem;
    padding: clamp(1rem, 4vw, 2rem);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 1rem;
    box-shadow: 0 0.5rem 1.5rem rgb(24 32 42 / 8%);

    h1,
    p {
        margin: 0;
    }

    h1 {
        color: var(--text);
    }
}

.progress-description,
.progress-message {
    color: var(--muted);
}

.progress-tabs {
    display: flex;
    min-width: 0;
    gap: 0.4rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border);
}

.progress-tab {
    flex: 0 0 auto;
    padding: 0.8rem 1.1rem;
    border: 0;
    border-bottom: 3px solid transparent;
    border-radius: 0.6rem 0.6rem 0 0;
    background: transparent;
    color: var(--muted);
    font-weight: 700;
}

.progress-tab:hover {
    background: var(--secondary-background);
    color: var(--text);
}

.progress-tab-active {
    border-bottom-color: #5167c7;
    color: var(--selected-text);
}

.progress-panel {
    min-width: 0;
    padding-top: 0.5rem;
}

.progress-home-link {
    justify-self: start;
}
</style>

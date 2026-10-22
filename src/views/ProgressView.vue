<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import VocabularyProgressTable from '@/components/progress/VocabularyProgressTable.vue'
import { createVocabularyContentId } from '@/services/content'
import { t } from '@/i18n'
import { getVocabularyAttempts, type VocabularyAttempt } from '@/services/vocabularyProgress'
import { loadLocalCatalog, type CatalogEntry } from '@/services/vocabulary'
import { auth } from '@/stores/auth'

const attempts = ref<VocabularyAttempt[]>([])
const catalog = ref<CatalogEntry[]>([])
const isLoading = ref(true)
const loadError = ref(false)
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

onMounted(async () => {
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
            <p class="eyebrow">{{ t('vocabularyExercise') }}</p>
            <h1 id="progress-title">{{ t('vocabularyProgressTitle') }}</h1>
            <p class="progress-description">{{ t('vocabularyProgressDescription') }}</p>

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

.progress-home-link {
    justify-self: start;
}
</style>

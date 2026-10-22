<script setup lang="ts">
import { computed, ref } from 'vue'

import { t } from '@/i18n'
import type { VocabularyAttempt } from '@/services/vocabularyProgress'
import type { CatalogEntry } from '@/services/vocabulary'
import type { JlptLevel } from '@/types/domain'

export interface VocabularyProgressRow {
    attempt: VocabularyAttempt
    entry?: CatalogEntry
}

interface VocabularyWordProgress {
    contentId: string
    attempts: VocabularyAttempt[]
    entry?: CatalogEntry
}

const props = defineProps<{ rows: VocabularyProgressRow[] }>()
const selectedLevel = ref<'all' | JlptLevel>('all')
const wordProgress = computed(() => {
    const grouped = new Map<string, VocabularyWordProgress>()
    const orderedAttempts = [...props.rows].sort(
        (left, right) => Date.parse(right.attempt.createdAt) - Date.parse(left.attempt.createdAt),
    )

    for (const row of orderedAttempts) {
        let progress = grouped.get(row.attempt.contentId)
        if (!progress) {
            progress = { contentId: row.attempt.contentId, attempts: [], entry: row.entry }
            grouped.set(row.attempt.contentId, progress)
        }
        progress.attempts.push(row.attempt)
    }

    return [...grouped.values()]
})
const visibleRows = computed(() =>
    selectedLevel.value === 'all'
        ? wordProgress.value
        : wordProgress.value.filter((row) => row.entry?.level === selectedLevel.value),
)

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value))
}

function outcomeBars(progress: VocabularyWordProgress): Array<'correct' | 'incorrect' | 'empty'> {
    const recentAttempts = progress.attempts.slice(0, 5)
    const correctCount = recentAttempts.filter((attempt) => attempt.correct).length
    const incorrectCount = recentAttempts.length - correctCount
    const bars: Array<'correct' | 'incorrect' | 'empty'> = Array(5).fill('empty')

    for (let index = 0; index < correctCount; index += 1) bars[index] = 'correct'
    for (let index = 0; index < incorrectCount; index += 1) bars[4 - index] = 'incorrect'

    return bars
}

function outcomeLabel(progress: VocabularyWordProgress): string {
    const recentAttempts = progress.attempts.slice(0, 5).reverse()
    const results = recentAttempts.map((attempt) =>
        attempt.correct ? t('progressCorrect') : t('progressIncorrect'),
    )
    return `${t('progressResult')}: ${results.join(', ')}`
}
</script>

<template>
    <section class="progress-results" aria-label="Vocabulary results">
        <label class="progress-filter">
            {{ t('progressLevelFilter') }}
            <select v-model="selectedLevel">
                <option value="all">{{ t('allLevels') }}</option>
                <option v-for="level in [5, 4, 3, 2, 1]" :key="level" :value="level">
                    N{{ level }}
                </option>
            </select>
        </label>

        <p v-if="wordProgress.length === 0" class="progress-empty">{{ t('noProgress') }}</p>
        <p v-else-if="visibleRows.length === 0" class="progress-empty">
            {{ t('noFilteredProgress') }}
        </p>
        <div v-else class="progress-table-wrap">
            <table class="progress-table">
                <thead>
                    <tr>
                        <th scope="col">{{ t('progressWord') }}</th>
                        <th scope="col">{{ t('progressLevel') }}</th>
                        <th scope="col">{{ t('progressDate') }}</th>
                        <th scope="col">{{ t('progressResult') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in visibleRows" :key="row.contentId">
                        <td>{{ row.entry?.word ?? row.contentId }}</td>
                        <td>{{ row.entry ? `N${row.entry.level}` : '—' }}</td>
                        <td>
                            {{ formatDate(row.attempts[0]!.createdAt) }}
                        </td>
                        <td>
                            <span class="progress-outcomes" role="img" :aria-label="outcomeLabel(row)">
                                <span
                                    v-for="(outcome, index) in outcomeBars(row)"
                                    :key="index"
                                    class="progress-outcome-bar"
                                    :class="`is-${outcome}`"
                                />
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>

<style scoped>
.progress-results {
    display: grid;
    gap: 1rem;

    .progress-filter {
        display: grid;
        gap: 0.4rem;
        justify-self: start;
        color: var(--muted);
        font-weight: 600;
    }

    select {
        min-width: 12rem;
    }

    .progress-table-wrap {
        overflow-x: auto;
        border: 1px solid var(--border);
        border-radius: 0.75rem;
    }

    .progress-table {
        width: 100%;
        table-layout: fixed;
        border-collapse: collapse;
        text-align: left;

        th,
        td {
            padding: 0.85rem 1rem;
            border-bottom: 1px solid var(--border);
            white-space: nowrap;
        }

        th {
            background: var(--secondary-background);
            color: var(--muted);
            font-size: 0.85rem;
        }

        tbody tr:last-child td {
            border-bottom: 0;
        }
    }

    .progress-outcomes {
        display: inline-flex;
        gap: 0.2rem;
        vertical-align: middle;
    }

    .progress-outcome-bar {
        width: 1.5rem;
        height: 0.25rem;
        border-radius: 999px;
        background: var(--border);

        &.is-correct {
            background: var(--success-text);
        }

        &.is-incorrect {
            background: var(--error-text);
        }
    }
}

.progress-empty {
    margin: 0;
    color: var(--muted);
}
</style>

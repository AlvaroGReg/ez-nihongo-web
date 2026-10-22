<script setup lang="ts">
import { computed, ref } from 'vue'

import { locale, t } from '@/i18n'
import type { VocabularyAttempt } from '@/services/vocabularyProgress'
import type { CatalogEntry } from '@/services/vocabulary'
import type { JlptLevel } from '@/types/domain'

export interface VocabularyProgressRow {
    attempt: VocabularyAttempt
    entry?: CatalogEntry
}

const props = defineProps<{ rows: VocabularyProgressRow[] }>()
const selectedLevel = ref<'all' | JlptLevel>('all')
const visibleRows = computed(() =>
    selectedLevel.value === 'all'
        ? props.rows
        : props.rows.filter((row) => row.entry?.level === selectedLevel.value),
)

function formatDate(value: string): string {
    return new Intl.DateTimeFormat(locale.value, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value))
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

        <p v-if="rows.length === 0" class="progress-empty">{{ t('noProgress') }}</p>
        <p v-else-if="visibleRows.length === 0" class="progress-empty">
            {{ t('noFilteredProgress') }}
        </p>
        <div v-else class="progress-table-wrap">
            <table class="progress-table">
                <thead>
                    <tr>
                        <th scope="col">{{ t('progressDate') }}</th>
                        <th scope="col">{{ t('progressWord') }}</th>
                        <th scope="col">{{ t('progressLevel') }}</th>
                        <th scope="col">{{ t('progressResult') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in visibleRows" :key="row.attempt.eventId">
                        <td>{{ formatDate(row.attempt.createdAt) }}</td>
                        <td>{{ row.entry?.word ?? row.attempt.contentId }}</td>
                        <td>{{ row.entry ? `N${row.entry.level}` : '—' }}</td>
                        <td>
                            <span
                                class="progress-outcome"
                                :class="row.attempt.correct ? 'is-correct' : 'is-incorrect'"
                            >
                                {{ row.attempt.correct ? t('progressCorrect') : t('progressIncorrect') }}
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

    .progress-outcome {
        font-weight: 700;

        &.is-correct {
            color: var(--success-text);
        }

        &.is-incorrect {
            color: var(--error-text);
        }
    }
}

.progress-empty {
    margin: 0;
    color: var(--muted);
}
</style>

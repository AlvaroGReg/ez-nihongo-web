<script setup lang="ts">
import { computed } from 'vue'

import { t } from '@/i18n'
import type { AttemptEvent } from '@/types/domain'

interface ProgressRow {
    attempt: AttemptEvent
    label: string
}

interface GroupedProgress {
    id: string
    label: string
    attempts: AttemptEvent[]
}

const props = defineProps<{
    title: string
    emptyMessage: string
    rows: ProgressRow[]
}>()

const progress = computed(() => {
    const grouped = new Map<string, GroupedProgress>()
    const orderedRows = [...props.rows].sort(
        (left, right) => Date.parse(right.attempt.createdAt) - Date.parse(left.attempt.createdAt),
    )

    for (const row of orderedRows) {
        const id = `${row.attempt.contentId}:${row.attempt.exerciseId}`
        let group = grouped.get(id)
        if (!group) {
            group = { id, label: row.label, attempts: [] }
            grouped.set(id, group)
        }
        group.attempts.push(row.attempt)
    }

    return [...grouped.values()]
})

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value))
}

function outcomes(group: GroupedProgress): Array<'correct' | 'incorrect' | 'empty'> {
    const recent = group.attempts.slice(0, 5)
    const bars: Array<'correct' | 'incorrect' | 'empty'> = Array(5).fill('empty')
    let incorrectIndex = 4

    for (const [index, attempt] of recent.entries()) {
        if (attempt.correct) bars[index] = 'correct'
        else bars[incorrectIndex--] = 'incorrect'
    }

    return bars
}

function outcomeLabel(group: GroupedProgress): string {
    return `${t('progressResult')}: ${group.attempts
        .slice(0, 5)
        .reverse()
        .map((attempt) => (attempt.correct ? t('progressCorrect') : t('progressIncorrect')))
        .join(', ')}`
}
</script>

<template>
    <section class="exercise-progress" :aria-label="title">
        <h2>{{ title }}</h2>
        <p v-if="progress.length === 0" class="progress-empty">{{ emptyMessage }}</p>
        <div v-else class="progress-table-wrap">
            <table class="progress-table">
                <thead>
                    <tr>
                        <th scope="col">{{ t('progressWord') }}</th>
                        <th scope="col">{{ t('progressDate') }}</th>
                        <th scope="col">{{ t('progressResult') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="group in progress" :key="group.id">
                        <td>{{ group.label }}</td>
                        <td>{{ formatDate(group.attempts[0]!.createdAt) }}</td>
                        <td>
                            <span class="progress-outcomes" role="img" :aria-label="outcomeLabel(group)">
                                <span
                                    v-for="(outcome, index) in outcomes(group)"
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
.exercise-progress {
    display: grid;
    gap: 1rem;

    h2 {
        margin: 0;
        color: var(--text);
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

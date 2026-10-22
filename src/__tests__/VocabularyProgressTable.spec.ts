import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import VocabularyProgressTable from '@/components/progress/VocabularyProgressTable.vue'
import type { VocabularyAttempt } from '@/services/vocabularyProgress'

const attempts = [
    {
        attempt: {
            eventId: 'event-n5',
            sessionId: 'session-1',
            contentId: 'cat',
            exerciseType: 'reading',
            correct: true,
            createdAt: '2026-10-22T10:00:00Z',
        } satisfies VocabularyAttempt,
        entry: {
            contentId: 'cat',
            word: '猫',
            meaning: { en: 'cat', es: 'gato' },
            furigana: 'ねこ',
            romaji: 'neko',
            level: 5 as const,
        },
    },
    {
        attempt: {
            eventId: 'event-n4',
            sessionId: 'session-2',
            contentId: 'water',
            exerciseType: 'reading',
            correct: false,
            createdAt: '2026-10-21T10:00:00Z',
        } satisfies VocabularyAttempt,
        entry: {
            contentId: 'water',
            word: '水',
            meaning: { en: 'water', es: 'agua' },
            furigana: 'みず',
            romaji: 'mizu',
            level: 4 as const,
        },
    },
    ...[
        { eventId: 'event-cat-2', correct: false, createdAt: '2026-10-20T10:00:00Z' },
        { eventId: 'event-cat-3', correct: true, createdAt: '2026-10-19T10:00:00Z' },
        { eventId: 'event-cat-4', correct: true, createdAt: '2026-10-18T10:00:00Z' },
        { eventId: 'event-cat-5', correct: false, createdAt: '2026-10-17T10:00:00Z' },
        { eventId: 'event-cat-old', correct: false, createdAt: '2026-10-16T10:00:00Z' },
    ].map(({ eventId, correct, createdAt }) => ({
        attempt: {
            eventId,
            sessionId: 'session-cat',
            contentId: 'cat',
            exerciseType: 'reading',
            correct,
            createdAt,
        } satisfies VocabularyAttempt,
        entry: {
            contentId: 'cat',
            word: '猫',
            meaning: { en: 'cat', es: 'gato' },
            furigana: 'ねこ',
            romaji: 'neko',
            level: 5 as const,
        },
    })),
]

describe('VocabularyProgressTable', () => {
    it('groups attempts by word and shows the last five outcomes in the requested column order', async () => {
        const wrapper = mount(VocabularyProgressTable, { props: { rows: attempts } })

        const headers = wrapper.findAll('th').map((header) => header.text())
        expect(headers).toEqual(['Word', 'Level', 'Date', 'Result'])
        expect(wrapper.findAll('tbody tr')).toHaveLength(2)

        const catRow = wrapper.findAll('tbody tr').find((row) => row.text().includes('猫'))!
        expect(catRow.text()).toContain('22/10/2026')
        expect(catRow.text()).not.toContain('10:00')
        expect(catRow.get('[role="img"]').attributes('aria-label')).toBe(
            'Result: Incorrect, Correct, Correct, Incorrect, Correct',
        )
        expect(catRow.findAll('.progress-outcome-bar.is-correct')).toHaveLength(3)
        expect(catRow.findAll('.progress-outcome-bar.is-incorrect')).toHaveLength(2)
        expect(catRow.findAll('.progress-outcome-bar.is-empty')).toHaveLength(0)

        await wrapper.get('select').setValue('5')
        expect(wrapper.text()).toContain('猫')
        expect(wrapper.text()).not.toContain('水')
        expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    })

    it('shows an empty state when there are no results', () => {
        const wrapper = mount(VocabularyProgressTable, { props: { rows: [] } })

        expect(wrapper.text()).toContain('No vocabulary exercise results yet.')
        expect(wrapper.find('table').exists()).toBe(false)
    })
})

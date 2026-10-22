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
]

describe('VocabularyProgressTable', () => {
    it('renders vocabulary results and filters them by JLPT level', async () => {
        const wrapper = mount(VocabularyProgressTable, { props: { rows: attempts } })

        expect(wrapper.text()).toContain('猫')
        expect(wrapper.text()).toContain('水')
        expect(wrapper.text()).toContain('Correct')
        expect(wrapper.text()).toContain('Incorrect')

        await wrapper.get('select').setValue('5')
        expect(wrapper.text()).toContain('猫')
        expect(wrapper.text()).not.toContain('水')
    })

    it('shows an empty state when there are no results', () => {
        const wrapper = mount(VocabularyProgressTable, { props: { rows: [] } })

        expect(wrapper.text()).toContain('No vocabulary exercise results yet.')
        expect(wrapper.find('table').exists()).toBe(false)
    })
})

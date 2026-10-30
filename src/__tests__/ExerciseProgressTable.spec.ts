import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import ExerciseProgressTable from '@/components/progress/ExerciseProgressTable.vue'

describe('ExerciseProgressTable', () => {
    it('groups results by content and exercise type, showing the latest date and outcomes', () => {
        const wrapper = mount(ExerciseProgressTable, {
            props: {
                title: 'Kanji',
                emptyMessage: 'No results',
                rows: [
                    {
                        attempt: {
                            eventId: 'new',
                            sessionId: 'session-2',
                            contentId: 'kanji:猫',
                            exerciseId: 'kanji:猫:reading',
                            response: 'ねこ',
                            correct: false,
                            createdAt: '2026-10-22T10:00:00Z',
                        },
                        label: '猫',
                    },
                    {
                        attempt: {
                            eventId: 'old',
                            sessionId: 'session-1',
                            contentId: 'kanji:猫',
                            exerciseId: 'kanji:猫:reading',
                            response: 'ねこ',
                            correct: true,
                            createdAt: '2026-10-21T10:00:00Z',
                        },
                        label: '猫',
                    },
                    {
                        attempt: {
                            eventId: 'meaning',
                            sessionId: 'session-1',
                            contentId: 'kanji:猫',
                            exerciseId: 'kanji:猫:meaning',
                            response: 'cat',
                            correct: true,
                            createdAt: '2026-10-20T10:00:00Z',
                        },
                        label: '猫',
                    },
                ],
            },
        })

        expect(wrapper.findAll('tbody tr')).toHaveLength(2)
        expect(wrapper.findAll('tbody tr')[0]?.text()).toContain('22/10/2026')
        expect(wrapper.findAll('[role="img"]')[0]?.attributes('aria-label')).toBe(
            'Result: Correct, Incorrect',
        )
    })

    it('shows its exercise-specific empty message', () => {
        const wrapper = mount(ExerciseProgressTable, {
            props: { title: 'Kana', emptyMessage: 'No kana results', rows: [] },
        })

        expect(wrapper.text()).toContain('No kana results')
    })
})

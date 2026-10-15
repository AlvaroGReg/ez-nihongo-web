import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import { testSession } from '@/stores/testSession'
import type { TestSession } from '@/types/domain'
import TestView from '@/views/TestView.vue'
import router from '@/router'

const session: TestSession = {
    version: 2,
    config: { levels: [5], questionCount: 1 },
    questions: [{ word: '猫', meaning: 'cat', furigana: 'ねこ', romaji: 'neko', level: 5 }],
    currentIndex: 0,
    answers: [],
    pendingFeedback: null,
    levelsUsed: [5],
    createdAt: '2026-01-01T00:00:00.000Z',
}

describe('TestView', () => {
    beforeEach(async () => {
        await router.push('/')
        testSession.state.activeSession = structuredClone(session)
        testSession.state.result = null
        testSession.state.needsResume = false
    })

    it('displays a question, feedback and the expected answer flow', async () => {
        const wrapper = mount(TestView, {
            global: { plugins: [router] },
        })

        expect(wrapper.text()).toContain('猫')
        expect(wrapper.text()).toContain('ねこ')

        await wrapper.get('input').setValue('neko')
        await wrapper.get('form').trigger('submit')

        expect(wrapper.text()).toContain('Correct!')
        expect(wrapper.text()).toContain('Meaning:')
        expect(wrapper.text()).toContain('cat')
        expect(wrapper.text()).toContain('Continue')

        await wrapper.get('.feedback').trigger('keydown.enter')
        expect(testSession.state.activeSession).toBeNull()
        expect(testSession.state.result?.score).toBe(1)
    })

    it('shows the meaning hint during the question and accepts a multiple-choice answer', async () => {
        testSession.state.activeSession = {
            ...structuredClone(session),
            contentType: 'kanji',
            exerciseType: 'meaning',
            answerOptions: [['cat', 'dog', 'bird', 'fish']],
        }
        const wrapper = mount(TestView, {
            global: { plugins: [router] },
        })

        expect(wrapper.text()).not.toContain('ねこ')
        expect(wrapper.text()).not.toContain('Correct!')
        expect(wrapper.findAll('.kanji-answer-option')).toHaveLength(4)
        await wrapper.get('.kanji-reading-hint button').trigger('click')
        expect(wrapper.text()).toContain('Reading: ねこ')

        await wrapper
            .findAll('.kanji-answer-option')
            .find((option) => option.text() === 'cat')!
            .trigger('click')

        expect(wrapper.text()).toContain('Correct!')
        expect(wrapper.text()).toContain('Meaning:')
        expect(wrapper.text()).toContain('cat')
    })

    it('does not reveal the meaning-exercise reading after an answer unless requested as a hint', async () => {
        testSession.state.activeSession = {
            ...structuredClone(session),
            contentType: 'kanji',
            exerciseType: 'meaning',
            answerOptions: [['cat', 'dog', 'bird', 'fish']],
        }
        const wrapper = mount(TestView, {
            global: { plugins: [router] },
        })

        await wrapper
            .findAll('.kanji-answer-option')
            .find((option) => option.text() === 'cat')!
            .trigger('click')

        expect(wrapper.text()).toContain('Correct!')
        expect(wrapper.text()).not.toContain('ねこ')
    })
})

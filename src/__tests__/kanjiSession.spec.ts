import { beforeEach, describe, expect, it, vi } from 'vitest'

import catalog from '../../public/data/jlpt-vocabulary.json'
import { loadActiveSession } from '@/services/storage'
import { auth } from '@/stores/auth'
import { createTestSessionStore } from '@/stores/testSession'

describe('offline kanji sessions', () => {
    beforeEach(() => {
        const values = new Map<string, string>()
        Object.defineProperty(window, 'localStorage', {
            configurable: true,
            value: {
                clear: () => values.clear(),
                getItem: (key: string) => values.get(key) ?? null,
                removeItem: (key: string) => values.delete(key),
                setItem: (key: string, value: string) => values.set(key, value),
            },
        })
        window.localStorage.clear()
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
        vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(Response.json(catalog)))
        auth.signOut()
    })

    it('loads N5 questions offline and prioritizes a missed choice on the next question', async () => {
        const fetchMock = vi.mocked(fetch)
        const store = createTestSessionStore()
        const started = await store.startTest({
            levels: [5],
            questionCount: 2,
            contentType: 'kanji',
            exerciseType: 'reading',
        })

        expect(started).toBe(true)
        const session = store.state.activeSession!
        expect(session.questions.every((question) => question.level === 5)).toBe(true)
        expect(session.answerOptions?.[0]).toHaveLength(4)
        expect(session.questions[0]?.word).toMatch(/\p{Script=Han}/u)
        expect(loadActiveSession()?.answerOptions).toEqual(session.answerOptions)
        expect(fetchMock).toHaveBeenCalledOnce()
        expect(fetchMock.mock.calls[0]?.[0]).toContain('/data/jlpt-vocabulary.json')
        expect(fetchMock.mock.calls[0]?.[0]).not.toContain('/api/')

        const missedChoice = session.answerOptions![0]!.find(
            (option) => option !== session.questions[0]!.furigana,
        )!
        store.submitAnswer(missedChoice)
        store.continueTest()

        expect(session.answerOptions?.[1]).toContain(missedChoice)
        expect(store.submitAnswer(session.questions[1]!.furigana)).toBe(true)
        expect(session.pendingFeedback?.isCorrect).toBe(true)
    })

    it('checks a kanji meaning choice against the selected locale', async () => {
        const store = createTestSessionStore()
        expect(
            await store.startTest({
                levels: [5],
                questionCount: 1,
                contentType: 'kanji',
                exerciseType: 'meaning',
            }),
        ).toBe(true)

        const question = store.currentQuestion.value!
        expect(store.submitAnswer(question.meaning)).toBe(true)
        expect(store.state.activeSession?.pendingFeedback?.expected).toBe(question.meaning)
        expect(store.state.activeSession?.pendingFeedback?.isCorrect).toBe(true)
    })

    it('can load N4-only kanji questions', async () => {
        const store = createTestSessionStore()
        expect(
            await store.startTest({
                levels: [4],
                questionCount: 1,
                contentType: 'kanji',
                exerciseType: 'reading',
            }),
        ).toBe(true)
        expect(store.currentQuestion.value?.level).toBe(4)
    })
})

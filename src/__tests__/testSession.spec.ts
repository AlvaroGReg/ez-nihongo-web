import { beforeEach, describe, expect, it, vi } from 'vitest'

import catalog from '../../public/data/jlpt-vocabulary.json'
import { auth } from '@/stores/auth'
import {
    ACTIVE_SESSION_KEY,
    HISTORY_KEY,
    LEGACY_ACTIVE_SESSION_KEY,
    loadActiveSession,
} from '@/services/storage'
import { createTestSessionStore } from '@/stores/testSession'
import type { TestConfig, VocabularyWord } from '@/types/domain'

const questions: VocabularyWord[] = [
    { word: '猫', meaning: 'cat', furigana: 'ねこ', romaji: 'neko', level: 5 },
    { word: '犬', meaning: 'dog', furigana: 'いぬ', romaji: 'inu', level: 5 },
]
const config: TestConfig = { levels: [5], questionCount: 2 }

type LoadQuestions = (config: TestConfig) => Promise<{
    questions: VocabularyWord[]
    levelsUsed: TestConfig['levels']
}>

describe('test session store', () => {
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
        auth.signOut()
    })

    it('persists answers and resumes a saved session', async () => {
        const load = vi.fn<LoadQuestions>().mockResolvedValue({ questions, levelsUsed: [5] })
        const firstStore = createTestSessionStore({ loadQuestions: load })
        await firstStore.startTest(config)
        firstStore.submitAnswer('neko')

        const secondStore = createTestSessionStore(load)
        secondStore.restoreSession()

        expect(secondStore.state.activeSession?.answers[0]?.isCorrect).toBe(true)
        expect(secondStore.state.activeSession?.pendingFeedback).not.toBeNull()
        expect(secondStore.state.activeSession?.answers[0]?.contentId).toBe(
            'vocabulary:%E7%8C%AB:%E3%81%AD%E3%81%93',
        )
        expect(secondStore.state.activeSession?.attempts).toHaveLength(1)
        expect(secondStore.state.needsResume).toBe(true)
    })

    it('sends authenticated vocabulary attempts without blocking the answer flow', async () => {
        auth.saveSession({
            user: { id: 'learner-1', email: 'learner@example.com' },
            accessToken: 'access-token',
            tokenType: 'Bearer',
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
        })
        const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }))
        vi.stubGlobal('fetch', fetchMock)
        const store = createTestSessionStore(async () => ({ questions, levelsUsed: [5] }))
        await store.startTest(config)

        expect(store.submitAnswer('neko')).toBe(true)
        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
            contentId: expect.any(String),
            exerciseType: 'reading',
            correct: true,
        })
        expect(fetchMock.mock.calls[0]?.[1]?.body).not.toContain('neko')
    })

    it('does not send anonymous vocabulary or kana attempts to progress storage', async () => {
        const fetchMock = vi.fn<typeof fetch>()
        vi.stubGlobal('fetch', fetchMock)
        const load: LoadQuestions = async () => ({ questions, levelsUsed: [5] })
        const vocabularyStore = createTestSessionStore(load)
        await vocabularyStore.startTest(config)
        vocabularyStore.submitAnswer('neko')
        const kanaStore = createTestSessionStore(load)
        await kanaStore.startTest({
            levels: [5],
            questionCount: 1,
            contentType: 'kana',
            kanaDirection: 'hiragana-to-romaji',
        })
        kanaStore.submitAnswer(kanaStore.currentQuestion.value!.romaji)

        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('logs vocabulary progress failures without rejecting the answer', async () => {
        auth.saveSession({
            user: { id: 'learner-1', email: 'learner@example.com' },
            accessToken: 'access-token',
            tokenType: 'Bearer',
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
        })
        vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new Error('offline')))
        const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        const store = createTestSessionStore(async () => ({ questions, levelsUsed: [5] }))
        await store.startTest(config)

        expect(store.submitAnswer('neko')).toBe(true)
        await vi.waitFor(() => expect(log).toHaveBeenCalledWith('Unable to record vocabulary progress', expect.any(Error)))
    })

    it('starts a local kana session and checks the selected conversion', async () => {
        const load = vi.fn<LoadQuestions>().mockResolvedValue({ questions, levelsUsed: [5] })
        const store = createTestSessionStore(load)
        await store.startTest({
            levels: [5],
            questionCount: 1,
            contentType: 'kana',
            kanaScript: 'hiragana',
            kanaDirection: 'romaji-to-hiragana',
        })
        const question = store.currentQuestion.value!

        expect(load).not.toHaveBeenCalled()
        expect(store.submitAnswer(question.romaji)).toBe(true)
        expect(store.state.activeSession?.pendingFeedback?.isCorrect).toBe(true)
    })

    it('starts a vocabulary session from the local catalog without calling the API', async () => {
        const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json(catalog))
        vi.stubGlobal('fetch', fetchMock)
        const store = createTestSessionStore()

        expect(await store.startTest(config)).toBe(true)
        expect(store.state.activeSession?.questions).toHaveLength(2)
        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(fetchMock.mock.calls[0]?.[0]).toContain('/data/jlpt-vocabulary.json')
        expect(fetchMock.mock.calls[0]?.[0]).not.toContain('/api/')
    })

    it('abandons without creating a partial history entry', async () => {
        const store = createTestSessionStore(
            vi.fn<LoadQuestions>().mockResolvedValue({ questions, levelsUsed: [5] }),
        )
        await store.startTest(config)
        store.abandonSession()

        expect(window.localStorage.getItem(ACTIVE_SESSION_KEY)).toBeNull()
        expect(window.localStorage.getItem(HISTORY_KEY)).toBeNull()
    })

    it('creates a result and history entry after the final confirmation', async () => {
        const store = createTestSessionStore(
            vi.fn<LoadQuestions>().mockResolvedValue({ questions, levelsUsed: [5] }),
        )
        await store.startTest(config)
        store.submitAnswer('neko')
        expect(store.continueTest()).toBe(false)
        store.submitAnswer('wrong')
        expect(store.continueTest()).toBe(true)

        expect(store.state.activeSession).toBeNull()
        expect(store.state.result?.score).toBe(1)
        expect(JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? '[]')).toHaveLength(1)
    })

    it('removes a legacy session instead of migrating it', () => {
        const legacySession = {
            version: 1,
            config: { level: 5, questionCount: 1 },
            questions: [questions[0]],
            currentIndex: 0,
            answers: [],
            pendingFeedback: null,
            levelsUsed: [5],
            createdAt: '2026-01-01T00:00:00.000Z',
        }
        window.localStorage.setItem(LEGACY_ACTIVE_SESSION_KEY, JSON.stringify(legacySession))

        const discarded = loadActiveSession()

        expect(discarded).toBeNull()
        expect(window.localStorage.getItem(LEGACY_ACTIVE_SESSION_KEY)).toBeNull()
        expect(window.localStorage.getItem(ACTIVE_SESSION_KEY)).toBeNull()
    })

    it('removes corrupt and unknown current-format sessions', () => {
        window.localStorage.setItem(ACTIVE_SESSION_KEY, '{not-json')
        expect(loadActiveSession()).toBeNull()
        expect(window.localStorage.getItem(ACTIVE_SESSION_KEY)).toBeNull()

        window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify({ version: 2 }))
        expect(loadActiveSession()).toBeNull()
        expect(window.localStorage.getItem(ACTIVE_SESSION_KEY)).toBeNull()
    })
})

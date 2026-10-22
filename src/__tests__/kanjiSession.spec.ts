import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setLocale } from '@/i18n'
import { loadActiveSession } from '@/services/storage'
import { auth } from '@/stores/auth'
import { createTestSessionStore } from '@/stores/testSession'

const sampleKanji = [
    { character: '犬', reading: 'いぬ', onReading: 'ク', meaning: 'dog', meaningEs: 'perro' },
    { character: '猫', reading: 'ねこ', onReading: 'ビョウ', meaning: 'cat', meaningEs: 'gato' },
    { character: '鳥', reading: 'とり', onReading: 'チョウ', meaning: 'bird', meaningEs: 'pájaro' },
    { character: '魚', reading: 'さかな', onReading: 'ギョ', meaning: 'fish', meaningEs: 'pez' },
    { character: '馬', reading: 'うま', onReading: 'バ', meaning: 'horse', meaningEs: 'caballo' },
    { character: '牛', reading: 'うし', onReading: 'ギュウ', meaning: 'cow', meaningEs: 'vaca' },
]

function kanjiCatalog(level: number) {
    return {
        kanjis: Object.fromEntries(
            sampleKanji.map((item, index) => [
                item.character,
                {
                    grade: 1,
                    heisig_en: item.meaning,
                    jlpt: level,
                    kanji: item.character,
                    kun_readings: [item.reading],
                    meanings_en: [item.meaning],
                    meanings_es: [item.meaningEs],
                    name_readings: [],
                    on_readings: [item.onReading],
                    unicode: item.character.codePointAt(0)!.toString(16).toUpperCase(),
                    id: `n${level}-${index + 1}`,
                },
            ]),
        ),
    }
}

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
        auth.signOut()
        vi.stubGlobal(
            'fetch',
            vi.fn<typeof fetch>().mockImplementation(async (input) => {
                const level = Number(String(input).match(/n([1-5])\.json$/)?.[1] ?? 5)
                return Response.json(kanjiCatalog(level))
            }),
        )
        setLocale('en')
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
        expect(fetchMock.mock.calls[0]?.[0]).toContain('/data/jlpt-kanji/n5.json')
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
        setLocale('es')
        const store = createTestSessionStore()
        expect(
            await store.startTest({
                levels: [4],
                questionCount: 1,
                contentType: 'kanji',
                exerciseType: 'meaning',
            }),
        ).toBe(true)
        expect(store.currentQuestion.value?.level).toBe(4)
        expect(sampleKanji.map((item) => item.meaningEs)).toContain(
            store.currentQuestion.value?.meaning,
        )
        setLocale('en')
    })

    it('can load N1 and N2 kanji data files', async () => {
        const store = createTestSessionStore()
        for (const level of [1, 2] as const) {
            expect(
                await store.startTest({
                    levels: [level],
                    questionCount: 1,
                    contentType: 'kanji',
                    exerciseType: 'reading',
                }),
            ).toBe(true)
            expect(store.currentQuestion.value?.level).toBe(level)
            store.abandonSession()
        }
    })

    it('uses English meanings for N3 kanji even when the source has an English fallback', async () => {
        setLocale('es')
        const store = createTestSessionStore()
        expect(
            await store.startTest({
                levels: [3],
                questionCount: 1,
                contentType: 'kanji',
                exerciseType: 'meaning',
            }),
        ).toBe(true)

        expect(sampleKanji.map((item) => item.meaning)).toContain(
            store.currentQuestion.value?.meaning,
        )
        setLocale('en')
    })
})

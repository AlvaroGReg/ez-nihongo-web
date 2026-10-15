import { beforeEach, describe, expect, it, vi } from 'vitest'

import catalog from '../../public/data/jlpt-vocabulary.json'
import { auth } from '@/stores/auth'
import {
    getFallbackLevelsForTest,
    loadQuestions,
    VocabularyContentError,
} from '@/services/vocabulary'

describe('local vocabulary provider', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
        auth.signOut()
    })

    it('loads selected-level questions from the web-hosted catalog without calling the API', async () => {
        const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json(catalog))
        vi.stubGlobal('fetch', fetchMock)

        const result = await loadQuestions({ levels: [3], questionCount: 4 })

        expect(result.questions).toHaveLength(4)
        expect(result.questions.every((word) => word.level === 3)).toBe(true)
        expect(result.questions.every((word) => word.meaning.length > 0)).toBe(true)
        expect(result.questions.every((word) => word.contentId?.startsWith('vocabulary:'))).toBe(
            true,
        )
        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(fetchMock.mock.calls[0]?.[0]).toContain('/data/jlpt-vocabulary.json')
        expect(fetchMock.mock.calls[0]?.[0]).not.toContain('/api/')
    })

    it('uses the requested locale for meanings', async () => {
        const result = await loadQuestions({ levels: [5], questionCount: 1 }, 'es')

        expect(result.questions[0]?.meaning).toBeTruthy()
        expect(result.questions[0]?.meaning).not.toBe(result.questions[0]?.word)
    })

    it('fills shortages from adjacent levels in the established order', async () => {
        const result = await loadQuestions({ levels: [4], questionCount: 640 })

        expect(result.questions).toHaveLength(640)
        expect(result.levelsUsed).toEqual([4, 5])
    })

    it('combines selected levels and reports the fallback order', async () => {
        const result = await loadQuestions({ levels: [5, 3], questionCount: 4 })

        expect(result.questions).toHaveLength(4)
        expect(result.questions.map((word) => word.level).sort()).toEqual([3, 3, 5, 5])
        expect(result.levelsUsed).toEqual([5, 3])
        expect(getFallbackLevelsForTest(3)).toEqual([3, 4, 2, 5, 1])
    })

    it('rejects configurations without levels', async () => {
        await expect(loadQuestions({ levels: [], questionCount: 10 })).rejects.toBeInstanceOf(
            VocabularyContentError,
        )
    })

    it('loads authenticated questions from the platform with its stable content ids', async () => {
        auth.saveSession({
            user: { id: 'learner-1', email: 'learner@example.com' },
            accessToken: 'access-token',
            tokenType: 'Bearer',
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
        })
        const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
            const url = new URL(String(input))
            const level = Number(url.searchParams.get('level'))
            expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer access-token')
            return Response.json({
                total: 1,
                offset: 0,
                limit: 200,
                words: [
                    {
                        contentId: `platform-word-${level}`,
                        word: `語${level}`,
                        meaning: `meaning ${level}`,
                        furigana: `ご${level}`,
                        romaji: `go${level}`,
                        level,
                    },
                ],
            })
        })
        vi.stubGlobal('fetch', fetchMock)

        const result = await loadQuestions({ levels: [5], questionCount: 1 })

        expect(result.questions[0]?.contentId).toBe('platform-word-5')
        expect(result.questions[0]?.level).toBe(5)
        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(fetchMock.mock.calls.every(([input]) => String(input).includes('/api/v1/vocabulary'))).toBe(
            true,
        )
    })

    it('does not fall back to the local catalog when the authenticated API fails', async () => {
        auth.saveSession({
            user: { id: 'learner-1', email: 'learner@example.com' },
            accessToken: 'access-token',
            tokenType: 'Bearer',
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
        })
        const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 503 }))
        vi.stubGlobal('fetch', fetchMock)

        await expect(loadQuestions({ levels: [5], questionCount: 1 })).rejects.toBeInstanceOf(
            VocabularyContentError,
        )
        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/api/v1/vocabulary')
    })
})

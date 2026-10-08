import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getFallbackLevelsForTest, loadQuestions, VocabularyApiError } from '@/services/api'

interface TestWord {
    word: string
    meaning: string
    furigana: string
    romaji: string
}

function createPage(level: number, words: TestWord[], offset: number, limit: number) {
    const selected = words.slice(offset, offset + limit)
    return {
        total: words.length,
        offset,
        limit,
        words: selected.map((word) => ({ ...word, level })),
    }
}

function mockApi(wordsByLevel: Partial<Record<number, TestWord[]>>) {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
        const url = new URL(input.toString())
        const level = Number(url.searchParams.get('level'))
        const offset = Number(url.searchParams.get('offset'))
        const limit = Number(url.searchParams.get('limit'))
        return Response.json(createPage(level, wordsByLevel[level] ?? [], offset, limit))
    })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
}

describe('vocabulary API provider', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    it('requests selected-level pages and removes duplicate vocabulary', async () => {
        const fetchMock = mockApi({
            3: [
                { word: '学生', meaning: 'student', furigana: 'がくせい', romaji: 'gakusei' },
                { word: '学生', meaning: 'student', furigana: 'がくせい', romaji: 'gakusei' },
                { word: '先生', meaning: 'teacher', furigana: 'せんせい', romaji: 'sensei' },
            ],
        })

        const result = await loadQuestions({ levels: [3], questionCount: 2 })

        expect(result.questions).toHaveLength(2)
        expect(result.questions[0]?.contentId).toMatch(/^vocabulary:/)
        expect(new Set(result.questions.map((word) => `${word.word}-${word.furigana}`)).size).toBe(2)
        expect(fetchMock.mock.calls[0]?.[0].toString()).toContain('/api/v1/vocabulary?level=3')
    })

    it('falls back to adjacent levels when the selected level is insufficient', async () => {
        const fetchMock = mockApi({
            2: [{ word: 'C', meaning: 'C', furigana: 'し', romaji: 'shi' }],
            3: [{ word: 'A', meaning: 'A', furigana: 'あ', romaji: 'a' }],
            4: [{ word: 'B', meaning: 'B', furigana: 'び', romaji: 'bi' }],
        })

        const result = await loadQuestions({ levels: [3], questionCount: 3 })

        expect(result.questions).toHaveLength(3)
        expect(result.levelsUsed).toEqual([3, 4, 2])
        expect(fetchMock.mock.calls.map(([input]) => new URL(input.toString()).searchParams.get('level')))
            .toEqual(['3', '4', '2'])
    })

    it('combines questions from each selected level', async () => {
        const fetchMock = mockApi({
            3: [
                { word: 'C', meaning: 'C', furigana: 'し', romaji: 'shi' },
                { word: 'D', meaning: 'D', furigana: 'で', romaji: 'de' },
            ],
            5: [
                { word: 'A', meaning: 'A', furigana: 'あ', romaji: 'a' },
                { word: 'B', meaning: 'B', furigana: 'び', romaji: 'bi' },
            ],
        })

        const result = await loadQuestions({ levels: [5, 3], questionCount: 4 })

        expect(result.questions).toHaveLength(4)
        expect(result.questions.map((word) => word.level).sort()).toEqual([3, 3, 5, 5])
        expect(result.levelsUsed).toEqual([5, 3])
        expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('reports an error when the API has insufficient vocabulary', async () => {
        mockApi({ 1: [] })

        await expect(loadQuestions({ levels: [1], questionCount: 10 })).rejects.toBeInstanceOf(
            VocabularyApiError,
        )
    })

    it('exposes the documented fallback order', () => {
        expect(getFallbackLevelsForTest(3)).toEqual([3, 4, 2, 5, 1])
    })
})

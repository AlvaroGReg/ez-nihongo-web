import { describe, expect, it, vi } from 'vitest'

import { getFallbackLevelsForTest, loadQuestions, VocabularyApiError } from '@/services/api'

describe('local vocabulary provider', () => {
    it('loads unique vocabulary from selected JLPT levels without making network requests', async () => {
        const fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)

        const result = await loadQuestions({ levels: [3], questionCount: 20 })

        expect(result.questions).toHaveLength(20)
        expect(result.questions.every((word) => word.level === 3 && word.meaning)).toBe(true)
        expect(result.questions[0]?.contentId).toMatch(/^vocabulary:/)
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('combines questions from every selected level', async () => {
        const result = await loadQuestions({ levels: [5, 3], questionCount: 20 })

        expect(result.questions).toHaveLength(20)
        expect(result.questions.every((word) => [3, 5].includes(word.level))).toBe(true)
        expect(result.levelsUsed).toEqual([5, 3])
    })

    it('falls back to adjacent levels when the selected level lacks enough entries', async () => {
        const result = await loadQuestions({ levels: [5], questionCount: 700 })

        expect(result.questions).toHaveLength(700)
        expect(result.levelsUsed).toEqual([5, 4])
    })

    it('reports an error when all local levels are insufficient', async () => {
        await expect(loadQuestions({ levels: [1], questionCount: 9000 })).rejects.toBeInstanceOf(
            VocabularyApiError,
        )
    })

    it('exposes the documented fallback order', () => {
        expect(getFallbackLevelsForTest(3)).toEqual([3, 4, 2, 5, 1])
    })
})

import { describe, expect, it } from 'vitest'

import { createKanaQuestions, kanaEntries, selectKanaEntries } from '@/services/kana'

describe('kana exercises', () => {
    it('creates every supported conversion direction', () => {
        const entry = kanaEntries.find(({ hiragana }) => hiragana === 'あ')!
        const cases = [
            ['hiragana-to-romaji', 'あ', 'a'],
            ['katakana-to-romaji', 'ア', 'a'],
            ['romaji-to-hiragana', 'a', 'あ'],
            ['romaji-to-katakana', 'a', 'ア'],
            ['hiragana-to-katakana', 'あ', 'ア'],
            ['katakana-to-hiragana', 'ア', 'あ'],
        ] as const

        expect(entry).toMatchObject({ hiragana: 'あ', katakana: 'ア', romaji: 'a' })
        for (const [direction, prompt, expected] of cases) {
            const question = createKanaQuestions(direction, 1, true).find(
                ({ contentId }) => contentId === 'kana:あ',
            )
            expect(question).toMatchObject({
                word: prompt,
                romaji: expected,
            })
        }
    })

    it('includes each kana exactly once in a complete exam', () => {
        const questions = createKanaQuestions('hiragana-to-romaji', 10, true)

        expect(questions).toHaveLength(kanaEntries.length)
        expect(new Set(questions.map(({ contentId }) => contentId)).size).toBe(kanaEntries.length)
    })

    it('combines hiragana and katakana in the same kana exercise', () => {
        const questions = createKanaQuestions(
            'hiragana-to-romaji',
            10,
            true,
            { rows: [], types: [] },
            ['hiragana', 'katakana'],
        )
        const aQuestions = questions.filter(({ contentId }) => contentId === 'kana:あ')

        expect(questions).toHaveLength(kanaEntries.length * 2)
        expect(aQuestions.map(({ word, romaji }) => [word, romaji])).toEqual(
            expect.arrayContaining([
                ['あ', 'a'],
                ['ア', 'a'],
            ]),
        )
    })

    it('filters by row and type, combining both selections', () => {
        expect(selectKanaEntries({ rows: ['ka'], types: [] })).toHaveLength(5)
        expect(selectKanaEntries({ rows: [], types: ['dakuon'] })).toHaveLength(25)
        expect(selectKanaEntries({ rows: ['ka'], types: ['yoon'] })).toHaveLength(38)
        expect(selectKanaEntries({ rows: [], types: [] })).toHaveLength(kanaEntries.length)

        const fullExam = createKanaQuestions('hiragana-to-romaji', 10, true, {
            rows: ['ka'],
            types: [],
        })
        expect(fullExam).toHaveLength(5)
    })
})

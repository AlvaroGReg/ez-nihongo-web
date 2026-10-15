import { describe, expect, it } from 'vitest'

import { createKanjiAnswerOptions } from '@/services/kanji'
import type { VocabularyWord } from '@/types/domain'

const entries: VocabularyWord[] = [
    { word: '猫', meaning: 'cat', furigana: 'ねこ', romaji: 'neko', level: 5 },
    { word: '犬', meaning: 'dog', furigana: 'いぬ', romaji: 'inu', level: 5 },
    { word: '鳥', meaning: 'bird', furigana: 'とり', romaji: 'tori', level: 5 },
    { word: '魚', meaning: 'fish', furigana: 'さかな', romaji: 'sakana', level: 5 },
    { word: '牛', meaning: 'cow', furigana: 'うし', romaji: 'ushi', level: 5 },
]

describe('kanji answer options', () => {
    it('creates four distinct reading choices with exactly one correct answer', () => {
        const options = createKanjiAnswerOptions(entries[0]!, entries, 'reading')

        expect(options).toHaveLength(4)
        expect(new Set(options).size).toBe(4)
        expect(options.filter((option) => option === 'ねこ')).toHaveLength(1)
    })

    it('creates meaning choices and prioritizes an answer missed earlier in the session', () => {
        const options = createKanjiAnswerOptions(entries[0]!, entries, 'meaning', ['dog'])

        expect(options).toHaveLength(4)
        expect(new Set(options).size).toBe(4)
        expect(options).toContain('cat')
        expect(options).toContain('dog')
    })

    it('does not use duplicate readings or the correct answer as distractors', () => {
        const pool = [
            ...entries,
            { ...entries[1]!, word: '犬たち', meaning: 'dogs', furigana: 'ねこ' },
            { ...entries[2]!, meaning: 'cat' },
        ]
        const options = createKanjiAnswerOptions(entries[0]!, pool, 'meaning')

        expect(options).toHaveLength(4)
        expect(new Set(options).size).toBe(4)
        expect(options.filter((option) => option === 'cat')).toHaveLength(1)
    })
})

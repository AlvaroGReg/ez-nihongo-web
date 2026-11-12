import { describe, expect, it } from 'vitest'

import { includesSearchText, normalizeSearchText, splitSearchMatches } from '@/utils/textSearch'

describe('text search normalization', () => {
    it('matches case-insensitively and ignores separators between reading variants', () => {
        expect(includesSearchText(['ひと-、ひと.つ'], 'ひと-、ひと.つ')).toBe(true)
        expect(includesSearchText(['イチ、イツ'], 'イチ、イツ')).toBe(true)
        expect(includesSearchText(['maiasa'], 'MAIA')).toBe(true)
    })

    it('normalizes Unicode and punctuation without changing Japanese glyphs', () => {
        expect(normalizeSearchText('cada mañana')).toBe('cadamañana')
        expect(includesSearchText(['uno, radical uno (n.º 1)'], 'radical uno')).toBe(true)
        expect(includesSearchText(['毎朝'], '毎')).toBe(true)
    })

    it('matches Latin text without requiring accent marks while preserving Japanese dakuten', () => {
        expect(includesSearchText(['río'], 'rio')).toBe(true)
        expect(includesSearchText(['canción'], 'cancion')).toBe(true)
        expect(includesSearchText(['がっこう'], 'かっこう')).toBe(false)
    })

    it('returns original-text segments for accent-insensitive matches', () => {
        expect(splitSearchMatches('río, río', 'rio')).toEqual([
            { text: 'río', matched: true },
            { text: ', ', matched: false },
            { text: 'río', matched: true },
        ])
    })
})

import { describe, expect, it } from 'vitest'

import { includesSearchText, normalizeSearchText } from '@/utils/textSearch'

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
})

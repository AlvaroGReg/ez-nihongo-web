import { describe, expect, it } from 'vitest'

import { kanaToRomaji, kanaToRomajiSearchForms } from '@/services/kanaRomaji'

describe('kana to romaji search index', () => {
    it('romanizes hiragana and katakana readings', () => {
        expect(kanaToRomaji('かわ')).toBe('kawa')
        expect(kanaToRomaji('セン')).toBe('sen')
    })

    it('handles contracted syllables, doubled consonants, and long-vowel marks', () => {
        expect(kanaToRomaji('きょう')).toBe('kyou')
        expect(kanaToRomaji('がっこう')).toBe('gakkou')
        expect(kanaToRomaji('スーパー')).toBe('suupaa')
        expect(kanaToRomajiSearchForms('とうきょう')).toEqual(['toukyou', 'tōkyō'])
    })
})

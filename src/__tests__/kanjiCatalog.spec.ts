import { describe, expect, it, vi } from 'vitest'

import n1 from '../../public/data/jlpt-kanji/n1.json'
import n2 from '../../public/data/jlpt-kanji/n2.json'
import n3 from '../../public/data/jlpt-kanji/n3.json'
import n4 from '../../public/data/jlpt-kanji/n4.json'
import n5 from '../../public/data/jlpt-kanji/n5.json'
import { createKanjiAnswerOptions, loadKanjiQuestions, type KanjiRecord } from '@/services/kanji'
import type { JlptLevel, TestConfig } from '@/types/domain'

const catalogs = { 1: n1, 2: n2, 3: n3, 4: n4, 5: n5 } as Record<
    JlptLevel,
    { kanjis: Record<string, KanjiRecord> }
>

describe('JLPT kanji files', () => {
    it('loads actual N1-N5 files and generates unambiguous four-choice questions', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn<typeof fetch>().mockImplementation(async (input) => {
                const level = Number(String(input).match(/n([1-5])\.json$/)?.[1]) as JlptLevel
                return Response.json(catalogs[level])
            }),
        )
        const fetchMock = vi.mocked(fetch)

        for (const level of [1, 2, 3, 4, 5] as const) {
            const config: TestConfig = {
                levels: [level],
                questionCount: 5,
                contentType: 'kanji',
            }
            const { questions, levelsUsed, distractorPool } = await loadKanjiQuestions(config, 'en')
            const question = questions[0]!
            const options = createKanjiAnswerOptions(question, distractorPool, 'reading')

            expect(levelsUsed).toEqual([level])
            expect(questions).toHaveLength(5)
            expect(options).toHaveLength(4)
            expect(new Set(options).size).toBe(4)
            expect(options).toContain(question.furigana)
        }
        expect(fetchMock.mock.calls.every(([url]) => !String(url).includes('extra.json'))).toBe(
            true,
        )
    })

    it('uses only English source meanings for N1-N3 in Spanish locale', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn<typeof fetch>().mockImplementation(async (input) => {
                const level = Number(String(input).match(/n([1-5])\.json$/)?.[1]) as JlptLevel
                return Response.json(catalogs[level])
            }),
        )

        for (const level of [1, 2, 3] as const) {
            const { questions } = await loadKanjiQuestions(
                { levels: [level], questionCount: 10, contentType: 'kanji' },
                'es',
            )
            for (const question of questions) {
                const source = catalogs[level].kanjis[question.word]!
                expect(source.meanings_en).toContain(question.meaning)
            }
        }
    })
})
